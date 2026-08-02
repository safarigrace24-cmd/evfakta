import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  AI_IMAGE_PROVIDERS,
  AI_PROVIDER_IDS,
  getActiveAiImageProvider,
  getConfiguredAiProviderFallbackIds,
  getConfiguredAiProviderId,
  getFallbackAiImageProviders,
  isAiProviderId,
} from "../lib/admin/ai-providers";

const ORIGINAL_PROVIDER = process.env.AI_PROVIDER;
const ORIGINAL_FALLBACK = process.env.AI_PROVIDER_FALLBACK;

afterEach(() => {
  if (ORIGINAL_PROVIDER === undefined) delete process.env.AI_PROVIDER;
  else process.env.AI_PROVIDER = ORIGINAL_PROVIDER;
  if (ORIGINAL_FALLBACK === undefined) delete process.env.AI_PROVIDER_FALLBACK;
  else process.env.AI_PROVIDER_FALLBACK = ORIGINAL_FALLBACK;
});

describe("AI provider abstraction", () => {
  it("registers all supported provider ids", () => {
    for (const id of AI_PROVIDER_IDS) {
      assert.ok(AI_IMAGE_PROVIDERS[id], `missing provider ${id}`);
      assert.equal(AI_IMAGE_PROVIDERS[id].id, id);
      if (id === "google") {
        assert.equal(AI_IMAGE_PROVIDERS[id].capabilities.remoteGenerate, true);
      } else {
        assert.equal(AI_IMAGE_PROVIDERS[id].capabilities.remoteGenerate, false);
      }
    }
  });

  it("defaults AI_PROVIDER to none", () => {
    delete process.env.AI_PROVIDER;
    assert.equal(getConfiguredAiProviderId(), "none");
    assert.equal(getActiveAiImageProvider().id, "none");
  });

  it("resolves aliases without admin UI", () => {
    process.env.AI_PROVIDER = "imagen";
    assert.equal(getConfiguredAiProviderId(), "google");
    process.env.AI_PROVIDER = "dalle";
    assert.equal(getConfiguredAiProviderId(), "openai");
    process.env.AI_PROVIDER = "sd";
    assert.equal(getConfiguredAiProviderId(), "stable_diffusion");
  });

  it("exposes fallback list without auto-switching", () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_PROVIDER_FALLBACK = "google,flux,openai";
    assert.deepEqual(getConfiguredAiProviderFallbackIds(), ["google", "flux"]);
    assert.deepEqual(
      getFallbackAiImageProviders().map((p) => p.id),
      ["google", "flux"],
    );
    assert.equal(getActiveAiImageProvider().id, "openai");
  });

  it("stubs return common unavailable generate result", async () => {
    process.env.AI_PROVIDER = "flux";
    const provider = getActiveAiImageProvider();
    const result = await provider.generate({
      prompt: "test EV illustration",
      aspectRatio: "16:9",
    });
    assert.equal(result.ok, false);
    assert.equal(result.unavailable, true);
    assert.equal(result.image, null);
    assert.equal(result.provider, "flux");
    assert.equal(typeof result.generationTimeMs, "number");
    assert.ok(Array.isArray(result.warnings));
    assert.ok(result.prompt.includes("test EV"));
    assert.ok(result.metadata);
  });

  it("healthCheck reports not connected for stubs", async () => {
    process.env.AI_PROVIDER = "openai";
    const health = await getActiveAiImageProvider().healthCheck();
    assert.equal(health.provider, "openai");
    assert.equal(health.connected, false);
    assert.equal(health.healthy, false);
  });

  it("validates provider ids", () => {
    assert.equal(isAiProviderId("openai"), true);
    assert.equal(isAiProviderId("nope"), false);
  });
});
