import type { Metadata } from "next";
import ComingSoonPage from "@/components/ui/coming-soon-page";
import { PUBLIC_SHOW_PRICES } from "@/lib/public/display-policy";

export const metadata: Metadata = {
  title: "Rimeligste elbiler",
  description:
    "Rangering av rimeligste elbiler kommer når offentlige priser er klare for visning.",
  robots: { index: false, follow: true },
};

export default function CheapestPage() {
  return (
    <ComingSoonPage
      eyebrow="Under utvikling"
      title="Rimeligste elbiler"
      description={
        PUBLIC_SHOW_PRICES
          ? "Prisvisning er aktivert, men denne rangeringssiden er ikke ferdig ennå."
          : "Offentlige priser er midlertidig skjult. Vi publiserer ingen hardkodet «rimeligste»-liste uten pålitelige, daterte priskilder."
      }
      reasons={[
        "Ingen statisk «15 rimeligste»-liste",
        "Kun publiserte modeller vil inngå når funksjonen er klar",
        "Priskilde og sist sjekket vil vises sammen med rangeringen",
      ]}
    />
  );
}
