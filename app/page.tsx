import { cars } from "@/data/cars";
import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "@/components/home/features-section";
import PopularModelsSection from "@/components/home/popular-models-section";

export default function HomePage() {
  return (
    <>
      <HeroSection modelCount={cars.length} />
      <PopularModelsSection cars={cars.slice(0, 3)} />
      <FeaturesSection />
    </>
  );
}
