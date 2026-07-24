import type { Car } from "@/data/cars";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

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
};

const DRIVES = ["Forhjulsdrift", "Bakhjulsdrift", "Firehjulsdrift"] as const;

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

export function mapPublishedCar(row: PublishedCarRow): Car {
  return {
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    priceNok: row.price_nok ?? 0,
    rangeKm: row.range_km ?? 0,
    batteryKwh: Number(row.battery_kwh ?? 0),
    dcKw: row.dc_charging_kw ?? 0,
    acKw: 11,
    drive: mapDrive(row.drivetrain),
    description: row.description ?? "",
    updated: formatUpdated(row.updated_at),
    imageUrl: row.image_url,
  };
}

/** Published cars for public pages. Returns [] if Supabase is unavailable. */
export async function getPublishedCars(): Promise<Car[]> {
  if (!getSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cars")
      .select(
        "slug, brand, model, price_nok, range_km, battery_kwh, dc_charging_kw, drivetrain, image_url, description, updated_at",
      )
      .eq("is_published", true)
      .order("brand", { ascending: true })
      .order("model", { ascending: true });

    if (error || !data) {
      console.error("[cars] getPublishedCars failed:", error?.message);
      return [];
    }

    return data.map((row) => mapPublishedCar(row as PublishedCarRow));
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
    const { data, error } = await supabase
      .from("cars")
      .select(
        "slug, brand, model, price_nok, range_km, battery_kwh, dc_charging_kw, drivetrain, image_url, description, updated_at",
      )
      .eq("is_published", true)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("[cars] getPublishedCarBySlug failed:", error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapPublishedCar(data as PublishedCarRow);
  } catch (error) {
    console.error("[cars] getPublishedCarBySlug exception:", error);
    return null;
  }
}

export async function publishedCarExists(slug: string): Promise<boolean> {
  const car = await getPublishedCarBySlug(slug);
  return Boolean(car);
}
