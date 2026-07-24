export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

/**
 * Server-side admin check via ADMIN_EMAIL (never NEXT_PUBLIC_*).
 * Fail closed if ADMIN_EMAIL is missing. Do not use this alone in the browser.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  if (!adminEmail) {
    return false;
  }

  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  return normalized === adminEmail;
}
