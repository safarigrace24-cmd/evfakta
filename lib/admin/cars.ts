import "server-only";

import type { AdminCar } from "@/lib/admin/types";
import { getPublishIssues } from "@/lib/admin/publish-readiness";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type AdminCarStats = {
  total: number;
  published: number;
  drafts: number;
  needsReview: number;
  approved: number;
  missingImages: number;
  missingSource: number;
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

export function computeAdminCarStats(cars: AdminCar[]): AdminCarStats {
  const published = cars.filter((car) => car.is_published).length;
  const needsReview = cars.filter((car) => car.import_status === "needs_review").length;
  const approved = cars.filter((car) => car.import_status === "approved").length;
  const drafts = cars.filter(
    (car) => !car.is_published && (car.import_status === "draft" || !car.import_status),
  ).length;

  let missingImages = 0;
  let missingSource = 0;

  for (const car of cars) {
    const issues = getPublishIssues(car);
    if (issues.some((issue) => issue.code === "image")) missingImages += 1;
    if (issues.some((issue) => issue.code === "source")) missingSource += 1;
  }

  return {
    total: cars.length,
    published,
    drafts,
    needsReview,
    approved,
    missingImages,
    missingSource,
  };
}

export async function getAdminCarStats(): Promise<AdminCarStats> {
  const cars = await listAdminCars();
  return computeAdminCarStats(cars);
}
