import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Personvern",
  description:
    "Slik behandler EVFAKTA personopplysninger, cookies, posisjon, kart, NOBIL og AI-utkast.",
  alternates: { canonical: "/personvern" },
  openGraph: {
    title: "Personvern | EVFAKTA",
    description:
      "Informasjon om kontoer, cookies, Google Maps, geolokasjon, NOBIL, Gemini og Supabase.",
    url: "/personvern",
  },
};

export default function PrivacyPage() {
  return (
    <section className="section">
      <Container className="prosePage">
        <nav className="pageBreadcrumb" aria-label="Brødsmulesti">
          <Link href="/">Hjem</Link>
          <span>/</span>
          <span aria-current="page">Personvern</span>
        </nav>

        <div className="pageHeader">
          <Eyebrow>Tillit</Eyebrow>
          <h1>Personvernerklæring</h1>
          <p className="lead narrow">
            EVFAKTA.no skal være etterprøvbar også når det gjelder personvern. Denne
            siden beskriver hvilke opplysninger vi behandler, og hva vi ikke gjør.
          </p>
          <p className="adminHint">Sist oppdatert: 2. august 2026</p>
        </div>

        <section className="proseBlock" aria-labelledby="controller-heading">
          <h2 id="controller-heading">Behandlingsansvarlig</h2>
          <p>
            Behandlingsansvarlig for EVFAKTA.no er EVFAKTA. Kontakt oss på{" "}
            <a href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>
            .
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="accounts-heading">
          <h2 id="accounts-heading">Brukerkontoer og autentisering</h2>
          <p>
            Når du registrerer deg eller logger inn, behandler vi e-postadresse og
            autentiseringsdata som trengs for å opprettholde kontoen. Passord lagres
            ikke i klartekst hos EVFAKTA — autentisering håndteres via Supabase Auth.
          </p>
          <p>
            Innloggede brukere kan lagre favoritter knyttet til kontoen. Du kan be om
            sletting eller retting ved å kontakte{" "}
            <a href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>
            .
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="supabase-heading">
          <h2 id="supabase-heading">Supabase</h2>
          <p>
            EVFAKTA bruker Supabase til database, autentisering og lagring av
            redaksjonelt innhold (blant annet bilkatalog, favoritter og admin-data).
            Servernøkler (service role) brukes kun på serveren og eksponeres ikke i
            nettleseren.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="cookies-heading">
          <h2 id="cookies-heading">Cookies og økt</h2>
          <p>
            Vi bruker nødvendige cookies/øktlagring for innlogging og sikker
            sesjonshåndtering. Vi selger ikke personopplysninger. Vi bruker ikke
            markedsføringscookies til å følge deg på tvers av nettsteder.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="maps-heading">
          <h2 id="maps-heading">Google Maps</h2>
          <p>
            Ladekartet (`/ladekart`) bruker Google Maps JavaScript API for å vise kart.
            Den offentlige Maps-nøkkelen lastes i nettleseren slik Google krever.
            Google kan behandle tekniske forespørsler knyttet til kartvisning etter
            sine egne vilkår. EVFAKTA lagrer ikke kartbrukerens posisjon i vår database.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="geo-heading">
          <h2 id="geo-heading">Nettleserens geolokasjon</h2>
          <p>
            Posisjon hentes bare etter at du trykker «Bruk min posisjon». Vi ber aldri
            om posisjon automatisk ved side lasting. Koordinatene brukes lokalt i
            nettleseren for å søke etter ladestasjoner i nærheten, og lagres ikke
            permanent av EVFAKTA. Vi logger ikke presise koordinater i produksjon.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="nobil-heading">
          <h2 id="nobil-heading">NOBIL</h2>
          <p>
            Stasjonsdata hentes fra NOBIL via EVFAKTAs server. NOBIL-API-nøkkelen er
            server-only og sendes aldri til nettleseren. Data attributeres til NOBIL
            (Enova). Vi viser ikke live ledighet eller priser med mindre kilden gir
            pålitelige verdier.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="gemini-heading">
          <h2 id="gemini-heading">Gemini AI (redaksjonell assistent)</h2>
          <p>
            Gemini brukes kun i admin for å foreslå tekstutkast (for eksempel
            introduksjon, FAQ eller omskrivning). Utkast lagres eller publiseres ikke
            automatisk — en redaktør må kontrollere og lime inn manuelt. API-nøkkelen
            er server-only. Vi ber ikke Gemini om å finne opp manglende
            spesifikasjoner. AI-bildegenerering kan være deaktivert og skal feile
            trygt uten å påvirke resten av nettstedet.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="rights-heading">
          <h2 id="rights-heading">Dine rettigheter</h2>
          <p>
            Du kan be om innsyn, retting eller sletting av personopplysninger knyttet
            til kontoen din, innenfor gjeldende personvernregelverk. Kontakt{" "}
            <a href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>
            .
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="changes-heading">
          <h2 id="changes-heading">Endringer</h2>
          <p>
            Vi kan oppdatere denne erklæringen når tjenesten endres. Vesentlige
            endringer vil fremgå av datoen øverst på siden.
          </p>
        </section>
      </Container>
    </section>
  );
}
