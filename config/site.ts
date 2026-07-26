export type NavLink = {
  label: string;
  href: string;
};

/** Primary IA for v1.0 — hide unfinished destinations from main nav. */
export const navLinks: NavLink[] = [
  { label: "Hjem", href: "/" },
  { label: "Modeller", href: "/modeller" },
  { label: "Merker", href: "/merker" },
  { label: "Sammenlign", href: "/sammenlign" },
];

export const primaryNavLinks: NavLink[] = [
  { label: "Modeller", href: "/modeller" },
  { label: "Merker", href: "/merker" },
  { label: "Sammenlign", href: "/sammenlign" },
];

export const siteConfig = {
  name: "EVFAKTA.no",
  tagline: "Norges elbil-database med tydelige kilder og oppdaterte fakta.",
  contactEmail: "kontakt@evfakta.no",
};
