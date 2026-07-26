/**
 * Volvo production batch 01 — EX30, EX40, EC40, EX90, ES90, EX60.
 * Official Volvo Cars Norge sources only. Never publishes.
 *
 * Usage: npx tsx scripts/apply-volvo-batch-01.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { EDITORIAL_DRAFT_MARKER } from "../lib/admin/editorial-assist-core";
import { computeEditorialCompletion } from "../lib/admin/editorial-completion";
import {
  deriveProductionStatus,
  type ProductionStatus,
} from "../lib/admin/production-dashboard";
import type { AdminCar } from "../lib/admin/types";
import type { AdminCarVariant } from "../lib/admin/variant-types";
import type { CarImageRow } from "../lib/admin/car-image-types";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const CHECKED = "2026-07-26T15:00:00.000Z";
const REPORT_PATH = resolve(process.cwd(), "docs/VOLVO_BATCH_01.md");
const JSON_PATH = resolve(process.cwd(), "data/catalog-batch-03-volvo.json");
const DRAFT = EDITORIAL_DRAFT_MARKER;

const SRC = {
  ex30Specs: {
    name: "Volvo Cars Norge — EX30 spesifikasjoner",
    url: "https://www.volvocars.com/no/cars/ex30-electric/specifications/",
  },
  ex30Page: {
    name: "Volvo Cars Norge — EX30 modellside",
    url: "https://www.volvocars.com/no/cars/ex30-electric/",
  },
  ex40Specs: {
    name: "Volvo Cars Norge — EX40 spesifikasjoner",
    url: "https://www.volvocars.com/no/cars/ex40-electric/specifications/",
  },
  ex40Page: {
    name: "Volvo Cars Norge — EX40 modellside",
    url: "https://www.volvocars.com/no/cars/ex40-electric/",
  },
  ec40Specs: {
    name: "Volvo Cars Norge — EC40 spesifikasjoner",
    url: "https://www.volvocars.com/no/cars/ec40-electric/specifications/",
  },
  ec40Page: {
    name: "Volvo Cars Norge — EC40 modellside",
    url: "https://www.volvocars.com/no/cars/ec40-electric/",
  },
  ex90Specs: {
    name: "Volvo Cars Norge — EX90 spesifikasjoner",
    url: "https://www.volvocars.com/no/cars/ex90-electric/specifications/",
  },
  ex90Page: {
    name: "Volvo Cars Norge — EX90 modellside",
    url: "https://www.volvocars.com/no/cars/ex90-electric/",
  },
  es90Specs: {
    name: "Volvo Cars Norge — ES90 spesifikasjoner",
    url: "https://www.volvocars.com/no/cars/es90-electric/specifications/",
  },
  es90Page: {
    name: "Volvo Cars Norge — ES90 modellside",
    url: "https://www.volvocars.com/no/cars/es90-electric/",
  },
  es90Press: {
    name: "Volvo Cars Media NO — ES90 pressemelding",
    url: "https://www.volvocars.com/no/media/press-releases/E9CE08417671E121/",
  },
  ex60Specs: {
    name: "Volvo Cars Norge — EX60 spesifikasjoner",
    url: "https://www.volvocars.com/no/cars/ex60-electric/specifications/",
  },
  ex60Page: {
    name: "Volvo Cars Norge — EX60 modellside",
    url: "https://www.volvocars.com/no/cars/ex60-electric/",
  },
  ex60Press: {
    name: "Volvo Cars Media NO — EX60 pressemelding",
    url: "https://www.volvocars.com/no/media/press-releases/66BC87BAF48EA777/",
  },
  batteryWarranty: {
    name: "Volvo Cars Norge — Batterigaranti for elbil og ladbar hybrid",
    url: "https://www.volvocars.com/no/l/own/garanti-hybridbatteri/",
  },
} as const;

type FieldSrc = {
  source_name: string;
  source_url: string;
  imported_at: string;
  retrieved_at: string;
  data_last_checked_at: string;
  confidence: number;
  review_status: "pending";
  draft?: boolean;
  notes?: string | null;
  research_job_id: null;
  import_job_id: null;
};

function src(
  source: { name: string; url: string },
  confidence: number,
  notes?: string,
  draft = false,
): FieldSrc {
  return {
    source_name: source.name,
    source_url: source.url,
    imported_at: CHECKED,
    retrieved_at: CHECKED,
    data_last_checked_at: CHECKED,
    confidence,
    review_status: "pending",
    draft,
    notes: notes ?? null,
    research_job_id: null,
    import_job_id: null,
  };
}

type VariantSpec = {
  name: string;
  slug: string;
  is_default?: boolean;
  battery_total_kwh?: number | null;
  battery_usable_kwh?: number | null;
  range_km?: number | null;
  consumption_kwh_100km?: number | null;
  dc_charging_kw?: number | null;
  charge_time_10_80_minutes?: number | null;
  drivetrain?: string | null;
  power_hp?: number | null;
  torque_nm?: number | null;
  acceleration_0_100?: number | null;
  top_speed_kmh?: number | null;
  towing_kg?: number | null;
  curb_weight_kg?: number | null;
  import_notes?: string | null;
  source: { name: string; url: string };
};

type ImageCandidate = {
  original_url: string;
  source_name: string;
  source_url: string;
  alt_text: string;
  image_type: string;
  is_primary_candidate: boolean;
  notes: string;
};

type ConflictNote = {
  field_key: string;
  message: string;
  values: Array<{ value: string | number; source_name: string; source_url: string }>;
};

type ModelBatch = {
  slug: string;
  model: string;
  body_style: string;
  vehicle_type: string;
  page: { name: string; url: string };
  primarySource: { name: string; url: string };
  car: Record<string, unknown>;
  variants: VariantSpec[];
  images: ImageCandidate[];
  conflicts: ConflictNote[];
  missingFields: string[];
  editorial: {
    description: string;
    suitable_for: string[];
    pros: string[];
    cons: string[];
    score_notes: string;
  };
};

const WARRANTY =
  "Høyvoltbatteri: opptil 8 år eller 160 000 km (det som inntreffer først) for Volvo elbiler/ladbare hybrider ifølge Volvo Cars Norge. EX60 kan ha utvidet batterigaranti (opptil 10 år / 240 000 km) under egne vilkår. Bekreft nybilgaranti og gjeldende vilkår hos forhandler før publisering.";

function draftList(...items: string[]): string[] {
  return [DRAFT, ...items];
}

function withDraft(body: string): string {
  return `${DRAFT}\n\n${body.trim()}`;
}

function scoreNotes(parts: {
  who: string;
  winter: string;
  charging: string;
  daily: string;
  longDistance: string;
}): string {
  return [
    DRAFT,
    "",
    "## Hvem bilen passer for",
    parts.who,
    "",
    "## Winter considerations",
    parts.winter,
    "",
    "## Charging experience",
    parts.charging,
    "",
    "## Daily usability",
    parts.daily,
    "",
    "## Long-distance suitability",
    parts.longDistance,
  ].join("\n");
}

function img(
  page: { name: string; url: string },
  original_url: string,
  image_type: string,
  alt: string,
  primary = false,
): ImageCandidate {
  return {
    original_url,
    source_name: page.name,
    source_url: page.url,
    alt_text: alt,
    image_type,
    is_primary_candidate: primary,
    notes:
      "Official Volvo Cars media URL found via official model page assets. Candidate only — do not auto-attach. Verify CDN access and usage rights before approve.",
  };
}

const MODELS: ModelBatch[] = [
  {
    slug: "volvo-ex30",
    model: "EX30",
    body_style: "SUV",
    vehicle_type: "Personbil",
    page: SRC.ex30Page,
    primarySource: SRC.ex30Specs,
    car: {
      length_mm: 4233,
      width_mm: 1838,
      height_mm: 1550,
      wheelbase_mm: 2650,
      cargo_l: 318,
      frunk_l: 7,
      seats: 5,
      towing_kg: null,
      top_speed_kmh: 180,
      charging_connector_ac: null,
      charging_connector_dc: null,
      heat_pump: null,
      v2l: null,
      v2g: null,
      apple_carplay: true,
      android_auto: null,
      warranty: WARRANTY,
      range_km: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      dc_charging_kw: null,
      ac_charging_kw: null,
      consumption_kwh_100km: null,
    },
    variants: [
      {
        name: "P5 Elektrisk",
        slug: "p5-elektrisk",
        is_default: true,
        battery_total_kwh: 51,
        range_km: 337,
        consumption_kwh_100km: 17.1,
        dc_charging_kw: 150,
        charge_time_10_80_minutes: 26,
        drivetrain: "Bakhjulsdrift",
        power_hp: 272,
        torque_nm: 343,
        acceleration_0_100: 5.7,
        top_speed_kmh: 180,
        towing_kg: 1400,
        curb_weight_kg: 1840,
        source: SRC.ex30Specs,
      },
      {
        name: "P5 Long Range Elektrisk",
        slug: "p5-long-range-elektrisk",
        battery_total_kwh: 69,
        range_km: 475,
        consumption_kwh_100km: 17,
        dc_charging_kw: 175,
        charge_time_10_80_minutes: 27,
        drivetrain: "Bakhjulsdrift",
        power_hp: 272,
        torque_nm: 343,
        acceleration_0_100: 5.3,
        top_speed_kmh: 180,
        towing_kg: 1600,
        curb_weight_kg: 1850,
        source: SRC.ex30Specs,
      },
      {
        name: "P8 AWD Elektrisk",
        slug: "p8-awd-elektrisk",
        battery_total_kwh: 69,
        range_km: 450,
        consumption_kwh_100km: 17.5,
        dc_charging_kw: 175,
        charge_time_10_80_minutes: 27,
        drivetrain: "Firehjulsdrift",
        power_hp: 428,
        torque_nm: 543,
        acceleration_0_100: 3.6,
        top_speed_kmh: 180,
        towing_kg: 1600,
        curb_weight_kg: 1960,
        source: SRC.ex30Specs,
      },
    ],
    images: [
      img(
        SRC.ex30Page,
        "https://wizz.volvocars.com/images/2027/416/exterior/studio/front/exterior-studio-front_F8E01D79B36C25D664D42846503C09E53C24E6B7.png",
        "front",
        "Volvo EX30 — studio front (offisiell media)",
        true,
      ),
      img(
        SRC.ex30Page,
        "https://wizz.volvocars.com/images/2027/416/exterior/studio/rear/exterior-studio-rear_E389043609B2B1D802EBF322C5DBB53AC42E783B.png",
        "rear",
        "Volvo EX30 — studio bak",
      ),
      img(
        SRC.ex30Page,
        "https://wizz.volvocars.com/images/2027/416/exterior/studio/right/exterior-studio-right_6F6CD1FDC984468B6C66F1E170524E7DBF3867C6.png",
        "side",
        "Volvo EX30 — studio side",
      ),
      img(
        SRC.ex30Page,
        "https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/bltc1ede7d0b1c955ff/694150ec1b1306a472365b21/my27ex30-hero-21-9.jpg",
        "exterior",
        "Volvo EX30 — hero (offisiell)",
      ),
    ],
    conflicts: [
      {
        field_key: "car.towing_kg",
        message: "Tilhengervekt er variantavhengig (1400 vs 1600 kg) — bilnivå tomt.",
        values: [
          { value: 1400, source_name: SRC.ex30Specs.name, source_url: SRC.ex30Specs.url },
          { value: 1600, source_name: SRC.ex30Specs.name, source_url: SRC.ex30Specs.url },
        ],
      },
    ],
    missingFields: [
      "battery_usable_kwh",
      "ac_charging_kw",
      "charging_connector_ac/dc",
      "heat_pump",
      "v2l/v2g",
      "winter_range_km",
      "price_nok",
      "approved gallery",
    ],
    editorial: {
      description: withDraft(
        `Volvo EX30 er en kompakt helelektrisk SUV solgt i Norge. Modellen tilbys med tre drivlinjer (P5, P5 Long Range og P8 AWD) med egne verdier for batteri, WLTP-rekkevidde, effekt og lading.

Tallene er hentet fra Volvo Cars Norges spesifikasjonsside. WLTP er laboratoriemål, ikke reell kjøreopplevelse. EVFAKTA har ikke testet bilen.`,
      ),
      suitable_for: ["Pendlerne", "Bybrukere", "Små familier", "Firmabilbrukere"],
      pros: draftList(
        "Kompakt SUV-format med dokumenterte dimensjoner og 5 seter",
        "Tre offisielle drivlinjer med tydelige WLTP- og batteritall",
        "Hurtiglading 10–80 % dokumentert per variant",
        "Dokumentert tilhengerkapasitet på variantnivå",
        "Frunk og bakre bagasjevolum oppgitt på spesifikasjonssiden",
      ),
      cons: draftList(
        "Kan være mindre egnet for dem som trenger stor familie-SUV",
        "Vinterrekkevidde er ikke oppgitt som egen offisiell katalogverdi",
        "Brukbar batterikapasitet er ikke oppgitt på spesifikasjonssiden",
        "Ladestandarder (kontakttyper) er ikke eksplisitt listet i spesifikasjonstabellen",
      ),
      score_notes: scoreNotes({
        who: "EX30 passer primært for bybruk, pendling og små familier som vil ha kompakt SUV.",
        winter:
          "Ingen offisiell vinterrekkevidde er lagret. Forvent lavere rekkevidde i kulde. Marketingtekst nevner forhåndskondisjonering av batteri — det er ikke det samme som vintertesttall.",
        charging:
          "DC 10–80 % og ladeeffekt er dokumentert per variant. AC er oppgitt som tid (3-fase 16A), ikke kW — derfor er ac_charging_kw tomt.",
        daily: "Kompakt størrelse, fem seter og dokumentert bagasjevolum støtter hverdagsbruk.",
        longDistance:
          "Long Range-variantene har høyere WLTP. Planlegg ladestopp ut fra faktisk forbruk, ikke WLTP alene.",
      }),
    },
  },
  {
    slug: "volvo-ex40",
    model: "EX40",
    body_style: "SUV",
    vehicle_type: "Personbil",
    page: SRC.ex40Page,
    primarySource: SRC.ex40Specs,
    car: {
      length_mm: 4440,
      width_mm: 1873,
      height_mm: 1647,
      wheelbase_mm: 2702,
      cargo_l: 410,
      frunk_l: 31,
      seats: 5,
      towing_kg: null,
      top_speed_kmh: 180,
      warranty: WARRANTY,
      apple_carplay: null,
      charging_connector_ac: null,
      charging_connector_dc: null,
      heat_pump: null,
      v2l: null,
      v2g: null,
      range_km: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      dc_charging_kw: null,
      ac_charging_kw: null,
      consumption_kwh_100km: null,
    },
    variants: [
      {
        name: "Single Motor",
        slug: "single-motor",
        is_default: true,
        battery_total_kwh: 70,
        range_km: 477,
        consumption_kwh_100km: 17.2,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 26,
        drivetrain: "Bakhjulsdrift",
        power_hp: 238,
        torque_nm: 420,
        acceleration_0_100: 7.3,
        top_speed_kmh: 180,
        towing_kg: 1500,
        curb_weight_kg: 2040,
        source: SRC.ex40Specs,
      },
      {
        name: "Single Motor Extended Range",
        slug: "single-motor-extended-range",
        battery_total_kwh: 82,
        range_km: 571,
        consumption_kwh_100km: 16.7,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 28,
        drivetrain: "Bakhjulsdrift",
        power_hp: 252,
        torque_nm: 420,
        acceleration_0_100: 7.3,
        top_speed_kmh: 180,
        towing_kg: 1500,
        curb_weight_kg: 2075,
        source: SRC.ex40Specs,
      },
      {
        name: "Twin Motor",
        slug: "twin-motor",
        battery_total_kwh: 82,
        range_km: 538,
        consumption_kwh_100km: 17.6,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 28,
        drivetrain: "Firehjulsdrift",
        power_hp: 408,
        torque_nm: 670,
        acceleration_0_100: 4.8,
        top_speed_kmh: 180,
        towing_kg: 1800,
        curb_weight_kg: 2170,
        source: SRC.ex40Specs,
      },
      {
        name: "Twin Motor Performance",
        slug: "twin-motor-performance",
        battery_total_kwh: 82,
        range_km: 537,
        consumption_kwh_100km: 17.6,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 28,
        drivetrain: "Firehjulsdrift",
        power_hp: 442,
        torque_nm: 670,
        acceleration_0_100: 4.6,
        top_speed_kmh: 180,
        towing_kg: 1800,
        curb_weight_kg: 2170,
        source: SRC.ex40Specs,
      },
    ],
    images: [
      img(
        SRC.ex40Page,
        "https://wizz.volvocars.com/images/2027/536/exterior/studio/front/exterior-studio-front_2D1B19E2A6DF4BFF448CD0635AF4AED3FA981101.png",
        "front",
        "Volvo EX40 — studio front",
        true,
      ),
      img(
        SRC.ex40Page,
        "https://wizz.volvocars.com/images/2027/536/exterior/studio/rear/exterior-studio-rear_E35B003663CAB500FB6614257A0079B4216E9A03.png",
        "rear",
        "Volvo EX40 — studio bak",
      ),
      img(
        SRC.ex40Page,
        "https://wizz.volvocars.com/images/2027/536/exterior/studio/right/exterior-studio-right_ECDAB88769B0C6C3E05B8C91369B915DF6EE119D.png",
        "side",
        "Volvo EX40 — studio side",
      ),
      img(
        SRC.ex40Page,
        "https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blta22f8381377a761e/684c33755dac7b8b0d1936e8/Interior-bento-dashboard-16x9-EX40.jpg",
        "interior",
        "Volvo EX40 — interiør",
      ),
    ],
    conflicts: [
      {
        field_key: "car.towing_kg",
        message: "Tilhengervekt 1500 kg (RWD) vs 1800 kg (AWD) — bilnivå tomt.",
        values: [
          { value: 1500, source_name: SRC.ex40Specs.name, source_url: SRC.ex40Specs.url },
          { value: 1800, source_name: SRC.ex40Specs.name, source_url: SRC.ex40Specs.url },
        ],
      },
    ],
    missingFields: [
      "battery_usable_kwh",
      "ac_charging_kw",
      "connectors",
      "heat_pump",
      "v2l/v2g",
      "winter_range_km",
      "approved gallery",
    ],
    editorial: {
      description: withDraft(
        `Volvo EX40 er en helelektrisk kompakt SUV solgt i Norge. Single Motor, Extended Range, Twin Motor og Twin Motor Performance er lagret som separate varianter med egne batteri-, WLTP- og ytelsestall.

Kilde: Volvo Cars Norge spesifikasjoner. WLTP er laboratoriemål. EVFAKTA har ikke testet bilen.`,
      ),
      suitable_for: [
        "Familier",
        "Pendlerne",
        "Langdistansesjåfører",
        "Tilhengerbrukere",
        "Firmabilbrukere",
      ],
      pros: draftList(
        "Flere offisielle drivlinjer med lange WLTP-tall på Extended Range",
        "Dokumentert frunk og bakre bagasjevolum",
        "AWD-varianter med høyere dokumentert tilhengerkapasitet",
        "DC-lading opptil 200 kW med 10–80 %-tid per variant",
        "Klare dimensjoner og akselavstand i norsk spesifikasjonsside",
      ),
      cons: draftList(
        "Kan være mindre egnet som ren kompakt bybil enn EX30",
        "Brukbar batterikapasitet mangler på spesifikasjonssiden",
        "Vinterrekkevidde er ikke oppgitt som egen katalogverdi",
        "Kontakttyper er ikke eksplisitt listet i spesifikasjonstabellen",
      ),
      score_notes: scoreNotes({
        who: "EX40 passer for familier og pendling der SUV-format og valg mellom RWD/AWD er relevant.",
        winter:
          "Ingen offisiell vinterrekkevidde. AWD kan være relevant i vinterføre, men erstatter ikke vinterdekk og realistisk planlegging.",
        charging: "DC 200 kW og 10–80 % er dokumentert. AC er kun oppgitt som ladetid, ikke kW.",
        daily: "Fem seter, frunk og bakre bagasje støtter hverdagsbruk.",
        longDistance:
          "Extended Range har høyest WLTP i denne batchen. Bruk variantverdien ved planlegging.",
      }),
    },
  },
  {
    slug: "volvo-ec40",
    model: "EC40",
    body_style: "Crossover",
    vehicle_type: "Personbil",
    page: SRC.ec40Page,
    primarySource: SRC.ec40Specs,
    car: {
      length_mm: 4440,
      width_mm: 1873,
      height_mm: 1591,
      wheelbase_mm: 2702,
      cargo_l: 404,
      frunk_l: 31,
      seats: 5,
      towing_kg: null,
      top_speed_kmh: 180,
      warranty: WARRANTY,
      charging_connector_ac: null,
      charging_connector_dc: null,
      heat_pump: null,
      v2l: null,
      v2g: null,
      range_km: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      dc_charging_kw: null,
      ac_charging_kw: null,
      consumption_kwh_100km: null,
    },
    variants: [
      {
        name: "Single Motor",
        slug: "single-motor",
        is_default: true,
        battery_total_kwh: 70,
        range_km: 486,
        consumption_kwh_100km: 16.7,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 26,
        drivetrain: "Bakhjulsdrift",
        power_hp: 238,
        torque_nm: 420,
        acceleration_0_100: 7.3,
        top_speed_kmh: 180,
        towing_kg: 1500,
        curb_weight_kg: 2065,
        source: SRC.ec40Specs,
      },
      {
        name: "Single Motor Extended Range",
        slug: "single-motor-extended-range",
        battery_total_kwh: 82,
        range_km: 581,
        consumption_kwh_100km: 16.3,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 28,
        drivetrain: "Bakhjulsdrift",
        power_hp: 252,
        torque_nm: 420,
        acceleration_0_100: 7.3,
        top_speed_kmh: 180,
        towing_kg: 1500,
        curb_weight_kg: 2095,
        source: SRC.ec40Specs,
      },
      {
        name: "Twin Motor",
        slug: "twin-motor",
        battery_total_kwh: 82,
        range_km: 550,
        consumption_kwh_100km: 17.3,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 28,
        drivetrain: "Firehjulsdrift",
        power_hp: 408,
        torque_nm: 670,
        acceleration_0_100: 4.7,
        top_speed_kmh: 180,
        towing_kg: 1800,
        curb_weight_kg: 2185,
        source: SRC.ec40Specs,
      },
      {
        name: "Twin Motor Performance",
        slug: "twin-motor-performance",
        battery_total_kwh: 82,
        range_km: 550,
        consumption_kwh_100km: 17.3,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 28,
        drivetrain: "Firehjulsdrift",
        power_hp: 442,
        torque_nm: 670,
        acceleration_0_100: 4.6,
        top_speed_kmh: 180,
        towing_kg: 1800,
        curb_weight_kg: 2185,
        source: SRC.ec40Specs,
      },
    ],
    images: [
      img(
        SRC.ec40Page,
        "https://wizz.volvocars.com/images/2026/539/exterior/studio/front/exterior-studio-front_25296E96A64E4B51554776CF6FD52B273396033E.png",
        "front",
        "Volvo EC40 — studio front",
        true,
      ),
      img(
        SRC.ec40Page,
        "https://wizz.volvocars.com/images/2026/539/exterior/studio/rear/exterior-studio-rear_E3833E47E403F6E813740B9993A37EBD20E35522.png",
        "rear",
        "Volvo EC40 — studio bak",
      ),
      img(
        SRC.ec40Page,
        "https://wizz.volvocars.com/images/2026/539/exterior/studio/right/exterior-studio-right_63D9C02D5A4148D6C2CBF051008F7634BA7CEE8D.png",
        "side",
        "Volvo EC40 — studio side",
      ),
    ],
    conflicts: [
      {
        field_key: "car.towing_kg",
        message: "Tilhengervekt 1500 vs 1800 kg avhengig av drivlinje — bilnivå tomt.",
        values: [
          { value: 1500, source_name: SRC.ec40Specs.name, source_url: SRC.ec40Specs.url },
          { value: 1800, source_name: SRC.ec40Specs.name, source_url: SRC.ec40Specs.url },
        ],
      },
    ],
    missingFields: [
      "battery_usable_kwh",
      "ac_charging_kw",
      "connectors",
      "heat_pump",
      "interior image candidate",
      "winter_range_km",
      "approved gallery",
    ],
    editorial: {
      description: withDraft(
        `Volvo EC40 er en helelektrisk crossover solgt i Norge (tidligere kjent som C40 Recharge i Volvos modellfamilie). Fire drivlinjer er dokumentert på norsk spesifikasjonsside med egne batteri-, WLTP- og ytelsestall.

WLTP er laboratoriemål. EVFAKTA har ikke testet bilen.`,
      ),
      suitable_for: ["Pendlerne", "Familier", "Firmabilbrukere", "Langdistansesjåfører"],
      pros: draftList(
        "Crossover-format med samme plattformfamilie som EX40, men lavere høyde",
        "Extended Range med høy dokumentert WLTP",
        "AWD-varianter med høyere tilhengerkapasitet",
        "DC-lading og 10–80 % dokumentert per variant",
        "Frunk og bakre bagasjevolum oppgitt",
      ),
      cons: draftList(
        "Kan være mindre egnet for dem som trenger høyere SUV-sitteposisjon",
        "Mangler dedikert interiør-kandidat i denne batchen",
        "Brukbar batterikapasitet mangler på spesifikasjonssiden",
        "Vinterrekkevidde er ikke oppgitt som egen katalogverdi",
      ),
      score_notes: scoreNotes({
        who: "EC40 passer for brukere som vil ha crossover-stil og valg mellom RWD/AWD.",
        winter: "Ingen offisiell vinterrekkevidde er lagret.",
        charging: "DC 200 kW og 10–80 % dokumentert. AC kun som ladetid.",
        daily: "Fem seter og dokumentert bagasje støtter hverdagsbruk.",
        longDistance: "Extended Range gir høyest WLTP blant EC40-variantene her.",
      }),
    },
  },
  {
    slug: "volvo-ex90",
    model: "EX90",
    body_style: "SUV",
    vehicle_type: "Personbil",
    page: SRC.ex90Page,
    primarySource: SRC.ex90Specs,
    car: {
      length_mm: 5037,
      width_mm: 1964,
      height_mm: 1744,
      wheelbase_mm: 2985,
      cargo_l: null,
      frunk_l: 46,
      seats: null,
      towing_kg: 2200,
      top_speed_kmh: 180,
      warranty: WARRANTY,
      charging_connector_ac: null,
      charging_connector_dc: null,
      heat_pump: null,
      v2l: null,
      v2g: null,
      range_km: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      dc_charging_kw: null,
      ac_charging_kw: null,
      consumption_kwh_100km: null,
    },
    variants: [
      {
        name: "Twin Motor",
        slug: "twin-motor",
        is_default: true,
        battery_total_kwh: 106,
        range_km: 617,
        consumption_kwh_100km: 19.4,
        dc_charging_kw: 350,
        charge_time_10_80_minutes: 22,
        drivetrain: "Firehjulsdrift",
        power_hp: 456,
        torque_nm: 670,
        acceleration_0_100: 5.5,
        top_speed_kmh: 180,
        towing_kg: 2200,
        curb_weight_kg: 2765,
        import_notes: "800 V system. Seats listed 6–7 on specs page — not forced to one value.",
        source: SRC.ex90Specs,
      },
      {
        name: "Twin Motor Performance",
        slug: "twin-motor-performance",
        battery_total_kwh: 106,
        range_km: 617,
        consumption_kwh_100km: 19.4,
        dc_charging_kw: 350,
        charge_time_10_80_minutes: 22,
        drivetrain: "Firehjulsdrift",
        power_hp: 680,
        torque_nm: 870,
        acceleration_0_100: 4.2,
        top_speed_kmh: 180,
        towing_kg: 2200,
        curb_weight_kg: 2765,
        import_notes: "800 V system. Seats listed 6–7 on specs page — not forced to one value.",
        source: SRC.ex90Specs,
      },
    ],
    images: [
      img(
        SRC.ex90Page,
        "https://wizz.volvocars.com/images/2026/356/exterior/studio/front/exterior-studio-front_B84CE46D0C58BB67BDF89F4305F0FF796EF0D00E.png",
        "front",
        "Volvo EX90 — studio front",
        true,
      ),
      img(
        SRC.ex90Page,
        "https://wizz.volvocars.com/images/2026/356/exterior/studio/rear/exterior-studio-rear_C643506BD6A3BE36E04C9608776EEA2A23275C23.png",
        "rear",
        "Volvo EX90 — studio bak",
      ),
      img(
        SRC.ex90Page,
        "https://wizz.volvocars.com/images/2026/356/exterior/studio/right/exterior-studio-right_36F8B3F29F8EB47F0267321543141B9E4C4BA52E.png",
        "side",
        "Volvo EX90 — studio side",
      ),
      img(
        SRC.ex90Page,
        "https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blta490e03f0ab35261/682d870418fbf41a93365f33/Interior-bento-dashboard-16x9-EX90.jpg",
        "interior",
        "Volvo EX90 — interiør",
      ),
    ],
    conflicts: [
      {
        field_key: "car.seats",
        message: "Spesifikasjonssiden oppgir 6–7 seter — bilnivå seats er tomt.",
        values: [
          { value: 6, source_name: SRC.ex90Specs.name, source_url: SRC.ex90Specs.url },
          { value: 7, source_name: SRC.ex90Specs.name, source_url: SRC.ex90Specs.url },
        ],
      },
      {
        field_key: "car.cargo_l",
        message:
          "Bagasjevolum avviker mellom 6- og 7-seters konfigurasjon (f.eks. bak 2. rad 690 vs 697 l) — bilnivå cargo tomt.",
        values: [
          { value: 690, source_name: SRC.ex90Specs.name, source_url: SRC.ex90Specs.url },
          { value: 697, source_name: SRC.ex90Specs.name, source_url: SRC.ex90Specs.url },
        ],
      },
    ],
    missingFields: [
      "seats (6–7)",
      "cargo_l (config-dependent)",
      "battery_usable_kwh",
      "ac_charging_kw",
      "connectors",
      "heat_pump",
      "winter_range_km",
      "approved gallery",
    ],
    editorial: {
      description: withDraft(
        `Volvo EX90 er en stor helelektrisk SUV solgt i Norge med 800 V-system. Twin Motor og Twin Motor Performance er dokumentert med samme nominelle batteri og WLTP, men ulik effekt.

Seteantall (6–7) og bagasjevolum er konfigurasjonsavhengig og derfor ikke tvunget inn som én bilnivåverdi. WLTP er laboratoriemål. EVFAKTA har ikke testet bilen.`,
      ),
      suitable_for: [
        "Familier",
        "Langdistansesjåfører",
        "Tilhengerbrukere",
        "Firmabilbrukere",
      ],
      pros: draftList(
        "Stor SUV med dokumentert høy tilhengerkapasitet (2200 kg)",
        "Lange WLTP-tall og 350 kW DC med 10–80 % på 22 minutter",
        "800 V-system oppgitt på spesifikasjonssiden",
        "Frunk dokumentert (46 l)",
        "To ytelsesnivåer med klare effekt-/akselerasjonstall",
      ),
      cons: draftList(
        "Kan være mindre egnet for dem som trenger kompakt bil",
        "Seteantall og bagasje må velges etter 6- eller 7-seters konfigurasjon",
        "Brukbar batterikapasitet mangler på spesifikasjonssiden",
        "Vinterrekkevidde er ikke oppgitt som egen katalogverdi",
      ),
      score_notes: scoreNotes({
        who: "EX90 passer for store familier og brukere som trenger plass og tilhengerkapasitet.",
        winter: "Ingen offisiell vinterrekkevidde. Stor bil med høyere forbruk kan merke kulde ekstra.",
        charging: "DC 350 kW og 10–80 % på 22 minutter er dokumentert for begge varianter.",
        daily: "Romslig format; praktisk egnethet avhenger av 6- vs 7-seters oppsett.",
        longDistance: "WLTP opptil 617 km gir laboratoriegrunnlag for lange turer — ikke reell rekkevidde.",
      }),
    },
  },
  {
    slug: "volvo-es90",
    model: "ES90",
    body_style: "Sedan",
    vehicle_type: "Personbil",
    page: SRC.es90Page,
    primarySource: SRC.es90Specs,
    car: {
      length_mm: 5000,
      width_mm: 1942,
      height_mm: 1549,
      wheelbase_mm: 3102,
      cargo_l: 442,
      frunk_l: 27,
      seats: 5,
      towing_kg: null,
      top_speed_kmh: 180,
      warranty: WARRANTY,
      charging_connector_ac: null,
      charging_connector_dc: null,
      heat_pump: null,
      v2l: null,
      v2g: null,
      range_km: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      dc_charging_kw: null,
      ac_charging_kw: null,
      consumption_kwh_100km: null,
    },
    variants: [
      {
        name: "Single Motor Extended Range",
        slug: "single-motor-extended-range",
        is_default: true,
        battery_total_kwh: 92,
        battery_usable_kwh: 88,
        range_km: 664,
        consumption_kwh_100km: 15.6,
        dc_charging_kw: 350,
        charge_time_10_80_minutes: 22,
        drivetrain: "Bakhjulsdrift",
        power_hp: 333,
        torque_nm: 480,
        acceleration_0_100: 6.6,
        top_speed_kmh: 180,
        towing_kg: 1600,
        curb_weight_kg: 2410,
        import_notes:
          "Usable 88 kWh from official ES90 press release; total/range/0-100 from specs page. Press listed older preliminary figures — conflict documented.",
        source: SRC.es90Specs,
      },
      {
        name: "Twin Motor",
        slug: "twin-motor",
        battery_total_kwh: 106,
        battery_usable_kwh: 102,
        range_km: 702,
        consumption_kwh_100km: 16.7,
        dc_charging_kw: 350,
        charge_time_10_80_minutes: 22,
        drivetrain: "Firehjulsdrift",
        power_hp: 456,
        torque_nm: 670,
        acceleration_0_100: 5.4,
        top_speed_kmh: 180,
        towing_kg: 2000,
        curb_weight_kg: 2610,
        import_notes: "Usable 102 kWh from official press; headline numbers from specs page.",
        source: SRC.es90Specs,
      },
      {
        name: "Twin Motor Performance",
        slug: "twin-motor-performance",
        battery_total_kwh: 106,
        battery_usable_kwh: 102,
        range_km: 702,
        consumption_kwh_100km: 16.7,
        dc_charging_kw: 350,
        charge_time_10_80_minutes: 22,
        drivetrain: "Firehjulsdrift",
        power_hp: 680,
        torque_nm: 870,
        acceleration_0_100: 4.0,
        top_speed_kmh: 180,
        towing_kg: 2000,
        curb_weight_kg: 2610,
        import_notes: "Usable 102 kWh from official press; headline numbers from specs page.",
        source: SRC.es90Specs,
      },
    ],
    images: [
      img(
        SRC.es90Page,
        "https://wizz.volvocars.com/images/2027/334/exterior/studio/front/exterior-studio-front_3E4FF4C02A8D127CB804ED89285E07695C7984B8.png",
        "front",
        "Volvo ES90 — studio front",
        true,
      ),
      img(
        SRC.es90Page,
        "https://wizz.volvocars.com/images/2027/334/exterior/studio/rear/exterior-studio-rear_1BA29770DA3B42336CE2A15C76F8F5B46803A3A9.png",
        "rear",
        "Volvo ES90 — studio bak",
      ),
      img(
        SRC.es90Page,
        "https://wizz.volvocars.com/images/2027/334/exterior/studio/right/exterior-studio-right_584AFF51A8F0B7F29515169A455923B246136A64.png",
        "side",
        "Volvo ES90 — studio side",
      ),
      img(
        SRC.es90Page,
        "https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blt0366f556c8a28cf7/696a3b021b130699343700ca/my27-es90-hero-21-9.jpg",
        "exterior",
        "Volvo ES90 — hero",
      ),
      img(
        SRC.es90Page,
        "https://wizz.volvocars.com/images/2027/334/interior/studio/rear/interior-studio-rear_2013ADE2BCF13AF54BA9BA95A2902194B431E2A5.png",
        "interior",
        "Volvo ES90 — interiør",
      ),
    ],
    conflicts: [
      {
        field_key: "variant.single-motor-extended-range.acceleration_0_100",
        message:
          "Pressemelding oppgav 6,9 s; spesifikasjonssiden oppgir 6,6 s. Specs-verdi lagret.",
        values: [
          { value: 6.9, source_name: SRC.es90Press.name, source_url: SRC.es90Press.url },
          { value: 6.6, source_name: SRC.es90Specs.name, source_url: SRC.es90Specs.url },
        ],
      },
      {
        field_key: "variant.twin-motor.power_hp",
        message:
          "Pressemelding oppgav 449 hk / 330 kW; spesifikasjonssiden oppgir 456 hk / 335 kW. Specs-verdi lagret.",
        values: [
          { value: 449, source_name: SRC.es90Press.name, source_url: SRC.es90Press.url },
          { value: 456, source_name: SRC.es90Specs.name, source_url: SRC.es90Specs.url },
        ],
      },
      {
        field_key: "car.towing_kg",
        message: "Single Motor 1600 kg vs Twin Motor 2000 kg — bilnivå tomt.",
        values: [
          { value: 1600, source_name: SRC.es90Specs.name, source_url: SRC.es90Specs.url },
          { value: 2000, source_name: SRC.es90Specs.name, source_url: SRC.es90Specs.url },
        ],
      },
    ],
    missingFields: [
      "ac_charging_kw",
      "connectors",
      "heat_pump",
      "winter_range_km",
      "approved gallery",
    ],
    editorial: {
      description: withDraft(
        `Volvo ES90 er en helelektrisk sedan/fastback solgt i Norge med 800 V-system. Single Motor Extended Range, Twin Motor og Twin Motor Performance er dokumentert på norsk spesifikasjonsside.

Der pressemelding og spesifikasjonsside avviker, er spesifikasjonssiden brukt for lagrede tall, og konflikten er dokumentert. WLTP er laboratoriemål. EVFAKTA har ikke testet bilen.`,
      ),
      suitable_for: [
        "Langdistansesjåfører",
        "Firmabilbrukere",
        "Pendlerne",
        "Familier",
      ],
      pros: draftList(
        "Lange dokumenterte WLTP-tall (opptil 702 km på Twin Motor)",
        "800 V og DC 350 kW med 10–80 % på 22 minutter",
        "Brukbar batterikapasitet dokumentert i offisiell pressemelding",
        "Fem seter med dokumentert bagasje og frunk",
        "Tydelig skille mellom RWD og AWD-varianter",
      ),
      cons: draftList(
        "Kan være mindre egnet for dem som trenger høy SUV-sitteposisjon",
        "Enkelte press-/kampanjetall avviker fra spesifikasjonssiden",
        "Vinterrekkevidde er ikke oppgitt som egen katalogverdi",
        "Kontakttyper er ikke eksplisitt listet i spesifikasjonstabellen",
      ),
      score_notes: scoreNotes({
        who: "ES90 passer for langdistanse og firmabilbruk der sedanformat og høy WLTP er ønsket.",
        winter: "Ingen offisiell vinterrekkevidde. Forhåndskondisjonering nevnes i markedsføring, ikke som testtall.",
        charging: "DC 350 kW og 22 minutter 10–80 % er dokumentert på spesifikasjonssiden.",
        daily: "Fem seter og bagasjevolum 442 l støtter hverdagsbruk for mange.",
        longDistance: "Twin Motor-varianter har høyest WLTP. Bruk variantverdien, ikke et modellgjennomsnitt.",
      }),
    },
  },
  {
    slug: "volvo-ex60",
    model: "EX60",
    body_style: "SUV",
    vehicle_type: "Personbil",
    page: SRC.ex60Page,
    primarySource: SRC.ex60Specs,
    car: {
      length_mm: 4803,
      width_mm: 1908,
      height_mm: 1635,
      wheelbase_mm: 2970,
      cargo_l: 523,
      frunk_l: 58,
      seats: 5,
      towing_kg: null,
      top_speed_kmh: 180,
      warranty: WARRANTY,
      charging_connector_ac: null,
      charging_connector_dc: null,
      heat_pump: null,
      v2l: null,
      v2g: null,
      range_km: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      dc_charging_kw: null,
      ac_charging_kw: null,
      consumption_kwh_100km: null,
    },
    variants: [
      {
        name: "P6 Elektrisk",
        slug: "p6-elektrisk",
        is_default: true,
        battery_total_kwh: 83,
        battery_usable_kwh: 80,
        range_km: 611,
        consumption_kwh_100km: 14.9,
        dc_charging_kw: 350,
        charge_time_10_80_minutes: 16,
        drivetrain: "Bakhjulsdrift",
        power_hp: 374,
        torque_nm: 480,
        acceleration_0_100: 5.9,
        top_speed_kmh: 180,
        towing_kg: 2000,
        curb_weight_kg: 2189,
        import_notes:
          "Usable 80 kWh from official EX60 press. Specs page WLTP 611 km used (press listed 620 km — conflict documented). Marketing pages note preliminary certification language.",
        source: SRC.ex60Specs,
      },
      {
        name: "P10 AWD Elektrisk",
        slug: "p10-awd-elektrisk",
        battery_total_kwh: 95,
        battery_usable_kwh: 91,
        range_km: 660,
        consumption_kwh_100km: 16.2,
        dc_charging_kw: 400,
        charge_time_10_80_minutes: 16,
        drivetrain: "Firehjulsdrift",
        power_hp: 510,
        torque_nm: 710,
        acceleration_0_100: 4.6,
        top_speed_kmh: 180,
        towing_kg: 2400,
        curb_weight_kg: 2350,
        import_notes: "Usable 91 kWh from official press; headline numbers from specs page.",
        source: SRC.ex60Specs,
      },
      {
        name: "P12 AWD Elektrisk",
        slug: "p12-awd-elektrisk",
        battery_total_kwh: 117,
        battery_usable_kwh: 112,
        range_km: 810,
        consumption_kwh_100km: 16,
        dc_charging_kw: 400,
        charge_time_10_80_minutes: 19,
        drivetrain: "Firehjulsdrift",
        power_hp: 680,
        torque_nm: 790,
        acceleration_0_100: 3.9,
        top_speed_kmh: 180,
        towing_kg: 2400,
        curb_weight_kg: 2405,
        import_notes: "Usable 112 kWh from official press; headline numbers from specs page.",
        source: SRC.ex60Specs,
      },
    ],
    images: [
      img(
        SRC.ex60Page,
        "https://wizz.volvocars.com/images/2027/516/exterior/studio/front/exterior-studio-front_4BB37BEEEC966E721B776845A09F478D63E463BF.png",
        "front",
        "Volvo EX60 — studio front",
        true,
      ),
      img(
        SRC.ex60Page,
        "https://wizz.volvocars.com/images/2027/516/exterior/studio/rear/exterior-studio-rear_5F6B7672CAD8D27CBF53E94D0912A7DA8FCEB960.png",
        "rear",
        "Volvo EX60 — studio bak",
      ),
      img(
        SRC.ex60Page,
        "https://wizz.volvocars.com/images/2027/516/exterior/studio/right/exterior-studio-right_40BAAB0C1DACBC042A400A3BB3AF20FA5A0C80E9.png",
        "side",
        "Volvo EX60 — studio side",
      ),
      img(
        SRC.ex60Page,
        "https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blt6d8dc19eee4f407c/696f3c456363b5f6d43f2ebf/overview-hero-16-9.jpg",
        "exterior",
        "Volvo EX60 — hero",
      ),
      img(
        SRC.ex60Page,
        "https://wizz.volvocars.com/images/2027/516/interior/studio/rear/interior-studio-rear_64DF91E93322D976B05939392113FAACC32AEDC1.png",
        "interior",
        "Volvo EX60 — interiør",
      ),
    ],
    conflicts: [
      {
        field_key: "variant.p6-elektrisk.range_km",
        message:
          "Pressemelding oppgav inntil 620 km for P6; spesifikasjonssiden oppgir 611 km. Specs-verdi lagret.",
        values: [
          { value: 620, source_name: SRC.ex60Press.name, source_url: SRC.ex60Press.url },
          { value: 611, source_name: SRC.ex60Specs.name, source_url: SRC.ex60Specs.url },
        ],
      },
      {
        field_key: "car.towing_kg",
        message: "P6 2000 kg vs P10/P12 2400 kg — bilnivå tomt.",
        values: [
          { value: 2000, source_name: SRC.ex60Specs.name, source_url: SRC.ex60Specs.url },
          { value: 2400, source_name: SRC.ex60Specs.name, source_url: SRC.ex60Specs.url },
        ],
      },
    ],
    missingFields: [
      "ac_charging_kw",
      "connectors",
      "heat_pump",
      "winter_range_km",
      "Cross Country variants (MY2028 noted on model page — not created)",
      "approved gallery",
    ],
    editorial: {
      description: withDraft(
        `Volvo EX60 er en helelektrisk mellomstor SUV solgt/annonisert for Norge med 800 V-system. P6, P10 AWD og P12 AWD er dokumentert på norsk spesifikasjonsside.

Modellside/markedsføring nevner at enkelte tall kan være foreløpige i påvente av endelig sertifisering. Lagrede verdier følger spesifikasjonssiden der den finnes. Cross Country er nevnt for senere modellår og er ikke opprettet som varianter her. WLTP er laboratoriemål. EVFAKTA har ikke testet bilen.`,
      ),
      suitable_for: [
        "Familier",
        "Langdistansesjåfører",
        "Tilhengerbrukere",
        "Pendlerne",
        "Firmabilbrukere",
      ],
      pros: draftList(
        "Lange dokumenterte WLTP-tall, spesielt P12 AWD",
        "Rask dokumentert DC-lading (10–80 % fra 16 minutter)",
        "Brukbar batterikapasitet dokumentert i offisiell pressemelding",
        "Høy tilhengerkapasitet på AWD-varianter",
        "Romslig bagasje og frunk oppgitt på spesifikasjonssiden",
      ),
      cons: draftList(
        "Enkelte markedsføringstall er merket som foreløpige",
        "Press og spesifikasjonsside kan avvike (P6-rekkevidde dokumentert)",
        "Cross Country er ikke lagret som egne varianter ennå",
        "Vinterrekkevidde er ikke oppgitt som egen katalogverdi",
      ),
      score_notes: scoreNotes({
        who: "EX60 passer for familier og langdistanse der mellomstor SUV og høy WLTP er ønsket.",
        winter: "Ingen offisiell vinterrekkevidde. AWD-varianter kan være relevante i vinterføre.",
        charging:
          "DC opptil 350/400 kW med korte 10–80 %-tider er dokumentert. AC kun som ladetid.",
        daily: "Fem seter, frunk og bakre bagasje støtter hverdags- og familiebruk.",
        longDistance: "P12 AWD har høyest WLTP i batchen. Bruk variantverdien ved planlegging.",
      }),
    },
  },
];

function buildFieldSources(model: ModelBatch): Record<string, FieldSrc> {
  const primary = model.primarySource;
  const out: Record<string, FieldSrc> = {};
  for (const [key, value] of Object.entries(model.car)) {
    if (value == null || value === "") continue;
    out[key] = src(primary, 0.95, `Official Volvo Cars Norge specs — ${key}`);
  }
  out.description = src(
    { name: "EVFAKTA editorial draft", url: model.page.url },
    0.55,
    DRAFT,
    true,
  );
  out.pros = src(
    { name: "EVFAKTA editorial draft", url: model.page.url },
    0.55,
    DRAFT,
    true,
  );
  out.cons = src(
    { name: "EVFAKTA editorial draft", url: model.page.url },
    0.55,
    DRAFT,
    true,
  );
  out.suitable_for = src(
    { name: "EVFAKTA editorial draft", url: model.page.url },
    0.55,
    DRAFT,
    true,
  );
  out.score_notes = src(
    { name: "EVFAKTA editorial draft", url: model.page.url },
    0.55,
    DRAFT,
    true,
  );
  out.warranty = src(SRC.batteryWarranty, 0.9, "Battery warranty text; confirm vehicle warranty locally.");
  out.body_style = src(primary, 0.85);
  out.vehicle_type = src(primary, 0.9);
  if (model.slug === "volvo-ex30") {
    out.apple_carplay = src(SRC.ex30Page, 0.85, "FAQ on EX30 model page: wireless Apple CarPlay standard.");
  }
  return out;
}

function sb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureBrand(client: SupabaseClient) {
  const { data: existing } = await client
    .from("brands")
    .select("id, name, slug")
    .eq("slug", "volvo")
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await client
    .from("brands")
    .insert({
      name: "Volvo",
      slug: "volvo",
      website_url: "https://www.volvocars.com/no/",
      country: "SE",
      is_active: true,
      description: "Volvo Cars Norge",
    })
    .select("id, name, slug")
    .single();
  if (error) throw new Error(`brand: ${error.message}`);
  return data;
}

async function upsertCar(client: SupabaseClient, brandId: string, model: ModelBatch) {
  const field_sources = buildFieldSources(model);
  const patch: Record<string, unknown> = {
    brand: "Volvo",
    brand_id: brandId,
    model: model.model,
    slug: model.slug,
    body_style: model.body_style,
    vehicle_type: model.vehicle_type,
    country: "NO",
    is_published: false,
    import_status: "needs_review",
    source_name: model.primarySource.name,
    source_url: model.primarySource.url,
    data_last_checked_at: CHECKED,
    description: model.editorial.description,
    pros: model.editorial.pros,
    cons: model.editorial.cons,
    suitable_for: model.editorial.suitable_for,
    score_notes: model.editorial.score_notes,
    import_notes: `Volvo batch 01 (${CHECKED}). Official Volvo Cars Norge specs/pages only. Variants inactive. Image candidates only. Conflicts documented in research item.`,
    field_sources,
    ...model.car,
  };

  const { data: existing } = await client
    .from("cars")
    .select("id, field_sources")
    .eq("slug", model.slug)
    .maybeSingle();

  if (existing?.id) {
    const mergedSources = {
      ...((existing.field_sources as Record<string, unknown>) ?? {}),
      ...field_sources,
    };
    const { data, error } = await client
      .from("cars")
      .update({ ...patch, field_sources: mergedSources })
      .eq("id", existing.id)
      .select("id, slug, import_status, is_published")
      .single();
    if (error) throw new Error(`${model.slug} update: ${error.message}`);
    return data;
  }

  const { data, error } = await client
    .from("cars")
    .insert(patch)
    .select("id, slug, import_status, is_published")
    .single();
  if (error) throw new Error(`${model.slug} insert: ${error.message}`);
  return data;
}

async function upsertVariants(
  client: SupabaseClient,
  carId: string,
  variants: VariantSpec[],
) {
  const results = [];
  for (let i = 0; i < variants.length; i += 1) {
    const v = variants[i];
    const row: Record<string, unknown> = {
      car_id: carId,
      name: v.name,
      slug: v.slug,
      is_default: Boolean(v.is_default) || i === 0,
      is_active: false,
      sort_order: i,
      import_status: "needs_review",
      source_name: v.source.name,
      source_url: v.source.url,
      data_last_checked_at: CHECKED,
      import_notes: v.import_notes ?? "Volvo batch 01 — needs editor review.",
      battery_total_kwh: v.battery_total_kwh ?? null,
      battery_usable_kwh: v.battery_usable_kwh ?? null,
      range_km: v.range_km ?? null,
      consumption_kwh_100km: v.consumption_kwh_100km ?? null,
      ac_charging_kw: null,
      dc_charging_kw: v.dc_charging_kw ?? null,
      charge_time_10_80_minutes: v.charge_time_10_80_minutes ?? null,
      drivetrain: v.drivetrain ?? null,
      power_hp: v.power_hp ?? null,
      torque_nm: v.torque_nm ?? null,
      acceleration_0_100: v.acceleration_0_100 ?? null,
      top_speed_kmh: v.top_speed_kmh ?? null,
      towing_kg: v.towing_kg ?? null,
      curb_weight_kg: v.curb_weight_kg ?? null,
      winter_range_km: null,
      real_world_range_km: null,
      price_nok: null,
    };

    const { data: existing } = await client
      .from("car_variants")
      .select("id")
      .eq("car_id", carId)
      .eq("slug", v.slug)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await client.from("car_variants").update(row).eq("id", existing.id);
      if (error) throw new Error(`variant ${v.slug}: ${error.message}`);
      results.push({ id: existing.id, slug: v.slug, action: "updated" });
    } else {
      const { data, error } = await client.from("car_variants").insert(row).select("id").single();
      if (error) throw new Error(`variant ${v.slug}: ${error.message}`);
      results.push({ id: data.id, slug: v.slug, action: "created" });
    }
  }
  return results;
}

async function storeImageCandidates(
  client: SupabaseClient,
  brandId: string,
  carId: string,
  model: ModelBatch,
) {
  if (!model.images.length) return { jobId: null as string | null, itemId: null as string | null, images: 0 };

  const { data: job, error: jobErr } = await client
    .from("research_jobs")
    .insert({
      brand_id: brandId,
      brand_name: "Volvo",
      model_query: model.model,
      provider_key: "structured_json",
      source_mode: "structured",
      source_name: model.primarySource.name,
      source_url: model.primarySource.url,
      status: "completed",
      progress_pct: 100,
      progress_message: "Image candidates only (not attached)",
      summary: {
        modelsFound: 1,
        fieldsFound: 0,
        conflicts: model.conflicts.length,
        warnings: 1,
        missingFields: model.missingFields.length,
        imageCandidates: model.images.length,
        applied: 0,
        rejected: 0,
        approved: 0,
      },
      options: {
        production_batch: "volvo-batch-01",
        car_id: carId,
        images_only: true,
      },
    })
    .select("id")
    .single();
  if (jobErr) throw new Error(`research job: ${jobErr.message}`);

  const { data: item, error: itemErr } = await client
    .from("research_items")
    .insert({
      job_id: job.id,
      sort_order: 0,
      slug: model.slug,
      brand: "Volvo",
      model: model.model,
      existing_car_id: carId,
      decision: "pending",
      warnings: ["Image candidates stored for editor review — not attached to car_images."],
      missing_fields: model.missingFields,
      conflicts: model.conflicts,
      proposed_car: { slug: model.slug, brand: "Volvo", model: model.model },
      proposed_variants: [],
      message: "Volvo batch 01 — official media candidates only.",
    })
    .select("id")
    .single();
  if (itemErr) throw new Error(`research item: ${itemErr.message}`);

  const { error: imgErr } = await client.from("research_image_candidates").insert(
    model.images.map((image) => ({
      item_id: item.id,
      original_url: image.original_url,
      source_name: image.source_name,
      source_url: image.source_url,
      license_note: "Official Volvo Cars website media — verify usage rights before publish.",
      usage_terms: "Do not auto-attach or auto-approve. Editor must download/approve manually.",
      alt_text: image.alt_text,
      image_type: image.image_type,
      is_primary_candidate: image.is_primary_candidate,
      status: "pending",
      notes: image.notes,
    })),
  );
  if (imgErr) throw new Error(`image candidates: ${imgErr.message}`);

  return { jobId: job.id as string, itemId: item.id as string, images: model.images.length };
}

function completionPct(model: ModelBatch): number {
  const checks = [
    model.car.length_mm != null,
    model.car.width_mm != null,
    model.car.height_mm != null,
    model.car.wheelbase_mm != null,
    model.car.seats != null || model.slug === "volvo-ex90",
    model.car.warranty != null,
    model.variants.length > 0,
    model.variants.every((v) => v.range_km != null && v.battery_total_kwh != null),
    model.editorial.description.includes(DRAFT),
    model.editorial.pros.length > 1,
    model.editorial.cons.length > 1,
    model.images.length > 0,
    true,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function main() {
  const client = sb();
  const brand = await ensureBrand(client);
  const results: Array<{
    model: ModelBatch;
    carId: string;
    variants: Array<{ slug: string; action: string }>;
    images: { jobId: string | null; itemId: string | null; images: number };
    status: ProductionStatus;
    completion: ReturnType<typeof computeEditorialCompletion>;
  }> = [];

  for (const model of MODELS) {
    console.log("Processing", model.slug);
    const car = await upsertCar(client, brand.id as string, model);
    if (car.is_published) throw new Error(`${model.slug} published unexpectedly`);
    if (car.import_status !== "needs_review") {
      throw new Error(`${model.slug} unexpected import_status ${car.import_status}`);
    }

    const variants = await upsertVariants(client, car.id as string, model.variants);
    const images = await storeImageCandidates(client, brand.id as string, car.id as string, model);

    const { data: carRow } = await client.from("cars").select("*").eq("id", car.id).single();
    const { data: variantRows } = await client
      .from("car_variants")
      .select("*")
      .eq("car_id", car.id);
    const completion = computeEditorialCompletion({
      car: carRow as AdminCar,
      images: [] as CarImageRow[],
      variants: (variantRows ?? []) as AdminCarVariant[],
    });
    const status = deriveProductionStatus({
      car: carRow as AdminCar,
      images: [],
      variants: (variantRows ?? []) as AdminCarVariant[],
      imageCandidateCount: images.images,
    });

    results.push({
      model,
      carId: car.id as string,
      variants,
      images,
      status,
      completion,
    });
    console.log(" ->", car.id, status, "variants", variants.length, "images", images.images);
  }

  // Safety: force unpublished / needs_review
  for (const row of results) {
    await client
      .from("cars")
      .update({ is_published: false, import_status: "needs_review" })
      .eq("id", row.carId);
  }

  const audit = {
    batch: "catalog-batch-03-volvo",
    checked_at: CHECKED,
    source_name: "Volvo Cars Norge — offisielle spesifikasjonssider",
    notes:
      "Only officially documented values. Editorial drafts marked Draft – Requires editor review. Never publish from this batch.",
    cars: results.map((r) => ({
      slug: r.model.slug,
      model: r.model.model,
      car_id: r.carId,
      status: r.status,
      completion_pct: completionPct(r.model),
      variants: r.model.variants.map((v) => v.slug),
      image_candidates: r.images.images,
      conflicts: r.model.conflicts,
      missing_fields: r.model.missingFields,
    })),
  };
  writeFileSync(JSON_PATH, JSON.stringify(audit, null, 2) + "\n");

  const lines: string[] = [];
  lines.push("# Volvo batch 01");
  lines.push("");
  lines.push(`**Date checked:** ${CHECKED}`);
  lines.push("**Brand:** Volvo");
  lines.push("**Rule:** Official Volvo Cars Norge sources only. Never invent. Never auto-publish.");
  lines.push("**Images:** candidates only — not attached, not approved");
  lines.push(`**Apply script:** \`scripts/apply-volvo-batch-01.ts\``);
  lines.push(`**Batch JSON:** \`data/catalog-batch-03-volvo.json\``);
  lines.push("");
  lines.push("## Models processed");
  lines.push("");
  lines.push("| Model | Slug | Car id | Variants | Completion % | Final status |");
  lines.push("|-------|------|--------|----------|--------------|--------------|");
  for (const r of results) {
    lines.push(
      `| ${r.model.model} | \`${r.model.slug}\` | \`${r.carId}\` | ${r.model.variants.length} | ${completionPct(r.model)}% | **${r.status}** |`,
    );
  }
  lines.push("");
  lines.push("## Sources");
  lines.push("");
  for (const [key, value] of Object.entries(SRC)) {
    lines.push(`- **${key}:** ${value.name} — ${value.url}`);
  }
  lines.push("");
  lines.push("## Per model");
  lines.push("");

  for (const r of results) {
    const m = r.model;
    const why =
      r.status === "READY_FOR_HUMAN_APPROVAL"
        ? "Official Norge specs mapped to variants; sources + last-checked set; editorial drafts complete with draft marker; image candidates stored; remains unpublished / needs_review."
        : "Missing required production signals for ready status.";
    lines.push(`### ${m.model} (\`${m.slug}\`) — **${r.status}**`);
    lines.push("");
    lines.push(`- **Car id:** \`${r.carId}\``);
    lines.push(`- **import_status:** \`needs_review\``);
    lines.push(`- **is_published:** \`false\``);
    lines.push(`- **Primary source:** ${m.primarySource.name}`);
    lines.push(`- **Completion %:** ${completionPct(m)}%`);
    lines.push(`- **Editorial helper %:** ${r.completion.percent}%`);
    lines.push(`- **Why ${r.status}:** ${why}`);
    lines.push(`- **Admin:** [/admin/biler/${r.carId}/rediger](/admin/biler/${r.carId}/rediger)`);
    lines.push(
      `- **Variants admin:** [/admin/biler/${r.carId}/varianter](/admin/biler/${r.carId}/varianter)`,
    );
    lines.push(`- **Public (unpublished until publish):** [/modeller/${m.slug}](/modeller/${m.slug})`);
    if (r.images.jobId) {
      lines.push(
        `- **Research images job:** [/admin/import/research/${r.images.jobId}](/admin/import/research/${r.images.jobId})`,
      );
    }
    lines.push("");
    lines.push("#### Variants");
    lines.push("");
    lines.push("| Variant | Slug | Battery total/usable | WLTP | Power | DC | 10–80 | Towing |");
    lines.push("|---------|------|----------------------|------|-------|----|-------|--------|");
    for (const v of m.variants) {
      lines.push(
        `| ${v.name} | \`${v.slug}\` | ${v.battery_total_kwh ?? "—"} / ${v.battery_usable_kwh ?? "—"} | ${v.range_km ?? "—"} | ${v.power_hp ?? "—"} | ${v.dc_charging_kw ?? "—"} | ${v.charge_time_10_80_minutes ?? "—"} | ${v.towing_kg ?? "—"} |`,
      );
    }
    lines.push("");
    lines.push("#### Missing fields");
    lines.push("");
    for (const f of m.missingFields) lines.push(`- ${f}`);
    lines.push("");
    lines.push("#### Conflicts");
    lines.push("");
    if (!m.conflicts.length) lines.push("_None_");
    for (const c of m.conflicts) {
      lines.push(`- **${c.field_key}:** ${c.message}`);
      for (const val of c.values) {
        lines.push(`  - \`${val.value}\` — ${val.source_name}`);
      }
    }
    lines.push("");
    lines.push("#### Image candidates (pending)");
    lines.push("");
    for (const image of m.images) {
      lines.push(`- \`${image.image_type}\`: ${image.original_url}`);
    }
    lines.push("");
    lines.push("#### Editorial");
    lines.push("");
    lines.push(
      "Drafts present for introduction, who-for, pros/cons, winter, charging, daily use, long-distance — marked **Draft – Requires editor review.**",
    );
    lines.push("");
  }

  lines.push("## Publication readiness");
  lines.push("");
  lines.push("| Check | Notes |");
  lines.push("|-------|-------|");
  lines.push("| Official source | Pass for all six models (Volvo Cars Norge specs) |");
  lines.push("| Images (approved gallery) | Fail — candidates only |");
  lines.push("| Variants | Pass — official trims only |");
  lines.push("| Specifications | Pass — sourced / variant-split; empties left null |");
  lines.push("| Editorial | Pass as drafts (marker retained) |");
  lines.push("| Review / Approval / Publication | Not performed |");
  lines.push("");
  lines.push("## Human actions next");
  lines.push("");
  lines.push("1. Open each model in Car Editor / Production dashboard");
  lines.push("2. Rewrite drafts; remove draft markers");
  lines.push("3. Resolve documented conflicts with explicit editor decisions");
  lines.push("4. Verify CDN image access/rights; attach and approve gallery");
  lines.push("5. Confirm connectors/heat pump if found in manuals");
  lines.push("6. Approve manually, then publish manually — never automatic");
  lines.push("");
  lines.push("## Safety confirmation");
  lines.push("");
  lines.push("- No model published");
  lines.push("- No automatic approval");
  lines.push("- No image auto-attach");
  lines.push("- No commit/push by this script");
  lines.push("");

  writeFileSync(REPORT_PATH, lines.join("\n"));
  console.log("Wrote", REPORT_PATH);
  console.log("Wrote", JSON_PATH);
  console.log(
    "Statuses:",
    results.map((r) => `${r.model.model}=${r.status}`).join(", "),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
