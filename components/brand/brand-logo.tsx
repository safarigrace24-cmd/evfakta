import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";

type BrandLogoProps = {
  href?: string | null;
  className?: string;
  /** Horizontal lockup on light backgrounds (header). */
  variant?: "default" | "light" | "icon";
  priority?: boolean;
};

const ALT = "EVFAKTA – Finn riktig elbil basert på fakta";

/**
 * Official EVFAKTA logo lockup from public/brand assets.
 */
export default function BrandLogo({
  href = "/",
  className = "",
  variant = "default",
  priority = false,
}: BrandLogoProps) {
  const classes = ["brandLogo", `brandLogo--${variant}`, className]
    .filter(Boolean)
    .join(" ");
  const isLinked = Boolean(href);
  const imgAlt = isLinked ? "" : ALT;

  const inner =
    variant === "icon" ? (
      <Image
        src={siteConfig.brand.icon}
        alt={imgAlt}
        width={40}
        height={40}
        className="brandLogoIconImg"
        priority={priority}
      />
    ) : variant === "light" ? (
      <Image
        src={siteConfig.brand.logoLight}
        alt={imgAlt}
        width={200}
        height={56}
        className="brandLogoImg"
        priority={priority}
      />
    ) : (
      <>
        <Image
          src={siteConfig.brand.logo}
          alt={imgAlt}
          width={200}
          height={56}
          className="brandLogoImg brandLogoImg--full"
          priority={priority}
        />
        <Image
          src={siteConfig.brand.icon}
          alt=""
          width={40}
          height={40}
          className="brandLogoImg brandLogoImg--compact"
          priority={priority}
        />
      </>
    );

  if (isLinked && href) {
    return (
      <Link href={href} className={classes} aria-label={ALT}>
        {inner}
      </Link>
    );
  }

  return (
    <span className={classes} role="img" aria-label={ALT}>
      {inner}
    </span>
  );
}
