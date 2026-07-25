import { parseOptionalBoolean, parseTextList } from "@/lib/admin/field-parsers";
import type { ImportStatus } from "@/lib/admin/types";
import { parseCarsFromCsv, slugify } from "@/lib/admin/import/parse-csv";
import { parseImportVariantsArray } from "@/lib/admin/import/parse-variant";
import type {
  ImportCarRow,
  ImportGalleryImage,
  ParsedImportResult,
} from "@/lib/admin/import/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMPORT_STATUS_VALUES = ["draft", "needs_review", "approved"] as const;

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

function asBool(value: unknown, label: string, warnings: string[]): boolean | null {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return value;
  const parsed = parseOptionalBoolean(String(value), label);
  if (!parsed.ok) {
    warnings.push(parsed.error);
    return null;
  }
  return parsed.value;
}

function asTextList(value: unknown): string[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items : null;
  }
  return parseTextList(String(value));
}

function parseGallery(value: unknown): ImportGalleryImage[] | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    return value
      .split("|")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url, index) => ({ url, is_primary: index === 0 }));
  }
  if (!Array.isArray(value)) return undefined;
  const images: ImportGalleryImage[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      if (item.trim()) images.push({ url: item.trim() });
      continue;
    }
    const obj = asRecord(item);
    if (!obj?.url) continue;
    const url = asString(obj.url);
    if (!url) continue;
    images.push({
      url,
      image_type: asNullableString(obj.image_type) ?? undefined,
      alt_text: asNullableString(obj.alt_text) ?? undefined,
      is_primary: Boolean(obj.is_primary),
    });
  }
  return images;
}

function normalizeStatus(raw: string, warnings: string[], label: string): ImportStatus {
  const status = raw.toLowerCase();
  if (!status) return "needs_review";
  if (!(IMPORT_STATUS_VALUES as readonly string[]).includes(status)) {
    warnings.push(`${label}: ugyldig import_status "${raw}" → needs_review`);
    return "needs_review";
  }
  if (status === "approved") {
    warnings.push(`${label}: import_status=approved endres til needs_review`);
    return "needs_review";
  }
  return status as ImportStatus;
}

