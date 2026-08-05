import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAdminAiServicesStatus } from "../lib/admin/admin-ai-status";
import {
  buildProductionSummary,
  completionBarGlyphs,
  completionStatusText,
  resolveEditorJump,
} from "../lib/admin/editor-navigation";

describe("editor navigation jumps", () => {
  it("maps battery / images / editorial blockers to tabs", () => {
    assert.equal(resolveEditorJump("battery")?.tab, "specifications");
    assert.equal(resolveEditorJump("battery")?.anchorId, "spec-battery");
    assert.equal(resolveEditorJump("hero_image")?.tab, "images");
    assert.equal(resolveEditorJump("description")?.tab, "editorial");
    assert.equal(resolveEditorJump("editorial_draft")?.openLabel, "Editorial");
  });

  it("builds completion status + glyphs", () => {
    assert.equal(completionStatusText(82), "Needs Review");
    assert.equal(completionStatusText(95), "Ready for Publish");
    assert.equal(completionBarGlyphs(50, 4), "██░░");
  });

  it("builds production summary flags", () => {
    const summary = buildProductionSummary({
      percent: 92,
      canPublish: false,
      publishIssueCodes: ["hero_image"],
      sections: [
        {
          id: "media",
          items: [
            { id: "hero_image", complete: false, requiredForPublish: true },
            { id: "front_image", complete: true, requiredForPublish: true },
          ],
        },
        {
          id: "editorial",
          items: [{ id: "description", complete: true, requiredForPublish: true }],
        },
        {
          id: "specifications",
          items: [{ id: "battery", complete: true }],
        },
      ],
    });
    assert.equal(summary.completionPercent, 92);
    assert.equal(summary.flags.find((f) => f.id === "images")?.ok, false);
    assert.equal(summary.flags.find((f) => f.id === "editorial")?.ok, true);
  });
});

describe("admin AI status labels", () => {
  it("never marks all-failed when text or OpenAI image works", () => {
    const textOnly = buildAdminAiServicesStatus({
      textAvailable: true,
      openaiImageAvailable: false,
      googleImageAvailable: false,
    });
    assert.equal(textOnly.allFailed, false);
    assert.match(textOnly.lines[0].label, /AI Text Available/);
    assert.match(textOnly.lines[2].label, /Google Image unavailable/);

    const openaiOnly = buildAdminAiServicesStatus({
      textAvailable: false,
      openaiImageAvailable: true,
      googleImageAvailable: false,
    });
    assert.equal(openaiOnly.allFailed, false);
    assert.match(openaiOnly.lines[1].label, /AI Image Available \(OpenAI\)/);
  });

  it("marks all-failed only when every service is down", () => {
    const status = buildAdminAiServicesStatus({
      textAvailable: false,
      openaiImageAvailable: false,
      googleImageAvailable: false,
    });
    assert.equal(status.allFailed, true);
  });
});
