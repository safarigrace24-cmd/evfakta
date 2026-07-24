"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks, primaryNavLinks } from "@/config/site";
import LogoutButton from "@/components/auth/logout-button";

type SiteHeaderProps = {
  userEmail?: string | null;
  isAdmin?: boolean;
};

export default function SiteHeader({ userEmail = null, isAdmin = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = Boolean(userEmail);

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
          {isAdmin && (
            <Link
              href="/admin"
              className={isActive("/admin") ? "navLink active" : "navLink"}
              aria-current={isActive("/admin") ? "page" : undefined}
            >
              Admin
            </Link>
          )}
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
          {isLoggedIn ? (
            <div className="headerAuth">
              <Link
                href="/min-side"
                className={isActive("/min-side") ? "navLink active headerAuthLink" : "navLink headerAuthLink"}
                aria-current={isActive("/min-side") ? "page" : undefined}
              >
                Min side
              </Link>
              <LogoutButton className="button secondary buttonSm headerAuthLogout" />
            </div>
          ) : (
            <Link href="/login" className="navLink headerAuthLink">
              Logg inn
            </Link>
          )}
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
          {isAdmin && (
            <Link
              href="/admin"
              className={isActive("/admin") ? "mobileNavLink active" : "mobileNavLink"}
              aria-current={isActive("/admin") ? "page" : undefined}
            >
              Admin
            </Link>
          )}
          {isLoggedIn ? (
            <>
              <Link
                href="/min-side"
                className={isActive("/min-side") ? "mobileNavLink active" : "mobileNavLink"}
                aria-current={isActive("/min-side") ? "page" : undefined}
              >
                Min side
              </Link>
              <div className="mobileAuthAction">
                <LogoutButton className="button secondary mobileLogout" />
              </div>
            </>
          ) : (
            <Link href="/login" className="mobileNavLink">
              Logg inn
            </Link>
          )}
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
