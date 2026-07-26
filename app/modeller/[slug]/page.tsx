import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/container";
import CarGrid from "@/components/cars/car-grid";
import CarVariantDetail from "@/components/cars/car-variant-detail";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  getPublishedCarBySlug,
  getPublishedCars,
} from "@/lib/cars/get-published-cars";
import { applyVariantToCar, resolveVariantSlug } from "@/lib/cars/variants";
import { getRelatedCars } from "@/lib/cars/related-cars";
import { getFavoriteSlugs, isFavoriteSlug } from "@/lib/favorites/get-favorites";
import { PUBLIC_SHOW_PRICES } from "@/lib/public/display-policy";
import {
  sanitizePublicText,
  sanitizePublicTextList,
} from "@/lib/public/sanitize-public-copy";
import type { Car } from "@/data/cars";

function toPublicCar(car: Car): Car {
  return {
    ...car,
    description: sanitizePublicText(car.description),
    pros: sanitizePublicTextList(car.pros),
    cons: sanitizePublicTextList(car.cons),
    suitableFor: sanitizePublicTextList(car.suitableFor),
    // Keep draft editorial notes out of the public RSC/client payload.
    scoreNotes: sanitizePublicText(car.scoreNotes) || null,
    scoreMethodology: sanitizePublicText(car.scoreMethodology) || null,
  };
}

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const car = await getPublishedCarBySlug(slug);
  if (!car) {
    return { title: "Modell ikke funnet" };
  }

  const variantSlug = resolveVariantSlug(car, firstParam(query.variant));
  const display = applyVariantToCar(car, variantSlug);
  const title =
    display.variant && car.variants?.length
      ? `${car.brand} ${car.model} ${display.variant}`
      : `${car.brand} ${car.model}`;
  const description =
    sanitizePublicText(car.description) ||
    `${car.brand} ${car.model}: rekkevidde, lading, forbruk og spesifikasjoner for det norske markedet.`;

  const canonical =
    variantSlug && variantSlug !== resolveVariantSlug(car, null)
      ? `/modeller/${car.slug}?variant=${encodeURIComponent(variantSlug)}`
      : `/modeller/${car.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | EVFAKTA.no`,
      description,
      url: canonical,
      type: "website",
      images: car.imageUrl ? [{ url: car.imageUrl }] : undefined,
    },
  };
}

export default async function CarPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const car = await getPublishedCarBySlug(slug);
  if (!car) notFound();

  const initialVariantSlug = resolveVariantSlug(car, firstParam(query.variant));
  const display = applyVariantToCar(car, initialVariantSlug);

  const [user, isFavorite, allCars, favoriteSlugs] = await Promise.all([
    getAuthUser(),
    isFavoriteSlug(car.slug),
    getPublishedCars(),
    getFavoriteSlugs(),
  ]);

  const publicCar = toPublicCar(car);
  const publicDisplay = applyVariantToCar(publicCar, initialVariantSlug);
  const related = getRelatedCars(car, allCars, 3).map(toPublicCar);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name:
      publicDisplay.variant && publicCar.variants?.length
        ? `${publicCar.brand} ${publicCar.model} ${publicDisplay.variant}`
        : `${publicCar.brand} ${publicCar.model}`,
    brand: { "@type": "Brand", name: publicCar.brand },
    description: publicCar.description || undefined,
    image: publicCar.imageUrl || undefined,
    vehicleConfiguration: publicDisplay.drive,
    fuelType: "Electric",
    url: `https://www.evfakta.no/modeller/${publicCar.slug}`,
    offers:
      PUBLIC_SHOW_PRICES && publicDisplay.priceNok > 0
        ? {
            "@type": "Offer",
            priceCurrency: "NOK",
            price: publicDisplay.priceNok,
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

        <CarVariantDetail
          car={publicCar}
          initialVariantSlug={initialVariantSlug}
          isFavorite={isFavorite}
          isLoggedIn={Boolean(user)}
        />

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
