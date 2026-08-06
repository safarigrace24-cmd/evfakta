import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AI_GENERATOR_IMAGE_TYPES,
  AI_GENERATOR_PRECHECK_ITEMS,
  buildAdminGeneratorPrompt,
  isAiGeneratorPrecheckComplete,
} from "../lib/admin/ai-image-generator";
import {
  THREE_IMAGE_ALTERNATIVES_PER_ROLE,
  THREE_IMAGE_PUBLIC_GALLERY_ORDER,
  THREE_IMAGE_STANDARD_ROLES,
  comparePublicGalleryImages,
  countAlternativesToCreate,
  missingThreeImageRolesToGenerate,
  summarizeThreeImageRoles,
  withPreferredThreeImageAlternativeNotes,
  withoutPreferredThreeImageAlternativeNotes,
  isPreferredThreeImageAlternative,
} from "../lib/admin/three-image-ai-workflow";
import type { CarImageRow } from "../lib/admin/car-image-types";
import type { ResearchImageCandidate } from "../lib/admin/research/types";

function candidate(
  partial: Partial<ResearchImageCandidate> & { id: string; notes: string },
): ResearchImageCandidate {
  return {
    item_id: "item",
    original_url: "evfakta-ai-illustration:awaiting-generation",
    source_name: "EVFAKTA AI Illustration",
    source_url: null,
    license_note: null,
    usage_terms: null,
    alt_text: null,
    image_type: "front",
    is_primary_candidate: false,
    status: "pending",
    storage_path: null,
    applied_image_id: null,
    created_at: "2026-08-06T00:00:00.000Z",
    ...partial,
  } as ResearchImageCandidate;
}

describe("three-image AI workflow", () => {
  it("standard roles are Front, Interior, Rear only", () => {
    assert.deepEqual(
      THREE_IMAGE_STANDARD_ROLES.map((role) => role.label),
      ["Front", "Interior", "Rear"],
    );
    assert.equal(THREE_IMAGE_ALTERNATIVES_PER_ROLE, 3);
    assert.deepEqual([...THREE_IMAGE_PUBLIC_GALLERY_ORDER], [
      "front",
      "interior",
      "rear",
    ]);
  });

  it("generator modal defaults to the three roles (+ explicit detail)", () => {
    const labels = AI_GENERATOR_IMAGE_TYPES.map((t) => t.label);
    assert.ok(labels.includes("Front"));
    assert.ok(labels.includes("Interior"));
    assert.ok(labels.includes("Rear"));
    assert.equal(labels.includes("Side"), false);
    assert.equal(labels.includes("Charging"), false);
    assert.equal(labels.includes("Hero"), false);
  });

  it("quality precheck matches three-image editor checklist", () => {
    assert.equal(isAiGeneratorPrecheckComplete([]), false);
    assert.equal(
      isAiGeneratorPrecheckComplete(
        AI_GENERATOR_PRECHECK_ITEMS.map((item) => item.key),
      ),
      true,
    );
    assert.ok(
      AI_GENERATOR_PRECHECK_ITEMS.some((item) =>
        item.label.toLowerCase().includes("vehicle identity"),
      ),
    );
  });

  it("skips roles that already have approved gallery images", () => {
    const gallery = [
      { id: "g1", image_type: "front", is_primary: true },
    ] as CarImageRow[];
    const missing = missingThreeImageRolesToGenerate({
      gallery,
      candidates: [],
    });
    assert.deepEqual(missing, [
      "interior_illustration",
      "rear_illustration",
    ]);
  });

  it("marks gallery complete only when all three roles are approved", () => {
    const gallery = [
      { id: "1", image_type: "front" },
      { id: "2", image_type: "interior" },
      { id: "3", image_type: "rear" },
    ] as CarImageRow[];
    const summary = summarizeThreeImageRoles({ gallery, candidates: [] });
    assert.equal(summary.galleryComplete, true);
    assert.deepEqual(summary.missingUsageTypes, []);
  });

  it("counts remaining alternatives without duplicating pending ones", () => {
    const candidates = [
      candidate({
        id: "a",
        notes: "ai-illustration | usage:front_illustration",
        status: "pending",
      }),
      candidate({
        id: "b",
        notes: "ai-illustration | usage:front_illustration",
        status: "pending",
      }),
    ];
    assert.equal(
      countAlternativesToCreate({
        usageType: "front_illustration",
        candidates,
      }),
      1,
    );
  });

  it("preferred alternative marker can be toggled in notes", () => {
    const withPref = withPreferredThreeImageAlternativeNotes("usage:front_illustration");
    assert.equal(isPreferredThreeImageAlternative(withPref), true);
    const cleared = withoutPreferredThreeImageAlternativeNotes(withPref);
    assert.equal(isPreferredThreeImageAlternative(cleared), false);
  });

  it("public gallery order is Front → Interior → Rear", () => {
    const ordered = [
      { id: "r", image_type: "rear", sort_order: 0 },
      { id: "i", image_type: "interior", sort_order: 0 },
      { id: "f", image_type: "front", sort_order: 0 },
    ].sort(comparePublicGalleryImages);
    assert.deepEqual(
      ordered.map((row) => row.image_type),
      ["front", "interior", "rear"],
    );
  });

  it("builds prompts from verified vehicle identity without inventing trim", () => {
    const prompt = buildAdminGeneratorPrompt({
      brand: "BYD",
      model: "Seal U",
      variant: "Design",
      year: 2025,
      bodyStyle: "SUV",
      usageType: "front_illustration",
      style: "scandinavian_studio",
      aspectRatio: "16:9",
    });
    assert.match(prompt, /BYD Seal U/);
    assert.match(prompt, /Design/);
    assert.match(prompt, /SUV/);
    assert.match(prompt, /AI-generert illustrasjon/);
    assert.doesNotMatch(prompt, /exact OEM photography claim/i);
  });
});
