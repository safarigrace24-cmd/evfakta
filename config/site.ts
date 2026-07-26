export type NavLink = {
  label: string;
  href: string;
};

/**
 * Full public IA for v1.0 (mobile drawer + shared destinations).
 * Unfinished stub tools stay out of navigation.
 */
export const navLinks: NavLink[] = [
  { label: "Hjem", href: "/" },
  { label: "Modeller", href: "/modeller" },
  { label: "Merker", href: "/merker" },
  { label: "Sammenlign", href: "/sammenlign" },
];

/** Desktop top-level links. */
export const primaryNavLinks: NavLink[] = [
  { label: "Modeller", href: "/modeller" },
  { label: "Sammenlign", href: "/sammenlign" },
];

/**
 * Desktop “Mer” dropdown — finished public destinations not shown
 * as primary top-level items. No unfinished stubs.
 */
export const moreNavLinks: NavLink[] = [
  { label: "Merker", href: "/merker" },
];

export const siteConfig = {
  name: "EVFAKTA.no",
  tagline: "Norges elbil-database med tydelige kilder og oppdaterte fakta.",
  contactEmail: "kontakt@evfakta.no",
};
