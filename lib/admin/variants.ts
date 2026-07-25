import "server-only";

import type { AdminCarVariant } from "@/lib/admin/variant-types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export async function listAdminCarVariants(carId: string): Promise<AdminCarVariant[]> {
  if (!carId || !getServiceRoleKey() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("car_variants")
      .select("*")
      .eq("car_id", carId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("[admin] listAdminCarVariants failed:", error.message);
      return [];
    }

    return (data ?? []) as AdminCarVariant[];
  } catch (error) {
    console.error("[admin] listAdminCarVariants exception:", error);
    return [];
  }
}

export async function getAdminCarVariantById(
  id: string,
): Promise<AdminCarVariant | null> {
  if (!id || !getServiceRoleKey() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("car_variants")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[admin] getAdminCarVariantById failed:", error.message);
      return null;
    }

    return (data as AdminCarVariant | null) ?? null;
  } catch (error) {
    console.error("[admin] getAdminCarVariantById exception:", error);
    return null;
  }
}
