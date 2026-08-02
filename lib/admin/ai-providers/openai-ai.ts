/**
 * OpenAI Images helpers — never log or return API keys.
 */

import { openAiSizeForAspect } from "@/lib/admin/ai-image-generator";
import type { AiGeneratorAspectRatio } from "@/lib/admin/ai-image-generator";
import { sanitizeProviderErrorMessage } from "@/lib/admin/ai-providers/google-ai";

export const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-1";

export function getOpenAiApiKey(): string | null {
  return (
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.AI_OPENAI_API_KEY?.trim() ||
    null
  );
}

export function getOpenAiImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_OPENAI_IMAGE_MODEL;
}

/** Size string accepted by the active OpenAI image model. */
export function openAiImageSizeForAspect(
  aspect: AiGeneratorAspectRatio,
  model: string,
): string {
  const normalized = model.trim().toLowerCase();
  if (normalized.startsWith("dall-e")) {
    return openAiSizeForAspect(aspect);
  }
  // gpt-image-1 (and similar): 1024x1024 | 1536x1024 | 1024x1536
  if (aspect === "1:1") return "1024x1024";
  if (aspect === "9:16") return "1024x1536";
  return "1536x1024";
}

export function classifyOpenAiHttpError(status: number): {
  code:
    | "missing_api_key"
    | "model_unavailable"
    | "quota_or_billing"
    | "temporary_error";
  message: string;
  retryable: boolean;
} {
  if (status === 401 || status === 403) {
    return {
      code: "missing_api_key",
      message: "OpenAI API-nøkkel mangler eller er ugyldig.",
      retryable: false,
    };
  }
  if (status === 404) {
    return {
      code: "model_unavailable",
      message: "OpenAI-bildemodellen er ikke tilgjengelig for denne nøkkelen.",
      retryable: false,
    };
  }
  if (status === 429) {
    return {
      code: "quota_or_billing",
      message:
        "OpenAI-kvote eller hastighetsbegrensning nådd. Prøv igjen senere, eller last opp manuelt.",
      retryable: false,
    };
  }
  if (status >= 500) {
    return {
      code: "temporary_error",
      message: "Midlertidig feil hos OpenAI. Prøv igjen, eller last opp manuelt.",
      retryable: false,
    };
  }
  return {
    code: "temporary_error",
    message: "AI-leverandøren er ikke tilgjengelig",
    retryable: false,
  };
}

export { sanitizeProviderErrorMessage };
