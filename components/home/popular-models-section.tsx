import type { Car } from "@/data/cars";
import Link from "next/link";
import Container from "@/components/layout/container";
import CarGrid from "@/components/cars/car-grid";
import EmptyState from "@/components/ui/empty-state";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";

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
    <section className="section homeSection" aria-labelledby="popular-models-heading">
      <Container>
        <SectionHeading
          eyebrow="Populære modeller"
          title="Utforsk publiserte elbiler"
          titleId="popular-models-heading"
          href="/modeller"
        />
        {cars.length === 0 ? (
          <EmptyState
            className="homeInlineEmpty"
            titleAs="h3"
            eyebrow="Katalog"
            title="Ingen publiserte modeller ennå"
            description="Når modeller er godkjent og publisert, vises de her. Bla i katalogen for å søke når data er tilgjengelig."
          >
            <Button href="/modeller" variant="secondary">
              Gå til modeller
            </Button>
            <Link href="/info" className="textLink">
              Om kilder og metode →
            </Link>
          </EmptyState>
        ) : (
          <CarGrid
            cars={cars}
            variant="compact"
            isLoggedIn={isLoggedIn}
            favoriteSlugs={favoriteSlugs}
          />
        )}
      </Container>
    </section>
  );
}
