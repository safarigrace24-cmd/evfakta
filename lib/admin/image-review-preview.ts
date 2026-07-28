/**
 * Pure helpers for Image Review previews + failed-candidate lifecycle.
 * Safe for client + server — never hotlinks manufacturer CDN URLs.
 */

export const IMAGE_BUCKET = "car-images";
export const DOWNLOAD_FAILED_MARKER = "Download Failed";
export const SUPERSEDED_MARKER = "superseded";
export const REPLACEMENT_QUEUED_MARKER = "replacement-queued";
export const REPLACEMENT_EXHAUSTED_MARKER = "replacement-exhausted";
export const NO_LOCAL_REVIEW_COPY_MARKER = "No local review copy";
export const NO_OFFICIAL_IMAGE_MESSAGE = "No official image available yet.";

export function publicUrlForCarImagePath(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/storage/v1/object/public/${IMAGE_BUCKET}/${storagePath}`;
}

export function hasDownloadFailed(notes: string | null | undefined): boolean {
  if (!notes?.trim()) return false;
  return notes.includes(DOWNLOAD_FAILED_MARKER);
}

export function hasHttp410Failure(notes: string | null | undefined): boolean {
  if (!notes?.trim()) return false;
  return /HTTP\s*410/i.test(notes);
}

export function hasSupersededMarker(notes: string | null | undefined): boolean {
  if (!notes?.trim()) return false;
  return notes.toLowerCase().includes(SUPERSEDED_MARKER.toLowerCase());
}

export function hasReplacementQueued(notes: string | null | undefined): boolean {
  if (!notes?.trim()) return false;
  return notes.includes(REPLACEMENT_QUEUED_MARKER);
}

export function hasReplacementExhausted(notes: string | null | undefined): boolean {
  if (!notes?.trim()) return false;
  return notes.includes(REPLACEMENT_EXHAUSTED_MARKER);
}

export function withDownloadFailedNotes(notes: string | null | undefined): string {
  const existing = notes?.trim() || "";
  if (existing.includes(DOWNLOAD_FAILED_MARKER)) return existing;
  return existing
    ? `${existing} | ${DOWNLOAD_FAILED_MARKER}`
    : DOWNLOAD_FAILED_MARKER;
}

function appendNoteMarker(
  notes: string | null | undefined,
  marker: string,
): string {
  const existing = notes?.trim() || "";
  if (existing.includes(marker)) return existing;
  return existing ? `${existing} | ${marker}` : marker;
}

export function withSupersededNotes(
  notes: string | null | undefined,
  detail?: string | null,
): string {
  const withMarker = appendNoteMarker(notes, SUPERSEDED_MARKER);
  if (!detail?.trim()) return withMarker;
  return appendNoteMarker(withMarker, detail.trim());
}

export function withReplacementQueuedNotes(
  notes: string | null | undefined,
): string {
  return appendNoteMarker(notes, REPLACEMENT_QUEUED_MARKER);
}

export function withReplacementExhaustedNotes(
  notes: string | null | undefined,
): string {
  return appendNoteMarker(notes, REPLACEMENT_EXHAUSTED_MARKER);
}

/**
 * Permanently failed for Image Review: Download Failed, HTTP 410,
 * explicit no-local-copy marker, or pending without a Storage review copy
 * after a download-error was recorded.
 */
export function isPermanentlyFailedImageCandidate(image: {
  status?: string | null;
  storage_path?: string | null;
  notes?: string | null;
}): boolean {
  if (hasSupersededMarker(image.notes)) return true;
  if (hasDownloadFailed(image.notes)) return true;
  if (hasHttp410Failure(image.notes)) return true;
  if (image.notes?.includes(NO_LOCAL_REVIEW_COPY_MARKER)) return true;
  if (
    image.status === "pending" &&
    !image.storage_path?.trim() &&
    /download-error:/i.test(image.notes || "")
  ) {
    return true;
  }
  return false;
}

/** Candidates the editor should see by default (usable review copies). */
export function isUsableImageReviewCandidate(image: {
  status?: string | null;
  storage_path?: string | null;
  notes?: string | null;
}): boolean {
  if (image.status === "rejected") return false;
  if (isPermanentlyFailedImageCandidate(image)) return false;
  if (!image.storage_path?.trim()) return false;
  return true;
}

export function filterDefaultImageReviewCandidates<
  T extends {
    status?: string | null;
    storage_path?: string | null;
    notes?: string | null;
  },
>(candidates: T[]): T[] {
  return candidates.filter((candidate) => isUsableImageReviewCandidate(candidate));
}

/** Image role key used when queueing a replacement research pass. */
export function imageCandidateRoleKey(image: {
  image_type?: string | null;
  is_primary_candidate?: boolean;
}): string {
  if (image.is_primary_candidate) return "hero";
  const type = (image.image_type || "other").trim().toLowerCase();
  return type || "other";
}

/** Preview URL for Image Review — Storage only, never manufacturer CDN. */
export function resolveImageReviewPreviewUrl(input: {
  storage_path?: string | null;
}): string {
  if (!input.storage_path?.trim()) return "";
  return publicUrlForCarImagePath(input.storage_path.trim());
}
