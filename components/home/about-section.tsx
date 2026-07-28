import Link from "next/link";
import Container from "@/components/layout/container";
import Button from "@/components/ui/button";
import Eyebrow from "@/components/ui/eyebrow";
import { siteConfig } from "@/config/site";

export default function AboutSection() {
  return (
    <section
      className="section homeSection aboutSection"
      aria-labelledby="about-heading"
    >
      <Container>
        <div className="aboutInner">
          <Eyebrow>Om EVFAKTA</Eyebrow>
          <h2 id="about-heading">Uavhengig elbil-fakta for Norge</h2>
          <p className="lead narrow">
            EVFAKTA samler kildebaserte spesifikasjoner for elbiler på det norske
            markedet. Målet er rolige, etterprøvbare tall — ikke støyende
            markedssnakk.
          </p>
          <ul className="trustList">
            <li>Publiserte modeller med godkjente bilder</li>
            <li>Kilder og sist sjekket nær spesifikasjonene</li>
            <li>Uferdige områder er synlige og merket «Under utvikling»</li>
          </ul>
          <div className="actions">
            <Button href="/info" variant="primary">
              Les om kilder og metode
            </Button>
            <a href={`mailto:${siteConfig.contactEmail}`} className="textLink">
              {siteConfig.contactEmail}
            </a>
          </div>
          <p className="aboutUsedEv">
            Planlegger du brukt elbil?{" "}
            <Link href="/bruktbil" className="textLink">
              Se kjøpsguiden →
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
