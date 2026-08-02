/**
 * Pure helpers for the admin AI Image Generator modal.
 * Never auto-approves, never auto-hero, never publishes.
 */

import {
  AI_ILLUSTRATION_USAGE_OPTIONS,
  buildAiIllustrationPrompt,
  buildAiNegativePrompt,
  type AiIllustrationUsageType,
} from "@/lib/admin/ai-image-candidates";

export type { AiIllustrationUsageType };

export type AiGeneratorStyle =
  | "scandinavian_studio"
  | "neutral_outdoor"
  | "soft_editorial"
  | "marketing_banner";

export type AiGeneratorAspectRatio = "16:9" | "4:3" | "1:1" | "3:2" | "9:16";

export const AI_GENERATOR_STYLES: ReadonlyArray<{
  value: AiGeneratorStyle;
  label: string;
}> = [
  { value: "scandinavian_studio", label: "Scandinavian studio" },
  { value: "neutral_outdoor", label: "Neutral outdoor" },
  { value: "soft_editorial", label: "Soft editorial" },
  { value: "marketing_banner", label: "Marketing banner" },
];

export const AI_GENERATOR_ASPECT_RATIOS: ReadonlyArray<{
  value: AiGeneratorAspectRatio;
  label: string;
}> = [
  { value: "16:9", label: "16:9" },
  { value: "4:3", label: "4:3" },
  { value: "3:2", label: "3:2" },
  { value: "1:1", label: "1:1" },
  { value: "9:16", label: "9:16 (social)" },
];

/** Image types shown in the Lag AI-bilde modal (ordered). */
export const AI_GENERATOR_IMAGE_TYPES: ReadonlyArray<{
  value: AiIllustrationUsageType;
  label: string;
}> = [
  { value: "hero_illustration", label: "Hero" },
  { value: "front_illustration", label: "Front" },
  { value: "front_three_quarter", label: "Front Three Quarter" },
  { value: "side_illustration", label: "Side" },
  { value: "rear_illustration", label: "Rear" },
  { value: "interior_illustration", label: "Interior" },
  { value: "charging_illustration", label: "Charging" },
  { value: "cargo_illustration", label: "Cargo" },
  { value: "article_cover", label: "Article Cover" },
  { value: "homepage_banner", label: "Homepage Banner" },
  { value: "social_media", label: "Social Media" },
];

export type AiGeneratorPrecheckKey =
  | "correct_vehicle"
  | "correct_front"
  | "correct_headlights"
  | "correct_proportions"
  | "correct_wheels"
  | "correct_body"
  | "no_artifacts"
  | "safe_public";

export const AI_GENERATOR_PRECHECK_ITEMS: ReadonlyArray<{
  key: AiGeneratorPrecheckKey;
  label: string;
}> = [
  { key: "correct_vehicle", label: "Correct vehicle" },
  { key: "correct_front", label: "Correct front" },
  { key: "correct_headlights", label: "Correct headlights" },
  { key: "correct_proportions", label: "Correct proportions" },
  { key: "correct_wheels", label: "Correct wheels" },
  { key: "correct_body", label: "Correct body shape" },
  { key: "no_artifacts", label: "No AI artifacts" },
  { key: "safe_public", label: "Safe for public use" },
];

export function isAiGeneratorPrecheckComplete(
  keys: readonly string[] | null | undefined,
): boolean {
  if (!keys?.length) return false;
  const set = new Set(keys);
  return AI_GENERATOR_PRECHECK_ITEMS.every((item) => set.has(item.key));
}

export function styleLabel(style: AiGeneratorStyle): string {
  return AI_GENERATOR_STYLES.find((s) => s.value === style)?.label ?? style;
}

export function buildAdminGeneratorPrompt(input: {
  brand: string;
  model: string;
  variant?: string | null;
  year?: number | string | null;
  usageType: AiIllustrationUsageType;
  style: AiGeneratorStyle;
  aspectRatio: AiGeneratorAspectRatio;
  changeRequest?: string | null;
}): string {
  return buildAiIllustrationPrompt({
    brand: input.brand,
    model: input.model,
    variant: input.variant,
    year: input.year,
    usageType: input.usageType,
    style: styleLabel(input.style),
    aspectRatio: input.aspectRatio,
    changeRequest: input.changeRequest,
    includeEvfaktaMark:
      input.usageType === "homepage_banner" ||
      input.usageType === "social_media" ||
      input.usageType === "article_cover",
  });
}

export function defaultNegativePrompt(): string {
  return buildAiNegativePrompt();
}

export function usageRequiresExplicitDetail(usage: AiIllustrationUsageType): boolean {
  return (
    AI_ILLUSTRATION_USAGE_OPTIONS.find((o) => o.value === usage)?.factualDetail ===
    true
  );
}

/** OpenAI DALL·E size mapping from aspect ratio. */
export function openAiSizeForAspect(
  aspect: AiGeneratorAspectRatio,
): "1024x1024" | "1792x1024" | "1024x1792" {
  if (aspect === "9:16") return "1024x1792";
  if (aspect === "1:1") return "1024x1024";
  return "1792x1024";
}

/**
 * Placeholder cost estimate until a connected provider reports real pricing.
 * Never invents a billed amount — editors see an explicit placeholder.
 */
export function estimateAiGenerationCostPlaceholder(input: {
  providerId: string;
  aspectRatio?: string | null;
}): {
  label: string;
  amountDisplay: string;
  currencyNote: string;
  note: string;
} {
  const provider = input.providerId?.trim() || "none";
  const aspect = input.aspectRatio?.trim() || "n/a";
  return {
    label: "Cost estimate",
    amountDisplay: "—",
    currencyNote: "not metered yet",
    note: `Placeholder for provider “${provider}” @ ${aspect}. Real estimates appear when a remote adapter is connected.`,
  };
}

/** Client-side session history entry shape (not persisted to DB). */
export type AiGeneratorHistoryEntry = {
  id: string;
  createdAt: string;
  usageType: string;
  usageLabel: string;
  prompt: string;
  negativePrompt: string;
  previewUrl: string | null;
  awaitingGeneration: boolean;
  source: "provider" | "upload" | "awaiting";
  providerLabel: string;
  costEstimate: string;
};

export function createAiGeneratorHistoryId(): string {
  return `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * True when AI_PROVIDER selects a remote provider id.
 * Does not mean the adapter is connected — see provider.capabilities.remoteGenerate
 * / isAiImageProviderAvailable() on the server facade.
 */
export function isAiImageProviderConfigured(): boolean {
  // Keep client-safe (no server-only imports). Mirrors registry aliases.
  const raw = (process.env.AI_PROVIDER || "none").trim().toLowerCase().replace(/-/g, "_");
  if (!raw || raw === "none" || raw === "manual") return false;
  const aliases: Record<string, string> = {
    openai: "openai",
    openai_images: "openai",
    dalle: "openai",
    google: "google",
    imagen: "google",
    gemini: "google",
    ideogram: "ideogram",
    flux: "flux",
    stable_diffusion: "stable_diffusion",
    sd: "stable_diffusion",
    stability: "stable_diffusion",
  };
  return Boolean(aliases[raw]);
}
