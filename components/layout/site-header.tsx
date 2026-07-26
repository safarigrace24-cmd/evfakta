"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks, primaryNavLinks, siteConfig, socialLinks } from "@/config/site";
import LogoutButton from "@/components/auth/logout-button";

type SiteHeaderProps = {
  userEmail?: string | null;
  isAdmin?: boolean;
};

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

  if (isAdminRoute) {
    return (
      <header className="siteHeader siteHeaderAdmin">
        <div className="container headerInner">
          <Link href="/admin" className="brand">
            <span className="brandMark">EV</span>
            <span className="brandText">FAKTA Admin</span>
          </Link>
          <nav className="navDesktop" aria-label="Adminmeny">
            <Link href="/admin" className={isActive("/admin") && pathname === "/admin" ? "navLink active" : "navLink"}>
              Dashboard
            </Link>
            <Link
              href="/admin/production"
              className={isActive("/admin/production") ? "navLink active" : "navLink"}
            >
              Production
            </Link>
            <Link href="/admin/biler" className={isActive("/admin/biler") ? "navLink active" : "navLink"}>
              Biler
            </Link>
            <Link href="/admin/images" className={isActive("/admin/images") ? "navLink active" : "navLink"}>
              Images
            </Link>
            <Link href="/" className="navLink">
              Public site
            </Link>
          </nav>
          <div className="headerActions">
            {isLoggedIn ? (
              <LogoutButton className="button secondary buttonSm headerAuthLogout" />
            ) : null}
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
          <nav aria-label="Admin mobilmeny">
            <Link href="/admin" className="mobileNavLink">
              Dashboard
            </Link>
            <Link href="/admin/production" className="mobileNavLink">
              Production
            </Link>
            <Link href="/admin/biler" className="mobileNavLink">
              Biler
            </Link>
            <Link href="/admin/images" className="mobileNavLink">
              Images
            </Link>
            <Link href="/" className="mobileNavLink">
              Public site
            </Link>
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

  return (
    <header className="siteHeader">
      <div className="container headerInner">
        <Link href="/" className="brand">
          <Image
            src={siteConfig.logoUrl}
            alt=""
            width={36}
            height={36}
            className="brandLogo"
            unoptimized
          />
          <span className="brandTextBlock">
            <span className="brandText">
              EVFAKTA<span className="brandDot">.no</span>
            </span>
            <span className="brandSub">Uavhengig elbil-fakta for Norge</span>
          </span>
        </Link>

        <nav className="navDesktop" aria-label="Hovedmeny">
          {primaryNavLinks.map(({ label, href, badge }) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "navLink active" : "navLink"}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
              {badge ? <span className="navBadge">{badge}</span> : null}
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
          <div className="headerSocial" aria-label="Sosiale medier">
            {socialLinks.slice(0, 2).map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="headerSocialLink"
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
          {isLoggedIn ? (
            <div className="headerAuth">
              <Link
                href="/min-side"
                className={
                  isActive("/min-side") ? "navLink active headerAuthLink" : "navLink headerAuthLink"
                }
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
