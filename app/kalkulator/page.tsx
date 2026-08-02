import type { Metadata } from "next";
import { Suspense } from "react";
import ChargingCostCalculator from "@/components/calculator/charging-cost-calculator";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";

export const metadata: Metadata = {
  title: "Ladekostnadskalkulator",
  description:
    "Estimer ladekostnad og månedlig strømbruk for elbil. Resultatene er estimater — ikke eksakte priser.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/kalkulator" },
};

export default function CalculatorPage() {
  return (
    <section className="section chargingCalcPage">
      <Container>
        <Eyebrow>Verktøy</Eyebrow>
        <h1>Ladekostnadskalkulator</h1>
        <p className="lead narrow">
          Beregn estimert energi og kostnad for en lading, og valgfritt månedlig
          strømbruk. Du oppgir egne priser — EVFAKTA hardkoder ikke markedspriser.
        </p>
        <Suspense fallback={<p className="adminHint">Laster kalkulator…</p>}>
          <ChargingCostCalculator />
        </Suspense>
      </Container>
    </section>
  );
}
