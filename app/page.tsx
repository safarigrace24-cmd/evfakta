import type { Metadata } from "next";
import HeroSection from "@/components/home/hero-section";
import PopularModelsSection from "@/components/home/popular-models-section";
import PopularBrandsSection from "@/components/home/popular-brands-section";
import KeyMetricsSection from "@/components/home/key-metrics-section";
import ChargingExplainerSection from "@/components/home/charging-explainer-section";
import HomeFaqSection from "@/components/home/home-faq-section";
import AboutSection from "@/components/home/about-section";
import PlatformHubSection from "@/components/home/platform-hub-section";
import FeaturesSection from "@/components/home/features-section";
import TrustSection from "@/components/home/trust-section";
import { getAuthUser } from "@/lib/auth/get-user";
import { getActiveBrands } from "@/lib/brands/get-active-brands";
import { getPublishedCars } from "@/lib/cars/get-published-cars";
import { getFavoriteSlugs } from "@/lib/favorites/get-favorites";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "EVFAKTA – Finn riktig elbil basert på fakta",
    description: siteConfig.description,
  },
};

export default async function HomePage() {
  const [user, favoriteSlugs, cars, brands] = await Promise.all([
    getAuthUser(),
    getFavoriteSlugs(),
    getPublishedCars(),
    getActiveBrands(),
  ]);

  const brandCounts = new Map<string, number>();
  for (const car of cars) {
    const key = car.brand.trim().toLowerCase();
    brandCounts.set(key, (brandCounts.get(key) ?? 0) + 1);
  }

  const brandsWithModels = brands
    .map((brand) => ({
      ...brand,
      modelCount: brandCounts.get(brand.name.trim().toLowerCase()) ?? 0,
    }))
    .filter((brand) => brand.modelCount > 0)
    .sort((a, b) => b.modelCount - a.modelCount || a.name.localeCompare(b.name, "nb"))
    .slice(0, 8);

  const brandsWithPublished = brandsWithModels.length;
  const popularCars = cars.slice(0, 6);

  return (
    <div className="homePage">
      <HeroSection modelCount={cars.length} brandCount={brandsWithPublished} />
      <PlatformHubSection />
      <PopularModelsSection
        cars={popularCars}
        isLoggedIn={Boolean(user)}
        favoriteSlugs={favoriteSlugs}
      />
      <KeyMetricsSection />
      <PopularBrandsSection brands={brandsWithModels} />
      <ChargingExplainerSection />
      <FeaturesSection />
      <HomeFaqSection />
      <AboutSection />
      <TrustSection />
    </div>
  );
}
