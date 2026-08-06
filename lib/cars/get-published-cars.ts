import type { Car, CarGalleryImage, CarVariant } from "@/data/cars";
import { isCarImageType, type CarImageType } from "@/lib/admin/car-image-types";
import { mapDriveOrNull, withDefaultVariantSpecs } from "@/lib/cars/variants";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type PublishedCarImageRow = {
  id: string;
  image_url: string;
  image_type: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

type PublishedVariantRow = {
  id: string;
  name: string;
  slug: string;
  trim_level: string | null;
  model_year: number | null;
  price_nok: number | null;
  battery_total_kwh: number | string | null;
  battery_usable_kwh: number | string | null;
  range_km: number | null;
  winter_range_km: number | null;
  real_world_range_km: number | null;
  consumption_kwh_100km: number | string | null;
  ac_charging_kw: number | string | null;
  dc_charging_kw: number | null;
  charge_time_10_80_minutes: number | null;
  drivetrain: string | null;
  power_hp: number | null;
  torque_nm: number | null;
  acceleration_0_100: number | string | null;
  top_speed_kmh: number | null;
  towing_kg: number | null;
  curb_weight_kg: number | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  source_name: string | null;
  source_url: string | null;
  data_last_checked_at: string | null;
};

type PublishedCarRow = {
  id?: string;
  slug: string;
  brand: string;
  model: string;
  year?: number | null;
  price_nok: number | null;
  range_km: number | null;
  battery_kwh: number | string | null;
  dc_charging_kw: number | null;
  drivetrain: string | null;
  image_url: string | null;
  description: string | null;
  updated_at: string;
  consumption_kwh_100km?: number | string | null;
  power_hp?: number | null;
  torque_nm?: number | null;
  acceleration_0_100?: number | string | null;
  top_speed_kmh?: number | null;
  seats?: number | null;
  cargo_l?: number | null;
  towing_kg?: number | null;
  warranty?: string | null;
  ac_charging_kw?: number | string | null;
  vehicle_type?: string | null;
  body_style?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  data_last_checked_at?: string | null;
  range_score?: number | string | null;
  charging_score?: number | string | null;
  winter_score?: number | string | null;
  comfort_score?: number | string | null;
  space_score?: number | string | null;
  value_score?: number | string | null;
  reliability_score?: number | string | null;
  overall_score?: number | string | null;
  score_notes?: string | null;
  score_methodology?: string | null;
  variant?: string | null;
  trim_level?: string | null;
  model_generation?: string | null;
  battery_total_kwh?: number | string | null;
  battery_usable_kwh?: number | string | null;
  battery_chemistry?: string | null;
  winter_range_km?: number | null;
  real_world_range_km?: number | null;
  charge_time_10_80_minutes?: number | null;
  charging_connector_ac?: string | null;
  charging_connector_dc?: string | null;
  length_mm?: number | null;
  width_mm?: number | null;
  height_mm?: number | null;
  wheelbase_mm?: number | null;
  curb_weight_kg?: number | null;
  gross_weight_kg?: number | null;
  frunk_l?: number | null;
  heat_pump?: boolean | null;
  v2l?: boolean | null;
  v2g?: boolean | null;
  apple_carplay?: boolean | null;
  android_auto?: boolean | null;
  head_up_display?: boolean | null;
  panoramic_roof?: boolean | null;
  ota_updates?: boolean | null;
  pros?: string[] | null;
  cons?: string[] | null;
  suitable_for?: string[] | null;
  car_images?: PublishedCarImageRow[] | null;
  car_variants?: PublishedVariantRow[] | null;
};

const DRIVES = ["Forhjulsdrift", "Bakhjulsdrift", "Firehjulsdrift"] as const;

const PUBLISHED_CAR_COLUMNS_BASE = [
  "id",
  "slug",
  "brand",
  "model",
  "year",
  "price_nok",
  "range_km",
  "battery_kwh",
  "dc_charging_kw",
  "drivetrain",
  "image_url",
  "description",
  "updated_at",
  "consumption_kwh_100km",
  "power_hp",
  "torque_nm",
  "acceleration_0_100",
  "top_speed_kmh",
  "seats",
  "cargo_l",
  "towing_kg",
  "warranty",
  "ac_charging_kw",
  "vehicle_type",
  "body_style",
  "source_name",
  "source_url",
  "data_last_checked_at",
] as const;

const PUBLISHED_VARIANT_COLUMNS = [
  "id",
  "name",
  "slug",
  "trim_level",
  "model_year",
  "price_nok",
  "battery_total_kwh",
  "battery_usable_kwh",
  "range_km",
  "winter_range_km",
  "real_world_range_km",
  "consumption_kwh_100km",
  "ac_charging_kw",
  "dc_charging_kw",
  "charge_time_10_80_minutes",
  "drivetrain",
  "power_hp",
  "torque_nm",
  "acceleration_0_100",
  "top_speed_kmh",
  "towing_kg",
  "curb_weight_kg",
  "is_default",
  "is_active",
  "sort_order",
  "source_name",
  "source_url",
  "data_last_checked_at",
].join(", ");

const PUBLISHED_CAR_SCORE_COLUMNS = [
  "range_score",
  "charging_score",
  "winter_score",
  "comfort_score",
  "space_score",
  "value_score",
  "reliability_score",
  "overall_score",
  "score_notes",
  "score_methodology",
] as const;

const PUBLISHED_CAR_MASTER_COLUMNS = [
  "variant",
  "trim_level",
  "model_generation",
  "battery_total_kwh",
  "battery_usable_kwh",
  "battery_chemistry",
  "winter_range_km",
  "real_world_range_km",
  "charge_time_10_80_minutes",
  "charging_connector_ac",
  "charging_connector_dc",
  "length_mm",
  "width_mm",
  "height_mm",
  "wheelbase_mm",
  "curb_weight_kg",
  "gross_weight_kg",
  "frunk_l",
  "heat_pump",
  "v2l",
  "v2g",
  "apple_carplay",
  "android_auto",
  "head_up_display",
  "panoramic_roof",
  "ota_updates",
  "pros",
  "cons",
  "suitable_for",
] as const;

const PUBLISHED_CAR_COLUMNS = [
  ...PUBLISHED_CAR_COLUMNS_BASE,
  ...PUBLISHED_CAR_SCORE_COLUMNS,
  ...PUBLISHED_CAR_MASTER_COLUMNS,
].join(", ");

/** Scores but no master EV fields (fallback before master migration). */
const PUBLISHED_CAR_COLUMNS_SCORES = [
  ...PUBLISHED_CAR_COLUMNS_BASE,
  ...PUBLISHED_CAR_SCORE_COLUMNS,
].join(", ");

/** Columns without score / master fields (oldest fallback). */
const PUBLISHED_CAR_COLUMNS_LEGACY = PUBLISHED_CAR_COLUMNS_BASE.join(", ");

const GALLERY_EMBED =
  "car_images(id, image_url, image_type, alt_text, sort_order, is_primary)";
const VARIANT_EMBED = `car_variants(${PUBLISHED_VARIANT_COLUMNS})`;
const PUBLISHED_CAR_SELECT = `${PUBLISHED_CAR_COLUMNS}, ${GALLERY_EMBED}, ${VARIANT_EMBED}`;
const PUBLISHED_CAR_SELECT_NO_VARIANTS = `${PUBLISHED_CAR_COLUMNS}, ${GALLERY_EMBED}`;
const PUBLISHED_CAR_SELECT_SCORES = `${PUBLISHED_CAR_COLUMNS_SCORES}, ${GALLERY_EMBED}`;
const PUBLISHED_CAR_SELECT_LEGACY = `${PUBLISHED_CAR_COLUMNS_LEGACY}, ${GALLERY_EMBED}`;
const PUBLISHED_CAR_SELECT_WITH_VARIANTS_NO_MASTER = `${PUBLISHED_CAR_COLUMNS_SCORES}, ${GALLERY_EMBED}, ${VARIANT_EMBED}`;

function toStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.map((item) => String(item).trim()).filter(Boolean);
  return items.length > 0 ? items : null;
}

