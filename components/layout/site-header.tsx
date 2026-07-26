"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { moreNavLinks, navLinks, primaryNavLinks } from "@/config/site";
import LogoutButton from "@/components/auth/logout-button";

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
