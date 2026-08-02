/**
 * Server-oriented integration feature flags.
 * Defaults false — never enable until keys + QA pass.
 * Import only from server actions / route handlers / server components.
 */

function envEnabled(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

/** Admin Google AI image generation (Gemini). */
export function isGoogleAiImagesEnabled(): boolean {
  return envEnabled("GOOGLE_AI_IMAGES_ENABLED");
}

/** Admin Google AI text generation (Gemini) for editorial drafts. */
export function isGoogleAiTextEnabled(): boolean {
  return envEnabled("GOOGLE_AI_TEXT_ENABLED");
}

/** Public charging map (/ladekart) + /api/charging-stations. */
export function isChargingMapEnabled(): boolean {
  return envEnabled("CHARGING_MAP_ENABLED");
}
