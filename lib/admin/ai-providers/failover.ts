/**
 * Automatic provider failover for AI image generation.
 *
 * Primary remains Google (AI_PROVIDER=google). OpenAI Images is tried
 * exactly once when Google fails for quota / billing / unavailable / 429.
 * Editors never choose a provider.
 */

import { getOpenAiApiKey } from "@/lib/admin/ai-providers/openai-ai";
import {
  getActiveAiImageProvider,
  getAiImageProvider,
  getConfiguredAiProviderId,
} from "@/lib/admin/ai-providers/registry";
import type {
  AiImageGenerateRequest,
  AiImageProviderResult,
} from "@/lib/admin/ai-providers/types";

/**
 * Whether a Google (or primary) failure should trigger one OpenAI attempt.
 */
export function shouldFailoverToOpenAi(
  primaryId: string,
  result: AiImageProviderResult,
): boolean {
  if (primaryId !== "google") return false;
  if (result.ok && result.image) return false;
  if (!getOpenAiApiKey()) return false;

  const httpStatus = result.metadata?.httpStatus;
  if (httpStatus === 429) return true;

  const category = String(result.metadata?.category || "");
  if (
    category === "quota_limit_0" ||
    category === "billing_problem" ||
    category === "temporary_rate_limit"
  ) {
    return true;
  }

  const reason = String(result.metadata?.reason || "");
  if (
    reason === "quota_or_billing" ||
    reason === "feature_disabled" ||
    reason === "missing_api_key" ||
    reason === "network_or_runtime"
  ) {
    return true;
  }

  // Generic provider-unavailable soft-fail from Google adapter.
  if (result.unavailable || result.status === "unavailable") {
    return true;
  }

  return false;
}

/**
 * Generate via primary provider; on eligible Google failure, retry once with OpenAI.
 * Does not create Storage candidates — callers persist bytes as today.
 */
export async function generateWithAutomaticFailover(
  request: AiImageGenerateRequest,
): Promise<AiImageProviderResult> {
  const primaryId = getConfiguredAiProviderId();
  const primary = getActiveAiImageProvider();
  const primaryResult = await primary.generate(request);

  if (primaryResult.ok && primaryResult.image) {
    return {
      ...primaryResult,
      metadata: {
        ...primaryResult.metadata,
        primaryProvider: primaryId,
        usedFallback: false,
      },
    };
  }

  if (!shouldFailoverToOpenAi(primaryId, primaryResult)) {
    return {
      ...primaryResult,
      metadata: {
        ...primaryResult.metadata,
        primaryProvider: primaryId,
        usedFallback: false,
      },
    };
  }

  const openai = getAiImageProvider("openai");
  if (!openai.capabilities.remoteGenerate) {
    return primaryResult;
  }

  const fallbackResult = await openai.generate({
    ...request,
    metadata: {
      ...request.metadata,
      failoverFrom: primaryId,
      primaryFailureReason: primaryResult.metadata?.reason,
      primaryFailureCategory: primaryResult.metadata?.category,
      primaryHttpStatus: primaryResult.metadata?.httpStatus,
    },
  });

  if (fallbackResult.ok && fallbackResult.image) {
    return {
      ...fallbackResult,
      warnings: [
        ...fallbackResult.warnings,
        "Google image generation failed — used OpenAI Images fallback.",
      ],
      metadata: {
        ...fallbackResult.metadata,
        primaryProvider: primaryId,
        usedFallback: true,
        fallbackProvider: "openai",
        primaryFailureReason: primaryResult.metadata?.reason,
        primaryFailureCategory: primaryResult.metadata?.category,
        primaryHttpStatus: primaryResult.metadata?.httpStatus,
      },
    };
  }

  // Both failed — surface Google message (primary) plus OpenAI note; no fake success.
  const combinedMessage =
    primaryResult.error ||
    fallbackResult.error ||
    "AI-leverandøren er ikke tilgjengelig";

  return {
    ...primaryResult,
    error: combinedMessage,
    warnings: [
      ...(primaryResult.warnings || []),
      "OpenAI Images fallback also failed.",
      ...(fallbackResult.warnings || []).slice(0, 1),
    ],
    metadata: {
      ...primaryResult.metadata,
      primaryProvider: primaryId,
      usedFallback: true,
      fallbackProvider: "openai",
      fallbackOk: false,
      fallbackReason: fallbackResult.metadata?.reason,
      fallbackHttpStatus: fallbackResult.metadata?.httpStatus,
    },
  };
}
