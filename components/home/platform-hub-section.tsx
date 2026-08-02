import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import { platformNavLinks } from "@/config/site";
import { isNavRouteUnderDevelopment } from "@/lib/public/feature-flags";

const descriptions: Record<string, string> = {
  "/": "Start her — søk, populære modeller og oversikt over plattformen.",
  "/modeller": "Publiserte elbiler med rekkevidde, batteri, lading og kilder.",
  "/sammenlign": "Legg modeller side om side og sammenlign nøkkeltall.",
  "/kalkulator": "Estimer ladekostnad og månedlig strømbruk med egne priser.",
  "/rimeligste": "Rangering etter pris — under utvikling til priser er offentlige.",
  "/verktoy": "Rekkevidde, ladeplanlegging og totalkostnad — under utvikling.",
  "/testdata": "Uavhengige testdata med kilder — under utvikling.",
  "/ladekart": "Finn ladestasjoner i nærheten med kart og data fra NOBIL.",
  "/bruktbil": "Kjøpsguide, sjekkliste og batterihelse for brukt elbil.",
  "/info": "Hva EVFAKTA er, kildepolicy, metode og begrepsforklaringer.",
};

function statusLabel(href: string): string | null {
  return isNavRouteUnderDevelopment(href) ? "Under utvikling" : null;
}

export default function PlatformHubSection() {
  const destinations = platformNavLinks.filter((link) => link.href !== "/");

  return (
    <section
      className="section sectionAlt homeSection"
      aria-labelledby="platform-hub-heading"
    >
      <Container>
        <div className="featuresHeader homeSectionHeader">
          <Eyebrow>Hele plattformen</Eyebrow>
          <h2 id="platform-hub-heading">Alt EVFAKTA tilbyr</h2>
          <p className="lead narrow">
            En komplett elbilplattform — katalog, sammenligning, verktøy og guider.
            Uferdige områder er synlige og merket «Under utvikling».
          </p>
        </div>
        <ul className="platformHubGrid">
          {destinations.map(({ label, href }) => {
            const status = statusLabel(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="platformHubCard"
                  aria-label={
                    status ? `${label} — ${status}` : `${label} — åpne`
                  }
                >
                  <span className="platformHubCardTop">
                    <strong>{label}</strong>
                    {status ? (
                      <span className="platformHubBadge">{status}</span>
                    ) : null}
                  </span>
                  <p>{descriptions[href] ?? "Utforsk denne delen av EVFAKTA."}</p>
                  <span className="featureLink" aria-hidden="true">
                    Åpne →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
