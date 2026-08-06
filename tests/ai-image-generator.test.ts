import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AI_GENERATOR_IMAGE_TYPES,
  AI_GENERATOR_PRECHECK_ITEMS,
  buildAdminGeneratorPrompt,
  createAiGeneratorHistoryId,
  estimateAiGenerationCostPlaceholder,
  isAiGeneratorPrecheckComplete,
  usageRequiresExplicitDetail,
} from "../lib/admin/ai-image-generator";

describe("AI image generator helpers", () => {
  it("exposes the three-image modal types by default", () => {
    const labels = AI_GENERATOR_IMAGE_TYPES.map((t) => t.label);
    for (const required of ["Front", "Interior", "Rear"]) {
      assert.ok(labels.includes(required), `missing ${required}`);
    }
    assert.equal(labels.includes("Side"), false);
    assert.equal(labels.includes("Charging"), false);
    assert.equal(labels.includes("Cargo"), false);
  });

  it("requires all precheck boxes before accept", () => {
    assert.equal(isAiGeneratorPrecheckComplete([]), false);
    assert.equal(
      isAiGeneratorPrecheckComplete(
        AI_GENERATOR_PRECHECK_ITEMS.map((item) => item.key),
      ),
      true,
    );
  });

  it("builds editable prompts with model identity", () => {
    const prompt = buildAdminGeneratorPrompt({
      brand: "BYD",
      model: "Seal U",
      variant: "Comfort",
      year: 2025,
      usageType: "front_illustration",
      style: "scandinavian_studio",
      aspectRatio: "16:9",
    });
    assert.match(prompt, /BYD Seal U/);
    assert.match(prompt, /Comfort/);
    assert.match(prompt, /illustrative interpretation/i);
    assert.doesNotMatch(prompt, /exact OEM photography claim/i);
  });

  it("marks interior/charging/cargo as explicit detail", () => {
    assert.equal(usageRequiresExplicitDetail("interior_illustration"), true);
    assert.equal(usageRequiresExplicitDetail("charging_illustration"), true);
    assert.equal(usageRequiresExplicitDetail("cargo_illustration"), true);
    assert.equal(usageRequiresExplicitDetail("side_illustration"), false);
  });

  it("returns a cost estimate placeholder without inventing a bill", () => {
    const estimate = estimateAiGenerationCostPlaceholder({
      providerId: "openai",
      aspectRatio: "16:9",
    });
    assert.equal(estimate.amountDisplay, "—");
    assert.match(estimate.note, /openai/i);
    assert.match(estimate.note, /16:9/);
    assert.match(estimate.currencyNote, /not metered/i);
  });

  it("creates unique session history ids", () => {
    const a = createAiGeneratorHistoryId();
    const b = createAiGeneratorHistoryId();
    assert.match(a, /^gen_/);
    assert.notEqual(a, b);
  });
});
