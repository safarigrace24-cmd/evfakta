import "server-only";

import type { AdminBrand } from "@/lib/admin/brand-types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export async function listAdminBrands(): Promise<AdminBrand[]> {
  if (!getServiceRoleKey() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[admin] listAdminBrands failed:", error.message);
      return [];
    }

    return (data ?? []) as AdminBrand[];
  } catch (error) {
    console.error("[admin] listAdminBrands exception:", error);
    return [];
  }
}

export async function listActiveAdminBrands(): Promise<AdminBrand[]> {
  const brands = await listAdminBrands();
  return brands.filter((brand) => brand.is_active);
}

export async function getAdminBrandById(id: string): Promise<AdminBrand | null> {
  if (!id || !getServiceRoleKey() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[admin] getAdminBrandById failed:", error.message);
      return null;
    }

    return (data as AdminBrand | null) ?? null;
  } catch (error) {
    console.error("[admin] getAdminBrandById exception:", error);
    return null;
  }
}
