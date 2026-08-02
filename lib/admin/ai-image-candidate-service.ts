/**
 * Server helpers: create / attach AI illustration candidates into Image Review.
 * Never auto-approves. Never auto-selects hero. Never publishes.
 * No image pixels are fabricated here — when generation is unavailable, candidates
 * stay Awaiting Generation with a ready prompt for the editor.
 */

import "server-only";

import { randomUUID } from "node:crypto";
import {
  AI_AWAITING_GENERATION_MARKER,
  AI_AWAITING_ORIGINAL_URL,
  AI_SOURCE_NAME,
  aiCandidateLicenseNote,
  aiCandidateUsageTerms,
  aiIllustrationAltText,
  appendAiApprovalEvent,
  buildAiCandidateNotes,
  buildAiIllustrationPrompt,
  imageTypeForAiUsage,
  isAiEditorialArchive,
  isAiIllustrationCandidate,
  withAiEditorialArchiveNotes,
  type AiIllustrationUsageType,
} from "@/lib/admin/ai-image-candidates";
import type { CarImageRow } from "@/lib/admin/car-image-types";
import {
  buildReviewStoragePath,
  IMAGE_BUCKET,
  toReviewWebpBuffer,
} from "@/lib/admin/image-review-storage";
import type { ResearchImageCandidate } from "@/lib/admin/research/types";
import { createAdminClient } from "@/lib/supabase/admin";

async function ensureImageReviewResearchItem(input: {
  carId: string;
  brand: string;
  model: string;
  slug: string;
}): Promise<string> {
  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from("research_items")
    .select("id")
    .eq("existing_car_id", input.carId)
    .order("created_at", { ascending: false })
    .limit(1);

  const existingId = (items?.[0]?.id as string) || null;
  if (existingId) return existingId;

  const { data: job, error: jobError } = await supabase
    .from("research_jobs")
    .insert({
      status: "completed",
      provider_key: "manual",
      source_mode: "manual_upload",
      brand_name: input.brand,
      model_query: input.model,
      progress_pct: 100,
      progress_message: "AI illustration candidates (Image Review)",
      summary: { imageCandidates: 0, aiIllustrations: true },
    })
    .select("id")
    .single();

  if (jobError || !job) {
    throw new Error(jobError?.message || "Could not create research job for AI candidate.");
  }

  const { data: item, error: itemError } = await supabase
    .from("research_items")
    .insert({
      job_id: job.id,
      sort_order: 0,
      slug: input.slug,
      brand: input.brand,
      model: input.model,
      existing_car_id: input.carId,
      decision: "pending",
      warnings: [
        "AI illustration candidates — not official photography; human approval required.",
      ],
      missing_fields: [],
      conflicts: [],
      proposed_car: {
        slug: input.slug,
        brand: input.brand,
        model: input.model,
      },
      proposed_variants: [],
      message: "AI illustration workflow — pending human review only.",
    })
    .select("id")
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message || "Could not create research item for AI candidate.");
  }

  return item.id as string;
}

export async function createAiIllustrationCandidate(input: {
  carId: string;
  brand: string;
  model: string;
  slug: string;
  usageType: AiIllustrationUsageType;
  usageNote?: string | null;
  changeRequest?: string | null;
  previousCandidateId?: string | null;
  includeEvfaktaMark?: boolean;
  /** Editor-edited prompt override from Lag AI-bilde modal. */
  promptOverride?: string | null;
  negativePrompt?: string | null;
  style?: string | null;
  aspectRatio?: string | null;
  editorEmail?: string | null;
  variant?: string | null;
  year?: number | string | null;
  generatorPrecheckComplete?: boolean;
  /** When true and buffer provided, store review copy. Otherwise Awaiting Generation. */
  imageBuffer?: Buffer | null;
}): Promise<
  | { ok: true; candidate: ResearchImageCandidate; prompt: string; awaitingGeneration: boolean }
  | { ok: false; error: string }
> {
  try {
    const prompt =
      input.promptOverride?.trim() ||
      buildAiIllustrationPrompt({
        brand: input.brand,
        model: input.model,
        usageType: input.usageType,
        changeRequest: input.changeRequest,
        includeEvfaktaMark: input.includeEvfaktaMark,
        variant: input.variant,
        year: input.year,
        style: input.style,
        aspectRatio: input.aspectRatio,
      });

    const itemId = await ensureImageReviewResearchItem({
      carId: input.carId,
      brand: input.brand,
      model: input.model,
      slug: input.slug,
    });

    const hasBytes = Boolean(input.imageBuffer && input.imageBuffer.byteLength > 32);
    const generatedAt = hasBytes ? new Date().toISOString() : null;
    const notes = buildAiCandidateNotes({
      brand: input.brand,
      model: input.model,
      usageType: input.usageType,
      prompt,
      usageNote: input.usageNote,
      generatedAt,
      awaitingGeneration: !hasBytes,
      changeRequest: input.changeRequest,
      previousCandidateId: input.previousCandidateId,
      negativePrompt: input.negativePrompt,
      style: input.style,
      aspectRatio: input.aspectRatio,
      editorEmail: input.editorEmail,
      variant: input.variant,
      year: input.year,
      generatorPrecheckComplete: input.generatorPrecheckComplete,
    });

    const supabase = createAdminClient();
    const { data: inserted, error } = await supabase
      .from("research_image_candidates")
      .insert({
        item_id: itemId,
        original_url: AI_AWAITING_ORIGINAL_URL,
        source_name: AI_SOURCE_NAME,
        source_url: null,
        license_note: aiCandidateLicenseNote(),
        usage_terms: aiCandidateUsageTerms(),
        alt_text: aiIllustrationAltText({
          brand: input.brand,
          model: input.model,
          usageType: input.usageType,
        }),
        image_type: imageTypeForAiUsage(input.usageType),
        is_primary_candidate: false,
        status: "pending",
        notes,
      })
      .select("*")
      .maybeSingle();

    if (error || !inserted) {
      return { ok: false, error: error?.message || "Could not create AI candidate." };
    }

    let candidate = inserted as ResearchImageCandidate;

    if (hasBytes && input.imageBuffer) {
      const attached = await attachGeneratedBytesToAiCandidate({
        candidate,
        brand: input.brand,
        modelSlug: input.slug,
        buffer: input.imageBuffer,
      });
      if (!attached.ok) {
        return { ok: false, error: attached.error };
      }
      candidate = attached.candidate;
      return {
        ok: true,
        candidate,
        prompt,
        awaitingGeneration: false,
      };
    }

    return {
      ok: true,
      candidate,
      prompt,
      awaitingGeneration: true,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI candidate creation failed.",
    };
  }
}

