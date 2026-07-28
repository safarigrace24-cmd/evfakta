import Link from "next/link";
import Container from "@/components/layout/container";
import Button from "@/components/ui/button";
import Eyebrow from "@/components/ui/eyebrow";

export default function TrustSection() {
  return (
    <section
      className="section trustSection homeSection"
      aria-labelledby="trust-heading"
    >
      <Container>
        <div className="trustInner">
          <Eyebrow>Tillit</Eyebrow>
          <h2 id="trust-heading">Fakta med kilder — ikke markedssnakk</h2>
          <p className="lead narrow">
            EVFAKTA viser bare publiserte modeller med godkjente bilder og
            etterprøvbare tall. Mangler data, viser vi det — vi fyller ikke inn med
            gjetting.
          </p>
          <ul className="trustList">
            <li>Kildenavn og sist sjekket-dato nær spesifikasjonene</li>
            <li>WLTP og ladeeffekt med enheter</li>
            <li>Ingen falske scores eller priser før de er klare for offentlig visning</li>
          </ul>
          <div className="actions">
            <Button href="/info" variant="primary">
              Kilder og metode
            </Button>
            <Link href="/modeller" className="textLink">
              Bla i katalog →
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
