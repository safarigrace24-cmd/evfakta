import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatKm,
  formatKwh,
  formatKw,
  formatNok,
} from "@/lib/format";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import Button from "@/components/ui/button";
import FavoriteButton from "@/components/favorites/favorite-button";
import CarGallery from "@/components/cars/car-gallery";
import FactGrid from "@/components/cars/fact-grid";
import EvfaktaScore from "@/components/cars/evfakta-score";
import CarGrid from "@/components/cars/car-grid";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  getPublishedCarBySlug,
  getPublishedCars,
} from "@/lib/cars/get-published-cars";
import { getRelatedCars } from "@/lib/cars/related-cars";
import { buildCompareHref } from "@/lib/compare/comparison";
import { getFavoriteSlugs, isFavoriteSlug } from "@/lib/favorites/get-favorites";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const car = await getPublishedCarBySlug(slug);
  if (!car) {
    return { title: "Modell ikke funnet" };
  }

  const title = `${car.brand} ${car.model}`;
  const description =
    car.description?.trim() ||
    `${car.brand} ${car.model}: rekkevidde, pris, lading og EVFAKTA Score.`;

  return {
    title,
    description,
    alternates: { canonical: `/modeller/${car.slug}` },
    openGraph: {
      title: `${title} | EVFAKTA.no`,
      description,
      url: `/modeller/${car.slug}`,
      type: "website",
      images: car.imageUrl ? [{ url: car.imageUrl }] : undefined,
    },
  };
}

function formatOptional(value: string | number | null | undefined, suffix = "") {
  if (value == null || value === "" || value === 0) return null;
  return `${value}${suffix}`;
}

export default async function CarPage({ params }: PageProps) {
  const { slug } = await params;
  const car = await getPublishedCarBySlug(slug);
  if (!car) notFound();

  const [user, isFavorite, allCars, favoriteSlugs] = await Promise.all([
    getAuthUser(),
    isFavoriteSlug(car.slug),
    getPublishedCars(),
    getFavoriteSlugs(),
  ]);

  const related = getRelatedCars(car, allCars, 3);

  const keyFacts = [
    { label: "Pris fra", value: formatNok(car.priceNok), highlight: true },
    { label: "WLTP-rekkevidde", value: formatKm(car.rangeKm) },
    { label: "Batteri", value: formatKwh(car.batteryKwh) },
    { label: "DC-lading", value: formatKw(car.dcKw) },
    { label: "AC-lading", value: formatKw(car.acKw) },
    { label: "Drivhjul", value: car.drive },
  ];

  const techRows: Array<{ label: string; value: string | null }> = [
    { label: "Årsmodell", value: formatOptional(car.year) },
    { label: "Forbruk", value: car.consumptionKwh100km != null ? `${car.consumptionKwh100km} kWh/100 km` : null },
    { label: "Effekt", value: car.powerHp != null ? `${car.powerHp} hk` : null },
    { label: "Moment", value: car.torqueNm != null ? `${car.torqueNm} Nm` : null },
    { label: "0–100 km/t", value: car.acceleration0100 != null ? `${car.acceleration0100} s` : null },
    { label: "Toppfart", value: car.topSpeedKmh != null ? `${car.topSpeedKmh} km/t` : null },
    { label: "Seter", value: formatOptional(car.seats) },
    { label: "Bagasjerom", value: car.cargoL != null ? `${car.cargoL} l` : null },
    { label: "Tilhengervekt", value: car.towingKg != null ? `${car.towingKg} kg` : null },
    { label: "Garanti", value: car.warranty ?? null },
    { label: "Kjøretøytype", value: car.vehicleType ?? null },
    { label: "Karosseri", value: car.bodyStyle ?? null },
  ].filter((row) => row.value);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${car.brand} ${car.model}`,
    brand: { "@type": "Brand", name: car.brand },
    description: car.description,
    image: car.imageUrl || undefined,
    vehicleConfiguration: car.drive,
    fuelType: "Electric",
    url: `https://www.evfakta.no/modeller/${car.slug}`,
    offers:
      car.priceNok > 0
        ? {
            "@type": "Offer",
            priceCurrency: "NOK",
            price: car.priceNok,
            availability: "https://schema.org/InStock",
          }
        : undefined,
  };

  return (
    <section className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          <div className="detailHeaderActions">
            <FavoriteButton
              carSlug={car.slug}
              initialIsFavorite={isFavorite}
              isLoggedIn={Boolean(user)}
              variant="labeled"
            />
            <Button href={buildCompareHref([car.slug])} variant="secondary">
              Sammenlign
            </Button>
          </div>
        </div>

        <div className="detailGrid">
          <CarGallery car={car} />
          <FactGrid facts={keyFacts} />
        </div>

        {techRows.length > 0 && (
          <section className="techSection" aria-labelledby="tech-heading">
            <h2 id="tech-heading">Tekniske data</h2>
            <dl className="techList">
              {techRows.map((row) => (
                <div key={row.label} className="techRow">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <EvfaktaScore car={car} />

        <div className="detailActions">
          <Button href={buildCompareHref([car.slug])} variant="primary">
            Sammenlign med andre
          </Button>
          <Button href="/modeller" variant="secondary">
            Alle modeller
          </Button>
        </div>

        <div className="sourceBox">
          <strong>Kilder og oppdatering</strong>
          <p>
            Sist oppdatert i databasen: {car.updated}.
            {car.dataLastCheckedAt ? ` Sist sjekket: ${car.dataLastCheckedAt}.` : ""}
          </p>
          {(car.sourceName || car.sourceUrl) && (
            <p>
              Kilde:{" "}
              {car.sourceUrl ? (
                <a href={car.sourceUrl} target="_blank" rel="noreferrer">
                  {car.sourceName || car.sourceUrl}
                </a>
              ) : (
                car.sourceName
              )}
            </p>
          )}
          {!car.sourceName && !car.sourceUrl && (
            <p>Kontroller tall mot norske produsentkilder før du stoler på dem.</p>
          )}
        </div>

        {related.length > 0 && (
          <section className="relatedSection" aria-labelledby="related-heading">
            <h2 id="related-heading">Lignende modeller</h2>
            <CarGrid
              cars={related}
              variant="compact"
              isLoggedIn={Boolean(user)}
              favoriteSlugs={favoriteSlugs}
            />
          </section>
        )}
      </Container>
    </section>
  );
}
