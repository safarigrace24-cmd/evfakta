import type { Car } from "@/data/cars";
import Container from "@/components/layout/container";
import CarGrid from "@/components/cars/car-grid";
import SectionHeading from "@/components/ui/section-heading";

type PopularModelsSectionProps = {
  cars: Car[];
  isLoggedIn?: boolean;
  favoriteSlugs?: string[];
};

export default function PopularModelsSection({
  cars,
  isLoggedIn = false,
  favoriteSlugs = [],
}: PopularModelsSectionProps) {
  return (
    <section className="section">
      <Container>
        <SectionHeading
          eyebrow="Populære modeller"
          title="Utforsk publiserte elbiler"
          href="/modeller"
        />
        <CarGrid
          cars={cars}
          variant="compact"
          isLoggedIn={isLoggedIn}
          favoriteSlugs={favoriteSlugs}
        />
      </Container>
    </section>
  );
}
