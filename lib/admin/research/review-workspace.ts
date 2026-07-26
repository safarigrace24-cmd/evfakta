/**
 * Pure helpers for the research review workspace UI.
 * Does not touch DB or change research pipeline persistence rules.
 */

import type {
  ResearchCandidateStatus,
  ResearchFieldCandidate,
  ResearchImageCandidate,
  ResearchItem,
} from "@/lib/admin/research/types";

export const RESEARCH_REVIEW_HIGH_CONFIDENCE = 0.9;

export type ResearchReviewCategoryId =
  | "identity"
  | "battery"
  | "range"
  | "charging"
  | "performance"
  | "dimensions"
  | "practical"
  | "equipment"
  | "warranty"
  | "editorial"
  | "sources"
  | "images"
  | "variants";

export type ResearchReviewCategoryDef = {
  id: ResearchReviewCategoryId;
  label: string;
  fieldKeys: string[];
};

export const RESEARCH_REVIEW_CATEGORIES: ResearchReviewCategoryDef[] = [
  {
    id: "identity",
    label: "Identitet",
    fieldKeys: [
      "brand",
      "model",
      "slug",
      "year",
      "vehicle_type",
      "body_style",
      "variant",
      "trim_level",
      "model_generation",
    ],
  },
  {
    id: "battery",
    label: "Batteri",
    fieldKeys: [
      "battery_kwh",
      "battery_total_kwh",
      "battery_usable_kwh",
      "battery_chemistry",
    ],
  },
  {
    id: "range",
    label: "Rekkevidde",
    fieldKeys: [
      "range_km",
      "winter_range_km",
      "real_world_range_km",
      "consumption_kwh_100km",
    ],
  },
  {
    id: "charging",
    label: "Lading",
    fieldKeys: [
      "ac_charging_kw",
      "dc_charging_kw",
      "charge_time_10_80_minutes",
      "charging_connector_ac",
      "charging_connector_dc",
    ],
  },
  {
    id: "performance",
    label: "Ytelse",
    fieldKeys: [
      "drivetrain",
      "power_hp",
      "torque_nm",
      "acceleration_0_100",
      "top_speed_kmh",
    ],
  },
  {
    id: "dimensions",
    label: "Dimensjoner",
    fieldKeys: [
      "length_mm",
      "width_mm",
      "height_mm",
      "wheelbase_mm",
      "curb_weight_kg",
      "gross_weight_kg",
    ],
  },
  {
    id: "practical",
    label: "Praktisk",
    fieldKeys: ["seats", "cargo_l", "frunk_l", "towing_kg"],
  },
  {
    id: "equipment",
    label: "Utstyr",
    fieldKeys: [
      "heat_pump",
      "v2l",
      "v2g",
      "apple_carplay",
      "android_auto",
      "head_up_display",
      "panoramic_roof",
      "ota_updates",
    ],
  },
  {
    id: "warranty",
    label: "Garanti",
    fieldKeys: ["warranty"],
  },
  {
    id: "editorial",
    label: "Redaksjonelt",
    fieldKeys: ["description", "pros", "cons", "suitable_for"],
  },
  {
    id: "sources",
    label: "Kilder",
    fieldKeys: [
      "source_name",
      "source_url",
      "source_updated_at",
      "data_last_checked_at",
    ],
  },
  {
    id: "images",
    label: "Bilder",
    fieldKeys: [],
  },
  {
    id: "variants",
    label: "Varianter",
    fieldKeys: [],
  },
];

