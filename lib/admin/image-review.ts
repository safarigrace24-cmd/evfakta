/**
 * Pure helpers for the EVFAKTA Image Review System.
 * Editorial recommendations and readiness labels only — never writes to the DB.
 */

import {
  AI_INTERNAL_WARNING,
  AI_PUBLIC_LABEL,
  AI_WARNING,
  buildAiVisualQualityReview,
  isAiAwaitingGeneration,
  isAiEditorialArchive,
  isAiIllustrationCandidate,
  isAiVisuallyVerified,
  parseAiGenerationPrompt,
  parseAiUsageType,
  type AiVisualQualityReview,
} from "@/lib/admin/ai-image-candidates";
import type { CarImageRow } from "@/lib/admin/car-image-types";
import { CAR_IMAGE_TYPE_LABELS, isCarImageType } from "@/lib/admin/car-image-types";
import {
  collectImageProductionWarnings,
  isRejectedImageSourceUrl,
} from "@/lib/admin/image-production";
import {
  hasDownloadFailed,
  isUsableImageReviewCandidate,
  resolveImageReviewPreviewUrl,
} from "@/lib/admin/image-review-preview";
import type {
  ResearchImageCandidate,
  ResearchImageStatus,
} from "@/lib/admin/research/types";

/** Editor-facing status. DB still uses pending/approved/rejected/applied. */
export type ImageReviewStatus = "Candidate" | "Approved" | "Rejected";

export type ImageReadinessLabel = "Image Ready" | "Images Pending Review";

export type ImageQualityWarning =
  | "Low resolution"
  | "Duplicate"
  | "Broken URL"
  | "Missing attribution"
  | "Rejected source"
  | "Unclear usage rights"
  | "Needs Manual Identity Check"
  | "Unsupported file type"
  | "Download Failed"
  | "AI-generated illustration"
  | "Awaiting Generation"
  | "Not official manufacturer photography"
  | "Not visually verified"
  | "Editorial Archive";

export type ImageReviewCard = {
  id: string;
  itemId: string;
  previewUrl: string;
  imageType: string;
  imageTypeLabel: string;
  sourceName: string | null;
  sourceUrl: string | null;
  originalUrl: string;
  resolution: string | null;
  status: ImageReviewStatus;
  dbStatus: ResearchImageStatus;
  isHeroCandidate: boolean;
  isInGallery: boolean;
  appliedImageId: string | null;
  warnings: ImageQualityWarning[];
  previewKind: "image" | "source_page";
  altText: string | null;
  notes: string | null;
  isAiIllustration: boolean;
  aiAwaitingGeneration: boolean;
  aiUsageType: string | null;
  aiGenerationPrompt: string | null;
  aiPublicLabel: string | null;
  aiInternalWarning: string | null;
  aiVisuallyVerified: boolean;
  aiEditorialArchive: boolean;
  aiQualityReview: AiVisualQualityReview | null;
};

export type ImageReviewReadiness = {
  label: ImageReadinessLabel;
  imagesReady: boolean;
  hasApprovedHero: boolean;
  hasApprovedFront: boolean;
  hasApprovedSide: boolean;
  missingHero: boolean;
  missingGallery: boolean;
  candidateCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  galleryCount: number;
};

const APPROVED_DB: ReadonlySet<ResearchImageStatus> = new Set([
  "approved",
  "applied",
]);

export function toImageReviewStatus(
  status: ResearchImageStatus,
): ImageReviewStatus {
  if (status === "rejected") return "Rejected";
  if (status === "approved" || status === "applied") return "Approved";
  return "Candidate";
}

