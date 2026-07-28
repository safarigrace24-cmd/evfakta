"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { moreNavLinks, navLinks, primaryNavLinks } from "@/config/site";
import LogoutButton from "@/components/auth/logout-button";
import BrandLogo from "@/components/brand/brand-logo";

type SiteHeaderProps = {
  userEmail?: string | null;
  isAdmin?: boolean;
};

export default function SiteHeader({ userEmail = null, isAdmin = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreMenuId = useId();
  const isLoggedIn = Boolean(userEmail);
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!moreOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
      <div className="container headerInner">
        <BrandLogo className="brandLogo--header" priority />

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
          {moreNavLinks.length > 0 && (
            <div className="navMore" ref={moreRef}>
              <button
                type="button"
                className={moreOpen ? "navMoreTrigger open" : "navMoreTrigger"}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                aria-controls={moreMenuId}
                onClick={() => setMoreOpen((open) => !open)}
              >
                Mer
              </button>
              {moreOpen && (
                <div id={moreMenuId} className="navMoreMenu" role="menu" aria-label="Flere sider">
                  {moreNavLinks.map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      role="menuitem"
                      className={isActive(href) ? "active" : undefined}
                      aria-current={isActive(href) ? "page" : undefined}
                      onClick={() => setMoreOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="headerActions">
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
              className={isActive(href) ? "mobileNavLink active" : "mobileNavLink"}
              aria-current={isActive(href) ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {label}
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
