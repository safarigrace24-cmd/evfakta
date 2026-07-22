import Link from "next/link";
import Button from "@/components/ui/button";
import Eyebrow from "@/components/ui/eyebrow";
import Container from "@/components/layout/container";

type HeroSectionProps = {
  modelCount: number;
};

export default function HeroSection({ modelCount }: HeroSectionProps) {
  return (
    <section className="hero">
      <div className="heroBg" aria-hidden="true">
        <div className="heroOrb heroOrb1" />
        <div className="heroOrb heroOrb2" />
        <div className="heroGridPattern" />
      </div>
      <Container>
        <div className="heroGrid">
          <div className="heroContent">
            <Eyebrow>Uavhengig elbil-fakta for Norge</Eyebrow>
            <h1>
              Finn elbilen
              <br />
              <span className="heroAccent">som passer deg</span>
            </h1>
            <p className="lead">
              Sammenlign pris, rekkevidde, batteri og ladehastighet på ett sted – med tydelige kilder og oppdaterte tall.
            </p>
            <div className="actions">
              <Button href="/modeller" variant="primary">
                Se alle modeller
              </Button>
              <Button href="/sammenlign" variant="secondary">
                Sammenlign biler
              </Button>
            </div>
            <div className="heroStats">
              <div className="heroStat">
                <strong>{modelCount}</strong>
                <span>modeller i databasen</span>
              </div>
              <div className="heroStat">
                <strong>100%</strong>
                <span>uavhengig kildebasert</span>
              </div>
              <div className="heroStat">
                <strong>Gratis</strong>
                <span>for alle brukere</span>
              </div>
            </div>
          </div>

          <div className="heroCard">
            <div className="heroCardIcon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="heroCardContent">
              <strong>Alt du trenger for å velge riktig elbil</strong>
              <p>Pris, rekkevidde, batteristørrelse og ladehastighet – samlet i én oversiktlig database.</p>
            </div>
            <Link href="/kalkulator" className="heroCardLink">
              Prøv ladekalkulatoren →
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
