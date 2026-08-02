"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  appendAiApprovalEvent,
  canApproveAiAfterVisualReview,
  canSelectAiHero,
  isAiAwaitingGeneration,
  isAiEditorialArchive,
  isAiIllustrationCandidate,
  withAiVisualVerificationNotes,
  type AiVisualChecklistKey,
  AI_VISUAL_CHECKLIST_KEYS,
} from "@/lib/admin/ai-image-candidates";
import { archiveAiIllustrationsWhenOfficialAvailable } from "@/lib/admin/ai-image-candidate-service";
import { listAdminCarImages } from "@/lib/admin/car-images";
import { listImageCandidatesForCar } from "@/lib/admin/image-review-data";
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
    return { ok: false, error: "403 Forbidden" };
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
  /** Required for AI illustrations — confirms editor accepts illustration labeling. */
  confirmAiIllustration?: boolean;
  /** Required for AI — editor confirms Visually verified after checklist. */
  confirmVisuallyVerified?: boolean;
  /** Required for AI — all visual quality checklist keys. */
  visualChecklistKeys?: string[];
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

  if (isAiIllustrationCandidate(ctx.image)) {
    if (isAiEditorialArchive(ctx.image)) {
      return {
        ok: false,
        error:
          "AI-illustrasjonen er i Editorial Archive (offisiell foto foretrukket). Kan ikke godkjennes på nytt her.",
      };
    }
    if (isAiAwaitingGeneration(ctx.image)) {
      return {
        ok: false,
        error:
          "AI-kandidaten venter på generering/opplasting (Awaiting Generation). Kan ikke godkjennes ennå.",
      };
    }
    if (!input.confirmAiIllustration) {
      return {
        ok: false,
        error:
          "AI-illustrasjon krever eksplisitt bekreftelse: ikke offisiell produsentfoto, krever menneskelig godkjenning.",
      };
    }
    const checklistKeys = (input.visualChecklistKeys ?? []).filter((key) =>
      AI_VISUAL_CHECKLIST_KEYS.includes(key as AiVisualChecklistKey),
    );
    if (
      !canApproveAiAfterVisualReview({
        confirmVisuallyVerified: Boolean(input.confirmVisuallyVerified),
        checklistKeys,
      })
    ) {
      return {
        ok: false,
        error:
          "AI-illustrasjon kan ikke godkjennes før Visual Quality Review er komplett og «Visually verified» er bekreftet.",
      };
    }
  }

  // Ensure a durable local review copy before approve (never re-hotlink OEM CDN).
  let image = ctx.image;
  if (
    !image.storage_path?.trim() &&
    !hasDownloadFailed(image.notes) &&
    !isAiAwaitingGeneration(image)
  ) {
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
  let nextNotes = image.notes;
  if (isAiIllustrationCandidate(image)) {
    const checklistKeys = (input.visualChecklistKeys ?? []).filter((key) =>
      AI_VISUAL_CHECKLIST_KEYS.includes(key as AiVisualChecklistKey),
    ) as AiVisualChecklistKey[];
    nextNotes = withAiVisualVerificationNotes(image.notes, checklistKeys);
    nextNotes = appendAiApprovalEvent(
      nextNotes,
      "approved_as_ai_illustration_not_official",
    );
  }
  const { error } = await supabase
    .from("research_image_candidates")
    .update({
      status: "approved",
      ...(nextNotes ? { notes: nextNotes } : {}),
    })
    .eq("id", input.imageId);

  if (error) return { ok: false, error: "Kunne ikke godkjenne bildet." };

  let message = isAiIllustrationCandidate(image)
    ? "AI-illustrasjon godkjent (Approved) etter Visual Quality Review. Merket Illustrative image — not official manufacturer photography. Aldri auto-publisert."
    : "Bilde godkjent (Approved).";
  if (input.attachToGallery !== false) {
    const applied = await applySingleApprovedImage({
      carId: ctx.carId,
      slug: ctx.slug,
      brand: ctx.brand,
      image: { ...image, status: "approved", notes: nextNotes ?? image.notes },
    });
    if (applied.ok) {
      message = isAiIllustrationCandidate(image)
        ? "AI-illustrasjon godkjent, visuelt verifisert og lagt i galleriet. Synlig public først når bilen er publisert og ingen offisiell foto finnes. Offisielle bilder forblir foretrukket."
        : "Bilde godkjent og lagt i galleriet. Synlig på public sider først når bilen er publisert.";
    } else {
      message = `Bilde godkjent. Galleri-festing ventet: ${applied.error}`;
    }
  }

  // Official approve → prefer official; archive any AI illustrations for this car.
  if (!isAiIllustrationCandidate(image)) {
    const [gallery, candidates] = await Promise.all([
      listAdminCarImages(ctx.carId),
      listImageCandidatesForCar(ctx.carId),
    ]);
    await archiveAiIllustrationsWhenOfficialAvailable({ gallery, candidates });
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
  /** Required for AI illustrations — never auto-select Hero. */
  confirmAiHero?: boolean;
}): Promise<ImageReviewActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!dbReady()) return { ok: false, error: "Bildereview er midlertidig utilgjengelig." };

  const ctx = await loadCandidateContext(input.imageId);
  if (!ctx) return { ok: false, error: "Bildkandidaten ble ikke funnet." };

  if (ctx.image.status === "rejected") {
    return { ok: false, error: "Kan ikke velge et avvist bilde som hero." };
  }

  if (isAiIllustrationCandidate(ctx.image)) {
    if (isAiAwaitingGeneration(ctx.image)) {
      return {
        ok: false,
        error: "Kan ikke velge Hero før AI-bildet er generert/opplastet.",
      };
    }
    if (isAiEditorialArchive(ctx.image)) {
      return {
        ok: false,
        error: "AI i Editorial Archive kan ikke være Hero — bruk offisiell foto.",
      };
    }
    if (!canSelectAiHero(ctx.image)) {
      return {
        ok: false,
        error:
          "AI-Hero krever at bildet er Approved og Visually verified først.",
      };
    }
    if (!input.confirmAiHero) {
      return {
        ok: false,
        error:
          "AI-illustrasjon som Hero krever eksplisitt bekreftelse. Offisiell foto er alltid foretrukket.",
      };
    }
  }

  const supabase = createAdminClient();

  if (ctx.itemIds.length > 0) {
    await supabase
      .from("research_image_candidates")
      .update({ is_primary_candidate: false })
      .in("item_id", ctx.itemIds);
  }

  const heroNotes = isAiIllustrationCandidate(ctx.image)
    ? appendAiApprovalEvent(
        ctx.image.notes,
        "hero_confirmed_ai_illustration_not_official",
      )
    : undefined;

  const { error } = await supabase
    .from("research_image_candidates")
    .update({
      is_primary_candidate: true,
      ...(heroNotes ? { notes: heroNotes } : {}),
    })
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
    message: isAiIllustrationCandidate(ctx.image)
      ? "AI-illustrasjon bekreftet som Hero (eksplisitt). Ikke offisiell produsentfoto. Ingen auto-publisering."
      : ctx.image.is_primary_candidate
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
