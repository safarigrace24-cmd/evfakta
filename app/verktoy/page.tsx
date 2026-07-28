import type { Metadata } from "next";
import ComingSoonPage from "@/components/ui/coming-soon-page";

export const metadata: Metadata = {
  title: "Verktøy",
  description: "EVFAKTA-verktøy er under utvikling og er ikke klare for offentlig bruk.",
  robots: { index: false, follow: true },
};

export default function ToolsPage() {
  return (
    <ComingSoonPage
      eyebrow="Under utvikling"
      title="Verktøy"
      description="Rekkeviddekalkulator, ladeplanlegger og totalkostnad er planlagt — men ikke funksjonelle ennå. Vi reklamerer ikke for uferdige verktøy."
      reasons={[
        "Rekkeviddekalkulator: ikke klar",
        "Ladeplanlegger: ikke klar",
        "Totalkostnad: ikke klar",
      ]}
    />
  );
}