/** Norwegian human-readable labels for research field keys. */
export const RESEARCH_FIELD_LABELS_NO: Record<string, string> = {
  brand: "Merke",
  model: "Modell",
  slug: "Slug",
  year: "Årsmodell",
  vehicle_type: "Kjøretøytype",
  body_style: "Karosseri",
  variant: "Variant",
  trim_level: "Trim",
  model_generation: "Generasjon",
  battery_kwh: "Batteri (legacy)",
  battery_total_kwh: "Batterikapasitet totalt",
  battery_usable_kwh: "Brukbar batterikapasitet",
  battery_chemistry: "Batterikjemi",
  range_km: "Rekkevidde (WLTP)",
  winter_range_km: "Vinterrekkevidde",
  real_world_range_km: "Realistisk rekkevidde",
  consumption_kwh_100km: "Forbruk",
  ac_charging_kw: "Maks AC-lading",
  dc_charging_kw: "Maks DC-lading",
  charge_time_10_80_minutes: "Ladetid 10–80 %",
  charging_connector_ac: "AC-kontakt",
  charging_connector_dc: "DC-kontakt",
  drivetrain: "Drivlinje",
  power_hp: "Effekt",
  torque_nm: "Moment",
  acceleration_0_100: "0–100 km/t",
  top_speed_kmh: "Toppfart",
  length_mm: "Lengde",
  width_mm: "Bredde",
  height_mm: "Høyde",
  wheelbase_mm: "Akselavstand",
  curb_weight_kg: "Egenvekt",
  gross_weight_kg: "Totalvekt",
  seats: "Seter",
  cargo_l: "Bagasjerom",
  frunk_l: "Frunk",
  towing_kg: "Tillatt tilhengervekt",
  heat_pump: "Varmepumpe",
  v2l: "V2L",
  v2g: "V2G",
  apple_carplay: "Apple CarPlay",
  android_auto: "Android Auto",
  head_up_display: "Head-up-display",
  panoramic_roof: "Panoramatak",
  ota_updates: "OTA-oppdateringer",
  warranty: "Garanti",
  description: "Beskrivelse",
  pros: "Fordeler",
  cons: "Ulemper",
  suitable_for: "Passer for",
  source_name: "Kildenavn",
  source_url: "Kilde-URL",
  source_updated_at: "Kilde oppdatert",
  data_last_checked_at: "Sist sjekket",
  price_nok: "Pris",
};

export function researchFieldLabel(fieldKey: string): string {
  return RESEARCH_FIELD_LABELS_NO[fieldKey] ?? fieldKey.replace(/_/g, " ");
}

const FIELD_TO_CATEGORY = new Map<string, ResearchReviewCategoryId>();
for (const category of RESEARCH_REVIEW_CATEGORIES) {
  for (const key of category.fieldKeys) {
    FIELD_TO_CATEGORY.set(key, category.id);
  }
}

export type ResearchVariantScope =
  | { kind: "base" }
  | { kind: "variant"; slug: string; name: string };

export type ResearchReviewFilter =
  | "all"
  | "conflicts"
  | "low_confidence"
  | "pending"
  | "approved"
  | "rejected";

export type ResearchCategoryCounts = {
  approved: number;
  pending: number;
  conflict: number;
  missing: number;
  rejected: number;
  totalCandidates: number;
};

export type ResearchCategoryStatusTone = "green" | "yellow" | "red";

export type ResearchConflictGroup = {
  key: string;
  fieldKey: string;
  entityType: "car" | "variant";
  variantSlug: string | null;
  options: ResearchFieldCandidate[];
};

export type ResearchReviewSummary = {
  title: string;
  approved: number;
  pending: number;
  conflicts: number;
  missing: number;
  images: number;
  imagesPending: number;
  rejected: number;
  completionPercent: number;
  ready: boolean;
};

export function categoryForFieldKey(
  fieldKey: string,
): ResearchReviewCategoryId {
  return FIELD_TO_CATEGORY.get(fieldKey) ?? "identity";
}

export function isOfficialResearchSource(
  sourceName: string | null | undefined,
  sourceUrl: string | null | undefined,
): boolean {
  const text = `${sourceName ?? ""} ${sourceUrl ?? ""}`.toLowerCase();
  if (!text.trim()) return false;
  if (
    /secondary|evkx|ev-database|evdatabase|elbilradar|blog|aggregator/.test(
      text,
    )
  ) {
    return false;
  }
  return /tesla\.com|owner'?s manual|offisiell|official|manufacturer|tesla norge|produsent/.test(
    text,
  );
}

