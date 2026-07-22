import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";

const features = [
  {
    title: "Sammenlign modeller",
    description: "Legg biler side om side og se hvem som leder på pris, rekkevidde og lading.",
    href: "/sammenlign",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Ladekostnad-kalkulator",
    description: "Estimer årlig ladekostnad hjemme og på hurtiglader basert på kjørelengde.",
    href: "/kalkulator",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 6h8M8 10h2M12 10h2M8 14h2M12 14h2M8 18h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Oppdaterte kilder",
    description: "Hver modell viser når data sist ble verifisert mot norske produsentkilder.",
    href: "/modeller",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section className="section sectionAlt">
      <Container>
        <div className="featuresHeader">
          <Eyebrow>Verktøy og fakta</Eyebrow>
          <h2>Bygget for norske elbilkjøpere</h2>
        </div>
        <div className="featuresGrid">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href} className="featureCard">
              <div className="featureIcon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="featureLink">Les mer →</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
