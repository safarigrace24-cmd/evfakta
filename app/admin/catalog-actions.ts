"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  formatPublishIssues,
  type GalleryImageRef,
} from "@/lib/admin/publish-readiness";
import { computeEditorialCompletion } from "@/lib/admin/editorial-completion";
import type { CarImageRow } from "@/lib/admin/car-image-types";
import { ADMIN_MESSAGES, type AdminCar, type ImportStatus } from "@/lib/admin/types";
import type { AdminCarVariant } from "@/lib/admin/variant-types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

async function loadPublishContext(
  supabase: ReturnType<typeof createAdminClient>,
  carId: string,
): Promise<{
  images: CarImageRow[];
  variants: AdminCarVariant[];
  gallery_images: GalleryImageRef[];
}> {
  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase.from("car_images").select("*").eq("car_id", carId),
    supabase.from("car_variants").select("*").eq("car_id", carId),
  ]);
  const rows = (images ?? []) as CarImageRow[];
  return {
    images: rows,
    variants: (variants ?? []) as AdminCarVariant[],
    gallery_images: rows.map((image) => ({
      image_type: image.image_type,
      is_primary: image.is_primary,
    })),
  };
}

export type CatalogBulkResult =
  | { ok: true; message: string; affected: number; skipped: number }
  | { ok: false; error: string };

async function assertAdmin() {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false as const, error: ADMIN_MESSAGES.unauthorized };
  }
  return { ok: true as const };
}

function dbReady() {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function revalidateCatalog() {
  revalidatePath("/admin");
  revalidatePath("/admin/biler");
  revalidatePath("/admin/import");
  revalidatePath("/modeller");
  revalidatePath("/merker");
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

export async function bulkSetImportStatusAction(
  ids: string[],
  status: ImportStatus,
): Promise<CatalogBulkResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: ADMIN_MESSAGES.unavailable };

  const carIds = uniqueIds(ids);
  if (carIds.length === 0) return { ok: false, error: "Ingen biler valgt." };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cars")
      .update({ import_status: status })
      .in("id", carIds)
      .select("id");

    if (error) {
      console.error("[catalog] bulkSetImportStatusAction:", error.message);
      return { ok: false, error: ADMIN_MESSAGES.genericError };
    }

    revalidateCatalog();
    const labels: Record<ImportStatus, string> = {
      draft: "utkast",
      needs_review: "trenger gjennomgang",
      approved: "godkjent",
    };
    return {
      ok: true,
      message: `${data?.length ?? 0} bil(er) satt til ${labels[status]}.`,
      affected: data?.length ?? 0,
      skipped: 0,
    };
  } catch (error) {
    console.error("[catalog] bulkSetImportStatusAction exception:", error);
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }
}

export async function bulkPublishCarsAction(
  ids: string[],
  publish: boolean,
): Promise<CatalogBulkResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: ADMIN_MESSAGES.unavailable };

  const carIds = uniqueIds(ids);
  if (carIds.length === 0) return { ok: false, error: "Ingen biler valgt." };

  try {
    const supabase = createAdminClient();
    const { data: cars, error } = await supabase.from("cars").select("*").in("id", carIds);
    if (error) {
      console.error("[catalog] bulkPublishCarsAction load:", error.message);
      return { ok: false, error: ADMIN_MESSAGES.genericError };
    }

    let affected = 0;
    let skipped = 0;

    for (const car of (cars ?? []) as AdminCar[]) {
      if (publish) {
        const ctx = await loadPublishContext(supabase, car.id);
        const issues = computeEditorialCompletion({
          car,
          images: ctx.images,
          variants: ctx.variants,
        }).publishIssues;
        if (issues.length > 0) {
          skipped += 1;
          continue;
        }
      }

      const { error: updateError } = await supabase
        .from("cars")
        .update({ is_published: publish })
        .eq("id", car.id);

      if (updateError) {
        skipped += 1;
        continue;
      }
      affected += 1;
    }

    revalidateCatalog();
    return {
      ok: true,
      message: publish
        ? `Publiserte ${affected} bil(er). ${skipped} hoppet over (ikke klare).`
        : `Avpubliserte ${affected} bil(er).`,
      affected,
      skipped,
    };
  } catch (error) {
    console.error("[catalog] bulkPublishCarsAction exception:", error);
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }
}

