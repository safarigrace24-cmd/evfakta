import type { CarImageRow } from "@/lib/admin/car-image-types";
import { computeEditorialCompletion } from "@/lib/admin/editorial-completion";
import {
  computeImageReviewReadiness,
  type ImageReadinessLabel,
} from "@/lib/admin/image-review";
import {
  containsEditorialDraftMarker,
  getLaunchContentIssues,
  getPublishIssues,
} from "@/lib/admin/publish-readiness";
import type { ResearchImageCandidate } from "@/lib/admin/research/types";
import type { AdminCar } from "@/lib/admin/types";
import type { AdminCarVariant } from "@/lib/admin/variant-types";

/** Dashboard-only labels — not DB columns / import_status values. */
export type ProductionStatus =
  | "PUBLISHED"
  | "APPROVED"
  | "READY_FOR_HUMAN_APPROVAL"
  | "NEEDS_REVIEW"
  | "NOT_READY";

export type ProductionBrandHealth = "green" | "amber" | "red";

export type ProductionModelRow = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  importStatus: AdminCar["import_status"];
  isPublished: boolean;
  completionPercent: number;
  editorialPercent: number;
  imagesPercent: number;
  specsPercent: number;
  sourcesPercent: number;
  reviewPercent: number;
  status: ProductionStatus;
  statusLabel: string;
  missingImages: boolean;
  missingSources: boolean;
  missingEditorial: boolean;
  missingVariants: boolean;
  galleryCount: number;
  variantCount: number;
  imageCandidateCount: number;
  imageReadinessLabel: ImageReadinessLabel;
  imagesReady: boolean;
  imagesPending: boolean;
  missingHero: boolean;
  missingGallery: boolean;
  /** Content launch gates (draft + hero/front/side + SEO/source) — excludes approval. */
  launchContentReady: boolean;
  launchBlocked: boolean;
  hasDraftMarker: boolean;
  /** Full publish gate including import_status=approved. */
  publishReady: boolean;
  launchBlockerCodes: string[];
  nextAction: string;
};

export type ProductionBrandRow = {
  brand: string;
  models: number;
  ready: number;
  notReady: number;
  needsReview: number;
  published: number;
  approved: number;
  missingImages: number;
  missingSources: number;
  missingEditorial: number;
  missingVariants: number;
  progressPercent: number;
  health: ProductionBrandHealth;
  statusLabel: string;
};

export type ProductionDashboardStats = {
  brands: number;
  cars: number;
  published: number;
  needsReview: number;
  approved: number;
  readyForHumanApproval: number;
  notReady: number;
  missingImages: number;
  missingSources: number;
  missingEditorial: number;
  missingVariants: number;
  imagesReady: number;
  imagesPending: number;
  missingHero: number;
  missingGallery: number;
  launchContentReady: number;
  launchBlocked: number;
  publishReady: number;
  hasDraftMarker: number;
  overallProgressPercent: number;
};

export type ProductionDashboardFilters = {
  q: string;
  brand: string;
  status:
    | ""
    | ProductionStatus
    | "missing_images"
    | "missing_sources"
    | "missing_editorial"
    | "images_ready"
    | "images_pending"
    | "missing_hero"
    | "missing_gallery"
    | "launch_ready"
    | "launch_blocked"
    | "publish_ready"
    | "has_draft_marker";
};

