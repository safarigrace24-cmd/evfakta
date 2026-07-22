import type { Car } from "@/data/cars";
import Container from "@/components/layout/container";
import CarGrid from "@/components/cars/car-grid";
import SectionHeading from "@/components/ui/section-heading";

type PopularModelsSectionProps = {
  cars: Car[];
};

export default function PopularModelsSection({ cars }: PopularModelsSectionProps) {
  return (
    <section className="section">
      <Container>
        <SectionHeading
          eyebrow="Populære modeller"
          title="Start sammenligningen"
          href="/modeller"
        />
        <CarGrid cars={cars} variant="compact" />
      </Container>
    </section>
  );
}
