import Link from "next/link";
import type { Car } from "@/data/cars";
import Container from "@/components/layout/container";
import CarGrid from "@/components/cars/car-grid";

type PopularModelsSectionProps = {
  cars: Car[];
  isLoggedIn?: boolean;
  favoriteSlugs?: string[];
  totalCount?: number;
};

export default function PopularModelsSection({
  cars,
  isLoggedIn = false,
  favoriteSlugs = [],
  totalCount,
}: PopularModelsSectionProps) {
  const count = totalCount ?? cars.length;

  return (
    <section className="section">
      <Container>
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">Modeller</p>
            <h2>Utvalgte modeller</h2>
          </div>
          <Link href="/modeller" className="sectionLink">
            Se alle {count} {count === 1 ? "modell" : "modeller"}
          </Link>
        </div>
        <CarGrid
          cars={cars}
          variant="compact"
          isLoggedIn={isLoggedIn}
          favoriteSlugs={favoriteSlugs}
        />
        <div className="sectionFooterCta">
          <Link href="/modeller" className="button secondary">
            Se alle modeller →
          </Link>
        </div>
      </Container>
    </section>
  );
}
