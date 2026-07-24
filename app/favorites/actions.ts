"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/get-user";
import { publishedCarExists } from "@/lib/cars/get-published-cars";
import { FAVORITE_MESSAGES } from "@/lib/favorites/messages";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type FavoriteActionResult =
  | { ok: true; message: string; isFavorite: boolean }
  | { ok: false; error: string };

function revalidateFavoritePaths(carSlug: string) {
  revalidatePath("/min-side");
  revalidatePath("/modeller");
  revalidatePath(`/modeller/${carSlug}`);
  revalidatePath("/");
}

export async function addFavorite(carSlug: string): Promise<FavoriteActionResult> {
  if (!carSlug || typeof carSlug !== "string") {
    return { ok: false, error: FAVORITE_MESSAGES.invalidCar };
  }

  if (!(await publishedCarExists(carSlug))) {
    return { ok: false, error: FAVORITE_MESSAGES.invalidCar };
  }

  if (!getSupabaseEnv()) {
    return { ok: false, error: FAVORITE_MESSAGES.unavailable };
  }

  try {
    const user = await getAuthUser();
    if (!user) {
      return { ok: false, error: FAVORITE_MESSAGES.loginRequired };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      car_slug: carSlug,
    });

    if (error) {
      // Unique violation: already favorited — treat as success.
      if (error.code === "23505") {
        revalidateFavoritePaths(carSlug);
        return {
          ok: true,
          message: FAVORITE_MESSAGES.addSuccess,
          isFavorite: true,
        };
      }

      return { ok: false, error: FAVORITE_MESSAGES.genericError };
    }

    revalidateFavoritePaths(carSlug);
    return {
      ok: true,
      message: FAVORITE_MESSAGES.addSuccess,
      isFavorite: true,
    };
  } catch {
    return { ok: false, error: FAVORITE_MESSAGES.unavailable };
  }
}

export async function removeFavorite(carSlug: string): Promise<FavoriteActionResult> {
  if (!carSlug || typeof carSlug !== "string") {
    return { ok: false, error: FAVORITE_MESSAGES.invalidCar };
  }

  if (!getSupabaseEnv()) {
    return { ok: false, error: FAVORITE_MESSAGES.unavailable };
  }

  try {
    const user = await getAuthUser();
    if (!user) {
      return { ok: false, error: FAVORITE_MESSAGES.loginRequired };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("car_slug", carSlug);

    if (error) {
      return { ok: false, error: FAVORITE_MESSAGES.genericError };
    }

    revalidateFavoritePaths(carSlug);
    return {
      ok: true,
      message: FAVORITE_MESSAGES.removeSuccess,
      isFavorite: false,
    };
  } catch {
    return { ok: false, error: FAVORITE_MESSAGES.unavailable };
  }
}
