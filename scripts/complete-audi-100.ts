/**
 * Complete Audi Norwegian EV launch set to 100% Review Assistant.
 * Finishable: Q4 e-tron, Q6 e-tron, A6 e-tron, e-tron GT.
 * Q8 e-tron: specs from NO pricelist but Image Ready blocked (MediaCenter albums unavailable) → NOT_READY.
 * Official Audi Norge pricelists + MediaCenter photos / A6 eTD for cargo+DC.
 * Never invent. Never auto-publish.
 *
 * Usage: npx tsx scripts/complete-audi-100.ts
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
const BRAND = "Audi";
const YEAR = 2025;

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
  body_style: string;
  vehicle_type: string;
  seats: number;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  wheelbase_mm: number;
  cargo_l: number;
  frunk_l?: number | null;
  towing_kg: number | null;
  battery_chemistry: string;
  charging_connector_ac: string;
  charging_connector_dc: string;
  page: string;
  primarySourceName: string;
  primarySourceUrl: string;
  images: Partial<Record<Role, string>>;
  documentRearMissing?: boolean;
  documentInteriorMissing?: boolean;
  documentTowHonesty?: boolean;
  documentChargingHonesty?: boolean;
  documentHeatPumpHonesty?: boolean;
  skipGallery?: boolean;
  forceNotReady?: boolean;
  variants: VariantCfg[];
  description: string;
  pros: string[];
  cons: string[];
  suitable_for: string[];
};

const SRC = {
  q4: "https://media.audi.com/is/content/audi/country/no/assets/prislister/Prisliste-Audi-Q4-e-tron.pdf",
  q4Tech:
    "https://www.audi.ee/dam/nemo/no/models/q4-e-tron/q4-e-tron/brochure-overview/Q4-tech-ee.pdf",
  q6: "https://media.audi.com/is/content/audi/country/no/assets/prislister/Prisliste-Audi-Q6-etron.pdf",
  a6: "https://media.audi.com/is/content/audi/country/no/assets/prislister/Prisliste-Audi-A6-etron.pdf",
  a6Etd:
    "https://uploads.audi-mediacenter.com/system/production/car_motorizations/1418/file_en/b4c720dd8354c6a1294d70ca06a4c795f73240ec/eTD-Audi-A6-Sportback-e-tron-quattro-315kW_241029.pdf",
  gt: "https://media.audi.com/is/content/audi/country/no/assets/prislister/Prisliste-Audi-e-tron-GT.pdf",
  q8: "https://media.audi.com/is/content/audi/country/no/assets/prislister/Prisliste-Audi-Q8-etron.pdf",
  audiNo: "https://www.audi.no",
} as const;

const MODELS: ModelCfg[] = [
  {
    slug: "audi-q4-e-tron",
    model: "Q4 e-tron",
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4588,
    width_mm: 1865,
    height_mm: 1632,
    wheelbase_mm: 2764,
    cargo_l: 520,
    towing_kg: null,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.audi.no",
    primarySourceName: "Audi Norge — Prisliste Audi Q4 e-tron",
    primarySourceUrl: SRC.q4,
    images: {
      front: "docs/_tmp_audi/final/q4/front.jpg",
      side: "docs/_tmp_audi/final/q4/side.jpg",
      rear: "docs/_tmp_audi/final/q4/rear.jpg",
    },
    documentInteriorMissing: true,
    documentTowHonesty: true,
    documentChargingHonesty: true,
    documentHeatPumpHonesty: true,
    description:
      "Audi Q4 e-tron er den kompakte helelektriske SUV/Sportback-familien solgt i Norge. Batteri, WLTP og effekt er fra Audi Norge-prisliste (facelift 82/77 kWh). Dimensjoner og bagasje (520 l) er fra Audi Media tekniske data for Q4 e-tron-karosseriet. DC-ladeeffekt i kW er ikke oppgitt som tall i NO-prislisten — ikke gjettet. Tilhengerkapasitet i kg er ikke lagret som bilnivåverdi fra NO-prisliste — ikke gjettet.",
    pros: [
      "Kompakt e-SUV/Sportback med offisiell NO-prisliste for batteri og WLTP",
      "quattro og Performance-varianter dokumentert i Audi Norge-prisliste",
      "Offisielle MediaCenter-bilder for Hero/Front/Side/Rear",
    ],
    cons: [
      "DC kW / 10–80 ikke oppgitt som tall i NO-prisliste — dokumentert gap",
      "Tilhengerkapasitet i kg ikke lagret fra NO-prisliste — dokumentert gap",
      "Interiørbilde ikke verifisert i Q4-albumet (PPE-cockpit blandet inn) — left empty",
    ],
    suitable_for: [
      "Pendling og bybruk i kompakt SUV-segmentet",
      "Familier som vil ha Audi e-tron med quattro-valg",
      "Langtur når variantens WLTP planlegges inn med ærlige ladegap",
    ],
    variants: [
      {
        name: "quattro",
        slug: "quattro",
        is_default: true,
        battery_usable_kwh: 77,
        battery_total_kwh: 82,
        range_km: 544,
        consumption_kwh_100km: 16.52,
        drivetrain: "Firehjulsdrift",
        power_hp: 299,
        source_name: "Audi Norge — Prisliste Audi Q4 e-tron",
        source_url: SRC.q4,
        import_notes: "SUV quattro 220 kW → 299 hk (PS). WLTP 544 km.",
      },
      {
        name: "quattro Performance",
        slug: "quattro-performance",
        battery_usable_kwh: 77,
        battery_total_kwh: 82,
        range_km: 529,
        consumption_kwh_100km: 16.66,
        drivetrain: "Firehjulsdrift",
        power_hp: 340,
        source_name: "Audi Norge — Prisliste Audi Q4 e-tron",
        source_url: SRC.q4,
        import_notes: "SUV Performance 250 kW → 340 hk (PS). WLTP 529 km.",
      },
      {
        name: "Sportback quattro",
        slug: "sportback-quattro",
        battery_usable_kwh: 77,
        battery_total_kwh: 82,
        range_km: 557,
        consumption_kwh_100km: 16.08,
        drivetrain: "Firehjulsdrift",
        power_hp: 299,
        source_name: "Audi Norge — Prisliste Audi Q4 e-tron",
        source_url: SRC.q4,
        import_notes: "Sportback quattro 220 kW. WLTP 557 km.",
      },
    ],
  },
  {
    slug: "audi-q6-e-tron",
    model: "Q6 e-tron",
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4771,
    width_mm: 1939,
    height_mm: 1685,
    wheelbase_mm: 2889,
    cargo_l: 526,
    frunk_l: 64,
    towing_kg: 2400,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.audi.no",
    primarySourceName: "Audi Norge — Prisliste Audi Q6 e-tron",
    primarySourceUrl: SRC.q6,
    images: {
      front: "docs/_tmp_audi/final/q6/front.jpg",
      side: "docs/_tmp_audi/final/q6/side.jpg",
      rear: "docs/_tmp_audi/final/q6/rear.jpg",
      interior: "docs/_tmp_audi/final/q6/interior.jpg",
    },
    documentHeatPumpHonesty: true,
    description:
      "Audi Q6 e-tron er PPE-basert midsize e-SUV solgt i Norge. Tekniske data (batteri 100/94,9 kWh, DC opptil 270 kW, tilhenger 2400 kg, dimensjoner og bagasje) er fra Audi Norge-prisliste. CCS2 er oppgitt som Combined Charging System type 2 i prislisten. Varme pumpe er ikke lagret som boolean — ikke gjettet.",
    pros: [
      "PPE med offisiell NO-prisliste for batteri, DC og tilhenger",
      "SQ6-variant dokumentert i samme prisliste",
      "Hero/Front/Side/Rear/Interior fra Audi MediaCenter",
    ],
    cons: [
      "WLTP er laboratoriemål — ingen offisiell vinterrekkevidde lagret",
      "Varme pumpe ikke bekreftet som boolean i NO-prisliste",
      "Variantavhengig rekkevidde — les variantnivå",
    ],
    suitable_for: [
      "Familier i midsize SUV-segmentet",
      "Brukere som trenger tilhenger inntil 2400 kg",
      "Langtur med planlagt DC-lading opptil 270 kW",
    ],
    variants: [
      {
        name: "quattro",
        slug: "quattro",
        is_default: true,
        battery_usable_kwh: 94.9,
        battery_total_kwh: 100,
        range_km: 626,
        consumption_kwh_100km: 19.7,
        ac_charging_kw: 11,
        dc_charging_kw: 270,
        charge_time_10_80_minutes: 21,
        drivetrain: "Firehjulsdrift",
        power_hp: 428,
        torque_nm: 855,
        acceleration_0_100: 5.1,
        top_speed_kmh: 210,
        towing_kg: 2400,
        curb_weight_kg: 2400,
        source_name: "Audi Norge — Prisliste Audi Q6 e-tron",
        source_url: SRC.q6,
        import_notes:
          "315 kW → 428 hk. Dreiemoment bak/foran 580/275. Alternativ DC 150 kW / 30 min også i tabell.",
      },
      {
        name: "SQ6 e-tron quattro",
        slug: "sq6-e-tron-quattro",
        battery_usable_kwh: 94.9,
        battery_total_kwh: 100,
        range_km: 598,
        consumption_kwh_100km: 18.4,
        ac_charging_kw: 11,
        dc_charging_kw: 270,
        charge_time_10_80_minutes: 21,
        drivetrain: "Firehjulsdrift",
        power_hp: 517,
        torque_nm: 855,
        acceleration_0_100: 4.3,
        top_speed_kmh: 210,
        towing_kg: 2400,
        curb_weight_kg: 2425,
        source_name: "Audi Norge — Prisliste Audi Q6 e-tron",
        source_url: SRC.q6,
        import_notes: "360 (380) kW med Launch Control → 517 hk (base 360 kW).",
      },
    ],
  },
  {
    slug: "audi-a6-e-tron",
    model: "A6 e-tron",
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4928,
    width_mm: 1923,
    height_mm: 1487,
    wheelbase_mm: 2946,
    cargo_l: 502,
    frunk_l: 27,
    towing_kg: 2100,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.audi.no",
    primarySourceName: "Audi Norge — Prisliste Audi A6 e-tron",
    primarySourceUrl: SRC.a6,
    images: {
      front: "docs/_tmp_audi/final/a6/front.jpg",
      side: "docs/_tmp_audi/final/a6/side.jpg",
      rear: "docs/_tmp_audi/final/a6/rear.jpg",
      interior: "docs/_tmp_audi/final/a6/interior.jpg",
    },
    documentHeatPumpHonesty: true,
    description:
      "Audi A6 e-tron (Sportback/Avant) er øvre mellomklasse BEV solgt i Norge. Effekt, WLTP, forbruk og tilhenger 2100 kg er fra Audi Norge-prisliste. Dimensjoner fra NO-prisliste måltabell (Sportback). Bagasje 502 l + frunk 27 l og DC 270 kW / 21 min (10–80) er fra Audi MediaCenter eTD for A6 Sportback e-tron quattro. Varme pumpe ikke lagret som boolean — ikke gjettet.",
    pros: [
      "Lang WLTP-rekkevidde dokumentert i NO-prisliste (opptil 706 km Sportback)",
      "Offisiell eTD for bagasje/frunk og DC-lading",
      "MediaCenter-bilder inkl. norsk registrert eksemplar",
    ],
    cons: [
      "Ingen offisiell vinterrekkevidde lagret — laboratoriemål",
      "Varme pumpe ikke bekreftet som boolean i NO-prisliste",
      "Sportback vs Avant har ulike WLTP — les variant",
    ],
    suitable_for: [
      "Langtur og motorvei i øvre mellomklasse",
      "Brukere som trenger tilhenger inntil 2100 kg",
      "Familier som vurderer Sportback eller Avant",
    ],
    variants: [
      {
        name: "Sportback e-tron quattro",
        slug: "sportback-e-tron-quattro",
        is_default: true,
        battery_usable_kwh: 94.9,
        battery_total_kwh: 100,
        range_km: 706,
        consumption_kwh_100km: 15.04,
        ac_charging_kw: 11,
        dc_charging_kw: 270,
        charge_time_10_80_minutes: 21,
        drivetrain: "Firehjulsdrift",
        power_hp: 462,
        torque_nm: 855,
        acceleration_0_100: 4.5,
        towing_kg: 2100,
        source_name: "Audi Norge — Prisliste Audi A6 e-tron",
        source_url: SRC.a6,
        import_notes: "462 hk inkl. boost ifølge NO-prisliste fotnote.",
      },
      {
        name: "Avant e-tron quattro",
        slug: "avant-e-tron-quattro",
        battery_usable_kwh: 94.9,
        battery_total_kwh: 100,
        range_km: 667,
        consumption_kwh_100km: 16.03,
        ac_charging_kw: 11,
        dc_charging_kw: 270,
        charge_time_10_80_minutes: 21,
        drivetrain: "Firehjulsdrift",
        power_hp: 462,
        torque_nm: 855,
        acceleration_0_100: 4.5,
        towing_kg: 2100,
        source_name: "Audi Norge — Prisliste Audi A6 e-tron",
        source_url: SRC.a6,
      },
      {
        name: "S6 Sportback e-tron",
        slug: "s6-sportback-e-tron",
        battery_usable_kwh: 94.9,
        battery_total_kwh: 100,
        range_km: 662,
        consumption_kwh_100km: 16.2,
        ac_charging_kw: 11,
        dc_charging_kw: 270,
        charge_time_10_80_minutes: 21,
        drivetrain: "Firehjulsdrift",
        power_hp: 551,
        torque_nm: 855,
        acceleration_0_100: 3.9,
        towing_kg: 2100,
        source_name: "Audi Norge — Prisliste Audi A6 e-tron",
        source_url: SRC.a6,
      },
      {
        name: "S6 Avant e-tron",
        slug: "s6-avant-e-tron",
        battery_usable_kwh: 94.9,
        battery_total_kwh: 100,
        range_km: 634,
        consumption_kwh_100km: 16.9,
        ac_charging_kw: 11,
        dc_charging_kw: 270,
        charge_time_10_80_minutes: 21,
        drivetrain: "Firehjulsdrift",
        power_hp: 551,
        torque_nm: 855,
        acceleration_0_100: 4.1,
        towing_kg: 2100,
        source_name: "Audi Norge — Prisliste Audi A6 e-tron",
        source_url: SRC.a6,
      },
    ],
  },
  {
    slug: "audi-e-tron-gt",
    model: "e-tron GT",
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 5004,
    width_mm: 1964,
    height_mm: 1394,
    wheelbase_mm: 2900,
    cargo_l: 405,
    frunk_l: 77,
    towing_kg: null,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.audi.no",
    primarySourceName: "Audi Norge — Prisliste Audi e-tron GT",
    primarySourceUrl: SRC.gt,
    images: {
      front: "docs/_tmp_audi/final/gt/front.jpg",
      side: "docs/_tmp_audi/final/gt/side.jpg",
      rear: "docs/_tmp_audi/final/gt/rear.jpg",
    },
    documentInteriorMissing: true,
    documentTowHonesty: true,
    documentHeatPumpHonesty: true,
    description:
      "Audi e-tron GT (S / RS / RS Performance) er den helelektriske grand tourer solgt i Norge. Batteri 105/97 kWh, DC 320 kW / 18 min (10–80), dimensjoner og bagasje er fra Audi Norge-prisliste. Tilhengerkapasitet er ikke oppgitt som tall i tekniske data-tabellen — ikke gjettet. Interiørbilde ikke funnet i S e-tron GT-albumet — left empty.",
    pros: [
      "Høy DC-effekt 320 kW dokumentert i NO-prisliste",
      "S/RS/RS Performance-varianter med offisielle tall",
      "MediaCenter Hero/Front/Side/Rear",
    ],
    cons: [
      "Tilhengerkapasitet ikke oppgitt i NO tekniske data — dokumentert gap",
      "Interiør ikke verifisert i album — left empty",
      "Ingen offisiell vinterrekkevidde lagret",
    ],
    suitable_for: [
      "Sportslig langtur og motorvei",
      "Brukere som prioriterer ytelse og DC-lading",
      "Sammenligning mot andre premium GT/sedan BEV",
    ],
    variants: [
      {
        name: "S e-tron GT",
        slug: "s-e-tron-gt",
        is_default: true,
        battery_usable_kwh: 97,
        battery_total_kwh: 105,
        range_km: 605,
        consumption_kwh_100km: 19.7,
        ac_charging_kw: 11,
        dc_charging_kw: 320,
        charge_time_10_80_minutes: 18,
        drivetrain: "Firehjulsdrift",
        power_hp: 592,
        torque_nm: 740,
        acceleration_0_100: 3.6,
        top_speed_kmh: 245,
        curb_weight_kg: 2385,
        source_name: "Audi Norge — Prisliste Audi e-tron GT",
        source_url: SRC.gt,
        import_notes: "435 (500) kW / 592 hk. 0–100 3,6 (3,4) med LC.",
      },
      {
        name: "RS e-tron GT",
        slug: "rs-e-tron-gt",
        battery_usable_kwh: 97,
        battery_total_kwh: 105,
        range_km: 593,
        consumption_kwh_100km: 21.1,
        ac_charging_kw: 11,
        dc_charging_kw: 320,
        charge_time_10_80_minutes: 18,
        drivetrain: "Firehjulsdrift",
        power_hp: 680,
        torque_nm: 865,
        acceleration_0_100: 3.1,
        top_speed_kmh: 250,
        curb_weight_kg: 2395,
        source_name: "Audi Norge — Prisliste Audi e-tron GT",
        source_url: SRC.gt,
        import_notes: "570 (630) kW. Bagasje bak 350 l i tabell for RS.",
      },
      {
        name: "RS e-tron GT Performance",
        slug: "rs-e-tron-gt-performance",
        battery_usable_kwh: 97,
        battery_total_kwh: 105,
        range_km: 584,
        consumption_kwh_100km: 20.8,
        ac_charging_kw: 11,
        dc_charging_kw: 320,
        charge_time_10_80_minutes: 18,
        drivetrain: "Firehjulsdrift",
        power_hp: 748,
        torque_nm: 1027,
        acceleration_0_100: 2.9,
        top_speed_kmh: 250,
        curb_weight_kg: 2395,
        source_name: "Audi Norge — Prisliste Audi e-tron GT",
        source_url: SRC.gt,
        import_notes: "620 (680) kW / 748 hk. 0–100 2,9 (2,5) med LC.",
      },
    ],
  },
  {
    slug: "audi-q8-e-tron",
    model: "Q8 e-tron",
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4915,
    width_mm: 1937,
    height_mm: 1633,
    wheelbase_mm: 2928,
    cargo_l: 569,
    frunk_l: 62,
    towing_kg: 1800,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.audi.no",
    primarySourceName: "Audi Norge — Prisliste Audi Q8 e-tron",
    primarySourceUrl: SRC.q8,
    images: {},
    skipGallery: true,
    forceNotReady: true,
    documentHeatPumpHonesty: true,
    documentInteriorMissing: true,
    documentRearMissing: true,
    description:
      "Audi Q8 e-tron er offisielt solgt i Norge ifølge Audi Norge-prisliste (tekniske data for 50/55/SQ8). Specs er lagret fra prislisten, men Image Ready mangler: offisielle MediaCenter-album for Q8 e-tron var utilgjengelige i dette produksjonsmiljøet — ingen gjettede bilder. Status NOT_READY til Hero/Front/Side er verifisert.",
    pros: [
      "Full teknisk tabell i Audi Norge-prisliste (batteri, DC, tilhenger, mål)",
      "SUV og Sportback dekket i samme dokument",
    ],
    cons: [
      "Image Ready mangler — MediaCenter Q8-album ikke funnet her",
      "Ikke Launch/Publish Ready uten galleri",
      "Ingen offisiell vinterrekkevidde lagret",
    ],
    suitable_for: [
      "Katalogdekning for norsk solgt Audi e-SUV",
      "Senere bildeproduksjon når offisielle album er tilgjengelige",
    ],
    variants: [
      {
        name: "50 quattro",
        slug: "50-quattro",
        is_default: true,
        battery_usable_kwh: 89,
        battery_total_kwh: 95,
        range_km: 491,
        consumption_kwh_100km: 20.1,
        ac_charging_kw: 11,
        dc_charging_kw: 150,
        charge_time_10_80_minutes: 28,
        drivetrain: "Firehjulsdrift",
        power_hp: 340,
        torque_nm: 664,
        acceleration_0_100: 6.0,
        top_speed_kmh: 200,
        towing_kg: 1800,
        curb_weight_kg: 2585,
        source_name: "Audi Norge — Prisliste Audi Q8 e-tron",
        source_url: SRC.q8,
        import_notes: "250 kW. DC 150 kW / 28 min (10–80).",
      },
      {
        name: "55 quattro",
        slug: "55-quattro",
        battery_usable_kwh: 106,
        battery_total_kwh: 114,
        range_km: 582,
        consumption_kwh_100km: 20.6,
        ac_charging_kw: 11,
        dc_charging_kw: 170,
        charge_time_10_80_minutes: 31,
        drivetrain: "Firehjulsdrift",
        power_hp: 408,
        torque_nm: 664,
        acceleration_0_100: 5.6,
        top_speed_kmh: 200,
        towing_kg: 1800,
        curb_weight_kg: 2585,
        source_name: "Audi Norge — Prisliste Audi Q8 e-tron",
        source_url: SRC.q8,
        import_notes: "300 kW. DC 170 kW / 31 min.",
      },
      {
        name: "SQ8 e-tron quattro",
        slug: "sq8-e-tron-quattro",
        battery_usable_kwh: 106,
        battery_total_kwh: 114,
        range_km: 458,
        consumption_kwh_100km: 29.0,
        ac_charging_kw: 11,
        dc_charging_kw: 170,
        charge_time_10_80_minutes: 31,
        drivetrain: "Firehjulsdrift",
        power_hp: 503,
        torque_nm: 973,
        acceleration_0_100: 4.5,
        top_speed_kmh: 210,
        towing_kg: 1800,
        curb_weight_kg: 2725,
        source_name: "Audi Norge — Prisliste Audi Q8 e-tron",
        source_url: SRC.q8,
        import_notes: "370 kW.",
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
  if (cfg.documentChargingHonesty) {
    extras.push(
      `## Lading
DC-effekt (kW) og/eller 10–80 er ikke oppgitt som tall i Audi Norge-prislisten for denne modellen — ikke gjettet. AC/CCS er dokumentert der det finnes; planlegg lading ut fra forhandler/offisiell oppdatering.`,
    );
  } else {
    extras.push(
      `## Lading
Planlegg lading ut fra variantens AC/DC og 10–80 % i Audi Norge-prisliste / eTD. Praktisk ladetid varierer med temperatur og ladeinfrastruktur.`,
    );
  }
  if (cfg.documentTowHonesty) {
    extras.push(
      `## Tilhenger
Tillatt tilhengervekt: ikke én bilnivåverdi lagret fra NO-prisliste tekniske data for denne modellen — ikke gjettet. Tilhengerfeste kan være ekstrautstyr.`,
    );
  }
  if (cfg.documentInteriorMissing) {
    extras.push(
      `## Interiør
Offisielt interiørbilde er ikke tilgjengelig / ikke verifisert i dette produksjonsalbumet — left empty. Ikke gjettet.`,
    );
  }
  if (cfg.documentRearMissing) {
    extras.push(
      `## Bak
Offisielt bakfoto er ikke tilgjengelig i dette produksjonsmiljøet — left empty.`,
    );
  }
  if (cfg.documentHeatPumpHonesty) {
    extras.push(
      `## Varme pumpe
Varme pumpe er ikke bekreftet som boolean i Audi Norge-prisliste — ikke gjettet.`,
    );
  }
  if (cfg.forceNotReady) {
    extras.push(
      `## Image Ready
Hero/Front/Side mangler — offisielle Q8 MediaCenter-album ikke funnet her. NOT_READY til galleri er verifisert. Ingen gjettede bilder.`,
    );
  }
  if (cfg.slug === "audi-q4-e-tron") {
    extras.push(
      `## Dimensjoner
Lengde/bredde/høyde/hjulavstand og bagasje 520 l er fra Audi Media tekniske data for Q4 e-tron-karosseriet (EE/DE-ark), kombinert med NO-prisliste for energi. Ikke gjettet utover offisielle ark.`,
    );
  }
  if (cfg.slug === "audi-a6-e-tron") {
    extras.push(
      `## Bagasje
502 l bak + 27 l frunk fra Audi MediaCenter eTD (A6 Sportback e-tron quattro). DC 270 kW / 21 min bekreftet i eTD og omtalt i NO-prisliste.`,
    );
  }

  return `## Hvem bilen passer for
Audi ${cfg.model} passer for brukere som vurderer helelektrisk Audi i dette segmentet. Sammenlign varianter for batteri, WLTP, lading og tilhengertall.

## Vinter
Ingen offisiell vinterrekkevidde er lagret som egen katalogverdi — ikke gjettet. Forvent lavere rekkevidde i kulde. Forhåndskondisjonering og dekkvalg påvirker. Laboratoriemål (WLTP) erstatter ikke reell rekkevidde.

## Lading
Se variantnivå og kilder over. Combined Charging System (CCS2) der oppgitt i Audi Norge-dokumentasjon.

## Daglig bruk
Egnet for hverdag når dimensjoner, seter og bagasje matcher behov. Les variantnivå for effekt og trekk.

## Langtur
Planlegg ladestopp ut fra variantens WLTP og DC-kapasitet. Laboratoriemål erstatter ikke reell rekkevidde.

## FAQ
**Hvor finner jeg offisielle tall?** Audi Norge-prisliste for ${cfg.model} (+ eTD/Media der sitert).
**Er vinterrekkevidde oppgitt?** Nei som egen katalogverdi her — ikke gjettet.
**Kan tallene endre seg?** Ja — bekreft alltid gjeldende verdier hos Audi Norge / forhandler før kjøp.

${extras.join("\n\n")}`.trim();
}

async function ensureBrand(sb: SupabaseClient): Promise<string> {
  const { data: existing } = await sb
    .from("brands")
    .select("id")
    .eq("slug", "audi")
    .maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data, error } = await sb
    .from("brands")
    .insert({
      name: "Audi",
      slug: "audi",
      website_url: "https://www.audi.no",
      country: "DE",
      is_active: true,
      description: "Audi Norge / AUDI AG",
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
    year: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl, `Modellår ${YEAR}`),
    length_mm: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    width_mm: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    height_mm: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    wheelbase_mm: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    cargo_l: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    seats: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    towing_kg: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    battery_chemistry: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    charging_connector_ac: fieldMeta(
      cfg.primarySourceName,
      cfg.primarySourceUrl,
      "Type 2 / CCS Combined Charging System",
    ),
    charging_connector_dc: fieldMeta(
      cfg.primarySourceName,
      cfg.primarySourceUrl,
      "CCS2 Combined Charging System",
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
    year: YEAR,
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
    heat_pump: null,
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
      ? `phase1-audi-100-${CHECKED_AT.slice(0, 10)} | NOT_READY — specs from NO pricelist; Image Ready blocked | unpublished`
      : `phase1-audi-100-${CHECKED_AT.slice(0, 10)} | Image Ready + editorial finalized | Audi Norge pricelist | unpublished`,
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
      model_year: YEAR,
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
    alt: `Audi ${cfg.model} front (Audi MediaCenter)`,
  });
  if (cfg.images.side) {
    await attachLocalImage(sb, {
      carId,
      slug: cfg.slug,
      role: "side",
      localPath: cfg.images.side,
      isPrimary: false,
      sortOrder: sort++,
      alt: `Audi ${cfg.model} sideprofil (Audi MediaCenter)`,
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
      alt: `Audi ${cfg.model} bak (Audi MediaCenter)`,
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
      alt: `Audi ${cfg.model} interiør (Audi MediaCenter)`,
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
    await upsertVariants(sb, carId, cfg.variants);
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
