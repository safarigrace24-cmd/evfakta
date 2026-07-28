/**
 * Local Image Review copies in Supabase Storage.
 *
 * Flow:
 * 1. Candidate created with original_url (provenance)
 * 2. Server downloads immediately → stores review WebP under car-images/
 * 3. Image Review previews ONLY the Storage URL (never hotlinks OEM CDN)
 * 4. On approve → promote/copy review file into gallery path (no re-download)
 *
 * If download fails, notes are marked "Download Failed" — no dead preview URL.
 */

import "server-only";

import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { buildCarImageStoragePath } from "@/lib/admin/image-production";
import {
  DOWNLOAD_FAILED_MARKER,
  IMAGE_BUCKET,
  NO_LOCAL_REVIEW_COPY_MARKER,
  hasDownloadFailed,
  publicUrlForCarImagePath,
  withDownloadFailedNotes,
} from "@/lib/admin/image-review-preview";
import type { ResearchImageCandidate } from "@/lib/admin/research/types";
import { createAdminClient } from "@/lib/supabase/admin";

export {
  DOWNLOAD_FAILED_MARKER,
  IMAGE_BUCKET,
  hasDownloadFailed,
  publicUrlForCarImagePath,
  withDownloadFailedNotes,
};

type FailureContext = {
  brand?: string;
  modelSlug?: string;
  modelName?: string | null;
  carId?: string | null;
  allCandidates?: ResearchImageCandidate[];
  /** When false, only mark failure — caller queues replacement. Default true. */
  queueReplacement?: boolean;
};

export function buildReviewStoragePath(input: {
  brand: string;
  modelSlug: string;
  uniqueId: string;
}): string {
  return buildCarImageStoragePath({
    brand: input.brand,
    modelSlug: input.modelSlug,
    role: "review",
    uniqueId: input.uniqueId,
  });
}

/** Fetch bytes from an official source URL for review-copy creation only. */
export async function fetchRemoteImageBuffer(
  url: string,
): Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {
  try {
    let referer = "https://www.evfakta.no/";
    try {
      referer = new URL(url).origin + "/";
    } catch {
      // keep default
    }
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        // Some OEM CDNs require a browser-like UA; still never hotlink in the UI.
        "User-Agent":
          "Mozilla/5.0 (compatible; EVFAKTAImageReview/1.0; +https://www.evfakta.no)",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: referer,
      },
    });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType && /text\/html|application\/json/i.test(contentType)) {
      return { ok: false, error: "Not an image response" };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < 32) {
      return { ok: false, error: "Empty image body" };
    }
    return { ok: true, buffer };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }
}

export async function toReviewWebpBuffer(
  input: Buffer,
): Promise<{ ok: true; buffer: Buffer; width: number; height: number } | { ok: false; error: string }> {
  try {
    const image = sharp(input).rotate();
    const meta = await image.metadata();
    const buffer = await image
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return {
      ok: true,
      buffer,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Image processing failed",
    };
  }
}

/**
 * Download original_url once and store a durable review copy.
 * Preserves original_url / source metadata. Updates storage_path on success.
 */
