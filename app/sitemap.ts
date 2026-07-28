import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

/**
 * Indexable public routes only.
 * Unfinished / noindex tools (/kalkulator, /rimeligste, /verktoy, /testdata, /ladekart)
 * stay reachable but are excluded until launch-ready.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/modeller`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/sammenlign`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/bruktbil`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/info`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/merker`, changeFrequency: "weekly", priority: 0.5 },
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
