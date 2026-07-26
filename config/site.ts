export type NavLink = {
  label: string;
  href: string;
  badge?: string;
};

/**
 * Full IA including unfinished tools (kept for future enablement).
 * Do not render these in public chrome until the destination is complete.
 */
export const allNavLinks: NavLink[] = [
  { label: "Hjem", href: "/" },
  { label: "Modeller", href: "/modeller" },
  { label: "Merker", href: "/merker" },
  { label: "Sammenlign", href: "/sammenlign" },
  { label: "Kalkulator", href: "/kalkulator" },
  { label: "Rimeligste", href: "/rimeligste" },
  { label: "Verktøy", href: "/verktoy" },
  { label: "Testdata", href: "/testdata" },
  { label: "Ladestasjoner", href: "/ladekart" },
  { label: "Bruktbil", href: "/bruktbil", badge: "NY" },
  { label: "Info", href: "/info" },
];

/** Unfinished public tools — routes remain, but stay out of nav/footer. */
export const hiddenPublicToolHrefs = [
  "/kalkulator",
  "/rimeligste",
  "/verktoy",
  "/testdata",
  "/ladekart",
  "/bruktbil",
  "/info",
] as const;

/**
 * Public navigation — only complete surfaces.
 * Stub/placeholder tools are intentionally omitted.
 */
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

export const socialLinks = [
  { label: "YouTube", href: "https://www.youtube.com/@EVFAKTA" },
  { label: "TikTok", href: "https://www.tiktok.com/@evfakta" },
  { label: "Instagram", href: "https://www.instagram.com/evfakta.no" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/evfakta" },
] as const;

export const siteConfig = {
  name: "EVFAKTA.no",
  shortName: "EVFAKTA",
  tagline:
    "Norges elbil-database: sammenlign modeller med tydelige spesifikasjoner og kilder for det norske markedet.",
  eyebrow: "Norges uavhengige elbil-database",
  contactEmail: "post@evfakta.no",
  logoUrl:
    "https://eu.chat-img.sintra.ai/4becd099-f5cd-4120-8eff-ce4d8cbd99b5/ff6c24b6-d232-484f-9540-8aadc909ce70/EVFAKTA_YouTube_profile_picture.png",
};
