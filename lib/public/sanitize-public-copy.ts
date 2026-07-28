import { EDITORIAL_DRAFT_MARKER } from "@/lib/admin/editorial-assist-core";

const DRAFT_PATTERNS = [
  EDITORIAL_DRAFT_MARKER,
  "Draft - Requires editor review.",
  "Draft – Requires editor review.",
];

/**
 * Strip editorial draft markers from copy before public render.
 * Does not invent content — only removes known draft prefixes/lines.
 */
export function sanitizePublicCopy(value: string | null | undefined): string {
  if (!value) return "";

  let next = value;
  for (const marker of DRAFT_PATTERNS) {
    next = next.split(marker).join("");
  }

  return next
    .replace(/^\s*[-–—]\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizePublicList(
  items: string[] | null | undefined,
): string[] {
  if (!items?.length) return [];
  return items
    .map((item) => sanitizePublicCopy(item))
    .filter((item) => item.length > 0);
}

export function hasRenderablePublicCopy(
  value: string | null | undefined,
): boolean {
  return sanitizePublicCopy(value).length > 0;
}