export async function ensureCandidateReviewCopy(input: {
  candidate: ResearchImageCandidate;
  brand: string;
  modelSlug: string;
}): Promise<ResearchImageCandidate> {
  const { candidate, brand, modelSlug } = input;

  if (candidate.storage_path?.trim()) {
    return candidate;
  }
  if (hasDownloadFailed(candidate.notes)) {
    return candidate;
  }
  if (!candidate.original_url?.trim()) {
    return markCandidateDownloadFailed(candidate, "Missing original_url", {
      brand,
      modelSlug,
      queueReplacement: false,
    });
  }

  const fetched = await fetchRemoteImageBuffer(candidate.original_url);
  if (!fetched.ok) {
    return markCandidateDownloadFailed(candidate, fetched.error, {
      brand,
      modelSlug,
      queueReplacement: false,
    });
  }

  const processed = await toReviewWebpBuffer(fetched.buffer);
  if (!processed.ok) {
    return markCandidateDownloadFailed(candidate, processed.error, {
      brand,
      modelSlug,
      queueReplacement: false,
    });
  }

  const storagePath = buildReviewStoragePath({
    brand,
    modelSlug,
    uniqueId: candidate.id || randomUUID(),
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
    return markCandidateDownloadFailed(candidate, uploadError.message, {
      brand,
      modelSlug,
      queueReplacement: false,
    });
  }

  const resolutionNote =
    processed.width > 0 && processed.height > 0
      ? `resolution: ${processed.width}x${processed.height}`
      : null;
  const nextNotes = [candidate.notes, resolutionNote, "review-copy:stored"]
    .filter(Boolean)
    .join(" | ");

  const { data: updated, error: updateError } = await supabase
    .from("research_image_candidates")
    .update({
      storage_path: storagePath,
      notes: nextNotes,
    })
    .eq("id", candidate.id)
    .select("*")
    .maybeSingle();

  if (updateError || !updated) {
    console.error(
      "[image-review-storage] failed to save storage_path:",
      updateError?.message,
    );
    return {
      ...candidate,
      storage_path: storagePath,
      notes: nextNotes,
    };
  }

  return updated as ResearchImageCandidate;
}

async function markCandidateDownloadFailed(
  candidate: ResearchImageCandidate,
  reason: string,
  context: FailureContext = {},
): Promise<ResearchImageCandidate> {
  const notes = withDownloadFailedNotes(
    [
      candidate.notes,
      reason ? `download-error:${reason}` : null,
      !candidate.storage_path?.trim() ? NO_LOCAL_REVIEW_COPY_MARKER : null,
    ]
      .filter(Boolean)
      .join(" | "),
  );

  if (!candidate.id) {
    return { ...candidate, notes };
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("research_image_candidates")
    .update({ notes })
    .eq("id", candidate.id)
    .select("*")
    .maybeSingle();

  let failed =
    (data as ResearchImageCandidate) ?? { ...candidate, notes };

  if (
    context.queueReplacement !== false &&
    context.brand &&
    context.modelSlug
  ) {
    try {
      const { queueImageRoleReplacement } = await import(
        "@/lib/admin/image-role-replacement"
      );
      const result = await queueImageRoleReplacement({
        failed,
        brand: context.brand,
        modelSlug: context.modelSlug,
        modelName: context.modelName,
        carId: context.carId,
        allCandidates: context.allCandidates,
      });
      if (result.candidate) failed = result.candidate;
    } catch (error) {
      console.error(
        "[image-review-storage] replacement queue failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return failed;
}

/**
 * Hydrate review copies for candidates missing storage_path.
 * Safe to call when opening Image Review — never auto-approves.
 */
export async function hydrateCandidateReviewCopies(input: {
  candidates: ResearchImageCandidate[];
  brand: string;
  modelSlug: string;
}): Promise<ResearchImageCandidate[]> {
  const results: ResearchImageCandidate[] = [];
  for (const candidate of input.candidates) {
    results.push(
      await ensureCandidateReviewCopy({
        candidate,
        brand: input.brand,
        modelSlug: input.modelSlug,
      }),
    );
  }
  return results;
}

/**
 * Promote an existing review copy into a gallery storage path.
 * Does NOT re-fetch the manufacturer URL.
 */
export async function promoteReviewCopyToGalleryPath(input: {
  reviewStoragePath: string;
  brand: string;
  modelSlug: string;
  role: Exclude<
    import("@/lib/admin/image-production").CarImageStorageRole,
    "review"
  >;
}): Promise<{ ok: true; storagePath: string } | { ok: false; error: string }> {
  const supabase = createAdminClient();
  const galleryPath = buildCarImageStoragePath({
    brand: input.brand,
    modelSlug: input.modelSlug,
    role: input.role,
    uniqueId: randomUUID(),
  });

  // Prefer server-side copy (no re-download of OEM URL).
  const { error: copyError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .copy(input.reviewStoragePath, galleryPath);

  if (!copyError) {
    return { ok: true, storagePath: galleryPath };
  }

  // Fallback: download from our own Storage, then upload.
  const { data, error: downloadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .download(input.reviewStoragePath);

  if (downloadError || !data) {
    return {
      ok: false,
      error: downloadError?.message || "Review-kopi mangler i Storage.",
    };
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(galleryPath, buffer, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  return { ok: true, storagePath: galleryPath };
}
