import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/min-side", "/login", "/registrer", "/oppdater-passord"],
    },
    sitemap: "https://www.evfakta.no/sitemap.xml",
    host: "https://www.evfakta.no",
  };
}
