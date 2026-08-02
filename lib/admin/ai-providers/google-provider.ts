/**
 * Google AI Studio / Gemini image generation adapter.
 * Uses generateContent (not deprecated Imagen 4 predict endpoints).
 * Never logs or returns API keys. Call only from server actions.
 */

import {
  classifyGoogleAiErrorText,
  classifyGoogleAiHttpFailure,
  getGoogleAiApiKey,
  getGoogleAiImageModel,
  GOOGLE_AI_IMAGE_MAX_RETRIES,
  googleAiRetryDelayMs,
  googleAspectRatioFor,
  sanitizeProviderErrorMessage,
  type GoogleAiHealthCode,
} from "@/lib/admin/ai-providers/google-ai";
import type {
  AIImageProvider,
  AiImageGenerateRequest,
  AiImageProviderResult,
  AiProviderHealth,
} from "@/lib/admin/ai-providers/types";
import { isGoogleAiImagesEnabled } from "@/lib/integrations/feature-flags";

type GeminiPart = {
  text?: string;
  /** JSON REST often returns camelCase when Accept prefers it. */
  inlineData?: { mimeType?: string; mime_type?: string; data?: string };
  /** Wire-format snake_case from Generative Language API. */
  inline_data?: { mime_type?: string; mimeType?: string; data?: string };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
  error?: { message?: string; status?: string; code?: number };
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
    metadata: { adapter: "google_gemini", ...(extras?.metadata || {}) },
    prompt: request.prompt,
    negativePrompt: request.negativePrompt ?? null,
    provider: "google",
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
    .slice(0, 8000);
}

function extractImageBuffer(json: GeminiResponse): Buffer | null {
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const data = part.inlineData?.data || part.inline_data?.data;
    if (data?.trim()) {
      return Buffer.from(data, "base64");
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Single HTTP generateContent attempt. Does not retry.
 */
async function attemptGeminiGenerate(input: {
  apiKey: string;
  model: string;
  prompt: string;
  aspectRatio: ReturnType<typeof googleAspectRatioFor>;
}): Promise<
  | { ok: true; buffer: Buffer }
  | {
      ok: false;
      httpStatus: number;
      classified: ReturnType<typeof classifyGoogleAiHttpFailure>;
      retryAfter: string | null;
      quotaIds?: string[];
      providerStatus?: string;
    }
> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": input.apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: input.prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: input.aspectRatio },
      },
    }),
  });

  const retryAfter = response.headers.get("retry-after");

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    const classified = classifyGoogleAiHttpFailure(
      response.status,
      errBody,
      retryAfter,
    );
    let quotaIds: string[] | undefined;
    let providerStatus: string | undefined;
    try {
      const parsed = JSON.parse(errBody) as {
        error?: {
          status?: string;
          details?: Array<{
            violations?: Array<{ quotaId?: string }>;
          }>;
        };
      };
      providerStatus = parsed.error?.status;
      quotaIds = (parsed.error?.details || [])
        .flatMap((d) => d.violations || [])
        .map((v) => v.quotaId)
        .filter((id): id is string => Boolean(id));
    } catch {
      // ignore
    }
    return {
      ok: false,
      httpStatus: response.status,
      classified,
      retryAfter,
      ...(quotaIds?.length ? { quotaIds } : {}),
      ...(providerStatus ? { providerStatus } : {}),
    };
  }

  const json = (await response.json()) as GeminiResponse;
  if (json.error?.message) {
    const textClassified = classifyGoogleAiErrorText(json.error.message);
    const classified = classifyGoogleAiHttpFailure(
      json.error.code && json.error.code >= 400 ? json.error.code : 400,
      json.error.message,
      null,
    );
    return {
      ok: false,
      httpStatus: json.error.code && json.error.code >= 400 ? json.error.code : 400,
      classified: {
        ...classified,
        code: textClassified.code,
        message: sanitizeProviderErrorMessage(textClassified.message),
      },
      retryAfter: null,
    };
  }

  const buffer = extractImageBuffer(json);
  if (!buffer) {
    return {
      ok: false,
      httpStatus: 200,
      classified: {
        code: "temporary_error",
        category: "unknown",
        message: "AI-leverandøren er ikke tilgjengelig",
        retryable: false,
      },
      retryAfter: null,
    };
  }

  return { ok: true, buffer };
}

