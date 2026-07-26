import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "@/components/home/features-section";
import PopularModelsSection from "@/components/home/popular-models-section";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPublishedCars } from "@/lib/cars/get-published-cars";
import { getFavoriteSlugs } from "@/lib/favorites/get-favorites";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, favoriteSlugs, cars] = await Promise.all([
    getAuthUser(),
    getFavoriteSlugs(),
    getPublishedCars(),
  ]);

  return (
    <>
      <HeroSection modelCount={cars.length} />
      <PopularModelsSection
        cars={cars.slice(0, 6)}
        totalCount={cars.length}
        isLoggedIn={Boolean(user)}
        favoriteSlugs={favoriteSlugs}
      />
      <FeaturesSection />
    </>
  );
}
