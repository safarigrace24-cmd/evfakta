"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks, primaryNavLinks } from "@/config/site";

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="siteHeader">
      <div className="container headerInner">
        <Link href="/" className="brand">
          <span className="brandMark">EV</span>
          <span className="brandText">FAKTA.no</span>
        </Link>

        <nav className="navDesktop" aria-label="Hovedmeny">
          {primaryNavLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "navLink active" : "navLink"}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <details className="navMore">
            <summary>Mer</summary>
            <div className="navMoreMenu">
              {navLinks
                .filter(({ href }) => !primaryNavLinks.some((p) => p.href === href) && href !== "/")
                .map(({ label, href }) => (
                  <Link key={href} href={href} className={isActive(href) ? "active" : undefined}>
                    {label}
                  </Link>
                ))}
            </div>
          </details>
        </nav>

        <div className="headerActions">
          <Link href="/modeller" className="button buttonSm primary headerCta">
            Se modeller
          </Link>
          <button
            type="button"
            className="menuToggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Lukk meny" : "Åpne meny"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`mobileNav${menuOpen ? " open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobilmeny">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "mobileNavLink active" : "mobileNavLink"}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="navOverlay"
          aria-label="Lukk meny"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