function mapDrive(drivetrain: string | null): Car["drive"] {
  if (drivetrain && (DRIVES as readonly string[]).includes(drivetrain)) {
    return drivetrain as Car["drive"];
  }
  return "Forhjulsdrift";
}

function formatUpdated(updatedAt: string): string {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return updatedAt;
  }
  return date.toLocaleDateString("nb-NO");
}

function toNumberOrNull(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapGalleryImages(rows: PublishedCarImageRow[] | null | undefined): CarGalleryImage[] {
  if (!rows?.length) return [];

  return [...rows]
    .sort((a, b) => {
      // Public three-image standard: Front → Interior → Rear, then others.
      const typeRank = (type: string | null | undefined) => {
        if (type === "front") return 0;
        if (type === "interior") return 1;
        if (type === "rear") return 2;
        return 50;
      };
      const rankDiff = typeRank(a.image_type) - typeRank(b.image_type);
      if (rankDiff !== 0) return rankDiff;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id.localeCompare(b.id);
    })
    .map((row) => {
      const imageType: CarImageType = isCarImageType(row.image_type)
        ? row.image_type
        : "other";
      return {
        id: row.id,
        imageUrl: row.image_url,
        imageType,
        altText: row.alt_text,
        sortOrder: row.sort_order,
        isPrimary: Boolean(row.is_primary),
      };
    });
}

export function mapPublishedVariant(row: PublishedVariantRow): CarVariant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    trimLevel: row.trim_level ?? null,
    modelYear: row.model_year ?? null,
    priceNok: row.price_nok ?? null,
    batteryTotalKwh: toNumberOrNull(row.battery_total_kwh),
    batteryUsableKwh: toNumberOrNull(row.battery_usable_kwh),
    rangeKm: row.range_km ?? null,
    winterRangeKm: row.winter_range_km ?? null,
    realWorldRangeKm: row.real_world_range_km ?? null,
    consumptionKwh100km: toNumberOrNull(row.consumption_kwh_100km),
    acKw: toNumberOrNull(row.ac_charging_kw),
    dcKw: row.dc_charging_kw ?? null,
    chargeTime1080Minutes: row.charge_time_10_80_minutes ?? null,
    drive: mapDriveOrNull(row.drivetrain),
    powerHp: row.power_hp ?? null,
    torqueNm: row.torque_nm ?? null,
    acceleration0100: toNumberOrNull(row.acceleration_0_100),
    topSpeedKmh: row.top_speed_kmh ?? null,
    towingKg: row.towing_kg ?? null,
    curbWeightKg: row.curb_weight_kg ?? null,
    isDefault: Boolean(row.is_default),
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order ?? 0,
    sourceName: row.source_name ?? null,
    sourceUrl: row.source_url ?? null,
    dataLastCheckedAt: row.data_last_checked_at
      ? formatUpdated(row.data_last_checked_at)
      : null,
  };
}

