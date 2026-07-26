import type { AdminCar } from "@/lib/admin/types";

export const FIELD_REVIEW_CONFIDENCE_THRESHOLD = 0.9;

export type FieldReviewStatus = "pending" | "approved" | "rejected";

export type FieldSourceMeta = {
  source_name?: string | null;
  source_url?: string | null;
  imported_at?: string | null;
  import_job_id?: string | null;
  research_job_id?: string | null;
  confidence?: number | null;
  retrieved_at?: string | null;
  data_last_checked_at?: string | null;
  review_status?: FieldReviewStatus | null;
  draft?: boolean | null;
  notes?: string | null;
};

export type FieldReviewValueType = "text" | "number" | "boolean" | "list";

export type FieldReviewCard = {
  fieldKey: string;
  label: string;
  value: unknown;
  displayValue: string;
  valueType: FieldReviewValueType;
  sourceName: string | null;
  sourceUrl: string | null;
  confidence: number | null;
  lastChecked: string | null;
  reviewStatus: FieldReviewStatus;
  lowConfidence: boolean;
  isDraft: boolean;
};

/** Spec / editorial fields shown in the field review queue. */
export const FIELD_REVIEW_DEFS: Array<{
  key: keyof AdminCar & string;
  label: string;
  valueType: FieldReviewValueType;
}> = [
  { key: "year", label: "Year", valueType: "number" },
  { key: "price_nok", label: "Price (NOK)", valueType: "number" },
  { key: "range_km", label: "Range (WLTP)", valueType: "number" },
  { key: "winter_range_km", label: "Winter range", valueType: "number" },
  { key: "real_world_range_km", label: "Real-world range", valueType: "number" },
  { key: "battery_kwh", label: "Battery (legacy)", valueType: "number" },
  { key: "battery_total_kwh", label: "Battery total", valueType: "number" },
  { key: "battery_usable_kwh", label: "Battery usable", valueType: "number" },
  { key: "battery_chemistry", label: "Battery chemistry", valueType: "text" },
  { key: "consumption_kwh_100km", label: "Consumption", valueType: "number" },
  { key: "dc_charging_kw", label: "DC charging", valueType: "number" },
  { key: "ac_charging_kw", label: "AC charging", valueType: "number" },
  { key: "charge_time_10_80_minutes", label: "Charge 10–80 min", valueType: "number" },
  { key: "charging_connector_ac", label: "AC connector", valueType: "text" },
  { key: "charging_connector_dc", label: "DC connector", valueType: "text" },
  { key: "drivetrain", label: "Drivetrain", valueType: "text" },
  { key: "power_hp", label: "Power (hp)", valueType: "number" },
  { key: "torque_nm", label: "Torque", valueType: "number" },
  { key: "acceleration_0_100", label: "0–100", valueType: "number" },
  { key: "top_speed_kmh", label: "Top speed", valueType: "number" },
  { key: "seats", label: "Seats", valueType: "number" },
  { key: "cargo_l", label: "Cargo", valueType: "number" },
  { key: "frunk_l", label: "Frunk", valueType: "number" },
  { key: "towing_kg", label: "Towing", valueType: "number" },
  { key: "length_mm", label: "Length", valueType: "number" },
  { key: "width_mm", label: "Width", valueType: "number" },
  { key: "height_mm", label: "Height", valueType: "number" },
  { key: "wheelbase_mm", label: "Wheelbase", valueType: "number" },
  { key: "curb_weight_kg", label: "Curb weight", valueType: "number" },
  { key: "gross_weight_kg", label: "Gross weight", valueType: "number" },
  { key: "vehicle_type", label: "Vehicle type", valueType: "text" },
  { key: "body_style", label: "Body style", valueType: "text" },
  { key: "warranty", label: "Warranty", valueType: "text" },
  { key: "heat_pump", label: "Heat pump", valueType: "boolean" },
  { key: "variant", label: "Variant", valueType: "text" },
  { key: "trim_level", label: "Trim", valueType: "text" },
  { key: "description", label: "Description", valueType: "text" },
  { key: "pros", label: "Pros", valueType: "list" },
  { key: "cons", label: "Cons", valueType: "list" },
  { key: "suitable_for", label: "Suitable for", valueType: "list" },
  { key: "source_name", label: "Source name", valueType: "text" },
  { key: "source_url", label: "Source URL", valueType: "text" },
];

function hasDisplayValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.some((item) => String(item ?? "").trim());
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

export function formatFieldReviewValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const items = value.map(String).map((item) => item.trim()).filter(Boolean);
    return items.length ? items.join(" · ") : "—";
  }
  return String(value);
}

export function readFieldSource(
  car: AdminCar,
  fieldKey: string,
): FieldSourceMeta | null {
  const sources = car.field_sources as Record<string, FieldSourceMeta> | null;
  const entry = sources?.[fieldKey];
  return entry && typeof entry === "object" ? entry : null;
}

function confidenceSortKey(confidence: number | null): number {
  // Lowest confidence first; missing confidence sorts as 0.
  if (confidence == null || !Number.isFinite(confidence)) return 0;
  return confidence;
}

/**
 * Build the field review queue for a car.
 * Includes populated fields and any field with provenance metadata.
 * Sorted by lowest confidence first.
 */
export function buildFieldReviewQueue(car: AdminCar): FieldReviewCard[] {
  const sources = (car.field_sources as Record<string, FieldSourceMeta> | null) ?? {};
  const cards: FieldReviewCard[] = [];

  for (const def of FIELD_REVIEW_DEFS) {
    const value = car[def.key];
    const meta = sources[def.key] ?? null;
    const hasValue = hasDisplayValue(value);
    const hasMeta = Boolean(meta);

    if (!hasValue && !hasMeta) continue;

    const confidence =
      typeof meta?.confidence === "number" && Number.isFinite(meta.confidence)
        ? meta.confidence
        : null;
    const lastChecked =
      meta?.data_last_checked_at ||
      meta?.retrieved_at ||
      meta?.imported_at ||
      car.data_last_checked_at ||
      null;
    const reviewStatus: FieldReviewStatus =
      meta?.review_status === "approved" || meta?.review_status === "rejected"
        ? meta.review_status
        : "pending";

    cards.push({
      fieldKey: def.key,
      label: def.label,
      value,
      displayValue: formatFieldReviewValue(value),
      valueType: def.valueType,
      sourceName: meta?.source_name ?? car.source_name ?? null,
      sourceUrl: meta?.source_url ?? car.source_url ?? null,
      confidence,
      lastChecked,
      reviewStatus,
      lowConfidence:
        confidence == null || confidence < FIELD_REVIEW_CONFIDENCE_THRESHOLD,
      isDraft: Boolean(meta?.draft),
    });
  }

  cards.sort((a, b) => {
    const confDiff = confidenceSortKey(a.confidence) - confidenceSortKey(b.confidence);
    if (confDiff !== 0) return confDiff;
    // Pending before approved/rejected when confidence ties.
    const statusRank = { pending: 0, rejected: 1, approved: 2 } as const;
    const statusDiff = statusRank[a.reviewStatus] - statusRank[b.reviewStatus];
    if (statusDiff !== 0) return statusDiff;
    return a.label.localeCompare(b.label, "en");
  });

  return cards;
}

export function parseFieldReviewEditValue(
  valueType: FieldReviewValueType,
  raw: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  const trimmed = raw.trim();

  if (valueType === "text") {
    return { ok: true, value: trimmed || null };
  }

  if (valueType === "list") {
    const items = trimmed
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    return { ok: true, value: items.length ? items : null };
  }

  if (valueType === "boolean") {
    const lower = trimmed.toLowerCase();
    if (!lower) return { ok: true, value: null };
    if (["true", "yes", "ja", "1"].includes(lower)) return { ok: true, value: true };
    if (["false", "no", "nei", "0"].includes(lower)) return { ok: true, value: false };
    return { ok: false, error: "Use yes/no for boolean fields." };
  }

  // number
  if (!trimmed) return { ok: true, value: null };
  const normalized = trimmed.replace(",", ".");
  const num = Number(normalized);
  if (!Number.isFinite(num)) {
    return { ok: false, error: "Invalid number." };
  }
  return { ok: true, value: num };
}
