/** Shared parsers for admin forms + CSV/JSON import (nullable EV fields). */

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Newline- or pipe-separated list → text[]; empty → null. */
export function parseTextList(value: string | null | undefined): string[] | null {
  if (value == null) return null;
  const parts = String(value)
    .split(/[\n|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

export function textListToInput(value: string[] | null | undefined): string {
  if (!value?.length) return "";
  return value.join("\n");
}

/**
 * Tri-state boolean from form/CSV:
 * empty → null (unknown), true/yes/1 → true, false/no/0 → false.
 */
export function parseOptionalBoolean(
  value: string,
  label: string,
): { ok: true; value: boolean | null } | { ok: false; error: string } {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return { ok: true, value: null };
  if (["true", "yes", "y", "1", "ja"].includes(trimmed)) {
    return { ok: true, value: true };
  }
  if (["false", "no", "n", "0", "nei"].includes(trimmed)) {
    return { ok: true, value: false };
  }
  return {
    ok: false,
    error: `${label} må være ja/nei (eller tom for ukjent).`,
  };
}

export function boolToInput(value: boolean | null | undefined): string {
  if (value == null) return "";
  return value ? "true" : "false";
}

export function formatBoolNb(value: boolean | null | undefined): string | null {
  if (value == null) return null;
  return value ? "Ja" : "Nei";
}

export function formatTextList(value: string[] | null | undefined): string | null {
  if (!value?.length) return null;
  return value.join(", ");
}
