import "server-only";

import type { CarImageRow } from "@/lib/admin/car-image-types";
import { listAdminBrands } from "@/lib/admin/brands";
import { listAdminCars } from "@/lib/admin/cars";
import { loadImageCandidatesByCarIds } from "@/lib/admin/image-review-data";
import {
  computeProductionBrandRows,
  computeProductionDashboardStats,
  computeProductionModelRow,
  type ProductionBrandRow,
  type ProductionDashboardStats,
  type ProductionModelRow,
} from "@/lib/admin/production-dashboard";
import type { ResearchImageCandidate } from "@/lib/admin/research/types";
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
  candidatesByCar: Map<string, ResearchImageCandidate[]>;
}> {
  const imagesByCar = new Map<string, CarImageRow[]>();
  const variantsByCar = new Map<string, AdminCarVariant[]>();
  const candidatesByCar = new Map<string, ResearchImageCandidate[]>();

  if (
    carIds.length === 0 ||
    !getServiceRoleKey() ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    return { imagesByCar, variantsByCar, candidatesByCar };
  }

  try {
    const supabase = createAdminClient();

    const [{ data: images }, { data: variants }, candidatesMap] =
      await Promise.all([
        supabase.from("car_images").select("*").in("car_id", carIds),
        supabase.from("car_variants").select("*").in("car_id", carIds),
        loadImageCandidatesByCarIds(carIds),
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

    for (const [carId, candidates] of candidatesMap) {
      candidatesByCar.set(carId, candidates);
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

  const models = cars.map((car) => {
    const imageCandidates = candidatesByCar.get(car.id) ?? [];
    return computeProductionModelRow({
      car,
      images: imagesByCar.get(car.id) ?? [],
      variants: variantsByCar.get(car.id) ?? [],
      imageCandidates,
      imageCandidateCount: imageCandidates.length,
    });
  });

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
