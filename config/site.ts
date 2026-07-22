export type NavLink = {
  label: string;
  href: string;
};

export const navLinks: NavLink[] = [
  { label: "Hjem", href: "/" },
  { label: "Modeller", href: "/modeller" },
  { label: "Sammenlign", href: "/sammenlign" },
  { label: "Kalkulator", href: "/kalkulator" },
  { label: "Rimeligste", href: "/rimeligste" },
  { label: "Verktøy", href: "/verktoy" },
  { label: "Testdata", href: "/testdata" },
  { label: "Ladestasjoner", href: "/ladestasjoner" },
  { label: "Bruktbil", href: "/bruktbil" },
  { label: "Info", href: "/info" },
];

export const primaryNavLinks: NavLink[] = [
  { label: "Modeller", href: "/modeller" },
  { label: "Sammenlign", href: "/sammenlign" },
  { label: "Kalkulator", href: "/kalkulator" },
];

export const siteConfig = {
  name: "EVFAKTA.no",
  tagline: "Norges elbil-database med tydelige kilder og oppdaterte fakta.",
  contactEmail: "kontakt@evfakta.no",
};
