"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import { canApproveImageCandidate } from "@/lib/admin/image-review";
import {
  ensureCandidateReviewCopy,
  hasDownloadFailed,
} from "@/lib/admin/image-review-storage";
import { applySingleApprovedImage } from "@/lib/admin/research/apply";
import type { ResearchImageCandidate } from "@/lib/admin/research/types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type ImageReviewActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function assertAdmin(): Promise<ImageReviewActionResult | null> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "Du har ikke tilgang til bildegjennomgang." };
  }
  return null;
}

function dbReady() {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function revalidateImageReviewPaths(carId: string, slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/images");
  revalidatePath(`/admin/images/${carId}`);
  revalidatePath("/admin/production");
  revalidatePath("/admin/biler");
  revalidatePath(`/admin/biler/${carId}/rediger`);
  if (slug) {
    revalidatePath(`/modeller/${slug}`);
    revalidatePath("/");
  }
}

async function loadCandidateContext(imageId: string): Promise<{
  image: ResearchImageCandidate;
  carId: string;
  slug: string;
  brand: string;
  itemIds: string[];
} | null> {
  const supabase = createAdminClient();
  const { data: image, error } = await supabase
    .from("research_image_candidates")
    .select("*")
    .eq("id", imageId)
    .maybeSingle();

  if (error || !image) return null;

  const { data: item } = await supabase
    .from("research_items")
    .select("id, existing_car_id, job_id")
    .eq("id", image.item_id)
    .maybeSingle();

  if (!item?.existing_car_id) return null;

  const { data: car } = await supabase
    .from("cars")
    .select("id, slug, brand")
    .eq("id", item.existing_car_id)
    .maybeSingle();

  if (!car) return null;

  const { data: siblingItems } = await supabase
    .from("research_items")
    .select("id")
    .eq("existing_car_id", car.id);

  return {
    image: image as ResearchImageCandidate,
    carId: car.id as string,
    slug: car.slug as string,
    brand: (car.brand as string) || "",
    itemIds: (siblingItems ?? []).map((row) => row.id as string).filter(Boolean),
  };
}

/** Approve a candidate. Never publishes. Never auto-approves without this action. */
export async function approveImageCandidateAction(input: {
  imageId: string;
  attachToGallery?: boolean;
}): Promise<ImageReviewActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!dbReady()) return { ok: false, error: "Bildereview er midlertidig utilgjengelig." };

  const ctx = await loadCandidateContext(input.imageId);
  if (!ctx) return { ok: false, error: "Bildkandidaten ble ikke funnet." };

  if (ctx.image.status === "rejected") {
    return { ok: false, error: "Avviste bilder må settes tilbake til Candidate før godkjenning." };
  }
  if (ctx.image.status === "applied") {
    return { ok: true, message: "Bildet er allerede i galleriet." };
  }

  // Ensure a durable local review copy before approve (never re-hotlink OEM CDN).
  let image = ctx.image;
  if (!image.storage_path?.trim() && !hasDownloadFailed(image.notes)) {
    image = await ensureCandidateReviewCopy({
      candidate: image,
      brand: ctx.brand || ctx.slug,
      modelSlug: ctx.slug,
    });
  }

  if (hasDownloadFailed(image.notes)) {
    return {
      ok: false,
      error: "Download Failed — originalen kunne ikke lastes ned. Last opp manuelt i bildegalleriet.",
    };
  }
  if (!canApproveImageCandidate({ ...image, status: "pending" })) {
    return {
      ok: false,
      error: "Kan ikke godkjenne uten lokal review-kopi. Last opp manuelt i bildegalleriet.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("research_image_candidates")
    .update({ status: "approved" })
    .eq("id", input.imageId);

  if (error) return { ok: false, error: "Kunne ikke godkjenne bildet." };

  let message = "Bilde godkjent (Approved).";
  if (input.attachToGallery !== false) {
    const applied = await applySingleApprovedImage({
      carId: ctx.carId,
      slug: ctx.slug,
      brand: ctx.brand,
      image: { ...image, status: "approved" },
    });
    if (applied.ok) {
      message =
        "Bilde godkjent og lagt i galleriet. Synlig på public sider først når bilen er publisert.";
    } else {
      message = `Bilde godkjent. Galleri-festing ventet: ${applied.error}`;
    }
  }

  revalidateImageReviewPaths(ctx.carId, ctx.slug);
  return { ok: true, message };
}

/** Reject a candidate. Keeps history — never deletes. */
export async function rejectImageCandidateAction(input: {
  imageId: string;
}): Promise<ImageReviewActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!dbReady()) return { ok: false, error: "Bildereview er midlertidig utilgjengelig." };

  const ctx = await loadCandidateContext(input.imageId);
  if (!ctx) return { ok: false, error: "Bildkandidaten ble ikke funnet." };

  if (ctx.image.status === "applied") {
    return {
      ok: false,
      error: "Bildet er allerede i galleriet. Fjern det manuelt fra galleriet om nødvendig — historikk beholdes.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("research_image_candidates")
    .update({ status: "rejected" })
    .eq("id", input.imageId);

  if (error) return { ok: false, error: "Kunne ikke avvise bildet." };

  revalidateImageReviewPaths(ctx.carId, ctx.slug);
  return { ok: true, message: "Bilde avvist (Rejected). Beholdt i historikk." };
}

/** Mark one candidate as the only hero for the model. */
export async function setHeroImageCandidateAction(input: {
  imageId: string;
}): Promise<ImageReviewActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!dbReady()) return { ok: false, error: "Bildereview er midlertidig utilgjengelig." };

  const ctx = await loadCandidateContext(input.imageId);
  if (!ctx) return { ok: false, error: "Bildkandidaten ble ikke funnet." };

  if (ctx.image.status === "rejected") {
    return { ok: false, error: "Kan ikke velge et avvist bilde som hero." };
  }

  const supabase = createAdminClient();

  if (ctx.itemIds.length > 0) {
    await supabase
      .from("research_image_candidates")
      .update({ is_primary_candidate: false })
      .in("item_id", ctx.itemIds);
  }

  const { error } = await supabase
    .from("research_image_candidates")
    .update({ is_primary_candidate: true })
    .eq("id", input.imageId);

  if (error) return { ok: false, error: "Kunne ikke sette hero-bilde." };

  if (ctx.image.applied_image_id) {
    await supabase
      .from("car_images")
      .update({ is_primary: false })
      .eq("car_id", ctx.carId);

    const { data: galleryRow } = await supabase
      .from("car_images")
      .update({ is_primary: true })
      .eq("id", ctx.image.applied_image_id)
      .select("image_url")
      .maybeSingle();

    if (galleryRow?.image_url) {
      await supabase
        .from("cars")
        .update({ image_url: galleryRow.image_url as string })
        .eq("id", ctx.carId);
    }
  }

  revalidateImageReviewPaths(ctx.carId, ctx.slug);
  return {
    ok: true,
    message: ctx.image.is_primary_candidate
      ? "Hero bekreftet (Replace Hero)."
      : "Hero valgt. Kun ett hero-bilde per modell.",
  };
}

/** Reset rejected/approved (not applied) back to Candidate for re-review. */
export async function resetImageCandidateAction(input: {
  imageId: string;
}): Promise<ImageReviewActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!dbReady()) return { ok: false, error: "Bildereview er midlertidig utilgjengelig." };

  const ctx = await loadCandidateContext(input.imageId);
  if (!ctx) return { ok: false, error: "Bildkandidaten ble ikke funnet." };
  if (ctx.image.status === "applied") {
    return { ok: false, error: "Anvendte galleribilder kan ikke tilbakestilles her." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("research_image_candidates")
    .update({ status: "pending" })
    .eq("id", input.imageId);

  if (error) return { ok: false, error: "Kunne ikke tilbakestille status." };

  revalidateImageReviewPaths(ctx.carId, ctx.slug);
  return { ok: true, message: "Status satt tilbake til Candidate." };
}
