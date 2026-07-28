"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import { isCarImageType, type CarImageType } from "@/lib/admin/car-image-types";
import {
  buildCarImageStoragePath,
  resolveStorageRole,
} from "@/lib/admin/image-production";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

const BUCKET = "car-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type GalleryActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function assertAdmin(): Promise<GalleryActionResult | null> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "Du har ikke tilgang til bildegalleriet." };
  }
  return null;
}

function storageReady(): boolean {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function publicUrlForPath(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

function revalidateCarPaths(slug: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/biler");
  revalidatePath(`/admin/biler`);
  revalidatePath("/modeller");
  revalidatePath(`/modeller/${slug}`);
  revalidatePath("/");
}

async function getCarMeta(
  carId: string,
): Promise<{ id: string; slug: string; brand: string } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cars")
    .select("id, slug, brand")
    .eq("id", carId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id as string,
    slug: data.slug as string,
    brand: (data.brand as string) || "",
  };
}

async function syncPrimaryToCarImageUrl(carId: string, imageUrl: string | null) {
  const supabase = createAdminClient();
  await supabase.from("cars").update({ image_url: imageUrl }).eq("id", carId);
}

async function clearOtherPrimaries(carId: string, exceptId?: string) {
  const supabase = createAdminClient();
  let query = supabase.from("car_images").update({ is_primary: false }).eq("car_id", carId);
  if (exceptId) {
    query = query.neq("id", exceptId);
  }
  await query;
}

async function toWebpBuffer(base64: string): Promise<Buffer | { error: string }> {
  try {
    const inputBuffer = Buffer.from(base64, "base64");
    if (inputBuffer.byteLength === 0) {
      return { error: "Velg et bilde å laste opp." };
    }
    if (inputBuffer.byteLength > MAX_BYTES) {
      return { error: "Bildet er for stort. Maks 5 MB." };
    }
    return sharp(inputBuffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { error: "Kunne ikke behandle bildet. Prøv et annet bilde." };
  }
}

export async function uploadGalleryImageAction(input: {
  carId: string;
  base64: string;
  contentType: string;
  imageType?: string;
  makePrimary?: boolean;
}): Promise<GalleryActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!storageReady()) {
    return { ok: false, error: "Bildelagring er ikke konfigurert." };
  }

  const car = await getCarMeta(input.carId);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const contentType = String(input.contentType ?? "").trim().toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) {
    return { ok: false, error: "Ugyldig filtype. Bruk JPEG, PNG, WebP eller GIF." };
  }

  const webp = await toWebpBuffer(String(input.base64 ?? ""));
  if ("error" in webp) return { ok: false, error: webp.error };

  const imageType: CarImageType = isCarImageType(input.imageType ?? "")
    ? (input.imageType as CarImageType)
    : "other";

  const supabase = createAdminClient();
  const { data: existing, error: countError } = await supabase
    .from("car_images")
    .select("id, sort_order")
    .eq("car_id", car.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (countError) {
    console.error("[admin] uploadGalleryImageAction list failed:", countError.message);
    return { ok: false, error: "Kunne ikke hente galleri. Har du kjørt car_images-migrasjonen?" };
  }

  const nextOrder = existing?.[0] ? Number(existing[0].sort_order) + 1 : 0;
  const makePrimary = Boolean(input.makePrimary) || (existing?.length ?? 0) === 0;
  const storagePath = buildCarImageStoragePath({
    brand: car.brand || car.slug,
    modelSlug: car.slug,
    role: resolveStorageRole({ isPrimary: makePrimary, imageType }),
    uniqueId: randomUUID(),
  });

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, webp, {
    contentType: "image/webp",
    upsert: false,
    cacheControl: "3600",
  });

  if (uploadError) {
    console.error("[admin] uploadGalleryImageAction upload failed:", uploadError.message);
    return { ok: false, error: "Kunne ikke laste opp bildet til Storage." };
  }

  const imageUrl = publicUrlForPath(storagePath);

  if (makePrimary) {
    await clearOtherPrimaries(car.id);
  }

  const { error: insertError } = await supabase.from("car_images").insert({
    car_id: car.id,
    image_url: imageUrl,
    storage_path: storagePath,
    image_type: imageType,
    alt_text: null,
    sort_order: nextOrder,
    is_primary: makePrimary,
  });

  if (insertError) {
    console.error("[admin] uploadGalleryImageAction insert failed:", insertError.message);
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: "Kunne ikke lagre bildeposten." };
  }

  if (makePrimary) {
    await syncPrimaryToCarImageUrl(car.id, imageUrl);
  }

  revalidateCarPaths(car.slug);
  return { ok: true, message: "Bildet er lagt til i galleriet." };
}