export function parseCarsFromJson(content: string): ParsedImportResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { rows: [], warnings, errors: ["JSON er ugyldig."] };
  }

  const root = asRecord(parsed);
  const list: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(root?.cars)
      ? (root!.cars as unknown[])
      : Array.isArray(root?.items)
        ? (root!.items as unknown[])
        : [];

  if (list.length === 0) {
    return { rows: [], warnings, errors: ["JSON inneholder ingen bilrader (cars/items/array)."] };
  }

  const usedSlugs = new Set<string>();
  const rows: ImportCarRow[] = [];

  list.forEach((item, index) => {
    const rowNumber = index + 1;
    const obj = asRecord(item);
    if (!obj) {
      errors.push(`Rad ${rowNumber}: forventet objekt.`);
      return;
    }

    const brand = asString(obj.brand);
    const model = asString(obj.model);
    if (!brand || !model) {
      errors.push(`Rad ${rowNumber}: brand og model er påkrevd.`);
      return;
    }

    let slug = asString(obj.slug).toLowerCase();
    if (!slug || !SLUG_PATTERN.test(slug)) {
      const next = slugify(`${brand} ${model}`) || "bil";
      warnings.push(`Rad ${rowNumber}: slug mangler/ugyldig → "${next}"`);
      slug = next;
    }

    let unique = slug;
    let n = 2;
    while (usedSlugs.has(unique)) {
      unique = `${slug}-${n}`;
      n += 1;
    }
    if (unique !== slug) {
      warnings.push(`Rad ${rowNumber}: duplikat slug i fil → "${unique}"`);
    }
    usedSlugs.add(unique);
    slug = unique;

    if (obj.is_published === true || asString(obj.is_published).toLowerCase() === "true") {
      warnings.push(`Rad ${rowNumber}: is_published ignoreres (forblir upublisert).`);
    }

    const status = normalizeStatus(asString(obj.import_status), warnings, `Rad ${rowNumber}`);

    const label = `Rad ${rowNumber}`;
    const variants = parseImportVariantsArray(
      obj.variants,
      label,
      warnings,
      errors,
    );

    rows.push({
      slug,
      brand,
      model,
      variant: asNullableString(obj.variant),
      trim_level: asNullableString(obj.trim_level),
      model_generation: asNullableString(obj.model_generation),
      year: asInt(obj.year),
      price_nok: asInt(obj.price_nok),
      range_km: asInt(obj.range_km),
      battery_kwh: asNumber(obj.battery_kwh),
      battery_total_kwh: asNumber(obj.battery_total_kwh),
      battery_usable_kwh: asNumber(obj.battery_usable_kwh),
      battery_chemistry: asNullableString(obj.battery_chemistry),
      winter_range_km: asInt(obj.winter_range_km),
      real_world_range_km: asInt(obj.real_world_range_km),
      dc_charging_kw: asInt(obj.dc_charging_kw),
      charge_time_10_80_minutes: asInt(obj.charge_time_10_80_minutes),
      charging_connector_ac: asNullableString(obj.charging_connector_ac),
      charging_connector_dc: asNullableString(obj.charging_connector_dc),
      drivetrain: asNullableString(obj.drivetrain),
      image_url: asNullableString(obj.image_url) || `/images/cars/${slug}.webp`,
      description: asNullableString(obj.description),
      is_published: false,
      consumption_kwh_100km: asNumber(obj.consumption_kwh_100km),
      power_hp: asInt(obj.power_hp),
      torque_nm: asInt(obj.torque_nm),
      acceleration_0_100: asNumber(obj.acceleration_0_100),
      top_speed_kmh: asInt(obj.top_speed_kmh),
      seats: asInt(obj.seats),
      cargo_l: asInt(obj.cargo_l),
      towing_kg: asInt(obj.towing_kg),
      warranty: asNullableString(obj.warranty),
      ac_charging_kw: asNumber(obj.ac_charging_kw),
      vehicle_type: asNullableString(obj.vehicle_type),
      body_style: asNullableString(obj.body_style),
      length_mm: asInt(obj.length_mm),
      width_mm: asInt(obj.width_mm),
      height_mm: asInt(obj.height_mm),
      wheelbase_mm: asInt(obj.wheelbase_mm),
      curb_weight_kg: asInt(obj.curb_weight_kg),
      gross_weight_kg: asInt(obj.gross_weight_kg),
      frunk_l: asInt(obj.frunk_l),
      heat_pump: asBool(obj.heat_pump, `${label}: heat_pump`, warnings),
      v2l: asBool(obj.v2l, `${label}: v2l`, warnings),
      v2g: asBool(obj.v2g, `${label}: v2g`, warnings),
      apple_carplay: asBool(obj.apple_carplay, `${label}: apple_carplay`, warnings),
      android_auto: asBool(obj.android_auto, `${label}: android_auto`, warnings),
      head_up_display: asBool(obj.head_up_display, `${label}: head_up_display`, warnings),
      panoramic_roof: asBool(obj.panoramic_roof, `${label}: panoramic_roof`, warnings),
      ota_updates: asBool(obj.ota_updates, `${label}: ota_updates`, warnings),
      pros: asTextList(obj.pros),
      cons: asTextList(obj.cons),
      suitable_for: asTextList(obj.suitable_for),
      country: asNullableString(obj.country) || "NO",
      source_name: asNullableString(obj.source_name),
      source_url: asNullableString(obj.source_url),
      source_updated_at: asNullableString(obj.source_updated_at),
      data_last_checked_at: asNullableString(obj.data_last_checked_at),
      import_status: status === "draft" ? "draft" : "needs_review",
      import_notes: asNullableString(obj.import_notes),
      gallery_images: parseGallery(obj.gallery_images ?? obj.images),
      variants: variants.length > 0 ? variants : undefined,
    });
  });

  return { rows, warnings, errors };
}

export function detectImportFormat(
  filename: string,
  content: string,
): "csv" | "json" | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".csv")) return "csv";

  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (trimmed.includes(",") && trimmed.split("\n")[0]?.toLowerCase().includes("slug")) {
    return "csv";
  }
  return null;
}

export function parseImportContent(
  content: string,
  format: "csv" | "json",
): ParsedImportResult {
  return format === "csv" ? parseCarsFromCsv(content) : parseCarsFromJson(content);
}
