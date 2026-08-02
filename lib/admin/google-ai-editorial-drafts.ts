/**
 * Build Gemini prompts for editorial draft suggestions.
 * Pure helpers — no network, no secrets.
 */

import { EDITORIAL_DRAFT_MARKER } from "@/lib/admin/editorial-assist-core";
import type { AdminCar } from "@/lib/admin/types";

export type EditorialAiDraftKind =
  | "description"
  | "faq"
  | "summary"
  | "metadata"
  | "seo_title"
  | "meta_description"
  | "social_caption"
  | "rewrite_clearer"
  | "rewrite_shorter"
  | "rewrite_neutral"
  | "claim_check";

export const EDITORIAL_AI_DRAFT_KINDS: EditorialAiDraftKind[] = [
  "description",
  "faq",
  "summary",
  "metadata",
  "seo_title",
  "meta_description",
  "social_caption",
  "rewrite_clearer",
  "rewrite_shorter",
  "rewrite_neutral",
  "claim_check",
];

export function isEditorialAiDraftKind(
  value: string,
): value is EditorialAiDraftKind {
  return (EDITORIAL_AI_DRAFT_KINDS as string[]).includes(value);
}

export function isRewriteKind(kind: EditorialAiDraftKind): boolean {
  return (
    kind === "rewrite_clearer" ||
    kind === "rewrite_shorter" ||
    kind === "rewrite_neutral"
  );
}

export function buildEditorialAiSystemInstruction(): string {
  return [
    "You are an editorial assistant for EVFAKTA, a Norwegian EV fact catalog.",
    "Write in clear Norwegian Bokmål.",
    "Use only facts provided about the vehicle. Do not invent prices, scores, tests, quotations, or unverified specs.",
    "Never claim official manufacturer endorsement or that EVFAKTA tested the car unless test data is provided.",
    "Missing values must remain absent — do not invent placeholders as facts.",
    "Do not generate fake sources.",
    "Output must be ready for human editor review — never final publish copy.",
    "Always start the first line exactly with the draft marker provided in the user prompt.",
  ].join(" ");
}

