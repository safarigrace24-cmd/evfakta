/**
 * Complete Hyundai Norwegian EV launch set to 100% Review Assistant where Image Ready.
 * Finishable: Kona Electric, Ioniq 5 (+ N), Ioniq 6 (+ N), Ioniq 9, INSTER.
 * NOT_READY:
 *   Ioniq 9 Varebil — full NO tech; Image Ready blocked (no verified gallery)
 *   Staria Electric — marketing page only; NO pricelist/tech PDF not retrieved
 *   Ioniq 3 — world-premiere marketing; no NO pricelist
 * Official Hyundai Norge pricelists + tekniske ark (dmassets.hyundai.com) + DAM images.
 * Never invent. Never auto-publish.
 *
 * Usage: npx tsx scripts/complete-hyundai-100.ts
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
const BRAND = "Hyundai";

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

const DAM = "https://dmassets.hyundai.com/is/content/hyundaiautoever";

const SRC = {
  konaTech: `${DAM}/KONA-Electric-TekniskNYpdf-1`,
  konaPris: `${DAM}/KONA+Electric+06.07.2026pdf`,
  i5Tech: `${DAM}/IONIQ-5-PE_Tekniske-Data_16-07-2024pdf`,
  i5Pris: `${DAM}/IONIQ+5+06.07.2026pdf`,
  i5nTech: `${DAM}/15-01-2024c_IONIQ-5-N-tekniskpdf`,
  i5nPris: `${DAM}/IONIQ+5+N+06.07.2026pdf`,
  i6Tech: `${DAM}/IONIQ+6+PE+Tekniske+Data+NYpdf`,
  i6Pris: `${DAM}/IONIQ+6+06.07.2026pdf`,
  i6nPris: `${DAM}/IONIQ+6+N+06.07.2026pdf`,
  i6nPage: "https://www.hyundai.com/no/no/bilmodeller/ioniq-6-n",
  i9Tech: `${DAM}/IONIQ-9_Tekniske-Datapdf`,
  i9Pris: `${DAM}/IONIQ+9+06.07.2026pdf`,
  i9VanTech: `${DAM}/IONIQ+9+Varebil+-+Tekniske+Datapdf`,
  i9VanPris: `${DAM}/IONIQ+9+Varebil+06.07.2026pdf`,
  insterTech: `${DAM}/INSTER-Teknisk-Ark-versjon-4_02-12-24pdf`,
  insterPris: `${DAM}/INSTER+06.07.2026pdf`,
  hyundaiNo: "https://www.hyundai.com/no",
} as const;

const MODELS: ModelCfg[] = [
  {
    slug: "hyundai-kona-electric",
    model: "Kona Electric",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4355,
    width_mm: 1825,
    height_mm: 1580,
    wheelbase_mm: 2660,
    cargo_l: 466,
    frunk_l: 27,
    towing_kg: 750,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: "https://www.hyundai.com/no/no/bilmodeller/kona-electric",
    primarySourceName: "Hyundai Norge — Teknisk KONA Electric",
    primarySourceUrl: SRC.konaTech,
    images: {
      front: "docs/_tmp_hyundai/final/kona-electric/front.jpg",
      side: "docs/_tmp_hyundai/final/kona-electric/side.jpg",
      rear: "docs/_tmp_hyundai/final/kona-electric/rear.jpg",
      interior: "docs/_tmp_hyundai/final/kona-electric/interior.jpg",
    },
    documentChargingHonesty: true,
    description:
      "Hyundai Kona Electric er den kompakte helelektriske SUV-en solgt i Norge. Batteri (48,4 / 65,4 kWt), effekt, WLTP, dimensjoner, bagasje 466 l / frunk 27 l og tilhenger er fra Hyundai Norge teknisk ark. Prisliste 06.07.2026 bekrefter markedstilbud. Peak DC kW er ikke oppgitt som tall — kun 10–80 (41 min). Batterikjemi er ikke oppgitt — ikke gjettet. Varmepumpe er standard (S) i NO-prislisten.",
    pros: [
      "Full NO teknisk tabell for batteri, dims, bagasje og trekk",
      "Offisiell DAM-galleri Front/Side/Rear/Interior",
      "Varmepumpe standard i NO-prisliste",
    ],
    cons: [
      "Peak DC kW ikke oppgitt i NO teknisk ark — dokumentert gap",
      "Batterikjemi ikke oppgitt — dokumentert gap",
      "N Line endrer lengde (+30 mm) og rekkevidde — sjekk variant",
    ],
    suitable_for: [
      "Kompakt familie-SUV med offisiell NO-dokumentasjon",
      "Pendling og hverdag med Type 2 + CCS",
      "Lett tilhengerkjøring på Long Range (750 kg bremset)",
    ],
    variants: [
      {
        name: "Standard Range FWD",
        slug: "standard-range-fwd",
        is_default: true,
        battery_usable_kwh: 48.4,
        battery_total_kwh: 48.4,
        range_km: 377,
        consumption_kwh_100km: 14.6,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 41,
        drivetrain: "Forhjulsdrift",
        power_hp: 156,
        torque_nm: 255,
        acceleration_0_100: 8.8,
        top_speed_kmh: 162,
        towing_kg: 300,
        curb_weight_kg: 1690,
        source_name: "Hyundai Norge — Teknisk KONA Electric",
        source_url: SRC.konaTech,
        import_notes: "48,4 kWt / 156 hk. WLTP 377 km. Bremset tilhenger 300 kg.",
      },
      {
        name: "Long Range FWD",
        slug: "long-range-fwd",
        battery_usable_kwh: 65.4,
        battery_total_kwh: 65.4,
        range_km: 514,
        consumption_kwh_100km: 14.7,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 41,
        drivetrain: "Forhjulsdrift",
        power_hp: 217,
        torque_nm: 255,
        acceleration_0_100: 7.8,
        top_speed_kmh: 172,
        towing_kg: 750,
        curb_weight_kg: 1773,
        source_name: "Hyundai Norge — Teknisk KONA Electric",
        source_url: SRC.konaTech,
        import_notes:
          "65,4 kWt / 217 hk (prisliste markedsfører 218 hk). WLTP inntil 514 km; N Line 444 km. 0–100 7,8 (8,1 med 19\").",
      },
    ],
  },
  {
    slug: "hyundai-ioniq-5",
    model: "Ioniq 5",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4655,
    width_mm: 1890,
    height_mm: 1605,
    wheelbase_mm: 3000,
    cargo_l: 520,
    frunk_l: 57,
    towing_kg: 1600,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: "https://www.hyundai.com/no/no/bilmodeller/ioniq-5",
    primarySourceName: "Hyundai Norge — Tekniske data IONIQ 5 PE",
    primarySourceUrl: SRC.i5Tech,
    images: {
      front: "docs/_tmp_hyundai/final/ioniq-5/front.jpg",
      side: "docs/_tmp_hyundai/final/ioniq-5/side.jpg",
      rear: "docs/_tmp_hyundai/final/ioniq-5/rear.jpg",
      interior: "docs/_tmp_hyundai/final/ioniq-5/interior.jpg",
    },
    documentChargingHonesty: true,
    description:
      "Hyundai Ioniq 5 er helelektrisk crossover solgt i Norge. Batteri 63/84 kWt, effekt, WLTP, dims, bagasje 520 l og frunk 57/24 l (RWD/AWD) er fra Hyundai Norge teknisk ark (PE). Prisliste 06.07.2026. Ioniq 5 N er lagret som egen variant fra eget teknisk ark (84 kWt / 650 hk). Peak DC kW ikke oppgitt — kun 10–80 (18 min). Batterikjemi ikke oppgitt — ikke gjettet.",
    pros: [
      "Full NO teknisk tabell inkl. N-variant",
      "800V-plattform med dokumentert 10–80 på 18 min",
      "Offisiell DAM-galleri Hero/Front/Side/Rear/Interior",
    ],
    cons: [
      "Peak DC kW ikke oppgitt — dokumentert gap",
      "Batterikjemi ikke oppgitt — dokumentert gap",
      "AWD reduserer frunk til 24 l",
    ],
    suitable_for: [
      "Familie-SUV med offisiell NO-dokumentasjon",
      "Langtur med rask 10–80 når DC er tilgjengelig",
      "Kjøpere som vurderer N-ytelse mot standard PE",
    ],
    variants: [
      {
        name: "Standard Range RWD",
        slug: "standard-range-rwd",
        is_default: true,
        battery_usable_kwh: 63,
        battery_total_kwh: 63,
        range_km: 440,
        consumption_kwh_100km: 15.6,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 18,
        drivetrain: "Bakhjulsdrift",
        power_hp: 170,
        torque_nm: 350,
        acceleration_0_100: 8.5,
        top_speed_kmh: 185,
        towing_kg: 750,
        curb_weight_kg: 1955,
        source_name: "Hyundai Norge — Tekniske data IONIQ 5 PE",
        source_url: SRC.i5Tech,
        import_notes: "63 kWt / 170 hk. WLTP 440 km. Frunk 57 l.",
      },
      {
        name: "Long Range RWD",
        slug: "long-range-rwd",
        battery_usable_kwh: 84,
        battery_total_kwh: 84,
        range_km: 570,
        consumption_kwh_100km: 16.0,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 18,
        drivetrain: "Bakhjulsdrift",
        power_hp: 229,
        torque_nm: 350,
        acceleration_0_100: 7.5,
        top_speed_kmh: 185,
        towing_kg: 1600,
        curb_weight_kg: 2060,
        source_name: "Hyundai Norge — Tekniske data IONIQ 5 PE",
        source_url: SRC.i5Tech,
        import_notes: "84 kWt / 229 hk. WLTP inntil 570 km (19\").",
      },
      {
        name: "Long Range AWD",
        slug: "long-range-awd",
        battery_usable_kwh: 84,
        battery_total_kwh: 84,
        range_km: 546,
        consumption_kwh_100km: 16.8,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 18,
        drivetrain: "Firehjulsdrift",
        power_hp: 325,
        torque_nm: 605,
        acceleration_0_100: 5.3,
        top_speed_kmh: 185,
        towing_kg: 1600,
        curb_weight_kg: 2165,
        source_name: "Hyundai Norge — Tekniske data IONIQ 5 PE",
        source_url: SRC.i5Tech,
        import_notes: "84 kWt AWD 325 hk. WLTP inntil 546 km (19\"). Frunk 24 l.",
      },
      {
        name: "Ioniq 5 N AWD",
        slug: "ioniq-5-n-awd",
        battery_usable_kwh: 84,
        battery_total_kwh: 84,
        range_km: 448,
        consumption_kwh_100km: 21.2,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 18,
        drivetrain: "Firehjulsdrift",
        power_hp: 650,
        torque_nm: 770,
        acceleration_0_100: 3.4,
        top_speed_kmh: 260,
        towing_kg: null,
        curb_weight_kg: 2275,
        source_name: "Hyundai Norge — Teknisk IONIQ 5 N",
        source_url: SRC.i5nTech,
        import_notes:
          "Eget N-teknisk ark: 84 kWt / 650 hk / 770 Nm. WLTP 448 km. Tilhenger ikke oppgitt (—). Lengde 4715 mm (N-karosseri) — ikke overstyrt på bilnivå.",
      },
    ],
  },
  {
    slug: "hyundai-ioniq-6",
    model: "Ioniq 6",
    year: 2026,
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4925,
    width_mm: 1880,
    height_mm: 1495,
    wheelbase_mm: 2950,
    cargo_l: 401,
    frunk_l: 45,
    towing_kg: 1500,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: "https://www.hyundai.com/no/no/bilmodeller/ioniq-6",
    primarySourceName: "Hyundai Norge — Tekniske data IONIQ 6 PE",
    primarySourceUrl: SRC.i6Tech,
    images: {
      front: "docs/_tmp_hyundai/final/ioniq-6/front.jpg",
      side: "docs/_tmp_hyundai/final/ioniq-6/side.jpg",
      rear: "docs/_tmp_hyundai/final/ioniq-6/rear.jpg",
      interior: "docs/_tmp_hyundai/final/ioniq-6/interior.jpg",
    },
    documentChargingHonesty: true,
    description:
      "Hyundai Ioniq 6 er helelektrisk sedan solgt i Norge. Batteri 63/84 kWt, effekt, WLTP (inntil 680 km LR RWD 18\"), dims, bagasje 401 l og frunk 45/14,5 l er fra Hyundai Norge teknisk ark (PE). Prisliste 06.07.2026. Ioniq 6 N er lagret som variant fra NO-prisliste + offisiell modellside (84 kWt / 650 hk / WLTP 487 km / 10–80 18 min). Peak DC kW ikke oppgitt — ikke gjettet. Batterikjemi ikke oppgitt.",
    pros: [
      "Høy WLTP-rekkevidde dokumentert i NO teknisk ark",
      "Offisiell true side + front/rear DAM-galleri",
      "N-variant dokumentert via prisliste + hyundai.com/no",
    ],
    cons: [
      "Peak DC kW ikke oppgitt — dokumentert gap",
      "Batterikjemi ikke oppgitt — dokumentert gap",
      "Dedikert N teknisk PDF ikke funnet — N dims ikke overstyrt",
    ],
    suitable_for: [
      "Effektiv langtur-sedan med offisiell NO-dokumentasjon",
      "Kjøpere som vil ha RWD/AWD eller N-ytelse",
      "Hverdag med Type 2 + CCS",
    ],
    variants: [
      {
        name: "Standard Range RWD",
        slug: "standard-range-rwd",
        is_default: true,
        battery_usable_kwh: 63,
        battery_total_kwh: 63,
        range_km: 521,
        consumption_kwh_100km: 13.4,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 18,
        drivetrain: "Bakhjulsdrift",
        power_hp: 170,
        torque_nm: 350,
        acceleration_0_100: 8.3,
        top_speed_kmh: 185,
        towing_kg: 750,
        curb_weight_kg: 1892,
        source_name: "Hyundai Norge — Tekniske data IONIQ 6 PE",
        source_url: SRC.i6Tech,
        import_notes: "63 kWt / 170 hk. WLTP 521 km (18\").",
      },
      {
        name: "Long Range RWD",
        slug: "long-range-rwd",
        battery_usable_kwh: 84,
        battery_total_kwh: 84,
        range_km: 680,
        consumption_kwh_100km: 13.5,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 18,
        drivetrain: "Bakhjulsdrift",
        power_hp: 229,
        torque_nm: 350,
        acceleration_0_100: 7.4,
        top_speed_kmh: 185,
        towing_kg: 1500,
        curb_weight_kg: 2000,
        source_name: "Hyundai Norge — Tekniske data IONIQ 6 PE",
        source_url: SRC.i6Tech,
        import_notes: "84 kWt / 229 hk. WLTP inntil 680 km (18\").",
      },
      {
        name: "Long Range AWD",
        slug: "long-range-awd",
        battery_usable_kwh: 84,
        battery_total_kwh: 84,
        range_km: 650,
        consumption_kwh_100km: 13.8,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 18,
        drivetrain: "Firehjulsdrift",
        power_hp: 325,
        torque_nm: 605,
        acceleration_0_100: 5.1,
        top_speed_kmh: 185,
        towing_kg: 1500,
        curb_weight_kg: 2105,
        source_name: "Hyundai Norge — Tekniske data IONIQ 6 PE",
        source_url: SRC.i6Tech,
        import_notes: "84 kWt AWD 325 hk. WLTP inntil 650 km (18\"). Frunk 14,5 l.",
      },
      {
        name: "Ioniq 6 N AWD",
        slug: "ioniq-6-n-awd",
        battery_usable_kwh: 84,
        battery_total_kwh: 84,
        range_km: 487,
        consumption_kwh_100km: 18.7,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 18,
        drivetrain: "Firehjulsdrift",
        power_hp: 650,
        torque_nm: 770,
        acceleration_0_100: 3.4,
        towing_kg: null,
        source_name: "Hyundai Norge — Prisliste IONIQ 6 N + modellside",
        source_url: SRC.i6nPris,
        import_notes:
          "84 kWt / 650 hk / 770 Nm / 3,4 s / WLTP 487 km / 10–80 18 min fra NO-prisliste + hyundai.com/no IONIQ 6 N. Dedikert N teknisk PDF ikke hentet — tilhenger/dims ikke gjettet.",
      },
    ],
  },
  {
    slug: "hyundai-ioniq-9",
    model: "Ioniq 9",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 7,
    length_mm: 5060,
    width_mm: 1980,
    height_mm: 1790,
    wheelbase_mm: 3130,
    cargo_l: 908,
    frunk_l: 88,
    towing_kg: 2500,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: "https://www.hyundai.com/no/no/bilmodeller/ioniq-9",
    primarySourceName: "Hyundai Norge — Tekniske data IONIQ 9",
    primarySourceUrl: SRC.i9Tech,
    images: {
      front: "docs/_tmp_hyundai/final/ioniq-9/front.jpg",
      side: "docs/_tmp_hyundai/final/ioniq-9/side.jpg",
      rear: "docs/_tmp_hyundai/final/ioniq-9/rear.jpg",
      interior: "docs/_tmp_hyundai/final/ioniq-9/interior.jpg",
    },
    documentChargingHonesty: true,
    documentSeatsHonesty: true,
    description:
      "Hyundai Ioniq 9 er helelektrisk tre-rads SUV solgt i Norge. Batteri 110,3 kWt, effekt 218/313/435 hk, WLTP, dims, bagasje bak 2. rad 908 l / bak 3. rad 338 l og frunk 88/52 l er fra Hyundai Norge teknisk ark. Prisliste 06.07.2026. 6-seters kapteinstoler er tilgjengelig — lagret seats=7 med ærlige notater. Peak DC kW ikke oppgitt — kun 10–80 (24 min).",
    pros: [
      "Stor 110,3 kWt-pakke med dokumentert NO teknisk tabell",
      "Høy tilhengerkapasitet på AWD (2500 kg)",
      "Offisiell DAM-galleri Front/Side/Rear/Interior",
    ],
    cons: [
      "Peak DC kW ikke oppgitt — dokumentert gap",
      "Batterikjemi ikke oppgitt — dokumentert gap",
      "6- vs 7-seters konfigurasjon — bekreft før kjøp",
    ],
    suitable_for: [
      "Store familier som trenger tre rader og offisiell NO-data",
      "Langtur med høy trekkapasitet",
      "Kjøpere som vurderer RWD vs AWD vs Performance",
    ],
    variants: [
      {
        name: "Long Range RWD",
        slug: "long-range-rwd",
        is_default: true,
        battery_usable_kwh: 110.3,
        battery_total_kwh: 110.3,
        range_km: 620,
        consumption_kwh_100km: 19.9,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 24,
        drivetrain: "Bakhjulsdrift",
        power_hp: 218,
        torque_nm: 350,
        acceleration_0_100: 9.4,
        top_speed_kmh: 190,
        towing_kg: 1600,
        curb_weight_kg: 2470,
        source_name: "Hyundai Norge — Tekniske data IONIQ 9",
        source_url: SRC.i9Tech,
        import_notes: "110,3 kWt RWD 218 hk. WLTP 620 km (19\"). Frunk 88 l. Bremset tilhenger 1600 kg.",
      },
      {
        name: "Long Range AWD",
        slug: "long-range-awd",
        battery_usable_kwh: 110.3,
        battery_total_kwh: 110.3,
        range_km: 606,
        consumption_kwh_100km: 20.4,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 24,
        drivetrain: "Firehjulsdrift",
        power_hp: 313,
        torque_nm: 605,
        acceleration_0_100: 6.7,
        top_speed_kmh: 200,
        towing_kg: 2500,
        curb_weight_kg: 2578,
        source_name: "Hyundai Norge — Tekniske data IONIQ 9",
        source_url: SRC.i9Tech,
        import_notes: "110,3 kWt AWD 313 hk. WLTP 606 km. Frunk 52 l.",
      },
      {
        name: "Long Range Performance AWD",
        slug: "long-range-performance-awd",
        battery_usable_kwh: 110.3,
        battery_total_kwh: 110.3,
        range_km: 600,
        consumption_kwh_100km: 20.6,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 24,
        drivetrain: "Firehjulsdrift",
        power_hp: 435,
        torque_nm: 700,
        acceleration_0_100: 5.2,
        top_speed_kmh: 200,
        towing_kg: 2500,
        curb_weight_kg: 2610,
        source_name: "Hyundai Norge — Tekniske data IONIQ 9",
        source_url: SRC.i9Tech,
        import_notes: "110,3 kWt Performance AWD 435 hk. WLTP 600 km (21\").",
      },
    ],
  },
  {
    slug: "hyundai-inster",
    model: "INSTER",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 4,
    length_mm: 3825,
    width_mm: 1610,
    height_mm: 1575,
    wheelbase_mm: 2580,
    cargo_l: 280,
    frunk_l: null,
    towing_kg: null,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: "https://www.hyundai.com/no/no/bilmodeller/inster",
    primarySourceName: "Hyundai Norge — Teknisk ark INSTER",
    primarySourceUrl: SRC.insterTech,
    images: {
      front: "docs/_tmp_hyundai/final/inster/front.jpg",
      side: "docs/_tmp_hyundai/final/inster/side.jpg",
      rear: "docs/_tmp_hyundai/final/inster/rear.jpg",
      interior: "docs/_tmp_hyundai/final/inster/interior.jpg",
    },
    documentChargingHonesty: true,
    documentHeatPumpHonesty: true,
    documentFrunkMissing: true,
    description:
      "Hyundai INSTER er kompakt helelektrisk by-SUV solgt i Norge. Batteri 42/49 kWt, effekt 97/115 hk, WLTP, dims og bagasje 280 l er fra Hyundai Norge teknisk ark. Prisliste 06.07.2026. Tilhenger ikke tillatt (—). Frunk ikke oppgitt (—). Peak DC kW ikke oppgitt — kun 10–80 (30 min). Varmepumpe er listet i utstyr, men S/P-markering er uklar i ekstrakt — ikke lagret som én boolean.",
    pros: [
      "Full NO teknisk tabell for kompakt EV",
      "Offisiell DAM-galleri Front/Side/Rear/Interior",
      "Lavt forbruk dokumentert i NO-ark",
    ],
    cons: [
      "Ingen tilhenger — dokumentert",
      "Peak DC kW / frunk / batterikjemi ikke oppgitt",
      "Kun 4 seter",
    ],
    suitable_for: [
      "Bybruk og kort pendling",
      "Kjøpere som vil ha offisiell NO-data for kompakt EV",
      "Brukere uten trekkbehov",
    ],
    variants: [
      {
        name: "Standard Range FWD",
        slug: "standard-range-fwd",
        is_default: true,
        battery_usable_kwh: 42,
        battery_total_kwh: 42,
        range_km: 327,
        consumption_kwh_100km: 14.3,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 30,
        drivetrain: "Forhjulsdrift",
        power_hp: 97,
        torque_nm: 147,
        acceleration_0_100: 11.7,
        top_speed_kmh: 140,
        towing_kg: null,
        curb_weight_kg: 1305,
        source_name: "Hyundai Norge — Teknisk ark INSTER",
        source_url: SRC.insterTech,
        import_notes: "42 kWt / 97 hk. WLTP 327 km. Tilhenger —.",
      },
      {
        name: "Long Range FWD",
        slug: "long-range-fwd",
        battery_usable_kwh: 49,
        battery_total_kwh: 49,
        range_km: 370,
        consumption_kwh_100km: 14.9,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 30,
        drivetrain: "Forhjulsdrift",
        power_hp: 115,
        torque_nm: 147,
        acceleration_0_100: 10.6,
        top_speed_kmh: 150,
        towing_kg: null,
        curb_weight_kg: 1335,
        source_name: "Hyundai Norge — Teknisk ark INSTER",
        source_url: SRC.insterTech,
        import_notes: "49 kWt / 115 hk. WLTP inntil 370 km (15\"); 360 km med 17\".",
      },
      {
        name: "Long Range Cross FWD",
        slug: "long-range-cross-fwd",
        battery_usable_kwh: 49,
        battery_total_kwh: 49,
        range_km: 360,
        consumption_kwh_100km: 15.1,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 30,
        drivetrain: "Forhjulsdrift",
        power_hp: 115,
        torque_nm: 147,
        acceleration_0_100: 10.6,
        top_speed_kmh: 150,
        towing_kg: null,
        curb_weight_kg: 1358,
        source_name: "Hyundai Norge — Teknisk ark INSTER",
        source_url: SRC.insterTech,
        import_notes: "Cross: lengde 3845 mm. WLTP 360 km (293 km m/ takkurv).",
      },
    ],
  },
  {
    slug: "hyundai-ioniq-9-varebil",
    model: "Ioniq 9 Varebil",
    year: 2026,
    body_style: "Varebil",
    vehicle_type: "Varebil",
    seats: 2,
    length_mm: 5060,
    width_mm: 1980,
    height_mm: 1790,
    wheelbase_mm: 3130,
    cargo_l: null,
    frunk_l: 52,
    towing_kg: 2500,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: "https://www.hyundai.com/no/no/bilmodeller/ioniq-9",
    primarySourceName: "Hyundai Norge — Tekniske data IONIQ 9 Varebil",
    primarySourceUrl: SRC.i9VanTech,
    images: {},
    skipGallery: true,
    forceNotReady: true,
    documentChargingHonesty: true,
    description:
      "Hyundai Ioniq 9 Varebil er helelektrisk varebil-variant dokumentert i Hyundai Norge teknisk ark (110,3 kWt AWD 313 hk, WLTP 606 km, 10–80 24 min). Image Ready er blokkert — ingen verifisert Front+Side-galleri i denne produksjonen. Ingen gjettede bilder. Unpublished.",
    pros: ["Full NO teknisk tabell for varebil"],
    cons: ["Image Ready mangler — NOT_READY"],
    suitable_for: ["Næringskjøpere når offisiell galleri finnes"],
    variants: [
      {
        name: "Long Range AWD",
        slug: "long-range-awd",
        is_default: true,
        battery_usable_kwh: 110.3,
        battery_total_kwh: 110.3,
        range_km: 606,
        consumption_kwh_100km: 20.4,
        ac_charging_kw: 11,
        charge_time_10_80_minutes: 24,
        drivetrain: "Firehjulsdrift",
        power_hp: 313,
        torque_nm: 605,
        acceleration_0_100: 6.7,
        top_speed_kmh: 200,
        towing_kg: 2500,
        curb_weight_kg: 2590,
        source_name: "Hyundai Norge — Tekniske data IONIQ 9 Varebil",
        source_url: SRC.i9VanTech,
        import_notes: "Varebil AWD. Lasterom mm oppgitt i teknisk ark — cargo_l ikke lagret som VDA liter.",
      },
    ],
  },
  {
    slug: "hyundai-staria-electric",
    model: "Staria Electric",
    year: 2026,
    body_style: "MPV",
    vehicle_type: "Personbil",
    seats: 7,
    length_mm: null,
    width_mm: null,
    height_mm: null,
    wheelbase_mm: null,
    cargo_l: null,
    towing_kg: null,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: "https://www.hyundai.com/no/no/bilmodeller/staria-electric",
    primarySourceName: "Hyundai Norge — Staria Electric modellside",
    primarySourceUrl: "https://www.hyundai.com/no/no/bilmodeller/staria-electric",
    images: {},
    skipGallery: true,
    forceNotReady: true,
    documentChargingHonesty: true,
    documentHeatPumpHonesty: true,
    description:
      "Hyundai Staria Electric har modellside på hyundai.com/no med markedsføringsfigur for rekkevidde (inntil 400 km WLTP). Offisiell NO-prisliste og teknisk ark ble ikke hentet i denne produksjonen (DAM returnerte «Image not found»). Ingen spekkgjetting. NOT_READY. Unpublished.",
    pros: ["Offisiell modellside finnes"],
    cons: ["Mangler NO prisliste/teknisk ark i denne produksjonen — NOT_READY"],
    suitable_for: ["Avvent offisiell NO-dokumentasjon"],
    variants: [
      {
        name: "Staria Electric (dokumentasjon mangler)",
        slug: "staria-electric-pending",
        is_default: true,
        range_km: 400,
        source_name: "Hyundai Norge — Staria Electric modellside",
        source_url: "https://www.hyundai.com/no/no/bilmodeller/staria-electric",
        import_notes:
          "Kun markedsførings-WLTP 400 km fra modellside. Batteri/effekt/dims ikke lagret — ikke gjettet.",
      },
    ],
  },
  {
    slug: "hyundai-ioniq-3",
    model: "Ioniq 3",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: null,
    width_mm: null,
    height_mm: null,
    wheelbase_mm: null,
    cargo_l: null,
    towing_kg: null,
    battery_chemistry: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: "https://www.hyundai.com/no/no/bilmodeller/ioniq-3",
    primarySourceName: "Hyundai Norge — IONIQ 3 modellside",
    primarySourceUrl: "https://www.hyundai.com/no/no/bilmodeller/ioniq-3",
    images: {},
    skipGallery: true,
    forceNotReady: true,
    documentChargingHonesty: true,
    documentHeatPumpHonesty: true,
    description:
      "Hyundai Ioniq 3 har verdenspremiere-/markedsføringsside på hyundai.com/no med markedsføringsfigurer (bl.a. rekkevidde inntil ~496 km). Ingen offisiell NO-prisliste funnet i denne produksjonen. Ingen spekkgjetting. NOT_READY. Unpublished.",
    pros: ["Offisiell modellside finnes"],
    cons: ["Ingen NO-prisliste/teknisk ark — NOT_READY"],
    suitable_for: ["Avvent offisiell NO-dokumentasjon og salgsstart"],
    variants: [
      {
        name: "Ioniq 3 (dokumentasjon mangler)",
        slug: "ioniq-3-pending",
        is_default: true,
        range_km: 496,
        source_name: "Hyundai Norge — IONIQ 3 modellside",
        source_url: "https://www.hyundai.com/no/no/bilmodeller/ioniq-3",
        import_notes:
          "Kun markedsførings-WLTP fra modellside. Batteri/effekt/dims ikke lagret — ikke gjettet.",
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
    `## Batterikjemi
Batterikjemi er ikke oppgitt i Hyundai Norge teknisk ark / prisliste for denne modellen — ikke gjettet. Ikke lagret som spekulert kjemi.`,
  );
  extras.push(
    `## Batteri
NO teknisk ark oppgir batteristørrelse i kWt — lagret som usable og total uten å gjette separat usable-delta der kun ett tall er oppgitt.`,
  );
  if (cfg.documentChargingHonesty) {
    extras.push(
      `## Lading
Peak DC-effekt (kW) er ikke oppgitt som tall i Hyundai Norge teknisk ark — ikke gjettet. 10–80 minutter og AC 11 kW (trefas) er lagret der oppgitt. Type 2 + CCS kombo er dokumentert.`,
    );
  }
  if (cfg.documentHeatPumpHonesty) {
    extras.push(
      `## Varme pumpe
Varme pumpe er listet i utstyr, men S/P-status er uklar i ekstrakt / ikke bekreftet som standard boolean — ikke lagret som én true/false. Ikke gjettet.`,
    );
  }
  if (cfg.documentSeatsHonesty) {
    extras.push(
      `## Seter
IONIQ 9 tilbys med 6- og 7-seters konfigurasjoner i NO-dokumentasjon — lagret seats=7 med ærlige notater. Bekreft konfigurasjon før kjøp.`,
    );
  }
  if (cfg.documentFrunkMissing) {
    extras.push(
      `## Frunk
Frunk (l) er oppgitt som — i Hyundai Norge teknisk ark — ikke gjettet. Left empty.`,
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
Tilhenger ikke tillatt — oppgitt som — i Hyundai Norge teknisk ark. Ingen tilhenger. Ikke gjettet.`,
    );
  }
  extras.push(
    `## Vinter
Ingen offisiell vinterrekkevidde er lagret som egen katalogverdi — ikke gjettet. Forvent lavere rekkevidde i kulde. Laboratoriemål (WLTP) erstatter ikke reell rekkevidde.`,
  );

  return `## Hvem bilen passer for
Hyundai ${cfg.model} passer for brukere som vurderer helelektrisk Hyundai i dette segmentet. Sammenlign varianter for batteri, WLTP, lading og tilhengertall.

## Vinter
Se notat under. Laboratoriemål erstatter ikke reell rekkevidde.

## Lading
Se variantnivå og kilder. Combined Charging System (CCS2) der oppgitt i Hyundai Norge-dokumentasjon.

## Daglig bruk
Egnet for hverdag når dimensjoner, seter og bagasje matcher behov.

## Langtur
Planlegg ladestopp ut fra variantens WLTP og offisiell 10–80 når den er bekreftet. Peak DC kW er ikke gjettet. Laboratoriemål erstatter ikke reell rekkevidde.

## FAQ
**Hvor finner jeg offisielle tall?** Hyundai Norge teknisk ark / prisliste for ${cfg.model}.
**Er vinterrekkevidde oppgitt?** Nei som egen katalogverdi her — ikke gjettet.
**Er peak DC kW oppgitt?** Nei som tall i NO teknisk ark — kun 10–80 der oppgitt.
**Kan tallene endre seg?** Ja — bekreft alltid gjeldende verdier hos Hyundai Norge / forhandler før kjøp.

${extras.join("\n\n")}`.trim();
}

async function ensureBrand(sb: SupabaseClient): Promise<string> {
  const { data: existing } = await sb
    .from("brands")
    .select("id")
    .eq("slug", "hyundai")
    .maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data, error } = await sb
    .from("brands")
    .insert({
      name: "Hyundai",
      slug: "hyundai",
      website_url: "https://www.hyundai.com/no",
      country: "KR",
      is_active: true,
      description: "Hyundai Motor Norway",
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
      "Batterikjemi ikke oppgitt — ikke gjettet",
    ),
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
      ? `phase1-hyundai-100-${CHECKED_AT.slice(0, 10)} | NOT_READY — incomplete docs or Image Ready blocked | unpublished`
      : `phase1-hyundai-100-${CHECKED_AT.slice(0, 10)} | Image Ready + editorial finalized | Hyundai Norge tech/pricelist | unpublished`,
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
    alt: `Hyundai ${cfg.model} front (offisiell Hyundai Norge / DAM)`,
  });
  if (cfg.images.side) {
    await attachLocalImage(sb, {
      carId,
      slug: cfg.slug,
      role: "side",
      localPath: cfg.images.side,
      isPrimary: false,
      sortOrder: sort++,
      alt: `Hyundai ${cfg.model} sideprofil (offisiell Hyundai Norge / DAM)`,
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
      alt: `Hyundai ${cfg.model} bak (offisiell Hyundai Norge / DAM)`,
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
      alt: `Hyundai ${cfg.model} interiør (offisiell Hyundai Norge / DAM)`,
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
