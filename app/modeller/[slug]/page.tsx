import Link from "next/link";
import { notFound } from "next/navigation";
import { formatKm, formatKwh, formatKw, formatNok } from "@/lib/format";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import Button from "@/components/ui/button";
import FavoriteButton from "@/components/favorites/favorite-button";
import CarGallery from "@/components/cars/car-gallery";
import FactGrid from "@/components/cars/fact-grid";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPublishedCarBySlug } from "@/lib/cars/get-published-cars";
import { isFavoriteSlug } from "@/lib/favorites/get-favorites";

export const dynamic = "force-dynamic";

export default async function CarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = await getPublishedCarBySlug(slug);
  if (!car) notFound();

  const [user, isFavorite] = await Promise.all([getAuthUser(), isFavoriteSlug(car.slug)]);

  const facts = [
    { label: "Pris fra", value: formatNok(car.priceNok), highlight: true },
    { label: "WLTP-rekkevidde", value: formatKm(car.rangeKm) },
    { label: "Batteri", value: formatKwh(car.batteryKwh) },
    { label: "DC-lading", value: formatKw(car.dcKw) },
    { label: "AC-lading", value: formatKw(car.acKw) },
    { label: "Drivhjul", value: car.drive },
  ];

  return (
    <section className="section">
      <Container>
        <nav className="pageBreadcrumb" aria-label="Brødsmulesti">
          <Link href="/">Hjem</Link>
          <span>/</span>
          <Link href="/modeller">Modeller</Link>
          <span>/</span>
          <span aria-current="page">
            {car.brand} {car.model}
          </span>
        </nav>

        <div className="detailHeader">
          <Eyebrow>{car.brand}</Eyebrow>
          <h1>{car.model}</h1>
          <p className="lead narrow">{car.description}</p>
          <FavoriteButton
            carSlug={car.slug}
            initialIsFavorite={isFavorite}
            isLoggedIn={Boolean(user)}
            variant="labeled"
          />
        </div>

        <div className="detailGrid">
          <CarGallery car={car} />
          <FactGrid facts={facts} />
        </div>

        <div className="detailActions">
          <Button href="/sammenlign" variant="primary">
            Sammenlign med andre
          </Button>
          <Button href="/kalkulator" variant="secondary">
            Beregn ladekostnad
          </Button>
        </div>

        <div className="sourceBox">
          <strong>Kilder og oppdatering</strong>
          <p>
            Sist oppdatert: {car.updated}. Kontroller data mot norske produsentkilder før
            publisering.
          </p>
        </div>
      </Container>
    </section>
  );
}
