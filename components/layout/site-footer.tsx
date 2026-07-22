import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footerInner">
        <div className="footerBrandBlock">
          <Link href="/" className="brand footerBrand">
            <span className="brandMark">EV</span>
            <span>FAKTA.no</span>
          </Link>
          <p>{siteConfig.tagline}</p>
        </div>

        <div className="footerLinks">
          <div className="footerCol">
            <strong>Utforsk</strong>
            <Link href="/modeller">Alle modeller</Link>
            <Link href="/sammenlign">Sammenlign</Link>
            <Link href="/kalkulator">Kalkulator</Link>
            <Link href="/rimeligste">Rimeligste</Link>
          </div>
          <div className="footerCol">
            <strong>Mer</strong>
            <Link href="/ladestasjoner">Ladestasjoner</Link>
            <Link href="/bruktbil">Bruktbil</Link>
            <Link href="/testdata">Testdata</Link>
            <Link href="/info">Info</Link>
          </div>
          <div className="footerCol">
            <strong>Kontakt</strong>
            <p>Tips, rettelser eller ønske om ny modell?</p>
            <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
          </div>
        </div>
      </div>
      <div className="container copyright">
        © 2026 EVFAKTA.no – Estimat og spesifikasjoner kan variere.
      </div>
    </footer>
  );
}