export async function attachGeneratedBytesToAiCandidate(input: {
  candidate: ResearchImageCandidate;
  brand: string;
  modelSlug: string;
  buffer: Buffer;
}): Promise<
  | { ok: true; candidate: ResearchImageCandidate }
  | { ok: false; error: string }
> {
  if (!isAiIllustrationCandidate(input.candidate)) {
    return { ok: false, error: "Not an AI illustration candidate." };
  }

  const processed = await toReviewWebpBuffer(input.buffer);
  if (!processed.ok) {
    return { ok: false, error: processed.error };
  }

  const storagePath = buildReviewStoragePath({
    brand: input.brand,
    modelSlug: input.modelSlug,
    uniqueId: input.candidate.id || randomUUID(),
  });

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(storagePath, processed.buffer, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const storageUrl = `${base}/storage/v1/object/public/${IMAGE_BUCKET}/${storagePath}`;
  const generatedAt = new Date().toISOString();
  const resolutionNote =
    processed.width > 0 && processed.height > 0
      ? `resolution: ${processed.width}x${processed.height}`
      : null;

  let notes = (input.candidate.notes || "")
    .replace(AI_AWAITING_GENERATION_MARKER, "ai-status:generated")
    .replace(/generated_at:[^\s|]+/g, "")
    .trim();
  notes = [
    notes,
    `generated_at:${generatedAt}`,
    resolutionNote,
    "review-copy:stored",
    "ai-status:generated",
  ]
    .filter(Boolean)
    .join(" | ");
  notes = appendAiApprovalEvent(notes, "bytes_attached_pending_review");

  const { data: updated, error } = await supabase
    .from("research_image_candidates")
    .update({
      original_url: storageUrl,
      storage_path: storagePath,
      notes,
      status: "pending",
      is_primary_candidate: false,
    })
    .eq("id", input.candidate.id)
    .select("*")
    .maybeSingle();

  if (error || !updated) {
    return { ok: false, error: error?.message || "Could not update AI candidate after upload." };
  }

  return { ok: true, candidate: updated as ResearchImageCandidate };
}

/**
 * When official manufacturer gallery images exist, prefer them automatically:
 * move AI illustrations to Editorial Archive (never delete).
 */
export async function archiveAiIllustrationsWhenOfficialAvailable(input: {
  candidates: ResearchImageCandidate[];
  gallery: CarImageRow[];
}): Promise<ResearchImageCandidate[]> {
  const aiAppliedIds = new Set(
    input.candidates
      .filter(
        (c) => isAiIllustrationCandidate(c) && Boolean(c.applied_image_id?.trim()),
      )
      .map((c) => c.applied_image_id as string),
  );
  const hasOfficialGallery = input.gallery.some(
    (image) => !aiAppliedIds.has(image.id),
  );
  if (!hasOfficialGallery) return input.candidates;

  const supabase = createAdminClient();
  const results: ResearchImageCandidate[] = [];

  for (const candidate of input.candidates) {
    if (!isAiIllustrationCandidate(candidate) || isAiEditorialArchive(candidate)) {
      results.push(candidate);
      continue;
    }

    const notes = withAiEditorialArchiveNotes(candidate.notes);
    const { data: updated } = await supabase
      .from("research_image_candidates")
      .update({
        notes,
        is_primary_candidate: false,
      })
      .eq("id", candidate.id)
      .select("*")
      .maybeSingle();

    // If AI was primary in gallery, clear primary so official can take preference.
    if (candidate.applied_image_id) {
      await supabase
        .from("car_images")
        .update({ is_primary: false })
        .eq("id", candidate.applied_image_id);
    }

    results.push((updated as ResearchImageCandidate) ?? { ...candidate, notes, is_primary_candidate: false });
  }

  return results;
}

/** True when the car has at least one non-AI gallery image (official preferred). */
export function galleryHasOfficialManufacturerImage(
  gallery: CarImageRow[],
  candidates: ResearchImageCandidate[],
): boolean {
  const aiAppliedIds = new Set(
    candidates
      .filter(
        (c) => isAiIllustrationCandidate(c) && Boolean(c.applied_image_id?.trim()),
      )
      .map((c) => c.applied_image_id as string),
  );
  return gallery.some((image) => !aiAppliedIds.has(image.id));
}
