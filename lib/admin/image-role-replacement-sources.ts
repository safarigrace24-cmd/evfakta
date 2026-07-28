/**
 * Pure helpers for discovering official replacement image URLs.
 * Safe for tests — no DB / Storage access.
 */

import {
  isLikelyOfficialManufacturerUrl,
  isRejectedImageSourceUrl,
} from "@/lib/admin/image-production";

function roleHints(role: string): RegExp[] {
  const key = role.toLowerCase();
  if (key === "hero" || key === "front" || key === "front three-quarter") {
    return [/front/i, /three[-_ ]?quarter/i, /hero/i, /exterior/i, /studio/i];
  }
  if (key === "side") return [/side/i, /profile/i, /exterior/i];
  if (key === "rear" || key === "rear three-quarter") {
    return [/rear/i, /back/i, /exterior/i];
  }
  if (key === "interior" || key === "dashboard") {
    return [/interior/i, /cabin/i, /dashboard/i, /cockpit/i];
  }
  return [];
}

export function scoreUrlForImageRole(url: string, role: string): number {
  const hints = roleHints(role);
  if (hints.length === 0) return 0;
  return hints.reduce((score, hint) => (hint.test(url) ? score + 1 : score), 0);
}

/** Extract likely official image asset URLs from an HTML page. */
export function extractOfficialImageUrlsFromHtml(
  html: string,
  pageUrl: string,
): string[] {
  const found = new Set<string>();
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi,
    /<(?:img|source)[^>]+(?:src|srcset)=["']([^"']+)["']/gi,
    /url\((['"]?)(https?:\/\/[^)"']+\.(?:jpe?g|png|webp|avif)(?:\?[^)"']*)?)\1\)/gi,
    /https?:\/\/[^\s"'<>]+\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>]*)?/gi,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const raw = (match[2] || match[1] || "").trim();
      if (!raw) continue;
      for (const part of raw.split(",")) {
        const token = part.trim().split(/\s+/)[0];
        if (!token) continue;
        try {
          const absolute = new URL(token, pageUrl).toString();
          if (isRejectedImageSourceUrl(absolute)) continue;
          if (!isLikelyOfficialManufacturerUrl(absolute)) continue;
          if (!/^https?:/i.test(absolute)) continue;
          found.add(absolute);
        } catch {
          // skip invalid
        }
      }
    }
  }

  return [...found];
}
