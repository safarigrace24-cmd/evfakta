import { parseOptionalBoolean, parseTextList } from "@/lib/admin/field-parsers";
import type { ImportStatus } from "@/lib/admin/types";
import { parseImportVariant } from "@/lib/admin/import/parse-variant";
import type {
  ImportCarRow,
  ImportVariantRow,
  ParsedImportResult,
} from "@/lib/admin/import/types";

const REQUIRED_HEADERS = [
  "slug",
  "brand",
  "model",
  "year",
  "price_nok",
  "range_km",
  "battery_kwh",
  "dc_charging_kw",
  "drivetrain",
  "image_url",
  "description",
  "is_published",
] as const;

const OPTIONAL_HEADERS = [
  "variant",
  "trim_level",
  "model_generation",
  "consumption_kwh_100km",
  "power_hp",
  "torque_nm",
  "acceleration_0_100",
  "top_speed_kmh",
  "seats",
  "cargo_l",
  "towing_kg",
  "warranty",
  "ac_charging_kw",
  "vehicle_type",
  "body_style",
  "battery_total_kwh",
  "battery_usable_kwh",
  "battery_chemistry",
  "winter_range_km",
  "real_world_range_km",
  "charge_time_10_80_minutes",
  "charging_connector_ac",
  "charging_connector_dc",
  "length_mm",
  "width_mm",
  "height_mm",
  "wheelbase_mm",
  "curb_weight_kg",
  "gross_weight_kg",
  "frunk_l",
  "heat_pump",
  "v2l",
  "v2g",
  "apple_carplay",
  "android_auto",
  "head_up_display",
  "panoramic_roof",
  "ota_updates",
  "pros",
  "cons",
  "suitable_for",
  "country",
  "source_name",
  "source_url",
  "source_updated_at",
  "data_last_checked_at",
  "import_status",
  "import_notes",
  "gallery_images",
  "parent_slug",
  "variant_name",
  "is_default",
  "is_active",
  "sort_order",
] as const;

type CsvHeader = (typeof REQUIRED_HEADERS)[number] | (typeof OPTIONAL_HEADERS)[number];

const IMPORT_STATUS_VALUES = ["draft", "needs_review", "approved"] as const;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Minimal RFC4180 CSV parser (quotes + commas inside quotes). */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };

  const pushRow = () => {
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      pushField();
      continue;
    }

    if (ch === "\n") {
      pushField();
      pushRow();
      continue;
    }

    if (ch === "\r") continue;

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  return rows;
}

export function slugify(value: string): string {
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

function ensureValidSlug(
  rawSlug: string,
  brand: string,
  model: string,
  used: Set<string>,
): { slug: string; adjusted: boolean } {
  const trimmed = rawSlug.trim().toLowerCase();
  let base = trimmed && SLUG_PATTERN.test(trimmed) ? trimmed : slugify(`${brand} ${model}`);
  if (!base) base = "bil";

  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  used.add(slug);

  return { slug, adjusted: slug !== trimmed };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalInt(
  value: string,
  label: string,
  rowNumber: number,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: `Rad ${rowNumber}: ${label} må være heltall (fikk "${value}").` };
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `Rad ${rowNumber}: ${label} er ugyldig.` };
  }
  return { ok: true, value: parsed };
}

function parseOptionalNumber(
  value: string,
  label: string,
  rowNumber: number,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return { ok: true, value: null };
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, error: `Rad ${rowNumber}: ${label} må være tall (fikk "${value}").` };
  }
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `Rad ${rowNumber}: ${label} er ugyldig.` };
  }
  return { ok: true, value: parsed };
}

function parsePublished(
  value: string,
  rowNumber: number,
): { ok: true; value: boolean } | { ok: false; error: string } {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return { ok: true, value: false };
  if (["true", "yes", "y", "1"].includes(trimmed)) return { ok: true, value: true };
  if (["false", "no", "n", "0"].includes(trimmed)) return { ok: true, value: false };
  return {
    ok: false,
    error: `Rad ${rowNumber}: is_published må være true/false (fikk "${value}").`,
  };
}

