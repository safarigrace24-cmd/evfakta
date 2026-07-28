import type { Metadata } from "next";
import ComingSoonPage from "@/components/ui/coming-soon-page";

export const metadata: Metadata = {
  title: "Testdata",
  description:
    "Uavhengige testdata publiseres først når hver verdi har kilde og sjekket-dato.",
  robots: { index: false, follow: true },
};

export default function TestDataPage() {
  return (
    <ComingSoonPage
      eyebrow="Under utvikling"
      title="Testdata"
      description="Vi publiserer ikke sommer-/vinterrekkevidde eller målte ladetider som «testdata» før hver verdi er lagret med kilde og sist sjekket."
      reasons={[
        "WLTP og produsenttall er ikke det samme som uavhengige målinger",
        "Generiske prosentpåstander uten kilde er fjernet",
        "EVFAKTA hevder ikke egne tester uten dokumentasjon",
      ]}
    />
  );
}
