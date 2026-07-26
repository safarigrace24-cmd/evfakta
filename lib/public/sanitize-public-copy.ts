import { EDITORIAL_DRAFT_MARKER } from "@/lib/admin/editorial-assist-core";

/**
 * Strip editorial draft markers from strings shown on the public site.
 * Does not mutate CMS storage — display-only trust sanitization.
 */
export function sanitizePublicText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split("\n")
    .map((line) => line.replaceAll(EDITORIAL_DRAFT_MARKER, "").trim())
    .filter((line, index, lines) => {
      if (line.length > 0) return true;
      // drop leading/trailing empties created by marker removal
      return index > 0 && index < lines.length - 1;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizePublicTextList(
  values: string[] | null | undefined,
): string[] {
  if (!values?.length) return [];
  return values
    .map((item) => sanitizePublicText(item))
    .filter((item) => item.length > 0);
}
