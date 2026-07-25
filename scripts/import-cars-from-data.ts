/**
 * One-time import: data/cars.ts → public.cars (Supabase)
 *
 * Safe to re-run: upserts on unique slug (no duplicate rows).
 * Uses SUPABASE_SERVICE_ROLE_KEY only (never expose in the browser).
 *
 * Prerequisites:
 * 1. Run the cars SQL migration in Supabase
 * 2. Set in .env.local:
 *      NEXT_PUBLIC_SUPABASE_URL=
 *      SUPABASE_SERVICE_ROLE_KEY=
 *
 * Run locally (does NOT run on build/deploy):
 *   npm run import:cars
 *
 * Note: Car.acKw has no column in public.cars yet and is not imported.
 * data/cars.ts is left unchanged by this script.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { cars, type Car } from "../data/cars";

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

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function ensureValidSlug(car: Car, used: Set<string>): string {
  let base =
    car.slug && SLUG_PATTERN.test(car.slug.trim().toLowerCase())
      ? car.slug.trim().toLowerCase()
      : slugify(`${car.brand} ${car.model}`);

  if (!base) {
    base = "bil";
  }

  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  used.add(slug);
  return slug;
}

function mapCarToRow(car: Car, slug: string) {
  return {
    slug,
    brand: car.brand.trim(),
    model: car.model.trim(),
    year: null as number | null,
    price_nok: car.priceNok,
    range_km: car.rangeKm,
    battery_kwh: car.batteryKwh,
    dc_charging_kw: car.dcKw,
    drivetrain: car.drive,
    image_url: car.imageUrl?.trim() || `/images/cars/${slug}.webp`,
    description: car.description,
    is_published: true,
    ac_charging_kw: car.acKw,
    consumption_kwh_100km: car.consumptionKwh100km ?? null,
    power_hp: car.powerHp ?? null,
    torque_nm: car.torqueNm ?? null,
    acceleration_0_100: car.acceleration0100 ?? null,
    top_speed_kmh: car.topSpeedKmh ?? null,
    seats: car.seats ?? null,
    cargo_l: car.cargoL ?? null,
    towing_kg: car.towingKg ?? null,
    warranty: car.warranty ?? null,
    vehicle_type: car.vehicleType ?? null,
    body_style: car.bodyStyle ?? null,
  };
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    console.error(
      "Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
    process.exit(1);
  }

  if (cars.length === 0) {
    console.log("No cars found in data/cars.ts. Nothing to import.");
    return;
  }

  const usedSlugs = new Set<string>();
  const rows = cars.map((car) => {
    const slug = ensureValidSlug(car, usedSlugs);
    if (slug !== car.slug) {
      console.log(`Slug adjusted: "${car.slug}" → "${slug}" (${car.brand} ${car.model})`);
    }
    return mapCarToRow(car, slug);
  });

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log(`Importing ${rows.length} car(s) into public.cars (upsert on slug)…`);

  const { data, error } = await supabase
    .from("cars")
    .upsert(rows, { onConflict: "slug" })
    .select("id, slug, brand, model, is_published");

  if (error) {
    console.error("Import failed:", error.message);
    process.exit(1);
  }

  console.log(`Done. Upserted ${data?.length ?? rows.length} row(s):`);
  for (const row of data ?? []) {
    console.log(
      `  - ${row.slug} (${row.brand} ${row.model}) published=${row.is_published}`,
    );
  }
  console.log("\nRe-running this script will update the same slugs, not create duplicates.");
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
