import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.evfakta.no"),
  title: {
    default: "EVFAKTA.no – Uavhengig elbil-fakta for Norge",
    template: "%s | EVFAKTA.no",
  },
  description: "Sammenlign elbiler, rekkevidde, priser, batteri og ladehastighet i Norge.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb" className={dmSans.variable}>
      <body>
        <a href="#main-content" className="skipLink">
          Hopp til innhold
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
