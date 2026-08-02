/**
 * Permanent EVFAKTA vehicle image production helpers.
 *
 * Pure policy + reporting utilities. Never auto-approves, never auto-publishes,
 * never invents usage rights. Candidates stay pending until a human acts in
 * Image Review (/admin/images/[carId]).
 */

import { slugify } from "@/lib/admin/import/parse-csv";
import type { CarImageRow } from "@/lib/admin/car-image-types";
import {
  computeImageReviewReadiness,
  type ImageReadinessLabel,
  type ImageReviewReadiness,
} from "@/lib/admin/image-review";
import type { ResearchImageCandidate } from "@/lib/admin/research/types";

/** Minimum set for Image Ready (matches Image Review / launch gate). */
export const REQUIRED_IMAGE_TYPES = ["hero", "front", "side"] as const;

/** Strongly preferred additional angles for a complete gallery. */
export const RECOMMENDED_IMAGE_TYPES = [
  "rear",
  "interior",
  "front three-quarter",
  "rear three-quarter",
  "dashboard",
  "cargo",
  "charging port",
] as const;

export type ImageSourceCategory =
  | "official_no_manufacturer"
  | "official_global_manufacturer"
  | "official_press_media"
  | "official_configurator_cdn"
  | "owner_upload"
  | "explicit_reusable_license"
  | "ai_generated"
  | "unknown"
  | "rejected";

/** Host / URL patterns that must never become image sources or candidates. */
const REJECTED_SOURCE_HOST_PATTERNS: RegExp[] = [
  /(^|\.)google\./i,
  /(^|\.)gstatic\./i,
  /(^|\.)googleusercontent\./i,
  /(^|\.)ggpht\./i,
  /(^|\.)pinterest\./i,
  /(^|\.)pinimg\./i,
  /(^|\.)facebook\./i,
  /(^|\.)fbcdn\./i,
  /(^|\.)instagram\./i,
  /(^|\.)cdninstagram\./i,
  /(^|\.)tiktok\./i,
  /(^|\.)twitter\./i,
  /(^|\.)x\.com$/i,
  /(^|\.)twimg\./i,
  /(^|\.)reddit\./i,
  /(^|\.)redd\.it$/i,
  /(^|\.)shutterstock\./i,
  /(^|\.)gettyimages\./i,
  /(^|\.)alamy\./i,
  /(^|\.)unsplash\./i,
  /(^|\.)pexels\./i,
];

const REJECTED_PATH_PATTERNS: RegExp[] = [
  /\/imgres(\?|$)/i,
  /google\.com\/search/i,
  /images\.google\./i,
];

const SUPPORTED_IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i;

export type ImageProductionWarning =
  | "Rejected source"
  | "Unclear usage rights"
  | "Needs Manual Identity Check"
  | "Unsupported file type"
  | "Missing attribution"
  | "Low resolution"
  | "Duplicate"
  | "Broken URL";

export function imageReviewAdminPath(carId: string): string {
  return `/admin/images/${carId}`;
}

export function imageReviewAdminUrl(carId: string, siteOrigin = "https://www.evfakta.no"): string {
  return `${siteOrigin.replace(/\/$/, "")}${imageReviewAdminPath(carId)}`;
}

export function parseUrlHost(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url.trim()).hostname;
  } catch {
    return null;
  }
}

/** True when the URL is a Google search / aggregator result — never store as source. */
export function isRejectedImageSourceUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const trimmed = url.trim();
  if (REJECTED_PATH_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return true;
  }
  const host = parseUrlHost(trimmed);
  if (!host) return false;
  return REJECTED_SOURCE_HOST_PATTERNS.some((pattern) => pattern.test(host));
}

/**
 * Soft signal that a URL is likely manufacturer / press / CDN.
 * Does not approve images — only helps research prioritisation and warnings.
 */
export function isLikelyOfficialManufacturerUrl(url: string | null | undefined): boolean {
  if (!url?.trim() || isRejectedImageSourceUrl(url)) return false;
  const host = parseUrlHost(url);
  if (!host) return false;
  // Common OEM / press / CDN patterns — not an allowlist for auto-approve.
  return (
    /\.(tesla|volkswagen|vw-mms|vw|volvocars|bmw|audi|kia|hyundai|polestar|byd|toyota|ford|mercedes-benz|porsche|nissan|opel|peugeot|citroen|skoda|cupra|mg|xpeng|nio|zeekr)\./i.test(
      host,
    ) ||
    /(^|\.)(media|press|cdn|assets|images|static|uploads)\./i.test(host) ||
    host.endsWith(".no")
  );
}

