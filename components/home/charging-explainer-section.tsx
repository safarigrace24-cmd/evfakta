import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";

export default function ChargingExplainerSection() {
  return (
    <section
      className="section sectionAlt homeSection"
      aria-labelledby="charging-explainer-heading"
    >
      <Container>
        <div className="splitExplainer">
          <header className="homeSectionHeader">
            <Eyebrow>Lading</Eyebrow>
            <h2 id="charging-explainer-heading">AC hjemme, DC på farten</h2>
            <p className="lead narrow">
              Elbiler lades på ulike måter. Forstå forskjellen før du sammenligner
              ladeeffekt mellom modeller.
            </p>
          </header>
          <div className="explainerCards">
            <article className="explainerCard">
              <h3>AC-lading</h3>
              <p>
                Typisk hjemme- eller destinasjonslading. Effekten oppgis i kW og er
                vanligvis lavere enn hurtiglading.
              </p>
            </article>
            <article className="explainerCard">
              <h3>DC-hurtiglading</h3>
              <p>
                Offentlig hurtiglading med høyere effekt. Maks kW er et tak — reell
                ladekurve varierer med batterinivå og temperatur.
              </p>
            </article>
            <article className="explainerCard">
              <h3>kW og kWh</h3>
              <p>
                kW er effekt (hvor raskt). kWh er energi (hvor mye). Rekkevidde og
                forbruk knytter disse sammen.
              </p>
            </article>
          </div>
          <p className="homeSectionFooterLink">
            <Link href="/info" className="textLink">
              Les mer om begreper og kilder →
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
