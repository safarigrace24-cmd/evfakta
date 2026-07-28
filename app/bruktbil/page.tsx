import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import CarGrid from "@/components/cars/car-grid";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPublishedCars } from "@/lib/cars/get-published-cars";
import { getFavoriteSlugs } from "@/lib/favorites/get-favorites";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Brukt elbil – kjøpsguide",
  description:
    "Praktisk guide til kjøp av brukt elbil: sjekkliste, batterihelse (SOH) og lenker til publiserte modeller.",
  alternates: { canonical: "/bruktbil" },
  openGraph: {
    title: "Brukt elbil – kjøpsguide | EVFAKTA",
    description:
      "Praktisk guide til kjøp av brukt elbil: sjekkliste, batterihelse (SOH) og lenker til publiserte modeller.",
    url: "/bruktbil",
  },
};

const GUIDE_CANDIDATE_HINT =
  "Tesla Model Y, Tesla Model 3, Nissan Leaf og Volkswagen e-Golf";

const checklist = [
  "Servicehistorikk og eventuelle batterireparasjoner",
  "Ladehistorikk: hyppig DC-hurtiglading vs. hovedsakelig AC",
  "Synlig skade på ladeport, kabler og adaptere",
  "Dekk, bremser og fjæring — elbiler er tunge",
  "Programvareversjon og kjente tilbakekallinger",
  "SOH / batterihelse når selger eller verksted kan dokumentere det",
  "Rekkeviddeopplevelse i værforhold du faktisk kjører i",
];

export default async function UsedEvGuidePage() {
  const [cars, user, favoriteSlugs] = await Promise.all([
    getPublishedCars(),
    getAuthUser(),
    getFavoriteSlugs(),
  ]);

  const related = cars
    .filter((car) => {
      const hay = `${car.slug} ${car.brand} ${car.model}`.toLowerCase();
      return (
        hay.includes("model-y") ||
        hay.includes("model y") ||
        hay.includes("model-3") ||
        hay.includes("model 3") ||
        hay.includes("leaf") ||
        hay.includes("e-golf") ||
        hay.includes("egolf")
      );
    })
    .slice(0, 6);

  return (
    <section className="section">
      <Container className="prosePage">
        <nav className="pageBreadcrumb" aria-label="Brødsmulesti">
          <Link href="/">Hjem</Link>
          <span>/</span>
          <span aria-current="page">Bruktbil</span>
        </nav>

        <div className="pageHeader">
          <Eyebrow>Kjøpsguide</Eyebrow>
          <h1>Brukt elbil — kjøp med åpne øyne</h1>
          <p className="lead narrow">
            En praktisk oversikt for bruktmarkedet. Dette er redaksjonell veiledning —
            ikke en erstatning for tilstandsrapport eller verkstedkontroll.
          </p>
        </div>

        <section className="proseBlock" aria-labelledby="guide-heading">
          <h2 id="guide-heading">Kjøpsguide</h2>
          <p>
            Start med behov: daglig distanse, hurtiglading, trekkraft og plass.
            Sammenlign deretter publiserte spesifikasjoner på EVFAKTA, og verifiser
            tilstand på den konkrete bilen du vurderer.
          </p>
          <p>
            Batteriets alder, ladevaner og klimahistorikk betyr mer enn modellnavnet
            alene. Be om dokumentasjon — ikke stol på muntlige anslag.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="check-heading">
          <h2 id="check-heading">Sjekkliste ved visning</h2>
          <ul>
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="proseBlock" aria-labelledby="soh-heading">
          <h2 id="soh-heading">Batterihelse (SOH)</h2>
          <p>
            SOH (State of Health) beskriver hvor mye kapasitet batteriet har igjen
            sammenlignet med nytt. Tallene kommer fra bilens system, verkstedutstyr
            eller tredjepartslesere — ikke fra EVFAKTA-tester.
          </p>
          <p>
            Vi tilbyr foreløpig ingen batteridegradering­skalkulator. Når en slik
            funksjon er klar og etterprøvbar, vil den dukke opp her — ikke før.
          </p>
        </section>

        <section className="proseBlock" aria-labelledby="models-heading">
          <h2 id="models-heading">Relaterte publiserte modeller</h2>
          <p>
            Modellspesifikke bruktbilguider publiseres først når de er ferdige.
            Under viser vi bare modeller som faktisk er publisert i databasen nå.
          </p>
          {related.length > 0 ? (
            <CarGrid
              cars={related}
              variant="compact"
              isLoggedIn={Boolean(user)}
              favoriteSlugs={favoriteSlugs}
            />
          ) : (
            <p>
              Ingen av kandidatmodellene ({GUIDE_CANDIDATE_HINT}) er
              publisert ennå.{" "}
              <Link href="/modeller" className="textLink">
                Se alle publiserte modeller →
              </Link>
            </p>
          )}
        </section>

        <section className="proseBlock" aria-labelledby="next-heading">
          <h2 id="next-heading">Videre</h2>
          <ul>
            <li>
              <Link href="/sammenlign">Sammenlign publiserte modeller</Link>
            </li>
            <li>
              <Link href="/modeller">Bla i kataloget</Link>
            </li>
            <li>
              <Link href="/info">Les om kilder og metode</Link>
            </li>
          </ul>
        </section>
      </Container>
    </section>
  );
}