export function classifyImageSourceCategory(input: {
  originalUrl?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  ownerUpload?: boolean;
  explicitReusableLicense?: boolean;
}): ImageSourceCategory {
  if (input.ownerUpload) return "owner_upload";
  if (input.explicitReusableLicense) return "explicit_reusable_license";
  if (
    isRejectedImageSourceUrl(input.originalUrl) ||
    isRejectedImageSourceUrl(input.sourceUrl)
  ) {
    return "rejected";
  }
  const sourceUrl = input.sourceUrl || input.originalUrl || "";
  const host = parseUrlHost(sourceUrl) || "";
  const looksNorwegian =
    /\.no$/i.test(host) ||
    /\/no([_/?]|$)/i.test(sourceUrl) ||
    /no_NO/i.test(sourceUrl);
  if (looksNorwegian && isLikelyOfficialManufacturerUrl(sourceUrl)) {
    return "official_no_manufacturer";
  }
  if (/press|media|newsroom/i.test(host) || /press|media|newsroom/i.test(sourceUrl)) {
    return "official_press_media";
  }
  if (/cdn|assets|configurator|scene7|cloudfront/i.test(host)) {
    return "official_configurator_cdn";
  }
  if (isLikelyOfficialManufacturerUrl(sourceUrl)) {
    return "official_global_manufacturer";
  }
  return "unknown";
}

export function hasUnclearUsageRights(image: {
  license_note?: string | null;
  usage_terms?: string | null;
  source_name?: string | null;
  source_url?: string | null;
}): boolean {
  const hasAttribution = Boolean(
    image.source_name?.trim() || image.source_url?.trim(),
  );
  const hasRightsNote = Boolean(
    image.license_note?.trim() || image.usage_terms?.trim(),
  );
  return !hasAttribution || !hasRightsNote;
}

export function hasUnsupportedImageFileType(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const pathname = new URL(url.trim()).pathname;
    // CDN paths without extension are allowed for preview; flag only clear bad extensions.
    if (!/\.[a-z0-9]+$/i.test(pathname)) return false;
    return !SUPPORTED_IMAGE_EXT.test(pathname);
  } catch {
    return false;
  }
}

export function collectImageProductionWarnings(
  image: ResearchImageCandidate,
  allForCar: ResearchImageCandidate[] = [],
): ImageProductionWarning[] {
  const warnings: ImageProductionWarning[] = [];

  if (!image.original_url?.trim()) {
    warnings.push("Broken URL");
  } else if (isRejectedImageSourceUrl(image.original_url)) {
    warnings.push("Rejected source");
  }

  if (isRejectedImageSourceUrl(image.source_url)) {
    if (!warnings.includes("Rejected source")) warnings.push("Rejected source");
  }

  if (hasUnsupportedImageFileType(image.original_url)) {
    warnings.push("Unsupported file type");
  }

  if (!image.source_name?.trim() && !image.source_url?.trim()) {
    warnings.push("Missing attribution");
  }

  if (hasUnclearUsageRights(image)) {
    warnings.push("Unclear usage rights");
  }

  const notes = (image.notes || "").toLowerCase();
  if (
    notes.includes("needs manual identity check") ||
    notes.includes("wrong model") ||
    notes.includes("wrong trim") ||
    notes.includes("wrong year") ||
    notes.includes("uncertain identity")
  ) {
    warnings.push("Needs Manual Identity Check");
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

  return warnings;
}

/** Candidate may not be approved when source is rejected or URL is not a real image. */
export function canCollectAsImageCandidate(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  if (isRejectedImageSourceUrl(url)) return false;
  try {
    const parsed = new URL(url.trim());
    return /^https?:$/i.test(parsed.protocol);
  } catch {
    return false;
  }
}

export type CarImageStorageRole =
  | "hero"
  | "front"
  | "side"
  | "rear"
  | "interior"
  | "gallery"
  | "review";

/**
 * Preferred Storage path under the `car-images` bucket.
 * Uses brand/model folders; unique file names avoid overwriting unrelated assets.
 *
 * Examples:
 * - volvo/ex30/hero-a1b2c3d4.webp
 * - volkswagen/id-4/front-a1b2c3d4.webp
 * - volkswagen/id-4/pro/gallery-a1b2c3d4.webp
 */
export function buildCarImageStoragePath(input: {
  brand: string;
  modelSlug: string;
  role: CarImageStorageRole;
  variantSlug?: string | null;
  uniqueId: string;
}): string {
  const brandSlug = slugify(input.brand) || "brand";
  const modelSlug = slugify(input.modelSlug) || input.modelSlug || "model";
  const id = input.uniqueId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 12) || "img";
  const file = `${input.role}-${id}.webp`;
  if (input.variantSlug?.trim()) {
    const variantSlug = slugify(input.variantSlug) || "variant";
    return `${brandSlug}/${modelSlug}/${variantSlug}/${file}`;
  }
  return `${brandSlug}/${modelSlug}/${file}`;
}