export function carFactsForPrompt(car: AdminCar): string {
  const rows: Array<[string, string | number | null | undefined]> = [
    ["Brand", car.brand],
    ["Model", car.model],
    ["Variant", car.variant],
    ["Year", car.year],
    ["WLTP range km", car.range_km],
    ["Battery kWh", car.battery_usable_kwh ?? car.battery_total_kwh ?? car.battery_kwh],
    ["DC kW", car.dc_charging_kw],
    ["AC kW", car.ac_charging_kw],
    ["Drivetrain", car.drivetrain],
    ["Seats", car.seats],
    ["Cargo L", car.cargo_l],
    ["Towing kg", car.towing_kg],
    ["Body", car.body_style],
    ["Warranty", car.warranty],
  ];
  return rows
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

export function buildEditorialAiPrompt(
  kind: EditorialAiDraftKind,
  car: AdminCar,
  options?: { sourceText?: string | null },
): string {
  const facts = carFactsForPrompt(car) || "Limited catalog facts available.";
  const common =
    `Verified vehicle facts (do not invent beyond these):\n${facts}\n\n` +
    `Existing editorial description (may be empty):\n${car.description?.trim() || "(none)"}\n\n`;
  const marker = `Start the first line exactly with: ${EDITORIAL_DRAFT_MARKER}`;
  const source = options?.sourceText?.trim() || "";

  switch (kind) {
    case "description":
      return (
        common +
        "Write a short Norwegian vehicle introduction (2–4 paragraphs). " +
        "Do not invent missing specifications. " +
        marker
      );
    case "faq":
      return (
        common +
        "Write a Norwegian FAQ with 4–6 Q&A pairs for Norwegian EV buyers. " +
        "Use markdown with ### for each question. Do not invent specs. " +
        marker
      );
    case "summary":
      return (
        common +
        "Write a 2–3 sentence Norwegian editorial summary (not a marketing slogan). " +
        marker
      );
    case "metadata":
      return (
        common +
        "Suggest SEO metadata as plain text with these labels on separate lines:\n" +
        "Title:\nMeta description:\nKeywords:\n" +
        "Norwegian language. Keep meta description under 160 characters. " +
        marker
      );
    case "seo_title":
      return (
        common +
        "Suggest one Norwegian SEO title under 60 characters. Output only the title after the marker. " +
        marker
      );
    case "meta_description":
      return (
        common +
        "Suggest one Norwegian meta description under 160 characters. Output only the description after the marker. " +
        marker
      );
    case "social_caption":
      return (
        common +
        "Write a short Norwegian social-media caption (max 280 characters) about this EV for EVFAKTA. " +
        "No fake claims or invented specs. " +
        marker
      );
    case "rewrite_clearer":
      return (
        common +
        "Rewrite the following Norwegian text so it is clearer and easier to understand. " +
        "Preserve meaning. Do not add new specifications. " +
        marker +
        `\n\nSource text:\n${source || "(empty — say that source text is missing)"}`
      );
    case "rewrite_shorter":
      return (
        common +
        "Rewrite the following Norwegian text shorter while keeping the same meaning. " +
        "Do not add new specifications. " +
        marker +
        `\n\nSource text:\n${source || "(empty — say that source text is missing)"}`
      );
    case "rewrite_neutral":
      return (
        common +
        "Rewrite the following text in a neutral Norwegian editorial tone suitable for EVFAKTA. " +
        "Remove hype. Do not add new specifications. " +
        marker +
        `\n\nSource text:\n${source || "(empty — say that source text is missing)"}`
      );
    case "claim_check":
      return (
        common +
        "Review the following Norwegian text for unsupported claims relative to the verified facts. " +
        "List possible issues as bullet points in Norwegian. " +
        "If nothing looks unsupported, say so briefly. Do not rewrite the whole article. " +
        marker +
        `\n\nText to review:\n${source || car.description?.trim() || "(empty)"}`
      );
    default:
      return common + "Write a short Norwegian editorial note. " + marker;
  }
}

export function ensureDraftMarker(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith(EDITORIAL_DRAFT_MARKER)) return trimmed;
  return `${EDITORIAL_DRAFT_MARKER}\n\n${trimmed}`;
}

/** Heuristic local warning — complements Gemini claim_check. */
export function detectUnsupportedClaimHints(
  text: string,
  car: AdminCar,
): string[] {
  const warnings: string[] = [];
  const lower = text.toLowerCase();
  const patterns: Array<{ re: RegExp; message: string }> = [
    {
      re: /\b(vi har testet|vår test|testvinner|lab.?test)\b/i,
      message: "Mulig testpåstand uten EVFAKTA-testdata — kontroller.",
    },
    {
      re: /\b(garanti for at|garantert rekkevidde|alltid)\b/i,
      message: "Mulig absolutt påstand — vurder mer forsiktig formulering.",
    },
    {
      re: /\b(billigst|best i test|markedsledende)\b/i,
      message: "Mulig rangering/overdrivelse uten kilde — kontroller.",
    },
  ];
  for (const pattern of patterns) {
    if (pattern.re.test(lower)) warnings.push(pattern.message);
  }
  if (/\b\d+\s*km\b/i.test(text) && car.range_km == null) {
    warnings.push(
      "Teksten nevner km-tall mens WLTP-rekkevidde mangler i katalogdata — kontroller at tallet er verifisert.",
    );
  }
  if (/\b\d+([.,]\d+)?\s*kwh\b/i.test(text) &&
    car.battery_kwh == null &&
    car.battery_usable_kwh == null &&
    car.battery_total_kwh == null) {
    warnings.push(
      "Teksten nevner kWh mens batteridata mangler i katalogdata — kontroller.",
    );
  }
  return warnings;
}
