/**
 * One-time CSV import → public.cars (Supabase)
 *
 * Safe to re-run: upserts on unique slug (no duplicate rows).
 * Uses SUPABASE_SERVICE_ROLE_KEY only (never expose in the browser).
 *
 * Template columns (see data/cars-import.template.csv):
 *   Base: slug,brand,model,year,price_nok,range_km,battery_kwh,
 *         dc_charging_kw,drivetrain,image_url,description,is_published
 *   Extended (optional): consumption_kwh_100km,power_hp,torque_nm,
 *         acceleration_0_100,top_speed_kmh,seats,cargo_l,towing_kg,
 *         warranty,ac_charging_kw,vehicle_type,body_style
 *
 * Prerequisites:
 * 1. Run the cars SQL migration in Supabase
 * 2. Set in .env.local:
 *      NEXT_PUBLIC_SUPABASE_URL=
 *      SUPABASE_SERVICE_ROLE_KEY=
 * 3. Copy the template and fill in your rows:
 *      cp data/cars-import.template.csv data/cars-import.csv
 *
 * Run locally (does NOT run on build/deploy):
 *   npm run import:cars:csv
 *   npm run import:cars:csv -- path/to/file.csv
 *
 * data/cars.ts is not read or modified by this script.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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
] as const;

type CsvHeader = (typeof REQUIRED_HEADERS)[number] | (typeof OPTIONAL_HEADERS)[number];

type CarRow = {
  slug: string;
  brand: string;
  model: string;
  year: number | null;
  price_nok: number | null;
  range_km: number | null;
  battery_kwh: number | null;
  dc_charging_kw: number | null;
  drivetrain: string | null;
  image_url: string | null;
  description: string | null;
  is_published: boolean;
  consumption_kwh_100km: number | null;
  power_hp: number | null;
  torque_nm: number | null;
  acceleration_0_100: number | null;
  top_speed_kmh: number | null;
  seats: number | null;
  cargo_l: number | null;
  towing_kg: number | null;
  warranty: string | null;
  ac_charging_kw: number | null;
  vehicle_type: string | null;
  body_style: string | null;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

/** Minimal RFC4180 CSV parser (supports quotes and commas inside quotes). */
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };

  const pushRow = () => {
    // Skip completely empty trailing lines
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

    if (ch === "\r") {
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  return rows;
}

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
    return { ok: false, error: `Row ${rowNumber}: ${label} must be an integer (got "${value}").` };
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `Row ${rowNumber}: ${label} is invalid.` };
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
    return { ok: false, error: `Row ${rowNumber}: ${label} must be a number (got "${value}").` };
  }
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `Row ${rowNumber}: ${label} is invalid.` };
  }
  return { ok: true, value: parsed };
}

function parsePublished(
  value: string,
  rowNumber: number,
): { ok: true; value: boolean } | { ok: false; error: string } {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return { ok: true, value: false };

  if (["true", "yes", "y", "1"].includes(trimmed)) {
    return { ok: true, value: true };
  }
  if (["false", "no", "n", "0"].includes(trimmed)) {
    return { ok: true, value: false };
  }

  return {
    ok: false,
    error: `Row ${rowNumber}: is_published must be true/false/yes/no/1/0 (got "${value}").`,
  };
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/^\uFEFF/, "");
}

function rowsFromCsv(content: string): { rows: CarRow[]; warnings: string[]; errors: string[] } {
  const table = parseCsv(content);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (table.length === 0) {
    return { rows: [], warnings, errors: ["CSV is empty."] };
  }

  const headerCells = table[0].map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter((h) => !headerCells.includes(h));
  if (missing.length > 0) {
    return {
      rows: [],
      warnings,
      errors: [`CSV is missing required columns: ${missing.join(", ")}`],
    };
  }

  const allHeaders = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS] as const;
  const index = Object.fromEntries(
    allHeaders.map((h) => [h, headerCells.indexOf(h)]),
  ) as Record<CsvHeader, number>;

  const usedSlugs = new Set<string>();
  const rows: CarRow[] = [];

  for (let i = 1; i < table.length; i += 1) {
    const cells = table[i];
    const rowNumber = i + 1;

    // Skip blank lines
    if (cells.every((cell) => cell.trim() === "")) {
      continue;
    }

    const get = (key: CsvHeader) => {
      const idx = index[key];
      if (idx < 0) return "";
      return (cells[idx] ?? "").trim();
    };

    const brand = get("brand");
    const model = get("model");

    if (!brand) {
      errors.push(`Row ${rowNumber}: brand is required.`);
      continue;
    }
    if (!model) {
      errors.push(`Row ${rowNumber}: model is required.`);
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

    const rawSlug = get("slug");
    const { slug, adjusted } = ensureValidSlug(rawSlug, brand, model, usedSlugs);
    if (adjusted) {
      warnings.push(
        `Row ${rowNumber}: slug "${rawSlug || "(empty)"}" → "${slug}" (${brand} ${model})`,
      );
    }

    const imageUrl = emptyToNull(get("image_url")) || `/images/cars/${slug}.webp`;

    rows.push({
      slug,
      brand,
      model,
      year: year.value,
      price_nok: price.value,
      range_km: range.value,
      battery_kwh: battery.value,
      dc_charging_kw: dc.value,
      drivetrain: emptyToNull(get("drivetrain")),
      image_url: imageUrl,
      description: emptyToNull(get("description")),
      is_published: published.value,
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
    });
  }

  return { rows, warnings, errors };
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));

  const csvArg = process.argv[2];
  const csvPath = resolve(process.cwd(), csvArg || "data/cars-import.csv");

  console.log(`CSV import → public.cars`);
  console.log(`File: ${csvPath}`);

  if (!existsSync(csvPath)) {
    console.error(
      [
        "ERROR: CSV file not found.",
        "Copy the template and fill in your models:",
        "  cp data/cars-import.template.csv data/cars-import.csv",
        "Then run:",
        "  npm run import:cars:csv",
        "Or pass a path:",
        "  npm run import:cars:csv -- path/to/file.csv",
      ].join("\n"),
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    console.error(
      "ERROR: Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
    process.exit(1);
  }

  const content = readFileSync(csvPath, "utf8");
  const { rows, warnings, errors } = rowsFromCsv(content);

  for (const warning of warnings) {
    console.warn(`WARN: ${warning}`);
  }

  if (errors.length > 0) {
    console.error(`ERROR: Validation failed with ${errors.length} issue(s):`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  if (rows.length === 0) {
    console.error("ERROR: No data rows found in CSV.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log(`Importing ${rows.length} car(s) (upsert on slug)…`);

  const { data, error } = await supabase
    .from("cars")
    .upsert(rows, { onConflict: "slug" })
    .select("id, slug, brand, model, is_published");

  if (error) {
    console.error(`ERROR: Supabase upsert failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`SUCCESS: Upserted ${data?.length ?? rows.length} row(s).`);
  for (const row of data ?? []) {
    console.log(
      `  ✓ ${row.slug} (${row.brand} ${row.model}) published=${row.is_published}`,
    );
  }
  console.log("Re-running this script updates the same slugs and does not create duplicates.");
}

main().catch((error) => {
  console.error("ERROR: Unexpected failure:", error);
  process.exit(1);
});
