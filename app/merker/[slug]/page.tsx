import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import EmptyState from "@/components/ui/empty-state";
import CarGrid from "@/components/cars/car-grid";
import { getAuthUser } from "@/lib/auth/get-user";
import { getActiveBrandBySlug } from "@/lib/brands/get-active-brands";
import { getPublishedCarsForBrand } from "@/lib/cars/get-published-cars";
import { getFavoriteSlugs } from "@/lib/favorites/get-favorites";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getActiveBrandBySlug(slug);
  if (!brand) return { title: "Merke ikke funnet" };

  const description =
    brand.description?.trim() ||
    `Se publiserte elbiler fra ${brand.name} i EVFAKTA-databasen.`;

  return {
    title: brand.name,
    description,
    alternates: { canonical: `/merker/${brand.slug}` },
    openGraph: {
      title: `${brand.name} | EVFAKTA.no`,
      description,
      url: `/merker/${brand.slug}`,
      images: brand.logoUrl ? [{ url: brand.logoUrl }] : undefined,
    },
  };
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const brand = await getActiveBrandBySlug(slug);
  if (!brand) notFound();

  const [cars, user, favoriteSlugs] = await Promise.all([
    getPublishedCarsForBrand({ brandId: brand.id, brandName: brand.name }),
    getAuthUser(),
    getFavoriteSlugs(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand.name,
    url: `https://www.evfakta.no/merker/${brand.slug}`,
    logo: brand.logoUrl || undefined,
    description: brand.description || undefined,
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
          <Link href="/merker">Merker</Link>
          <span>/</span>
          <span aria-current="page">{brand.name}</span>
        </nav>

        <div className="brandDetailHeader">
          <div className="brandDetailLogo">
            {brand.logoUrl ? (
              <Image
                src={brand.logoUrl}
                alt=""
                fill
                sizes="140px"
                unoptimized
                className="brandCardLogoImg"
              />
            ) : (
              <span className="brandCardLogoFallback" aria-hidden="true">
                {brand.name.slice(0, 1)}
              </span>
            )}
          </div>
          <div>
            <Eyebrow>Merke</Eyebrow>
            <h1>{brand.name}</h1>
            {brand.country && <p className="lead narrow">{brand.country}</p>}
            {brand.description && <p className="lead narrow">{brand.description}</p>}
            {brand.websiteUrl && (
              <p>
                <a href={brand.websiteUrl} target="_blank" rel="noreferrer">
                  Offisielt nettsted
                </a>
              </p>
            )}
          </div>
        </div>

        <div className="pageHeader">
          <h2>Publiserte modeller</h2>
          <p className="lead narrow">
            {cars.length === 0
              ? "Ingen publiserte modeller for dette merket ennå."
              : `${cars.length} modell${cars.length === 1 ? "" : "er"} i databasen.`}
          </p>
        </div>

        {cars.length === 0 ? (
          <EmptyState
            eyebrow={brand.name}
            title="Ingen modeller"
            description="Når modeller for dette merket publiseres, vises de her."
          />
        ) : (
          <CarGrid
            cars={cars}
            variant="full"
            isLoggedIn={Boolean(user)}
            favoriteSlugs={favoriteSlugs}
          />
        )}
      </Container>
    </section>
  );
}