function parseImportStatus(
  value: string,
  rowNumber: number,
): { ok: true; value: ImportStatus } | { ok: false; error: string } {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return { ok: true, value: "needs_review" };
  if ((IMPORT_STATUS_VALUES as readonly string[]).includes(trimmed)) {
    return { ok: true, value: trimmed as ImportStatus };
  }
  return {
    ok: false,
    error: `Rad ${rowNumber}: import_status må være draft/needs_review/approved (fikk "${value}").`,
  };
}

function parseOptionalTimestamp(
  value: string,
  label: string,
  rowNumber: number,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return {
      ok: false,
      error: `Rad ${rowNumber}: ${label} må være gyldig ISO-dato (fikk "${value}").`,
    };
  }
  return { ok: true, value: date.toISOString() };
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/^\uFEFF/, "");
}

function parseGalleryCell(
  value: string,
  rowNumber: number,
): { ok: true; value: ImportCarRow["gallery_images"] } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: undefined };
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) {
      return { ok: false, error: `Rad ${rowNumber}: gallery_images må være JSON-array.` };
    }
    const images = parsed
      .map((item) => {
        if (typeof item === "string") return { url: item };
        if (item && typeof item === "object" && "url" in item) {
          const obj = item as Record<string, unknown>;
          return {
            url: String(obj.url ?? ""),
            image_type: obj.image_type ? String(obj.image_type) : undefined,
            alt_text: obj.alt_text ? String(obj.alt_text) : undefined,
            is_primary: Boolean(obj.is_primary),
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item?.url));
    return { ok: true, value: images };
  } catch {
    // Pipe-separated URLs as a lightweight fallback
    const urls = trimmed
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((url, index) => ({ url, is_primary: index === 0 }));
    if (urls.length === 0) {
      return { ok: false, error: `Rad ${rowNumber}: gallery_images er ugyldig.` };
    }
    return { ok: true, value: urls };
  }
}

