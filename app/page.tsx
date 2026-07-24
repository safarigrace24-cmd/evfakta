import { cars } from "@/data/cars";
import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "@/components/home/features-section";
import PopularModelsSection from "@/components/home/popular-models-section";
import { getAuthUser } from "@/lib/auth/get-user";
import { getFavoriteSlugs } from "@/lib/favorites/get-favorites";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, favoriteSlugs] = await Promise.all([getAuthUser(), getFavoriteSlugs()]);

  return (
    <>
      <HeroSection modelCount={cars.length} />
      <PopularModelsSection
        cars={cars.slice(0, 3)}
        isLoggedIn={Boolean(user)}
        favoriteSlugs={favoriteSlugs}
      />
      <FeaturesSection />
    </>
  );
}
