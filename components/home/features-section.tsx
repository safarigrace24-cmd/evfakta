import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";

const features = [
  {
    title: "Sammenlign modeller",
    description:
      "Legg biler side om side og se hvem som leder på rekkevidde, batteri og lading.",
    href: "/sammenlign",
  },
  {
    title: "Utforsk merker",
    description: "Gå fra merke til publiserte modeller med godkjente bilder og nøkkeldata.",
    href: "/merker",
  },
  {
    title: "Kilder nær tallene",
    description:
      "Hver modell viser kilde og sist sjekket-dato, slik at faktaene er etterprøvbare.",
    href: "/modeller",
  },
];

export default function FeaturesSection() {
  return (
    <section className="section sectionAlt">
      <Container>
        <div className="featuresHeader">
          <Eyebrow>Slik fungerer EVFAKTA</Eyebrow>
          <h2>Bygget for norske elbilkjøpere</h2>
          <p className="lead narrow">
            Én database. Ærlige tall. Ingen uferdige verktøy i veien.
          </p>
        </div>
        <div className="featuresGrid">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href} className="featureCard">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="featureLink">Gå videre →</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
