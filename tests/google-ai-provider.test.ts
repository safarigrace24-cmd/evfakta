import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  classifyGoogleAiHttpError,
  classifyGoogleAiHttpFailure,
  DEFAULT_GOOGLE_AI_IMAGE_MODEL,
  getGoogleAiApiKey,
  getGoogleAiImageModel,
  GOOGLE_AI_IMAGE_QUOTA_ADMIN_MESSAGE,
  googleAiRetryDelayMs,
  googleAspectRatioFor,
  sanitizeProviderErrorMessage,
} from "../lib/admin/ai-providers/google-ai";
import { createGoogleAiImageProvider } from "../lib/admin/ai-providers/google-provider";
import { AI_IMAGE_PROVIDERS } from "../lib/admin/ai-providers/providers";

const ORIGINAL = {
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  GOOGLE_AI_IMAGES_ENABLED: process.env.GOOGLE_AI_IMAGES_ENABLED,
  GOOGLE_AI_IMAGE_MODEL: process.env.GOOGLE_AI_IMAGE_MODEL,
  AI_PROVIDER: process.env.AI_PROVIDER,
};

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Google AI integration helpers", () => {
  it("treats missing GOOGLE_AI_API_KEY as unset", () => {
    delete process.env.GOOGLE_AI_API_KEY;
    assert.equal(getGoogleAiApiKey(), null);
  });

  it("defaults to a supported Gemini image model", () => {
    delete process.env.GOOGLE_AI_IMAGE_MODEL;
    assert.equal(getGoogleAiImageModel(), DEFAULT_GOOGLE_AI_IMAGE_MODEL);
    assert.equal(getGoogleAiImageModel(), "gemini-2.5-flash-image");
  });

  it("maps aspect ratios for Gemini imageConfig", () => {
    assert.equal(googleAspectRatioFor("16:9"), "16:9");
    assert.equal(googleAspectRatioFor("1:1"), "1:1");
    assert.equal(googleAspectRatioFor("9:16"), "9:16");
  });

  it("classifies HTTP errors without leaking bodies", () => {
    assert.equal(classifyGoogleAiHttpError(401).code, "missing_api_key");
    assert.equal(classifyGoogleAiHttpError(404).code, "model_unavailable");
    assert.equal(classifyGoogleAiHttpError(429).code, "quota_or_billing");
    assert.equal(classifyGoogleAiHttpError(503).code, "temporary_error");
  });

  it("classifies FreeTier limit 0 as non-retryable quota", () => {
    const body = JSON.stringify({
      error: {
        status: "RESOURCE_EXHAUSTED",
        message: "Quota exceeded for FreeTier limit: 0",
        details: [
          {
            violations: [
              { quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" },
            ],
          },
        ],
      },
    });
    const classified = classifyGoogleAiHttpFailure(429, body, null);
    assert.equal(classified.category, "quota_limit_0");
    assert.equal(classified.retryable, false);
    assert.equal(classified.message, GOOGLE_AI_IMAGE_QUOTA_ADMIN_MESSAGE);
  });

  it("classifies temporary rate limits as retryable", () => {
    const classified = classifyGoogleAiHttpFailure(
      429,
      JSON.stringify({
        error: { message: "Rate limit exceeded. Please slow down." },
      }),
      "2",
    );
    assert.equal(classified.category, "temporary_rate_limit");
    assert.equal(classified.retryable, true);
  });

  it("honours Retry-After for backoff delay", () => {
    assert.equal(googleAiRetryDelayMs(0, "3"), 3000);
    assert.equal(googleAiRetryDelayMs(0, null), 1000);
    assert.equal(googleAiRetryDelayMs(1, null), 2000);
  });

  it("redacts key-like strings from messages", () => {
    const cleaned = sanitizeProviderErrorMessage(
      "fail AIzaSyDummyKeyValue1234567890Bearer tok",
    );
    assert.doesNotMatch(cleaned, /AIzaSy/);
  });

  it("registers google with remoteGenerate capability", () => {
    assert.equal(AI_IMAGE_PROVIDERS.google.capabilities.remoteGenerate, true);
  });

  it("returns unavailable when feature flag is off (no external call)", async () => {
    process.env.GOOGLE_AI_IMAGES_ENABLED = "false";
    process.env.GOOGLE_AI_API_KEY = "test-key-not-used";
    const provider = createGoogleAiImageProvider();
    const result = await provider.generate({
      prompt: "EV illustration",
      aspectRatio: "16:9",
    });
    assert.equal(result.ok, false);
    assert.equal(result.unavailable, true);
    assert.equal(result.image, null);
    assert.match(result.error || "", /ikke tilgjengelig/i);
  });

  it("returns unavailable when API key is missing", async () => {
    process.env.GOOGLE_AI_IMAGES_ENABLED = "true";
    delete process.env.GOOGLE_AI_API_KEY;
    const provider = createGoogleAiImageProvider();
    const result = await provider.generate({
      prompt: "EV illustration",
      aspectRatio: "16:9",
    });
    assert.equal(result.ok, false);
    assert.equal(result.unavailable, true);
  });

  it("normalizes a successful mocked Gemini response", async () => {
    process.env.GOOGLE_AI_IMAGES_ENABLED = "true";
    process.env.GOOGLE_AI_API_KEY = "test-key";
    const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ inlineData: { mimeType: "image/png", data: pngBase64 } }],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    try {
      const provider = createGoogleAiImageProvider();
      const result = await provider.generate({
        prompt: "Scandinavian studio EV",
        negativePrompt: "watermark",
        aspectRatio: "16:9",
      });
      assert.equal(result.ok, true);
      assert.ok(result.image);
      assert.equal(result.provider, "google");
      assert.equal(result.status, "completed");
      assert.doesNotMatch(JSON.stringify(result), /test-key/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("accepts snake_case inline_data from Generative Language REST", async () => {
    process.env.GOOGLE_AI_IMAGES_ENABLED = "true";
    process.env.GOOGLE_AI_API_KEY = "test-key";
    const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  { inline_data: { mime_type: "image/png", data: pngBase64 } },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    try {
      const result = await createGoogleAiImageProvider().generate({
        prompt: "EV",
        aspectRatio: "1:1",
      });
      assert.equal(result.ok, true);
      assert.ok(result.image);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not retry FreeTier quota limit 0", async () => {
    process.env.GOOGLE_AI_IMAGES_ENABLED = "true";
    process.env.GOOGLE_AI_API_KEY = "test-key";
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(
        JSON.stringify({
          error: {
            status: "RESOURCE_EXHAUSTED",
            message: "FreeTier limit: 0",
            details: [
              {
                violations: [
                  {
                    quotaId:
                      "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
                  },
                ],
              },
            ],
          },
        }),
        { status: 429 },
      );
    }) as typeof fetch;

    try {
      const result = await createGoogleAiImageProvider().generate({
        prompt: "EV",
        aspectRatio: "16:9",
      });
      assert.equal(result.ok, false);
      assert.equal(calls, 1);
      assert.equal(result.error, GOOGLE_AI_IMAGE_QUOTA_ADMIN_MESSAGE);
      assert.equal(result.metadata?.category, "quota_limit_0");
      assert.equal(result.metadata?.attempts, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("retries temporary rate limits at most twice", async () => {
    process.env.GOOGLE_AI_IMAGES_ENABLED = "true";
    process.env.GOOGLE_AI_API_KEY = "test-key";
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(
        JSON.stringify({
          error: { message: "Rate limit exceeded" },
        }),
        { status: 429, headers: { "Retry-After": "0" } },
      );
    }) as typeof fetch;

    try {
      const result = await createGoogleAiImageProvider().generate({
        prompt: "EV",
        aspectRatio: "16:9",
      });
      assert.equal(result.ok, false);
      assert.equal(calls, 3); // 1 initial + 2 retries
      assert.equal(result.metadata?.attempts, 3);
      assert.equal(result.metadata?.category, "temporary_rate_limit");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("maps provider failure safely", async () => {
    process.env.GOOGLE_AI_IMAGES_ENABLED = "true";
    process.env.GOOGLE_AI_API_KEY = "test-key";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("quota exceeded secret=test-key FreeTier limit: 0", {
        status: 429,
      })) as typeof fetch;
    try {
      const provider = createGoogleAiImageProvider();
      const result = await provider.generate({
        prompt: "EV",
        aspectRatio: "16:9",
      });
      assert.equal(result.ok, false);
      assert.doesNotMatch(result.error || "", /test-key/);
      assert.doesNotMatch(JSON.stringify(result.metadata), /test-key/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("healthCheck reports missing API key", async () => {
    process.env.GOOGLE_AI_IMAGES_ENABLED = "true";
    delete process.env.GOOGLE_AI_API_KEY;
    const health = await createGoogleAiImageProvider().healthCheck();
    assert.equal(health.statusCode, "missing_api_key");
    assert.equal(health.connected, false);
  });
});
