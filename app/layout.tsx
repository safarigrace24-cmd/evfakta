import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/app-shell";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { getAuthUser } from "@/lib/auth/get-user";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { siteConfig } from "@/config/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "EVFAKTA – Finn riktig elbil basert på fakta",
    template: "%s | EVFAKTA",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/evfakta-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/brand/favicon-32.png"],
  },
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: siteConfig.name,
    title: "EVFAKTA – Finn riktig elbil basert på fakta",
    description: siteConfig.description,
    url: siteConfig.url,
    images: [
      {
        url: siteConfig.brand.ogImage,
        width: 1200,
        height: 630,
        alt: "EVFAKTA – Finn riktig elbil basert på fakta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EVFAKTA – Finn riktig elbil basert på fakta",
    description: siteConfig.description,
    images: [siteConfig.brand.ogImage],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}${siteConfig.brand.logo}`,
  email: siteConfig.contactEmail,
  description: siteConfig.description,
  sameAs: siteConfig.socialLinks.map((link) => link.href),
  contactPoint: {
    "@type": "ContactPoint",
    email: siteConfig.contactEmail,
    contactType: "customer service",
    availableLanguage: ["Norwegian", "nb"],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthUser();
  const isAdmin = isAdminEmail(user?.email);

  return (
    <html lang="nb" className={inter.variable}>
      <body>
        <AppShell>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          />
          <a href="#main-content" className="skipLink">
            Hopp til innhold
          </a>
          <SiteHeader userEmail={user?.email ?? null} isAdmin={isAdmin} />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </AppShell>
      </body>
    </html>
  );
}
