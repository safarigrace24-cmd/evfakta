/**
 * Fix invalid / empty admin dropdown enums on locked-brand production cars.
 * Maps non-option values (e.g. vehicle_type=BEV) to allowed enums so forms
 * never show "Velg type" / "Velg karosseri" / "Velg drivlinje" on launch models.
 *
 * Usage: npx tsx scripts/fix-dropdown-enums.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BODY_STYLE_OPTIONS,
  DRIVETRAIN_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from "../lib/admin/types";

const BRANDS = [
  "Volkswagen",
  "Volvo",
  "Tesla",
  "BMW",
  "Audi",
  "Kia",
  "Hyundai",
  "Toyota",
] as const;

const VEHICLE_TYPE_MAP: Record<string, string> = {
  BEV: "Personbil",
  EV: "Personbil",
  personbil: "Personbil",
  suv: "SUV",
  varebil: "Varebil",
  pickup: "Pickup",
};

const BODY_STYLE_MAP: Record<string, string> = {
  "MPV / bus": "MPV",
  "Kompakt hatchback": "Hatchback",
  Hatch: "Hatchback",
  "Sedan / stasjonsvogn": "Sedan",
  "Coupé-SUV": "SUV",
  "Coupe-SUV": "SUV",
  Coupe: "Coupe",
  Coupé: "Coupe",
  Van: "Varebil",
  Estate: "Stasjonsvogn",
  Touring: "Stasjonsvogn",
  Wagon: "Stasjonsvogn",
};

const DRIVETRAIN_MAP: Record<string, string> = {
  Bakhjulstrekk: "Bakhjulsdrift",
  Firehjulstrekk: "Firehjulsdrift",
  Forhjulstrekk: "Forhjulsdrift",
  /** VW pricelist wording for single-axle drive (ID.7 Pro = RWD). */
  Tohjulstrekk: "Bakhjulsdrift",
  "2WD": "Bakhjulsdrift",
  RWD: "Bakhjulsdrift",
  FWD: "Forhjulsdrift",
  AWD: "Firehjulsdrift",
  "4WD": "Firehjulsdrift",
  quattro: "Firehjulsdrift",
  xDrive: "Firehjulsdrift",
};

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

function normalize(
  value: string | null | undefined,
  allowed: readonly string[],
  map: Record<string, string>,
): string | null {
  const raw = value?.trim() ?? "";
  if (!raw) return null;
  if ((allowed as readonly string[]).includes(raw)) return raw;
  const mapped = map[raw] ?? map[raw.toLowerCase()];
  if (mapped && (allowed as readonly string[]).includes(mapped)) return mapped;
  return null;
}

async function defaultVariantDrivetrain(
  sb: SupabaseClient,
  carId: string,
): Promise<string | null> {
  const { data } = await sb
    .from("car_variants")
    .select("drivetrain,is_default,name")
    .eq("car_id", carId);
  const rows = data ?? [];
  const preferred =
    rows.find((r) => r.is_default && r.drivetrain?.trim()) ??
    rows.find((r) => r.drivetrain?.trim());
  if (!preferred?.drivetrain) return null;
  return normalize(preferred.drivetrain, DRIVETRAIN_OPTIONS, DRIVETRAIN_MAP);
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  const sb = createClient(url, key);

  const { data, error } = await sb
    .from("cars")
    .select(
      "id,slug,brand,model,import_status,vehicle_type,body_style,drivetrain",
    )
    .in("brand", [...BRANDS])
    .order("brand")
    .order("model");
  if (error) throw error;

  let fixed = 0;
  let unresolved = 0;

  for (const car of data ?? []) {
    const patch: Record<string, string> = {};

    const vt = normalize(car.vehicle_type, VEHICLE_TYPE_OPTIONS, VEHICLE_TYPE_MAP);
    if (vt && vt !== car.vehicle_type) patch.vehicle_type = vt;
    if (!vt && car.import_status === "approved") {
      // Passenger EVs in this catalog are Personbil when body is known
      if (car.body_style?.includes("SUV") || car.body_style === "Crossover") {
        patch.vehicle_type = "Personbil";
      } else if (!car.vehicle_type?.trim() || car.vehicle_type === "BEV") {
        patch.vehicle_type = "Personbil";
      }
    }
    // Always map BEV → Personbil for locked brands
    if (car.vehicle_type === "BEV") patch.vehicle_type = "Personbil";

    const bs = normalize(car.body_style, BODY_STYLE_OPTIONS, BODY_STYLE_MAP);
    if (bs && bs !== car.body_style) patch.body_style = bs;

    let dt = normalize(car.drivetrain, DRIVETRAIN_OPTIONS, DRIVETRAIN_MAP);
    if (!dt) {
      dt = await defaultVariantDrivetrain(sb, car.id);
    }
    if (dt && dt !== car.drivetrain) patch.drivetrain = dt;

    // Always normalize variant drivetrain aliases for this car
    const { data: variants } = await sb
      .from("car_variants")
      .select("id,drivetrain")
      .eq("car_id", car.id);
    for (const variant of variants ?? []) {
      const mapped = normalize(
        variant.drivetrain,
        DRIVETRAIN_OPTIONS,
        DRIVETRAIN_MAP,
      );
      if (mapped && mapped !== variant.drivetrain) {
        await sb
          .from("car_variants")
          .update({ drivetrain: mapped })
          .eq("id", variant.id);
        console.log(
          `  variant ${variant.id}: drivetrain ${variant.drivetrain} → ${mapped}`,
        );
      }
    }

    if (Object.keys(patch).length === 0) {
      const stillBad = [
        !(VEHICLE_TYPE_OPTIONS as readonly string[]).includes(
          (car.vehicle_type ?? "").trim(),
        ),
        !(BODY_STYLE_OPTIONS as readonly string[]).includes(
          (car.body_style ?? "").trim(),
        ),
        car.import_status === "approved" &&
          !(DRIVETRAIN_OPTIONS as readonly string[]).includes(
            (car.drivetrain ?? "").trim(),
          ),
      ].some(Boolean);
      if (stillBad && car.import_status === "approved") {
        unresolved += 1;
        console.log(
          `UNRESOLVED ${car.slug}: vt=${car.vehicle_type} bs=${car.body_style} dt=${car.drivetrain}`,
        );
      }
      continue;
    }

    const { error: upErr } = await sb.from("cars").update(patch).eq("id", car.id);
    if (upErr) throw upErr;

    fixed += 1;
    console.log(
      `FIXED ${car.slug}: ${JSON.stringify(patch)} (was vt=${car.vehicle_type} bs=${car.body_style} dt=${car.drivetrain})`,
    );
  }

  console.log(`\nFixed ${fixed} cars. Unresolved approved: ${unresolved}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
