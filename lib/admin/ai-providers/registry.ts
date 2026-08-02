/**
 * Resolves the active AI image provider from configuration.
 *
 * Editors never choose a provider — ops sets AI_PROVIDER.
 * Automatic Google → OpenAI failover lives in
 * `lib/admin/ai-providers/failover.ts` (used by the facade).
 * AI_PROVIDER_FALLBACK remains an optional ordered list for future use.
 */

import { AI_IMAGE_PROVIDERS } from "@/lib/admin/ai-providers/providers";
import {
  isAiProviderId,
  type AIImageProvider,
  type AiProviderId,
} from "@/lib/admin/ai-providers/types";

const DEFAULT_PROVIDER: AiProviderId = "none";

function normalizeProviderId(raw: string | undefined | null): AiProviderId {
  if (!raw?.trim()) return DEFAULT_PROVIDER;
  const normalized = raw.trim().toLowerCase().replace(/-/g, "_");
  // Aliases
  if (normalized === "openai_images" || normalized === "dalle") return "openai";
  if (normalized === "imagen" || normalized === "gemini") return "google";
  if (normalized === "sd" || normalized === "stability") return "stable_diffusion";
  if (isAiProviderId(normalized)) return normalized;
  return DEFAULT_PROVIDER;
}

/** Active provider id from env (AI_PROVIDER). Defaults to none. */
export function getConfiguredAiProviderId(): AiProviderId {
  return normalizeProviderId(process.env.AI_PROVIDER);
}

/**
 * Optional comma-separated fallback list (AI_PROVIDER_FALLBACK).
 * Google → OpenAI automatic failover is hard-wired in failover.ts when
 * AI_PROVIDER=google; this list remains available for future multi-vendor use.
 */
export function getConfiguredAiProviderFallbackIds(): AiProviderId[] {
  const raw = process.env.AI_PROVIDER_FALLBACK?.trim();
  if (!raw) return [];
  const primary = getConfiguredAiProviderId();
  const ids: AiProviderId[] = [];
  for (const part of raw.split(",")) {
    const id = normalizeProviderId(part);
    if (id === "none" || id === "manual") continue;
    if (id === primary) continue;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function getAiImageProvider(id?: AiProviderId): AIImageProvider {
  const resolved = id ?? getConfiguredAiProviderId();
  return AI_IMAGE_PROVIDERS[resolved] ?? AI_IMAGE_PROVIDERS.none;
}

/** Active provider for all admin generate/regenerate/edit calls. */
export function getActiveAiImageProvider(): AIImageProvider {
  return getAiImageProvider(getConfiguredAiProviderId());
}

/**
 * Fallback providers in configured order.
 * Callers may use this later for manual or automatic failover —
 * Image Review must never call providers directly.
 */
export function getFallbackAiImageProviders(): AIImageProvider[] {
  return getConfiguredAiProviderFallbackIds().map((id) => getAiImageProvider(id));
}

/** True when a remote-capable provider id is selected (even if stubbed). */
export function isRemoteAiProviderSelected(): boolean {
  const id = getConfiguredAiProviderId();
  return id !== "none" && id !== "manual";
}

/**
 * Whether generation can produce pixels in this environment.
 * Stubs always return false until a real adapter sets connected=true.
 */
export async function isActiveAiProviderReady(): Promise<boolean> {
  const health = await getActiveAiImageProvider().healthCheck();
  return health.connected && health.healthy;
}
