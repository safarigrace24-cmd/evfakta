import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  getOpenAiApiKey,
  getOpenAiImageModel,
  openAiImageSizeForAspect,
} from "../lib/admin/ai-providers/openai-ai";
import { createOpenAiImageProvider } from "../lib/admin/ai-providers/openai-provider";
import { AI_IMAGE_PROVIDERS } from "../lib/admin/ai-providers/providers";

const ORIGINAL = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AI_OPENAI_API_KEY: process.env.AI_OPENAI_API_KEY,
  OPENAI_IMAGE_MODEL: process.env.OPENAI_IMAGE_MODEL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("OpenAI Images provider", () => {
  it("registers openai with remoteGenerate capability", () => {
    assert.equal(AI_IMAGE_PROVIDERS.openai.capabilities.remoteGenerate, true);
  });

  it("reads OPENAI_API_KEY and defaults model", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_OPENAI_API_KEY;
    assert.equal(getOpenAiApiKey(), null);
    process.env.OPENAI_API_KEY = "sk-test";
    assert.equal(getOpenAiApiKey(), "sk-test");
    delete process.env.OPENAI_IMAGE_MODEL;
    assert.equal(getOpenAiImageModel(), "gpt-image-1");
  });

  it("maps aspect ratios for gpt-image and dall-e", () => {
    assert.equal(openAiImageSizeForAspect("1:1", "gpt-image-1"), "1024x1024");
    assert.equal(openAiImageSizeForAspect("16:9", "gpt-image-1"), "1536x1024");
    assert.equal(openAiImageSizeForAspect("9:16", "gpt-image-1"), "1024x1536");
    assert.equal(openAiImageSizeForAspect("16:9", "dall-e-3"), "1792x1024");
  });

  it("returns unavailable when API key is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_OPENAI_API_KEY;
    const result = await createOpenAiImageProvider().generate({
      prompt: "EV illustration",
      aspectRatio: "16:9",
    });
    assert.equal(result.ok, false);
    assert.equal(result.unavailable, true);
    assert.equal(result.image, null);
  });

  it("normalizes a successful mocked Images API response", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ data: [{ b64_json: pngBase64 }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;

    try {
      const result = await createOpenAiImageProvider().generate({
        prompt: "Scandinavian studio EV",
        negativePrompt: "watermark",
        aspectRatio: "16:9",
      });
      assert.equal(result.ok, true);
      assert.ok(result.image);
      assert.equal(result.provider, "openai");
      assert.doesNotMatch(JSON.stringify(result), /sk-test/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("maps 429 without leaking secrets", async () => {
    process.env.OPENAI_API_KEY = "sk-secret-key";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("rate limit sk-secret-key", { status: 429 })) as typeof fetch;
    try {
      const result = await createOpenAiImageProvider().generate({
        prompt: "EV",
        aspectRatio: "1:1",
      });
      assert.equal(result.ok, false);
      assert.doesNotMatch(result.error || "", /sk-secret/);
      assert.equal(result.metadata?.httpStatus, 429);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
