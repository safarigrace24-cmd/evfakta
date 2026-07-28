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
 * Full public IA (mobile drawer + shared destinations).
 * Unfinished stub tools stay out of navigation.
 */
export const navLinks: NavLink[] = [
  { label: "Hjem", href: "/" },
  { label: "Modeller", href: "/modeller" },
  { label: "Merker", href: "/merker" },
  { label: "Sammenlign", href: "/sammenlign" },
];

/** Desktop top-level links — finished destinations only. */
export const primaryNavLinks: NavLink[] = [
  { label: "Modeller", href: "/modeller" },
  { label: "Merker", href: "/merker" },
  { label: "Sammenlign", href: "/sammenlign" },
];

/**
 * Desktop “Mer” dropdown — finished destinations not shown top-level.
 * Empty while Guider / tools are unfinished.
 */
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
};