export function imageTypeLabel(imageType: string | null | undefined): string {
  const raw = (imageType || "other").trim().toLowerCase();
  if (raw === "hero") return "Hero";
  if (raw === "dashboard") return "Dashboard";
  if (raw === "charging") return "Charging";
  if (isCarImageType(raw)) return CAR_IMAGE_TYPE_LABELS[raw];
  if (!raw) return "Annet";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function parseResolutionFromNotes(
  notes: string | null | undefined,
): string | null {
  if (!notes?.trim()) return null;
  const match = notes.match(
    /(?:resolution|size|dim(?:ension)?s?)[:\s]*(\d{2,5})\s*[x×]\s*(\d{2,5})/i,
  );
  if (!match) return null;
  return `${match[1]}×${match[2]}`;
}

/** Absolute http(s) candidate URL — attempt preview in Image Review. */
export function hasImageCandidateUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return /^https?:$/i.test(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Whether Image Review should attempt an <img> preview.
 * Broader than research approve heuristics — CDN paths without extensions still preview.
 * Does not change research pipeline rules.
 */
export function shouldAttemptImagePreview(url: string | null | undefined): boolean {
  if (!hasImageCandidateUrl(url)) return false;
  const trimmed = url!.trim();
  if (/\.(pdf)(\?|#|$)/i.test(trimmed)) return false;
  if (/\.(html?)(\?|#|$)/i.test(trimmed)) return false;
  return true;
}

export function isLowResolution(resolution: string | null): boolean {
  if (!resolution) return false;
  const match = resolution.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!match) return false;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return false;
  return width < 800 || height < 600;
}

function hasAttribution(image: ResearchImageCandidate): boolean {
  return Boolean(image.source_name?.trim() || image.source_url?.trim());
}

export function collectImageQualityWarnings(
  image: ResearchImageCandidate,
  allForCar: ResearchImageCandidate[],
): ImageQualityWarning[] {
  const warnings: ImageQualityWarning[] = [];
  const ai = isAiIllustrationCandidate(image);

  if (ai) {
    warnings.push("AI-generated illustration");
    warnings.push("Not official manufacturer photography");
    if (isAiAwaitingGeneration(image)) {
      warnings.push("Awaiting Generation");
    }
    if (isAiEditorialArchive(image)) {
      warnings.push("Editorial Archive");
    } else if (!isAiVisuallyVerified(image) && !isAiAwaitingGeneration(image)) {
      warnings.push("Not visually verified");
    }
  }

  // Empty / non-http URLs are broken up front. Load failures are handled in the UI.
  // AI Awaiting Generation uses a non-http provenance placeholder by design.
  if (!ai && !hasImageCandidateUrl(image.original_url)) {
    warnings.push("Broken URL");
  }
  if (ai && isAiAwaitingGeneration(image)) {
    // not broken — intentionally awaiting editor generation/upload
  } else if (ai && !image.storage_path?.trim() && !hasImageCandidateUrl(image.original_url)) {
    warnings.push("Broken URL");
  }

  if (!hasAttribution(image)) {
    warnings.push("Missing attribution");
  }

  const resolution = parseResolutionFromNotes(image.notes);
  if (isLowResolution(resolution)) {
    warnings.push("Low resolution");
  }

  const url = image.original_url.trim().toLowerCase();
  if (
    url &&
    allForCar.some(
      (other) =>
        other.id !== image.id &&
        other.original_url.trim().toLowerCase() === url &&
        other.status !== "rejected",
    )
  ) {
    warnings.push("Duplicate");
  }

  for (const warning of collectImageProductionWarnings(image, allForCar)) {
    if (
      warning === "Rejected source" ||
      warning === "Unclear usage rights" ||
      warning === "Needs Manual Identity Check" ||
      warning === "Unsupported file type"
    ) {
      if (!warnings.includes(warning)) warnings.push(warning);
    }
  }

  if (hasDownloadFailed(image.notes) && !warnings.includes("Download Failed")) {
    warnings.push("Download Failed");
  }

  return warnings;
}

export { resolveImageReviewPreviewUrl } from "@/lib/admin/image-review-preview";

export function buildImageReviewCard(
  image: ResearchImageCandidate,
  allForCar: ResearchImageCandidate[],
  options?: { officialImageAvailable?: boolean },
): ImageReviewCard {
  const resolution = parseResolutionFromNotes(image.notes);
  const reviewStatus = toImageReviewStatus(image.status);
  const previewUrl = resolveImageReviewPreviewUrl(image);
  const downloadFailed = hasDownloadFailed(image.notes);
  const ai = isAiIllustrationCandidate(image);
  const awaiting = isAiAwaitingGeneration(image);
  const officialImageAvailable = Boolean(options?.officialImageAvailable);
  const qualityReview = ai
    ? buildAiVisualQualityReview({ image, officialImageAvailable })
    : null;

  return {
    id: image.id,
    itemId: image.item_id,
    previewUrl,
    imageType: (image.image_type || "other").trim() || "other",
    imageTypeLabel: image.is_primary_candidate
      ? `Hero · ${imageTypeLabel(image.image_type)}`
      : imageTypeLabel(image.image_type),
    sourceName: image.source_name,
    sourceUrl: image.source_url,
    originalUrl: image.original_url,
    resolution,
    status: reviewStatus,
    dbStatus: image.status,
    isHeroCandidate: image.is_primary_candidate,
    isInGallery: image.status === "applied" && Boolean(image.applied_image_id),
    appliedImageId: image.applied_image_id,
    warnings: collectImageQualityWarnings(image, allForCar),
    previewKind: previewUrl && !downloadFailed && !awaiting ? "image" : "source_page",
    altText: image.alt_text,
    notes: image.notes,
    isAiIllustration: ai,
    aiAwaitingGeneration: awaiting,
    aiUsageType: parseAiUsageType(image.notes),
    aiGenerationPrompt: parseAiGenerationPrompt(image.notes),
    aiPublicLabel: ai ? AI_PUBLIC_LABEL : null,
    aiInternalWarning: ai ? AI_INTERNAL_WARNING : null,
    aiVisuallyVerified: ai ? isAiVisuallyVerified(image) : false,
    aiEditorialArchive: ai ? isAiEditorialArchive(image) : false,
    aiQualityReview: qualityReview,
  };
}

function candidateTypeApproved(
  candidates: ResearchImageCandidate[],
  type: string,
): boolean {
  return candidates.some(
    (image) =>
      APPROVED_DB.has(image.status) &&
      !isAiIllustrationCandidate(image) &&
      (image.image_type || "").trim().toLowerCase() === type,
  );
}

function galleryTypeApproved(
  images: CarImageRow[],
  type: CarImageRow["image_type"],
  excludeIds?: Set<string>,
): boolean {
  return images.some(
    (image) =>
      image.image_type === type &&
      (!excludeIds || !excludeIds.has(image.id)),
  );
}

/** Gallery rows attached from AI candidates — excluded from official Image Ready. */
export function aiAppliedGalleryIds(
  candidates: ResearchImageCandidate[],
): Set<string> {
  const ids = new Set<string>();
  for (const image of candidates) {
    if (
      isAiIllustrationCandidate(image) &&
      image.applied_image_id?.trim()
    ) {
      ids.add(image.applied_image_id);
    }
  }
  return ids;
}

export function computeImageReviewReadiness(input: {
  gallery: CarImageRow[];
  candidates: ResearchImageCandidate[];
  carImageUrl?: string | null;
}): ImageReviewReadiness {
  const { gallery, candidates, carImageUrl } = input;
  const aiGalleryIds = aiAppliedGalleryIds(candidates);

  // Image Ready prefers official photography — AI illustrations never satisfy it.
  const aiIsHero =
    gallery.some((image) => image.is_primary && aiGalleryIds.has(image.id)) ||
    candidates.some(
      (image) =>
        APPROVED_DB.has(image.status) &&
        image.is_primary_candidate &&
        isAiIllustrationCandidate(image),
    );
  const hasApprovedHero =
    gallery.some((image) => image.is_primary && !aiGalleryIds.has(image.id)) ||
    candidates.some(
      (image) =>
        APPROVED_DB.has(image.status) &&
        image.is_primary_candidate &&
        !isAiIllustrationCandidate(image),
    ) ||
    (Boolean(carImageUrl?.trim()) && !aiIsHero);

  const hasApprovedFront =
    galleryTypeApproved(gallery, "front", aiGalleryIds) ||
    candidateTypeApproved(candidates, "front");

  const hasApprovedSide =
    galleryTypeApproved(gallery, "side", aiGalleryIds) ||
    candidateTypeApproved(candidates, "side");

  const imagesReady = hasApprovedHero && hasApprovedFront && hasApprovedSide;
  const pendingCount = candidates.filter(
    (c) => c.status === "pending" && isUsableImageReviewCandidate(c),
  ).length;
  const approvedCount = candidates.filter((c) => APPROVED_DB.has(c.status)).length;
  const rejectedCount = candidates.filter((c) => c.status === "rejected").length;

  return {
    label: imagesReady ? "Image Ready" : "Images Pending Review",
    imagesReady,
    hasApprovedHero,
    hasApprovedFront,
    hasApprovedSide,
    missingHero: !hasApprovedHero,
    missingGallery: gallery.length === 0 && approvedCount === 0,
    candidateCount: candidates.length,
    pendingCount,
    approvedCount,
    rejectedCount,
    galleryCount: gallery.length,
  };
}

export function canApproveImageCandidate(image: ResearchImageCandidate): boolean {
  if (image.status === "rejected" || image.status === "applied") return false;
  if (isAiAwaitingGeneration(image)) return false;
  if (
    !isAiIllustrationCandidate(image) &&
    (isRejectedImageSourceUrl(image.original_url) ||
      isRejectedImageSourceUrl(image.source_url))
  ) {
    return false;
  }
  if (hasDownloadFailed(image.notes)) return false;
  // Approval requires a durable local review copy — never re-hotlink OEM CDN.
  if (!image.storage_path?.trim()) return false;
  return true;
}

/** AI approve / hero always require an explicit editor confirmation flag in the action. */
export function requiresAiIllustrationConfirmation(
  image: ResearchImageCandidate,
): boolean {
  return isAiIllustrationCandidate(image);
}

export { AI_PUBLIC_LABEL, AI_WARNING, AI_INTERNAL_WARNING };

export function sortImageReviewCards(cards: ImageReviewCard[]): ImageReviewCard[] {
  const statusOrder: Record<ImageReviewStatus, number> = {
    Candidate: 0,
    Approved: 1,
    Rejected: 2,
  };
  return [...cards].sort((a, b) => {
    if (a.isHeroCandidate !== b.isHeroCandidate) {
      return a.isHeroCandidate ? -1 : 1;
    }
    const byStatus = statusOrder[a.status] - statusOrder[b.status];
    if (byStatus !== 0) return byStatus;
    return a.imageTypeLabel.localeCompare(b.imageTypeLabel);
  });
}