export const EMPTY_PRODUCTION_FILTERS: ProductionDashboardFilters = {
  q: "",
  brand: "",
  status: "",
};

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  PUBLISHED: "Published",
  APPROVED: "Approved",
  READY_FOR_HUMAN_APPROVAL: "Ready for Human Approval",
  NEEDS_REVIEW: "Needs Review",
  NOT_READY: "Not Ready",
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function hasNumber(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function hasList(value: string[] | null | undefined): boolean {
  return Array.isArray(value) && value.some((item) => hasText(item));
}

function percentFromFlags(flags: boolean[]): number {
  if (flags.length === 0) return 0;
  const done = flags.filter(Boolean).length;
  return Math.round((done / flags.length) * 100);
}

function hasImageType(images: CarImageRow[], type: CarImageRow["image_type"]): boolean {
  return images.some((image) => image.image_type === type);
}

function carOrVariantSpecs(car: AdminCar, variants: AdminCarVariant[]) {
  const battery =
    hasNumber(car.battery_usable_kwh) ||
    hasNumber(car.battery_total_kwh) ||
    hasNumber(car.battery_kwh) ||
    variants.some(
      (v) => hasNumber(v.battery_usable_kwh) || hasNumber(v.battery_total_kwh),
    );
  const range =
    hasNumber(car.range_km) || variants.some((v) => hasNumber(v.range_km));
  const charging =
    hasNumber(car.dc_charging_kw) ||
    hasNumber(car.ac_charging_kw) ||
    hasNumber(car.charge_time_10_80_minutes) ||
    variants.some(
      (v) =>
        hasNumber(v.dc_charging_kw) ||
        hasNumber(v.ac_charging_kw) ||
        hasNumber(v.charge_time_10_80_minutes),
    );
  const performance =
    hasNumber(car.power_hp) ||
    hasNumber(car.acceleration_0_100) ||
    hasText(car.drivetrain) ||
    variants.some(
      (v) =>
        hasNumber(v.power_hp) ||
        hasNumber(v.acceleration_0_100) ||
        hasText(v.drivetrain),
    );
  const dimensions =
    hasNumber(car.length_mm) ||
    hasNumber(car.width_mm) ||
    hasNumber(car.height_mm) ||
    hasNumber(car.wheelbase_mm);

  return { battery, range, charging, performance, dimensions };
}

/**
 * Derive production readiness for the dashboard.
 * Does not change import_status or publishing rules.
 */
export function deriveProductionStatus(input: {
  car: AdminCar;
  images: CarImageRow[];
  variants: AdminCarVariant[];
  imageCandidateCount?: number;
}): ProductionStatus {
  const { car, images, variants, imageCandidateCount = 0 } = input;

  if (car.is_published) return "PUBLISHED";
  if (car.import_status === "approved") return "APPROVED";

  const hasIdentity = hasText(car.brand) && hasText(car.model);
  const hasSources =
    (hasText(car.source_name) || hasText(car.source_url)) &&
    Boolean(car.data_last_checked_at);
  const hasEditorial =
    hasText(car.description) && hasList(car.pros) && hasList(car.cons);
  const specs = carOrVariantSpecs(car, variants);
  const hasImportantSpecs = specs.battery && specs.range && specs.charging;
  const hasMediaSignal =
    hasText(car.image_url) || images.length > 0 || imageCandidateCount > 0;

  const ready =
    hasIdentity &&
    hasSources &&
    hasEditorial &&
    hasImportantSpecs &&
    hasMediaSignal &&
    car.import_status === "needs_review";

  if (ready) return "READY_FOR_HUMAN_APPROVAL";

  if (car.import_status === "needs_review") return "NEEDS_REVIEW";

  return "NOT_READY";
}

export function computeProductionModelRow(input: {
  car: AdminCar;
  images: CarImageRow[];
  variants: AdminCarVariant[];
  imageCandidateCount?: number;
  imageCandidates?: ResearchImageCandidate[];
}): ProductionModelRow {
  const {
    car,
    images,
    variants,
    imageCandidateCount = 0,
    imageCandidates = [],
  } = input;
  const completion = computeEditorialCompletion({ car, images, variants });
  const specs = carOrVariantSpecs(car, variants);
  const imageReadiness = computeImageReviewReadiness({
    gallery: images,
    candidates: imageCandidates,
    carImageUrl: car.image_url,
  });
  const resolvedCandidateCount =
    imageCandidateCount || imageCandidates.length;

  const editorialPercent = percentFromFlags([
    hasText(car.description),
    hasList(car.pros),
    hasList(car.cons),
    hasList(car.suitable_for),
  ]);

  const imagesPercent = percentFromFlags([
    hasImageType(images, "front") || hasText(car.image_url),
    hasImageType(images, "rear") || hasImageType(images, "side"),
    hasImageType(images, "interior"),
    images.length >= 1 || resolvedCandidateCount >= 1,
  ]);

  const specsPercent = percentFromFlags([
    specs.battery,
    specs.range,
    specs.charging,
    specs.performance,
    specs.dimensions,
    hasNumber(car.cargo_l) ||
      hasNumber(car.frunk_l) ||
      hasNumber(car.seats) ||
      hasNumber(car.towing_kg) ||
      variants.some((v) => hasNumber(v.towing_kg)),
  ]);

  const sourcesPercent = percentFromFlags([
    hasText(car.source_name),
    hasText(car.source_url),
    Boolean(car.data_last_checked_at),
  ]);

  const reviewPercent = percentFromFlags([
    car.import_status === "needs_review" || car.import_status === "approved",
    car.import_status === "approved" || car.is_published,
  ]);

  const status = deriveProductionStatus({
    car,
    images,
    variants,
    imageCandidateCount: resolvedCandidateCount,
  });

  const missingImages = images.length === 0 && !hasText(car.image_url);
  const missingSources = !(hasText(car.source_name) || hasText(car.source_url));
  const missingEditorial =
    !hasText(car.description) || !hasList(car.pros) || !hasList(car.cons);

  const galleryRefs = images.map((image) => ({
    image_type: image.image_type,
    is_primary: image.is_primary,
  }));
  const readinessInput = {
    brand: car.brand,
    model: car.model,
    slug: car.slug,
    description: car.description,
    image_url: car.image_url,
    source_name: car.source_name,
    source_url: car.source_url,
    data_last_checked_at: car.data_last_checked_at,
    import_status: car.import_status,
    pros: car.pros,
    cons: car.cons,
    suitable_for: car.suitable_for,
    score_notes: car.score_notes,
    has_gallery_image: images.length > 0,
    gallery_images: galleryRefs,
  };
  const launchIssues = getLaunchContentIssues(readinessInput);
  const publishIssues = getPublishIssues(readinessInput);
  const hasDraftMarker =
    containsEditorialDraftMarker(car.description) ||
    containsEditorialDraftMarker(car.pros) ||
    containsEditorialDraftMarker(car.cons) ||
    containsEditorialDraftMarker(car.suitable_for) ||
    containsEditorialDraftMarker(car.score_notes);
  const launchContentReady = launchIssues.length === 0;
  const launchBlocked = !launchContentReady;
  const publishReady = publishIssues.length === 0;
  const launchBlockerCodes = [...new Set(launchIssues.map((issue) => issue.code))];

  // Prefer production-weighted completion over raw editorial checklist
  // (editorial checklist treats approved as required, which understates ready drafts).
  const completionPercent = Math.round(
    (editorialPercent +
      imagesPercent +
      specsPercent +
      sourcesPercent +
      reviewPercent +
      Math.min(completion.percent, 100)) /
      6,
  );

  let nextAction = "Open Edit";
  if (hasDraftMarker) nextAction = "Rewrite Draft";
  else if (
    launchBlockerCodes.includes("hero_image") ||
    launchBlockerCodes.includes("front_image") ||
    launchBlockerCodes.includes("side_image")
  ) {
    nextAction = "Review Images";
  } else if (missingSources || specsPercent < 40) nextAction = "Open Research";
  else if (imageReadiness.missingHero || !imageReadiness.imagesReady)
    nextAction = "Review Images";
  else if (missingImages) nextAction = "Add Images";
  else if (missingEditorial) nextAction = "Write Editorial";
  else if (publishReady) nextAction = "Publish Queue";
  else if (status === "READY_FOR_HUMAN_APPROVAL") nextAction = "Start Review";
  else if (status === "APPROVED") nextAction = "Clear Launch Gates";
  else if (status === "PUBLISHED") nextAction = "View Car";

  return {
    id: car.id,
    slug: car.slug,
    brand: car.brand,
    model: car.model,
    importStatus: car.import_status,
    isPublished: car.is_published,
    completionPercent,
    editorialPercent,
    imagesPercent,
    specsPercent,
    sourcesPercent,
    reviewPercent,
    status,
    statusLabel: PRODUCTION_STATUS_LABELS[status],
    missingImages,
    missingSources,
    missingEditorial,
    missingVariants: variants.length === 0,
    galleryCount: images.length,
    variantCount: variants.length,
    imageCandidateCount: resolvedCandidateCount,
    imageReadinessLabel: imageReadiness.label,
    imagesReady: imageReadiness.imagesReady,
    imagesPending: !imageReadiness.imagesReady,
    missingHero: imageReadiness.missingHero,
    missingGallery: imageReadiness.missingGallery,
    launchContentReady,
    launchBlocked,
    hasDraftMarker,
    publishReady,
    launchBlockerCodes,
    nextAction,
  };
}

export function computeProductionBrandRows(
  models: ProductionModelRow[],
): ProductionBrandRow[] {
  const byBrand = new Map<string, ProductionModelRow[]>();
  for (const row of models) {
    const key = row.brand || "Unknown";
    const list = byBrand.get(key) ?? [];
    list.push(row);
    byBrand.set(key, list);
  }

  return [...byBrand.entries()]
    .map(([brand, rows]) => {
      const ready = rows.filter((r) => r.status === "READY_FOR_HUMAN_APPROVAL").length;
      const notReady = rows.filter((r) => r.status === "NOT_READY").length;
      const needsReview = rows.filter(
        (r) =>
          r.importStatus === "needs_review" ||
          r.status === "NEEDS_REVIEW" ||
          r.status === "READY_FOR_HUMAN_APPROVAL",
      ).length;
      const published = rows.filter((r) => r.status === "PUBLISHED").length;
      const approved = rows.filter((r) => r.status === "APPROVED").length;
      const missingImages = rows.filter((r) => r.missingImages).length;
      const missingSources = rows.filter((r) => r.missingSources).length;
      const missingEditorial = rows.filter((r) => r.missingEditorial).length;
      const missingVariants = rows.filter((r) => r.missingVariants).length;
      const progressPercent =
        rows.length === 0
          ? 0
          : Math.round(
              rows.reduce((sum, row) => sum + row.completionPercent, 0) / rows.length,
            );

      let health: ProductionBrandHealth = "red";
      if (progressPercent >= 70 && ready + approved + published > 0) health = "green";
      else if (progressPercent >= 35 || needsReview > 0) health = "amber";

      const statusLabel =
        health === "green" ? "Green" : health === "amber" ? "Amber" : "Red";

      return {
        brand,
        models: rows.length,
        ready,
        notReady,
        needsReview,
        published,
        approved,
        missingImages,
        missingSources,
        missingEditorial,
        missingVariants,
        progressPercent,
        health,
        statusLabel,
      };
    })
    .sort((a, b) => b.progressPercent - a.progressPercent || a.brand.localeCompare(b.brand));
}

export function computeProductionDashboardStats(
  models: ProductionModelRow[],
  brandCount: number,
): ProductionDashboardStats {
  const overallProgressPercent =
    models.length === 0
      ? 0
      : Math.round(
          models.reduce((sum, row) => sum + row.completionPercent, 0) / models.length,
        );

  return {
    brands: brandCount,
    cars: models.length,
    published: models.filter((m) => m.status === "PUBLISHED").length,
    needsReview: models.filter((m) => m.importStatus === "needs_review").length,
    approved: models.filter((m) => m.status === "APPROVED").length,
    readyForHumanApproval: models.filter(
      (m) => m.status === "READY_FOR_HUMAN_APPROVAL",
    ).length,
    notReady: models.filter((m) => m.status === "NOT_READY").length,
    missingImages: models.filter((m) => m.missingImages).length,
    missingSources: models.filter((m) => m.missingSources).length,
    missingEditorial: models.filter((m) => m.missingEditorial).length,
    missingVariants: models.filter((m) => m.missingVariants).length,
    imagesReady: models.filter((m) => m.imagesReady).length,
    imagesPending: models.filter((m) => m.imagesPending).length,
    missingHero: models.filter((m) => m.missingHero).length,
    missingGallery: models.filter((m) => m.missingGallery).length,
    launchContentReady: models.filter((m) => m.launchContentReady).length,
    launchBlocked: models.filter((m) => m.launchBlocked).length,
    publishReady: models.filter((m) => m.publishReady).length,
    hasDraftMarker: models.filter((m) => m.hasDraftMarker).length,
    overallProgressPercent,
  };
}

export function filterProductionModels(
  models: ProductionModelRow[],
  filters: ProductionDashboardFilters,
): ProductionModelRow[] {
  const q = filters.q.trim().toLowerCase();

  return models.filter((row) => {
    if (q) {
      const hay = `${row.brand} ${row.model} ${row.slug}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.brand && row.brand !== filters.brand) return false;

    switch (filters.status) {
      case "PUBLISHED":
      case "APPROVED":
      case "READY_FOR_HUMAN_APPROVAL":
      case "NEEDS_REVIEW":
      case "NOT_READY":
        return row.status === filters.status;
      case "missing_images":
        return row.missingImages;
      case "missing_sources":
        return row.missingSources;
      case "missing_editorial":
        return row.missingEditorial;
      case "images_ready":
        return row.imagesReady;
      case "images_pending":
        return row.imagesPending;
      case "missing_hero":
        return row.missingHero;
      case "missing_gallery":
        return row.missingGallery;
      case "launch_ready":
        return row.launchContentReady;
      case "launch_blocked":
        return row.launchBlocked;
      case "publish_ready":
        return row.publishReady;
      case "has_draft_marker":
        return row.hasDraftMarker;
      default:
        return true;
    }
  });
}

export function parseProductionDashboardFilters(
  params: Record<string, string | string[] | undefined>,
): ProductionDashboardFilters {
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? "";

  const statusRaw = first(params.status).trim();
  const allowed = [
    "",
    "PUBLISHED",
    "APPROVED",
    "READY_FOR_HUMAN_APPROVAL",
    "NEEDS_REVIEW",
    "NOT_READY",
    "missing_images",
    "missing_sources",
    "missing_editorial",
    "images_ready",
    "images_pending",
    "missing_hero",
    "missing_gallery",
    "launch_ready",
    "launch_blocked",
    "publish_ready",
    "has_draft_marker",
  ] as const;

  return {
    q: first(params.q).trim(),
    brand: first(params.brand).trim(),
    status: (allowed as readonly string[]).includes(statusRaw)
      ? (statusRaw as ProductionDashboardFilters["status"])
      : "",
  };
}