export function resolveStorageRole(input: {
  isPrimary?: boolean;
  imageType?: string | null;
}): Exclude<CarImageStorageRole, "review"> {
  if (input.isPrimary) return "hero";
  const type = (input.imageType || "").trim().toLowerCase();
  if (type === "front") return "front";
  if (type === "side") return "side";
  if (type === "rear") return "rear";
  if (type === "interior") return "interior";
  return "gallery";
}

export function listPresentImageTypes(input: {
  gallery: CarImageRow[];
  candidates: ResearchImageCandidate[];
  carImageUrl?: string | null;
}): string[] {
  const present = new Set<string>();
  if (input.gallery.some((image) => image.is_primary) || input.carImageUrl?.trim()) {
    present.add("hero");
  }
  for (const image of input.gallery) {
    if (image.image_type) present.add(image.image_type);
  }
  for (const image of input.candidates) {
    if (image.status === "rejected") continue;
    if (image.is_primary_candidate) present.add("hero");
    if (image.image_type) present.add(image.image_type.trim().toLowerCase());
  }
  return [...present];
}

export function listMissingRequiredImageTypes(input: {
  gallery: CarImageRow[];
  candidates: ResearchImageCandidate[];
  carImageUrl?: string | null;
}): string[] {
  const readiness = computeImageReviewReadiness(input);
  const missing: string[] = [];
  if (!readiness.hasApprovedHero) missing.push("hero");
  if (!readiness.hasApprovedFront) missing.push("front");
  if (!readiness.hasApprovedSide) missing.push("side");
  return missing;
}

export function listMissingRecommendedImageTypes(input: {
  gallery: CarImageRow[];
  candidates: ResearchImageCandidate[];
  carImageUrl?: string | null;
}): string[] {
  const present = new Set(listPresentImageTypes(input));
  return RECOMMENDED_IMAGE_TYPES.filter((type) => {
    if (type === "front three-quarter" || type === "rear three-quarter") {
      return !present.has(type) && !present.has(type.replace(" three-quarter", ""));
    }
    if (type === "charging port") return !present.has("charging") && !present.has(type);
    return !present.has(type);
  });
}

export type ImageProductionModelReport = {
  carId: string;
  brand: string;
  model: string;
  slug: string;
  readinessLabel: ImageReadinessLabel;
  imagesReady: boolean;
  candidateCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  brokenCandidateCount: number;
  rightsWarningCount: number;
  lowResolutionWarningCount: number;
  rejectedSourceCount: number;
  imageTypesFound: string[];
  missingRequiredTypes: string[];
  missingRecommendedTypes: string[];
  imageReviewPath: string;
  imageReviewUrl: string;
};

