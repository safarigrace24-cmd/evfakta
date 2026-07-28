import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import EmptyState from "@/components/ui/empty-state";
import { getActiveBrands } from "@/lib/brands/get-active-brands";
import { getPublishedCars } from "@/lib/cars/get-published-cars";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Merker",
  description: "Utforsk elbilmerker med publiserte modeller i EVFAKTA-databasen.",
  alternates: { canonical: "/merker" },
  openGraph: {
    title: "Merker | EVFAKTA.no",
    description: "Utforsk elbilmerker med publiserte modeller i EVFAKTA-databasen.",
    url: "/merker",
  },
};

export default async function BrandsPage() {
  const [brands, cars] = await Promise.all([
    getActiveBrands(),
    getPublishedCars(),
  ]);

  const counts = new Map<string, number>();
  for (const car of cars) {
    const key = car.brand.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const brandsWithCounts = brands.map((brand) => ({
    ...brand,
    modelCount: counts.get(brand.name.trim().toLowerCase()) ?? 0,
  }));

  return (
    <section className="section">
      <Container>
        <div className="pageHeader">
          <Eyebrow>Merker</Eyebrow>
          <h1>Bilmerker</h1>
          <p className="lead narrow">
            Se aktive merker og gå videre til publiserte modeller. Antall modeller
            er basert på publiserte data.
          </p>
        </div>

        {brandsWithCounts.length === 0 ? (
          <EmptyState
            eyebrow="Merker"
            title="Ingen merker ennå"
            description="Aktive merker vises her når de er lagt til i adminpanelet."
          />
        ) : (
          <ul className="brandGrid">
            {brandsWithCounts.map((brand) => (
              <li key={brand.id}>
                <Link href={`/merker/${brand.slug}`} className="brandCard">
                  <div className="brandCardLogo">
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={`${brand.name}-logo`}
                        fill
                        sizes="120px"
                        unoptimized
                        className="brandCardLogoImg"
                      />
                    ) : (
                      <span className="brandCardLogoFallback" aria-hidden="true">
                        {brand.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="brandCardBody">
                    <strong>{brand.name}</strong>
                    <span>
                      {brand.modelCount}{" "}
                      {brand.modelCount === 1
                        ? "publisert modell"
                        : "publiserte modeller"}
                    </span>
                    <span className="brandCardLink">Se modeller →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
