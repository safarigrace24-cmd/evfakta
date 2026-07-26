import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "eu.chat-img.sintra.ai",
      },
      {
        protocol: "https",
        hostname: "cdn.sintra.ai",
      },
    ],
  },
};

export default nextConfig;
