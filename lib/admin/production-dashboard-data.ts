import "server-only";

import type { CarImageRow } from "@/lib/admin/car-image-types";
import { listAdminBrands } from "@/lib/admin/brands";
import { listAdminCars } from "@/lib/admin/cars";
import {
  computeProductionBrandRows,
  computeProductionDashboardStats,
  computeProductionModelRow,
  type ProductionBrandRow,
  type ProductionDashboardStats,
  type ProductionModelRow,
} from "@/lib/admin/production-dashboard";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";
import type { AdminCarVariant } from "@/lib/admin/variant-types";

export type ProductionDashboardPayload = {
  stats: ProductionDashboardStats;
  brands: ProductionBrandRow[];
  models: ProductionModelRow[];
  brandNames: string[];
};

async function loadRelatedMaps(carIds: string[]): Promise<{
  imagesByCar: Map<string, CarImageRow[]>;
  variantsByCar: Map<string, AdminCarVariant[]>;
  candidatesByCar: Map<string, number>;
}> {
  const imagesByCar = new Map<string, CarImageRow[]>();
  const variantsByCar = new Map<string, AdminCarVariant[]>();
  const candidatesByCar = new Map<string, number>();

  if (
    carIds.length === 0 ||
    !getServiceRoleKey() ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    return { imagesByCar, variantsByCar, candidatesByCar };
  }

  try {
    const supabase = createAdminClient();

    const [{ data: images }, { data: variants }, { data: items }] =
      await Promise.all([
        supabase.from("car_images").select("*").in("car_id", carIds),
        supabase.from("car_variants").select("*").in("car_id", carIds),
        supabase
          .from("research_items")
          .select("id, existing_car_id")
          .in("existing_car_id", carIds),
      ]);

    for (const image of (images ?? []) as CarImageRow[]) {
      const list = imagesByCar.get(image.car_id) ?? [];
      list.push(image);
      imagesByCar.set(image.car_id, list);
    }

    for (const variant of (variants ?? []) as AdminCarVariant[]) {
      const list = variantsByCar.get(variant.car_id) ?? [];
      list.push(variant);
      variantsByCar.set(variant.car_id, list);
    }

    const itemIds = (items ?? [])
      .map((item) => item.id as string)
      .filter(Boolean);
    const itemToCar = new Map(
      (items ?? [])
        .filter((item) => item.existing_car_id && item.id)
        .map((item) => [item.id as string, item.existing_car_id as string]),
    );

    if (itemIds.length > 0) {
      const { data: candidates } = await supabase
        .from("research_image_candidates")
        .select("item_id")
        .in("item_id", itemIds);

      for (const candidate of candidates ?? []) {
        const carId = itemToCar.get(candidate.item_id as string);
        if (!carId) continue;
        candidatesByCar.set(carId, (candidatesByCar.get(carId) ?? 0) + 1);
      }
    }
  } catch (error) {
    console.error("[admin] production dashboard related load failed:", error);
  }

  return { imagesByCar, variantsByCar, candidatesByCar };
}

export async function loadProductionDashboard(): Promise<ProductionDashboardPayload> {
  const [cars, brandRecords] = await Promise.all([
    listAdminCars(),
    listAdminBrands(),
  ]);

  const carIds = cars.map((car) => car.id);
  const { imagesByCar, variantsByCar, candidatesByCar } =
    await loadRelatedMaps(carIds);

  const models = cars.map((car) =>
    computeProductionModelRow({
      car,
      images: imagesByCar.get(car.id) ?? [],
      variants: variantsByCar.get(car.id) ?? [],
      imageCandidateCount: candidatesByCar.get(car.id) ?? 0,
    }),
  );

  const brandNames = [
    ...new Set([
      ...brandRecords.map((brand) => brand.name),
      ...models.map((model) => model.brand),
    ]),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const brands = computeProductionBrandRows(models);
  const stats = computeProductionDashboardStats(
    models,
    brandNames.length || brands.length,
  );

  return { stats, brands, models, brandNames };
}
