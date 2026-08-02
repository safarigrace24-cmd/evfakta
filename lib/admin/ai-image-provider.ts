/**
 * Compatibility facade over the AI provider abstraction.
 *
 * Admin actions call these helpers; they never import a vendor SDK.
 * Active provider is selected via AI_PROVIDER (see lib/admin/ai-providers).
 * When AI_PROVIDER=google, OpenAI Images is tried once on eligible failures.
 * Storage always goes through existing EVFAKTA candidate/storage workflow.
 */

import "server-only";

import {
  getActiveAiImageProvider,
  getConfiguredAiProviderId,
  type AiImageProviderResult,
} from "@/lib/admin/ai-providers";
import { generateWithAutomaticFailover } from "@/lib/admin/ai-providers/failover";
import { getGoogleAiApiKey } from "@/lib/admin/ai-providers/google-ai";
import { getOpenAiApiKey } from "@/lib/admin/ai-providers/openai-ai";
import type { AiGeneratorAspectRatio } from "@/lib/admin/ai-image-generator";
import { isGoogleAiImagesEnabled } from "@/lib/integrations/feature-flags";

export type AiProviderGenerateResult =
  | {
      ok: true;
      buffer: Buffer;
      provider: string;
      prompt: string;
      generationTimeMs: number;
      warnings: string[];
      metadata: Record<string, unknown>;
    }
  | { ok: false; unavailable: true; error: string; provider: string; warnings: string[] }
  | { ok: false; unavailable: false; error: string; provider: string; warnings: string[] };

/** @deprecated Prefer AI_PROVIDER + provider healthCheck. Kept for older call sites. */
export function getAiImageApiKey(): string | null {
  if (getConfiguredAiProviderId() === "google") {
    return getGoogleAiApiKey();
  }
  if (getConfiguredAiProviderId() === "openai") {
    return getOpenAiApiKey();
  }
  return null;
}

/**
 * True when generation can produce pixels in this environment.
 * Google primary: Google (flag+key) OR OpenAI fallback key.
 */
export function isAiImageProviderAvailable(): boolean {
  const provider = getActiveAiImageProvider();
  if (provider.id === "google") {
    const googleReady =
      isGoogleAiImagesEnabled() && Boolean(getGoogleAiApiKey());
    const openaiFallbackReady = Boolean(getOpenAiApiKey());
    return googleReady || openaiFallbackReady;
  }
  if (!provider.capabilities.remoteGenerate) return false;
  if (provider.id === "openai") {
    return Boolean(getOpenAiApiKey());
  }
  return true;
}

function mapProviderResult(result: AiImageProviderResult): AiProviderGenerateResult {
  if (result.ok && result.image) {
    return {
      ok: true,
      buffer: result.image,
      provider: result.provider,
      prompt: result.prompt,
      generationTimeMs: result.generationTimeMs,
      warnings: result.warnings,
      metadata: result.metadata,
    };
  }

  const unavailable = Boolean(result.unavailable) || result.status === "unavailable";
  return {
    ok: false,
    unavailable,
    error:
      result.error ||
      result.warnings[0] ||
      "AI provider did not return an image.",
    provider: result.provider,
    warnings: result.warnings,
  };
}

/**
 * Generate image bytes via the configured AIImageProvider.
 * Google primary → automatic OpenAI fallback on quota/billing/unavailable/429.
 * Never invents success. Callers persist bytes through existing Storage workflow.
 */
export async function generateAiImageBytes(input: {
  prompt: string;
  negativePrompt?: string | null;
  aspectRatio: AiGeneratorAspectRatio;
  style?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<AiProviderGenerateResult> {
  const result = await generateWithAutomaticFailover({
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    aspectRatio: input.aspectRatio,
    style: input.style,
    metadata: {
      ...input.metadata,
      configuredProvider: getConfiguredAiProviderId(),
    },
  });
  return mapProviderResult(result);
}

/** Regenerate via the same failover path (Google → OpenAI once). */
export async function regenerateAiImageBytes(input: {
  prompt: string;
  negativePrompt?: string | null;
  aspectRatio: AiGeneratorAspectRatio;
  style?: string | null;
  previousJobId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<AiProviderGenerateResult> {
  const result = await generateWithAutomaticFailover({
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    aspectRatio: input.aspectRatio,
    style: input.style,
    previousJobId: input.previousJobId,
    metadata: input.metadata,
  });
  return mapProviderResult(result);
}

/** Edit via the active primary provider (no OpenAI edit fallback yet). */
export async function editAiImageBytes(input: {
  prompt: string;
  negativePrompt?: string | null;
  aspectRatio: AiGeneratorAspectRatio;
  sourceImageBuffer?: Buffer | null;
  editInstruction?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<AiProviderGenerateResult> {
  const provider = getActiveAiImageProvider();
  const result = await provider.edit({
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    aspectRatio: input.aspectRatio,
    sourceImageBuffer: input.sourceImageBuffer,
    editInstruction: input.editInstruction,
    metadata: input.metadata,
  });
  return mapProviderResult(result);
}

export async function getAiProviderHealth() {
  return getActiveAiImageProvider().healthCheck();
}
