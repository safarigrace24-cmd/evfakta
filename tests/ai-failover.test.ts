import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  generateWithAutomaticFailover,
  shouldFailoverToOpenAi,
} from "../lib/admin/ai-providers/failover";
import type { AiImageProviderResult } from "../lib/admin/ai-providers/types";

const ORIGINAL = {
  AI_PROVIDER: process.env.AI_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  GOOGLE_AI_IMAGES_ENABLED: process.env.GOOGLE_AI_IMAGES_ENABLED,
};

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function googleFail(partial: Partial<AiImageProviderResult> = {}): AiImageProviderResult {
  const { metadata: metaOverride, ...rest } = partial;
  return {
    ok: false,
    image: null,
    prompt: "EV",
    provider: "google",
    generationTimeMs: 10,
    warnings: ["quota"],
    status: "failed",
    error: "quota",
    unavailable: true,
    ...rest,
    metadata: {
      adapter: "google_gemini",
      reason: "quota_or_billing",
      category: "quota_limit_0",
      httpStatus: 429,
      ...(metaOverride || {}),
    },
  };
}

describe("Google → OpenAI automatic failover", () => {
  it("fails over on Google FreeTier / 429 when OpenAI key is present", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    assert.equal(shouldFailoverToOpenAi("google", googleFail({})), true);
  });

  it("fails over on feature_disabled (Google images flag off)", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    assert.equal(
      shouldFailoverToOpenAi(
        "google",
        googleFail({
          metadata: { reason: "feature_disabled" },
          status: "unavailable",
        }),
      ),
      true,
    );
  });

  it("does not fail over when primary is not google", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    assert.equal(shouldFailoverToOpenAi("openai", googleFail({})), false);
  });

  it("does not fail over without OpenAI key", () => {
    delete process.env.OPENAI_API_KEY;
    assert.equal(shouldFailoverToOpenAi("google", googleFail({})), false);
  });

  it("uses OpenAI once when Google is disabled and OpenAI succeeds", async () => {
    process.env.AI_PROVIDER = "google";
    process.env.GOOGLE_AI_IMAGES_ENABLED = "false";
    process.env.GOOGLE_AI_API_KEY = "google-test-key";
    process.env.OPENAI_API_KEY = "sk-test";

    const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");
    let openaiCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("api.openai.com")) {
        openaiCalls += 1;
        return new Response(JSON.stringify({ data: [{ b64_json: pngBase64 }] }), {
          status: 200,
        });
      }
      // Google should not be called when feature flag is off
      return new Response("unexpected", { status: 500 });
    }) as typeof fetch;

    try {
      const result = await generateWithAutomaticFailover({
        prompt: "Minimal EV illustration test",
        aspectRatio: "1:1",
      });
      assert.equal(result.ok, true);
      assert.ok(result.image);
      assert.equal(result.provider, "openai");
      assert.equal(result.metadata?.usedFallback, true);
      assert.equal(openaiCalls, 1);
      assert.doesNotMatch(JSON.stringify(result), /sk-test|google-test-key/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not call OpenAI when Google succeeds", async () => {
    process.env.AI_PROVIDER = "google";
    process.env.GOOGLE_AI_IMAGES_ENABLED = "true";
    process.env.GOOGLE_AI_API_KEY = "google-test-key";
    process.env.OPENAI_API_KEY = "sk-test";

    const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");
    let openaiCalls = 0;
    let googleCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("api.openai.com")) {
        openaiCalls += 1;
        return new Response("nope", { status: 500 });
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        googleCalls += 1;
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ inlineData: { mimeType: "image/png", data: pngBase64 } }],
                },
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response("unexpected", { status: 500 });
    }) as typeof fetch;

    try {
      const result = await generateWithAutomaticFailover({
        prompt: "EV",
        aspectRatio: "16:9",
      });
      assert.equal(result.ok, true);
      assert.equal(result.provider, "google");
      assert.equal(result.metadata?.usedFallback, false);
      assert.equal(googleCalls, 1);
      assert.equal(openaiCalls, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
