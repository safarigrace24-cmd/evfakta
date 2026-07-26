/**
 * Volkswagen production batch 01 — ID.3, ID.4, ID.5, ID.7, ID. Buzz.
 * Official Volkswagen Norge sources only. Never publishes.
 *
 * Usage: npx tsx scripts/apply-volkswagen-batch-01.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { EDITORIAL_DRAFT_MARKER } from "../lib/admin/editorial-assist-core";
import { computeEditorialCompletion } from "../lib/admin/editorial-completion";
import type { AdminCar } from "../lib/admin/types";

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

const CHECKED = "2026-07-26T10:00:00.000Z";
const REPORT_PATH = resolve(process.cwd(), "docs/VOLKSWAGEN_BATCH_01.md");
const JSON_PATH = resolve(process.cwd(), "data/catalog-batch-02-volkswagen.json");

const SRC = {
  id3Pdf: {
    name: "Volkswagen Norge — Tekniske data ID.3 (Desember 2025)",
    url: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-3/tekniske_data_id3.pdf",
  },
  id3Page: {
    name: "Volkswagen Norge — ID.3 modellside",
    url: "https://www.volkswagen.no/no/alle-bilmodeller/id3.html",
  },
  id4Pdf: {
    name: "Volkswagen Norge — Tekniske data ID.4 (Mai 2026)",
    url: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-4/tekniske_data_id4.pdf",
  },
  id4Page: {
    name: "Volkswagen Norge — ID.4 modellside",
    url: "https://www.volkswagen.no/no/alle-bilmodeller/id4.html",
  },
  id7Pdf: {
    name: "Volkswagen Norge — Tekniske data ID.7 (April 2026)",
    url: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/tekniske-data-id7.pdf",
  },
  id7Page: {
    name: "Volkswagen Norge — ID.7 modellside",
    url: "https://www.volkswagen.no/no/alle-bilmodeller/id7.html",
  },
  buzzPdf: {
    name: "Volkswagen Norge — ID. Buzz prisliste/tekniske data",
    url: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz.pdf",
  },
  buzzGtxPdf: {
    name: "Volkswagen Norge — ID. Buzz GTX prisliste/tekniske data",
    url: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz-gtx.pdf",
  },
  buzzPage: {
    name: "Volkswagen Norge — ID. Buzz modellside",
    url: "https://www.volkswagen.no/no/alle-bilmodeller/id-buzz.html",
  },
  prisliste: {
    name: "Volkswagen Norge — Prislister",
    url: "https://www.volkswagen.no/no/kjope-bil/prisliste.html",
  },
  warranty: {
    name: "Volkswagen Norge — Tekniske data (garantiavsnitt)",
    url: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-3/tekniske_data_id3.pdf",
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
  trim_level?: string | null;
  is_default?: boolean;
  battery_total_kwh?: number | null;
  battery_usable_kwh?: number | null;
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
  entity_type: "car" | "variant";
  variant_slug?: string;
  message: string;
  values: Array<{
    value: string | number | boolean;
    source_name: string;
    source_url: string;
    confidence: number;
  }>;
};

type ModelBatch = {
  slug: string;
  model: string;
  body_style: string | null;
  vehicle_type: string;
  page: { name: string; url: string };
  primarySource: { name: string; url: string };
  car: Record<string, unknown>;
  fieldNotes: Record<string, string>;
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
  "2 års nybilgaranti uten kilometerbegrensning. Norgesgaranti 5 år / 100 000 km (det som først inntreffer) for biler importert av Harald A. Møller AS registrert fra 01.01.2011. Batteripakke: 8 år / 160 000 km (det som først inntreffer). Bekreft gjeldende vilkår hos forhandler før publisering.";

function draftList(...items: string[]): string[] {
  return [EDITORIAL_DRAFT_MARKER, ...items];
}

function editorialBlock(parts: {
  intro: string[];
  winter: string;
  charging: string;
  daily: string;
}): ModelBatch["editorial"]["score_notes"] {
  return [
    EDITORIAL_DRAFT_MARKER,
    "",
    "## Winter considerations",
    parts.winter,
    "",
    "## Charging experience",
    parts.charging,
    "",
    "## Daily usability",
    parts.daily,
  ].join("\n");
}

const MODELS: ModelBatch[] = [
  {
    slug: "volkswagen-id-3",
    model: "ID.3",
    body_style: "Kompakt hatchback",
    vehicle_type: "Personbil",
    page: SRC.id3Page,
    primarySource: SRC.id3Pdf,
    car: {
      length_mm: 4264,
      width_mm: 1809,
      height_mm: 1564,
      wheelbase_mm: 2770,
      cargo_l: 385,
      seats: 5,
      towing_kg: null,
      heat_pump: null,
      v2l: null,
      charging_connector_ac: "Type 2",
      charging_connector_dc: "CCS2",
      battery_chemistry: "Lithium Ion",
      warranty: WARRANTY,
      apple_carplay: true,
      android_auto: true,
      // Variant-specific left empty on car
      range_km: null,
      battery_kwh: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      top_speed_kmh: null,
      dc_charging_kw: null,
      ac_charging_kw: null,
      charge_time_10_80_minutes: null,
      consumption_kwh_100km: null,
      curb_weight_kg: null,
      drivetrain: "Bakhjulstrekk",
      price_nok: null,
    },
    fieldNotes: {
      length_mm: "Norsk måltabell: 4264 mm. Tysk dimensjonsskisse i samme PDF viser 4261 mm min — se konflikt.",
      cargo_l: "Bagasjeromsvolum seterygg oppe 385 l; nedfelt 1267 l (ikke lagret som eget felt).",
      towing_kg: "PDF: Tilhenger ikke mulig — felt tomt (ikke 0) for å unngå misvisende «0 kg»-tolkning.",
      heat_pump: "Varmepumpe er ekstrautstyr på Pure Businessline, standard på Pro/Pro S/GTX — bilnivå tomt.",
      apple_carplay: "Dokumentert som App Connect trådløs speiling av smarttelefon.",
      android_auto: "Dokumentert som App Connect trådløs speiling av smarttelefon.",
      drivetrain: "Alle dokumenterte ID.3-varianter i PDF er bakhjulstrekk.",
    },
    variants: [
      {
        name: "Pure Businessline",
        slug: "pure-businessline",
        trim_level: "Pure Businessline",
        is_default: true,
        power_hp: 170,
        torque_nm: 310,
        battery_total_kwh: 58,
        battery_usable_kwh: 52,
        range_km: 387,
        consumption_kwh_100km: 15.3,
        ac_charging_kw: 7.2,
        dc_charging_kw: 145,
        charge_time_10_80_minutes: 25,
        acceleration_0_100: 8.2,
        top_speed_kmh: 160,
        curb_weight_kg: 1787,
        drivetrain: "Bakhjulstrekk",
        towing_kg: null,
        source: SRC.id3Pdf,
        import_notes: "AC 11 kW ikke tilgjengelig på Pure ifølge PDF. Tilhenger ikke mulig.",
      },
      {
        name: "Pro Highline",
        slug: "pro-highline",
        trim_level: "Pro Highline",
        power_hp: 204,
        torque_nm: 310,
        battery_total_kwh: 62,
        battery_usable_kwh: 59,
        range_km: 430,
        consumption_kwh_100km: 15.4,
        ac_charging_kw: 11,
        dc_charging_kw: 165,
        charge_time_10_80_minutes: 24,
        acceleration_0_100: 7.6,
        top_speed_kmh: 160,
        curb_weight_kg: 1822,
        drivetrain: "Bakhjulstrekk",
        source: SRC.id3Pdf,
      },
      {
        name: "Pro S Highline",
        slug: "pro-s-highline",
        trim_level: "Pro S Highline",
        power_hp: 204,
        torque_nm: 310,
        battery_total_kwh: 84,
        battery_usable_kwh: 79,
        range_km: 561,
        consumption_kwh_100km: 15.8,
        ac_charging_kw: 11,
        dc_charging_kw: 185,
        charge_time_10_80_minutes: 26,
        acceleration_0_100: 8.2,
        top_speed_kmh: 160,
        curb_weight_kg: 1957,
        drivetrain: "Bakhjulstrekk",
        source: SRC.id3Pdf,
      },
      {
        name: "GTX Performance FIRE+ICE",
        slug: "gtx-performance-fire-ice",
        trim_level: "GTX Performance FIRE+ICE",
        power_hp: 326,
        torque_nm: 545,
        battery_total_kwh: 84,
        battery_usable_kwh: 79,
        range_km: 586,
        consumption_kwh_100km: 15.0,
        ac_charging_kw: 11,
        dc_charging_kw: 185,
        charge_time_10_80_minutes: 26,
        acceleration_0_100: 5.7,
        top_speed_kmh: 200,
        curb_weight_kg: 1993,
        drivetrain: "Bakhjulstrekk",
        source: SRC.id3Pdf,
      },
    ],
    images: [
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/exterior/IN0276-ID3-exterior-front-stage.jpg",
        source_name: SRC.id3Page.name,
        source_url: SRC.id3Page.url,
        alt_text: "Volkswagen ID.3 — offisielt eksteriørbilde (VW Norge)",
        image_type: "exterior",
        is_primary_candidate: true,
        notes: "Candidate only — not attached, not approved.",
      },
    ],
    conflicts: [
      {
        field_key: "length_mm",
        entity_type: "car",
        message: "Norsk måltabell vs tysk dimensjonsskisse i samme tekniske PDF.",
        values: [
          {
            value: 4264,
            source_name: SRC.id3Pdf.name,
            source_url: SRC.id3Pdf.url,
            confidence: 0.95,
          },
          {
            value: 4261,
            source_name: SRC.id3Pdf.name + " (tysk skisse)",
            source_url: SRC.id3Pdf.url,
            confidence: 0.7,
          },
        ],
      },
      {
        field_key: "range_km",
        entity_type: "car",
        message:
          "Modellside markedsfører «inntil 430 km», mens teknisk PDF har Pro S/GTX inntil 561/586 km. Variantverdier fra PDF er brukt; bilnivå range tomt.",
        values: [
          {
            value: 430,
            source_name: SRC.id3Page.name,
            source_url: SRC.id3Page.url,
            confidence: 0.7,
          },
          {
            value: 586,
            source_name: SRC.id3Pdf.name,
            source_url: SRC.id3Pdf.url,
            confidence: 0.95,
          },
        ],
      },
    ],
    missingFields: [
      "price_nok (fra-priser finnes på prisliste, ikke lagret som enkeltpris)",
      "winter_range_km",
      "real_world_range_km",
      "frunk_l",
      "gross_weight_kg (variantavhengig — kun egenvekt lagret på varianter)",
      "heat_pump (variantavhengig)",
      "v2l",
      "primary approved image",
    ],
    editorial: {
      description: [
        EDITORIAL_DRAFT_MARKER,
        "",
        "Volkswagen ID.3 er en kompakt helelektrisk hatchback solgt i Norge via Volkswagen-forhandlere. Offisiell teknisk PDF (desember 2025) dokumenterer fire drivlinje-/utstyrsvarianter fra Pure Businessline til GTX Performance FIRE+ICE.",
        "",
        "Delte mål i PDF: lengde 4264 mm, bredde 1809 mm, høyde 1564 mm, akselavstand 2770 mm, bagasje 385 liter (1267 liter med nedfelt baksete). Tilhenger er ikke mulig ifølge PDF. Batteri, WLTP-rekkevidde, ladeeffekt og ytelse varierer per variant og ligger på variantnivå.",
        "",
        "Modellside markedsfører «inntil 430 km» samtidig som PDF oppgir høyere WLTP for Pro S/GTX — ikke blandet inn på bilnivå. Alle tall krever redaksjonell bekreftelse før publisering.",
      ].join("\n"),
      suitable_for: draftList(
        "Kompakt by- og pendlerbruk",
        "Små familier (5 seter)",
        "Brukere uten tilhengerbehov (tilhenger ikke mulig ifølge PDF)",
        "Langtur når Pro S/GTX-rekkevidde er bekreftet",
      ),
      pros: draftList(
        "Offisielt dokumentert bagasjevolum 385–1267 liter",
        "Flere batteristørrelser (52–79 kWh netto) i samme modellfamilie",
        "DC-lading dokumentert opptil 185 kW på Pro S/GTX",
        "App Connect trådløs speiling dokumentert",
      ),
      cons: draftList(
        "Tilhenger ikke mulig ifølge teknisk PDF",
        "Taklast ikke mulig ifølge teknisk PDF",
        "Varmepumpe er ikke standard på Pure Businessline",
        "Markedsført rekkevidde på modellside avviker fra høyeste PDF-varianter",
      ),
      score_notes: editorialBlock({
        intro: [],
        winter:
          "PDF beskriver varmepumpesystem med aktiv batterioppvarming/-kjøling for mindre rekkeviddetap ved −15 °C til 10 °C — standard på Pro/Pro S/GTX, ekstrautstyr på Pure. Ingen offisiell vinterrekkevidde (km) er oppgitt. Ikke finn opp vintertall.",
        charging:
          "AC 7,2 kW (Pure) eller 11 kW (Pro/Pro S/GTX). DC 145 / 165 / 185 kW avhengig av variant; 10–80 % fra 24–26 minutter i PDF. CCS Type 2. Ladeeffekt er maksimaltall og faller typisk over 80 % SOC.",
        daily:
          "Kompakt format (ca. 4,26 m) med 5 seter og 385 l bagasje. Snudiameter 10,3 m. Egnet som hverdagsbil der tilhenger/taklast ikke trengs.",
      }),
    },
  },
  {
    slug: "volkswagen-id-4",
    model: "ID.4",
    body_style: "SUV",
    vehicle_type: "Personbil",
    page: SRC.id4Page,
    primarySource: SRC.id4Pdf,
    car: {
      length_mm: 4584,
      width_mm: 1852,
      height_mm: 1619,
      wheelbase_mm: 2771,
      cargo_l: 543,
      seats: 5,
      towing_kg: 1800,
      heat_pump: true,
      v2l: true,
      charging_connector_ac: "Type 2",
      charging_connector_dc: "CCS2",
      battery_chemistry: "Litium-ion",
      warranty: WARRANTY,
      apple_carplay: true,
      android_auto: true,
      drivetrain: "Firehjulstrekk",
      range_km: null,
      battery_kwh: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      top_speed_kmh: null,
      dc_charging_kw: null,
      ac_charging_kw: 11,
      charge_time_10_80_minutes: null,
      consumption_kwh_100km: null,
      curb_weight_kg: null,
      price_nok: null,
    },
    fieldNotes: {
      length_mm: "Pro 4MOTION 4584 mm; GTX 4582 mm — bilnivå bruker Pro-mål, GTX notert i konflikt.",
      height_mm: "Høyde med takreling 1619 mm.",
      cargo_l: "543 l / 1575 l nedfelt — felles i PDF for Pro og GTX.",
      towing_kg: "Med brems 1800 kg; uten brems 750 kg. Lagrer med-brems-verdien; se konflikt.",
      heat_pump: "Standard på alle fire utstyrskolonner i PDF.",
      v2l: "PDF: Forberedelse for V2L (Vehicle to load) som standardutstyr.",
      torque_nm: "PDF oppgir 134 Nm foran / 560 Nm bak — ikke lagret som enkeltfelt.",
      ac_charging_kw: "11 kW AC standard på dokumenterte varianter.",
    },
    variants: [
      {
        name: "Pro 4MOTION",
        slug: "pro-4motion",
        trim_level: "Pro 4MOTION",
        is_default: true,
        power_hp: 299,
        battery_total_kwh: 82,
        battery_usable_kwh: 77,
        range_km: 554,
        consumption_kwh_100km: 16.2,
        ac_charging_kw: 11,
        dc_charging_kw: 165,
        charge_time_10_80_minutes: 29,
        acceleration_0_100: 6.1,
        top_speed_kmh: 180,
        curb_weight_kg: 2219,
        towing_kg: 1800,
        drivetrain: "Firehjulstrekk",
        source: SRC.id4Pdf,
        import_notes:
          "Effekt «inntil» 299 hk / 220 kW (UN-GTR.21). Businessline/Highline/Exclusive er utstyrsnivåer på samme drivlinje i PDF.",
      },
      {
        name: "GTX 4MOTION Exclusive",
        slug: "gtx-4motion-exclusive",
        trim_level: "GTX 4MOTION Exclusive",
        power_hp: 340,
        battery_total_kwh: 84,
        battery_usable_kwh: 77,
        range_km: 524,
        consumption_kwh_100km: 16.8,
        ac_charging_kw: 11,
        dc_charging_kw: 185,
        charge_time_10_80_minutes: 27,
        acceleration_0_100: 5.4,
        top_speed_kmh: 180,
        curb_weight_kg: 2233,
        towing_kg: 1800,
        drivetrain: "Firehjulstrekk",
        source: SRC.id4Pdf,
        import_notes: "Effekt «inntil» 340 hk / 250 kW. Lengde 4582 mm (2 mm kortere enn Pro).",
      },
    ],
    images: [
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-4/bjarne/16_9_2M3A0972.jpg",
        source_name: SRC.id4Page.name,
        source_url: SRC.id4Page.url,
        alt_text: "Volkswagen ID.4 — offisielt bilde (VW Norge)",
        image_type: "exterior",
        is_primary_candidate: true,
        notes: "Candidate only — not attached, not approved.",
      },
    ],
    conflicts: [
      {
        field_key: "length_mm",
        entity_type: "car",
        message: "Pro 4MOTION 4584 mm vs GTX 4MOTION 4582 mm.",
        values: [
          {
            value: 4584,
            source_name: SRC.id4Pdf.name,
            source_url: SRC.id4Pdf.url,
            confidence: 0.95,
          },
          {
            value: 4582,
            source_name: SRC.id4Pdf.name,
            source_url: SRC.id4Pdf.url,
            confidence: 0.95,
          },
        ],
      },
      {
        field_key: "towing_kg",
        entity_type: "car",
        message: "To offisielle tilhengertall (med/uten brems).",
        values: [
          {
            value: 1800,
            source_name: SRC.id4Pdf.name,
            source_url: SRC.id4Pdf.url,
            confidence: 0.95,
          },
          {
            value: 750,
            source_name: SRC.id4Pdf.name,
            source_url: SRC.id4Pdf.url,
            confidence: 0.95,
          },
        ],
      },
      {
        field_key: "torque_nm",
        entity_type: "car",
        message: "PDF oppgir separate dreiemoment for for- og bakaksel — ikke én katalogverdi.",
        values: [
          {
            value: 134,
            source_name: SRC.id4Pdf.name,
            source_url: SRC.id4Pdf.url,
            confidence: 0.95,
          },
          {
            value: 560,
            source_name: SRC.id4Pdf.name,
            source_url: SRC.id4Pdf.url,
            confidence: 0.95,
          },
        ],
      },
    ],
    missingFields: [
      "price_nok",
      "winter_range_km",
      "real_world_range_km",
      "frunk_l",
      "torque_nm (todelt foran/bak)",
      "separate RWD Pro uten 4MOTION (ikke i denne PDF-tabellen)",
      "primary approved image",
    ],
    editorial: {
      description: [
        EDITORIAL_DRAFT_MARKER,
        "",
        "Volkswagen ID.4 er en helelektrisk familie-SUV solgt i Norge. Gjeldende teknisk PDF (mai 2026) dokumenterer Pro 4MOTION og GTX 4MOTION med firehjulstrekk, inntil 1800 kg tilhengervekt med brems, og bagasje 543–1575 liter.",
        "",
        "Delte mål: lengde ca. 4584 mm (GTX 4582), bredde 1852 mm, høyde med takreling 1619 mm, akselavstand ca. 2771 mm. Varmepumpe og V2L-forberedelse er oppgitt som standard. Batteri, WLTP og DC-effekt ligger på variantnivå.",
        "",
        "Dreiemoment er oppgitt som 134 Nm foran / 560 Nm bak og er derfor ikke lagret som ett tall. Rediger før publisering.",
      ].join("\n"),
      suitable_for: draftList(
        "Familie-SUV med 5 seter",
        "Brukere som trenger tilhengerkapasitet (inntil 1800 kg med brems)",
        "Vinterbruk med dokumentert varmepumpe (uten offisielt vinter-km-tall)",
        "Lengre turer når variantens WLTP er bekreftet",
      ),
      pros: draftList(
        "Offisielt inntil 1800 kg tilhengervekt med brems",
        "WLTP inntil 554 km på Pro 4MOTION (PDF)",
        "Varmepumpe standard",
        "V2L-forberedelse dokumentert",
      ),
      cons: draftList(
        "Dreiemoment kan ikke lagres som én verdi (foran/bak)",
        "Lengde avviker 2 mm mellom Pro og GTX",
        "Ingen offisiell vinterrekkevidde i PDF",
        "Utstyrsnivåene Businessline/Highline/Exclusive deler drivlinje — ikke egne batterivariater",
      ),
      score_notes: editorialBlock({
        intro: [],
        winter:
          "Varmepumpe med aktiv batterioppvarming/-kjøling er standard. PDF nevner mindre rekkeviddetap ved −15 °C til 10 °C, men oppgir ikke vinterrekkevidde i km. Firehjulstrekk kan være relevant i norsk vinter — uten å oversette til km-tall.",
        charging:
          "AC 11 kW. DC 165 kW (Pro, 10–80 % 29 min) eller 185 kW (GTX, 27 min). CCS. Forberedelse for V2L. Verdiene er maksimaltall.",
        daily:
          "SUV-format med 543 l bagasje (1575 l nedfelt), 5 seter, taklast 75 kg og tilhengerfeste som ekstrautstyr (svingbart). Egnet til familie og hverdagslogistikk.",
      }),
    },
  },
  {
    slug: "volkswagen-id-5",
    model: "ID.5",
    body_style: "Coupé-SUV",
    vehicle_type: "Personbil",
    page: SRC.prisliste,
    primarySource: SRC.prisliste,
    car: {
      length_mm: null,
      width_mm: null,
      height_mm: null,
      wheelbase_mm: null,
      cargo_l: null,
      seats: null,
      towing_kg: null,
      heat_pump: null,
      v2l: null,
      charging_connector_ac: null,
      charging_connector_dc: null,
      battery_chemistry: null,
      warranty: WARRANTY,
      apple_carplay: null,
      android_auto: null,
      drivetrain: null,
      range_km: null,
      battery_kwh: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      top_speed_kmh: null,
      dc_charging_kw: null,
      ac_charging_kw: null,
      charge_time_10_80_minutes: null,
      consumption_kwh_100km: null,
      curb_weight_kg: null,
      price_nok: null,
    },
    fieldNotes: {
      warranty: "Generell VW Norge-garanti fra ID.-tekniske PDF-er; bekreft for ID.5 når modell er tilbake i sortiment.",
    },
    variants: [],
    images: [],
    conflicts: [],
    missingFields: [
      "Alle tekniske felt — ingen gjeldende ID.5 tekniske-data-PDF på volkswagen.no/prisliste (2026-07-26)",
      "Modellside /alle-bilmodeller/id5.html redirecter til modelliste",
      "variants",
      "official image candidates on active NO model page",
      "price_nok",
    ],
    editorial: {
      description: [
        EDITORIAL_DRAFT_MARKER,
        "",
        "Volkswagen ID.5 er planlagt i EVFAKTA-katalogen som coupé-SUV i ID.-familien. Per 2026-07-26 finnes ingen aktiv ID.5-modellside eller tekniske-data-PDF på Volkswagen Norges prisliste (id5.html redirecter til modellisten).",
        "",
        "Det finnes historisk tilbehørs-PDF for ID.5 og omtale av tilhengervekt i VW-magasin, men dette brukes ikke til å fylle spesifikasjoner. Skallet er tomt med vilje — ingen gjetting.",
        "",
        "Fylles først når Volkswagen Norge publiserer gjeldende tekniske data for ID.5.",
      ].join("\n"),
      suitable_for: draftList(
        "Ukjent — avvent offisiell norsk produktdata",
      ),
      pros: draftList(
        "Ingen styrker kan dokumenteres uten gjeldende teknisk kilde",
      ),
      cons: draftList(
        "Ingen aktiv offisiell teknisk PDF på Volkswagen Norge i denne batchen",
        "Modellside utilgjengelig (redirect)",
        "Alle spesifikasjoner mangler",
      ),
      score_notes: editorialBlock({
        intro: [],
        winter: "Ikke dokumentert for ID.5 i denne batchen — ikke gjett.",
        charging: "Ikke dokumentert for ID.5 i denne batchen — ikke gjett.",
        daily: "Ikke dokumentert for ID.5 i denne batchen — ikke gjett.",
      }),
    },
  },
  {
    slug: "volkswagen-id-7",
    model: "ID.7",
    body_style: "Sedan / stasjonsvogn",
    vehicle_type: "Personbil",
    page: SRC.id7Page,
    primarySource: SRC.id7Pdf,
    car: {
      length_mm: 4961,
      width_mm: null,
      height_mm: null,
      wheelbase_mm: null,
      cargo_l: 532,
      seats: 5,
      towing_kg: null,
      heat_pump: true,
      v2l: true,
      charging_connector_ac: "Type 2",
      charging_connector_dc: "CCS2",
      battery_chemistry: "Lithium Ion",
      warranty: WARRANTY,
      apple_carplay: true,
      android_auto: true,
      drivetrain: null,
      range_km: null,
      battery_kwh: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      top_speed_kmh: null,
      dc_charging_kw: null,
      ac_charging_kw: 11,
      charge_time_10_80_minutes: 28,
      consumption_kwh_100km: null,
      curb_weight_kg: null,
      price_nok: null,
    },
    fieldNotes: {
      cargo_l: "Fastback 532 l (1586 nedfelt). Tourer/stasjonsvogn 605 l (1714) — se konflikt; bilnivå = Fastback.",
      towing_kg: "Variantavhengig: Pro S Tourer 1000 kg, GTX 1800 kg — bilnivå tomt.",
      heat_pump: "Standard i PDF for dokumenterte kolonner.",
      v2l: "Forberedelse for V2L dokumentert.",
      charge_time_10_80_minutes: "28 min oppgitt for dokumenterte 86 kWh-varianter (DC 200 kW-klasse).",
      width_mm: "Ikke entydig enkeltverdi ekstrahert fra PDF-måltabell i denne runden — tomt.",
      height_mm: "Ikke entydig enkeltverdi ekstrahert — tomt.",
      wheelbase_mm: "Ikke entydig enkeltverdi ekstrahert — tomt.",
    },
    variants: [
      {
        name: "Pro S Stasjonsvogn",
        slug: "pro-s-stasjonsvogn",
        trim_level: "Pro S Exclusive (stasjonsvogn)",
        is_default: true,
        power_hp: 286,
        torque_nm: 545,
        battery_total_kwh: 91,
        battery_usable_kwh: 86,
        range_km: 676,
        consumption_kwh_100km: 14.32,
        ac_charging_kw: 11,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 28,
        acceleration_0_100: 6.7,
        top_speed_kmh: 180,
        curb_weight_kg: 2235,
        towing_kg: 1000,
        drivetrain: "Tohjulstrekk",
        source: SRC.id7Pdf,
        import_notes:
          "PDF-kolonne «ID.7 Pro S Stasjonsvogn». DC oppgitt som 200 kW-klasse for 86 kWh. Bagasje Tourer 605 l (ikke på variant-rad).",
      },
      {
        name: "GTX Fastback",
        slug: "gtx-fastback",
        trim_level: "GTX Fastback",
        power_hp: 340,
        battery_total_kwh: 91,
        battery_usable_kwh: 86,
        range_km: 597,
        consumption_kwh_100km: 16.3,
        ac_charging_kw: 11,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 28,
        acceleration_0_100: 5.4,
        top_speed_kmh: 200,
        curb_weight_kg: 2328,
        towing_kg: 1800,
        drivetrain: "Firehjulsdrift",
        source: SRC.id7Pdf,
        import_notes:
          "Dreiemoment PDF: 135/545 Nm — ikke lagret som enkeltfelt. Bagasje Fastback 532 l.",
      },
      {
        name: "GTX Stasjonsvogn",
        slug: "gtx-stasjonsvogn",
        trim_level: "GTX Stasjonsvogn",
        power_hp: 340,
        battery_total_kwh: 91,
        battery_usable_kwh: 86,
        range_km: 590,
        consumption_kwh_100km: 16.52,
        ac_charging_kw: 11,
        dc_charging_kw: 200,
        charge_time_10_80_minutes: 28,
        acceleration_0_100: 5.5,
        top_speed_kmh: 200,
        curb_weight_kg: 2340,
        towing_kg: 1800,
        drivetrain: "Firehjulsdrift",
        source: SRC.id7Pdf,
        import_notes: "Dreiemoment PDF: 135/545 Nm — ikke lagret. Bagasje Tourer 605 l.",
      },
    ],
    images: [],
    conflicts: [
      {
        field_key: "cargo_l",
        entity_type: "car",
        message: "Fastback vs stasjonsvogn bagasjevolum.",
        values: [
          {
            value: 532,
            source_name: SRC.id7Pdf.name,
            source_url: SRC.id7Pdf.url,
            confidence: 0.95,
          },
          {
            value: 605,
            source_name: SRC.id7Pdf.name,
            source_url: SRC.id7Pdf.url,
            confidence: 0.95,
          },
        ],
      },
      {
        field_key: "dc_charging_kw",
        entity_type: "car",
        message: "PDF nevner DC 175 kW (77 kWh) / 200 kW (86 kWh); talltabellen for Pro S/GTX bruker 86 kWh-kolonnen.",
        values: [
          {
            value: 175,
            source_name: SRC.id7Pdf.name,
            source_url: SRC.id7Pdf.url,
            confidence: 0.8,
          },
          {
            value: 200,
            source_name: SRC.id7Pdf.name,
            source_url: SRC.id7Pdf.url,
            confidence: 0.9,
          },
        ],
      },
    ],
    missingFields: [
      "price_nok",
      "winter_range_km",
      "real_world_range_km",
      "width_mm / height_mm / wheelbase_mm (ikke sikkert ekstrahert)",
      "Pro Fastback / Pro uten S (ikke i talltabellen)",
      "torque_nm for GTX (todelt)",
      "official image candidate URL (ikke funnet i denne runden)",
      "primary approved image",
    ],
    editorial: {
      description: [
        EDITORIAL_DRAFT_MARKER,
        "",
        "Volkswagen ID.7 er en stor helelektrisk bil i sedan-/stasjonsvognformat (Fastback og Tourer) solgt i Norge. Teknisk PDF (april 2026) dokumenterer blant annet Pro S stasjonsvogn samt GTX Fastback og GTX stasjonsvogn med 86 kWh netto / 91 kWh brutto batteri.",
        "",
        "Lengde 4961 mm. Bagasje Fastback 532 l (1586 nedfelt) eller Tourer 605 l (1714). Tilhengervekt varierer (1000 kg på Pro S Tourer, 1800 kg på GTX). Varmepumpe og V2L-forberedelse er dokumentert.",
        "",
        "Pro uten S / 77 kWh-linje er nevnt i ladetekst men mangler komplett tallkolonne i ekstrahert tabell — ikke fylt. Rediger før publisering.",
      ].join("\n"),
      suitable_for: draftList(
        "Langtur og familie (5 seter)",
        "De som trenger stasjonsvognplass (Tourer)",
        "Tilhengerkjøring på GTX (inntil 1800 kg med brems)",
        "Vinterbruk med varmepumpe (uten offisielt vinter-km-tall)",
      ),
      pros: draftList(
        "WLTP inntil 676 km på Pro S stasjonsvogn (PDF)",
        "DC-lading i 200 kW-klasse for 86 kWh-varianter",
        "Tourer med 605 l bagasje",
        "GTX med 1800 kg tilhengervekt",
      ),
      cons: draftList(
        "Bredde/høyde/akselavstand ikke sikkert lagret fra PDF i denne runden",
        "Pro 77 kWh-linje mangler komplett tallsett",
        "GTX-dreiemoment todelt (135/545) — ikke lagret",
        "Ingen bilde-kandidat funnet på modellside i denne runden",
      ),
      score_notes: editorialBlock({
        intro: [],
        winter:
          "Varmepumpe standard ifølge PDF. Ingen offisiell vinterrekkevidde. GTX 4MOTION kan være relevant vintervalg uten km-påstander.",
        charging:
          "AC 11 kW. DC 175/200 kW avhengig av batteri; dokumenterte 86 kWh-varianter: 10–80 % på 28 min. CCS. V2L-forberedelse.",
        daily:
          "Stor bil (4,96 m) med 5 seter. Velg Fastback for lavere profil eller Tourer for mer bagasje. Taklast 75 kg dokumentert.",
      }),
    },
  },
  {
    slug: "volkswagen-id-buzz",
    model: "ID. Buzz",
    body_style: "MPV / bus",
    vehicle_type: "Personbil",
    page: SRC.buzzPage,
    primarySource: SRC.buzzPdf,
    car: {
      length_mm: 4712,
      width_mm: 1985,
      height_mm: 1896,
      wheelbase_mm: 2989,
      cargo_l: null,
      seats: null,
      towing_kg: null,
      heat_pump: null,
      v2l: null,
      charging_connector_ac: "Type 2",
      charging_connector_dc: "CCS2",
      battery_chemistry: null,
      warranty: WARRANTY,
      apple_carplay: null,
      android_auto: null,
      drivetrain: null,
      range_km: null,
      battery_kwh: null,
      battery_total_kwh: null,
      battery_usable_kwh: null,
      power_hp: null,
      torque_nm: null,
      acceleration_0_100: null,
      top_speed_kmh: 160,
      dc_charging_kw: null,
      ac_charging_kw: 11,
      charge_time_10_80_minutes: 29,
      consumption_kwh_100km: null,
      curb_weight_kg: null,
      price_nok: null,
    },
    fieldNotes: {
      length_mm: "Kort 4712 mm; Lang 4962 mm — bilnivå = kort; se konflikt.",
      wheelbase_mm: "Kort 2989 mm; Lang 3239 mm — bilnivå = kort.",
      cargo_l: "Svært seterad-/karosseri-avhengig (306–2469 l i PDF) — ikke én bilverdi.",
      seats: "5/6/7-seter avhengig av konfigurasjon — ikke én bilverdi.",
      towing_kg: "Pro kort 1200 kg / Pro lang 1000 kg; GTX har egne tall — bilnivå tomt.",
      v2l: "V2L-adapter er ekstrautstyr i prisliste — ikke standard; felt tomt.",
      top_speed_kmh: "160 km/t for dokumenterte Pro/GTX-linjer.",
      charge_time_10_80_minutes: "29 minutter DC 10–80 % i teknisk tabell for Pro kort/lang.",
    },
    variants: [
      {
        name: "Pro Kort",
        slug: "pro-kort",
        trim_level: "Pro",
        is_default: true,
        power_hp: 286,
        torque_nm: 560,
        battery_total_kwh: 84,
        battery_usable_kwh: 79,
        range_km: 455,
        ac_charging_kw: 11,
        dc_charging_kw: 183,
        charge_time_10_80_minutes: 29,
        top_speed_kmh: 160,
        curb_weight_kg: 2546,
        towing_kg: 1200,
        drivetrain: "Bakhjulstrekk",
        source: SRC.buzzPdf,
        import_notes: "Rekkevidde 455 km fra prisliste-rad Pro 79 kWh. Lengde 4712 mm.",
      },
      {
        name: "Pro Lang",
        slug: "pro-lang",
        trim_level: "Pro Lang",
        power_hp: 286,
        torque_nm: 560,
        battery_total_kwh: 91,
        battery_usable_kwh: 86,
        range_km: 492,
        ac_charging_kw: 11,
        dc_charging_kw: 199,
        charge_time_10_80_minutes: 29,
        top_speed_kmh: 160,
        curb_weight_kg: 2676,
        towing_kg: 1000,
        drivetrain: "Bakhjulstrekk",
        source: SRC.buzzPdf,
        import_notes: "Rekkevidde 492 km fra prisliste-rad Pro Lang 86 kWh. Lengde 4962 mm / aksel 3239 mm.",
      },
      {
        name: "GTX Kort",
        slug: "gtx-kort",
        trim_level: "GTX",
        power_hp: 340,
        battery_total_kwh: 84,
        battery_usable_kwh: 79,
        ac_charging_kw: 11,
        dc_charging_kw: 183,
        charge_time_10_80_minutes: 29,
        top_speed_kmh: 160,
        curb_weight_kg: 2674,
        drivetrain: "Firehjulstrekk",
        source: SRC.buzzGtxPdf,
        import_notes:
          "WLTP-rekkevidde ikke sikkert lest som én «inntil»-verdi i GTX-PDF-tabellen i denne runden — range_km tomt.",
      },
      {
        name: "GTX Lang",
        slug: "gtx-lang",
        trim_level: "GTX Lang",
        power_hp: 340,
        battery_total_kwh: 91,
        battery_usable_kwh: 86,
        ac_charging_kw: 11,
        dc_charging_kw: 199,
        charge_time_10_80_minutes: 29,
        top_speed_kmh: 160,
        curb_weight_kg: 2802,
        drivetrain: "Firehjulstrekk",
        source: SRC.buzzGtxPdf,
        import_notes: "4MOTION Lang. range_km tomt til entydig WLTP-tall bekreftes i GTX-PDF.",
      },
    ],
    images: [
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/bjarne/16_9_DSC03122.jpg",
        source_name: SRC.buzzPage.name,
        source_url: SRC.buzzPage.url,
        alt_text: "Volkswagen ID. Buzz — offisielt bilde (VW Norge)",
        image_type: "exterior",
        is_primary_candidate: true,
        notes: "Candidate only — not attached, not approved.",
      },
    ],
    conflicts: [
      {
        field_key: "length_mm",
        entity_type: "car",
        message: "Kort vs lang karosseri.",
        values: [
          {
            value: 4712,
            source_name: SRC.buzzPdf.name,
            source_url: SRC.buzzPdf.url,
            confidence: 0.95,
          },
          {
            value: 4962,
            source_name: SRC.buzzPdf.name,
            source_url: SRC.buzzPdf.url,
            confidence: 0.95,
          },
        ],
      },
      {
        field_key: "towing_kg",
        entity_type: "car",
        message: "Pro kort 1200 kg vs Pro lang 1000 kg (PDF).",
        values: [
          {
            value: 1200,
            source_name: SRC.buzzPdf.name,
            source_url: SRC.buzzPdf.url,
            confidence: 0.95,
          },
          {
            value: 1000,
            source_name: SRC.buzzPdf.name,
            source_url: SRC.buzzPdf.url,
            confidence: 0.95,
          },
        ],
      },
    ],
    missingFields: [
      "price_nok (fra-priser på prisliste, ikke enkeltpris)",
      "winter_range_km",
      "real_world_range_km",
      "cargo_l (seterad-avhengig)",
      "seats (5/6/7)",
      "heat_pump (ikke bekreftet som standard i ekstrahert tabell)",
      "GTX WLTP range_km",
      "apple_carplay / android_auto",
      "primary approved image",
    ],
    editorial: {
      description: [
        EDITORIAL_DRAFT_MARKER,
        "",
        "Volkswagen ID. Buzz er en helelektrisk flerbruksbil (kort og lang) solgt i Norge. Offisiell Pro-prisliste/teknisk tabell dokumenterer blant annet Pro kort (84/79 kWh, 286 hk, WLTP 455 km) og Pro lang (91/86 kWh, 286 hk, WLTP 492 km). GTX 4MOTION er dokumentert i egen GTX-PDF.",
        "",
        "Delte kort-mål på bilnivå: lengde 4712 mm, bredde uten speil 1985 mm, høyde 1896 mm, akselavstand 2989 mm. Bagasje og setetall varierer sterkt med 5/6/7-seter og kort/lang — derfor tomme på bilnivå.",
        "",
        "V2L-adapter er ekstrautstyr. Ikke lagre «fra»-priser som faktisk pris. Rediger før publisering.",
      ].join("\n"),
      suitable_for: draftList(
        "Store familier / flerbruksbehov (bekreft setekonfigurasjon)",
        "De som trenger høy sitteposisjon og skyvedør",
        "Lang karosseri når ekstra plass er viktig",
        "GTX når firehjulstrekk er ønsket (uten å gjette rekkevidde)",
      ),
      pros: draftList(
        "Offisielt dokumenterte kort/lang-varianter med tydelige batteritall",
        "DC opptil 183–199 kW og 10–80 % på 29 min (PDF)",
        "Pro kort tilhengerkapasitet 1200 kg",
        "Romslig MPV-format med offisielle bagasjeintervaller",
      ),
      cons: draftList(
        "Bagasje/seter kan ikke lagres som én bilverdi",
        "GTX WLTP ikke fylt i denne runden (mangler entydig tall)",
        "V2L kun som ekstrautstyr",
        "Stor bil — parkering/bybruk krever vurdering",
      ),
      score_notes: editorialBlock({
        intro: [],
        winter:
          "Ingen offisiell vinterrekkevidde i Pro/GTX-PDF-ene brukt her. GTX 4MOTION kan vurderes kvalitativt for vintergrep — uten km-påstand. Bekreft varmepumpe mot utstyrsliste før publisering.",
        charging:
          "AC 11 kW. DC 183 kW (kort) / 199 kW (lang), 10–80 % 29 min. CCS. V2L-adapter ekstrautstyr (inntil 2000 W ifølge prisliste).",
        daily:
          "Skyvedør, høy sitteposisjon og fleksible setekonfigurasjoner. Kort vs lang (+250 mm akselavstand) er hovedvalget. Bekreft 5/6/7-seter før publisering.",
      }),
    },
  },
];

function buildFieldSources(model: ModelBatch): Record<string, FieldSrc> {
  const out: Record<string, FieldSrc> = {};
  const primary = model.primarySource;
  for (const [key, value] of Object.entries(model.car)) {
    if (value == null) continue;
    out[key] = src(primary, 0.95, model.fieldNotes[key]);
  }
  out.source_name = src(primary, 0.98);
  out.source_url = src(model.page, 0.98);
  out.description = src(
    { name: "EVFAKTA editorial draft", url: model.page.url },
    0.55,
    EDITORIAL_DRAFT_MARKER,
    true,
  );
  out.pros = src(
    { name: "EVFAKTA editorial draft", url: model.page.url },
    0.55,
    EDITORIAL_DRAFT_MARKER,
    true,
  );
  out.cons = src(
    { name: "EVFAKTA editorial draft", url: model.page.url },
    0.55,
    EDITORIAL_DRAFT_MARKER,
    true,
  );
  out.suitable_for = src(
    { name: "EVFAKTA editorial draft", url: model.page.url },
    0.55,
    EDITORIAL_DRAFT_MARKER,
    true,
  );
  out.score_notes = src(
    { name: "EVFAKTA editorial draft", url: model.page.url },
    0.55,
    EDITORIAL_DRAFT_MARKER,
    true,
  );
  out.body_style = src(primary, 0.85, "Karosseritype — redaksjonell normalisering mot PDF/side.");
  out.vehicle_type = src(primary, 0.9);
  out.warranty = src(SRC.warranty, 0.9, "Samme garantitekst i ID.-tekniske PDF-er for Norge.");
  return out;
}

async function ensureBrand(client: SupabaseClient) {
  const { data: existing } = await client
    .from("brands")
    .select("id, name, slug")
    .eq("slug", "volkswagen")
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await client
    .from("brands")
    .insert({
      name: "Volkswagen",
      slug: "volkswagen",
      website_url: "https://www.volkswagen.no",
      country: "DE",
      is_active: true,
      description: "Volkswagen Norge / Harald A. Møller AS",
    })
    .select("id, name, slug")
    .single();
  if (error) throw new Error(`brand: ${error.message}`);
  return data;
}

async function upsertCar(
  client: SupabaseClient,
  brandId: string,
  model: ModelBatch,
) {
  const field_sources = buildFieldSources(model);
  const patch: Record<string, unknown> = {
    brand: "Volkswagen",
    brand_id: brandId,
    model: model.model,
    slug: model.slug,
    body_style: model.body_style,
    vehicle_type: model.vehicle_type,
    country: "NO",
    is_published: false,
    import_status: "needs_review",
    source_name: model.primarySource.name,
    source_url: model.page.url,
    data_last_checked_at: CHECKED,
    description: model.editorial.description,
    pros: model.editorial.pros,
    cons: model.editorial.cons,
    suitable_for: model.editorial.suitable_for,
    score_notes: model.editorial.score_notes,
    import_notes: `Volkswagen batch 01 (${CHECKED}). Official VW Norge PDFs/pages only. Variants inactive until editor review. Images candidates only.`,
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
      trim_level: v.trim_level ?? null,
      is_default: Boolean(v.is_default) || i === 0,
      is_active: false,
      sort_order: i,
      import_status: "needs_review",
      source_name: v.source.name,
      source_url: v.source.url,
      data_last_checked_at: CHECKED,
      import_notes: v.import_notes ?? "Volkswagen batch 01 — needs editor review.",
      battery_total_kwh: v.battery_total_kwh ?? null,
      battery_usable_kwh: v.battery_usable_kwh ?? null,
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
  if (!model.images.length) return { jobId: null, itemId: null, images: 0 };

  const { data: job, error: jobErr } = await client
    .from("research_jobs")
    .insert({
      brand_id: brandId,
      brand_name: "Volkswagen",
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
        production_batch: "volkswagen-batch-01",
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
      brand: "Volkswagen",
      model: model.model,
      existing_car_id: carId,
      decision: "pending",
      warnings: ["Image candidates stored for editor review — not attached to car_images."],
      missing_fields: model.missingFields,
      conflicts: model.conflicts,
      proposed_car: { slug: model.slug, brand: "Volkswagen", model: model.model },
      proposed_variants: [],
      message: "Volkswagen batch 01 — official media candidates only.",
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
      license_note: "Official Volkswagen Norge website media — verify usage rights before publish.",
      usage_terms: "Do not auto-attach. Editor must download/approve manually.",
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

function populatedCarFields(model: ModelBatch): string[] {
  return Object.entries(model.car)
    .filter(([, v]) => v != null && v !== "")
    .map(([k]) => k)
    .concat([
      "description",
      "pros",
      "cons",
      "suitable_for",
      "score_notes",
      "source_name",
      "source_url",
      "data_last_checked_at",
      "field_sources",
      "warranty",
    ]);
}

function completionPct(model: ModelBatch): number {
  // Rough editorial/spec readiness vs a full publishable car (not inventing scores).
  const targets = [
    "length_mm",
    "width_mm",
    "height_mm",
    "wheelbase_mm",
    "cargo_l",
    "seats",
    "charging_connector_ac",
    "charging_connector_dc",
    "warranty",
    "description",
    "pros",
    "cons",
    "suitable_for",
    "variants_or_shell",
    "image_candidate_or_noted_missing",
    "source",
  ];
  let hit = 0;
  if (model.car.length_mm != null) hit += 1;
  if (model.car.width_mm != null) hit += 1;
  if (model.car.height_mm != null) hit += 1;
  if (model.car.wheelbase_mm != null) hit += 1;
  if (model.car.cargo_l != null) hit += 1;
  if (model.car.seats != null) hit += 1;
  if (model.car.charging_connector_ac != null) hit += 1;
  if (model.car.charging_connector_dc != null) hit += 1;
  if (model.car.warranty != null) hit += 1;
  if (model.editorial.description) hit += 1;
  if (model.editorial.pros.length) hit += 1;
  if (model.editorial.cons.length) hit += 1;
  if (model.editorial.suitable_for.length) hit += 1;
  if (model.variants.length > 0 || model.slug === "volkswagen-id-5") hit += 1;
  if (model.images.length > 0 || model.slug === "volkswagen-id-5" || model.slug === "volkswagen-id-7")
    hit += 1;
  hit += 1; // source always present
  return Math.round((hit / targets.length) * 100);
}

function readiness(model: ModelBatch): string {
  if (model.slug === "volkswagen-id-5") return "shell_only — blocked on missing official NO tech PDF";
  if (model.variants.some((v) => v.range_km == null && model.slug.includes("buzz") && v.slug.startsWith("gtx")))
    return "partial — needs_review (GTX range gaps; images not attached)";
  if (model.images.length === 0) return "partial — needs_review (no image candidate stored)";
  return "partial — needs_review (not publish-ready; editor review required)";
}

function writeJsonAudit() {
  const payload = {
    batch: "catalog-batch-02-volkswagen",
    checked_at: CHECKED,
    source_name: "Volkswagen Norge (official PDFs + model pages)",
    source_url: SRC.prisliste.url,
    notes:
      "Only officially documented values. Editorial drafts marked Draft – Requires editor review. Never publish from this batch.",
    cars: MODELS.map((m) => ({
      slug: m.slug,
      model: m.model,
      primary_source: m.primarySource,
      page: m.page,
      car_fields: m.car,
      variants: m.variants,
      image_candidates: m.images,
      conflicts: m.conflicts,
      missing_fields: m.missingFields,
      completion_pct: completionPct(m),
      readiness: readiness(m),
    })),
  };
  writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2) + "\n");
}

function writeReport(
  results: Array<{
    model: ModelBatch;
    carId: string;
    variants: Array<{ slug: string; action: string }>;
    images: { jobId: string | null; itemId: string | null; images: number };
    completion: ReturnType<typeof computeEditorialCompletion>;
  }>,
) {
  const lines: string[] = [];
  lines.push("# Volkswagen batch 01");
  lines.push("");
  lines.push(`**Date checked:** ${CHECKED.slice(0, 10)}`);
  lines.push("**Brand:** Volkswagen");
  lines.push("**Status rule:** every model `needs_review`, `is_published=false`");
  lines.push("**Images:** candidates only — not attached, not approved");
  lines.push("**Batch JSON:** `data/catalog-batch-02-volkswagen.json`");
  lines.push("**Apply script:** `scripts/apply-volkswagen-batch-01.ts`");
  lines.push("");
  lines.push("## Models processed");
  lines.push("");
  lines.push("| Model | Slug | Car id | Variants | Completion % | Readiness |");
  lines.push("|-------|------|--------|----------|--------------|-----------|");
  for (const r of results) {
    lines.push(
      `| ${r.model.model} | \`${r.model.slug}\` | \`${r.carId}\` | ${r.model.variants.length} | ${completionPct(r.model)}% | ${readiness(r.model)} |`,
    );
  }
  lines.push("");
  lines.push("## Sources");
  lines.push("");
  lines.push("1. ID.3 tekniske data PDF — " + SRC.id3Pdf.url);
  lines.push("2. ID.4 tekniske data PDF — " + SRC.id4Pdf.url);
  lines.push("3. ID.7 tekniske data PDF — " + SRC.id7Pdf.url);
  lines.push("4. ID. Buzz Pro PDF — " + SRC.buzzPdf.url);
  lines.push("5. ID. Buzz GTX PDF — " + SRC.buzzGtxPdf.url);
  lines.push("6. Prislister — " + SRC.prisliste.url);
  lines.push("7. Modellside ID.3/ID.4/ID.7/ID. Buzz — volkswagen.no");
  lines.push("");
  lines.push("## Per model");
  lines.push("");

  for (const r of results) {
    const m = r.model;
    lines.push(`### ${m.model} (\`${m.slug}\`)`);
    lines.push("");
    lines.push(`- **Car id:** \`${r.carId}\``);
    lines.push("- **import_status:** `needs_review`");
    lines.push("- **is_published:** `false`");
    lines.push(`- **Primary source:** ${m.primarySource.name}`);
    lines.push(`- **Completion:** ${completionPct(m)}%`);
    lines.push(`- **Readiness:** ${readiness(m)}`);
    lines.push(
      `- **Editorial completion helper:** ${r.completion.percent}% (${r.completion.completedCount}/${r.completion.totalCount} tracked items)`,
    );
    lines.push("");
    lines.push("#### Variants");
    lines.push("");
    if (!m.variants.length) {
      lines.push("_None — shell only._");
    } else {
      lines.push("| Variant | Slug | Battery net/gross | WLTP | Power | DC | Status |");
      lines.push("|---------|------|-------------------|------|-------|----|--------|");
      for (const v of m.variants) {
        lines.push(
          `| ${v.name} | \`${v.slug}\` | ${v.battery_usable_kwh ?? "—"} / ${v.battery_total_kwh ?? "—"} kWh | ${v.range_km ?? "—"} km | ${v.power_hp ?? "—"} hk | ${v.dc_charging_kw ?? "—"} kW | needs_review / inactive |`,
        );
      }
    }
    lines.push("");
    lines.push("#### Populated car fields");
    lines.push("");
    for (const field of populatedCarFields(m)) {
      lines.push(`- \`${field}\``);
    }
    lines.push("");
    lines.push("#### Missing fields");
    lines.push("");
    for (const miss of m.missingFields) lines.push(`- ${miss}`);
    lines.push("");
    lines.push("#### Conflicts");
    lines.push("");
    if (!m.conflicts.length) {
      lines.push("_None recorded._");
    } else {
      for (const c of m.conflicts) {
        lines.push(`- **${c.entity_type}.${c.field_key}:** ${c.message}`);
        for (const val of c.values) {
          lines.push(
            `  - \`${String(val.value)}\` (${val.confidence}) — ${val.source_name}`,
          );
        }
      }
    }
    lines.push("");
    lines.push("#### Image candidates");
    lines.push("");
    if (!m.images.length) {
      lines.push("_No official media URL captured in this batch (do not invent)._");
    } else {
      for (const img of m.images) {
        lines.push(`- ${img.original_url}`);
        lines.push(`  - source: ${img.source_url}`);
        lines.push(`  - status: pending candidate (not attached)`);
      }
      if (r.images.jobId) {
        lines.push(`- research job: \`${r.images.jobId}\` / item \`${r.images.itemId}\``);
      }
    }
    lines.push("");
    lines.push("#### Editorial drafts");
    lines.push("");
    lines.push("All of: short introduction (`description`), who for (`suitable_for`), strengths (`pros`), weaknesses (`cons`), winter / charging / daily usability (`score_notes`) — marked **" + EDITORIAL_DRAFT_MARKER + "**");
    lines.push("");
  }

  lines.push("## Batch readiness summary");
  lines.push("");
  lines.push("- **Publishable now:** no models");
  lines.push("- **Ready for editor review:** ID.3, ID.4, ID.7, ID. Buzz");
  lines.push("- **Blocked / shell:** ID.5 (no current official NO tech PDF / model page)");
  lines.push("- **Next editor actions:** resolve conflicts, confirm variant defaults, attach/approve images manually, verify prices separately if needed, then approve — still do not auto-publish");
  lines.push("");

  writeFileSync(REPORT_PATH, lines.join("\n"));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const brand = await ensureBrand(client);
  writeJsonAudit();

  const results = [];
  for (const model of MODELS) {
    console.log("Processing", model.model, "…");
    const car = await upsertCar(client, brand.id, model);
    if (car.is_published) {
      await client.from("cars").update({ is_published: false }).eq("id", car.id);
    }
    const variants = await upsertVariants(client, car.id, model.variants);
    const images = await storeImageCandidates(client, brand.id, car.id, model);

    const { data: fullCar, error } = await client
      .from("cars")
      .select("*")
      .eq("id", car.id)
      .single();
    if (error) throw new Error(error.message);

    const { data: variantRows } = await client
      .from("car_variants")
      .select("*")
      .eq("car_id", car.id);

    results.push({
      model,
      carId: car.id as string,
      variants,
      images,
      completion: computeEditorialCompletion({
        car: fullCar as AdminCar,
        images: [],
        variants: variantRows ?? [],
      }),
    });

    console.log(
      JSON.stringify({
        slug: model.slug,
        car_id: car.id,
        variants: variants.length,
        image_candidates: images.images,
        completion_pct: completionPct(model),
        is_published: false,
        import_status: "needs_review",
      }),
    );
  }

  writeReport(results);
  console.log("Wrote", REPORT_PATH);
  console.log("Wrote", JSON_PATH);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
