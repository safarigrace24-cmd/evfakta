/**
 * Pure helpers for the EVFAKTA Image Review System.
 * Editorial recommendations and readiness labels only — never writes to the DB.
 */

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
  | "Download Failed";

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

  // Empty / non-http URLs are broken up front. Load failures are handled in the UI.
  if (!hasImageCandidateUrl(image.original_url)) {
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
): ImageReviewCard {
  const resolution = parseResolutionFromNotes(image.notes);
  const reviewStatus = toImageReviewStatus(image.status);
  const previewUrl = resolveImageReviewPreviewUrl(image);
  const downloadFailed = hasDownloadFailed(image.notes);

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
    previewKind: previewUrl && !downloadFailed ? "image" : "source_page",
    altText: image.alt_text,
    notes: image.notes,
  };
}

function candidateTypeApproved(
  candidates: ResearchImageCandidate[],
  type: string,
): boolean {
  return candidates.some(
    (image) =>
      APPROVED_DB.has(image.status) &&
      (image.image_type || "").trim().toLowerCase() === type,
  );
}

function galleryTypeApproved(images: CarImageRow[], type: CarImageRow["image_type"]): boolean {
  return images.some((image) => image.image_type === type);
}

export function computeImageReviewReadiness(input: {
  gallery: CarImageRow[];
  candidates: ResearchImageCandidate[];
  carImageUrl?: string | null;
}): ImageReviewReadiness {
  const { gallery, candidates, carImageUrl } = input;

  const hasApprovedHero =
    gallery.some((image) => image.is_primary) ||
    Boolean(carImageUrl?.trim()) ||
    candidates.some(
      (image) => APPROVED_DB.has(image.status) && image.is_primary_candidate,
    );

  const hasApprovedFront =
    galleryTypeApproved(gallery, "front") ||
    candidateTypeApproved(candidates, "front");

  const hasApprovedSide =
    galleryTypeApproved(gallery, "side") ||
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
  if (
    isRejectedImageSourceUrl(image.original_url) ||
    isRejectedImageSourceUrl(image.source_url)
  ) {
    return false;
  }
  if (hasDownloadFailed(image.notes)) return false;
  // Approval requires a durable local review copy — never re-hotlink OEM CDN.
  if (!image.storage_path?.trim()) return false;
  return true;
}

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
