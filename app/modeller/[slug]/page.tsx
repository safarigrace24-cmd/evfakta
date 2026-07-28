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
import { sanitizePublicCopy } from "@/lib/public/sanitize-public-copy";
import { PUBLIC_SHOW_PRICES } from "@/lib/public/display-policy";

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
    notFound();
  }

  const variantSlug = resolveVariantSlug(car, firstParam(query.variant));
  const display = applyVariantToCar(car, variantSlug);
  const title =
    display.variant && car.variants?.length
      ? `${car.brand} ${car.model} ${display.variant}`
      : `${car.brand} ${car.model}`;
  const description =
    sanitizePublicCopy(car.description) ||
    `${car.brand} ${car.model}: rekkevidde, batteri og ladehastighet.`;

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

  const related = getRelatedCars(car, allCars, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name:
      display.variant && car.variants?.length
        ? `${car.brand} ${car.model} ${display.variant}`
        : `${car.brand} ${car.model}`,
    brand: { "@type": "Brand", name: car.brand },
    description: sanitizePublicCopy(car.description) || undefined,
    image: car.imageUrl || undefined,
    vehicleConfiguration: display.drive,
    fuelType: "Electric",
    url: `https://www.evfakta.no/modeller/${car.slug}`,
    offers:
      PUBLIC_SHOW_PRICES && display.priceNok > 0
        ? {
            "@type": "Offer",
            priceCurrency: "NOK",
            price: display.priceNok,
            availability: "https://schema.org/InStock",
          }
        : undefined,
  };

  return (
    <section className="section modelPage" aria-label="Modellside">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        <nav className="pageBreadcrumb" aria-label="Brødsmulesti">
          <Link href="/">Hjem</Link>
          <span aria-hidden="true">/</span>
          <Link href="/modeller">Modeller</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">
            {car.brand} {car.model}
          </span>
        </nav>

        <CarVariantDetail
          car={car}
          initialVariantSlug={initialVariantSlug}
          isFavorite={isFavorite}
          isLoggedIn={Boolean(user)}
        />

        {related.length > 0 && (
          <section className="relatedSection modelRelated" aria-labelledby="related-heading">
            <div className="modelRelatedHeader">
              <h2 id="related-heading">Lignende modeller</h2>
            </div>
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
