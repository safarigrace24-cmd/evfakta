import type { Metadata } from "next";
import ComingSoonPage from "@/components/ui/coming-soon-page";

export const metadata: Metadata = {
  title: "Ladestasjoner",
  description:
    "Nasjonalt ladekart kommer når EVFAKTA har en vedlikeholdt, pålitelig datakilde.",
  robots: { index: false, follow: true },
};

export default function ChargingMapPage() {
  return (
    <ComingSoonPage
      eyebrow="Under utvikling"
      title="Ladestasjoner"
      description="Vi viser ikke en liste med noen få stasjoner som om det var et nasjonalt ladekart. Livedata kommer når en pålitelig datakilde er koblet inn."
      reasons={[
        "Ingen live-integrasjon i denne utgaven",
        "Ingen misvisende stasjonstellinger",
        "Bruk kataloget for bilfakta i mellomtiden",
      ]}
    />
  );
}