export async function bulkDeleteCarsAction(ids: string[]): Promise<CatalogBulkResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: ADMIN_MESSAGES.unavailable };

  const carIds = uniqueIds(ids);
  if (carIds.length === 0) return { ok: false, error: "Ingen biler valgt." };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cars")
      .delete()
      .in("id", carIds)
      .select("id");

    if (error) {
      console.error("[catalog] bulkDeleteCarsAction:", error.message);
      return { ok: false, error: ADMIN_MESSAGES.genericError };
    }

    revalidateCatalog();
    return {
      ok: true,
      message: `Slettet ${data?.length ?? 0} bil(er).`,
      affected: data?.length ?? 0,
      skipped: 0,
    };
  } catch (error) {
    console.error("[catalog] bulkDeleteCarsAction exception:", error);
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }
}

export async function bulkAssignBrandAction(
  ids: string[],
  brandId: string,
): Promise<CatalogBulkResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: ADMIN_MESSAGES.unavailable };

  const carIds = uniqueIds(ids);
  if (!brandId || carIds.length === 0) {
    return { ok: false, error: "Velg merke og minst én bil." };
  }

  try {
    const supabase = createAdminClient();
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", brandId)
      .maybeSingle();

    if (brandError || !brand) {
      return { ok: false, error: "Merket ble ikke funnet." };
    }

    const { data, error } = await supabase
      .from("cars")
      .update({ brand_id: brand.id, brand: brand.name })
      .in("id", carIds)
      .select("id");

    if (error) {
      console.error("[catalog] bulkAssignBrandAction:", error.message);
      return { ok: false, error: ADMIN_MESSAGES.genericError };
    }

    revalidateCatalog();
    return {
      ok: true,
      message: `Tildelte merket ${brand.name} til ${data?.length ?? 0} bil(er).`,
      affected: data?.length ?? 0,
      skipped: 0,
    };
  } catch (error) {
    console.error("[catalog] bulkAssignBrandAction exception:", error);
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }
}

export async function bulkAssignSourceAction(
  ids: string[],
  sourceName: string,
  sourceUrl: string,
): Promise<CatalogBulkResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: ADMIN_MESSAGES.unavailable };

  const carIds = uniqueIds(ids);
  const name = sourceName.trim();
  const url = sourceUrl.trim();
  if (carIds.length === 0) return { ok: false, error: "Ingen biler valgt." };
  if (!name && !url) return { ok: false, error: "Oppgi kildenavn eller URL." };

  try {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data: cars } = await supabase
      .from("cars")
      .select("id, field_sources")
      .in("id", carIds);

    let affected = 0;
    for (const car of cars ?? []) {
      const previous = (car.field_sources as Record<string, unknown> | null) ?? {};
      const field_sources = {
        ...previous,
        source_name: {
          source_name: name || null,
          source_url: url || null,
          imported_at: nowIso,
          import_job_id: null,
        },
        source_url: {
          source_name: name || null,
          source_url: url || null,
          imported_at: nowIso,
          import_job_id: null,
        },
      };

      const { error } = await supabase
        .from("cars")
        .update({
          source_name: name || null,
          source_url: url || null,
          data_last_checked_at: nowIso,
          field_sources,
        })
        .eq("id", car.id);

      if (!error) affected += 1;
    }

    revalidateCatalog();
    return {
      ok: true,
      message: `Oppdaterte kilde for ${affected} bil(er).`,
      affected,
      skipped: carIds.length - affected,
    };
  } catch (error) {
    console.error("[catalog] bulkAssignSourceAction exception:", error);
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }
}

/** Expose publish issue text for UI feedback when needed. */
export async function explainPublishBlockersAction(id: string) {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false as const, error: ADMIN_MESSAGES.unavailable };

  const supabase = createAdminClient();
  const { data } = await supabase.from("cars").select("*").eq("id", id).maybeSingle();
  if (!data) return { ok: false as const, error: ADMIN_MESSAGES.notFound };

  const ctx = await loadPublishContext(supabase, id);
  const issues = computeEditorialCompletion({
    car: data as AdminCar,
    images: ctx.images,
    variants: ctx.variants,
  }).publishIssues;

  return {
    ok: true as const,
    message: issues.length ? formatPublishIssues(issues) : "Klar for publisering.",
  };
}
