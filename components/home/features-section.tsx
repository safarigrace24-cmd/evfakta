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
    href: "/info",
  },
];

export default function FeaturesSection() {
  return (
    <section className="section homeSection" aria-labelledby="features-heading">
      <Container>
        <div className="featuresHeader homeSectionHeader">
          <Eyebrow>Slik fungerer EVFAKTA</Eyebrow>
          <h2 id="features-heading">Bygget for norske elbilkjøpere</h2>
          <p className="lead narrow">
            Én database. Ærlige tall. Uferdige områder er synlige og merket tydelig.
          </p>
        </div>
        <div className="featuresGrid">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="featureCard"
              aria-label={`${feature.title} — gå videre`}
            >
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="featureLink" aria-hidden="true">
                Gå videre →
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
