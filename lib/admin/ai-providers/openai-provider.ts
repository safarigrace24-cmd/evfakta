/**
 * OpenAI Images adapter (Images API).
 * Used as automatic fallback when Google Gemini image generation fails.
 * Never logs or returns API keys. Call only from server actions.
 */

import {
  classifyOpenAiHttpError,
  getOpenAiApiKey,
  getOpenAiImageModel,
  openAiImageSizeForAspect,
  sanitizeProviderErrorMessage,
} from "@/lib/admin/ai-providers/openai-ai";
import type {
  AIImageProvider,
  AiImageGenerateRequest,
  AiImageProviderResult,
  AiProviderHealth,
} from "@/lib/admin/ai-providers/types";

type OpenAiImagesResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string; type?: string; code?: string };
};

function unavailable(
  request: AiImageGenerateRequest,
  message: string,
  startedAt: number,
  extras?: Partial<AiImageProviderResult>,
): AiImageProviderResult {
  return {
    ok: false,
    image: null,
    metadata: { adapter: "openai_images", ...(extras?.metadata || {}) },
    prompt: request.prompt,
    negativePrompt: request.negativePrompt ?? null,
    provider: "openai",
    generationTimeMs: Math.max(0, Date.now() - startedAt),
    warnings: [message],
    status: "unavailable",
    jobId: null,
    error: message,
    unavailable: true,
    ...extras,
  };
}

function buildPrompt(request: AiImageGenerateRequest): string {
  const negative = request.negativePrompt?.trim();
  return [
    request.prompt.trim(),
    negative ? `Avoid / do not include: ${negative}` : null,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 32000);
}

async function callOpenAiImages(
  request: AiImageGenerateRequest,
): Promise<AiImageProviderResult> {
  const startedAt = Date.now();
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return unavailable(
      request,
      "AI-leverandøren er ikke tilgjengelig",
      startedAt,
      { metadata: { reason: "missing_api_key" } },
    );
  }

  const model = getOpenAiImageModel();
  const size = openAiImageSizeForAspect(request.aspectRatio, model);
  const prompt = buildPrompt(request);
  const isDallE = model.toLowerCase().startsWith("dall-e");

  const body: Record<string, unknown> = {
    model,
    prompt,
    size,
    n: 1,
  };
  // dall-e-3 requires explicit b64; gpt-image-* returns b64_json by default.
  if (isDallE) {
    body.response_format = "b64_json";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      const classified = classifyOpenAiHttpError(response.status);
      void errBody; // never forward raw body to clients
      return unavailable(request, classified.message, startedAt, {
        metadata: {
          reason: classified.code,
          httpStatus: response.status,
          endpoint: "api.openai.com/v1/images/generations",
          model,
        },
        status: "failed",
      });
    }

    const json = (await response.json()) as OpenAiImagesResponse;
    if (json.error?.message) {
      return unavailable(
        request,
        sanitizeProviderErrorMessage(
          "AI-leverandøren er ikke tilgjengelig",
        ),
        startedAt,
        {
          metadata: { reason: "provider_error", model },
          status: "failed",
        },
      );
    }

    const b64 = json.data?.[0]?.b64_json?.trim();
    if (!b64) {
      // Some responses may only include a temporary URL — we refuse hotlinking.
      if (json.data?.[0]?.url) {
        return unavailable(
          request,
          "OpenAI returnerte URL uten bildebytes. Bruk b64-svar eller last opp manuelt.",
          startedAt,
          { metadata: { reason: "url_only_response", model }, status: "failed" },
        );
      }
      return unavailable(
        request,
        "AI-leverandøren er ikke tilgjengelig",
        startedAt,
        { metadata: { reason: "no_image_in_response", model }, status: "failed" },
      );
    }

    return {
      ok: true,
      image: Buffer.from(b64, "base64"),
      metadata: {
        adapter: "openai_images",
        model,
        size,
      },
      prompt: request.prompt,
      negativePrompt: request.negativePrompt ?? null,
      provider: "openai",
      generationTimeMs: Math.max(0, Date.now() - startedAt),
      warnings: [],
      status: "completed",
      jobId: null,
    };
  } catch {
    return unavailable(
      request,
      "AI-leverandøren er ikke tilgjengelig",
      startedAt,
      { metadata: { reason: "network_or_runtime" }, status: "failed" },
    );
  }
}

async function healthCheckOpenAi(): Promise<AiProviderHealth> {
  const checkedAt = new Date().toISOString();
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return {
      provider: "openai",
      healthy: false,
      configured: false,
      connected: false,
      statusCode: "missing_api_key",
      message: "Missing API key",
      checkedAt,
    };
  }

  // Lightweight auth probe — do not generate an image in healthCheck.
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) {
      return {
        provider: "openai",
        healthy: true,
        configured: true,
        connected: true,
        statusCode: "connected",
        message: "Connected",
        checkedAt,
      };
    }
    const classified = classifyOpenAiHttpError(response.status);
    void (await response.text().catch(() => ""));
    return {
      provider: "openai",
      healthy: false,
      configured: true,
      connected: false,
      statusCode: classified.code,
      message:
        classified.code === "missing_api_key"
          ? "Missing API key"
          : classified.code === "quota_or_billing"
            ? "Quota or billing problem"
            : "Temporary provider error",
      checkedAt,
    };
  } catch {
    return {
      provider: "openai",
      healthy: false,
      configured: true,
      connected: false,
      statusCode: "temporary_error",
      message: "Temporary provider error",
      checkedAt,
    };
  }
}

export function createOpenAiImageProvider(): AIImageProvider {
  return {
    id: "openai",
    label: "OpenAI Images",
    capabilities: {
      remoteGenerate: true,
      regenerate: true,
      edit: false,
      asyncJobs: false,
    },

    async generate(request) {
      return callOpenAiImages(request);
    },

    async regenerate(request) {
      return callOpenAiImages(request);
    },

    async edit(request) {
      const startedAt = Date.now();
      return unavailable(
        request,
        "AI-leverandøren er ikke tilgjengelig",
        startedAt,
        { metadata: { reason: "edit_not_implemented" } },
      );
    },

    async getStatus(jobId) {
      return {
        ok: false,
        image: null,
        metadata: { jobId },
        prompt: "",
        provider: "openai",
        generationTimeMs: 0,
        warnings: ["Async jobs are not used for OpenAI Images."],
        status: "unavailable",
        jobId,
        error: "Not applicable",
        unavailable: true,
      };
    },

    async cancel(jobId) {
      return {
        ok: false,
        image: null,
        metadata: { jobId },
        prompt: "",
        provider: "openai",
        generationTimeMs: 0,
        warnings: ["Cancel is not applicable for synchronous OpenAI Images."],
        status: "cancelled",
        jobId,
        error: "Not applicable",
        unavailable: true,
      };
    },

    async healthCheck() {
      return healthCheckOpenAi();
    },
  };
}