function mapPublishedVariants(
  rows: PublishedVariantRow[] | null | undefined,
): CarVariant[] {
  if (!rows?.length) return [];
  return [...rows]
    .filter((row) => row.is_active !== false)
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.name.localeCompare(b.name, "nb");
    })
    .map(mapPublishedVariant);
}

export function mapPublishedCar(row: PublishedCarRow): Car {
  const acKw = toNumberOrNull(row.ac_charging_kw);
  const images = mapGalleryImages(row.car_images);
  const primary = images.find((image) => image.isPrimary) ?? images[0];
  const variants = mapPublishedVariants(row.car_variants);

  return {
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    year: row.year ?? null,
    priceNok: row.price_nok ?? 0,
    rangeKm: row.range_km ?? 0,
    batteryKwh: Number(row.battery_kwh ?? 0),
    dcKw: row.dc_charging_kw ?? 0,
    acKw: acKw ?? 11,
    drive: mapDrive(row.drivetrain),
    description: row.description ?? "",
    updated: formatUpdated(row.updated_at),
    imageUrl: primary?.imageUrl ?? row.image_url,
    images,
    sourceName: row.source_name ?? null,
    sourceUrl: row.source_url ?? null,
    dataLastCheckedAt: row.data_last_checked_at
      ? formatUpdated(row.data_last_checked_at)
      : null,
    consumptionKwh100km: toNumberOrNull(row.consumption_kwh_100km),
    powerHp: row.power_hp ?? null,
    torqueNm: row.torque_nm ?? null,
    acceleration0100: toNumberOrNull(row.acceleration_0_100),
    topSpeedKmh: row.top_speed_kmh ?? null,
    seats: row.seats ?? null,
    cargoL: row.cargo_l ?? null,
    towingKg: row.towing_kg ?? null,
    warranty: row.warranty ?? null,
    vehicleType: row.vehicle_type ?? null,
    bodyStyle: row.body_style ?? null,
    variant: row.variant ?? null,
    trimLevel: row.trim_level ?? null,
    modelGeneration: row.model_generation ?? null,
    batteryTotalKwh: toNumberOrNull(row.battery_total_kwh),
    batteryUsableKwh: toNumberOrNull(row.battery_usable_kwh),
    batteryChemistry: row.battery_chemistry ?? null,
    winterRangeKm: row.winter_range_km ?? null,
    realWorldRangeKm: row.real_world_range_km ?? null,
    chargeTime1080Minutes: row.charge_time_10_80_minutes ?? null,
    chargingConnectorAc: row.charging_connector_ac ?? null,
    chargingConnectorDc: row.charging_connector_dc ?? null,
    lengthMm: row.length_mm ?? null,
    widthMm: row.width_mm ?? null,
    heightMm: row.height_mm ?? null,
    wheelbaseMm: row.wheelbase_mm ?? null,
    curbWeightKg: row.curb_weight_kg ?? null,
    grossWeightKg: row.gross_weight_kg ?? null,
    frunkL: row.frunk_l ?? null,
    heatPump: row.heat_pump ?? null,
    v2l: row.v2l ?? null,
    v2g: row.v2g ?? null,
    appleCarplay: row.apple_carplay ?? null,
    androidAuto: row.android_auto ?? null,
    headUpDisplay: row.head_up_display ?? null,
    panoramicRoof: row.panoramic_roof ?? null,
    otaUpdates: row.ota_updates ?? null,
    pros: toStringArray(row.pros),
    cons: toStringArray(row.cons),
    suitableFor: toStringArray(row.suitable_for),
    rangeScore: toNumberOrNull(row.range_score),
    chargingScore: toNumberOrNull(row.charging_score),
    winterScore: toNumberOrNull(row.winter_score),
    comfortScore: toNumberOrNull(row.comfort_score),
    spaceScore: toNumberOrNull(row.space_score),
    valueScore: toNumberOrNull(row.value_score),
    reliabilityScore: toNumberOrNull(row.reliability_score),
    overallScore: toNumberOrNull(row.overall_score),
    scoreNotes: row.score_notes ?? null,
    scoreMethodology: row.score_methodology ?? null,
    variants,
    selectedVariantSlug: null,
  };
}

