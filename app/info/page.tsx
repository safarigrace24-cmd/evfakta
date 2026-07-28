import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import { siteConfig } from "@/config/site";
import SocialIcon from "@/components/brand/social-icon";

export const metadata: Metadata = {
  title: "Kilder og metode",
  description:
    "Slik jobber EVFAKTA med kilder, metode, begreper og oppdatering av elbilfakta for Norge.",
  alternates: { canonical: "/info" },
  openGraph: {
    title: "Kilder og metode | EVFAKTA",
    description:
      "Slik jobber EVFAKTA med kilder, metode, begreper og oppdatering av elbilfakta for Norge.",
    url: "/info",
  },
};

const terms = [
  {
    term: "kW",
    meaning:
      "Kilowatt — effekt. Brukes for ladehastighet og motoreffekt. Høyere kW betyr mer effekt i øyeblikket.",
  },
  {
    term: "kWh",
    meaning:
      "Kilowattime — energi. Brukes for batterikapasitet og forbruk. Rekkevidde henger sammen med hvor mange kWh bilen bruker per mil.",
  },
  {
    term: "AC",
    meaning:
      "Vekselstrøm. Typisk hjemme- og destinasjonslading med lavere effekt enn hurtiglading.",
  },
  {
    term: "DC",
    meaning:
      "Likestrøm. Hurtiglading på offentlige stasjoner. Maks DC-kW er et tak; reell ladekurve varierer.",
  },
  {
    term: "WLTP",
    meaning:
      "Standardisert laboratorietest for rekkevidde og forbruk. Nyttig til sammenligning, ikke en garanti for norsk vinter eller motorvei.",
  },
  {
    term: "Brukbart batteri",
    meaning:
      "Den delen av batterikapasiteten bilen faktisk kan bruke. Kan være lavere enn total kapasitet.",
  },
  {
    term: "Maksimal ladeeffekt",
    meaning:
      "Høyeste DC- (eller AC-) effekt bilen er spesifisert for. Avhenger også av ladeinfrastruktur og batteritilstand.",
  },
];

export default function InfoPage() {
  return (
    <section className="section">
      <Container className="prosePage">
        <nav className="pageBreadcrumb" aria-label="Brødsmulesti">
          <Link href="/">Hjem</Link>
          <span>/</span>
          <span aria-current="page">Kilder og metode</span>
        </nav>

        <div className="pageHeader">
          <Eyebrow>Tillit</Eyebrow>
          <h1>Hva er EVFAKTA?</h1>
          <p className="lead narrow">
            EVFAKTA er en uavhengig database for elbilfakta på det norske markedet.
            Vi prioriterer tydelige kilder, ærlige mangler og rolige sammenligninger.
          </p>
        </div>

        <section className="proseBlock" aria-labelledby="policy-heading">
          <h2 id="policy-heading">Kildepolicy</h2>
          <ul>
            <li>Vi foretrekker offisielle norske produsent- og importørkilder.</li>
            <li>Verdier uten kilde publiseres ikke som fakta.</li>
            <li>Vi finner ikke opp tall for å «fylle ut» en modellside.</li>
            <li>
              Uferdige funksjoner er synlige i navigasjonen og merket «Under
              utvikling».
            </li>
          </ul>
        </section>

        <section className="proseBlock" aria-labelledby="method-heading">
          <h2 id="method-heading">Metode</h2>
          <p>
            Publiserte modeller gjennomgår redaksjonell kontroll før de vises
            offentlig. Spesifikasjoner knyttes til kildenavn og URL når det er
            tilgjengelig. Variantvalg kan endre tallene — sjekk alltid hvilken
            trim som er valgt.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="checked-heading">
          <h2 id="checked-heading">Sist sjekket</h2>
          <p>
            Når en modell har «sist sjekket»-dato, betyr det når dataene sist ble
            vurdert mot oppgitt kilde — ikke at alle verdier er retestet den dagen.
            Oppdateringer skjer etter hvert som nye kilder gjennomgås.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="terms-heading">
          <h2 id="terms-heading">Begreper</h2>
          <dl className="termList">
            {terms.map((item) => (
              <div key={item.term} className="termRow">
                <dt>{item.term}</dt>
                <dd>{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="proseBlock" aria-labelledby="trim-heading">
          <h2 id="trim-heading">Trim og årsmodell</h2>
          <p>
            Samme modellnavn kan ha flere batterier, drivlinjer og årsmodeller.
            Tallene på EVFAKTA gjelder den valgte varianten. Bytt variant på
            modellsiden når den er tilgjengelig.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="contact-heading">
          <h2 id="contact-heading">Kontakt</h2>
          <p>
            Tips, rettelser eller ønske om ny modell? Skriv til{" "}
            <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
          </p>
          <ul className="footerSocial infoSocial" aria-label="Sosiale medier">
            {siteConfig.socialLinks.map((link) => (
              <li key={link.network}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="footerSocialLink infoSocialLink"
                >
                  <SocialIcon network={link.network} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </section>
  );
}
