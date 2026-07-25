import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import EmptyState from "@/components/ui/empty-state";
import { getActiveBrands } from "@/lib/brands/get-active-brands";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Merker",
  description: "Utforsk elbilmerker i EVFAKTA-databasen.",
  alternates: { canonical: "/merker" },
  openGraph: {
    title: "Merker | EVFAKTA.no",
    description: "Utforsk elbilmerker i EVFAKTA-databasen.",
    url: "/merker",
  },
};

export default async function BrandsPage() {
  const brands = await getActiveBrands();

  return (
    <section className="section">
      <Container>
        <div className="pageHeader">
          <Eyebrow>Merker</Eyebrow>
          <h1>Bilmerker</h1>
          <p className="lead narrow">
            Se aktive merker i databasen og gå videre til publiserte modeller.
          </p>
        </div>

        {brands.length === 0 ? (
          <EmptyState
            eyebrow="Merker"
            title="Ingen merker ennå"
            description="Aktive merker vises her når de er lagt til i adminpanelet."
          />
        ) : (
          <ul className="brandGrid">
            {brands.map((brand) => (
              <li key={brand.id}>
                <Link href={`/merker/${brand.slug}`} className="brandCard">
                  <div className="brandCardLogo">
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt=""
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
                    <span>{brand.country?.trim() || "Land ikke oppgitt"}</span>
                    <span className="brandCardLink">Se modeller</span>
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
