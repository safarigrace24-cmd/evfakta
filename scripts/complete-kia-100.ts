/**
 * Complete Kia Norwegian EV launch set to 100% Review Assistant where Image Ready.
 * Finishable: EV2, EV3, EV6, EV9.
 * NOT_READY (specs from NO pricelist; Image Ready blocked — no verified Front+Side gallery):
 *   EV4, EV5, PV5 Passenger.
 * Niro EV discontinued on kia.no ("En æra er over") — not created.
 * Official Kia Norge pricelists + kia.no / Crystallize press assets.
 * Never invent. Never auto-publish.
 *
 * Usage: npx tsx scripts/complete-kia-100.ts
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
const BRAND = "Kia";

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
  heat_pump: boolean | null;
  page: string;
  primarySourceName: string;
  primarySourceUrl: string;
  images: Partial<Record<Role, string>>;
  documentRearMissing?: boolean;
  documentInteriorMissing?: boolean;
  documentChargingHonesty?: boolean;
  documentHeatPumpHonesty?: boolean;
  documentPendingTypeApproval?: boolean;
  skipGallery?: boolean;
  forceNotReady?: boolean;
  variants: VariantCfg[];
  description: string;
  pros: string[];
  cons: string[];
  suitable_for: string[];
};

const SRC = {
  ev2: "https://media.crystallize.com/bos-ecom-prod/26/6/1/ba50001a/ev2-2027-prisliste-02-07-2026.pdf",
  ev3: "https://media.crystallize.com/bos-ecom-prod/26/5/30/021bd6c4/2027-kia-norge-ev3_kundeprisliste-juni-30-06-2026.pdf",
  ev4: "https://media.crystallize.com/bos-ecom-prod/26/1/14/95/2026-kia-norge-ev4_sz1e_kundeprisliste-jan26-10-01-2026.pdf",
  ev5: "https://media.crystallize.com/bos-ecom-prod/26/2/5/67bf1e60/2026-kia-norge-ev5_ov_kundeprisliste-mars-01-03-2026.pdf",
  ev5Gt:
    "https://media.crystallize.com/bos-ecom-prod/26/5/8/03b1c52f/2026-kia-norge-ev5_ov_gt_kundeprisliste-june-01-06-2026.pdf",
  ev6: "https://media.crystallize.com/bos-ecom-prod/26/1/5/12/2026-kia-norge-ev6_cv_pe_kundeprisliste-januar-01-01-2026.pdf",
  ev6Gt:
    "https://media.crystallize.com/bos-ecom-prod/26/1/5/13/2026-kia-norge-ev6-gtcv-pe_kundeprisliste-01-01-2026.pdf",
  ev9: "https://media.crystallize.com/bos-ecom-prod/26/1/26/d8b590a3/ev9-prisliste-12-02-2026.pdf",
  ev9Gt:
    "https://media.crystallize.com/bos-ecom-prod/26/1/5/15/2026-kia-norge-ev9_gt_mv_kundeprisliste-01-01-2026.pdf",
  pv5: "https://media.crystallize.com/bos-ecom-prod/26/4/18/6af8f04f/2026-kia-norge-pv5-_passenger_lr_kundeprisliste-01-01-2026.pdf",
  kiaNo: "https://www.kia.no",
} as const;

const MODELS: ModelCfg[] = [
  {
    slug: "kia-ev2",
    model: "EV2",
    year: 2027,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4060,
    width_mm: 1800,
    height_mm: 1575,
    wheelbase_mm: 2565,
    cargo_l: 362,
    frunk_l: 15,
    towing_kg: 750,
    battery_chemistry: "LFP / NCM (variant)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: "https://www.kia.no/bil/ev2",
    primarySourceName: "Kia Bil Norge — Prisliste EV2 (02.07.2026)",
    primarySourceUrl: SRC.ev2,
    images: {
      front: "docs/_tmp_kia/final/ev2/front.jpg",
      side: "docs/_tmp_kia/final/ev2/side.jpg",
      rear: "docs/_tmp_kia/final/ev2/rear.jpg",
      interior: "docs/_tmp_kia/final/ev2/interior.jpg",
    },
    documentChargingHonesty: true,
    documentHeatPumpHonesty: true,
    documentPendingTypeApproval: true,
    description:
      "Kia EV2 er den kompakte helelektriske crossoveren som tilbys i Norge via Kia Bil Norge. Batterikapasitet, effekt, WLTP-rekkevidde/forbruk (der oppgitt) og tekniske data er fra Kia Norge-prisliste 02.07.2026. Standard Range bruker LFP 42,2 kWh; Long Range NCM 62,0 kWh. Flere WLTP-tall er merket «avventer endelig typegodkjenning» i prislisten — ikke overstyrt. DC kW / 10–80 er ikke oppgitt som tall i NO-prislisten — ikke gjettet. Varmepumpe er ekstrautstyr på Air — ikke lagret som én boolean.",
    pros: [
      "Kompakt EV med offisiell NO-prisliste for batteri, effekt og dimensjoner",
      "V2L/V2G 3,6 kW dokumentert i utstyrsliste",
      "Offisielle motorshow/pressbilder for Hero/Front/Side/Rear/Interior",
    ],
    cons: [
      "DC kW / 10–80 ikke oppgitt i NO-prisliste — dokumentert gap",
      "Deler av WLTP merket avventer typegodkjenning",
      "Varmepumpe ikke standard på alle utstyrsnivå",
    ],
    suitable_for: [
      "By- og pendlerbruk i kompakt SUV-segment",
      "Kjøpere som vil ha offisiell NO-dokumentasjon før bestilling",
      "Brukere som trenger V2L/V2G der det er listet",
    ],
    variants: [
      {
        name: "Standard Range Air FWD",
        slug: "standard-range-air-fwd",
        is_default: true,
        battery_usable_kwh: 42.2,
        battery_total_kwh: 42.2,
        range_km: 317,
        consumption_kwh_100km: 15.1,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 146,
        torque_nm: 250,
        acceleration_0_100: 8.5,
        towing_kg: 750,
        curb_weight_kg: 1550,
        source_name: "Kia Bil Norge — Prisliste EV2",
        source_url: SRC.ev2,
        import_notes:
          "LFP 42,2 kWh. WLTP 317 km / 15,1 kWt/100 km (Air). * avventer typegodkjenning der merket.",
      },
      {
        name: "Long Range Exclusive FWD 5-seter",
        slug: "long-range-exclusive-fwd",
        battery_usable_kwh: 62,
        battery_total_kwh: 62,
        range_km: 430,
        consumption_kwh_100km: 15.2,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 135,
        torque_nm: 250,
        acceleration_0_100: 9.5,
        towing_kg: 750,
        curb_weight_kg: 1575,
        source_name: "Kia Bil Norge — Prisliste EV2",
        source_url: SRC.ev2,
        import_notes: "NCM 62,0 kWh. Exclusive 5-seter WLTP 430 km.",
      },
      {
        name: "Long Range GT Line FWD 5-seter",
        slug: "long-range-gt-line-fwd",
        battery_usable_kwh: 62,
        battery_total_kwh: 62,
        range_km: 418,
        consumption_kwh_100km: 16.3,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 135,
        torque_nm: 250,
        acceleration_0_100: 9.7,
        towing_kg: 750,
        curb_weight_kg: 1590,
        source_name: "Kia Bil Norge — Prisliste EV2",
        source_url: SRC.ev2,
        import_notes: "GT Line 5-seter WLTP 418 km / 16,3.",
      },
    ],
  },
  {
    slug: "kia-ev3",
    model: "EV3",
    year: 2027,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4300,
    width_mm: 1850,
    height_mm: 1560,
    wheelbase_mm: 2680,
    cargo_l: 460,
    frunk_l: 25,
    towing_kg: 1000,
    battery_chemistry: "LIPB (Lithium Ion Polymer)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: "https://www.kia.no/bil/ev3",
    primarySourceName: "Kia Bil Norge — Prisliste EV3 (30.06.2026)",
    primarySourceUrl: SRC.ev3,
    images: {
      front: "docs/_tmp_kia/final/ev3/front.jpg",
      side: "docs/_tmp_kia/final/ev3/side.jpg",
      interior: "docs/_tmp_kia/final/ev3/interior.jpg",
    },
    documentRearMissing: true,
    documentChargingHonesty: true,
    documentHeatPumpHonesty: true,
    documentPendingTypeApproval: true,
    description:
      "Kia EV3 er den kompakte helelektriske SUV-en solgt i Norge. Batteri (58,3 / 81,4 kWh), effekt, dreiemoment, dimensjoner, bagasje 460 l / frunk 25 l og tilhenger er fra Kia Norge-prisliste 30.06.2026. WLTP-tall i prislisten er delvis merket «avventer endelig typegodkjenning». DC kW / 10–80 er ikke oppgitt som tall — ikke gjettet. Varmepumpe er ekstrautstyr på Air / Exclusive Edition — ikke lagret som én boolean. GT AWD (292 hk) listet med «kommer snart» for enkelte verdier — ikke gjettet.",
    pros: [
      "Full NO teknisk tabell for batteri, dims, bagasje og trekk",
      "FWD og AWD-varianter dokumentert i samme prisliste",
      "Offisielle kia.no / studio-bilder for Hero/Front/Side + interiør",
    ],
    cons: [
      "DC kW / 10–80 ikke oppgitt i NO-prisliste — dokumentert gap",
      "Bakfoto ikke verifisert i dette albumet — left empty",
      "Varmepumpe ikke standard på alle nivå",
    ],
    suitable_for: [
      "Kompakt familie-SUV med offisiell NO-dokumentasjon",
      "Kjøpere som vil velge mellom SR/LR og FWD/AWD",
      "Langtur når variantens WLTP planlegges med ærlige ladegap",
    ],
    variants: [
      {
        name: "Standard Range Air FWD",
        slug: "standard-range-air-fwd",
        is_default: true,
        battery_usable_kwh: 58.3,
        battery_total_kwh: 58.3,
        range_km: 436,
        consumption_kwh_100km: 14.9,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 204,
        torque_nm: 283,
        acceleration_0_100: 7.5,
        top_speed_kmh: 170,
        towing_kg: 500,
        curb_weight_kg: 1725,
        source_name: "Kia Bil Norge — Prisliste EV3",
        source_url: SRC.ev3,
        import_notes: "58,3 kWh / 204 hk. WLTP 436 km.",
      },
      {
        name: "Long Range Exclusive FWD",
        slug: "long-range-exclusive-fwd",
        battery_usable_kwh: 81.4,
        battery_total_kwh: 81.4,
        range_km: 601,
        consumption_kwh_100km: 15,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 204,
        torque_nm: 283,
        acceleration_0_100: 7.7,
        top_speed_kmh: 170,
        towing_kg: 1000,
        curb_weight_kg: 1810,
        source_name: "Kia Bil Norge — Prisliste EV3",
        source_url: SRC.ev3,
        import_notes: "81,4 kWh FWD Exclusive. WLTP 601 km.",
      },
      {
        name: "Long Range Exclusive AWD",
        slug: "long-range-exclusive-awd",
        battery_usable_kwh: 81.4,
        battery_total_kwh: 81.4,
        range_km: 572,
        consumption_kwh_100km: 15.8,
        ac_charging_kw: 11,
        drivetrain: "Firehjulsdrift",
        power_hp: 265,
        torque_nm: 385,
        acceleration_0_100: 6.6,
        top_speed_kmh: 170,
        towing_kg: 1500,
        curb_weight_kg: 1920,
        source_name: "Kia Bil Norge — Prisliste EV3",
        source_url: SRC.ev3,
        import_notes: "81,4 kWh AWD 265 hk. WLTP inntil 572 km.",
      },
    ],
  },
  {
    slug: "kia-ev4",
    model: "EV4",
    year: 2026,
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4430,
    width_mm: 1860,
    height_mm: 1485,
    wheelbase_mm: 2820,
    cargo_l: 435,
    frunk_l: null,
    towing_kg: 1000,
    battery_chemistry: "LIPB (Lithium Ion Polymer)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: "https://www.kia.no/bil/ev4",
    primarySourceName: "Kia Bil Norge — Prisliste EV4 (10.01.2026)",
    primarySourceUrl: SRC.ev4,
    images: {},
    skipGallery: true,
    forceNotReady: true,
    documentChargingHonesty: true,
    documentHeatPumpHonesty: true,
    documentRearMissing: true,
    documentInteriorMissing: true,
    documentPendingTypeApproval: true,
    description:
      "Kia EV4 er den helelektriske sedanen/liftbacken solgt i Norge. Batteri, effekt, dims (4430×1860×1485 mm), bagasje 435 l og tilhenger er fra Kia Norge-prisliste 10.01.2026. Frunk er ikke oppgitt i teknisk tabell — ikke gjettet. DC kW / 10–80 ikke oppgitt — ikke gjettet. Image Ready blokkert: verifisert true Side-profil fra offisielt album ikke funnet uten feil modell-kryss — ingen gjettede bilder.",
    pros: [
      "Offisiell NO-prisliste for SR/LR batteri og WLTP",
      "Sedan/liftback med dokumentert bagasje 435 l",
    ],
    cons: [
      "Image Ready blokkert — mangler verifisert Front+Side-galleri",
      "DC kW / 10–80 ikke oppgitt i NO-prisliste",
      "Frunk ikke listet i teknisk tabell",
    ],
    suitable_for: [
      "Kjøpere som venter på Image Ready før publisering",
      "Sedan-segment når galleri er verifisert",
    ],
    variants: [
      {
        name: "Standard Range Air FWD",
        slug: "standard-range-air-fwd",
        is_default: true,
        battery_usable_kwh: 58.3,
        battery_total_kwh: 58.3,
        range_km: 440,
        consumption_kwh_100km: 14.7,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 204,
        torque_nm: 283,
        acceleration_0_100: 7.4,
        top_speed_kmh: 170,
        towing_kg: 500,
        curb_weight_kg: 1736,
        source_name: "Kia Bil Norge — Prisliste EV4",
        source_url: SRC.ev4,
        import_notes: "58,3 kWh. WLTP 440 km (* typegodkjenning).",
      },
      {
        name: "Long Range Exclusive FWD",
        slug: "long-range-exclusive-fwd",
        battery_usable_kwh: 81.4,
        battery_total_kwh: 81.4,
        range_km: 625,
        consumption_kwh_100km: 14.6,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 204,
        torque_nm: 283,
        acceleration_0_100: 7.7,
        top_speed_kmh: 170,
        towing_kg: 1000,
        curb_weight_kg: 1821,
        source_name: "Kia Bil Norge — Prisliste EV4",
        source_url: SRC.ev4,
        import_notes: "81,4 kWh Exclusive. WLTP 625 km.",
      },
      {
        name: "Long Range GT Line FWD",
        slug: "long-range-gt-line-fwd",
        battery_usable_kwh: 81.4,
        battery_total_kwh: 81.4,
        range_km: 584,
        consumption_kwh_100km: 15.8,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 204,
        torque_nm: 283,
        acceleration_0_100: 7.8,
        top_speed_kmh: 170,
        towing_kg: 1000,
        curb_weight_kg: 1835,
        source_name: "Kia Bil Norge — Prisliste EV4",
        source_url: SRC.ev4,
        import_notes: "GT Line WLTP 584 km / 15,8.",
      },
    ],
  },
  {
    slug: "kia-ev5",
    model: "EV5",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4610,
    width_mm: 1875,
    height_mm: 1680,
    wheelbase_mm: 2750,
    cargo_l: 566,
    frunk_l: 44,
    towing_kg: 1800,
    battery_chemistry: "Li-ion NCM",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: "https://www.kia.no/bil/ev5",
    primarySourceName: "Kia Bil Norge — Prisliste EV5 (01.03.2026)",
    primarySourceUrl: SRC.ev5,
    images: {},
    skipGallery: true,
    forceNotReady: true,
    documentChargingHonesty: true,
    documentHeatPumpHonesty: true,
    documentRearMissing: true,
    documentInteriorMissing: true,
    documentPendingTypeApproval: true,
    description:
      "Kia EV5 er den midtstørrelse helelektriske SUV-en solgt i Norge. Batteri 81,4 kWh NCM, dims, bagasje 566 l / frunk 44 l og trekk er fra Kia Norge-prisliste (mars 2026) + GT-prisliste (juni 2026). Varmepumpe er ekstrautstyr på Air. DC kW / 10–80 ikke oppgitt — ikke gjettet. Image Ready blokkert: verifisert true Side-galleri ikke funnet uten feil modell — ingen gjettede bilder.",
    pros: [
      "Offisiell NO-prisliste for FWD/AWD/GT",
      "Stor bagasje og frunk dokumentert",
    ],
    cons: [
      "Image Ready blokkert — mangler verifisert Front+Side-galleri",
      "DC kW / 10–80 ikke oppgitt",
      "Varmepumpe ikke standard på Air",
    ],
    suitable_for: [
      "Familie-SUV når Image Ready er klart",
      "Kjøpere som trenger offisiell NO-spesifikasjon nå",
    ],
    variants: [
      {
        name: "Long Range FWD",
        slug: "long-range-fwd",
        is_default: true,
        battery_usable_kwh: 81.4,
        battery_total_kwh: 81.4,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 218,
        torque_nm: 295,
        acceleration_0_100: 8.4,
        top_speed_kmh: 165,
        towing_kg: 1200,
        curb_weight_kg: 1994,
        source_name: "Kia Bil Norge — Prisliste EV5",
        source_url: SRC.ev5,
        import_notes:
          "81,4 kWh / 218 hk FWD. WLTP se prisliste (avventer typegodkjenning der merket).",
      },
      {
        name: "Long Range AWD",
        slug: "long-range-awd",
        battery_usable_kwh: 81.4,
        battery_total_kwh: 81.4,
        ac_charging_kw: 11,
        drivetrain: "Firehjulsdrift",
        power_hp: 265,
        torque_nm: 385,
        acceleration_0_100: 7.3,
        top_speed_kmh: 180,
        towing_kg: 1800,
        curb_weight_kg: 2077,
        source_name: "Kia Bil Norge — Prisliste EV5",
        source_url: SRC.ev5,
        import_notes: "81,4 kWh / 265 hk AWD.",
      },
      {
        name: "GT AWD",
        slug: "gt-awd",
        battery_usable_kwh: 81.4,
        battery_total_kwh: 81.4,
        range_km: 476,
        consumption_kwh_100km: 18.6,
        ac_charging_kw: 11,
        drivetrain: "Firehjulsdrift",
        power_hp: 306,
        torque_nm: 480,
        acceleration_0_100: 6.2,
        top_speed_kmh: 180,
        towing_kg: 1800,
        curb_weight_kg: 2130,
        source_name: "Kia Bil Norge — Prisliste EV5 GT",
        source_url: SRC.ev5Gt,
        import_notes: "GT 306 hk. WLTP 476 km / 18,6 (*).",
      },
    ],
  },
  {
    slug: "kia-ev6",
    model: "EV6",
    year: 2026,
    body_style: "Crossover",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4695,
    width_mm: 1880,
    height_mm: 1550,
    wheelbase_mm: 2900,
    cargo_l: 490,
    frunk_l: 52,
    towing_kg: 1800,
    battery_chemistry: "LIPB (Lithium Ion Polymer)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: "https://www.kia.no/bil/ev6",
    primarySourceName: "Kia Bil Norge — Prisliste EV6 (01.01.2026)",
    primarySourceUrl: SRC.ev6,
    images: {
      front: "docs/_tmp_kia/final/ev6/front.jpg",
      side: "docs/_tmp_kia/final/ev6/side.jpg",
      rear: "docs/_tmp_kia/final/ev6/rear.jpg",
      interior: "docs/_tmp_kia/final/ev6/interior.jpg",
    },
    documentChargingHonesty: true,
    description:
      "Kia EV6 er den helelektriske crossoveren solgt i Norge med 800V/400V-ladesystem dokumentert i utstyrsliste. Batteri 63 / 84 kWh, effekt, dims, bagasje 490 l og tilhenger er fra Kia Norge-prisliste januar 2026 (+ GT-prisliste). Varmepumpe er standard i utstyrslisten. DC kW / 10–80 er ikke oppgitt som tall i NO-prislisten — ikke gjettet. Vehicle To Device (V2D) 3,6 kW er listet (ikke V2L-navn).",
    pros: [
      "800V/400V ladesystem og varmepumpe dokumentert i NO-utstyrsliste",
      "SR/LR RWD/AWD + GT i offisielle prislister",
      "Offisielle kia.no-bilder for Hero/Front/Side/Rear/Interior",
    ],
    cons: [
      "DC kW / 10–80 ikke oppgitt som tall i NO-prisliste — dokumentert gap",
      "Frunk 20 l på AWD/GT vs 52 l på RWD — se variant",
    ],
    suitable_for: [
      "Langtur-crossover med offisiell NO-dokumentasjon",
      "Kjøpere som vil ha AWD eller GT-ytelse",
      "Familiebruk med 490 l bagasje",
    ],
    variants: [
      {
        name: "Standard Range Active RWD",
        slug: "standard-range-active-rwd",
        is_default: true,
        battery_usable_kwh: 63,
        battery_total_kwh: 63,
        range_km: 428,
        consumption_kwh_100km: 16.4,
        ac_charging_kw: 11,
        drivetrain: "Bakhjulsdrift",
        power_hp: 170,
        torque_nm: 350,
        acceleration_0_100: 8.7,
        top_speed_kmh: 186,
        towing_kg: 750,
        curb_weight_kg: 1880,
        source_name: "Kia Bil Norge — Prisliste EV6",
        source_url: SRC.ev6,
        import_notes: "63 kWh / 170 hk RWD. WLTP 428 km.",
      },
      {
        name: "Long Range Exclusive RWD",
        slug: "long-range-exclusive-rwd",
        battery_usable_kwh: 84,
        battery_total_kwh: 84,
        range_km: 582,
        consumption_kwh_100km: 15.9,
        ac_charging_kw: 11,
        drivetrain: "Bakhjulsdrift",
        power_hp: 228,
        torque_nm: 350,
        acceleration_0_100: 7.7,
        top_speed_kmh: 186,
        towing_kg: 1800,
        curb_weight_kg: 1975,
        source_name: "Kia Bil Norge — Prisliste EV6",
        source_url: SRC.ev6,
        import_notes: "84 kWh / 228 hk RWD. WLTP 582 km.",
      },
      {
        name: "Long Range Exclusive AWD",
        slug: "long-range-exclusive-awd",
        battery_usable_kwh: 84,
        battery_total_kwh: 84,
        range_km: 546,
        consumption_kwh_100km: 17,
        ac_charging_kw: 11,
        drivetrain: "Firehjulsdrift",
        power_hp: 325,
        torque_nm: 605,
        acceleration_0_100: 5.3,
        top_speed_kmh: 188,
        towing_kg: 1800,
        curb_weight_kg: 2075,
        source_name: "Kia Bil Norge — Prisliste EV6",
        source_url: SRC.ev6,
        import_notes: "84 kWh / 325 hk AWD. WLTP 546 km. Frunk 20 l.",
      },
      {
        name: "GT AWD",
        slug: "gt-awd",
        battery_usable_kwh: 84,
        battery_total_kwh: 84,
        range_km: 450,
        consumption_kwh_100km: 20.9,
        ac_charging_kw: 11,
        drivetrain: "Firehjulsdrift",
        power_hp: 650,
        torque_nm: 770,
        acceleration_0_100: 3.5,
        top_speed_kmh: 260,
        towing_kg: 1800,
        curb_weight_kg: 2145,
        source_name: "Kia Bil Norge — Prisliste EV6 GT",
        source_url: SRC.ev6Gt,
        import_notes: "GT 650 hk. WLTP 450 km / 20,9.",
      },
    ],
  },
  {
    slug: "kia-ev9",
    model: "EV9",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 7,
    length_mm: 5010,
    width_mm: 1980,
    height_mm: 1755,
    wheelbase_mm: 3100,
    cargo_l: 828,
    frunk_l: 90,
    towing_kg: 2500,
    battery_chemistry: "Li-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: "https://www.kia.no/bil/ev9",
    primarySourceName: "Kia Bil Norge — Prisliste EV9 (12.02.2026)",
    primarySourceUrl: SRC.ev9,
    images: {
      front: "docs/_tmp_kia/final/ev9/front.jpg",
      side: "docs/_tmp_kia/final/ev9/side.jpg",
      interior: "docs/_tmp_kia/final/ev9/interior.jpg",
    },
    documentRearMissing: true,
    documentChargingHonesty: true,
    description:
      "Kia EV9 er den store helelektriske familie-SUV-en solgt i Norge (6- og 7-seter). Batteri 99,8 kWh, effekt, dims, bagasje og tilhenger er fra Kia Norge-prisliste 12.02.2026 (+ GT 01.01.2026). 800V ladesystem og varmepumpe er standard i utstyrslisten. DC kW / 10–80 er ikke oppgitt som tall — ikke gjettet. Seter 6/7 avhengig av konfigurasjon — bilnivå sat til 7-seter Air RWD som default.",
    pros: [
      "Stor 6/7-seter SUV med offisiell NO-prisliste",
      "Inntil 2500 kg tilhenger (AWD) dokumentert",
      "Offisielle NO-pressbilder for Hero/Front/Side + interiør",
    ],
    cons: [
      "DC kW / 10–80 ikke oppgitt i NO-prisliste — dokumentert gap",
      "Bakfoto ikke lagret i dette albumet — left empty",
      "Frunk 90 l (RWD Air) vs 52 l (AWD) — se variant",
    ],
    suitable_for: [
      "Store familier som trenger 6/7 seter",
      "Tilhengerbruk opptil dokumentert kapasitet",
      "Langtur når variantens WLTP planlegges med ærlige ladegap",
    ],
    variants: [
      {
        name: "Long Range Air RWD 7-seter",
        slug: "long-range-air-rwd-7",
        is_default: true,
        battery_usable_kwh: 99.8,
        battery_total_kwh: 99.8,
        range_km: 563,
        consumption_kwh_100km: 20.2,
        ac_charging_kw: 11,
        drivetrain: "Bakhjulsdrift",
        power_hp: 218,
        torque_nm: 350,
        acceleration_0_100: 9.4,
        top_speed_kmh: 185,
        towing_kg: 900,
        curb_weight_kg: 2426,
        source_name: "Kia Bil Norge — Prisliste EV9",
        source_url: SRC.ev9,
        import_notes: "99,8 kWh RWD Air 7s. WLTP 563 km. Frunk 90 l.",
      },
      {
        name: "Long Range Air AWD 7-seter",
        slug: "long-range-air-awd-7",
        battery_usable_kwh: 99.8,
        battery_total_kwh: 99.8,
        range_km: 512,
        consumption_kwh_100km: 22.3,
        ac_charging_kw: 11,
        drivetrain: "Firehjulsdrift",
        power_hp: 384,
        torque_nm: 600,
        acceleration_0_100: 6.0,
        top_speed_kmh: 200,
        towing_kg: 2500,
        curb_weight_kg: 2550,
        source_name: "Kia Bil Norge — Prisliste EV9",
        source_url: SRC.ev9,
        import_notes: "AWD Air 384 hk. WLTP 512 km. Frunk 52 l.",
      },
      {
        name: "Long Range GT Line AWD 7-seter",
        slug: "long-range-gt-line-awd-7",
        battery_usable_kwh: 99.8,
        battery_total_kwh: 99.8,
        range_km: 505,
        consumption_kwh_100km: 22.8,
        ac_charging_kw: 11,
        drivetrain: "Firehjulsdrift",
        power_hp: 384,
        torque_nm: 700,
        acceleration_0_100: 5.3,
        top_speed_kmh: 200,
        towing_kg: 2500,
        curb_weight_kg: 2589,
        source_name: "Kia Bil Norge — Prisliste EV9",
        source_url: SRC.ev9,
        import_notes: "GT Line 7s. WLTP 505 km.",
      },
      {
        name: "GT AWD 6-seter",
        slug: "gt-awd-6",
        battery_usable_kwh: 99.8,
        battery_total_kwh: 99.8,
        range_km: 510,
        consumption_kwh_100km: 21.7,
        ac_charging_kw: 11,
        drivetrain: "Firehjulsdrift",
        power_hp: 508,
        torque_nm: 740,
        acceleration_0_100: 4.6,
        top_speed_kmh: 220,
        towing_kg: 2500,
        curb_weight_kg: 2643,
        source_name: "Kia Bil Norge — Prisliste EV9 GT",
        source_url: SRC.ev9Gt,
        import_notes: "GT 508 hk 6-seter. WLTP 510 km / 21,7.",
      },
    ],
  },
  {
    slug: "kia-pv5",
    model: "PV5 Passenger",
    year: 2026,
    body_style: "MPV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4695,
    width_mm: 1895,
    height_mm: 1923,
    wheelbase_mm: 2995,
    cargo_l: 1320,
    frunk_l: null,
    towing_kg: 1500,
    battery_chemistry: "Lithium-Ion Polymer (NCM)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: "https://www.kia.no/bil/pv5",
    primarySourceName: "Kia Bil Norge — Prisliste PV5 Passenger (01.01.2026)",
    primarySourceUrl: SRC.pv5,
    images: {},
    skipGallery: true,
    forceNotReady: true,
    documentChargingHonesty: true,
    documentRearMissing: true,
    documentInteriorMissing: true,
    description:
      "Kia PV5 Passenger er den helelektriske personbil-/MPV-varianten solgt i Norge. Batteri 71,2 kWh NCM, 163 hk, dims 4695×1895×1923 mm, WLTP 412 km og tilhenger 1500 kg er fra Kia Norge-prisliste 01.01.2026. Forbruk (kWt/100 km) er ikke lagret som bekreftet tall fra den ekstraherte tekniske tabellen — ikke gjettet. DC kW / 10–80 ikke oppgitt — ikke gjettet. Image Ready blokkert: kun studio front 3/4 funnet — mangler verifisert Side. Ingen gjettede bilder.",
    pros: [
      "Offisiell NO-prisliste for Active/Exclusive/Exclusive Plus",
      "V2L og varmepumpe standard i utstyrsliste",
    ],
    cons: [
      "Image Ready blokkert — mangler verifisert Front+Side-galleri",
      "DC kW / 10–80 ikke oppgitt",
    ],
    suitable_for: [
      "Plasskrevende persontransport når Image Ready er klart",
      "Kjøpere som trenger offisiell NO-spesifikasjon nå",
    ],
    variants: [
      {
        name: "Active FWD",
        slug: "active-fwd",
        is_default: true,
        battery_usable_kwh: 71.2,
        battery_total_kwh: 71.2,
        range_km: 412,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 163,
        torque_nm: 250,
        towing_kg: 1500,
        curb_weight_kg: 2140,
        source_name: "Kia Bil Norge — Prisliste PV5 Passenger",
        source_url: SRC.pv5,
        import_notes: "71,2 kWh / 163 hk. WLTP 412 km.",
      },
      {
        name: "Exclusive FWD",
        slug: "exclusive-fwd",
        battery_usable_kwh: 71.2,
        battery_total_kwh: 71.2,
        range_km: 412,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 163,
        torque_nm: 250,
        towing_kg: 1500,
        curb_weight_kg: 2140,
        source_name: "Kia Bil Norge — Prisliste PV5 Passenger",
        source_url: SRC.pv5,
        import_notes: "Samme drivlinje; utstyrsnivå Exclusive.",
      },
      {
        name: "Exclusive Plus FWD",
        slug: "exclusive-plus-fwd",
        battery_usable_kwh: 71.2,
        battery_total_kwh: 71.2,
        range_km: 412,
        ac_charging_kw: 11,
        drivetrain: "Forhjulsdrift",
        power_hp: 163,
        torque_nm: 250,
        towing_kg: 1500,
        curb_weight_kg: 2140,
        source_name: "Kia Bil Norge — Prisliste PV5 Passenger",
        source_url: SRC.pv5,
        import_notes: "Samme drivlinje; utstyrsnivå Exclusive Plus.",
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
    `## Batteri
NO-prisliste oppgir én kapasitetstall (kWh) per drivlinje — lagret som usable og total uten å gjette separat usable-delta.`,
  );
  if (cfg.documentChargingHonesty) {
    extras.push(
      `## Lading
DC-effekt (kW) og/eller 10–80 er ikke oppgitt som tall i Kia Norge-prislisten for denne modellen — ikke gjettet. Type 2 + CCS er dokumentert i utstyrsliste. AC 11 kW der oppgitt.`,
    );
  }
  if (cfg.documentHeatPumpHonesty) {
    extras.push(
      `## Varme pumpe
Varme pumpe er ikke standard på alle utstyrsnivå i NO-prislisten (Air / valgfritt) — ikke lagret som én boolean. Ikke gjettet.`,
    );
  }
  if (cfg.documentPendingTypeApproval) {
    extras.push(
      `## Typegodkjenning
Enkelte WLTP-/forbrukstall i Kia Norge-prisliste er merket «avventer endelig typegodkjenning» — lagret som oppgitt, ikke overstyrt.`,
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
Hero/Front/Side mangler — verifisert offisielt galleri ikke komplett her. NOT_READY. Ingen gjettede bilder.`,
    );
  }
  if (cfg.slug === "kia-pv5") {
    extras.push(
      `## Forbruk
Forbruk (kWt/100 km) er ikke lagret som bekreftet tall fra Kia Norge PV5-prisliste i denne produksjonen — ikke gjettet.`,
    );
  }
  extras.push(
    `## Vinter
Ingen offisiell vinterrekkevidde er lagret som egen katalogverdi — ikke gjettet. Forvent lavere rekkevidde i kulde. Laboratoriemål (WLTP) erstatter ikke reell rekkevidde.`,
  );

  return `## Hvem bilen passer for
Kia ${cfg.model} passer for brukere som vurderer helelektrisk Kia i dette segmentet. Sammenlign varianter for batteri, WLTP, lading og tilhengertall.

## Vinter
Se notat under. Laboratoriemål erstatter ikke reell rekkevidde.

## Lading
Se variantnivå og kilder. Combined Charging System (CCS2) der oppgitt i Kia Norge-dokumentasjon.

## Daglig bruk
Egnet for hverdag når dimensjoner, seter og bagasje matcher behov.

## Langtur
Planlegg ladestopp ut fra variantens WLTP og offisiell DC-kapasitet når den er bekreftet. Laboratoriemål erstatter ikke reell rekkevidde.

## FAQ
**Hvor finner jeg offisielle tall?** Kia Norge-prisliste for ${cfg.model}.
**Er vinterrekkevidde oppgitt?** Nei som egen katalogverdi her — ikke gjettet.
**Kan tallene endre seg?** Ja — bekreft alltid gjeldende verdier hos Kia Norge / forhandler før kjøp.

${extras.join("\n\n")}`.trim();
}

async function ensureBrand(sb: SupabaseClient): Promise<string> {
  const { data: existing } = await sb
    .from("brands")
    .select("id")
    .eq("slug", "kia")
    .maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data, error } = await sb
    .from("brands")
    .insert({
      name: "Kia",
      slug: "kia",
      website_url: "https://www.kia.no",
      country: "KR",
      is_active: true,
      description: "Kia Bil Norge AS",
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
    battery_chemistry: fieldMeta(cfg.primarySourceName, cfg.primarySourceUrl),
    charging_connector_ac: fieldMeta(
      cfg.primarySourceName,
      cfg.primarySourceUrl,
      "Type 2 / CCS",
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
      ? `phase1-kia-100-${CHECKED_AT.slice(0, 10)} | NOT_READY — specs from NO pricelist; Image Ready blocked | unpublished`
      : `phase1-kia-100-${CHECKED_AT.slice(0, 10)} | Image Ready + editorial finalized | Kia Norge pricelist | unpublished`,
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
    alt: `Kia ${cfg.model} front (offisiell Kia Norge / press)`,
  });
  if (cfg.images.side) {
    await attachLocalImage(sb, {
      carId,
      slug: cfg.slug,
      role: "side",
      localPath: cfg.images.side,
      isPrimary: false,
      sortOrder: sort++,
      alt: `Kia ${cfg.model} sideprofil (offisiell Kia Norge / press)`,
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
      alt: `Kia ${cfg.model} bak (offisiell Kia Norge / press)`,
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
      alt: `Kia ${cfg.model} interiør (offisiell Kia Norge / press)`,
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
