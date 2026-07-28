"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import BrandLogo from "@/components/brand/brand-logo";
import SocialIcon from "@/components/brand/social-icon";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="footer">
      <div className="container footerInner">
        <div className="footerBrandBlock">
          <BrandLogo variant="light" className="footerBrand" href="/" />
          <p className="footerTagline">{siteConfig.tagline}</p>
        </div>

        <div className="footerLinks">
          <div className="footerCol">
            <strong>Utforsk</strong>
            <Link href="/modeller">Modeller</Link>
            <Link href="/merker">Merker</Link>
            <Link href="/sammenlign">Sammenlign</Link>
          </div>
          <div className="footerCol">
            <strong>Konto</strong>
            <Link href="/min-side">Min side</Link>
            <Link href="/login">Logg inn</Link>
            <Link href="/registrer">Registrer</Link>
          </div>
          <div className="footerCol">
            <strong>Kontakt</strong>
            <p>Tips, rettelser eller ønske om ny modell?</p>
            <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
            <ul className="footerSocial" aria-label="Sosiale medier">
              {siteConfig.socialLinks.map((link) => (
                <li key={link.network}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="footerSocialLink"
                  >
                    <SocialIcon network={link.network} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="container copyright">
        <p>© 2026 {siteConfig.legalName}</p>
        <p className="footerDisclaimer">
          Spesifikasjoner er hentet fra oppgitte kilder og kan endres. WLTP-tall er
          laboratoriemål, ikke garantert reell rekkevidde.
        </p>
      </div>
    </footer>
  );
}
