import Link from "next/link";
import Container from "@/components/layout/container";
import { siteConfig } from "@/config/site";

type HeroSectionProps = {
  modelCount: number;
};

export default function HeroSection({ modelCount }: HeroSectionProps) {
  return (
    <section className="hero">
      <div className="heroBg" aria-hidden="true">
        <div className="heroGlow" />
      </div>
      <Container>
        <div className="heroCentered">
          <p className="eyebrow">{siteConfig.eyebrow}</p>
          <h1>
            Finn riktig elbil
            <br />
            <span className="heroAccent">på 2 minutter</span>
          </h1>
          <p className="lead heroLead">
            Sammenlign rekkevidde, lading, forbruk og plass – med spesifikasjoner og kilder for
            det norske markedet.
          </p>
          <div className="actions heroActions">
            <Link href="/modeller" className="button primary">
              Se alle →
            </Link>
          </div>
          <div className="heroStats">
            <div className="heroStat">
              <strong>{modelCount}</strong>
              <span>{modelCount === 1 ? "Publisert modell" : "Publiserte modeller"}</span>
            </div>
            <div className="heroStat">
              <strong>100%</strong>
              <span>Uavhengig</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
