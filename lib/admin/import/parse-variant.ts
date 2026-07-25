import type { ImportStatus } from "@/lib/admin/types";
import type { ImportVariantRow } from "@/lib/admin/import/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMPORT_STATUS_VALUES = ["draft", "needs_review", "approved"] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function asNullableString(value: unknown): string | null {
  const text = asString(value);
  return text || null;
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = asString(value).replace(",", ".");
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function asInt(value: unknown): number | null {
  const num = asNumber(value);
  if (num == null) return null;
  return Math.trunc(num);
}

function asBool(value: unknown): boolean | null {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return value;
  const text = asString(value).toLowerCase();
  if (["true", "yes", "y", "1"].includes(text)) return true;
  if (["false", "no", "n", "0"].includes(text)) return false;
  return null;
}

function normalizeVariantStatus(
  raw: string,
  warnings: string[],
  label: string,
): ImportStatus {
  const status = raw.toLowerCase();
  if (!status) return "needs_review";
  if (!(IMPORT_STATUS_VALUES as readonly string[]).includes(status)) {
    warnings.push(`${label}: ugyldig import_status "${raw}" → needs_review`);
    return "needs_review";
  }
  if (status === "approved") {
    warnings.push(`${label}: variant import_status=approved → needs_review`);
    return "needs_review";
  }
  return status as ImportStatus;
}

/** Parse a single variant object (JSON) or map of string fields (CSV). */
export function parseImportVariant(
  raw: unknown,
  label: string,
  warnings: string[],
  errors: string[],
  usedVariantSlugs: Set<string>,
): ImportVariantRow | null {
  const obj = asRecord(raw);
  if (!obj) {
    errors.push(`${label}: forventet variant-objekt.`);
    return null;
  }

  const name =
    asString(obj.name) ||
    asString(obj.variant_name) ||
    asString(obj.variant) ||
    asString(obj.model);
  if (!name) {
    errors.push(`${label}: variantnavn er påkrevd.`);
    return null;
  }

  let slug = asString(obj.slug || obj.variant_slug).toLowerCase();
  if (!slug || !SLUG_PATTERN.test(slug)) {
    const next = slugify(name) || "variant";
    warnings.push(`${label}: variant-slug mangler/ugyldig → "${next}"`);
    slug = next;
  }

  let unique = slug;
  let n = 2;
  while (usedVariantSlugs.has(unique)) {
    unique = `${slug}-${n}`;
    n += 1;
  }
  if (unique !== slug) {
    warnings.push(`${label}: duplikat variant-slug → "${unique}"`);
  }
  usedVariantSlugs.add(unique);

  const status = normalizeVariantStatus(
    asString(obj.import_status),
    warnings,
    label,
  );

  return {
    name,
    slug: unique,
    trim_level: asNullableString(obj.trim_level),
    model_year: asInt(obj.model_year ?? obj.year),
    price_nok: asInt(obj.price_nok),
    battery_total_kwh: asNumber(obj.battery_total_kwh),
    battery_usable_kwh: asNumber(obj.battery_usable_kwh),
    range_km: asInt(obj.range_km),
    winter_range_km: asInt(obj.winter_range_km),
    real_world_range_km: asInt(obj.real_world_range_km),
    consumption_kwh_100km: asNumber(obj.consumption_kwh_100km),
    ac_charging_kw: asNumber(obj.ac_charging_kw),
    dc_charging_kw: asInt(obj.dc_charging_kw),
    charge_time_10_80_minutes: asInt(obj.charge_time_10_80_minutes),
    drivetrain: asNullableString(obj.drivetrain),
    power_hp: asInt(obj.power_hp),
    torque_nm: asInt(obj.torque_nm),
    acceleration_0_100: asNumber(obj.acceleration_0_100),
    top_speed_kmh: asInt(obj.top_speed_kmh),
    towing_kg: asInt(obj.towing_kg),
    curb_weight_kg: asInt(obj.curb_weight_kg),
    is_default: asBool(obj.is_default) ?? false,
    is_active: asBool(obj.is_active) ?? true,
    sort_order: asInt(obj.sort_order) ?? 0,
    source_name: asNullableString(obj.source_name),
    source_url: asNullableString(obj.source_url),
    data_last_checked_at: asNullableString(obj.data_last_checked_at),
    import_status: status === "draft" ? "draft" : "needs_review",
    import_notes: asNullableString(obj.import_notes),
  };
}

export function parseImportVariantsArray(
  raw: unknown,
  parentLabel: string,
  warnings: string[],
  errors: string[],
): ImportVariantRow[] {
  if (!raw) return [];
  if (!Array.isArray(raw)) {
    errors.push(`${parentLabel}: variants må være en array.`);
    return [];
  }

  const used = new Set<string>();
  const variants: ImportVariantRow[] = [];
  raw.forEach((item, index) => {
    const parsed = parseImportVariant(
      item,
      `${parentLabel} variant ${index + 1}`,
      warnings,
      errors,
      used,
    );
    if (parsed) variants.push(parsed);
  });

  if (variants.length > 0 && !variants.some((variant) => variant.is_default)) {
    variants[0] = { ...variants[0], is_default: true };
    warnings.push(`${parentLabel}: første variant satt som standard.`);
  }

  return variants;
}
