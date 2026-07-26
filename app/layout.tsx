import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { getAuthUser } from "@/lib/auth/get-user";
import { isAdminEmail } from "@/lib/auth/is-admin";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.evfakta.no"),
  title: {
    default: "Sammenlign elbiler i Norge | EVFAKTA",
    template: "%s | EVFAKTA.no",
  },
  description:
    "Sammenlign rekkevidde, lading, forbruk og plass for elbiler på det norske markedet.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "EVFAKTA.no",
    title: "Sammenlign elbiler i Norge | EVFAKTA",
    description:
      "Sammenlign rekkevidde, lading, forbruk og plass for elbiler på det norske markedet.",
    url: "/",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthUser();
  const isAdmin = isAdminEmail(user?.email);
  const pathname = (await headers()).get("x-evfakta-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <html lang="nb" className={inter.variable}>
      <body className={isAdminRoute ? "theme-admin" : "theme-public"}>
        <a href="#main-content" className="skipLink">
          Hopp til innhold
        </a>
        <SiteHeader userEmail={user?.email ?? null} isAdmin={isAdmin} />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
