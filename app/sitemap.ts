import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.evfakta.no";
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/modeller`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/merker`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/sammenlign`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const supabase = createPublicClient();
  if (!supabase) return staticRoutes;

  const [carsResult, brandsResult] = await Promise.all([
    supabase.from("cars").select("slug").eq("is_published", true),
    supabase.from("brands").select("slug").eq("is_active", true),
  ]);

  const carRoutes = (carsResult.data ?? []).map((car) => ({
    url: `${base}/modeller/${car.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const brandRoutes = (brandsResult.data ?? []).map((brand) => ({
    url: `${base}/merker/${brand.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...carRoutes, ...brandRoutes];
}