export function isLowConfidence(
  confidence: number | null | undefined,
  threshold = RESEARCH_REVIEW_HIGH_CONFIDENCE,
): boolean {
  if (confidence == null || !Number.isFinite(confidence)) return true;
  return confidence < threshold;
}

export function isPreviewableImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (!/^https?:$/i.test(parsed.protocol)) return false;
  } catch {
    return false;
  }
  if (/\.(pdf)(\?|#|$)/i.test(trimmed)) return false;
  if (/\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(trimmed)) return true;
  // Explicit media hosts / paths — still only if not an HTML product page.
  if (/\/model\d?(\/|$|\?)/i.test(trimmed) && !/\.(png|jpe?g|webp)/i.test(trimmed)) {
    return false;
  }
  if (/ownersmanual|\.html?(\?|#|$)|\/support\//i.test(trimmed)) return false;
  return false;
}

export function labelImageCandidate(image: ResearchImageCandidate): {
  kind: "image" | "source_page";
  label: string;
} {
  if (isPreviewableImageUrl(image.original_url)) {
    return { kind: "image", label: "Image candidate" };
  }
  return {
    kind: "source_page",
    label: "Source page — manual image selection required",
  };
}

export function listVariantScopes(
  item: ResearchItem,
  fields: ResearchFieldCandidate[],
): ResearchVariantScope[] {
  const scopes: ResearchVariantScope[] = [{ kind: "base" }];
  const seen = new Set<string>();

  const proposed = Array.isArray(item.proposed_variants)
    ? item.proposed_variants
    : [];
  for (const variant of proposed) {
    const slug = String(
      (variant as { slug?: string }).slug ?? "",
    ).trim();
    const name = String(
      (variant as { name?: string }).name ?? slug,
    ).trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    scopes.push({ kind: "variant", slug, name: name || slug });
  }

  for (const field of fields) {
    if (field.entity_type !== "variant" || !field.variant_slug) continue;
    if (seen.has(field.variant_slug)) continue;
    seen.add(field.variant_slug);
    scopes.push({
      kind: "variant",
      slug: field.variant_slug,
      name: field.variant_slug,
    });
  }

  return scopes;
}

export function fieldsForScope(
  fields: ResearchFieldCandidate[],
  scope: ResearchVariantScope,
): ResearchFieldCandidate[] {
  if (scope.kind === "base") {
    return fields.filter((field) => field.entity_type === "car");
  }
  return fields.filter(
    (field) =>
      field.entity_type === "variant" && field.variant_slug === scope.slug,
  );
}

export function groupConflicts(
  fields: ResearchFieldCandidate[],
): ResearchConflictGroup[] {
  const map = new Map<string, ResearchFieldCandidate[]>();

  for (const field of fields) {
    if (field.status !== "conflict" && !field.conflict_group) continue;
    const key =
      field.conflict_group ||
      `${field.entity_type}:${field.variant_slug ?? "car"}:${field.field_key}`;
    const list = map.get(key) ?? [];
    list.push(field);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([key, options]) => ({
      key,
      fieldKey: options[0]?.field_key ?? key,
      entityType: options[0]?.entity_type ?? "car",
      variantSlug: options[0]?.variant_slug ?? null,
      options: [...options].sort(
        (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0),
      ),
    }))
    .filter((group) => group.options.length > 0)
    .sort((a, b) => a.fieldKey.localeCompare(b.fieldKey));
}

export function countCategory(
  category: ResearchReviewCategoryDef,
  fields: ResearchFieldCandidate[],
  missingFields: string[],
  images: ResearchImageCandidate[],
): ResearchCategoryCounts {
  if (category.id === "images") {
    const approved = images.filter((image) => image.status === "approved").length;
    const rejected = images.filter((image) => image.status === "rejected").length;
    const pending = images.filter(
      (image) => image.status === "pending",
    ).length;
    return {
      approved,
      pending,
      conflict: 0,
      missing: images.length === 0 ? 1 : 0,
      rejected,
      totalCandidates: images.length,
    };
  }

  if (category.id === "variants") {
    const variantFields = fields.filter((field) => field.entity_type === "variant");
    return {
      approved: variantFields.filter((field) => field.status === "approved").length,
      pending: variantFields.filter((field) => field.status === "pending").length,
      conflict: variantFields.filter((field) => field.status === "conflict").length,
      missing: 0,
      rejected: variantFields.filter((field) => field.status === "rejected").length,
      totalCandidates: variantFields.length,
    };
  }

  const scoped = fields.filter(
    (field) => categoryForFieldKey(field.field_key) === category.id,
  );
  const missing = missingFields.filter(
    (key) => categoryForFieldKey(key) === category.id,
  );

  return {
    approved: scoped.filter((field) => field.status === "approved").length,
    pending: scoped.filter((field) => field.status === "pending").length,
    conflict: scoped.filter((field) => field.status === "conflict").length,
    missing: missing.length,
    rejected: scoped.filter((field) => field.status === "rejected").length,
    totalCandidates: scoped.length,
  };
}

export function categoryTone(
  counts: ResearchCategoryCounts,
): ResearchCategoryStatusTone {
  if (counts.conflict > 0 || counts.missing > 0) return "red";
  if (counts.pending > 0) return "yellow";
  return "green";
}

export function sortReviewFields(
  fields: ResearchFieldCandidate[],
): ResearchFieldCandidate[] {
  const statusRank: Record<ResearchCandidateStatus, number> = {
    conflict: 0,
    pending: 2,
    approved: 3,
    rejected: 4,
    applied: 5,
  };

  return [...fields].sort((a, b) => {
    const aConflict = a.status === "conflict" ? 0 : 1;
    const bConflict = b.status === "conflict" ? 0 : 1;
    if (aConflict !== bConflict) return aConflict - bConflict;

    const aLow = isLowConfidence(a.confidence) ? 0 : 1;
    const bLow = isLowConfidence(b.confidence) ? 0 : 1;
    if (aLow !== bLow) return aLow - bLow;

    const aStatus = statusRank[a.status] ?? 9;
    const bStatus = statusRank[b.status] ?? 9;
    if (aStatus !== bStatus) return aStatus - bStatus;

    const confDiff = (a.confidence ?? 0) - (b.confidence ?? 0);
    if (confDiff !== 0) return confDiff;
    return a.field_key.localeCompare(b.field_key);
  });
}

export function filterReviewFields(
  fields: ResearchFieldCandidate[],
  filter: ResearchReviewFilter,
): ResearchFieldCandidate[] {
  switch (filter) {
    case "conflicts":
      return fields.filter((field) => field.status === "conflict");
    case "low_confidence":
      return fields.filter(
        (field) =>
          field.status !== "approved" &&
          field.status !== "rejected" &&
          isLowConfidence(field.confidence),
      );
    case "pending":
      return fields.filter((field) => field.status === "pending");
    case "approved":
      return fields.filter((field) => field.status === "approved");
    case "rejected":
      return fields.filter((field) => field.status === "rejected");
    default:
      return fields;
  }
}

export function fieldsInCategory(
  fields: ResearchFieldCandidate[],
  categoryId: ResearchReviewCategoryId,
): ResearchFieldCandidate[] {
  if (categoryId === "images" || categoryId === "variants") return [];
  return fields.filter(
    (field) => categoryForFieldKey(field.field_key) === categoryId,
  );
}

export function missingFieldsByCategory(
  missingFields: string[],
): Record<ResearchReviewCategoryId, string[]> {
  const result = Object.fromEntries(
    RESEARCH_REVIEW_CATEGORIES.map((category) => [category.id, [] as string[]]),
  ) as Record<ResearchReviewCategoryId, string[]>;

  for (const key of missingFields) {
    const categoryId = categoryForFieldKey(key);
    result[categoryId].push(key);
  }
  return result;
}

export function computeResearchReviewSummary(input: {
  item: ResearchItem;
  fields: ResearchFieldCandidate[];
  images: ResearchImageCandidate[];
}): ResearchReviewSummary {
  const { item, fields, images } = input;
  const approved = fields.filter((field) => field.status === "approved").length;
  const pending = fields.filter((field) => field.status === "pending").length;
  const conflicts = fields.filter((field) => field.status === "conflict").length;
  const rejected = fields.filter((field) => field.status === "rejected").length;
  const missing = item.missing_fields?.length ?? 0;
  const imagesPending = images.filter((image) => image.status === "pending").length;
  const actionable = approved + pending + conflicts + missing;
  const completionPercent =
    actionable === 0
      ? 100
      : Math.round((approved / Math.max(actionable, 1)) * 100);

  const ready =
    conflicts === 0 &&
    pending === 0 &&
    missing === 0 &&
    imagesPending === 0 &&
    (item.decision === "approved" || approved > 0);

  return {
    title: `${item.brand ?? ""} ${item.model ?? ""}`.trim() || item.slug || "Model",
    approved,
    pending,
    conflicts,
    missing,
    images: images.length,
    imagesPending,
    rejected,
    completionPercent,
    ready,
  };
}

export function canBulkApproveField(field: ResearchFieldCandidate): boolean {
  if (field.status === "conflict") return false;
  if (field.status === "approved" || field.status === "rejected") return false;
  if (field.status === "applied") return false;
  if (isLowConfidence(field.confidence)) return false;
  if (!isOfficialResearchSource(field.source_name, field.source_url)) {
    return false;
  }
  return true;
}

export function canBulkRejectAsSecondaryLowConfidence(
  field: ResearchFieldCandidate,
): boolean {
  if (field.status === "conflict") return false;
  if (field.status !== "pending") return false;
  if (!isLowConfidence(field.confidence)) return false;
  if (isOfficialResearchSource(field.source_name, field.source_url)) {
    return false;
  }
  return true;
}

export function firstIncompleteCategory(input: {
  fields: ResearchFieldCandidate[];
  missingFields: string[];
  images: ResearchImageCandidate[];
}): ResearchReviewCategoryId {
  for (const category of RESEARCH_REVIEW_CATEGORIES) {
    const counts = countCategory(
      category,
      input.fields,
      input.missingFields,
      input.images,
    );
    if (counts.conflict > 0 || counts.pending > 0 || counts.missing > 0) {
      return category.id;
    }
  }
  return "identity";
}

export type ResearchQueueItem =
  | {
      kind: "conflict";
      id: string;
      fieldKey: string;
      options: ResearchFieldCandidate[];
    }
  | {
      kind: "field";
      id: string;
      field: ResearchFieldCandidate;
    }
  | {
      kind: "image";
      id: string;
      image: ResearchImageCandidate;
    }
  | {
      kind: "missing";
      id: string;
      fieldKey: string;
    };

export function isUnresolvedQueueItem(item: ResearchQueueItem): boolean {
  switch (item.kind) {
    case "conflict":
      return item.options.some((option) => option.status === "conflict");
    case "field":
      return item.field.status === "pending" || item.field.status === "conflict";
    case "image":
      return item.image.status === "pending";
    case "missing":
      return true;
    default:
      return false;
  }
}

/** Build one-at-a-time queue for a topic. Conflicts are grouped; missing stay separate. */
export function buildTopicQueue(input: {
  categoryId: ResearchReviewCategoryId;
  fields: ResearchFieldCandidate[];
  missingFields: string[];
  images: ResearchImageCandidate[];
  includeResolved?: boolean;
}): ResearchQueueItem[] {
  const {
    categoryId,
    fields,
    missingFields,
    images,
    includeResolved = true,
  } = input;

  if (categoryId === "variants") {
    return [];
  }

  if (categoryId === "images") {
    const rows = images.map((image) => ({
      kind: "image" as const,
      id: `image:${image.id}`,
      image,
    }));
    return includeResolved
      ? rows
      : rows.filter((row) => isUnresolvedQueueItem(row));
  }

  const categoryFields = fieldsInCategory(fields, categoryId);
  const conflicts = groupConflicts(categoryFields).filter(
    (group) =>
      group.options.length > 1 ||
      group.options.some((option) => option.status === "conflict"),
  );
  const conflictIds = new Set(
    conflicts.flatMap((group) => group.options.map((option) => option.id)),
  );

  const queue: ResearchQueueItem[] = [];

  for (const group of conflicts) {
    queue.push({
      kind: "conflict",
      id: `conflict:${group.key}`,
      fieldKey: group.fieldKey,
      options: group.options,
    });
  }

  const ordinary = sortReviewFields(
    categoryFields.filter((field) => !conflictIds.has(field.id)),
  );
  for (const field of ordinary) {
    if (
      !includeResolved &&
      (field.status === "approved" ||
        field.status === "rejected" ||
        field.status === "applied")
    ) {
      continue;
    }
    queue.push({
      kind: "field",
      id: `field:${field.id}`,
      field,
    });
  }

  const missing = missingFieldsByCategory(missingFields)[categoryId] ?? [];
  for (const fieldKey of missing) {
    queue.push({
      kind: "missing",
      id: `missing:${fieldKey}`,
      fieldKey,
    });
  }

  if (!includeResolved) {
    return queue.filter(isUnresolvedQueueItem);
  }
  return queue;
}

/** Focus mode: unresolved items across all topics for the current scope. */
export function buildFocusQueue(input: {
  fields: ResearchFieldCandidate[];
  missingFields: string[];
  images: ResearchImageCandidate[];
}): ResearchQueueItem[] {
  const queue: ResearchQueueItem[] = [];
  for (const category of RESEARCH_REVIEW_CATEGORIES) {
    if (category.id === "variants") continue;
    queue.push(
      ...buildTopicQueue({
        categoryId: category.id,
        fields: input.fields,
        missingFields: input.missingFields,
        images: input.images,
        includeResolved: false,
      }),
    );
  }
  return queue;
}

export function nextUnresolvedIndex(
  items: ResearchQueueItem[],
  fromIndex: number,
): number {
  if (!items.length) return -1;
  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (fromIndex + offset) % items.length;
    if (isUnresolvedQueueItem(items[index])) return index;
  }
  return -1;
}

export function indexAfterDecision(
  items: ResearchQueueItem[],
  currentIndex: number,
): number {
  const next = nextUnresolvedIndex(items, currentIndex);
  if (next >= 0) return next;
  if (currentIndex >= 0 && currentIndex < items.length) return currentIndex;
  return items.length ? Math.min(currentIndex, items.length - 1) : -1;
}

export function focusProgress(
  items: ResearchQueueItem[],
  currentIndex: number,
): { decided: number; remaining: number; total: number; position: number } {
  const total = items.length;
  const remaining = items.filter(isUnresolvedQueueItem).length;
  const decided = Math.max(total - remaining, 0);
  const position =
    currentIndex >= 0 && total > 0 ? Math.min(currentIndex + 1, total) : 0;
  return { decided, remaining, total, position };
}

export function topicStatusIcon(
  tone: ResearchCategoryStatusTone,
): "complete" | "pending" | "blocked" {
  if (tone === "green") return "complete";
  if (tone === "red") return "blocked";
  return "pending";
}

/** Missing-field checklist action helpers (UI state / item updates). */
export type MissingFieldAction = "research" | "not_available" | "later";

export function applyMissingFieldAction(
  missingFields: string[],
  fieldKey: string,
  action: MissingFieldAction,
): string[] {
  if (action === "not_available") {
    return missingFields.filter((key) => key !== fieldKey);
  }
  // research / later keep the checklist item until editor resolves it.
  return [...missingFields];
}