/** Map DB row and overlay default variant for list/card headline specs. */
export function mapPublishedCarForListing(row: PublishedCarRow): Car {
  return withDefaultVariantSpecs(mapPublishedCar(row));
}

/** Published cars for public pages. Returns [] if Supabase is unavailable. */
export async function getPublishedCars(): Promise<Car[]> {
  if (!getSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    let { data, error } = await supabase
      .from("cars")
      .select(PUBLISHED_CAR_SELECT)
      .eq("is_published", true)
      .order("brand", { ascending: true })
      .order("model", { ascending: true });

    // Fallbacks when newer columns / gallery / variants are not migrated yet.
    if (error) {
      console.warn("[cars] getPublishedCars select failed, falling back:", error.message);
      const noVariants = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_SELECT_NO_VARIANTS)
        .eq("is_published", true)
        .order("brand", { ascending: true })
        .order("model", { ascending: true });
      data = noVariants.data as typeof data;
      error = noVariants.error;
    }
    if (error) {
      const withVariantsNoMaster = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_SELECT_WITH_VARIANTS_NO_MASTER)
        .eq("is_published", true)
        .order("brand", { ascending: true })
        .order("model", { ascending: true });
      data = withVariantsNoMaster.data as typeof data;
      error = withVariantsNoMaster.error;
    }
    if (error) {
      const scoresOnly = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_SELECT_SCORES)
        .eq("is_published", true)
        .order("brand", { ascending: true })
        .order("model", { ascending: true });
      data = scoresOnly.data as typeof data;
      error = scoresOnly.error;
    }
    if (error) {
      const legacyGallery = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_SELECT_LEGACY)
        .eq("is_published", true)
        .order("brand", { ascending: true })
        .order("model", { ascending: true });
      data = legacyGallery.data as typeof data;
      error = legacyGallery.error;
    }
    if (error) {
      const legacy = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_COLUMNS_LEGACY)
        .eq("is_published", true)
        .order("brand", { ascending: true })
        .order("model", { ascending: true });
      data = legacy.data as typeof data;
      error = legacy.error;
    }

    if (error || !data) {
      console.error("[cars] getPublishedCars failed:", error?.message);
      return [];
    }

    // Return base car + variants; list/card UIs overlay the default variant.
    return data.map((row) => mapPublishedCar(row as unknown as PublishedCarRow));
  } catch (error) {
    console.error("[cars] getPublishedCars exception:", error);
    return [];
  }
}

