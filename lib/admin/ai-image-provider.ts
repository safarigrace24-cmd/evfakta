/**
 * Compatibility facade over the AI provider abstraction.
 *
 * Admin actions call these helpers; they never import a vendor SDK.
 * Active provider is selected via AI_PROVIDER (see lib/admin/ai-providers).
 *
 * No external API is connected yet — adapters are stubs that return unavailable.
 * Storage always goes through existing EVFAKTA candidate/storage workflow.
 */

import "server-only";

import {
  getActiveAiImageProvider,
  getConfiguredAiProviderId,
  type AiImageProviderResult,
} from "@/lib/admin/ai-providers";
import { getGoogleAiApiKey } from "@/lib/admin/ai-providers/google-ai";
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
  return null;
}

/**
 * True when the active provider can produce pixels in this environment.
 * Google requires GOOGLE_AI_IMAGES_ENABLED + GOOGLE_AI_API_KEY.
 */
export function isAiImageProviderAvailable(): boolean {
  const provider = getActiveAiImageProvider();
  if (!provider.capabilities.remoteGenerate) return false;
  if (provider.id === "google") {
    return isGoogleAiImagesEnabled() && Boolean(getGoogleAiApiKey());
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
 * Never invents success. Never talks to a vendor outside the adapter.
 * Callers persist bytes through the existing Storage / candidate workflow.
 */
export async function generateAiImageBytes(input: {
  prompt: string;
  negativePrompt?: string | null;
  aspectRatio: AiGeneratorAspectRatio;
  style?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<AiProviderGenerateResult> {
  const provider = getActiveAiImageProvider();
  const result = await provider.generate({
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

/** Regenerate via the same active provider interface. */
export async function regenerateAiImageBytes(input: {
  prompt: string;
  negativePrompt?: string | null;
  aspectRatio: AiGeneratorAspectRatio;
  style?: string | null;
  previousJobId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<AiProviderGenerateResult> {
  const provider = getActiveAiImageProvider();
  const result = await provider.regenerate({
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    aspectRatio: input.aspectRatio,
    style: input.style,
    previousJobId: input.previousJobId,
    metadata: input.metadata,
  });
  return mapProviderResult(result);
}

/** Edit via the same active provider interface. */
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