export async function replaceGalleryImageAction(input: {
  imageId: string;
  base64: string;
  contentType: string;
}): Promise<GalleryActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!storageReady()) {
    return { ok: false, error: "Bildelagring er ikke konfigurert." };
  }

  const contentType = String(input.contentType ?? "").trim().toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) {
    return { ok: false, error: "Ugyldig filtype. Bruk JPEG, PNG, WebP eller GIF." };
  }

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("car_images")
    .select("*")
    .eq("id", input.imageId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: "Bildet ble ikke funnet." };
  }

  const car = await getCarMeta(row.car_id as string);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const webp = await toWebpBuffer(String(input.base64 ?? ""));
  if ("error" in webp) return { ok: false, error: webp.error };

  const storagePath = buildCarImageStoragePath({
    brand: car.brand || car.slug,
    modelSlug: car.slug,
    role: resolveStorageRole({
      isPrimary: Boolean(row.is_primary),
      imageType: row.image_type as string,
    }),
    uniqueId: randomUUID(),
  });
  const oldPath = row.storage_path as string;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, webp, {
    contentType: "image/webp",
    upsert: false,
    cacheControl: "3600",
  });

  if (uploadError) {
    return { ok: false, error: "Kunne ikke laste opp erstatningsbildet." };
  }

  const imageUrl = publicUrlForPath(storagePath);
  const { error: updateError } = await supabase
    .from("car_images")
    .update({ image_url: imageUrl, storage_path: storagePath })
    .eq("id", input.imageId);

  if (updateError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: "Kunne ikke oppdatere bildeposten." };
  }

  if (oldPath && oldPath !== storagePath) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  if (row.is_primary) {
    await syncPrimaryToCarImageUrl(car.id, imageUrl);
  }

  revalidateCarPaths(car.slug);
  return { ok: true, message: "Bildet er byttet." };
}

export async function removeGalleryImageAction(imageId: string): Promise<GalleryActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!storageReady()) {
    return { ok: false, error: "Bildelagring er ikke konfigurert." };
  }

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("car_images")
    .select("*")
    .eq("id", imageId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: "Bildet ble ikke funnet." };
  }

  const car = await getCarMeta(row.car_id as string);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const { error: deleteError } = await supabase.from("car_images").delete().eq("id", imageId);
  if (deleteError) {
    return { ok: false, error: "Kunne ikke slette bildeposten." };
  }

  if (row.storage_path) {
    await supabase.storage.from(BUCKET).remove([row.storage_path as string]);
  }

  if (row.is_primary) {
    const { data: nextPrimary } = await supabase
      .from("car_images")
      .select("id, image_url")
      .eq("car_id", car.id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextPrimary) {
      await supabase
        .from("car_images")
        .update({ is_primary: true })
        .eq("id", nextPrimary.id);
      await syncPrimaryToCarImageUrl(car.id, nextPrimary.image_url as string);
    } else {
      await syncPrimaryToCarImageUrl(car.id, null);
    }
  }

  revalidateCarPaths(car.slug);
  return { ok: true, message: "Bildet er fjernet." };
}

export async function setGalleryImagePrimaryAction(imageId: string): Promise<GalleryActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!storageReady()) {
    return { ok: false, error: "Bildelagring er ikke konfigurert." };
  }

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("car_images")
    .select("*")
    .eq("id", imageId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: "Bildet ble ikke funnet." };
  }

  const car = await getCarMeta(row.car_id as string);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  await clearOtherPrimaries(car.id, imageId);
  const { error: updateError } = await supabase
    .from("car_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  if (updateError) {
    return { ok: false, error: "Kunne ikke sette primærbilde." };
  }

  await syncPrimaryToCarImageUrl(car.id, row.image_url as string);
  revalidateCarPaths(car.slug);
  return { ok: true, message: "Primærbilde er oppdatert." };
}

export async function updateGalleryImageTypeAction(
  imageId: string,
  imageType: string,
): Promise<GalleryActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!storageReady()) {
    return { ok: false, error: "Bildelagring er ikke konfigurert." };
  }
  if (!isCarImageType(imageType)) {
    return { ok: false, error: "Ugyldig bildetype." };
  }

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("car_images")
    .select("id, car_id")
    .eq("id", imageId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: "Bildet ble ikke funnet." };
  }

  const car = await getCarMeta(row.car_id as string);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const { error: updateError } = await supabase
    .from("car_images")
    .update({ image_type: imageType })
    .eq("id", imageId);

  if (updateError) {
    return { ok: false, error: "Kunne ikke oppdatere bildetype." };
  }

  revalidateCarPaths(car.slug);
  return { ok: true, message: "Bildetype er oppdatert." };
}

export async function reorderGalleryImagesAction(
  carId: string,
  orderedIds: string[],
): Promise<GalleryActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!storageReady()) {
    return { ok: false, error: "Bildelagring er ikke konfigurert." };
  }

  const car = await getCarMeta(carId);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: "Ugyldig rekkefølge." };
  }

  const supabase = createAdminClient();
  for (let i = 0; i < orderedIds.length; i += 1) {
    const id = orderedIds[i];
    const { error } = await supabase
      .from("car_images")
      .update({ sort_order: i })
      .eq("id", id)
      .eq("car_id", carId);

    if (error) {
      console.error("[admin] reorderGalleryImagesAction failed:", error.message);
      return { ok: false, error: "Kunne ikke lagre rekkefølgen." };
    }
  }

  revalidateCarPaths(car.slug);
  return { ok: true, message: "Rekkefølgen er lagret." };
}
