import { getAuthUser } from "@/lib/auth/get-user";
import { getPublishedCars } from "@/lib/cars/get-published-cars";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Car } from "@/data/cars";

export type FavoriteRow = {
  car_slug: string;
  created_at: string;
};

/** Returns favorite car slugs for the current user, or [] if unavailable. */
export async function getFavoriteSlugs(): Promise<string[]> {
  if (!getSupabaseEnv()) {
    return [];
  }

  try {
    const user = await getAuthUser();
    if (!user) {
      return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("favorites")
      .select("car_slug")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row) => row.car_slug as string);
  } catch {
    return [];
  }
}

/** Favorite cars that still exist as published models (skips missing/unpublished slugs). */
export async function getFavoriteCars(): Promise<Car[]> {
  const slugs = await getFavoriteSlugs();
  if (slugs.length === 0) {
    return [];
  }

  const published = await getPublishedCars();
  const bySlug = new Map(published.map((car) => [car.slug, car]));

  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((car): car is Car => Boolean(car));
}

export async function isFavoriteSlug(carSlug: string): Promise<boolean> {
  if (!getSupabaseEnv()) {
    return false;
  }

  try {
    const user = await getAuthUser();
    if (!user) {
      return false;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("car_slug", carSlug)
      .maybeSingle();

    if (error) {
      return false;
    }

    return Boolean(data);
  } catch {
    return false;
  }
}
