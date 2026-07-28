import type { Metadata } from "next";
import ComingSoonPage from "@/components/ui/coming-soon-page";

export const metadata: Metadata = {
  title: "Kalkulator",
  description:
    "EVFAKTA-kalkulatoren er under utvikling. Sammenlign modeller i kataloget i mellomtiden.",
  robots: { index: false, follow: true },
};

export default function CalculatorPage() {
  return (
    <ComingSoonPage
      eyebrow="Under utvikling"
      title="Lade- og kostnads­kalkulator"
      description="Kalkulatorlogikk er ikke klar i denne utgaven. Vi viser ikke estimater før beregningen er etterprøvbar."
      reasons={[
        "Ingen ferdig beregningsmotor i kodebasen ennå",
        "Vi viser ikke estimater før beregningen er etterprøvbar",
        "Bruk katalog og sammenligning for faktabaserte valg",
      ]}
    />
  );
}
