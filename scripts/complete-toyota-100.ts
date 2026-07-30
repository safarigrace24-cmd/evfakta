/**
 * Complete Toyota Norwegian EV launch set to 100% Review Assistant where Image Ready.
 * Finishable: bZ4X, bZ4X Touring, C-HR+, Urban Cruiser.
 * Official Toyota Norge forhandler prislister (PDF) + spesifikasjonssider + modellsammenligning + Scene7 images.
 * Never invent. Never auto-publish.
 *
 * Usage: npx tsx scripts/complete-toyota-100.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { computeEditorialCompletion } from "../lib/admin/editorial-completion";
import {
  buildCarImageStoragePath,
  resolveStorageRole,
} from "../lib/admin/image-production";
import {
  IMAGE_BUCKET,
  publicUrlForCarImagePath,
} from "../lib/admin/image-review-preview";

const CHECKED_AT = new Date().toISOString();
const BRAND = "Toyota";

type Role = "front" | "side" | "rear" | "interior";

type VariantCfg = {
  name: string;
  slug: string;
  is_default?: boolean;
  battery_usable_kwh?: number | null;
  battery_total_kwh?: number | null;
  range_km?: number | null;
  consumption_kwh_100km?: number | null;
  ac_charging_kw?: number | null;
  dc_charging_kw?: number | null;
  charge_time_10_80_minutes?: number | null;
  drivetrain?: string | null;
  power_hp?: number | null;
  torque_nm?: number | null;
  acceleration_0_100?: number | null;
  top_speed_kmh?: number | null;
  towing_kg?: number | null;
  curb_weight_kg?: number | null;
  source_name: string;
  source_url: string;
  import_notes?: string;
};

type ModelCfg = {
  slug: string;
  model: string;
  year: number;
  body_style: string;
  vehicle_type: string;
  seats: number;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  wheelbase_mm: number | null;
  cargo_l: number | null;
  frunk_l?: number | null;
  towing_kg: number | null;
  battery_chemistry: string | null;
  charging_connector_ac: string;
  charging_connector_dc: string;
  heat_pump: boolean | null;
  page: string;
  primarySourceName: string;
  primarySourceUrl: string;
  images: Partial<Record<Role, string>>;
  documentRearMissing?: boolean;
  documentInteriorMissing?: boolean;
  documentChargingHonesty?: boolean;
  documentHeatPumpHonesty?: boolean;
  documentSeatsHonesty?: boolean;
  documentFrunkMissing?: boolean;
  skipGallery?: boolean;
  forceNotReady?: boolean;
  variants: VariantCfg[];
  description: string;
  pros: string[];
  cons: string[];
  suitable_for: string[];
};

const SRC = {
  bz4xPdf: "https://forhandler.toyota.no/pdf/toyota-bz4x",
  bz4xTouringPdf: "https://forhandler.toyota.no/pdf/bz4x-touring",
  chrPlusPdf: "https://forhandler.toyota.no/pdf/toyota-c-hr-plus",
  urbanCruiserPdf: "https://forhandler.toyota.no/pdf/urban-cruiser",
  bz4xSpecs: "https://www.toyota.no/nybil/bz4x/specifications",
  bz4xPage: "https://www.toyota.no/nybil/bz4x",
  bz4xTouringPage: "https://www.toyota.no/nybil/bz4x-touring",
  chrPlusPage: "https://www.toyota.no/nybil/toyota-c-hr-plus",
  urbanCruiserPage: "https://www.toyota.no/nybil/urban-cruiser",
  compare: "https://www.toyota.no/modellsammenligning",
} as const;

const MODELS: ModelCfg[] = [
  {
    slug: "toyota-bz4x",
    model: "bZ4X",
    year: 2025,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4690,
    width_mm: 1860,
    height_mm: 1650,
    wheelbase_mm: 2850,
    cargo_l: 452,
    towing_kg: 1500,
    battery_chemistry: "Litium-ionbatteri",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.bz4xPage,
    primarySourceName: "Toyota Norge — Forhandler prisliste bZ4X (PDF)",
    primarySourceUrl: SRC.bz4xPdf,
    images: {
      front: "docs/_tmp_toyota/final/bz4x/front.jpg",
      side: "docs/_tmp_toyota/final/bz4x/side.jpg",
      rear: "docs/_tmp_toyota/final/bz4x/rear.jpg",
      interior: "docs/_tmp_toyota/final/bz4x/interior.jpg",
    },
    documentChargingHonesty: false,
    documentHeatPumpHonesty: true,
    description:
      "Toyota bZ4X er helelektrisk SUV solgt i Norge. Dimensjoner (4690 x 1860 x 1650 mm), akselavstand 2850 mm, bagasjerom 452 l og maks tilhengervekt (AWD) 1500 kg er hentet fra offisielle spesifikasjoner på toyota.no og forhandlerens prisliste. Batteripakke, effekt, WLTP-rekkevidde og forbruk for hver av de fire variantene (Active FWD til Executive AWD) er fra forhandlerprislisten (PDF) og modellsammenligningen. Peak DC-lading på 150 kW og AC-lading (11 kW / 22 kW på Executive) er dokumentert. Batterikjemi er oppgitt som litium-ion.",
    pros: [
      "Fullstendig NO-spesifikasjon for dimensjoner, bagasje og tilhenger",
      "Peak DC 150 kW og AC-lading dokumentert for alle fire varianter",
      "Fire varianter fra Active FWD til Executive AWD med offisielle tall",
    ],
    cons: [
      "Varmepumpe ikke bekreftet som ett enkelt true/false-felt — ikke gjettet",
      "Vridningsmoment kun oppgitt for enkelte varianter i hentet materiale",
      "Offisiell vinterrekkevidde ikke lagret som egen katalogverdi — ikke gjettet",
    ],
    suitable_for: [
      "Familie-SUV-kjøpere som vil ha offisiell norsk prisliste og spesifikasjon",
      "Kjøpere som vil sammenligne FWD mot AWD med dokumentert lading",
      "Lett tilhengerkjøring på AWD-varianter (inntil 1500 kg)",
    ],
    variants: [
      {
        name: "Active FWD",
        slug: "active-fwd",
        is_default: true,
        battery_usable_kwh: 54,
        battery_total_kwh: 57.7,
        range_km: 444,
        consumption_kwh_100km: 13.9,
        ac_charging_kw: 11,
        dc_charging_kw: 150,
        charge_time_10_80_minutes: 28,
        drivetrain: "Forhjulsdrift",
        power_hp: 167,
        acceleration_0_100: 8.6,
        towing_kg: 750,
        source_name: "Toyota Norge — Forhandler prisliste bZ4X (PDF)",
        source_url: SRC.bz4xPdf,
        import_notes:
          "57,7/54 kWt (total/usable). 167 hk / 123 kW. WLTP 444 km. Bremset tilhenger 750 kg.",
      },
      {
        name: "Active Tech FWD",
        slug: "active-tech-fwd",
        battery_usable_kwh: 69,
        battery_total_kwh: 73.1,
        range_km: 569,
        consumption_kwh_100km: 13.9,
        ac_charging_kw: 11,
        dc_charging_kw: 150,
        charge_time_10_80_minutes: 28,
        drivetrain: "Forhjulsdrift",
        power_hp: 224,
        towing_kg: 750,
        source_name: "Toyota Norge — Forhandler prisliste bZ4X (PDF)",
        source_url: SRC.bz4xPdf,
        import_notes:
          "73,1/69 kWt (total/usable). 224 hk / 165 kW. WLTP 569 km. Bremset tilhenger 750 kg.",
      },
      {
        name: "Active Tech AWD",
        slug: "active-tech-awd",
        battery_usable_kwh: 69,
        battery_total_kwh: 73.1,
        range_km: 516,
        consumption_kwh_100km: 14.5,
        ac_charging_kw: 11,
        dc_charging_kw: 150,
        charge_time_10_80_minutes: 28,
        drivetrain: "Firehjulsdrift",
        power_hp: 343,
        torque_nm: 338,
        towing_kg: 1500,
        source_name: "Toyota Norge — Modellsammenligning bZ4X",
        source_url: SRC.compare,
        import_notes:
          "73,1/69 kWt (total/usable). 343 hk / 252 kW / 338 Nm fra modellsammenligning. WLTP 516 km. Bremset tilhenger 1500 kg.",
      },
      {
        name: "Executive AWD",
        slug: "executive-awd",
        battery_usable_kwh: 69,
        battery_total_kwh: 73.1,
        range_km: 506,
        consumption_kwh_100km: 14.8,
        ac_charging_kw: 22,
        dc_charging_kw: 150,
        charge_time_10_80_minutes: 28,
        drivetrain: "Firehjulsdrift",
        power_hp: 343,
        towing_kg: 1500,
        source_name: "Toyota Norge — Forhandler prisliste bZ4X (PDF)",
        source_url: SRC.bz4xPdf,
        import_notes:
          "73,1/69 kWt (total/usable). 343 hk. WLTP 506 km. AC-lading 22 kW (trefas OBC) på Executive per forhandlerprisliste. Bremset tilhenger 1500 kg.",
      },
    ],
  },
  {
    slug: "toyota-bz4x-touring",
    model: "bZ4X Touring",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4830,
    width_mm: 1860,
    height_mm: 1675,
    wheelbase_mm: 2850,
    cargo_l: 669,
    towing_kg: 1500,
    battery_chemistry: "Litium-ionbatteri",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.bz4xTouringPage,
    primarySourceName: "Toyota Norge — Forhandler prisliste bZ4X Touring (PDF)",
    primarySourceUrl: SRC.bz4xTouringPdf,
    images: {
      front: "docs/_tmp_toyota/final/bz4x-touring/front.jpg",
      side: "docs/_tmp_toyota/final/bz4x-touring/side.jpg",
      rear: "docs/_tmp_toyota/final/bz4x-touring/rear.jpg",
      interior: "docs/_tmp_toyota/final/bz4x-touring/interior.jpg",
    },
    documentHeatPumpHonesty: true,
    description:
      "Toyota bZ4X Touring er den mer praktiske touring-/stasjonsvogn-varianten av bZ4X, solgt i Norge. Dimensjoner (4830 x 1860 x 1675 mm), akselavstand 2850 mm, bagasjerom 669 l og maks tilhengervekt 1500 kg er fra offisielle spesifikasjoner og forhandlerprislisten. Batteripakke 74,7/71 kWt, effekt, WLTP og forbruk for hver av de tre variantene (Active Tech FWD til Executive AWD) er fra forhandlerprislisten (PDF). Peak DC 150 kW og AC-lading (11 kW / 22 kW på Executive) er dokumentert. Batterikjemi er oppgitt som litium-ion.",
    pros: [
      "Stort bagasjerom (669 l) dokumentert i offisiell spesifikasjon",
      "Full NO-prisliste for tre varianter fra Active Tech FWD til Executive AWD",
      "Peak DC 150 kW dokumentert på alle varianter",
    ],
    cons: [
      "10–80 minutter ladetid ikke oppgitt i hentet materiale — ikke gjettet",
      "Varmepumpe ikke bekreftet som ett enkelt true/false-felt — ikke gjettet",
      "0–100 km/t kun bekreftet for topp-varianten (Executive AWD)",
    ],
    suitable_for: [
      "Familier som trenger ekstra bagasjeplass i en elektrisk SUV",
      "Langtur med dokumentert 150 kW hurtiglading",
      "Tilhengerkjøring på AWD-varianter (inntil 1500 kg)",
    ],
    variants: [
      {
        name: "Active Tech FWD",
        slug: "active-tech-fwd",
        is_default: true,
        battery_usable_kwh: 71,
        battery_total_kwh: 74.7,
        range_km: 591,
        consumption_kwh_100km: 14.0,
        ac_charging_kw: 11,
        dc_charging_kw: 150,
        drivetrain: "Forhjulsdrift",
        power_hp: 224,
        towing_kg: 750,
        source_name: "Toyota Norge — Forhandler prisliste bZ4X Touring (PDF)",
        source_url: SRC.bz4xTouringPdf,
        import_notes:
          "74,7/71 kWt (total/usable). 224 hk. WLTP 591 km. Bremset tilhenger 750 kg. 10–80 min ikke oppgitt i hentet materiale.",
      },
      {
        name: "Active Tech AWD",
        slug: "active-tech-awd",
        battery_usable_kwh: 71,
        battery_total_kwh: 74.7,
        range_km: 528,
        consumption_kwh_100km: 15.3,
        ac_charging_kw: 11,
        dc_charging_kw: 150,
        drivetrain: "Firehjulsdrift",
        power_hp: 380,
        towing_kg: 1500,
        source_name: "Toyota Norge — Forhandler prisliste bZ4X Touring (PDF)",
        source_url: SRC.bz4xTouringPdf,
        import_notes:
          "74,7/71 kWt (total/usable). 380 hk. WLTP 528 km. Bremset tilhenger 1500 kg. 0–100 ikke oppgitt for denne varianten i hentet materiale.",
      },
      {
        name: "Executive AWD",
        slug: "executive-awd",
        battery_usable_kwh: 71,
        battery_total_kwh: 74.7,
        range_km: 520,
        consumption_kwh_100km: 15.5,
        ac_charging_kw: 22,
        dc_charging_kw: 150,
        drivetrain: "Firehjulsdrift",
        power_hp: 380,
        acceleration_0_100: 4.4,
        towing_kg: 1500,
        source_name: "Toyota Norge — Spesifikasjoner bZ4X",
        source_url: SRC.bz4xSpecs,
        import_notes:
          "74,7/71 kWt (total/usable). 380 hk. WLTP 520 km. 0–100 4,4 s per offisiell spesifikasjon. AC-lading 22 kW (trefas OBC) på Executive. Bremset tilhenger 1500 kg.",
      },
    ],
  },
  {
    slug: "toyota-c-hr-plus",
    model: "C-HR+",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4520,
    width_mm: 1870,
    height_mm: 1595,
    wheelbase_mm: 2750,
    cargo_l: 416,
    towing_kg: 1500,
    battery_chemistry: "Litium-ionbatteri",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.chrPlusPage,
    primarySourceName: "Toyota Norge — Forhandler prisliste C-HR+ (PDF)",
    primarySourceUrl: SRC.chrPlusPdf,
    images: {
      front: "docs/_tmp_toyota/final/c-hr-plus/front.jpg",
      side: "docs/_tmp_toyota/final/c-hr-plus/side.jpg",
      rear: "docs/_tmp_toyota/final/c-hr-plus/rear.jpg",
      interior: "docs/_tmp_toyota/final/c-hr-plus/interior.jpg",
    },
    documentHeatPumpHonesty: true,
    description:
      "Toyota C-HR+ er den helelektriske SUV-versjonen av C-HR, solgt i Norge. Dimensjoner (4520 x 1870 x 1595 mm), akselavstand 2750 mm, bagasjerom 416 l og maks tilhengervekt 1500 kg er fra offisielle spesifikasjoner og forhandlerprislisten. Batteripakke 77/72 kWt, effekt, WLTP og forbruk for hver av de tre variantene (Active FWD til Executive AWD) er fra forhandlerprislisten (PDF). Peak DC 150 kW og AC 11 kW er dokumentert for alle varianter. Batterikjemi er oppgitt som litium-ion.",
    pros: [
      "Tre varianter med full NO-prisliste fra Active FWD til Executive AWD",
      "Peak DC 150 kW dokumentert på alle varianter",
      "10–80 minutter ladetid (28 min) dokumentert",
    ],
    cons: [
      "Varmepumpe ikke bekreftet som ett enkelt true/false-felt — ikke gjettet",
      "AC-lading på Executive kunne ikke bekreftes til 22 kW i hentet materiale — lagret som 11 kW",
      "Offisiell vinterrekkevidde ikke lagret som egen katalogverdi — ikke gjettet",
    ],
    suitable_for: [
      "Kompakt-SUV-kjøpere som vil ha offisiell NO-dokumentasjon",
      "Langtur med dokumentert 150 kW / 28 min 10–80",
      "Tilhengerkjøring på AWD-varianter (inntil 1500 kg)",
    ],
    variants: [
      {
        name: "Active FWD",
        slug: "active-fwd",
        is_default: true,
        battery_usable_kwh: 72,
        battery_total_kwh: 77,
        range_km: 609,
        consumption_kwh_100km: 13.3,
        ac_charging_kw: 11,
        dc_charging_kw: 150,
        charge_time_10_80_minutes: 28,
        drivetrain: "Forhjulsdrift",
        power_hp: 224,
        towing_kg: 750,
        source_name: "Toyota Norge — Forhandler prisliste C-HR+ (PDF)",
        source_url: SRC.chrPlusPdf,
        import_notes:
          "77/72 kWt (total/usable). 224 hk. WLTP 609 km. Bremset tilhenger 750 kg.",
      },
      {
        name: "Active AWD",
        slug: "active-awd",
        battery_usable_kwh: 72,
        battery_total_kwh: 77,
        range_km: 546,
        consumption_kwh_100km: 13.5,
        ac_charging_kw: 11,
        dc_charging_kw: 150,
        charge_time_10_80_minutes: 28,
        drivetrain: "Firehjulsdrift",
        power_hp: 343,
        torque_nm: 338,
        acceleration_0_100: 5.2,
        towing_kg: 1500,
        source_name: "Toyota Norge — Modellsammenligning C-HR+",
        source_url: SRC.compare,
        import_notes:
          "77/72 kWt (total/usable). 343 hk / 338 Nm fra modellsammenligning. WLTP 546 km. 0–100 5,2 s. Bremset tilhenger 1500 kg.",
      },
      {
        name: "Executive AWD",
        slug: "executive-awd",
        battery_usable_kwh: 72,
        battery_total_kwh: 77,
        range_km: 505,
        consumption_kwh_100km: 13.5,
        ac_charging_kw: 11,
        dc_charging_kw: 150,
        charge_time_10_80_minutes: 28,
        drivetrain: "Firehjulsdrift",
        power_hp: 343,
        acceleration_0_100: 5.2,
        towing_kg: 1500,
        source_name: "Toyota Norge — Forhandler prisliste C-HR+ (PDF)",
        source_url: SRC.chrPlusPdf,
        import_notes:
          "77/72 kWt (total/usable). 343 hk. WLTP 505 km. 0–100 5,2 s. AC-lading ikke bekreftet til 22 kW for Executive i hentet materiale — lagret som 11 kW. Bremset tilhenger 1500 kg.",
      },
    ],
  },
  {
    slug: "toyota-urban-cruiser",
    model: "Urban Cruiser",
    year: 2025,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4285,
    width_mm: 1800,
    height_mm: 1635,
    wheelbase_mm: 2700,
    cargo_l: 310,
    towing_kg: 750,
    battery_chemistry: "Litium-ionbatteri",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.urbanCruiserPage,
    primarySourceName: "Toyota Norge — Forhandler prisliste Urban Cruiser (PDF)",
    primarySourceUrl: SRC.urbanCruiserPdf,
    images: {
      front: "docs/_tmp_toyota/final/urban-cruiser/front.jpg",
      side: "docs/_tmp_toyota/final/urban-cruiser/side.jpg",
      rear: "docs/_tmp_toyota/final/urban-cruiser/rear.jpg",
      interior: "docs/_tmp_toyota/final/urban-cruiser/interior.jpg",
    },
    documentHeatPumpHonesty: true,
    description:
      "Toyota Urban Cruiser er kompakt helelektrisk SUV solgt i Norge. Dimensjoner (4285 x 1800 x 1635 mm), akselavstand 2700 mm, bagasjerom 310 l og maks tilhengervekt 750 kg er fra offisielle spesifikasjoner og forhandlerprislisten. Batteripakke (49/48 og 61/60 kWt), effekt, WLTP og forbruk for hver av de tre variantene er fra forhandlerprislisten (PDF). Peak DC 67 kW er dokumentert fra modellsammenligningen. Batterikjemi er oppgitt som litium-ion.",
    pros: [
      "Tre varianter med full NO-prisliste fra 49 kWt FWD til 61 kWt AWD",
      "Kompakt inngangsmodell i Toyotas elektriske SUV-serie",
      "Peak DC 67 kW og 10–80 (45 min) dokumentert",
    ],
    cons: [
      "Varmepumpe ikke bekreftet som ett enkelt true/false-felt — ikke gjettet",
      "Lavere peak DC (67 kW) enn bZ4X- og C-HR+-familien",
      "Offisiell vinterrekkevidde ikke lagret som egen katalogverdi — ikke gjettet",
    ],
    suitable_for: [
      "Bybruk og pendling med kompakt elektrisk SUV",
      "Kjøpere med begrenset budsjett som fortsatt vil ha offisiell NO-data",
      "Lett tilhengerkjøring (750 kg bremset)",
    ],
    variants: [
      {
        name: "Active 49 kWh FWD",
        slug: "active-49-fwd",
        is_default: true,
        battery_usable_kwh: 48,
        battery_total_kwh: 49,
        range_km: 344,
        consumption_kwh_100km: 14.9,
        ac_charging_kw: 11,
        dc_charging_kw: 67,
        charge_time_10_80_minutes: 45,
        drivetrain: "Forhjulsdrift",
        power_hp: 144,
        acceleration_0_100: 9.6,
        towing_kg: 750,
        source_name: "Toyota Norge — Forhandler prisliste Urban Cruiser (PDF)",
        source_url: SRC.urbanCruiserPdf,
        import_notes:
          "49/48 kWt (total/usable). 144 hk / 106 kW. WLTP 344 km. Bremset tilhenger 750 kg.",
      },
      {
        name: "Active 61 kWh FWD",
        slug: "active-61-fwd",
        battery_usable_kwh: 60,
        battery_total_kwh: 61,
        range_km: 426,
        consumption_kwh_100km: 15.1,
        ac_charging_kw: 11,
        dc_charging_kw: 67,
        charge_time_10_80_minutes: 45,
        drivetrain: "Forhjulsdrift",
        power_hp: 174,
        towing_kg: 750,
        source_name: "Toyota Norge — Forhandler prisliste Urban Cruiser (PDF)",
        source_url: SRC.urbanCruiserPdf,
        import_notes:
          "61/60 kWt (total/usable). 174 hk / 128 kW. WLTP 426 km. Bremset tilhenger 750 kg.",
      },
      {
        name: "Active 61 kWh AWD",
        slug: "active-61-awd",
        battery_usable_kwh: 60,
        battery_total_kwh: 61,
        range_km: 395,
        consumption_kwh_100km: 16.6,
        ac_charging_kw: 11,
        dc_charging_kw: 67,
        charge_time_10_80_minutes: 45,
        drivetrain: "Firehjulsdrift",
        power_hp: 184,
        torque_nm: 300,
        acceleration_0_100: 7.4,
        towing_kg: 750,
        source_name: "Toyota Norge — Modellsammenligning Urban Cruiser",
        source_url: SRC.compare,
        import_notes:
          "61/60 kWt (total/usable). 184 hk / 135 kW / 300 Nm fra modellsammenligning. WLTP 395 km. Bremset tilhenger 750 kg.",
      },
    ],
  },
];

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

function fieldMeta(source_name: string, source_url: string, notes?: string) {
  return {
    draft: false,
    notes: notes ?? null,
    confidence: 0.92,
    source_url,
    imported_at: CHECKED_AT,
    source_name,
    retrieved_at: CHECKED_AT,
    import_job_id: null,
    review_status: "approved",
    research_job_id: null,
    data_last_checked_at: CHECKED_AT,
  };
}

function buildScoreNotes(cfg: ModelCfg): string {
  const extras: string[] = [];
  extras.push(
    cfg.battery_chemistry
      ? `## Batterikjemi
Batterikjemi er oppgitt som ${cfg.battery_chemistry} i Toyota Norge-dokumentasjon (forhandler prisliste / spesifikasjoner) — ikke spekulert utover dette.`
      : `## Batterikjemi
Batterikjemi er ikke oppgitt i Toyota Norge-dokumentasjon for denne modellen — ikke gjettet.`,
  );
  extras.push(
    `## Batteri
NO forhandlerprisliste/spesifikasjon oppgir batteristørrelse i kWt (total/usable der begge tall er oppgitt) — lagret uten å gjette separat usable-delta der kun ett tall er oppgitt.`,
  );
  if (cfg.documentChargingHonesty) {
    extras.push(
      `## Lading
Peak DC-effekt (kW) er ikke oppgitt som tall i hentet Toyota Norge-materiale for denne modellen — ikke gjettet. AC-lading og eventuell 10–80 er lagret der oppgitt. Type 2 + CCS2 er dokumentert.`,
    );
  }
  if (cfg.documentHeatPumpHonesty) {
    extras.push(
      `## Varme pumpe
Varmepumpe (varmepumpe) er ikke eksplisitt bekreftet som ett enkelt true/false-felt i hentet Toyota Norge-materiale for denne modellen — ikke lagret som spekulert boolean. Ikke gjettet.`,
    );
  }
  if (cfg.documentFrunkMissing) {
    extras.push(
      `## Frunk
Frunk (l) er ikke oppgitt i hentet Toyota Norge-materiale — ikke gjettet. Left empty.`,
    );
  }
  if (cfg.documentInteriorMissing) {
    extras.push(
      `## Interiør
Offisielt interiørbilde er ikke tilgjengelig / ikke verifisert i dette produksjonsalbumet — left empty.`,
    );
  }
  if (cfg.documentRearMissing) {
    extras.push(
      `## Bak
Offisielt bakfoto er ikke tilgjengelig / ikke verifisert i dette produksjonsalbumet — left empty.`,
    );
  }
  if (cfg.forceNotReady) {
    extras.push(
      `## Image Ready
Hero/Front/Side mangler eller offisiell dokumentasjon er ufullstendig. NOT_READY. Ingen gjettede bilder eller spekker.`,
    );
  }
  if (cfg.towing_kg === null && !cfg.forceNotReady) {
    extras.push(
      `## Tilhenger
Tilhenger ikke oppgitt i hentet Toyota Norge-materiale. Ingen tilhengerverdi lagret. Ikke gjettet.`,
    );
  }
  extras.push(
    `## Vinter
Ingen offisiell vinterrekkevidde er lagret som egen katalogverdi — ikke gjettet. Forvent lavere rekkevidde i kulde. Laboratoriemål (WLTP) erstatter ikke reell rekkevidde.`,
  );

  return `## Hvem bilen passer for
Toyota ${cfg.model} passer for brukere som vurderer helelektrisk Toyota i dette segmentet. Sammenlign varianter for batteri, WLTP, lading og tilhengertall.

## Vinter
Se notat under. Laboratoriemål erstatter ikke reell rekkevidde.

## Lading
Se variantnivå og kilder. Combined Charging System (CCS2) der oppgitt i Toyota Norge-dokumentasjon.

## Daglig bruk
Egnet for hverdag når dimensjoner, seter og bagasje matcher behov.

## Langtur
Planlegg ladestopp ut fra variantens WLTP og offisiell 10–80 der bekreftet. Laboratoriemål erstatter ikke reell rekkevidde.

## FAQ
**Hvor finner jeg offisielle tall?** Toyota Norge forhandler prisliste / spesifikasjoner for ${cfg.model}.
**Er vinterrekkevidde oppgitt?** Nei som egen katalogverdi her — ikke gjettet.
**Er peak DC kW oppgitt?** Se variantnivå — kun lagret der dokumentert i forhandlermateriale eller modellsammenligning.
**Kan tallene endre seg?** Ja — bekreft alltid gjeldende verdier hos Toyota Norge / forhandler før kjøp.

${extras.join("\n\n")}`.trim();
}

async function ensureBrand(sb: SupabaseClient): Promise<string> {
  const { data: existing } = await sb
    .from("brands")
    .select("id")
    .eq("slug", "toyota")
    .maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data, error } = await sb
    .from("brands")
    .insert({
      name: "Toyota",
      slug: "toyota",
      website_url: "https://www.toyota.no",
      country: "JP",
      is_active: true,
      description: "Toyota Norway",
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("brand insert");
  return data.id as string;
}

async function attachLocalImage(
  sb: SupabaseClient,
  input: {
    carId: string;
    slug: string;
    role: Role;
    localPath: string;
    isPrimary: boolean;
    sortOrder: number;
    alt: string;
  },
): Promise<string> {
  const abs = resolve(process.cwd(), input.localPath);
  if (!existsSync(abs)) throw new Error(`Missing image ${input.localPath}`);
  const webp = await sharp(readFileSync(abs)).webp({ quality: 88 }).toBuffer();
  const storageRole = resolveStorageRole({
    isPrimary: input.isPrimary,
    imageType: input.role,
  });
  const galleryPath = buildCarImageStoragePath({
    brand: BRAND,
    modelSlug: input.slug,
    role: storageRole,
    uniqueId: randomUUID(),
  });
  const { error: upErr } = await sb.storage
    .from(IMAGE_BUCKET)
    .upload(galleryPath, webp, { contentType: "image/webp", upsert: false });
  if (upErr) throw upErr;

  const imageUrl = publicUrlForCarImagePath(galleryPath);
  const { data: row, error: insErr } = await sb
    .from("car_images")
    .insert({
      car_id: input.carId,
      image_url: imageUrl,
      storage_path: galleryPath,
      image_type: input.role,
      alt_text: input.alt,
      sort_order: input.sortOrder,
      is_primary: input.isPrimary,
    })
    .select("id")
    .single();
  if (insErr || !row) throw insErr ?? new Error("insert car_images");

  if (input.isPrimary) {
    await sb
      .from("cars")
      .update({ image_url: imageUrl, updated_at: CHECKED_AT })
      .eq("id", input.carId);
  }
  return row.id as string;
}

async function upsertCar(
  sb: SupabaseClient,
  brandId: string,
  cfg: ModelCfg,
): Promise<string> {
  const defaultVariant =
    cfg.variants.find((v) => v.is_default) ?? cfg.variants[0];
  const score_notes = buildScoreNotes(cfg);
  const approved = !cfg.forceNotReady;
  const sources = {
    year: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl, `Modellår ${cfg.year}`),
    length_mm: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    width_mm: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    height_mm: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    wheelbase_mm: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    cargo_l: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    seats: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    towing_kg: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    battery_chemistry: fieldMeta(
      cfg.primarySourceName,
      cfg.primarySourceUrl,
      cfg.battery_chemistry
        ? `Batterikjemi oppgitt som ${cfg.battery_chemistry}`
        : "Batterikjemi ikke oppgitt — ikke gjettet",
    ),
    charging_connector_ac: fieldMeta(
      cfg.primarySourceName,
      cfg.primarySourceUrl,
      "Type 2",
    ),
    charging_connector_dc: fieldMeta(
      cfg.primarySourceName,
      cfg.primarySourceUrl,
      "CCS2",
    ),
    description: fieldMeta("EVFAKTA editorial (sourced claims only)", cfg.page),
    pros: fieldMeta("EVFAKTA editorial (sourced claims only)", cfg.page),
    cons: fieldMeta("EVFAKTA editorial (sourced claims only)", cfg.page),
    suitable_for: fieldMeta("EVFAKTA editorial (sourced claims only)", cfg.page),
    score_notes: fieldMeta("EVFAKTA editorial (sourced claims only)", cfg.page),
  };

  const patch: Record<string, unknown> = {
    brand: BRAND,
    brand_id: brandId,
    model: cfg.model,
    slug: cfg.slug,
    year: cfg.year,
    body_style: cfg.body_style,
    vehicle_type: cfg.vehicle_type,
    country: "NO",
    seats: cfg.seats,
    length_mm: cfg.length_mm,
    width_mm: cfg.width_mm,
    height_mm: cfg.height_mm,
    wheelbase_mm: cfg.wheelbase_mm,
    cargo_l: cfg.cargo_l,
    frunk_l: cfg.frunk_l ?? null,
    towing_kg: cfg.towing_kg,
    battery_chemistry: cfg.battery_chemistry,
    battery_usable_kwh: defaultVariant.battery_usable_kwh ?? null,
    battery_total_kwh: defaultVariant.battery_total_kwh ?? null,
    range_km: defaultVariant.range_km ?? null,
    consumption_kwh_100km: defaultVariant.consumption_kwh_100km ?? null,
    ac_charging_kw: defaultVariant.ac_charging_kw ?? null,
    dc_charging_kw: defaultVariant.dc_charging_kw ?? null,
    charge_time_10_80_minutes: defaultVariant.charge_time_10_80_minutes ?? null,
    drivetrain: defaultVariant.drivetrain ?? null,
    power_hp: defaultVariant.power_hp ?? null,
    torque_nm: defaultVariant.torque_nm ?? null,
    acceleration_0_100: defaultVariant.acceleration_0_100 ?? null,
    top_speed_kmh: defaultVariant.top_speed_kmh ?? null,
    charging_connector_ac: cfg.charging_connector_ac,
    charging_connector_dc: cfg.charging_connector_dc,
    heat_pump: cfg.heat_pump,
    description: cfg.description,
    pros: cfg.pros,
    cons: cfg.cons,
    suitable_for: cfg.suitable_for,
    score_notes,
    field_sources: sources,
    source_name: cfg.primarySourceName,
    source_url: cfg.primarySourceUrl,
    data_last_checked_at: CHECKED_AT,
    import_status: approved ? "approved" : "needs_review",
    import_notes: cfg.forceNotReady
      ? `phase1-toyota-100-${CHECKED_AT.slice(0, 10)} | NOT_READY — incomplete docs or Image Ready blocked | unpublished`
      : `phase1-toyota-100-${CHECKED_AT.slice(0, 10)} | Image Ready + editorial finalized | Toyota Norge forhandler prisliste/spesifikasjoner | unpublished`,
    is_published: false,
    updated_at: CHECKED_AT,
  };

  const { data: existing } = await sb
    .from("cars")
    .select("id")
    .eq("slug", cfg.slug)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await sb.from("cars").update(patch).eq("id", existing.id);
    if (error) throw error;
    return existing.id as string;
  }

  const { data, error } = await sb
    .from("cars")
    .insert(patch)
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error(`insert ${cfg.slug}`);
  return data.id as string;
}

async function upsertVariants(
  sb: SupabaseClient,
  carId: string,
  variants: VariantCfg[],
  year: number,
) {
  const { data: existing } = await sb
    .from("car_variants")
    .select("id,slug")
    .eq("car_id", carId);
  const bySlug = new Map(
    (existing ?? []).map((v) => [v.slug as string, v.id as string]),
  );

  let sort = 0;
  for (const v of variants) {
    const row = {
      car_id: carId,
      name: v.name,
      slug: v.slug,
      is_default: Boolean(v.is_default),
      is_active: true,
      sort_order: sort++,
      model_year: year,
      battery_usable_kwh: v.battery_usable_kwh ?? null,
      battery_total_kwh: v.battery_total_kwh ?? null,
      range_km: v.range_km ?? null,
      consumption_kwh_100km: v.consumption_kwh_100km ?? null,
      ac_charging_kw: v.ac_charging_kw ?? null,
      dc_charging_kw: v.dc_charging_kw ?? null,
      charge_time_10_80_minutes: v.charge_time_10_80_minutes ?? null,
      drivetrain: v.drivetrain ?? null,
      power_hp: v.power_hp ?? null,
      torque_nm: v.torque_nm ?? null,
      acceleration_0_100: v.acceleration_0_100 ?? null,
      top_speed_kmh: v.top_speed_kmh ?? null,
      towing_kg: v.towing_kg ?? null,
      curb_weight_kg: v.curb_weight_kg ?? null,
      source_name: v.source_name,
      source_url: v.source_url,
      data_last_checked_at: CHECKED_AT,
      import_status: "approved",
      import_notes: v.import_notes ?? null,
      updated_at: CHECKED_AT,
    };
    const id = bySlug.get(v.slug);
    if (id) {
      const { error } = await sb.from("car_variants").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("car_variants").insert(row);
      if (error) throw error;
    }
  }
}

async function finalizeGallery(sb: SupabaseClient, carId: string, cfg: ModelCfg) {
  if (cfg.skipGallery) {
    await sb.from("car_images").delete().eq("car_id", carId);
    await sb
      .from("cars")
      .update({ image_url: null, updated_at: CHECKED_AT })
      .eq("id", carId);
    return;
  }
  for (const [role, path] of Object.entries(cfg.images)) {
    if (path && !existsSync(resolve(process.cwd(), path))) {
      throw new Error(`${cfg.slug} missing local image for ${role}: ${path}`);
    }
  }
  await sb.from("car_images").delete().eq("car_id", carId);

  let sort = 0;
  if (!cfg.images.front) throw new Error(`${cfg.slug} missing front`);
  await attachLocalImage(sb, {
    carId,
    slug: cfg.slug,
    role: "front",
    localPath: cfg.images.front,
    isPrimary: true,
    sortOrder: sort++,
    alt: `Toyota ${cfg.model} front (offisiell Toyota Norge / Scene7)`,
  });
  if (cfg.images.side) {
    await attachLocalImage(sb, {
      carId,
      slug: cfg.slug,
      role: "side",
      localPath: cfg.images.side,
      isPrimary: false,
      sortOrder: sort++,
      alt: `Toyota ${cfg.model} sideprofil (offisiell Toyota Norge / Scene7)`,
    });
  }
  if (cfg.images.rear) {
    await attachLocalImage(sb, {
      carId,
      slug: cfg.slug,
      role: "rear",
      localPath: cfg.images.rear,
      isPrimary: false,
      sortOrder: sort++,
      alt: `Toyota ${cfg.model} bak (offisiell Toyota Norge / Scene7)`,
    });
  }
  if (cfg.images.interior) {
    await attachLocalImage(sb, {
      carId,
      slug: cfg.slug,
      role: "interior",
      localPath: cfg.images.interior,
      isPrimary: false,
      sortOrder: sort++,
      alt: `Toyota ${cfg.model} interiør (offisiell Toyota Norge / Scene7)`,
    });
  }
}

async function report(sb: SupabaseClient) {
  console.log("\nModel\tCompletion\tImage\tLaunch\tPublish\tStatus");
  for (const cfg of MODELS) {
    const { data: car } = await sb
      .from("cars")
      .select("*")
      .eq("slug", cfg.slug)
      .single();
    if (!car) continue;
    const { data: images } = await sb
      .from("car_images")
      .select("*")
      .eq("car_id", car.id);
    const { data: variants } = await sb
      .from("car_variants")
      .select("*")
      .eq("car_id", car.id);
    const c = computeEditorialCompletion({
      car,
      images: images ?? [],
      variants: variants ?? [],
    });
    const hasHero =
      (images ?? []).some((i) => i.is_primary) || Boolean(car.image_url);
    const hasFront = (images ?? []).some((i) => i.image_type === "front");
    const hasSide = (images ?? []).some((i) => i.image_type === "side");
    const imageReady = Boolean(hasHero && hasFront && hasSide);
    const status = cfg.forceNotReady
      ? "NOT_READY"
      : c.canPublish
        ? "Approved, unpublished"
        : c.canLaunchReady
          ? "Launch Ready"
          : "In progress";
    console.log(
      [
        car.model,
        `${c.percent}%`,
        imageReady ? "YES" : "NO",
        c.canLaunchReady ? "YES" : "NO",
        c.canPublish ? "YES" : "NO",
        status,
        c.missing.length ? `missing=${c.missing.join("|")}` : "",
      ].join("\t"),
    );
  }
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const brandId = await ensureBrand(sb);
  for (const cfg of MODELS) {
    console.log("Processing", cfg.slug);
    const carId = await upsertCar(sb, brandId, cfg);
    await upsertVariants(sb, carId, cfg.variants, cfg.year);
    await finalizeGallery(sb, carId, cfg);
  }
  await report(sb);
  console.log(
    "batch",
    createHash("sha1")
      .update(CHECKED_AT + MODELS.map((m) => m.slug).join(","))
      .digest("hex")
      .slice(0, 12),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