export function parseCarsFromCsv(content: string): ParsedImportResult {
  const table = parseCsv(content);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (table.length === 0) {
    return { rows: [], warnings, errors: ["CSV er tom."] };
  }

  const headerCells = table[0].map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter((h) => !headerCells.includes(h));
  if (missing.length > 0) {
    return {
      rows: [],
      warnings,
      errors: [`CSV mangler påkrevde kolonner: ${missing.join(", ")}`],
    };
  }

  const allHeaders = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS] as const;
  const index = Object.fromEntries(
    allHeaders.map((h) => [h, headerCells.indexOf(h)]),
  ) as Record<CsvHeader, number>;

  const usedSlugs = new Set<string>();
  const rows: ImportCarRow[] = [];
  const pendingVariants: Array<{
    parentSlug: string;
    variant: ImportVariantRow;
    rowNumber: number;
  }> = [];
  const variantSlugsByParent = new Map<string, Set<string>>();

  for (let i = 1; i < table.length; i += 1) {
    const cells = table[i];
    const rowNumber = i + 1;

    if (cells.every((cell) => cell.trim() === "")) continue;

    const get = (key: CsvHeader) => {
      const idx = index[key];
      if (idx < 0) return "";
      return (cells[idx] ?? "").trim();
    };

    const parentSlug = get("parent_slug").toLowerCase();
    const brand = get("brand");
    const model = get("model");

    if (parentSlug) {
      const used =
        variantSlugsByParent.get(parentSlug) ?? new Set<string>();
      variantSlugsByParent.set(parentSlug, used);
      const parsed = parseImportVariant(
        {
          name: get("variant_name") || get("variant") || model,
          slug: get("slug"),
          trim_level: get("trim_level"),
          model_year: get("year"),
          price_nok: get("price_nok"),
          battery_total_kwh: get("battery_total_kwh"),
          battery_usable_kwh: get("battery_usable_kwh"),
          range_km: get("range_km"),
          winter_range_km: get("winter_range_km"),
          real_world_range_km: get("real_world_range_km"),
          consumption_kwh_100km: get("consumption_kwh_100km"),
          ac_charging_kw: get("ac_charging_kw"),
          dc_charging_kw: get("dc_charging_kw"),
          charge_time_10_80_minutes: get("charge_time_10_80_minutes"),
          drivetrain: get("drivetrain"),
          power_hp: get("power_hp"),
          torque_nm: get("torque_nm"),
          acceleration_0_100: get("acceleration_0_100"),
          top_speed_kmh: get("top_speed_kmh"),
          towing_kg: get("towing_kg"),
          curb_weight_kg: get("curb_weight_kg"),
          is_default: get("is_default"),
          is_active: get("is_active") || "true",
          sort_order: get("sort_order"),
          source_name: get("source_name"),
          source_url: get("source_url"),
          data_last_checked_at: get("data_last_checked_at"),
          import_status: get("import_status"),
          import_notes: get("import_notes"),
        },
        `Rad ${rowNumber}`,
        warnings,
        errors,
        used,
      );
      if (parsed) {
        pendingVariants.push({
          parentSlug,
          variant: parsed,
          rowNumber,
        });
        warnings.push(
          `Rad ${rowNumber}: variant «${parsed.name}» kobles til ${parentSlug} (ingen auto-publisering).`,
        );
      }
      continue;
    }

    if (!brand) {
      errors.push(`Rad ${rowNumber}: brand er påkrevd.`);
      continue;
    }
    if (!model) {
      errors.push(`Rad ${rowNumber}: model er påkrevd.`);
      continue;
    }

    const year = parseOptionalInt(get("year"), "year", rowNumber);
    if (!year.ok) {
      errors.push(year.error);
      continue;
    }
    const price = parseOptionalInt(get("price_nok"), "price_nok", rowNumber);
    if (!price.ok) {
      errors.push(price.error);
      continue;
    }
    const range = parseOptionalInt(get("range_km"), "range_km", rowNumber);
    if (!range.ok) {
      errors.push(range.error);
      continue;
    }
    const battery = parseOptionalNumber(get("battery_kwh"), "battery_kwh", rowNumber);
    if (!battery.ok) {
      errors.push(battery.error);
      continue;
    }
    const dc = parseOptionalInt(get("dc_charging_kw"), "dc_charging_kw", rowNumber);
    if (!dc.ok) {
      errors.push(dc.error);
      continue;
    }
    const consumption = parseOptionalNumber(
      get("consumption_kwh_100km"),
      "consumption_kwh_100km",
      rowNumber,
    );
    if (!consumption.ok) {
      errors.push(consumption.error);
      continue;
    }
    const power = parseOptionalInt(get("power_hp"), "power_hp", rowNumber);
    if (!power.ok) {
      errors.push(power.error);
      continue;
    }
    const torque = parseOptionalInt(get("torque_nm"), "torque_nm", rowNumber);
    if (!torque.ok) {
      errors.push(torque.error);
      continue;
    }
    const acceleration = parseOptionalNumber(
      get("acceleration_0_100"),
      "acceleration_0_100",
      rowNumber,
    );
    if (!acceleration.ok) {
      errors.push(acceleration.error);
      continue;
    }
    const topSpeed = parseOptionalInt(get("top_speed_kmh"), "top_speed_kmh", rowNumber);
    if (!topSpeed.ok) {
      errors.push(topSpeed.error);
      continue;
    }
    const seats = parseOptionalInt(get("seats"), "seats", rowNumber);
    if (!seats.ok) {
      errors.push(seats.error);
      continue;
    }
    const cargo = parseOptionalInt(get("cargo_l"), "cargo_l", rowNumber);
    if (!cargo.ok) {
      errors.push(cargo.error);
      continue;
    }
    const towing = parseOptionalInt(get("towing_kg"), "towing_kg", rowNumber);
    if (!towing.ok) {
      errors.push(towing.error);
      continue;
    }
    const ac = parseOptionalNumber(get("ac_charging_kw"), "ac_charging_kw", rowNumber);
    if (!ac.ok) {
      errors.push(ac.error);
      continue;
    }
    const published = parsePublished(get("is_published"), rowNumber);
    if (!published.ok) {
      errors.push(published.error);
      continue;
    }
    const importStatus = parseImportStatus(get("import_status"), rowNumber);
    if (!importStatus.ok) {
      errors.push(importStatus.error);
      continue;
    }
    const checkedAt = parseOptionalTimestamp(
      get("data_last_checked_at"),
      "data_last_checked_at",
      rowNumber,
    );
    if (!checkedAt.ok) {
      errors.push(checkedAt.error);
      continue;
    }
    const sourceUpdatedAt = parseOptionalTimestamp(
      get("source_updated_at"),
      "source_updated_at",
      rowNumber,
    );
    if (!sourceUpdatedAt.ok) {
      errors.push(sourceUpdatedAt.error);
      continue;
    }
    const gallery = parseGalleryCell(get("gallery_images"), rowNumber);
    if (!gallery.ok) {
      errors.push(gallery.error);
      continue;
    }

    const batteryTotal = parseOptionalNumber(
      get("battery_total_kwh"),
      "battery_total_kwh",
      rowNumber,
    );
    if (!batteryTotal.ok) {
      errors.push(batteryTotal.error);
      continue;
    }
    const batteryUsable = parseOptionalNumber(
      get("battery_usable_kwh"),
      "battery_usable_kwh",
      rowNumber,
    );
    if (!batteryUsable.ok) {
      errors.push(batteryUsable.error);
      continue;
    }
    const winterRange = parseOptionalInt(get("winter_range_km"), "winter_range_km", rowNumber);
    if (!winterRange.ok) {
      errors.push(winterRange.error);
      continue;
    }
    const realWorldRange = parseOptionalInt(
      get("real_world_range_km"),
      "real_world_range_km",
      rowNumber,
    );
    if (!realWorldRange.ok) {
      errors.push(realWorldRange.error);
      continue;
    }
    const charge1080 = parseOptionalInt(
      get("charge_time_10_80_minutes"),
      "charge_time_10_80_minutes",
      rowNumber,
    );
    if (!charge1080.ok) {
      errors.push(charge1080.error);
      continue;
    }
    const lengthMm = parseOptionalInt(get("length_mm"), "length_mm", rowNumber);
    if (!lengthMm.ok) {
      errors.push(lengthMm.error);
      continue;
    }
    const widthMm = parseOptionalInt(get("width_mm"), "width_mm", rowNumber);
    if (!widthMm.ok) {
      errors.push(widthMm.error);
      continue;
    }
    const heightMm = parseOptionalInt(get("height_mm"), "height_mm", rowNumber);
    if (!heightMm.ok) {
      errors.push(heightMm.error);
      continue;
    }
    const wheelbaseMm = parseOptionalInt(get("wheelbase_mm"), "wheelbase_mm", rowNumber);
    if (!wheelbaseMm.ok) {
      errors.push(wheelbaseMm.error);
      continue;
    }
    const curbWeight = parseOptionalInt(get("curb_weight_kg"), "curb_weight_kg", rowNumber);
    if (!curbWeight.ok) {
      errors.push(curbWeight.error);
      continue;
    }
    const grossWeight = parseOptionalInt(get("gross_weight_kg"), "gross_weight_kg", rowNumber);
    if (!grossWeight.ok) {
      errors.push(grossWeight.error);
      continue;
    }
    const frunk = parseOptionalInt(get("frunk_l"), "frunk_l", rowNumber);
    if (!frunk.ok) {
      errors.push(frunk.error);
      continue;
    }

    const boolFields = [
      ["heat_pump", get("heat_pump")],
      ["v2l", get("v2l")],
      ["v2g", get("v2g")],
      ["apple_carplay", get("apple_carplay")],
      ["android_auto", get("android_auto")],
      ["head_up_display", get("head_up_display")],
      ["panoramic_roof", get("panoramic_roof")],
      ["ota_updates", get("ota_updates")],
    ] as const;
    const boolValues: Record<string, boolean | null> = {};
    let boolFailed = false;
    for (const [key, raw] of boolFields) {
      const parsed = parseOptionalBoolean(raw, `Rad ${rowNumber}: ${key}`);
      if (!parsed.ok) {
        errors.push(parsed.error);
        boolFailed = true;
        break;
      }
      boolValues[key] = parsed.value;
    }
    if (boolFailed) continue;

    const rawSlug = get("slug");
    const { slug, adjusted } = ensureValidSlug(rawSlug, brand, model, usedSlugs);
    if (adjusted) {
      warnings.push(
        `Rad ${rowNumber}: slug "${rawSlug || "(tom)"}" → "${slug}" (${brand} ${model})`,
      );
    }

    if (published.value) {
      warnings.push(
        `Rad ${rowNumber}: is_published=true ignoreres ved import (forblir upublisert).`,
      );
    }

    let status: ImportStatus = importStatus.value;
    if (status === "approved") {
      warnings.push(
        `Rad ${rowNumber}: import_status=approved endres til needs_review (ingen auto-godkjenning).`,
      );
      status = "needs_review";
    }

    const imageUrl = emptyToNull(get("image_url")) || `/images/cars/${slug}.webp`;

    rows.push({
      slug,
      brand,
      model,
      variant: emptyToNull(get("variant")),
      trim_level: emptyToNull(get("trim_level")),
      model_generation: emptyToNull(get("model_generation")),
      year: year.value,
      price_nok: price.value,
      range_km: range.value,
      battery_kwh: battery.value,
      battery_total_kwh: batteryTotal.value,
      battery_usable_kwh: batteryUsable.value,
      battery_chemistry: emptyToNull(get("battery_chemistry")),
      winter_range_km: winterRange.value,
      real_world_range_km: realWorldRange.value,
      dc_charging_kw: dc.value,
      charge_time_10_80_minutes: charge1080.value,
      charging_connector_ac: emptyToNull(get("charging_connector_ac")),
      charging_connector_dc: emptyToNull(get("charging_connector_dc")),
      drivetrain: emptyToNull(get("drivetrain")),
      image_url: imageUrl,
      description: emptyToNull(get("description")),
      is_published: false,
      consumption_kwh_100km: consumption.value,
      power_hp: power.value,
      torque_nm: torque.value,
      acceleration_0_100: acceleration.value,
      top_speed_kmh: topSpeed.value,
      seats: seats.value,
      cargo_l: cargo.value,
      towing_kg: towing.value,
      warranty: emptyToNull(get("warranty")),
      ac_charging_kw: ac.value,
      vehicle_type: emptyToNull(get("vehicle_type")),
      body_style: emptyToNull(get("body_style")),
      length_mm: lengthMm.value,
      width_mm: widthMm.value,
      height_mm: heightMm.value,
      wheelbase_mm: wheelbaseMm.value,
      curb_weight_kg: curbWeight.value,
      gross_weight_kg: grossWeight.value,
      frunk_l: frunk.value,
      heat_pump: boolValues.heat_pump ?? null,
      v2l: boolValues.v2l ?? null,
      v2g: boolValues.v2g ?? null,
      apple_carplay: boolValues.apple_carplay ?? null,
      android_auto: boolValues.android_auto ?? null,
      head_up_display: boolValues.head_up_display ?? null,
      panoramic_roof: boolValues.panoramic_roof ?? null,
      ota_updates: boolValues.ota_updates ?? null,
      pros: parseTextList(get("pros")),
      cons: parseTextList(get("cons")),
      suitable_for: parseTextList(get("suitable_for")),
      country: emptyToNull(get("country")) || "NO",
      source_name: emptyToNull(get("source_name")),
      source_url: emptyToNull(get("source_url")),
      source_updated_at: sourceUpdatedAt.value,
      data_last_checked_at: checkedAt.value,
      import_status: status === "draft" ? "draft" : "needs_review",
      import_notes: emptyToNull(get("import_notes")),
      gallery_images: gallery.value,
    });
  }

  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  for (const pending of pendingVariants) {
    const parent = bySlug.get(pending.parentSlug);
    if (!parent) {
      errors.push(
        `Rad ${pending.rowNumber}: parent_slug "${pending.parentSlug}" finnes ikke i importfilen.`,
      );
      continue;
    }
    parent.variants = [...(parent.variants ?? []), pending.variant];
  }

  for (const row of rows) {
    if (!row.variants?.length) continue;
    if (!row.variants.some((variant) => variant.is_default)) {
      row.variants[0] = { ...row.variants[0], is_default: true };
      warnings.push(
        `${row.slug}: første variant satt som standard.`,
      );
    }
  }

  return { rows, warnings, errors };
}

export const CSV_REQUIRED_HEADERS = REQUIRED_HEADERS;
export const CSV_OPTIONAL_HEADERS = OPTIONAL_HEADERS;
