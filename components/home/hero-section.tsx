import Link from "next/link";
import Button from "@/components/ui/button";
import Container from "@/components/layout/container";
import HomeSearch from "@/components/home/home-search";
import BrandLogo from "@/components/brand/brand-logo";
import { siteConfig } from "@/config/site";

type HeroSectionProps = {
  modelCount: number;
  brandCount: number;
};

export default function HeroSection({ modelCount, brandCount }: HeroSectionProps) {
  return (
    <section className="hero ds2Hero">
      <Container>
        <div className="heroGrid">
          <div className="heroContent">
            <BrandLogo href={null} className="heroBrandLogo" />
            <h1>{siteConfig.tagline}</h1>
            <p className="lead">
              Sammenlign rekkevidde, batteri og ladehastighet med tydelige kilder —
              uten støy og uten gjetting.
            </p>

            <HomeSearch />

            <div className="actions">
              <Button href="/modeller" variant="primary">
                Se alle modeller
              </Button>
              <Button href="/sammenlign" variant="secondary">
                Sammenlign biler
              </Button>
            </div>

            {(modelCount > 0 || brandCount > 0) && (
              <p className="heroMeta" aria-live="polite">
                {modelCount > 0 && (
                  <span>
                    {modelCount} publiserte {modelCount === 1 ? "modell" : "modeller"}
                  </span>
                )}
                {modelCount > 0 && brandCount > 0 && <span aria-hidden="true"> · </span>}
                {brandCount > 0 && (
                  <span>
                    {brandCount} {brandCount === 1 ? "merke" : "merker"}
                  </span>
                )}
              </p>
            )}
          </div>

          <aside className="heroAside" aria-label="Kom i gang">
            <div className="heroAsideCard">
              <strong>Rolige tall. Klare valg.</strong>
              <p>
                Hver modell viser kilder og når data sist ble sjekket — slik at du
                kan stole på det du leser.
              </p>
              <Link href="/merker" className="heroCardLink">
                Utforsk merker →
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
