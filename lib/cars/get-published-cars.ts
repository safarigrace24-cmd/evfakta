import type { Car, CarGalleryImage } from "@/data/cars";
import { isCarImageType, type CarImageType } from "@/lib/admin/car-image-types";
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

type PublishedCarRow = {
  slug: string;
  brand: string;
  model: string;
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
  car_images?: PublishedCarImageRow[] | null;
};

const DRIVES = ["Forhjulsdrift", "Bakhjulsdrift", "Firehjulsdrift"] as const;

const PUBLISHED_CAR_COLUMNS = [
  "slug",
  "brand",
  "model",
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
].join(", ");

const PUBLISHED_CAR_SELECT = `${PUBLISHED_CAR_COLUMNS}, car_images(id, image_url, image_type, alt_text, sort_order, is_primary)`;

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

export function mapPublishedCar(row: PublishedCarRow): Car {
  const acKw = toNumberOrNull(row.ac_charging_kw);
  const images = mapGalleryImages(row.car_images);
  const primary = images.find((image) => image.isPrimary) ?? images[0];

  return {
    slug: row.slug,
    brand: row.brand,
    model: row.model,
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
  };
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

    // Fallback before car_images migration is applied.
    if (error) {
      console.warn("[cars] getPublishedCars gallery select failed, falling back:", error.message);
      ({ data, error } = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_COLUMNS)
        .eq("is_published", true)
        .order("brand", { ascending: true })
        .order("model", { ascending: true }));
    }

    if (error || !data) {
      console.error("[cars] getPublishedCars failed:", error?.message);
      return [];
    }

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
        "[cars] getPublishedCarBySlug gallery select failed, falling back:",
        error.message,
      );
      ({ data, error } = await supabase
        .from("cars")
        .select(PUBLISHED_CAR_COLUMNS)
        .eq("is_published", true)
        .eq("slug", slug)
        .maybeSingle());
    }

    if (error) {
      console.error("[cars] getPublishedCarBySlug failed:", error.message);
      return null;
    }

    if (!data) {
      return null;
    }

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
