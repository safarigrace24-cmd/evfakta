import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";

const faqs = [
  {
    q: "Hva er WLTP-rekkevidde?",
    a: "WLTP er en standardisert laboratorietest. Tallene er nyttige for sammenligning, men er ikke det samme som rekkevidde i norsk vinter eller motorveikjøring.",
  },
  {
    q: "Hvorfor mangler noen tall?",
    a: "EVFAKTA viser bare verdier vi har i databasen med kilde. Mangler data, viser vi «—» eller utelater feltet i stedet for å gjette.",
  },
  {
    q: "Er prisene synlige nå?",
    a: "Priser og EVFAKTA Score er midlertidig skjult i offentlig visning til de er klare for publisering. Tallene kan fortsatt finnes i CMS for redaksjonelt arbeid.",
  },
  {
    q: "Hvordan oppdateres dataene?",
    a: "Modellsider viser kildenavn og sist sjekket-dato når det er lagret. Se /info for metode og kildepolicy.",
  },
];

export default function HomeFaqSection() {
  return (
    <section
      className="section sectionAlt homeSection"
      aria-labelledby="home-faq-heading"
    >
      <Container>
        <div className="featuresHeader homeSectionHeader">
          <Eyebrow>FAQ</Eyebrow>
          <h2 id="home-faq-heading">Vanlige spørsmål om elbiler</h2>
          <p className="lead narrow">
            Korte svar — uten markedsfloskler. Mer om metode finner du på info-siden.
          </p>
        </div>
        <div className="homeFaqList">
          {faqs.map((item) => (
            <details key={item.q} className="homeFaqItem">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
        <p className="homeFaqMore homeSectionFooterLink">
          <Link href="/info" className="textLink">
            Om EVFAKTA, kilder og begreper →
          </Link>
        </p>
      </Container>
    </section>
  );
}
