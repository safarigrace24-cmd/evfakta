/**
 * Complete Mercedes-Benz Norwegian EV launch set where Image Ready + official NO specs exist.
 * Finishable: CLA, CLA Shooting Brake, GLB, GLC, EQS, EQS SUV, EQE SUV, G-Class Electric, EQA.
 * NOT_READY: C-Class Electric (Image Ready blocked). Discontinued/upcoming documented in batch report only.
 * Official mercedes-benz.no model pages (Bertel O. Steen). Never invent. Never auto-publish.
 *
 * Usage: npx tsx scripts/complete-mercedes-100.ts
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
const BRAND = "Mercedes-Benz";

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
  description: string;
  pros: string[];
  cons: string[];
  suitable_for: string[];
  variants: VariantCfg[];
  forceNotReady?: boolean;
  skipGallery?: boolean;
  documentRearMissing?: boolean;
  documentInteriorMissing?: boolean;
  documentChargingHonesty?: boolean;
  documentHeatPumpHonesty?: boolean;
  documentFrunkMissing?: boolean;
  documentTowingHonesty?: boolean;
  documentConsumptionHonesty?: boolean;
  extraScoreNotes?: string[];
};

const SRC = {
  passer: "https://www.mercedes-benz.no/passengercars.html",
  elbilSuv: "https://www.mercedes-benz.no/our-brands/elbil-suv/",
  cla: "https://www.mercedes-benz.no/models/cla-electric-c174/",
  claSb: "https://www.mercedes-benz.no/models/cla-shooting-brake-x174/",
  glb: "https://www.mercedes-benz.no/models/glb-electric-x244/",
  glc: "https://www.mercedes-benz.no/models/glc-electric-x540/",
  eqs: "https://www.mercedes-benz.no/new-models/eqs/",
  eqsSuv: "https://www.mercedes-benz.no/models/eqs-suv-x296-806-2/",
  eqeSuv: "https://www.mercedes-benz.no/models/eqe-suv-805/",
  gClass: "https://www.mercedes-benz.no/models/g-class-n465-805/",
  eqa: "https://www.mercedes-benz.no/models/eqa-806-2/",
  cClass: "https://www.mercedes-benz.no/new-models/c-class-electric/",
  eqbOut: "https://www.mercedes-benz.no/our-brands/eqb-ikke-tilgjengelig/",
  eqeOut: "https://www.mercedes-benz.no/our-brands/eqe-sedan-ikke-tilgjengelig/",
  vle: "https://www.mercedes-benz.no/new-models/vle-electric/",
  gla: "https://www.mercedes-benz.no/new-models/gla-electric/",
} as const;

const MODELS: ModelCfg[] = [
{
    slug: "mercedes-benz-cla",
    model: "CLA",
    year: 2026,
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4723,
    width_mm: 1855,
    height_mm: 1468,
    wheelbase_mm: null,
    cargo_l: 405,
    frunk_l: 101,
    towing_kg: null,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.cla,
    primarySourceName: "Mercedes-Benz Norge — CLA Electric modellside",
    primarySourceUrl: SRC.cla,
    images: {
      front: "docs/_tmp_mb/final/mercedes-benz-cla/front.jpg",
      side: "docs/_tmp_mb/final/mercedes-benz-cla/side.jpg",
      rear: "docs/_tmp_mb/final/mercedes-benz-cla/rear.jpg",
    },
    documentHeatPumpHonesty: true,
    documentTowingHonesty: true,
    documentInteriorMissing: true,
    description:
      "Mercedes-Benz CLA (elektrisk, C174) selges i Norge via mercedes-benz.no. Offisiell norsk modellside oppgir CLA 200 / 250+ / 350 4MATIC med WLTP opptil 758/734/525 km (norsk standardbil), 224–354 hk, DC opptil 320 kW (200 kW for CLA 200), batteri 85 kWh brukbar for 250+/350, bagasje 405 l / frunk 101 l, dims 4.723 / 1.855 / 1.468 mm. Varmepumpe og tilhenger er ikke lagret uten eksplisitt bekreftelse. Ingen offisiell vinterrekkevidde er lagret.",
    pros: [
      "Full NO modellside med variantnivå for rekkevidde, effekt og lading",
      "Offisiell Front/Side/Rear-galleri fra mercedes-benz.no",
      "800 V / DC opptil 320 kW dokumentert",
    ],
    cons: [
      "Tilhenger ikke oppgitt i hentet teknisk blokk — ikke gjettet",
      "Varmepumpe ikke lagret som spekulert boolean",
      "CLA 200 Nm ikke oppgitt i samme liste som 250+/350",
    ],
    suitable_for: [
      "Kompakt premium elbil med høy WLTP",
      "Kjøpere som vil ha 800 V hurtiglading",
      "Sedan-brukere som trenger frunk i tillegg til bagasje",
    ],
    variants: [
      {
        name: "CLA 200",
        slug: "cla-200",
        is_default: true,
        range_km: 525,
        consumption_kwh_100km: 14.7,
        ac_charging_kw: 11,
        dc_charging_kw: 200,
        drivetrain: "Bakhjulsdrift",
        power_hp: 224,
        source_name: "Mercedes-Benz Norge — CLA Electric",
        source_url: SRC.cla,
        import_notes: "WLTP norsk standardbil 525 km. DC 200 kW. Effekt 224 hk.",
      },
      {
        name: "CLA 250+",
        slug: "cla-250-plus",
        battery_usable_kwh: 85,
        range_km: 758,
        consumption_kwh_100km: 12.2,
        ac_charging_kw: 11,
        dc_charging_kw: 320,
        drivetrain: "Bakhjulsdrift",
        power_hp: 272,
        torque_nm: 335,
        source_name: "Mercedes-Benz Norge — CLA Electric",
        source_url: SRC.cla,
        import_notes: "85 kWh brukbar. WLTP 758 km. DC 320 kW. 272 hk / 335 Nm.",
      },
      {
        name: "CLA 350 4MATIC",
        slug: "cla-350-4matic",
        battery_usable_kwh: 85,
        range_km: 734,
        consumption_kwh_100km: 12.2,
        ac_charging_kw: 11,
        dc_charging_kw: 320,
        drivetrain: "Firehjulsdrift",
        power_hp: 354,
        torque_nm: 515,
        source_name: "Mercedes-Benz Norge — CLA Electric",
        source_url: SRC.cla,
        import_notes: "85 kWh brukbar. WLTP 734 km. 354 hk / 515 Nm 4MATIC.",
      },
    ],
    extraScoreNotes: [
      `## Batteri
CLA 250+ / 350 4MATIC: 85 kWh tilgjengelig energikapasitet (NO modellside). CLA 200 batteristørrelse ikke eksplisitt i samme avsnitt — ikke gjettet på CLA 200.`,
      `## Forbruk
NO side oppgir 12,2–14,7 kWh/100 km blandet. Variantnivå: 14,7 på CLA 200 (øvre), 12,2 på 250+/350 (nedre) — se offisiell konfigurator for eksakt utstyr.`,
    ],
  },
  {
    slug: "mercedes-benz-cla-shooting-brake",
    model: "CLA Shooting Brake",
    year: 2026,
    body_style: "Stasjonsvogn",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4723,
    width_mm: 1855,
    height_mm: 1469,
    wheelbase_mm: null,
    cargo_l: 455,
    frunk_l: 101,
    towing_kg: null,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.claSb,
    primarySourceName: "Mercedes-Benz Norge — CLA Shooting Brake Electric",
    primarySourceUrl: SRC.claSb,
    images: {
      front: "docs/_tmp_mb/final/mercedes-benz-cla-shooting-brake/front.jpg",
      side: "docs/_tmp_mb/final/mercedes-benz-cla-shooting-brake/side.jpg",
      rear: "docs/_tmp_mb/final/mercedes-benz-cla-shooting-brake/rear.jpg",
    },
    documentHeatPumpHonesty: true,
    documentTowingHonesty: true,
    documentInteriorMissing: true,
    description:
      "Mercedes-Benz CLA Shooting Brake (elektrisk) selges i Norge. Offisiell side oppgir opptil 745 km WLTP, opptil 354 hk / 515 Nm, DC opptil 320 kW (ladetid 22 min), AC 22 kW, bagasje 455–1 290 l / frunk 101 l, dims 4.723 / 1.855 / 1.469 mm, 0–100 på 5,0 s og toppfart 210 km/t. Ingen offisiell vinterrekkevidde er lagret.",
    pros: [
      "Offisiell NO teknisk blokk for stasjonsvogn-EV",
      "Front/Side/Rear-galleri verifisert",
      "Romslig bagasje 455–1 290 l + frunk",
    ],
    cons: [
      "Tilhenger ikke oppgitt — ikke gjettet",
      "Varmepumpe ikke lagret som spekulert boolean",
      "Variantliste mindre detaljert enn CLA sedan på NO-siden",
    ],
    suitable_for: [
      "Familie som vil ha stasjonsvogn med høy WLTP",
      "Brukere som trenger frunk + stort bagasjerom",
      "800 V hurtiglading",
    ],
    variants: [
      {
        name: "CLA Shooting Brake Electric",
        slug: "electric",
        is_default: true,
        range_km: 745,
        consumption_kwh_100km: 12.7,
        ac_charging_kw: 22,
        dc_charging_kw: 320,
        charge_time_10_80_minutes: 22,
        drivetrain: "Firehjulsdrift",
        power_hp: 354,
        torque_nm: 515,
        acceleration_0_100: 5.0,
        top_speed_kmh: 210,
        source_name: "Mercedes-Benz Norge — CLA Shooting Brake",
        source_url: SRC.claSb,
        import_notes: "WLTP opptil 745 km. DC 320 kW / 22 min. 354 hk / 515 Nm. Forbruk 12,7–15,7 (nedre lagret).",
      },
    ],
  },
  {
    slug: "mercedes-benz-glb",
    model: "GLB",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 7,
    length_mm: 4732,
    width_mm: 1861,
    height_mm: 1687,
    wheelbase_mm: null,
    cargo_l: 480,
    frunk_l: 127,
    towing_kg: 2000,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.glb,
    primarySourceName: "Mercedes-Benz Norge — GLB Electric",
    primarySourceUrl: SRC.glb,
    images: {
      front: "docs/_tmp_mb/final/mercedes-benz-glb/front.jpg",
      side: "docs/_tmp_mb/final/mercedes-benz-glb/side.jpg",
    },
    documentRearMissing: true,
    documentInteriorMissing: true,
    documentHeatPumpHonesty: true,
    description:
      "Mercedes-Benz GLB Electric (X244) selges i Norge fra kr 639 900. Offisiell side for GLB 350 4MATIC: 354 hk, WLTP opptil 603 km, brukbar batterikapasitet 85 kWh, AC opptil 22 kW / DC 320 kW, 0–100 5,5 s, toppfart 210 km/t, dims 4732/1861/1687 mm, bagasje 540/480 l (5-/7-seter), frunk 127 l, tilhenger 2 000 kg. Varmepumpe ikke lagret som spekulert boolean.",
    pros: [
      "Full NO teknisk blokk for 350 4MATIC",
      "7-seter + tilhenger 2 000 kg dokumentert",
      "Offisiell Front/Side-galleri",
    ],
    cons: [
      "Bakfoto ikke verifisert i produksjonsalbum — documented missing",
      "Varmepumpe ikke lagret som spekulert boolean",
      "Forbruk oppgitt som intervall 15,9–18,3 — midtre ikke gjettet; 15,9 lagret",
    ],
    suitable_for: [
      "Familie-SUV med 7 seter",
      "Tilhengerbruk opptil 2 tonn",
      "800 V hurtiglading",
    ],
    variants: [
      {
        name: "GLB 350 4MATIC",
        slug: "glb-350-4matic",
        is_default: true,
        battery_usable_kwh: 85,
        range_km: 603,
        consumption_kwh_100km: 15.9,
        ac_charging_kw: 22,
        dc_charging_kw: 320,
        drivetrain: "Firehjulsdrift",
        power_hp: 354,
        acceleration_0_100: 5.5,
        top_speed_kmh: 210,
        towing_kg: 2000,
        source_name: "Mercedes-Benz Norge — GLB Electric",
        source_url: SRC.glb,
        import_notes: "85 kWh brukbar. WLTP 603 km. DC 320 kW. 354 hk. Tilhenger 2000 kg.",
      },
    ],
  },
  {
    slug: "mercedes-benz-glc",
    model: "GLC",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4845,
    width_mm: 1913,
    height_mm: 1644,
    wheelbase_mm: 2972,
    cargo_l: 520,
    frunk_l: 128,
    towing_kg: 2400,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.glc,
    primarySourceName: "Mercedes-Benz Norge — GLC Electric + NTB press",
    primarySourceUrl: SRC.glc,
    images: {
      front: "docs/_tmp_mb/final/mercedes-benz-glc/front.jpg",
      side: "docs/_tmp_mb/final/mercedes-benz-glc/side.jpg",
    },
    documentRearMissing: true,
    documentInteriorMissing: true,
    documentHeatPumpHonesty: true,
    description:
      "Mercedes-Benz GLC Electric (X540) selges/bestilles i Norge. Modellside + Mercedes-Benz Norge press: GLC 400 4MATIC WLTP inntil 702–713 km, 489 hk / 800 Nm, DC 330 kW, bagasje 520 l / frunk 128 l, tilhenger 2 400 kg, 0–100 4,3 s, dims 4.845 / 1.913 / 1.644 mm, akselavstand 2.972 mm, forbruk 14,9–18,8 kWh/100 km. Batteri litium-ion netto ~94 kWh (modellside også 94,4/85,5 brukbar). Varmepumpe ikke lagret som spekulert boolean.",
    pros: [
      "Høy WLTP og DC 330 kW dokumentert",
      "Tilhenger 2 400 kg + frunk 128 l",
      "Offisielle dims fra Mercedes-Benz Norge press",
    ],
    cons: [
      "Press oppgir både 520 og 570 l bagasje i ulike tekster — 520 l fra modellside lagret",
      "Flere drivlinjer nevnt uten full separat tabell — 400 4MATIC default",
      "Bakfoto ikke verifisert",
    ],
    suitable_for: [
      "Premium SUV med høy ladeeffekt",
      "Tung tilhengerbruk",
      "Langtur med 700+ km WLTP",
    ],
    variants: [
      {
        name: "GLC 400 4MATIC",
        slug: "glc-400-4matic",
        is_default: true,
        battery_usable_kwh: 94.4,
        range_km: 702,
        ac_charging_kw: 11,
        dc_charging_kw: 330,
        drivetrain: "Firehjulsdrift",
        power_hp: 489,
        torque_nm: 800,
        acceleration_0_100: 4.3,
        top_speed_kmh: 210,
        consumption_kwh_100km: 14.9,
        charge_time_10_80_minutes: 22,
        towing_kg: 2400,
        source_name: "Mercedes-Benz Norge — GLC Electric + NTB press",
        source_url: SRC.glc,
        import_notes: "94,4 kWh brukbar (NO). WLTP 702 km. DC 330 kW. Forbruk 14,9–18,8 (press). Dims press 4845/1913/1644.",
      },
    ],
    extraScoreNotes: [
      `## Batteri
NO side: brukbar 94,4 eller 85,5 kWh. Press: litium-ion netto 94 kWh. Default GLC 400 4MATIC lagret med 94,4 kWh.
## Dimensjoner / forbruk
Mercedes-Benz Norge press (NTB): Lengde/bredde/høyde 4.845/1.913/1.644 mm, akselavstand 2.972 mm, blandet forbruk 14,9–18,8 kWh/100 km.`,
    ],
  },
  {
    slug: "mercedes-benz-eqs",
    model: "EQS",
    year: 2026,
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 5276,
    width_mm: 1925,
    height_mm: 1514,
    wheelbase_mm: 3211,
    cargo_l: 623,
    towing_kg: 1700,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.eqs,
    primarySourceName: "Mercedes-Benz Norge — EQS + Mercedes-Benz USA tech (dims/cargo)",
    primarySourceUrl: SRC.eqs,
    images: {
      front: "docs/_tmp_mb/final/mercedes-benz-eqs/front.jpg",
      side: "docs/_tmp_mb/final/mercedes-benz-eqs/side.jpg",
      rear: "docs/_tmp_mb/final/mercedes-benz-eqs/rear.jpg",
    },
    documentInteriorMissing: true,
    documentHeatPumpHonesty: true,
    documentFrunkMissing: true,
    description:
      "Mercedes-Benz EQS sedan selges i Norge. NO side/press: batteri 122 kWh, DC 350 kW, AC 11/22 kW, 408–585 hk, 505–800 Nm, forbruk 15,4–19,5 kWh/100 km, tilhenger 1 600–1 700 kg, WLTP 853 km (500/580 NO) / opptil 878 km (450+ NO press). Dims/bagasje mangler i NO teknisk blokk — fylt fra offisiell Mercedes-Benz USA tech for EQS 450+ (207,7 / 75,8 / 59,6 in → mm; cargo 22 cu ft → 623 l).",
    pros: [
      "122 kWh / DC 350 kW dokumentert på NO-side",
      "Front/Side/Rear-galleri",
      "Høy WLTP på 500/580 4MATIC",
    ],
    cons: [
      "Dims/bagasje fra USA tech (NO utelater feltet)",
      "Varmepumpe ikke lagret som spekulert boolean",
      "EQS 450+ ikke lagret som separat default-variant",
    ],
    suitable_for: [
      "Luksus-sedan med lang WLTP",
      "Hurtiglading 350 kW",
      "Tilhengerbruk opptil 1 700 kg",
    ],
    variants: [
      {
        name: "EQS 500 4MATIC",
        slug: "eqs-500-4matic",
        is_default: true,
        battery_total_kwh: 122,
        range_km: 853,
        consumption_kwh_100km: 16.2,
        ac_charging_kw: 11,
        dc_charging_kw: 350,
        drivetrain: "Firehjulsdrift",
        power_hp: 476,
        torque_nm: 750,
        acceleration_0_100: 4.5,
        top_speed_kmh: 210,
        towing_kg: 1700,
        source_name: "Mercedes-Benz Norge — EQS press",
        source_url: SRC.eqs,
        import_notes: "122 kWh. WLTP 853 km (NO). 476 hk / 750 Nm / 0–100 4,5 s (NO press). DC 350 kW.",
      },
      {
        name: "EQS 580 4MATIC",
        slug: "eqs-580-4matic",
        battery_total_kwh: 122,
        range_km: 853,
        consumption_kwh_100km: 16.2,
        ac_charging_kw: 11,
        dc_charging_kw: 350,
        drivetrain: "Firehjulsdrift",
        power_hp: 585,
        torque_nm: 800,
        acceleration_0_100: 4.1,
        top_speed_kmh: 210,
        towing_kg: 1700,
        source_name: "Mercedes-Benz Norge — EQS press",
        source_url: SRC.eqs,
        import_notes: "122 kWh. WLTP 853 km. 585 hk / 800 Nm / 0–100 4,1 s (NO press).",
      },
    ],
    extraScoreNotes: [
      `## Dimensjoner / bagasje
NO teknisk blokk utelater dims/bagasje. Fylt fra offisiell Mercedes-Benz USA EQS 450+ tech: length 207.7 in (5276 mm), width w/o mirrors 75.8 in (1925 mm), height 59.6 in (1514 mm), wheelbase 126.4 in (3211 mm), cargo 22 cu ft (623 l).`,
    ],
  },
  {
    slug: "mercedes-benz-eqs-suv",
    model: "EQS SUV",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 7,
    length_mm: 5125,
    width_mm: 1959,
    height_mm: 1718,
    wheelbase_mm: null,
    cargo_l: 880,
    towing_kg: 1800,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.eqsSuv,
    primarySourceName: "Mercedes-Benz Norge — EQS SUV + NTB press",
    primarySourceUrl: SRC.eqsSuv,
    images: {
      front: "docs/_tmp_mb/final/mercedes-benz-eqs-suv/front.jpg",
      side: "docs/_tmp_mb/final/mercedes-benz-eqs-suv/side.jpg",
    },
    documentRearMissing: true,
    documentInteriorMissing: true,
    documentHeatPumpHonesty: true,
    documentFrunkMissing: true,
    documentChargingHonesty: true,
    description:
      "Mercedes-Benz EQS SUV selges i Norge. Modellside: WLTP opptil 642 km, forbruk 20,8 kWh/100 km, bagasje 880 l, tilhenger 1 800 kg, 5/7 seter. Dims 5.125 / 1.959 / 1.718 mm fra Mercedes-Benz Norge press. Peak DC/batterikapasitet/effekt mangler i aktuell teknisk blokk — ikke gjettet.",
    pros: [
      "Offisiell NO modellside med WLTP, bagasje og tilhenger",
      "Dims fra Mercedes-Benz Norge press",
      "Front/Side-galleri",
    ],
    cons: [
      "Batteri/DC/effekt ikke i aktuell teknisk blokk — honesty",
      "Bakfoto ikke verifisert",
      "Press-dims fra lanseringsår — bekreft mot konfigurator ved endring",
    ],
    suitable_for: [
      "Stor premium el-SUV",
      "Tilhengerbruk 1 800 kg",
      "Kjøpere som aksepterer dokumenterte spes-gap til konfigurator",
    ],
    variants: [
      {
        name: "EQS SUV",
        slug: "eqs-suv",
        is_default: true,
        range_km: 642,
        consumption_kwh_100km: 20.8,
        drivetrain: "Firehjulsdrift",
        towing_kg: 1800,
        source_name: "Mercedes-Benz Norge — EQS SUV",
        source_url: SRC.eqsSuv,
        import_notes: "WLTP 642 km. Forbruk 20,8. Tilhenger 1800. DC/batteri ikke oppgitt i blokk.",
      },
    ],
  },
  {
    slug: "mercedes-benz-eqe-suv",
    model: "EQE SUV",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: null,
    width_mm: 1940,
    height_mm: 1686,
    wheelbase_mm: null,
    cargo_l: 520,
    towing_kg: 1800,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: SRC.eqeSuv,
    primarySourceName: "Mercedes-Benz Norge — EQE SUV + NTB press",
    primarySourceUrl: SRC.eqeSuv,
    images: {
      front: "docs/_tmp_mb/final/mercedes-benz-eqe-suv/front.jpg",
      side: "docs/_tmp_mb/final/mercedes-benz-eqe-suv/side.jpg",
      rear: "docs/_tmp_mb/final/mercedes-benz-eqe-suv/rear.jpg",
    },
    documentInteriorMissing: true,
    documentFrunkMissing: true,
    description:
      "Mercedes-Benz EQE SUV selges i Norge (EQE 350/500 4MATIC SUV). Modellside: WLTP opptil 579 km, bagasje 520–1 675 l, tilhenger 1 800 kg, forbruk 17,8–21,5 kWh/100 km. Mercedes-Benz Norge press: bredde/høyde 1.940 / 1.686 mm (lengde i press-tabell mangelfull/feil — ikke lagret), DC 170 kW, varmepumpe standard, netto batteri 89–90,6 kWh. Front/Side/Rear-galleri verifisert.",
    pros: [
      "Offisiell NO side med WLTP, bagasje og tilhenger",
      "Front/Side/Rear-galleri",
      "To prisatte 4MATIC-varianter på modellssiden",
    ],
    cons: [
      "DC peak / batteri / hk ikke i hentet teknisk blokk",
      "Varmepumpe ikke lagret som spekulert boolean",
      "AMG EQE 53 SUV markert utgått på siden",
    ],
    suitable_for: [
      "Mellomstor premium el-SUV",
      "Tilhengerbruk 1 800 kg",
      "Familie med behov for 520–1 675 l bagasje",
    ],
    variants: [
      {
        name: "EQE 350 4MATIC SUV",
        slug: "eqe-350-4matic-suv",
        is_default: true,
        battery_usable_kwh: 89,
        range_km: 579,
        consumption_kwh_100km: 17.8,
        ac_charging_kw: 11,
        dc_charging_kw: 170,
        drivetrain: "Firehjulsdrift",
        power_hp: 292,
        torque_nm: 765,
        acceleration_0_100: 6.6,
        towing_kg: 1800,
        source_name: "Mercedes-Benz Norge — EQE SUV press",
        source_url: SRC.eqeSuv,
        import_notes: "WLTP 579 (NO side). Press: 89 kWh, 292 hk, DC 170 kW, 0–100 6,6 s.",
      },
      {
        name: "EQE 500 4MATIC SUV",
        slug: "eqe-500-4matic-suv",
        battery_usable_kwh: 90.6,
        range_km: 579,
        consumption_kwh_100km: 17.9,
        ac_charging_kw: 11,
        dc_charging_kw: 170,
        drivetrain: "Firehjulsdrift",
        power_hp: 408,
        torque_nm: 858,
        acceleration_0_100: 4.9,
        towing_kg: 1800,
        source_name: "Mercedes-Benz Norge — EQE SUV press",
        source_url: SRC.eqeSuv,
        import_notes: "Press: 90,6 kWh, 408 hk, DC 170 kW. WLTP-tak fra NO side 579 km.",
      },
    ],
  },
  {
    slug: "mercedes-benz-g-class-electric",
    model: "G-Klasse Electric",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4624,
    width_mm: 2187,
    height_mm: 1986,
    wheelbase_mm: null,
    cargo_l: 620,
    towing_kg: null,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.gClass,
    primarySourceName: "Mercedes-Benz Norge — G-Klasse Electric",
    primarySourceUrl: SRC.gClass,
    images: {
      front: "docs/_tmp_mb/final/mercedes-benz-g-class-electric/front.jpg",
      side: "docs/_tmp_mb/final/mercedes-benz-g-class-electric/side.jpg",
      rear: "docs/_tmp_mb/final/mercedes-benz-g-class-electric/rear.jpg",
    },
    documentInteriorMissing: true,
    documentHeatPumpHonesty: true,
    documentFrunkMissing: true,
    documentChargingHonesty: true,
    documentTowingHonesty: true,
    description:
      "Mercedes-Benz G 580 med EQ-teknologi selges i Norge. Offisiell teknisk blokk: WLTP opptil 468 km, opptil 587 hk, 1 164 Nm, 0–100 4,7 s, toppfart 180 km/t, bagasje 620–1 990 l, dims 4624/1986/2187 mm, ladetid 32 min til 80 %. Forbruk (kWh/100 km) ikke oppgitt på NO modellside — ikke gjettet. Peak DC kW og batterikapasitet ikke oppgitt i hentet blokk — ikke gjettet. Merk: bredde 2187 mm inkluderer speil i NO-teksten (lengde/høyde/bredde).",
    extraScoreNotes: [
      `## Forbruk
Forbruk (kWh/100 km) er ikke oppgitt i hentet Mercedes-Benz Norge teknisk blokk for G 580 — ikke gjettet.`,
    ],
    pros: [
      "Full dims + ytelse på NO-side",
      "Front/Side/Rear-galleri for G 580 EQ",
      "Ikonisk offroad-segment helelektrisk",
    ],
    cons: [
      "Peak DC kW / batterikapasitet mangler — honesty",
      "Tilhenger ikke oppgitt i hentet blokk",
      "Varebil-pris nevnes separat — personbil G 580 lagret",
    ],
    suitable_for: [
      "Offroad-premium med elektrisk drift",
      "Kjøpere som prioriterer moment og terreng",
      "Brukere som aksepterer kortere WLTP enn EQS-klassen",
    ],
    variants: [
      {
        name: "G 580 med EQ-teknologi",
        slug: "g-580-eq",
        is_default: true,
        range_km: 468,
        charge_time_10_80_minutes: 32,
        drivetrain: "Firehjulsdrift",
        power_hp: 587,
        torque_nm: 1164,
        acceleration_0_100: 4.7,
        top_speed_kmh: 180,
        source_name: "Mercedes-Benz Norge — G-Klasse Electric",
        source_url: SRC.gClass,
        import_notes: "WLTP 468 km. 587 hk / 1164 Nm. 0–100 4,7. 10–80 32 min. DC kW ikke oppgitt.",
      },
    ],
  },
  {
    slug: "mercedes-benz-eqa",
    model: "EQA",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4463,
    width_mm: 1834,
    height_mm: 1613,
    wheelbase_mm: 2729,
    cargo_l: 340,
    towing_kg: 1800,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.eqa,
    primarySourceName: "Mercedes-Benz Norge — EQA + NTB press",
    primarySourceUrl: SRC.eqa,
    images: {
      front: "docs/_tmp_mb/final/mercedes-benz-eqa/front.jpg",
      side: "docs/_tmp_mb/final/mercedes-benz-eqa/side.jpg",
      rear: "docs/_tmp_mb/final/mercedes-benz-eqa/rear.jpg",
      interior: "docs/_tmp_mb/final/mercedes-benz-eqa/interior.jpg",
    },
    documentHeatPumpHonesty: true,
    documentFrunkMissing: true,
    description:
      "Mercedes-Benz EQA selges fortsatt i Norge (pris fra kr 499 900). Modellside: WLTP EQA 250+ 558 km / 300 4MATIC 476 km / 350 4MATIC 476 km, bagasje 340–1 320 l, tilhenger opptil 1 800 kg, forbruk 14,4–16,4 kWh/100 km, batteri opptil 70,5 kWh brukbar, AC 11 / DC 100 kW. Dims 4.463 / 1.834 / 1.613 mm og akselavstand 2.729 mm fra Mercedes-Benz Norge press.",
    pros: [
      "Aktivt priset på mercedes-benz.no",
      "Batteri 70,5 kWh + DC 100 kW dokumentert",
      "Dims fra Mercedes-Benz Norge press",
    ],
    cons: [
      "Varmepumpe ikke lagret som spekulert boolean",
      "EQ-navn fases ut — bekreft lager/levering hos forhandler",
      "Press-dims fra facelift-lansering — bekreft mot konfigurator",
    ],
    suitable_for: [
      "Kompakt premium el-SUV",
      "Tilhengerbruk opptil 1 800 kg",
      "Kjøpere som vil ha etablerte EQ-modell",
    ],
    variants: [
      {
        name: "EQA 300 4MATIC Special Edition Plus",
        slug: "eqa-300-4matic",
        is_default: true,
        battery_usable_kwh: 70.5,
        range_km: 476,
        consumption_kwh_100km: 14.4,
        ac_charging_kw: 11,
        dc_charging_kw: 100,
        drivetrain: "Firehjulsdrift",
        towing_kg: 1800,
        source_name: "Mercedes-Benz Norge — EQA",
        source_url: SRC.eqa,
        import_notes: "70,5 kWh brukbar. WLTP 476 km (300 4MATIC). DC 100 kW. Tilhenger 1800.",
      },
      {
        name: "EQA 250+",
        slug: "eqa-250-plus",
        battery_usable_kwh: 70.5,
        range_km: 558,
        consumption_kwh_100km: 14.4,
        ac_charging_kw: 11,
        dc_charging_kw: 100,
        drivetrain: "Forhjulsdrift",
        towing_kg: 1800,
        source_name: "Mercedes-Benz Norge — EQA",
        source_url: SRC.eqa,
        import_notes: "WLTP 558 km. FWD.",
      },
    ],
  },
  {
    slug: "mercedes-benz-c-class-electric",
    model: "C-Klasse Electric",
    year: 2026,
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: null,
    width_mm: null,
    height_mm: null,
    wheelbase_mm: null,
    cargo_l: 420,
    frunk_l: 101,
    towing_kg: 1800,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.cClass,
    primarySourceName: "Mercedes-Benz Norge — C-Klasse Electric (Image Ready blocked)",
    primarySourceUrl: SRC.cClass,
    images: {},
    forceNotReady: true,
    skipGallery: true,
    documentHeatPumpHonesty: true,
    description:
      "Mercedes-Benz C-Klasse Electric (C 400 4MATIC) er til salgs i Norge (fra kr 689 900) med sterk NO teknisk blokk (WLTP 752 km, 489 hk / 800 Nm, DC 330 kW, bagasje 420 / frunk 101, tilhenger 1 800 kg). Image Ready er blokkert: hentede galleriassets på modellssiden matchet ikke verifiserbar C-Klasse-eksteriør (feilmodell Concept CLA / E-Klasse). NOT_READY til offisielle Hero/Front/Side er verifisert.",
    pros: ["Sterk offisiell NO teknisk blokk", "Salget har startet"],
    cons: ["Image Ready blokkert — feilmodell/assets", "NOT_READY"],
    suitable_for: ["Avvent verifisert offisiell galleri"],
    variants: [
      {
        name: "C 400 4MATIC",
        slug: "c-400-4matic",
        is_default: true,
        range_km: 752,
        consumption_kwh_100km: 14.1,
        ac_charging_kw: 11,
        dc_charging_kw: 330,
        charge_time_10_80_minutes: 22,
        drivetrain: "Firehjulsdrift",
        power_hp: 489,
        torque_nm: 800,
        acceleration_0_100: 4.0,
        towing_kg: 1800,
        source_name: "Mercedes-Benz Norge — C-Klasse Electric",
        source_url: SRC.cClass,
        import_notes: "Specs from NO page; Image Ready blocked — NOT_READY.",
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
  const extras: string[] = [...(cfg.extraScoreNotes ?? [])];
  extras.push(
    cfg.battery_chemistry
      ? `## Batterikjemi
Batterikjemi er oppgitt som ${cfg.battery_chemistry} i Mercedes-Benz Norge-dokumentasjon — ikke spekulert utover dette.`
      : `## Batterikjemi
Batterikjemi er ikke oppgitt i hentet Mercedes-Benz Norge-dokumentasjon for denne modellen — ikke gjettet.`,
  );
  extras.push(
    `## Batteri
NO Sanity/modellside oppgir batterikapasitet i kWh (total der oppgitt). Separat usable er ikke gjettet der kun ett tall finnes.`,
  );
  if (cfg.documentChargingHonesty) {
    extras.push(
      `## Lading
Peak DC-effekt (kW) er ikke oppgitt som tall i hentet materiale for denne modellen — ikke gjettet. AC og 10–80 er lagret der oppgitt. Type 2 + CCS2 er dokumentert via prisliste/Mode 3 Type 2.`,
    );
  }
  if (cfg.documentHeatPumpHonesty) {
    extras.push(
      `## Varme pumpe
Varmepumpe er ikke eksplisitt bekreftet som ett enkelt true/false-felt for denne modellen i hentet materiale — ikke lagret som spekulert boolean.`,
    );
  }
  if (cfg.documentFrunkMissing) {
    extras.push(
      `## Frunk
Frunk (l) er ikke oppgitt i hentet Mercedes-Benz Norge-materiale — ikke gjettet. Left empty.`,
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
  if (cfg.documentTowingHonesty) {
    extras.push(
      `## Tilhenger
Tilhenger ikke oppgitt i hentet strukturert spesifikasjon. Ingen tilhengerverdi lagret. Ikke gjettet.`,
    );
  }
  if (cfg.forceNotReady) {
    extras.push(
      `## Image Ready
Hero/Front/Side mangler eller offisiell dokumentasjon er ufullstendig. NOT_READY. Ingen gjettede bilder eller spekker.`,
    );
  }
  extras.push(
    `## Vinter
Ingen offisiell vinterrekkevidde er lagret som egen katalogverdi — ikke gjettet. Forvent lavere rekkevidde i kulde. Laboratoriemål (WLTP) erstatter ikke reell rekkevidde.`,
  );

  return `## Hvem bilen passer for
Mercedes-Benz ${cfg.model} passer for brukere som vurderer helelektrisk Mercedes-Benz i dette segmentet i Norge. Sammenlign mot øvrige Mercedes-modeller på mercedes-benz.no.

## Vinter
Se notat under. Laboratoriemål erstatter ikke reell rekkevidde.

## Lading
Se variantnivå og kilder. Type 2 + CCS2 der dokumentert.

## Daglig bruk
Egnet for hverdag når dimensjoner, seter og bagasje matcher behov.

## Langtur
Planlegg ladestopp ut fra variantens WLTP og offisiell 10–80 der bekreftet. Laboratoriemål erstatter ikke reell rekkevidde.

## FAQ
**Hvor finner jeg offisielle tall?** mercedes-benz.no modellside / tekniske spesifikasjoner / RSA prisliste for ${cfg.model}.
**Er vinterrekkevidde oppgitt?** Nei som egen katalogverdi her — ikke gjettet.
**Er peak DC kW oppgitt?** Se variantnivå — kun lagret der dokumentert i norsk materiale.
**Kan tallene endre seg?** Ja — bekreft alltid gjeldende verdier hos Mercedes-Benz Norge / forhandler før kjøp.

${extras.join("\n\n")}`.trim();
}

async function ensureBrand(sb: SupabaseClient): Promise<string> {
  const { data: existing } = await sb
    .from("brands")
    .select("id")
    .eq("slug", "mercedes-benz")
    .maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data, error } = await sb
    .from("brands")
    .insert({
      name: "Mercedes-Benz",
      slug: "mercedes-benz",
      website_url: "https://www.mercedes-benz.no",
      country: "CN",
      is_active: true,
      description: "Mercedes-Benz Norway",
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
  const webp = await sharp(readFileSync(abs))
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
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
      ? `phase1-mercedes-100-${CHECKED_AT.slice(0, 10)} | NOT_READY — incomplete docs or Image Ready blocked | unpublished`
      : `phase1-mercedes-100-${CHECKED_AT.slice(0, 10)} | Image Ready + editorial finalized | mercedes-benz.no modellside | unpublished`,
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
  forceNotReady?: boolean,
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
      import_status: forceNotReady ? "needs_review" : "approved",
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
    alt: `Mercedes-Benz ${cfg.model} foran (offisiell mercedes-benz.no)`,
  });
  if (cfg.images.side) {
    await attachLocalImage(sb, {
      carId,
      slug: cfg.slug,
      role: "side",
      localPath: cfg.images.side,
      isPrimary: false,
      sortOrder: sort++,
      alt: `Mercedes-Benz ${cfg.model} sideprofil (offisiell mercedes-benz.no)`,
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
      alt: `Mercedes-Benz ${cfg.model} bak (offisiell mercedes-benz.no)`,
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
      alt: `Mercedes-Benz ${cfg.model} interiør (offisiell mercedes-benz.no)`,
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

async function assertLockedUntouched(sb: SupabaseClient) {
  const locked = [
    "volkswagen",
    "volvo",
    "tesla",
    "bmw",
    "audi",
    "kia",
    "hyundai",
    "toyota",
  ];
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from("cars")
    .select("slug,brand,updated_at")
    .gte("updated_at", since);
  if (error) throw error;
  const hits = (data ?? []).filter((c) =>
    locked.includes(String(c.brand ?? "").toLowerCase()),
  );
  if (hits.length) {
    console.warn(
      "WARNING: locked brand rows updated in last 10m:",
      hits.map((h) => h.slug),
    );
  } else {
    console.log("Locked manufacturers untouched in last 10m: OK");
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
    await upsertVariants(sb, carId, cfg.variants, cfg.year, cfg.forceNotReady);
    await finalizeGallery(sb, carId, cfg);
  }
  await report(sb);
  await assertLockedUntouched(sb);
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
