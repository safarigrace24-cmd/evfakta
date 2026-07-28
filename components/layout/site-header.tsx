"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks, primaryNavLinks, siteConfig } from "@/config/site";
import { isNavRouteUnderDevelopment } from "@/lib/public/feature-flags";
import LogoutButton from "@/components/auth/logout-button";
import BrandLogo from "@/components/brand/brand-logo";
import SocialIcon from "@/components/brand/social-icon";

type SiteHeaderProps = {
  userEmail?: string | null;
  isAdmin?: boolean;
};

function NavLabel({ label, href }: { label: string; href: string }) {
  const underDevelopment = isNavRouteUnderDevelopment(href);
  return (
    <>
      <span>{label}</span>
      {underDevelopment ? (
        <span className="navWipBadge">Under utvikling</span>
      ) : null}
    </>
  );
}

export default function SiteHeader({ userEmail = null, isAdmin = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = Boolean(userEmail);
  const isAdminRoute = pathname.startsWith("/admin");

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

  const navAriaLabel = (label: string, href: string) =>
    isNavRouteUnderDevelopment(href) ? `${label} — Under utvikling` : undefined;

  if (isAdminRoute) {
    return (
      <header className="siteHeader siteHeaderAdmin">
        <div className="container headerInner">
          <BrandLogo className="brandLogo--header" priority />
          <nav className="navDesktop" aria-label="Admin-snarveier">
            <Link href="/admin" className="navLink active">
              Admin
            </Link>
            <Link href="/" className="navLink">
              Offentlig side
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="siteHeader">
      <div className="container headerInner headerInnerPlatform">
        <BrandLogo className="brandLogo--header" priority />

        <nav className="navDesktop navDesktopPlatform" aria-label="Hovedmeny">
          {primaryNavLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={
                isActive(href)
                  ? "navLink navLinkWithStatus active"
                  : "navLink navLinkWithStatus"
              }
              aria-current={isActive(href) ? "page" : undefined}
              aria-label={navAriaLabel(label, href)}
            >
              <NavLabel label={label} href={href} />
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
        </nav>

        <div className="headerActions">
          <ul className="headerSocial" aria-label="Sosiale medier">
            {siteConfig.headerSocialLinks.map((link) => (
              <li key={link.network}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="headerSocialLink"
                >
                  <SocialIcon network={link.network} />
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/modeller"
            className="headerSearchLink"
            aria-label="Søk i modeller"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
          </Link>
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
          <form className="mobileSearch" action="/modeller" method="get" role="search">
            <label htmlFor="mobile-search" className="visuallyHidden">
              Søk modeller
            </label>
            <input
              id="mobile-search"
              type="search"
              name="q"
              placeholder="Søk modell eller merke…"
              autoComplete="off"
            />
            <button type="submit" className="button primary buttonSm">
              Søk
            </button>
          </form>
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={
                isActive(href)
                  ? "mobileNavLink mobileNavLinkWithStatus active"
                  : "mobileNavLink mobileNavLinkWithStatus"
              }
              aria-current={isActive(href) ? "page" : undefined}
              aria-label={navAriaLabel(label, href)}
              onClick={() => setMenuOpen(false)}
            >
              <NavLabel label={label} href={href} />
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={isActive("/admin") ? "mobileNavLink active" : "mobileNavLink"}
              aria-current={isActive("/admin") ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              Admin
            </Link>
          )}
          <div className="mobileSocialRow" aria-label="Sosiale medier">
            {siteConfig.headerSocialLinks.map((link) => (
              <a
                key={link.network}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="headerSocialLink"
                onClick={() => setMenuOpen(false)}
              >
                <SocialIcon network={link.network} />
              </a>
            ))}
          </div>
          {isLoggedIn ? (
            <>
              <Link
                href="/min-side"
                className={isActive("/min-side") ? "mobileNavLink active" : "mobileNavLink"}
                aria-current={isActive("/min-side") ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                Min side
              </Link>
              <div className="mobileAuthAction">
                <LogoutButton className="button secondary mobileLogout" />
              </div>
            </>
          ) : (
            <Link href="/login" className="mobileNavLink" onClick={() => setMenuOpen(false)}>
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
