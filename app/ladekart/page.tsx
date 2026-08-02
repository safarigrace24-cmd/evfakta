import type { Metadata } from "next";
import ChargingMapClient from "@/components/charging/charging-map-client";
import Container from "@/components/layout/container";
import ComingSoonPage from "@/components/ui/coming-soon-page";
import Eyebrow from "@/components/ui/eyebrow";
import { isNobilConfigured } from "@/lib/charging/nobil-client";
import { isChargingMapEnabled } from "@/lib/integrations/feature-flags";

export const metadata: Metadata = {
  title: "Ladestasjoner",
  description:
    "Finn ladestasjoner i nærheten med kart og data fra NOBIL. Posisjonen din lagres ikke.",
  robots: { index: false, follow: true },
};

export default function ChargingMapPage() {
  const enabled = isChargingMapEnabled();
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
  const nobilReady = isNobilConfigured();

  if (!enabled) {
    return (
      <ComingSoonPage
        eyebrow="Under utvikling"
        title="Ladestasjoner"
        description="Ladekartet er ikke aktivert i dette miljøet ennå (CHARGING_MAP_ENABLED)."
        reasons={[
          "Feature-flag er av",
          "Krever Google Maps + NOBIL-nøkler før aktivering",
          "Bruk kataloget for bilfakta i mellomtiden",
        ]}
      />
    );
  }

  if (!mapsKey || !nobilReady) {
    return (
      <ComingSoonPage
        eyebrow="Konfigureres"
        title="Ladestasjoner"
        description="Ladekartet mangler nødvendig konfigurasjon. Vi viser ikke et tomt eller misvisende kart."
        reasons={[
          !mapsKey ? "Google Maps-nøkkel mangler" : "Google Maps er konfigurert",
          !nobilReady ? "NOBIL-nøkkel mangler" : "NOBIL er konfigurert",
          "Posisjon hentes først etter at du trykker «Bruk min posisjon»",
        ]}
      />
    );
  }

  return (
    <section className="section chargingMapPage">
      <Container>
        <Eyebrow>NOBIL + Google Maps</Eyebrow>
        <h1>Ladestasjoner</h1>
        <p className="lead narrow">
          Finn ladestasjoner i nærheten. Kart via Google Maps. Stasjonsdata fra
          NOBIL. Posisjonen din brukes kun lokalt i nettleseren for søket og
          lagres ikke av EVFAKTA.
        </p>
        <ChargingMapClient mapsApiKey={mapsKey} />
      </Container>
    </section>
  );
}
