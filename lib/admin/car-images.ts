import "server-only";

import type { CarImageRow } from "@/lib/admin/car-image-types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export async function listAdminCarImages(carId: string): Promise<CarImageRow[]> {
  if (!carId || !getServiceRoleKey() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("car_images")
      .select("*")
      .eq("car_id", carId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[admin] listAdminCarImages failed:", error.message);
      return [];
    }

    return (data ?? []) as CarImageRow[];
  } catch (error) {
    console.error("[admin] listAdminCarImages exception:", error);
    return [];
  }
}
