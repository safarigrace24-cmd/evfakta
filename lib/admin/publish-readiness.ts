import { EDITORIAL_DRAFT_MARKER } from "@/lib/admin/editorial-assist-core";
import type { AdminCar, AdminCarWrite } from "@/lib/admin/types";

export type PublishIssue = {
  code: string;
  message: string;
};

export type GalleryImageRef = {
  image_type: string;
  is_primary: boolean;
};

export type PublishReadinessInput = Pick<
  AdminCar | AdminCarWrite,
  | "brand"
  | "model"
  | "slug"
  | "description"
  | "image_url"
  | "source_name"
  | "source_url"
  | "data_last_checked_at"
  | "import_status"
> & {
  pros?: string[] | null;
  cons?: string[] | null;
  suitable_for?: string[] | null;
  score_notes?: string | null;
  has_gallery_image?: boolean;
  gallery_images?: GalleryImageRef[];
  /** Review Assistant completion % — Launch/Publish Ready require ≥95 when provided. */
  completion_percent?: number | null;
};

export type PublishReadinessOptions = {
  /**
   * When true (default), import_status must be approved.
   * Set false for content launch checklist / production dashboard content gates.
   */
  requireApproved?: boolean;
  /** Override default 95% completion floor when completion_percent is provided. */
  minCompletionPercent?: number;
};

const MIN_SEO_DESCRIPTION_CHARS = 40;
export const MIN_LAUNCH_COMPLETION_PERCENT = 95;

export function containsEditorialDraftMarker(value: unknown): boolean {
  if (typeof value === "string") {
    return value.includes(EDITORIAL_DRAFT_MARKER);
  }
  if (Array.isArray(value)) {
    return value.some(
      (item) => typeof item === "string" && item.includes(EDITORIAL_DRAFT_MARKER),
    );
  }
  return false;
}

function galleryList(car: PublishReadinessInput): GalleryImageRef[] {
  return Array.isArray(car.gallery_images) ? car.gallery_images : [];
}

export function hasApprovedHeroImage(car: PublishReadinessInput): boolean {
  const gallery = galleryList(car);
  return gallery.some((image) => image.is_primary) || Boolean(car.image_url?.trim());
}

export function hasApprovedFrontImage(car: PublishReadinessInput): boolean {
  return galleryList(car).some((image) => image.image_type === "front");
}

export function hasApprovedSideImage(car: PublishReadinessInput): boolean {
  return galleryList(car).some((image) => image.image_type === "side");
}

/** SEO fields required for a publishable / public model page. */
export function getSeoPublishIssues(car: PublishReadinessInput): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const titleBrand = car.brand?.trim() ?? "";
  const titleModel = car.model?.trim() ?? "";
  const slug = car.slug?.trim() ?? "";
  const description = car.description?.trim() ?? "";

  if (!titleBrand || !titleModel) {
    issues.push({
      code: "seo_title",
      message: "SEO-tittel mangler (merke + modell).",
    });
  }
  if (!slug) {
    issues.push({ code: "seo_slug", message: "SEO canonical slug mangler." });
  }
  if (!description) {
    issues.push({ code: "seo_description", message: "SEO-beskrivelse mangler." });
  } else if (description.length < MIN_SEO_DESCRIPTION_CHARS) {
    issues.push({
      code: "seo_description_short",
      message: `SEO-beskrivelse er for kort (minst ${MIN_SEO_DESCRIPTION_CHARS} tegn).`,
    });
  }
  if (containsEditorialDraftMarker(description)) {
    issues.push({
      code: "seo_description_draft",
      message: "SEO-beskrivelse inneholder utkast-markering og kan ikke publiseres.",
    });
  }
  if (!hasApprovedHeroImage(car)) {
    issues.push({
      code: "seo_image",
      message: "SEO/Open Graph-bilde mangler (godkjent hero / image_url).",
    });
  }

  return issues;
}

/**
 * Hard publish gates for the rebuild.
 * Does not auto-publish; callers must still set is_published manually.
 */
export function getPublishIssues(
  car: PublishReadinessInput,
  options: PublishReadinessOptions = {},
): PublishIssue[] {
  const requireApproved = options.requireApproved !== false;
  const issues: PublishIssue[] = [];
  const gallery = galleryList(car);
  const hasGallery = Boolean(car.has_gallery_image) || gallery.length > 0;
  const description = car.description?.trim() ?? "";

  if (!car.brand?.trim()) {
    issues.push({ code: "brand", message: "Merkenavn mangler." });
  }
  if (!car.model?.trim()) {
    issues.push({ code: "model", message: "Modellnavn mangler." });
  }
  if (!car.slug?.trim()) {
    issues.push({ code: "slug", message: "Slug mangler." });
  }
  if (!description) {
    issues.push({ code: "description", message: "Beskrivelse mangler." });
  } else if (description.length < MIN_SEO_DESCRIPTION_CHARS) {
    issues.push({
      code: "seo_description_short",
      message: `SEO-beskrivelse er for kort (minst ${MIN_SEO_DESCRIPTION_CHARS} tegn).`,
    });
  }

  if (
    containsEditorialDraftMarker(car.description) ||
    containsEditorialDraftMarker(car.pros) ||
    containsEditorialDraftMarker(car.cons) ||
    containsEditorialDraftMarker(car.suitable_for) ||
    containsEditorialDraftMarker(car.score_notes)
  ) {
    issues.push({
      code: "editorial_draft",
      message: `Utkast-markering («${EDITORIAL_DRAFT_MARKER}») må fjernes før publisering.`,
    });
  }

  if (!hasApprovedHeroImage(car)) {
    issues.push({
      code: "hero_image",
      message: "Godkjent hero-bilde mangler (primary galleri eller image_url).",
    });
  }
  if (!hasApprovedFrontImage(car)) {
    issues.push({
      code: "front_image",
      message: "Godkjent front-bilde mangler i galleriet.",
    });
  }
  if (!hasApprovedSideImage(car)) {
    issues.push({
      code: "side_image",
      message: "Godkjent side-bilde mangler i galleriet.",
    });
  }

  if (!car.image_url?.trim() && !hasGallery) {
    issues.push({
      code: "image",
      message: "Bilde mangler (bildebane eller galleri).",
    });
  }

  if (!car.source_name?.trim() && !car.source_url?.trim()) {
    issues.push({ code: "source", message: "Kilde (navn eller URL) mangler." });
  }
  if (!car.data_last_checked_at) {
    issues.push({ code: "checked", message: "Sist sjekket-dato mangler." });
  }
  if (requireApproved && car.import_status !== "approved") {
    issues.push({
      code: "import_status",
      message: "Bilen må være godkjent før publisering (godkjenning ≠ publisering).",
    });
  }

  const minCompletion =
    options.minCompletionPercent ?? MIN_LAUNCH_COMPLETION_PERCENT;
  if (
    typeof car.completion_percent === "number" &&
    Number.isFinite(car.completion_percent) &&
    car.completion_percent < minCompletion
  ) {
    issues.push({
      code: "completion_below_threshold",
      message: `Fullføringsgrad ${Math.round(car.completion_percent)}% er under kravet på ${minCompletion}% for Launch Ready / Publish Ready.`,
    });
  }

  return issues;
}

/** Content launch readiness — same as publish gates minus approval requirement. */
export function getLaunchContentIssues(car: PublishReadinessInput): PublishIssue[] {
  return getPublishIssues(car, { requireApproved: false });
}

export function formatPublishIssues(issues: PublishIssue[]): string {
  if (issues.length === 0) return "";
  return `Kan ikke publisere: ${issues.map((issue) => issue.message).join(" ")}`;
}