async function callGeminiGenerate(
  request: AiImageGenerateRequest,
): Promise<AiImageProviderResult> {
  const startedAt = Date.now();

  if (!isGoogleAiImagesEnabled()) {
    return unavailable(
      request,
      "AI-leverandøren er ikke tilgjengelig",
      startedAt,
      { metadata: { reason: "feature_disabled" } },
    );
  }

  const apiKey = getGoogleAiApiKey();
  if (!apiKey) {
    return unavailable(
      request,
      "AI-leverandøren er ikke tilgjengelig",
      startedAt,
      { metadata: { reason: "missing_api_key" } },
    );
  }

  const model = getGoogleAiImageModel();
  const aspectRatio = googleAspectRatioFor(request.aspectRatio);
  const prompt = buildPrompt(request);

  let lastFailure: Awaited<ReturnType<typeof attemptGeminiGenerate>> & {
    ok: false;
  } | null = null;
  let attempts = 0;

  try {
    // Initial attempt + up to GOOGLE_AI_IMAGE_MAX_RETRIES retries (only if retryable).
    for (let retryIndex = 0; retryIndex <= GOOGLE_AI_IMAGE_MAX_RETRIES; retryIndex++) {
      if (retryIndex > 0 && lastFailure) {
        if (!lastFailure.classified.retryable) break;
        await sleep(
          googleAiRetryDelayMs(retryIndex - 1, lastFailure.retryAfter),
        );
      }

      attempts += 1;
      const result = await attemptGeminiGenerate({
        apiKey,
        model,
        prompt,
        aspectRatio,
      });

      if (result.ok) {
        return {
          ok: true,
          image: result.buffer,
          metadata: {
            adapter: "google_gemini",
            model,
            aspectRatio,
            attempts,
          },
          prompt: request.prompt,
          negativePrompt: request.negativePrompt ?? null,
          provider: "google",
          generationTimeMs: Math.max(0, Date.now() - startedAt),
          warnings: [],
          status: "completed",
          jobId: null,
        };
      }

      lastFailure = result;
      if (!result.classified.retryable) break;
    }

    const classified = lastFailure?.classified;
    return unavailable(
      request,
      classified?.message || "AI-leverandøren er ikke tilgjengelig",
      startedAt,
      {
        metadata: {
          reason: classified?.code || "temporary_error",
          category: classified?.category || "unknown",
          httpStatus: lastFailure?.httpStatus,
          endpoint:
            "generativelanguage.googleapis.com/v1beta/...:generateContent",
          method: "models.generateContent",
          model,
          attempts,
          ...(lastFailure?.providerStatus
            ? { providerStatus: lastFailure.providerStatus }
            : {}),
          ...(lastFailure?.quotaIds?.length
            ? { quotaIds: lastFailure.quotaIds }
            : {}),
        },
        status: "failed",
      },
    );
  } catch {
    return unavailable(
      request,
      "AI-leverandøren er ikke tilgjengelig",
      startedAt,
      {
        metadata: { reason: "network_or_runtime", attempts },
        status: "failed",
      },
    );
  }
}

async function healthCheckGoogle(): Promise<
  AiProviderHealth & { statusCode: GoogleAiHealthCode }
> {
  const checkedAt = new Date().toISOString();
  if (!isGoogleAiImagesEnabled()) {
    return {
      provider: "google",
      healthy: false,
      configured: Boolean(getGoogleAiApiKey()),
      connected: false,
      statusCode: "feature_disabled",
      message: "Google AI images er deaktivert (GOOGLE_AI_IMAGES_ENABLED).",
      checkedAt,
    };
  }

  const apiKey = getGoogleAiApiKey();
  if (!apiKey) {
    return {
      provider: "google",
      healthy: false,
      configured: false,
      connected: false,
      statusCode: "missing_api_key",
      message: "Missing API key",
      checkedAt,
    };
  }

  const model = getGoogleAiImageModel();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "x-goog-api-key": apiKey },
    });

    if (response.ok) {
      return {
        provider: "google",
        healthy: true,
        configured: true,
        connected: true,
        statusCode: "connected",
        message: "Connected",
        checkedAt,
      };
    }

    const errBody = await response.text().catch(() => "");
    const classified = classifyGoogleAiHttpFailure(
      response.status,
      errBody,
      response.headers.get("retry-after"),
    );
    return {
      provider: "google",
      healthy: false,
      configured: true,
      connected: false,
      statusCode: classified.code,
      message:
        classified.category === "quota_limit_0" ||
        classified.category === "billing_problem"
          ? "Quota or billing problem"
          : classified.code === "missing_api_key"
            ? "Missing API key"
            : classified.code === "model_unavailable"
              ? "Model unavailable"
              : "Temporary provider error",
      checkedAt,
    };
  } catch {
    return {
      provider: "google",
      healthy: false,
      configured: true,
      connected: false,
      statusCode: "temporary_error",
      message: "Temporary provider error",
      checkedAt,
    };
  }
}

export function createGoogleAiImageProvider(): AIImageProvider {
  return {
    id: "google",
    label: "Google AI Studio / Gemini",
    capabilities: {
      remoteGenerate: true,
      regenerate: true,
      edit: false,
      asyncJobs: false,
    },

    async generate(request) {
      return callGeminiGenerate(request);
    },

    async regenerate(request) {
      return callGeminiGenerate(request);
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
        provider: "google",
        generationTimeMs: 0,
        warnings: ["Async jobs are not used for Gemini generateContent."],
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
        provider: "google",
        generationTimeMs: 0,
        warnings: ["Cancel is not applicable for synchronous Gemini calls."],
        status: "cancelled",
        jobId,
        error: "Not applicable",
        unavailable: true,
      };
    },

    async healthCheck() {
      return healthCheckGoogle();
    },
  };
}
