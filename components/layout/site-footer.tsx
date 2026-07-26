"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navLinks, siteConfig, socialLinks } from "@/config/site";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return (
      <footer className="footer footerAdmin">
        <div className="container copyright">
          © 2026 EVFAKTA Admin – CMS for katalog og publisering.
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="container footerInner">
        <div className="footerBrandBlock">
          <Link href="/" className="brand footerBrand">
            <Image
              src={siteConfig.logoUrl}
              alt=""
              width={36}
              height={36}
              className="brandLogo"
              unoptimized
            />
            <span className="brandText">
              EVFAKTA<span className="brandDot">.no</span>
            </span>
          </Link>
          <p>{siteConfig.tagline}</p>
          <div className="footerContact">
            <strong>Kontakt</strong>
            <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
            <p>Tips, rettelser eller ønske om ny modell? Send oss en e-post.</p>
          </div>
          <div className="footerSocial">
            {socialLinks.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="footerLinks">
          <div className="footerCol">
            <strong>Sider</strong>
            {navLinks.map(({ label, href }) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </div>
          <div className="footerCol">
            <strong>Kilder</strong>
            <p>
              Vi viser spesifikasjoner med tydelige kilder og sist oppdatert-dato per modell når
              data er satt.
            </p>
            <Link href="/modeller">Utforsk modellene</Link>
          </div>
          <div className="footerCol">
            <strong>Konto</strong>
            <Link href="/min-side">Min side</Link>
            <Link href="/login">Logg inn</Link>
            <Link href="/sammenlign">Sammenlign elbiler</Link>
            <Link href="/modeller">Elbildatabase</Link>
          </div>
        </div>
      </div>
      <div className="container copyright">
        © 2026 EVFAKTA.no – Norges elbil-database. Estimat og spesifikasjoner kan variere mellom
        utstyrsvarianter.
      </div>
    </footer>
  );
}