export function buildImageProductionModelReport(input: {
  carId: string;
  brand: string;
  model: string;
  slug: string;
  gallery: CarImageRow[];
  candidates: ResearchImageCandidate[];
  carImageUrl?: string | null;
  siteOrigin?: string;
}): ImageProductionModelReport {
  const readiness: ImageReviewReadiness = computeImageReviewReadiness(input);
  let brokenCandidateCount = 0;
  let rightsWarningCount = 0;
  let lowResolutionWarningCount = 0;
  let rejectedSourceCount = 0;

  for (const image of input.candidates) {
    const warnings = collectImageProductionWarnings(image, input.candidates);
    if (warnings.includes("Broken URL")) brokenCandidateCount += 1;
    if (warnings.includes("Unclear usage rights")) rightsWarningCount += 1;
    if (warnings.includes("Rejected source")) rejectedSourceCount += 1;
    const notes = image.notes || "";
    if (/resolution[:\s]*(\d+)\s*[x×]\s*(\d+)/i.test(notes)) {
      const match = notes.match(/(\d+)\s*[x×]\s*(\d+)/i);
      if (match && (Number(match[1]) < 800 || Number(match[2]) < 600)) {
        lowResolutionWarningCount += 1;
      }
    }
  }

  return {
    carId: input.carId,
    brand: input.brand,
    model: input.model,
    slug: input.slug,
    readinessLabel: readiness.label,
    imagesReady: readiness.imagesReady,
    candidateCount: readiness.candidateCount,
    pendingCount: readiness.pendingCount,
    approvedCount: readiness.approvedCount,
    rejectedCount: readiness.rejectedCount,
    brokenCandidateCount,
    rightsWarningCount,
    lowResolutionWarningCount,
    rejectedSourceCount,
    imageTypesFound: listPresentImageTypes(input),
    missingRequiredTypes: listMissingRequiredImageTypes(input),
    missingRecommendedTypes: listMissingRecommendedImageTypes(input),
    imageReviewPath: imageReviewAdminPath(input.carId),
    imageReviewUrl: imageReviewAdminUrl(input.carId, input.siteOrigin),
  };
}

export type ImageProductionBatchSummary = {
  modelCount: number;
  candidatesCollected: number;
  imageReadyCount: number;
  imagesPendingCount: number;
  brokenCandidates: number;
  rightsWarnings: number;
  lowResolutionWarnings: number;
  rejectedSources: number;
  models: ImageProductionModelReport[];
};

export function summarizeImageProductionBatch(
  models: ImageProductionModelReport[],
): ImageProductionBatchSummary {
  return {
    modelCount: models.length,
    candidatesCollected: models.reduce((sum, model) => sum + model.candidateCount, 0),
    imageReadyCount: models.filter((model) => model.imagesReady).length,
    imagesPendingCount: models.filter((model) => !model.imagesReady).length,
    brokenCandidates: models.reduce((sum, model) => sum + model.brokenCandidateCount, 0),
    rightsWarnings: models.reduce((sum, model) => sum + model.rightsWarningCount, 0),
    lowResolutionWarnings: models.reduce(
      (sum, model) => sum + model.lowResolutionWarningCount,
      0,
    ),
    rejectedSources: models.reduce((sum, model) => sum + model.rejectedSourceCount, 0),
    models,
  };
}

/** Markdown section for brand batch production reports. */
export function formatImageProductionBatchMarkdown(
  summary: ImageProductionBatchSummary,
  title = "Image production",
): string {
  const lines: string[] = [
    `## ${title}`,
    "",
    `| Metric | Count |`,
    `| --- | ---: |`,
    `| Models | ${summary.modelCount} |`,
    `| Candidates collected | ${summary.candidatesCollected} |`,
    `| Image Ready | ${summary.imageReadyCount} |`,
    `| Images Pending | ${summary.imagesPendingCount} |`,
    `| Broken candidates | ${summary.brokenCandidates} |`,
    `| Rights warnings | ${summary.rightsWarnings} |`,
    `| Low-resolution warnings | ${summary.lowResolutionWarnings} |`,
    `| Rejected sources | ${summary.rejectedSources} |`,
    "",
    `| Model | Status | Types found | Missing required | Image Review |`,
    `| --- | --- | --- | --- | --- |`,
  ];

  for (const model of summary.models) {
    const types = model.imageTypesFound.join(", ") || "—";
    const missing = model.missingRequiredTypes.join(", ") || "—";
    lines.push(
      `| ${model.brand} ${model.model} | ${model.readinessLabel} | ${types} | ${missing} | ${model.imageReviewPath} |`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Default license / usage notes for newly collected official candidates.
 * Does not grant approval — editor must still confirm rights before approve.
 */
export function defaultCandidateRightsNotes(): {
  license_note: string;
  usage_terms: string;
} {
  return {
    license_note:
      "Candidate only — verify manufacturer press/media usage terms before approval.",
    usage_terms:
      "Not approved for publish until an EVFAKTA editor confirms license and model identity.",
  };
}
