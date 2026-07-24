import "server-only";

import type { AdminCar } from "@/lib/admin/types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type AdminCarStats = {
  total: number;
  published: number;
  drafts: number;
};

export async function listAdminCars(): Promise<AdminCar[]> {
  if (!getServiceRoleKey() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[admin] listAdminCars failed:", error.message);
      return [];
    }

    return (data ?? []) as AdminCar[];
  } catch (error) {
    console.error("[admin] listAdminCars exception:", error);
    return [];
  }
}

export async function getAdminCarById(id: string): Promise<AdminCar | null> {
  if (!id || !getServiceRoleKey() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[admin] getAdminCarById failed:", error.message);
      return null;
    }

    return (data as AdminCar | null) ?? null;
  } catch (error) {
    console.error("[admin] getAdminCarById exception:", error);
    return null;
  }
}

export async function getAdminCarStats(): Promise<AdminCarStats> {
  const cars = await listAdminCars();
  const published = cars.filter((car) => car.is_published).length;
  return {
    total: cars.length,
    published,
    drafts: cars.length - published,
  };
}
