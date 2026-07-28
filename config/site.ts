export type NavLink = {
  label: string;
  href: string;
};

export type SocialLink = {
  label: string;
  href: string;
  network: "youtube" | "tiktok" | "instagram" | "linkedin";
};

/**
 * Complete public platform IA (old structure + Design System 2.0).
 * All destinations stay in navigation — unfinished pages show “Under utvikling”.
 * Merker and “Mer” are intentionally omitted from main nav.
 */
export const platformNavLinks: NavLink[] = [
  { label: "Hjem", href: "/" },
  { label: "Modeller", href: "/modeller" },
  { label: "Sammenlign", href: "/sammenlign" },
  { label: "Kalkulator", href: "/kalkulator" },
  { label: "Rimeligste", href: "/rimeligste" },
  { label: "Verktøy", href: "/verktoy" },
  { label: "Testdata", href: "/testdata" },
  { label: "Ladestasjoner", href: "/ladekart" },
  { label: "Bruktbil", href: "/bruktbil" },
  { label: "Info", href: "/info" },
];

/** Mobile drawer + desktop primary — full platform list. */
export const navLinks: NavLink[] = platformNavLinks;

/** Desktop top-level links — full platform list (no Merker, no Mer). */
export const primaryNavLinks: NavLink[] = platformNavLinks;

/** @deprecated Kept empty — “Mer” dropdown removed from public IA. */
export const moreNavLinks: NavLink[] = [];

export const siteConfig = {
  name: "EVFAKTA",
  legalName: "EVFAKTA.no",
  tagline: "Finn riktig elbil – basert på fakta.",
  description:
    "Sammenlign elbiler, rekkevidde, lading, batteri og spesifikasjoner med kildebaserte fakta for det norske markedet.",
  url: "https://www.evfakta.no",
  contactEmail: "post@evfakta.no",
  brand: {
    logo: "/brand/evfakta-logo.png",
    logoLight: "/brand/evfakta-logo-light.png",
    icon: "/brand/evfakta-icon.png",
    mark: "/brand/evfakta-mark.png",
    appleTouchIcon: "/brand/apple-touch-icon.png",
    ogImage: "/brand/og-image.png",
  },
  socialLinks: [
    {
      label: "EVFAKTA på YouTube",
      href: "https://www.youtube.com/channel/UCuOYFNBVUGH_v05CbIrEnsg",
      network: "youtube",
    },
    {
      label: "EVFAKTA på TikTok",
      href: "https://www.tiktok.com/@evfakta",
      network: "tiktok",
    },
    {
      label: "EVFAKTA på Instagram",
      href: "https://www.instagram.com/evfakta.no/",
      network: "instagram",
    },
    {
      label: "EVFAKTA på LinkedIn",
      href: "https://www.linkedin.com/company/evfakta.no/?viewAsMember=true",
      network: "linkedin",
    },
  ] satisfies SocialLink[],
  /** Header social row — YouTube, TikTok, LinkedIn only. */
  headerSocialLinks: [
    {
      label: "EVFAKTA på YouTube",
      href: "https://www.youtube.com/channel/UCuOYFNBVUGH_v05CbIrEnsg",
      network: "youtube" as const,
    },
    {
      label: "EVFAKTA på TikTok",
      href: "https://www.tiktok.com/@evfakta",
      network: "tiktok" as const,
    },
    {
      label: "EVFAKTA på LinkedIn",
      href: "https://www.linkedin.com/company/evfakta.no/?viewAsMember=true",
      network: "linkedin" as const,
    },
  ],
};
