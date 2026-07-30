/**
 * Complete BMW Norwegian EV launch set to 100% Review Assistant.
 * Models: iX1, iX2, i4, i5, i7, iX.
 * Official BMW PressClub technical sheets (+ BMW Group Norge press for iX1 eDrive20).
 * BMW.no live pages unreachable in this environment — documented honesty.
 * Never invent. Never auto-publish.
 *
 * Usage: npx tsx scripts/complete-bmw-100.ts
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
const BRAND = "BMW";
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
  towing_kg: number;
  battery_chemistry: string;
  charging_connector_ac: string;
  charging_connector_dc: string;
  page: string;
  primarySourceName: string;
  primarySourceUrl: string;
  images: Partial<Record<Role, string>>;
  documentRearMissing?: boolean;
  documentInteriorMissing?: boolean;
  variants: VariantCfg[];
  description: string;
  pros: string[];
  cons: string[];
  suitable_for: string[];
};

const SRC = {
  ix1Xd30:
    "https://www.press.bmwgroup.com/global/article/attachment/T0393974EN/567425",
  ix1Ed20No:
    "https://www.mynewsdesk.com/no/bmw-no/pressreleases/nye-bmw-ix1-edrive20-ny-elektrisk-innstegsmodell-3276133",
  ix2Xd30:
    "https://www.press.bmwgroup.com/global/article/attachment/T0437451EN/608982",
  ix2Ed20:
    "https://www.press.bmwgroup.com/global/article/detail/T0439779EN/specifications-of-the-bmw-ix2-edrive20-valid-from-03/2024?language=en",
  i4:
    "https://www.press.bmwgroup.com/global/article/attachment/T0442767EN/617124",
  i5Xd40:
    "https://www.press.bmwgroup.com/global/article/attachment/T0439978EN/612522",
  i7Xd60:
    "https://www.press.bmwgroup.com/global/article/attachment/T0380173EN/568614",
  ix:
    "https://www.press.bmwgroup.com/global/article/attachment/T0447642EN/630684",
  bmwNo: "https://www.bmw.no",
} as const;

const MODELS: ModelCfg[] = [
  {
    slug: "bmw-ix1",
    model: "iX1",
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4500,
    width_mm: 1845,
    height_mm: 1616,
    wheelbase_mm: 2692,
    cargo_l: 490,
    towing_kg: 1200,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.bmw.no/no/alle-modeller/i-series/ix1/bmw-ix1.html",
    primarySourceName: "BMW PressClub — iX1 xDrive30 Technical specifications",
    primarySourceUrl: SRC.ix1Xd30,
    images: {
      front: "docs/_tmp_bmw/ix1/front_final.jpg",
      side: "docs/_tmp_bmw/ix1/side_final.jpg",
      interior: "docs/_tmp_bmw/ix1/interior_final.jpg",
    },
    documentRearMissing: true,
    description:
      "BMW iX1 er den helelektriske compact SAV i X1-familien, solgt i Norge. Dimensjoner, batteri, lading og trekk er fra BMW PressClub tekniske datablad (ACEA/Tyskland) med markedspeker til BMW Norge. BMW.no live-side var utilgjengelig i dette produksjonsmiljøet — tall er ikke gjettet utover offisielle presskilder.",
    pros: [
      "Kompakt SAV med offisiell PressClub-dokumentert WLTP og DC-lading",
      "xDrive30 med firehjulsdrift og 1200 kg tilhengerkapasitet (brems)",
      "eDrive20 som lavere innstegsvariant (BMW Group Norge)",
    ],
    cons: [
      "WLTP er laboratoriemål — ikke offisiell vinterrekkevidde lagret",
      "BMW.no live-tall ikke bekreftet i dette miljøet (utilgjengelig)",
      "Variantavhengig rekkevidde — les variantnivå før valg",
    ],
    suitable_for: [
      "Pendling og familier i kompakt SUV-segmentet",
      "Brukere som trenger tilhenger inntil 1200 kg",
      "Langtur når variantens WLTP/DC er planlagt inn",
    ],
    variants: [
      {
        name: "xDrive30",
        slug: "xdrive30",
        is_default: true,
        battery_usable_kwh: 64.7,
        range_km: 440,
        consumption_kwh_100km: 18.1,
        ac_charging_kw: 11,
        dc_charging_kw: 130,
        charge_time_10_80_minutes: 29,
        drivetrain: "Firehjulsdrift",
        power_hp: 313,
        torque_nm: 494,
        acceleration_0_100: 5.6,
        top_speed_kmh: 180,
        towing_kg: 1200,
        curb_weight_kg: 2010,
        source_name: "BMW PressClub — iX1 xDrive30 Technical specifications",
        source_url: SRC.ix1Xd30,
        import_notes: "WLTP range band 417–440; stored max. Consumption band 18.1–16.8; stored max.",
      },
      {
        name: "eDrive20",
        slug: "edrive20",
        battery_usable_kwh: 64.7,
        range_km: 475,
        ac_charging_kw: 11,
        dc_charging_kw: 130,
        drivetrain: "Forhjulsdrift",
        power_hp: 204,
        acceleration_0_100: 8.6,
        top_speed_kmh: 170,
        towing_kg: 1200,
        source_name: "BMW Group Norge — iX1 eDrive20 pressemelding",
        source_url: SRC.ix1Ed20No,
        import_notes:
          "Effekt/rekkevidde øvre fra BMW Group Norge press. Batteri/DC fra iX1 PressClub-plattform (xDrive30 sheet) — bekreft mot CoC/NO før energipublisering.",
      },
    ],
  },
  {
    slug: "bmw-ix2",
    model: "iX2",
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4554,
    width_mm: 1845,
    height_mm: 1560,
    wheelbase_mm: 2692,
    cargo_l: 525,
    towing_kg: 1200,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.bmw.no/no/alle-modeller/i-series/ix2/bmw-ix2.html",
    primarySourceName: "BMW PressClub — iX2 xDrive30 Technical specifications",
    primarySourceUrl: SRC.ix2Xd30,
    images: {
      front: "docs/_tmp_bmw/ix2/front_final.jpg",
      side: "docs/_tmp_bmw/ix2/side_final.jpg",
      rear: "docs/_tmp_bmw/ix2/rear_final.jpg",
    },
    documentInteriorMissing: true,
    description:
      "BMW iX2 er den helelektriske Sports Activity Coupé i X2-familien. Spesifikasjoner er fra BMW PressClub tekniske datablad. BMW.no live-side var utilgjengelig her — ikke gjettet.",
    pros: [
      "Coupé-SUV med offisiell PressClub DC 130 kW og WLTP-band",
      "xDrive30 firehjulsdrift; eDrive20 forhjulsdrift som alternativ",
      "525–1400 l bagasje ifølge PressClub",
    ],
    cons: [
      "Ingen offisiell vinterrekkevidde lagret",
      "BMW.no live ikke bekreftet i dette miljøet",
      "Kabinfoto mangler i verifisert PressClub-sett for denne runden",
    ],
    suitable_for: [
      "Kompakt crossover med coupé-profil",
      "Pendling og weekendturer",
      "Tilhenger inntil 1200 kg (brems)",
    ],
    variants: [
      {
        name: "xDrive30",
        slug: "xdrive30",
        is_default: true,
        battery_usable_kwh: 64.8,
        range_km: 449,
        consumption_kwh_100km: 17.7,
        ac_charging_kw: 11,
        dc_charging_kw: 130,
        charge_time_10_80_minutes: 29,
        drivetrain: "Firehjulsdrift",
        power_hp: 313,
        torque_nm: 494,
        acceleration_0_100: 5.6,
        top_speed_kmh: 180,
        towing_kg: 1200,
        curb_weight_kg: 2020,
        source_name: "BMW PressClub — iX2 xDrive30 Technical specifications",
        source_url: SRC.ix2Xd30,
        import_notes: "WLTP 417–449; consumption 17.7–16.3; stored band highs.",
      },
      {
        name: "eDrive20",
        slug: "edrive20",
        battery_usable_kwh: 64.8,
        range_km: 478,
        consumption_kwh_100km: 16.9,
        ac_charging_kw: 11,
        dc_charging_kw: 130,
        charge_time_10_80_minutes: 29,
        drivetrain: "Forhjulsdrift",
        power_hp: 204,
        torque_nm: 250,
        acceleration_0_100: 8.6,
        top_speed_kmh: 170,
        towing_kg: 1200,
        source_name: "BMW PressClub — iX2 eDrive20 specifications (03/2024)",
        source_url: SRC.ix2Ed20,
        import_notes: "WLTP 439–478; consumption 16.9–15.3; stored band highs.",
      },
    ],
  },
  {
    slug: "bmw-i4",
    model: "i4",
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4783,
    width_mm: 1852,
    height_mm: 1448,
    wheelbase_mm: 2856,
    cargo_l: 470,
    towing_kg: 1600,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.bmw.no/no/alle-modeller/i-series/i4/bmw-i4.html",
    primarySourceName: "BMW PressClub — Technical data BMW i4 (valid July 2024)",
    primarySourceUrl: SRC.i4,
    images: {
      front: "docs/_tmp_bmw/i4/front_final.jpg",
      side: "docs/_tmp_bmw/i4/side_final.jpg",
      rear: "docs/_tmp_bmw/i4/rear_final.jpg",
    },
    documentInteriorMissing: true,
    description:
      "BMW i4 er helelektrisk Gran Coupé i 4-serien. Alle varianttall nedenfor er fra BMW PressClub tekniske data gyldig fra juli 2024. BMW.no live utilgjengelig her — ikke gjettet.",
    pros: [
      "Fire offisielle drivlinjer i PressClub-ark (eDrive35/40, xDrive40, M50)",
      "DC opptil 205 kW på 40/M50-plattformen",
      "1600 kg tilhengerkapasitet (brems) ifølge PressClub",
    ],
    cons: [
      "Ingen offisiell vinterrekkevidde lagret",
      "Kabinfoto mangler i verifisert sett denne runden",
      "BMW.no live ikke bekreftet i dette miljøet",
    ],
    suitable_for: [
      "Sportslig Gran Coupé for pendling og langtur",
      "Familier med 470–1290 l bagasjebehov",
      "Ytelse med M50 xDrive når ønskelig",
    ],
    variants: [
      {
        name: "eDrive35",
        slug: "edrive35",
        battery_usable_kwh: 67.1,
        battery_total_kwh: 70.3,
        range_km: 500,
        consumption_kwh_100km: 18.6,
        ac_charging_kw: 11,
        dc_charging_kw: 180,
        charge_time_10_80_minutes: 32,
        drivetrain: "Bakhjulsdrift",
        power_hp: 286,
        torque_nm: 400,
        acceleration_0_100: 6.0,
        top_speed_kmh: 190,
        towing_kg: 1600,
        curb_weight_kg: 2000,
        source_name: "BMW PressClub — i4 eDrive35 Technical data (07/2024)",
        source_url: SRC.i4,
        import_notes: "WLTP 406–500; consumption 18.6–15.1.",
      },
      {
        name: "eDrive40",
        slug: "edrive40",
        is_default: true,
        battery_usable_kwh: 81.3,
        battery_total_kwh: 83.9,
        range_km: 600,
        consumption_kwh_100km: 18.6,
        ac_charging_kw: 11,
        dc_charging_kw: 205,
        charge_time_10_80_minutes: 30,
        drivetrain: "Bakhjulsdrift",
        power_hp: 340,
        torque_nm: 430,
        acceleration_0_100: 5.7,
        top_speed_kmh: 190,
        towing_kg: 1600,
        curb_weight_kg: 2050,
        source_name: "BMW PressClub — i4 eDrive40 Technical data (07/2024)",
        source_url: SRC.i4,
        import_notes: "WLTP 491–600; consumption 18.6–15.4.",
      },
      {
        name: "xDrive40",
        slug: "xdrive40",
        battery_usable_kwh: 81.3,
        battery_total_kwh: 83.9,
        range_km: 546,
        consumption_kwh_100km: 19.8,
        ac_charging_kw: 11,
        dc_charging_kw: 205,
        charge_time_10_80_minutes: 30,
        drivetrain: "Firehjulsdrift",
        power_hp: 401,
        torque_nm: 600,
        acceleration_0_100: 5.1,
        top_speed_kmh: 200,
        towing_kg: 1600,
        curb_weight_kg: 2185,
        source_name: "BMW PressClub — i4 xDrive40 Technical data (07/2024)",
        source_url: SRC.i4,
        import_notes: "WLTP 459–546; consumption 19.8–16.7.",
      },
      {
        name: "M50 xDrive",
        slug: "m50-xdrive",
        battery_usable_kwh: 81.3,
        battery_total_kwh: 83.9,
        range_km: 520,
        consumption_kwh_100km: 21.9,
        ac_charging_kw: 11,
        dc_charging_kw: 205,
        charge_time_10_80_minutes: 30,
        drivetrain: "Firehjulsdrift",
        power_hp: 544,
        torque_nm: 795,
        acceleration_0_100: 3.9,
        top_speed_kmh: 225,
        towing_kg: 1600,
        curb_weight_kg: 2215,
        source_name: "BMW PressClub — i4 M50 xDrive Technical data (07/2024)",
        source_url: SRC.i4,
        import_notes: "WLTP 416–520; consumption 21.9–17.6.",
      },
    ],
  },
  {
    slug: "bmw-i5",
    model: "i5",
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 5060,
    width_mm: 1900,
    height_mm: 1515,
    wheelbase_mm: 2995,
    cargo_l: 490,
    towing_kg: 2000,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.bmw.no/no/alle-modeller/i-series/i5/bmw-i5.html",
    primarySourceName: "BMW PressClub — i5 xDrive40 Sedan Technical specifications",
    primarySourceUrl: SRC.i5Xd40,
    images: {
      front: "docs/_tmp_bmw/i5/front_final.jpg",
      side: "docs/_tmp_bmw/i5/side_final.jpg",
      rear: "docs/_tmp_bmw/i5/rear_final.jpg",
    },
    documentInteriorMissing: true,
    description:
      "BMW i5 er helelektrisk 5-serie. Denne produksjonsrunden lagrer full PressClub-spesifikasjon for i5 xDrive40 Sedan. eDrive40 / M60 / Touring selges i markedet — ytterligere variantark skal inn når offisielle NO/PressClub-ark er lagret. BMW.no live utilgjengelig her.",
    pros: [
      "xDrive40 Sedan med 81.2 kWh netto og DC 205 kW (PressClub)",
      "2000 kg tilhengerkapasitet (brems)",
      "490 l bagasje (sedan) ifølge PressClub",
    ],
    cons: [
      "Kun xDrive40 Sedan fullt spesifisert i denne runden — andre varianter ikke gjettet",
      "Ingen offisiell vinterrekkevidde lagret",
      "Kabinfoto mangler i verifisert sett",
    ],
    suitable_for: [
      "Executive sedan for pendling og langtur",
      "Brukere som trenger 2000 kg tilhenger",
      "Familier når sedan-bagasje matcher behov",
    ],
    variants: [
      {
        name: "xDrive40 Sedan",
        slug: "xdrive40-sedan",
        is_default: true,
        battery_usable_kwh: 81.2,
        range_km: 538,
        consumption_kwh_100km: 20.0,
        ac_charging_kw: 22,
        dc_charging_kw: 205,
        charge_time_10_80_minutes: 30,
        drivetrain: "Firehjulsdrift",
        power_hp: 394,
        torque_nm: 590,
        acceleration_0_100: 3.8,
        top_speed_kmh: 215,
        towing_kg: 2000,
        curb_weight_kg: 2280,
        source_name: "BMW PressClub — i5 xDrive40 Sedan Technical specifications",
        source_url: SRC.i5Xd40,
        import_notes: "WLTP 463–538; consumption 20.0–17.2. AC three-phase max 22 kW.",
      },
    ],
  },
  {
    slug: "bmw-i7",
    model: "i7",
    body_style: "Sedan",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 5391,
    width_mm: 1950,
    height_mm: 1544,
    wheelbase_mm: 3215,
    cargo_l: 500,
    towing_kg: 2000,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.bmw.no/no/alle-modeller/i-series/i7/bmw-i7.html",
    primarySourceName: "BMW PressClub — i7 xDrive60 Technical specifications",
    primarySourceUrl: SRC.i7Xd60,
    images: {
      front: "docs/_tmp_bmw/i7/front_final.jpg",
      side: "docs/_tmp_bmw/i7/side_final.jpg",
    },
    documentRearMissing: true,
    documentInteriorMissing: true,
    description:
      "BMW i7 er flaggskipet i helelektrisk 7-serie. Full PressClub-spesifikasjon for i7 xDrive60 er lagret. eDrive50 / M70 xDrive er markedsvarianter — ikke gjettet uten lagret PressClub-ark i denne runden. BMW.no live utilgjengelig her.",
    pros: [
      "101.7 kWh netto og DC 195 kW (xDrive60 PressClub)",
      "500 l bagasje og 2000 kg tilhenger (brems)",
      "Lang WLTP-band for xDrive60 (591–625 km)",
    ],
    cons: [
      "Kun xDrive60 fullt spesifisert her — andre varianter ikke gjettet",
      "Bak-/kabinfoto mangler i verifisert sett",
      "Ingen offisiell vinterrekkevidde lagret",
    ],
    suitable_for: [
      "Luksus-langtur og representasjon",
      "Brukere som trenger stor sedan med tilhenger",
      "Når xDrive60-spesifikasjonen matcher behov",
    ],
    variants: [
      {
        name: "xDrive60",
        slug: "xdrive60",
        is_default: true,
        battery_usable_kwh: 101.7,
        range_km: 625,
        consumption_kwh_100km: 19.6,
        ac_charging_kw: 22,
        dc_charging_kw: 195,
        charge_time_10_80_minutes: 34,
        drivetrain: "Firehjulsdrift",
        power_hp: 544,
        torque_nm: 745,
        acceleration_0_100: 4.7,
        top_speed_kmh: 240,
        towing_kg: 2000,
        curb_weight_kg: 2640,
        source_name: "BMW PressClub — i7 xDrive60 Technical specifications",
        source_url: SRC.i7Xd60,
        import_notes: "WLTP 591–625; consumption 19.6–18.4.",
      },
    ],
  },
  {
    slug: "bmw-ix",
    model: "iX",
    body_style: "SUV",
    vehicle_type: "Personbil",
    seats: 5,
    length_mm: 4965,
    width_mm: 1970,
    height_mm: 1695,
    wheelbase_mm: 3000,
    cargo_l: 500,
    towing_kg: 2500,
    battery_chemistry: "Lithium-ion",
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS2",
    page: "https://www.bmw.no/no/alle-modeller/i-series/ix/bmw-ix.html",
    primarySourceName: "BMW PressClub — iX Technical specifications (01/2025)",
    primarySourceUrl: SRC.ix,
    images: {
      front: "docs/_tmp_bmw/ix/front_final.jpg",
      side: "docs/_tmp_bmw/ix/side_final.jpg",
      rear: "docs/_tmp_bmw/ix/rear_final.jpg",
    },
    documentInteriorMissing: true,
    description:
      "BMW iX er merkevarens dedikerte helelektriske SAV. Variantene xDrive45, xDrive60 og M70 xDrive er fra BMW PressClub tekniske data januar 2025. BMW.no live utilgjengelig her — ikke gjettet.",
    pros: [
      "Tre offisielle PressClub-varianter med netto batteri 94.8–109.1 kWh",
      "2500 kg tilhengerkapasitet (brems)",
      "500–1750 l bagasje ifølge PressClub",
    ],
    cons: [
      "Ingen offisiell vinterrekkevidde lagret",
      "Kabinfoto mangler i verifisert sett denne runden",
      "BMW.no live ikke bekreftet i dette miljøet",
    ],
    suitable_for: [
      "Stor SAV for familie og langtur",
      "Tunge tilhengere inntil 2500 kg",
      "Når xDrive45/60/M70 matcher ytelsesbehov",
    ],
    variants: [
      {
        name: "xDrive45",
        slug: "xdrive45",
        is_default: true,
        battery_usable_kwh: 94.8,
        range_km: 602,
        consumption_kwh_100km: 21.8,
        ac_charging_kw: 11,
        dc_charging_kw: 175,
        charge_time_10_80_minutes: 34,
        drivetrain: "Firehjulsdrift",
        power_hp: 408,
        torque_nm: 700,
        acceleration_0_100: 5.1,
        top_speed_kmh: 200,
        towing_kg: 2500,
        curb_weight_kg: 2450,
        source_name: "BMW PressClub — iX xDrive45 Technical specifications",
        source_url: SRC.ix,
        import_notes: "WLTP 490–602.",
      },
      {
        name: "xDrive60",
        slug: "xdrive60",
        battery_usable_kwh: 109.1,
        range_km: 701,
        consumption_kwh_100km: 21.9,
        ac_charging_kw: 11,
        dc_charging_kw: 195,
        charge_time_10_80_minutes: 35,
        drivetrain: "Firehjulsdrift",
        power_hp: 544,
        torque_nm: 765,
        towing_kg: 2500,
        curb_weight_kg: 2505,
        source_name: "BMW PressClub — iX xDrive60 Technical specifications",
        source_url: SRC.ix,
        import_notes: "WLTP 563–701. 0–100 not stored from sheet page parse — not invented.",
      },
      {
        name: "M70 xDrive",
        slug: "m70-xdrive",
        battery_usable_kwh: 108.9,
        range_km: 600,
        consumption_kwh_100km: 23.5,
        ac_charging_kw: 11,
        dc_charging_kw: 195,
        charge_time_10_80_minutes: 35,
        drivetrain: "Firehjulsdrift",
        power_hp: 659,
        torque_nm: 1015,
        towing_kg: 2500,
        curb_weight_kg: 2580,
        source_name: "BMW PressClub — iX M70 xDrive Technical specifications",
        source_url: SRC.ix,
        import_notes: "WLTP 521–600. Boost footnotes on sheet.",
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
  const extras: string[] = [
    `## Batteri
Netto batterikapasitet er lagret per variant fra BMW PressClub (Lithium-ion). BMW.no live-side var utilgjengelig i dette miljøet — ikke gjettet utover pressark.`,
    `## Batteritype
Batterikjemi: Lithium-ion ifølge PressClub high-voltage battery / storage technology.`,
    `## Rekkevidde
WLTP er lagret som øvre verdi i oppgitt band per variant. Laboratoriemål erstatter ikke reell rekkevidde.`,
    `## Forbruk
WLTP-forbruk (kWh/100 km) er lagret som øvre verdi i oppgitt band der band finnes.`,
    `## Lading
AC/DC og 10–80 % fra PressClub Combined Charging Unit. Europa: Type 2 / CCS2.`,
    `## Tilhenger
Bremset tilhengerkapasitet fra PressClub body-tabell — lagret på bil/variant.`,
    `## Dimensjoner
Lengde/bredde/høyde/akselsavstand/bagasje fra PressClub body-tabell.`,
    `## Varme pumpe
Varme pumpe er ikke eksplisitt boolean i PressClub tech sheet for denne runden — ikke gjettet som true/false.`,
    `## Marked
BMW.no live-sider returnerte ikke brukbart innhold i produksjonsmiljøet — PressClub + BMW Group Norge press brukt. Bekreft mot BMW Norge / CoC før offentlig energipublisering.`,
  ];
  if (cfg.documentRearMissing) {
    extras.push(
      "## Bak\nOffisiell bakfoto mangler i verifisert PressClub-sett for denne katalogen — ikke tilgjengelig / ikke verifisert. Left empty.",
    );
  }
  if (cfg.documentInteriorMissing) {
    extras.push(
      "## Interiør\nFull kabininteriørfoto mangler i verifisert sett — ikke tilgjengelig / ikke verifisert. Left empty.",
    );
  }

  return `## Hvem bilen passer for
BMW ${cfg.model} passer for brukere som vurderer helelektrisk BMW i dette segmentet. Sammenlign varianter for batteri, WLTP, lading og tilhengertall.

## Vinter
Ingen offisiell vinterrekkevidde er lagret som egen katalogverdi — ikke gjettet. Forvent lavere rekkevidde i kulde. Forhåndskondisjonering og dekkvalg påvirker. Varme pumpe er ikke bekreftet som boolean i PressClub-arket.

## Lading
Planlegg lading ut fra variantens AC/DC og 10–80 % i PressClub-arket. Praktisk ladetid varierer med temperatur og ladeinfrastruktur.

## Daglig bruk
Egnet for hverdag når dimensjoner, seter og bagasje matcher behov. Les variantnivå for effekt og trekk.

## Langtur
Planlegg ladestopp ut fra variantens WLTP og DC-kapasitet. Laboratoriemål erstatter ikke reell rekkevidde.

## FAQ
**Hvor finner jeg offisielle tall?** BMW PressClub tekniske datablad for ${cfg.model} + BMW Norge produktside når tilgjengelig.
**Er vinterrekkevidde oppgitt?** Nei som egen katalogverdi her — ikke gjettet.
**Kan tallene endre seg?** Ja — bekreft alltid gjeldende verdier hos BMW Norge / forhandler før kjøp.

${extras.join("\n\n")}`.trim();
}

async function ensureBrand(sb: SupabaseClient): Promise<string> {
  const { data: existing } = await sb
    .from("brands")
    .select("id")
    .eq("slug", "bmw")
    .maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data, error } = await sb
    .from("brands")
    .insert({
      name: "BMW",
      slug: "bmw",
      website_url: "https://www.bmw.no",
      country: "DE",
      is_active: true,
      description: "BMW Norge / BMW Group",
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
      "Type 2 Europe Combined Charging Unit",
    ),
    charging_connector_dc: fieldMeta(
      cfg.primarySourceName,
      cfg.primarySourceUrl,
      "CCS2 Europe Combined Charging Unit",
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
    import_status: "approved",
    import_notes: `phase1-bmw-100-${CHECKED_AT.slice(0, 10)} | Image Ready + editorial finalized | PressClub | unpublished`,
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
  const bySlug = new Map((existing ?? []).map((v) => [v.slug as string, v.id as string]));

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
    alt: `BMW ${cfg.model} front (BMW PressClub)`,
  });
  if (cfg.images.side) {
    await attachLocalImage(sb, {
      carId,
      slug: cfg.slug,
      role: "side",
      localPath: cfg.images.side,
      isPrimary: false,
      sortOrder: sort++,
      alt: `BMW ${cfg.model} sideprofil (BMW PressClub)`,
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
      alt: `BMW ${cfg.model} bak (BMW PressClub)`,
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
      alt: `BMW ${cfg.model} interiør (BMW PressClub)`,
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
    const status = c.canPublish
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
