/**
 * Complete BYD Norwegian EV launch set where Image Ready + official NO specs exist.
 * Finishable: Dolphin, Atto 3, Seal, Seal U, Sealion 7, Tang.
 * NOT_READY shells: Han, EVO (incomplete official structured specs / Image Ready).
 * Official byd.no model pages + Sanity specifications + RSA prisliste (iPaper).
 * Never invent. Never auto-publish.
 *
 * Usage: npx tsx scripts/complete-byd-100.ts
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
const BRAND = "BYD";

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
  modeller: "https://byd.no/modeller",
  prisliste: "https://viewer.ipaper.io/rsa-no/byd/byd-prisliste/",
  warranty:
    "https://viewer.ipaper.io/rsa-no/byd/byd-garantibok-seal-seal-u-dolphin-tang-4x4-sealion-7-atto-3/",
  dolphin: "https://byd.no/modeller/dolphin",
  dolphinTech:
    "https://viewer.ipaper.io/rsa-no/byd/byd-dolphin-tekniske-spesifikasjoner1/?page=1",
  atto3: "https://byd.no/modeller/atto3",
  atto3Tech: "https://viewer.ipaper.io/rsa-no/byd/byd-atto-tekniske-spesifikasjoner/",
  seal: "https://byd.no/modeller/seal-4x4",
  sealU: "https://byd.no/modeller/seal-u",
  sealUTech:
    "https://viewer.ipaper.io/rsa-no/byd/byd-seal-u-teknisk-info-og-utstyr/",
  sealion7: "https://byd.no/modeller/sealion7",
  sealion7Tech:
    "https://viewer.ipaper.io/rsa-no/byd/byd-sealion-7-tekniske-spesifikasjoner-og-utstyrpdf/",
  tang: "https://byd.no/modeller/tang-4x4",
  tangTech:
    "https://viewer.ipaper.io/rsa-no/byd/byd-tang-long-range-teknisk-info-og-utstyr/",
  han: "https://byd.no/modeller/han-4x4",
  evo: "https://byd.no/modeller/evo-4x4",
} as const;

const MODELS: ModelCfg[] = [
  {
    slug: "byd-dolphin",
    model: "Dolphin",
    year: 2026,
    body_style: "Hatchback",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4290,
    width_mm: 1770,
    height_mm: 1570,
    wheelbase_mm: 2700,
    cargo_l: 364,
    towing_kg: 0,
    battery_chemistry: "LFP (BYD Blade)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.dolphin,
    primarySourceName: "BYD Norge — Dolphin modellside + Sanity specifications",
    primarySourceUrl: SRC.dolphin,
    images: {
      front: "docs/_tmp_byd/final/byd-dolphin/front.jpg",
      side: "docs/_tmp_byd/final/byd-dolphin/side.jpg",
      rear: "docs/_tmp_byd/final/byd-dolphin/rear.jpg",
      interior: "docs/_tmp_byd/final/byd-dolphin/interior.jpg",
    },
    documentHeatPumpHonesty: true,
    documentFrunkMissing: true,
    documentConsumptionHonesty: true,
    description:
      "BYD Dolphin er den kompakte helelektriske hatchbacken solgt i Norge via byd.no. Offisiell Sanity-spesifikasjon oppgir 60,4 kWh Blade (LFP), WLTP kombinert 427 km, 203 hk / 310 Nm, 0–100 på 7,0 s, bagasje 364–1 329 liter og maks DC-ladehastighet 110 kW. V2L er bekreftet på norsk modellside. Varmepumpe er ikke lagret som spekulert boolean. Ingen offisiell vinterrekkevidde er lagret.",
    pros: [
      "Full strukturert NO Sanity-spesifikasjon for batteri, dims, WLTP og ytelse",
      "Offisiell Hero/Front/Side-galleri fra byd.no / Sanity CDN",
      "V2L bekreftet på norsk modellside",
    ],
    cons: [
      "Forbrukstal i Sanity (1,59) er lagret som 15,9 kWh/100 km etter enhetsnormalisering — se honesty-notat",
      "Varmepumpe ikke bekreftet som enkelt true/false for denne modellen — ikke gjettet",
      "Tilhenger 0 kg i offisiell spesifikasjon",
    ],
    suitable_for: [
      "By- og pendlerbruk med kompakt hatchback",
      "Brukere som vil ha offisiell NO-dokumentasjon og V2L",
      "Kjøpere som ikke trenger tilhenger",
    ],
    variants: [
      {
        name: "Comfort",
        slug: "comfort",
        is_default: true,
        battery_total_kwh: 60.4,
        range_km: 427,
        consumption_kwh_100km: 15.9,
        ac_charging_kw: 11,
        dc_charging_kw: 110,
        charge_time_10_80_minutes: 36,
        drivetrain: "Forhjulsdrift",
        power_hp: 203,
        torque_nm: 310,
        acceleration_0_100: 7.0,
        top_speed_kmh: 160,
        towing_kg: 0,
        curb_weight_kg: 1658,
        source_name: "BYD Norge — Dolphin specifications + Maks DC 110 kW",
        source_url: SRC.dolphin,
        import_notes:
          "60,4 kWh Blade LFP. WLTP 427 km. DC peak 110 kW (NO locale). AC 11 kW. 10–80 36 min (specs). Forbruk 15,9 etter normalisering av Sanity 1,59.",
      },
    ],
    extraScoreNotes: [
      `## Forbruk
Sanity-feltet consumptionCombined er 1,59 (city 1,2). Tolket som kWh/10 km → 15,9 / 12,0 kWh/100 km. Ikke gjettet utover denne enhetsnormaliseringen.`,
      `## V2L
Vehicle-to-load (V2L) er bekreftet på byd.no/modeller/dolphin. V2G er ikke bekreftet — ikke lagret.`,
      `## Tilhenger
trailWeightWithBrakes = 0 i offisiell Sanity-spesifikasjon — lagret som 0 kg.`,
    ],
  },
  {
    slug: "byd-atto-3",
    model: "Atto 3",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4455,
    width_mm: 1875,
    height_mm: 1615,
    wheelbase_mm: 2720,
    cargo_l: 555,
    towing_kg: null,
    battery_chemistry: "LFP (BYD Blade)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.atto3,
    primarySourceName: "BYD Norge — Atto 3 modellside + Sanity specifications",
    primarySourceUrl: SRC.atto3,
    images: {
      front: "docs/_tmp_byd/final/byd-atto-3/front.jpg",
      side: "docs/_tmp_byd/final/byd-atto-3/side.jpg",
      rear: "docs/_tmp_byd/final/byd-atto-3/rear.jpg",
    },
    documentInteriorMissing: true,
    documentHeatPumpHonesty: true,
    documentFrunkMissing: true,
    documentTowingHonesty: true,
    description:
      "BYD Atto 3 er den kompakte helelektriske SUV-en solgt i Norge via byd.no. Offisiell Sanity-spesifikasjon oppgir 60,48 kWh Blade-batteri, WLTP kombinert 420 km, 202 hk / 310 Nm, 0–100 på 7,3 s og bagasje 555 liter (seter oppe). Norsk modelltekst bekrefter AC 11 kW og DC opptil 80 kW samt V2L. Varmepumpe og tilhengertall er ikke lagret uten eksplisitt bekreftelse. Ingen offisiell vinterrekkevidde er lagret.",
    pros: [
      "Full strukturert NO Sanity-spesifikasjon",
      "Offisiell Front/Side/Rear-galleri verifisert som Atto 3",
      "DC 80 kW og V2L bekreftet på norsk modellside",
    ],
    cons: [
      "Marketingtekst oppgir også 440 liter bagasje — konflikt mot seatsUp 555 i Sanity; seatsUp lagret",
      "Tilhenger ikke oppgitt i hentet strukturert spesifikasjon — ikke gjettet",
      "Varmepumpe ikke lagret som spekulert boolean",
    ],
    suitable_for: [
      "Kompakt familie-SUV med offisiell NO-dokumentasjon",
      "Pendling og hverdag med Type 2 + CCS",
      "Brukere som ønsker V2L",
    ],
    variants: [
      {
        name: "Design",
        slug: "design",
        is_default: true,
        battery_total_kwh: 60.48,
        range_km: 420,
        consumption_kwh_100km: 16.0,
        ac_charging_kw: 11,
        dc_charging_kw: 80,
        charge_time_10_80_minutes: 45,
        drivetrain: "Forhjulsdrift",
        power_hp: 202,
        torque_nm: 310,
        acceleration_0_100: 7.3,
        top_speed_kmh: 160,
        curb_weight_kg: 1750,
        source_name: "BYD Norge — Atto 3 specifications + modelltekst DC 80 kW",
        source_url: SRC.atto3,
        import_notes:
          "60,48 kWh Blade. WLTP 420 km. DC opptil 80 kW (NO modelltekst). AC 11 kW. 10–80 45 min (specs). Forbruk 16,0 fra Sanity Wh/km 160.",
      },
    ],
    extraScoreNotes: [
      `## Bagasje
Sanity trunkVolumeWithSeatsUp = 555 l; maxTrunkVolume = 440 l; markedsføringstekst 440/1440. Lagret seatsUp 555. Konflikt dokumentert — ikke glattet over.`,
      `## V2L
V2L er bekreftet på byd.no/modeller/atto3 (Design inkluderer adapter ifølge modelltekst). V2G ikke bekreftet.`,
    ],
  },
  {
    slug: "byd-seal",
    model: "Seal",
    year: 2026,
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4800,
    width_mm: 1875,
    height_mm: 1459,
    wheelbase_mm: 2920,
    cargo_l: 400,
    frunk_l: 72,
    towing_kg: null,
    battery_chemistry: "LFP (BYD Blade)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.seal,
    primarySourceName: "BYD Norge — Seal 4x4 modellside + Sanity specifications",
    primarySourceUrl: SRC.seal,
    images: {
      front: "docs/_tmp_byd/final/byd-seal/front.jpg",
      side: "docs/_tmp_byd/final/byd-seal/side.jpg",
      rear: "docs/_tmp_byd/final/byd-seal/rear.jpg",
      interior: "docs/_tmp_byd/final/byd-seal/interior.jpg",
    },
    documentHeatPumpHonesty: true,
    documentTowingHonesty: true,
    description:
      "BYD Seal 4x4 er den helelektriske sedanen solgt i Norge via byd.no. Offisiell Sanity-spesifikasjon oppgir 82,5 kWh Blade (LFP), WLTP kombinert 520 km, 530 hk / 670 Nm, 0–100 på 3,8 s og bagasje 400 liter. Norsk modelltekst bekrefter AC 11 kW, DC opptil 150 kW og frunk 72 liter. V2L er bekreftet. Tilhenger og varmepumpe er ikke lagret uten eksplisitt tall/boolean. Ingen offisiell vinterrekkevidde er lagret.",
    pros: [
      "Full strukturert NO Sanity-spesifikasjon for AWD-sedan",
      "Offisiell Front/Side/Rear/Interior-galleri",
      "DC 150 kW og frunk 72 l fra norsk modellside",
    ],
    cons: [
      "Markedsføringstekst nevner også 485 liter bak — konflikt mot Sanity maxTrunkVolume 400; 400 lagret",
      "Tilhenger ikke oppgitt i hentet strukturert spesifikasjon — ikke gjettet",
      "Varmepumpe ikke lagret som spekulert boolean",
    ],
    suitable_for: [
      "Kjøpere som vil ha sporty elektrisk sedan med AWD",
      "Langtur med høy WLTP når ladestopp planlegges",
      "Brukere som verdsetter frunk i tillegg til bagasjerom",
    ],
    variants: [
      {
        name: "Excellence AWD",
        slug: "excellence-awd",
        is_default: true,
        battery_total_kwh: 82.5,
        range_km: 520,
        consumption_kwh_100km: 18.2,
        ac_charging_kw: 11,
        dc_charging_kw: 150,
        charge_time_10_80_minutes: 35,
        drivetrain: "Firehjulsdrift",
        power_hp: 530,
        torque_nm: 670,
        acceleration_0_100: 3.8,
        top_speed_kmh: 180,
        curb_weight_kg: 2185,
        source_name: "BYD Norge — Seal 4x4 specifications + DC 150 kW",
        source_url: SRC.seal,
        import_notes:
          "82,5 kWh Blade LFP. WLTP 520 km. AWD 530 hk / 670 Nm. DC opptil 150 kW. AC 11 kW. 10–80 35 min.",
      },
    ],
    extraScoreNotes: [
      `## Bagasje / frunk
Sanity maxTrunkVolume = 400 l. Modelltekst oppgir 485 liter bak + 72 liter frunk. Bak: 400 lagret (Sanity). Frunk: 72 l fra norsk modelltekst.`,
      `## V2L
V2L med adapter er bekreftet på byd.no/modeller/seal-4x4. V2G ikke bekreftet.`,
    ],
  },
  {
    slug: "byd-seal-u",
    model: "Seal U",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4785,
    width_mm: 1890,
    height_mm: 1668,
    wheelbase_mm: 2765,
    cargo_l: 425,
    towing_kg: 1300,
    battery_chemistry: "LFP (BYD Blade)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: null,
    page: SRC.sealU,
    primarySourceName: "BYD Norge — Seal U modellside + Sanity specifications",
    primarySourceUrl: SRC.sealU,
    images: {
      front: "docs/_tmp_byd/final/byd-seal-u/front.jpg",
      side: "docs/_tmp_byd/final/byd-seal-u/side.jpg",
      rear: "docs/_tmp_byd/final/byd-seal-u/rear.jpg",
      interior: "docs/_tmp_byd/final/byd-seal-u/interior.jpg",
    },
    documentHeatPumpHonesty: true,
    documentFrunkMissing: true,
    description:
      "BYD Seal U er den midtstørrelse helelektriske familie-SUV-en solgt i Norge via byd.no. Offisiell Sanity-spesifikasjon oppgir 87 kWh Blade (LFP), WLTP kombinert 500 km, 218 hk / 330 Nm, 0–100 på 8,6 s og bagasje 425–1 440 liter. Norsk modelltekst bekrefter DC opptil 140 kW, AC 11 kW, tilhenger opptil 1 300 kg og V2L. Varmepumpe er ikke lagret som spekulert boolean. Ingen offisiell vinterrekkevidde er lagret.",
    pros: [
      "Full strukturert NO Sanity-spesifikasjon",
      "Offisiell Front/Side/Rear/Interior-galleri (oppgradert fra quarantine-shell)",
      "DC 140 kW, tilhenger 1 300 kg og V2L fra norsk modellside",
    ],
    cons: [
      "Varmepumpe ikke lagret som spekulert boolean",
      "Frunk ikke oppgitt i hentet materiale — ikke gjettet",
      "Peak DC er modelltekst (140 kW); 10–80 43 min fra Sanity charging-felt",
    ],
    suitable_for: [
      "Familie-SUV med offisiell NO-dokumentasjon",
      "Brukere som trenger tilhenger opptil 1 300 kg",
      "Hverdag og langtur med 87 kWh-pakke",
    ],
    variants: [
      {
        name: "Design",
        slug: "design",
        is_default: true,
        battery_total_kwh: 87,
        range_km: 500,
        consumption_kwh_100km: 20.5,
        ac_charging_kw: 11,
        dc_charging_kw: 140,
        charge_time_10_80_minutes: 43,
        drivetrain: "Forhjulsdrift",
        power_hp: 218,
        torque_nm: 330,
        acceleration_0_100: 8.6,
        top_speed_kmh: 175,
        towing_kg: 1300,
        curb_weight_kg: 2147,
        source_name: "BYD Norge — Seal U specifications + DC 140 kW / tilhenger 1300 kg",
        source_url: SRC.sealU,
        import_notes:
          "87 kWh Blade LFP. WLTP 500 km. FWD 218 hk / 330 Nm. DC opptil 140 kW. Tilhenger 1 300 kg (modelltekst). 10–80 43 min.",
      },
    ],
    extraScoreNotes: [
      `## V2L
V2L er bekreftet på byd.no/modeller/seal-u (Design inkluderer adapter ifølge modelltekst). V2G ikke bekreftet.`,
      `## Tilhenger
Opptil 1 300 kg med hengerfeste ifølge norsk modelltekst — lagret.`,
    ],
  },
  {
    slug: "byd-sealion-7",
    model: "Sealion 7",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4830,
    width_mm: 1925,
    height_mm: 1620,
    wheelbase_mm: 2930,
    cargo_l: 520,
    frunk_l: 58,
    towing_kg: 1500,
    battery_chemistry: "LFP (BYD Blade)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: SRC.sealion7,
    primarySourceName: "BYD Norge — Sealion 7 modellside + Sanity specifications",
    primarySourceUrl: SRC.sealion7,
    images: {
      front: "docs/_tmp_byd/final/byd-sealion-7/front.jpg",
      side: "docs/_tmp_byd/final/byd-sealion-7/side.jpg",
      rear: "docs/_tmp_byd/final/byd-sealion-7/rear.jpg",
    },
    documentInteriorMissing: true,
    description:
      "BYD Sealion 7 er den sporty helelektriske crossover-SUV-en solgt i Norge via byd.no. Offisiell Sanity-spesifikasjon for 91,3 kWh Blade (LFP) oppgir WLTP kombinert 502 km, 530 hk / 690 Nm, 0–100 på 4,5 s, bagasje 520–1 789 liter og tilhenger 1 500 kg. Norsk modelltekst bekrefter DC opptil 230 kW (10–80 på 24 min), frunk 58 liter, varmepumpe og V2L. Side-/bakbilder er visuelt verifisert; minst ett assets på modellssiden tilhører feil modell (EVO) og er forkastet. Ingen offisiell vinterrekkevidde er lagret.",
    pros: [
      "Full strukturert NO Sanity-spesifikasjon for 91,3 kWh AWD",
      "DC 230 kW, varmepumpe, frunk og tilhenger 1 500 kg dokumentert",
      "Offisiell Front/Side/Rear-galleri med feilaktige assets forkastet",
    ],
    cons: [
      "82,5 kWh-variant nevnes på siden uten full separat Sanity-tabell i denne kjøringen — ikke opprettet som spekulert variant",
      "Interiørbilde mangler (feilmodell-interiør på siden forkastet)",
      "Bakfoto viser åpen luke (cargo-vinkel)",
    ],
    suitable_for: [
      "Kjøpere som vil ha sporty AWD-crossover med høy ladeeffekt",
      "Familiebruk med 520 l bagasje + frunk",
      "Tilhengerbruk opptil 1 500 kg",
    ],
    variants: [
      {
        name: "Excellence AWD 91,3 kWh",
        slug: "excellence-awd-91",
        is_default: true,
        battery_total_kwh: 91.3,
        range_km: 502,
        consumption_kwh_100km: 21.9,
        ac_charging_kw: 11,
        dc_charging_kw: 230,
        charge_time_10_80_minutes: 24,
        drivetrain: "Firehjulsdrift",
        power_hp: 530,
        torque_nm: 690,
        acceleration_0_100: 4.5,
        top_speed_kmh: 215,
        towing_kg: 1500,
        curb_weight_kg: 2435,
        source_name: "BYD Norge — Sealion 7 specifications + DC 230 kW",
        source_url: SRC.sealion7,
        import_notes:
          "91,3 kWh Blade LFP. WLTP 502 km. AWD 530 hk / 690 Nm. DC opptil 230 kW. 10–80 24 min. Tilhenger 1 500 kg.",
      },
    ],
    extraScoreNotes: [
      `## Varianter
82,5 kWh er nevnt i lokaliserte strenger på modellssiden, men full strukturert spesifikasjonsblokk i denne produksjonen matcher 91,3 kWh AWD. Ingen spekulert andrevariant opprettet.`,
      `## Bilder
Minst ett asset på Sealion 7-siden er merket EVO (feil modell) — forkastet. Interiørasset som matcher Seal U er forkastet.`,
      `## V2L
V2L er bekreftet på byd.no/modeller/sealion7. V2G ikke bekreftet.`,
    ],
  },
  {
    slug: "byd-tang",
    model: "Tang",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 7,
    length_mm: 4970,
    width_mm: 1955,
    height_mm: 1745,
    wheelbase_mm: 2820,
    cargo_l: 235,
    towing_kg: 1500,
    battery_chemistry: "LFP (BYD Blade)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: SRC.tang,
    primarySourceName: "BYD Norge — Tang 4x4 Long Range modellside + Sanity specifications",
    primarySourceUrl: SRC.tang,
    images: {
      front: "docs/_tmp_byd/final/byd-tang/front.jpg",
      side: "docs/_tmp_byd/final/byd-tang/side.jpg",
      rear: "docs/_tmp_byd/final/byd-tang/rear.jpg",
    },
    documentInteriorMissing: true,
    documentFrunkMissing: true,
    documentChargingHonesty: true,
    description:
      "BYD Tang 4x4 Long Range er den store syvseters helelektriske SUV-en solgt i Norge via byd.no. Offisiell Sanity-spesifikasjon oppgir 108,8 kWh Blade (LFP), WLTP kombinert 530 km, 509 hk, 0–100 på 4,9 s, bagasje 235–1 655 liter og tilhenger 1 500 kg. Varmepumpe og V2L er bekreftet. Peak DC kW er ikke oppgitt som tall i hentet materiale — kun ladetider. Momentfeltet i Sanity oppgir 350 Nm samtidig som front/rear 350 Nm hver — kombinert peak er ikke lagret som gjetning. Ingen offisiell vinterrekkevidde er lagret.",
    pros: [
      "Full strukturert NO Sanity-spesifikasjon for 7-seters Long Range",
      "Offisiell Front/Side/Rear-galleri",
      "Tilhenger 1 500 kg, varmepumpe og V2L dokumentert",
    ],
    cons: [
      "Peak DC kW ikke oppgitt — dokumentert gap",
      "Kombinert moment ikke entydig (350 Nm vs 350+350) — ikke gjettet kombinerte peak",
      "Interiørbilde mangler i verifisert galleri",
    ],
    suitable_for: [
      "Store familier som trenger syv seter",
      "Tilhengerbruk opptil 1 500 kg",
      "Langtur med stor 108,8 kWh-pakke",
    ],
    variants: [
      {
        name: "Long Range AWD",
        slug: "long-range-awd",
        is_default: true,
        battery_total_kwh: 108.8,
        range_km: 530,
        consumption_kwh_100km: 24,
        ac_charging_kw: 11,
        dc_charging_kw: null,
        charge_time_10_80_minutes: 46,
        drivetrain: "Firehjulsdrift",
        power_hp: 509,
        torque_nm: null,
        acceleration_0_100: 4.9,
        top_speed_kmh: 190,
        towing_kg: 1500,
        curb_weight_kg: 2630,
        source_name: "BYD Norge — Tang 4x4 Long Range specifications",
        source_url: SRC.tang,
        import_notes:
          "108,8 kWh Blade LFP. WLTP 530 km. 509 hk. 10–80 46 min (specs). Peak DC kW ikke oppgitt. Moment ikke lagret (350 vs 350+350 konflikt).",
      },
    ],
    extraScoreNotes: [
      `## Moment
Sanity performance.maxTorque = 350 Nm; electricMotor maxFrontTorque/maxRearTorque = 350 Nm hver. Kombinert peak er ikke eksplisitt oppgitt — torque_nm left empty.`,
      `## Lading
Peak DC kW ikke oppgitt i hentet NO-materiale. Modelltekst: 30–80 % på 30 min. Specs: 10–80 % på 46 min — 46 lagret. AC 0–100 ca. 11 timer.`,
      `## V2L
V2L er bekreftet på byd.no/modeller/tang-4x4. V2G ikke bekreftet.`,
    ],
  },
  {
    slug: "byd-han",
    model: "Han",
    year: 2026,
    body_style: "Sedan",
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
    page: SRC.han,
    primarySourceName: "BYD Norge — Han 4x4 modellside (ufullstendig)",
    primarySourceUrl: SRC.han,
    images: {},
    forceNotReady: true,
    skipGallery: true,
    documentHeatPumpHonesty: true,
    documentFrunkMissing: true,
    documentTowingHonesty: true,
    documentChargingHonesty: true,
    description:
      "BYD Han 4x4 er markedsført på byd.no, men strukturert Sanity specifications-blokk med dims/batteri/forbruk mangler i hentet materiale. Kun markeds-USP (WLTP 521–662 km, 0–100 3,9 s) og svært få bilder. NOT_READY — ingen spekker eller galleri gjettet.",
    pros: ["Offisiell modellside finnes på byd.no"],
    cons: [
      "Mangler strukturert NO teknisk spesifikasjonsblokk",
      "Image Ready umulig (kun 2 assets hentet)",
      "NOT_READY",
    ],
    suitable_for: ["Avvent full offisiell NO-dokumentasjon og Image Ready"],
    variants: [
      {
        name: "4x4 (udokumentert)",
        slug: "awd-undocumented",
        is_default: true,
        source_name: "BYD Norge — Han 4x4 (ufullstendig)",
        source_url: SRC.han,
        import_notes: "NOT_READY — ingen full spes-tabell.",
      },
    ],
  },
  {
    slug: "byd-evo",
    model: "EVO",
    year: 2026,
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: null,
    width_mm: null,
    height_mm: null,
    wheelbase_mm: null,
    cargo_l: null,
    towing_kg: 1500,
    battery_chemistry: "LFP (BYD Blade)",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    heat_pump: true,
    page: SRC.evo,
    primarySourceName: "BYD Norge — EVO 4x4 modellside (ufullstendig dims)",
    primarySourceUrl: SRC.evo,
    images: {},
    forceNotReady: true,
    skipGallery: true,
    documentFrunkMissing: true,
    description:
      "BYD EVO 4x4 er aktivt markedsført på byd.no med USP (74,8 kWh, WLTP 470 km, 443 hk, 0–100 3,9 s, DC opptil 220 kW, tilhenger 1 500 kg, varmepumpe). Strukturert Sanity specifications-blokk med dimensjoner mangler i hentet materiale (iPaper uten ekstraherbare mm-tabeller). NOT_READY — ikke Publish Ready uten full dims + Image Ready-verifisering.",
    pros: [
      "Offisiell modellside + USP for batteri/rekkevidde/DC/tilhenger",
      "Varmepumpe eksplisitt standard i FAQ",
    ],
    cons: [
      "Mangler strukturert dims/forbruk-tabell i denne produksjonen",
      "Image Ready ikke fullført i denne batchen",
      "NOT_READY",
    ],
    suitable_for: ["Avvent full teknisk tabell + Image Ready"],
    variants: [
      {
        name: "Excellence AWD",
        slug: "excellence-awd",
        is_default: true,
        battery_total_kwh: 74.8,
        range_km: 470,
        ac_charging_kw: 11,
        dc_charging_kw: 220,
        drivetrain: "Firehjulsdrift",
        power_hp: 443,
        acceleration_0_100: 3.9,
        towing_kg: 1500,
        source_name: "BYD Norge — EVO 4x4 modellside USP",
        source_url: SRC.evo,
        import_notes:
          "USP only: 74,8 kWh / 470 km / 443 hk / DC 220 kW / tilhenger 1500. Dims mangler — NOT_READY.",
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
Batterikjemi er oppgitt som ${cfg.battery_chemistry} i BYD Norge-dokumentasjon — ikke spekulert utover dette.`
      : `## Batterikjemi
Batterikjemi er ikke oppgitt i hentet BYD Norge-dokumentasjon for denne modellen — ikke gjettet.`,
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
Frunk (l) er ikke oppgitt i hentet BYD Norge-materiale — ikke gjettet. Left empty.`,
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
BYD ${cfg.model} passer for brukere som vurderer helelektrisk BYD i dette segmentet i Norge. Sammenlign mot øvrige BYD-modeller på byd.no.

## Vinter
Se notat under. Laboratoriemål erstatter ikke reell rekkevidde.

## Lading
Se variantnivå og kilder. Type 2 + CCS2 der dokumentert.

## Daglig bruk
Egnet for hverdag når dimensjoner, seter og bagasje matcher behov.

## Langtur
Planlegg ladestopp ut fra variantens WLTP og offisiell 10–80 der bekreftet. Laboratoriemål erstatter ikke reell rekkevidde.

## FAQ
**Hvor finner jeg offisielle tall?** byd.no modellside / tekniske spesifikasjoner / RSA prisliste for ${cfg.model}.
**Er vinterrekkevidde oppgitt?** Nei som egen katalogverdi her — ikke gjettet.
**Er peak DC kW oppgitt?** Se variantnivå — kun lagret der dokumentert i norsk materiale.
**Kan tallene endre seg?** Ja — bekreft alltid gjeldende verdier hos BYD Norge / forhandler før kjøp.

${extras.join("\n\n")}`.trim();
}

async function ensureBrand(sb: SupabaseClient): Promise<string> {
  const { data: existing } = await sb
    .from("brands")
    .select("id")
    .eq("slug", "byd")
    .maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data, error } = await sb
    .from("brands")
    .insert({
      name: "BYD",
      slug: "byd",
      website_url: "https://byd.no",
      country: "CN",
      is_active: true,
      description: "BYD Norway",
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
      ? `phase1-byd-100-${CHECKED_AT.slice(0, 10)} | NOT_READY — incomplete docs or Image Ready blocked | unpublished`
      : `phase1-byd-100-${CHECKED_AT.slice(0, 10)} | Image Ready + editorial finalized | byd.no Sanity/modellside | unpublished`,
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
    alt: `BYD ${cfg.model} foran (offisiell byd.no / Sanity)`,
  });
  if (cfg.images.side) {
    await attachLocalImage(sb, {
      carId,
      slug: cfg.slug,
      role: "side",
      localPath: cfg.images.side,
      isPrimary: false,
      sortOrder: sort++,
      alt: `BYD ${cfg.model} sideprofil (offisiell byd.no / Sanity)`,
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
      alt: `BYD ${cfg.model} bak (offisiell byd.no / Sanity)`,
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
      alt: `BYD ${cfg.model} interiør (offisiell byd.no / Sanity)`,
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