export async function getPublishedCarBySlug(slug: string): Promise<Car | null> {
  if (!slug || !getSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    let { data, error } = await supabase
      .from("cars")
      .select(PUBLISHED_CAR_SELECT)
      .eq("is_published", true)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.warn(
        "[cars] getPublishedCarBySlug select failed, falling back:",
        error.message,
      );
      const noVariants = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_SELECT_NO_VARIANTS)
        .eq("is_published", true)
        .eq("slug", slug)
        .maybeSingle();
      data = noVariants.data as typeof data;
      error = noVariants.error;
    }
    if (error) {
      const withVariantsNoMaster = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_SELECT_WITH_VARIANTS_NO_MASTER)
        .eq("is_published", true)
        .eq("slug", slug)
        .maybeSingle();
      data = withVariantsNoMaster.data as typeof data;
      error = withVariantsNoMaster.error;
    }
    if (error) {
      const scoresOnly = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_SELECT_SCORES)
        .eq("is_published", true)
        .eq("slug", slug)
        .maybeSingle();
      data = scoresOnly.data as typeof data;
      error = scoresOnly.error;
    }
    if (error) {
      const legacyGallery = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_SELECT_LEGACY)
        .eq("is_published", true)
        .eq("slug", slug)
        .maybeSingle();
      data = legacyGallery.data as typeof data;
      error = legacyGallery.error;
    }
    if (error) {
      const legacy = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_COLUMNS_LEGACY)
        .eq("is_published", true)
        .eq("slug", slug)
        .maybeSingle();
      data = legacy.data as typeof data;
      error = legacy.error;
    }

    if (error) {
      console.error("[cars] getPublishedCarBySlug failed:", error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    // Keep base fields; detail page overlays the requested/default variant.
    return mapPublishedCar(data as unknown as PublishedCarRow);
  } catch (error) {
    console.error("[cars] getPublishedCarBySlug exception:", error);
    return null;
  }
}

export async function publishedCarExists(slug: string): Promise<boolean> {
  const car = await getPublishedCarBySlug(slug);
  return Boolean(car);
}

/** Published cars for a brand page (by brand_id, with name fallback for legacy rows). */
export async function getPublishedCarsForBrand(input: {
  brandId: string;
  brandName: string;
}): Promise<Car[]> {
  if (!input.brandId || !getSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const select = PUBLISHED_CAR_SELECT;

    const linked = await supabase
      .from("cars")
      .select(select)
      .eq("is_published", true)
      .eq("brand_id", input.brandId)
      .order("model", { ascending: true });

    let linkedRows = linked.data;
    let brandSelect = select;
    if (linked.error) {
      console.warn(
        "[cars] getPublishedCarsForBrand linked select failed, falling back:",
        linked.error.message,
      );
      brandSelect = PUBLISHED_CAR_SELECT_SCORES;
      const fallback = await supabase
        .from("cars")
        .select(brandSelect)
        .eq("is_published", true)
        .eq("brand_id", input.brandId)
        .order("model", { ascending: true });
      if (fallback.error) {
        console.error("[cars] getPublishedCarsForBrand failed:", fallback.error.message);
        return [];
      }
      linkedRows = fallback.data;
    }

    const legacy = await supabase
      .from("cars")
      .select(brandSelect)
      .eq("is_published", true)
      .is("brand_id", null)
      .eq("brand", input.brandName)
      .order("model", { ascending: true });

    if (legacy.error) {
      console.warn("[cars] getPublishedCarsForBrand legacy select failed:", legacy.error.message);
    }

    const bySlug = new Map<string, PublishedCarRow>();
    for (const row of linkedRows ?? []) {
      const mapped = row as unknown as PublishedCarRow;
      bySlug.set(mapped.slug, mapped);
    }
    for (const row of legacy.data ?? []) {
      const mapped = row as unknown as PublishedCarRow;
      if (!bySlug.has(mapped.slug)) {
        bySlug.set(mapped.slug, mapped);
      }
    }

    return [...bySlug.values()]
      .sort((a, b) => a.model.localeCompare(b.model, "nb"))
      .map((row) => mapPublishedCar(row));
  } catch (error) {
    console.error("[cars] getPublishedCarsForBrand exception:", error);
    return [];
  }
}
