import { notFound } from "next/navigation";

/**
 * Catch-all for unknown single-segment paths.
 * Known unfinished routes (/kalkulator, /rimeligste, etc.) have their own pages
 * and take precedence. Arbitrary URLs must 404 — not soft “coming soon” stubs.
 */
export default function UnknownSlugPage() {
  notFound();
}
