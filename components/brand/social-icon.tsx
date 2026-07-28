import type { SocialLink } from "@/config/site";

type SocialIconProps = {
  network: SocialLink["network"];
};

export default function SocialIcon({ network }: SocialIconProps) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (network) {
    case "youtube":
      return (
        <svg {...common}>
          <path d="M22.5 7.5a3 3 0 0 0-2.1-2.1C18.6 5 12 5 12 5s-6.6 0-8.4.4A3 3 0 0 0 1.5 7.5 31 31 0 0 0 1 12a31 31 0 0 0 .5 4.5 3 3 0 0 0 2.1 2.1C5.4 19 12 19 12 19s6.6 0 8.4-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23 12a31 31 0 0 0-.5-4.5Z" />
          <path d="m10 15 5-3-5-3v6Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 4v10.2a3.8 3.8 0 1 1-3.2-3.75" />
          <path d="M14 7.5c1.4 1.6 3.2 2.5 5.2 2.7" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M6.5 9.5V18" />
          <circle cx="6.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
          <path d="M10.5 18v-5.2c0-1.8 1-2.8 2.5-2.8s2.5 1.2 2.5 2.8V18" />
          <path d="M10.5 10.5V18" />
        </svg>
      );
    default:
      return null;
  }
}
