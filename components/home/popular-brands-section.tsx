import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/container";
import SectionHeading from "@/components/ui/section-heading";
import type { PublicBrand } from "@/lib/brands/get-active-brands";

type BrandWithCount = PublicBrand & { modelCount: number };

type PopularBrandsSectionProps = {
  brands: BrandWithCount[];
};

export default function PopularBrandsSection({ brands }: PopularBrandsSectionProps) {
  if (brands.length === 0) return null;

  return (
    <section className="section homeSection" aria-labelledby="popular-brands-heading">
      <Container>
        <SectionHeading
          eyebrow="Populære merker"
          title="Start med merket du kjenner"
          titleId="popular-brands-heading"
          href="/merker"
        />
        <ul className="homeBrandGrid">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link href={`/merker/${brand.slug}`} className="homeBrandCard">
                <div className="homeBrandLogo">
                  {brand.logoUrl ? (
                    <Image
                      src={brand.logoUrl}
                      alt=""
                      fill
                      sizes="96px"
                      unoptimized
                      className="homeBrandLogoImg"
                    />
                  ) : (
                    <span aria-hidden="true">{brand.name.slice(0, 1)}</span>
                  )}
                </div>
                <strong>{brand.name}</strong>
                <span>
                  {brand.modelCount}{" "}
                  {brand.modelCount === 1 ? "publisert modell" : "publiserte modeller"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
