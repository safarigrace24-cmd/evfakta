import Link from "next/link";
import Container from "@/components/layout/container";

const chargingTypes = [
  {
    title: "Hjemmelading (AC)",
    meta: "7–22 kW · typisk over natten",
    body: "Den vanligste ladeformen. En veggboks hjemme dekker de fleste daglige ladebehov og er vanligvis billigst per kWh.",
  },
  {
    title: "Destinasjonslading (AC)",
    meta: "7–22 kW · mens du er parkert",
    body: "Lading på kjøpesentre, hoteller og arbeidsplasser. Samme type lading som hjemme, praktisk når du er ute.",
  },
  {
    title: "Hurtiglading (DC)",
    meta: "Høy effekt · korte stopp",
    body: "For langtur og raskere påfyll langs veien. Effekten avhenger av både bil og ladestasjon.",
  },
];

const faqItems = [
  {
    q: "Hva betyr WLTP-rekkevidde?",
    a: "WLTP er den offisielle rekkevidden målt under standardiserte forhold. I norsk vinter kan du forvente kortere rekkevidde enn WLTP-tallet.",
  },
  {
    q: "Hvor lang tid tar det å lade en elbil?",
    a: "Hjemme (AC) tar det typisk flere timer. Hurtiglading (DC) kan ofte ta bilen fra 10–80 % på 20–45 minutter, avhengig av bil og lader.",
  },
  {
    q: "Hva er forskjellen på AC- og DC-lading?",
    a: "AC brukes hjemme og på destinasjon. DC er hurtiglading langs veien og gir høyere effekt i kort tid.",
  },
  {
    q: "Hva koster det å lade en elbil hjemme?",
    a: "Kostnaden følger strømprisen din og bilens forbruk (kWh/100 km). Se forbrukstallene per modell for å sammenligne energieffektivitet.",
  },
  {
    q: "Hvor lenge varer et elbilbatteri?",
    a: "Moderne batterier er laget for mange års bruk. Produsentgarantier dekker ofte kapasitet over flere år eller høy kilometerstand.",
  },
  {
    q: "Er elbil billigere enn bensinbil i Norge?",
    a: "Ofte lavere driftskostnader (strøm, avgifter, bompenger), men totalen avhenger av innkjøp, forsikring og kjøremønster.",
  },
  {
    q: "Hva betyr kWh per 100 km?",
    a: "Det er bilens energiforbruk – tilsvarende liter per mil for bensinbiler. Jo lavere tall, desto mer energieffektiv bil.",
  },
];

const guideItems = [
  {
    title: "Rekkevidde (WLTP)",
    body: "WLTP er offisiell rekkevidde under standardiserte forhold. Bruk den som utgangspunkt og husk at vinterkjøring ofte gir kortere rekkevidde.",
    href: "/modeller",
    label: "Se modeller →",
  },
  {
    title: "Forbruk (kWh/100 km)",
    body: "Forbruket forteller hvor energieffektiv bilen er. Jo lavere tall, desto billigere å kjøre.",
    href: "/sammenlign",
    label: "Sammenlign modeller →",
  },
  {
    title: "Lading (AC/DC)",
    body: "AC er saktere og ofte billigst hjemme. DC er raskest langs veien. Maks ladeeffekt avgjør hvor fort bilen kan lade.",
    href: "/modeller",
    label: "Utforsk spesifikasjoner →",
  },
  {
    title: "Sammenlign side om side",
    body: "Legg 2–3 modeller ved siden av hverandre og se forskjeller i rekkevidde, batteri, lading og plass.",
    href: "/sammenlign",
    label: "Åpne sammenligning →",
  },
];

export default function FeaturesSection() {
  return (
    <>
      <section className="section sectionAlt">
        <Container>
          <div className="featuresHeader">
            <p className="eyebrow">Lading</p>
            <h2>Slik fungerer elbil-lading</h2>
            <p className="lead">
              Det finnes tre hovedtyper lading for elbiler i Norge. Her er det du trenger å vite.
            </p>
          </div>
          <div className="featuresGrid">
            {chargingTypes.map((item) => (
              <article key={item.title} className="featureCard">
                <h3>{item.title}</h3>
                <p className="featureMeta">{item.meta}</p>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <div className="sectionFooterCta">
            <Link href="/modeller" className="sectionLink">
              Se ladeeffekt per modell →
            </Link>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="featuresHeader">
            <p className="eyebrow">Ofte stilte spørsmål</p>
            <h2>Alt du lurer på om elbil</h2>
            <p className="lead">
              Svar på de vanligste spørsmålene om elbiler, lading og kostnader i Norge.
            </p>
          </div>
          <div className="faqList">
            {faqItems.map((item) => (
              <details key={item.q} className="faqItem">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section className="section sectionAlt">
        <Container>
          <div className="aboutBlock">
            <p className="eyebrow">Om EVFAKTA</p>
            <h2>Hva er EVFAKTA – og hvem er det for?</h2>
            <p className="lead aboutLead">
              EVFAKTA.no er Norges elbil-database. Vi samler tekniske spesifikasjoner med tydelige
              kilder for elbiler på det norske markedet – og presenterer dem i ett enkelt verktøy.
            </p>
            <p className="aboutBody">
              Siden passer for deg som vurderer å kjøpe elbil, vil sammenligne modeller side om
              side, eller ønsker å forstå hva tallene betyr i hverdagen. Du trenger ikke
              registrere deg, og innholdet er tilgjengelig uten betalingsmur.
            </p>
            <ul className="aboutList">
              <li>Publiserte elbilmodeller med spesifikasjoner</li>
              <li>Sammenlign modeller side om side</li>
              <li>Kilder og sist oppdatert-dato der det er satt</li>
              <li>Fokus på norske markedsforhold</li>
            </ul>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="featuresHeader">
            <p className="eyebrow">Guide</p>
            <h2>Slik sammenligner du elbiler – fire nøkkeltall</h2>
          </div>
          <div className="guideGrid">
            {guideItems.map((item) => (
              <article key={item.title} className="featureCard">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <Link href={item.href} className="featureLink">
                  {item.label}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
