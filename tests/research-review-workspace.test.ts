import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import path from "node:path";
import {
  applyMissingFieldAction,
  buildFocusQueue,
  buildTopicQueue,
  canBulkApproveField,
  categoryForFieldKey,
  categoryTone,
  computeResearchReviewSummary,
  countCategory,
  fieldsForScope,
  focusProgress,
  groupConflicts,
  indexAfterDecision,
  isPreviewableImageUrl,
  isUnresolvedQueueItem,
  labelImageCandidate,
  listVariantScopes,
  nextUnresolvedIndex,
  RESEARCH_REVIEW_CATEGORIES,
  researchFieldLabel,
  type ResearchReviewCategoryId,
} from "../lib/admin/research/review-workspace";
import type {
  ResearchFieldCandidate,
  ResearchImageCandidate,
  ResearchItem,
} from "../lib/admin/research/types";

function field(
  partial: Partial<ResearchFieldCandidate> &
    Pick<ResearchFieldCandidate, "id" | "field_key" | "status">,
): ResearchFieldCandidate {
  return {
    item_id: "item-1",
    created_at: "2026-07-26T00:00:00.000Z",
    entity_type: "car",
    variant_slug: null,
    proposed_value: null,
    source_name: null,
    source_url: null,
    retrieved_at: null,
    confidence: null,
    conflict_group: null,
    notes: null,
    ...partial,
  };
}

function item(partial: Partial<ResearchItem> = {}): ResearchItem {
  return {
    id: "item-1",
    job_id: "job-1",
    created_at: "2026-07-26T00:00:00.000Z",
    updated_at: "2026-07-26T00:00:00.000Z",
    sort_order: 0,
    slug: "tesla-model-3",
    brand: "Tesla",
    model: "Model 3",
    existing_car_id: null,
    decision: "pending",
    warnings: [],
    missing_fields: [],
    conflicts: [],
    proposed_car: {},
    proposed_variants: [],
    message: null,
    ...partial,
  };
}

function image(
  partial: Partial<ResearchImageCandidate> &
    Pick<ResearchImageCandidate, "id" | "original_url">,
): ResearchImageCandidate {
  return {
    item_id: "item-1",
    created_at: "2026-07-26T00:00:00.000Z",
    source_name: null,
    source_url: null,
    license_note: null,
    usage_terms: null,
    alt_text: null,
    image_type: "exterior",
    is_primary_candidate: false,
    status: "pending",
    applied_image_id: null,
    storage_path: null,
    notes: null,
    ...partial,
  };
}

describe("topic summary counts", () => {
  it("computes topic counts and tones for the summary rows", () => {
    const fields = [
      field({
        id: "1",
        field_key: "battery_usable_kwh",
        status: "approved",
        confidence: 0.95,
      }),
      field({
        id: "2",
        field_key: "battery_total_kwh",
        status: "pending",
        confidence: 0.7,
      }),
      field({
        id: "3",
        field_key: "battery_chemistry",
        status: "conflict",
        confidence: 0.4,
      }),
    ];
    const battery = RESEARCH_REVIEW_CATEGORIES.find(
      (category) => category.id === "battery",
    )!;
    const counts = countCategory(battery, fields, ["range_km"], []);
    assert.equal(counts.approved, 1);
    assert.equal(counts.pending, 1);
    assert.equal(counts.conflict, 1);
    assert.equal(categoryTone(counts), "red");

    const summary = computeResearchReviewSummary({
      item: item({ missing_fields: ["warranty"] }),
      fields,
      images: [image({ id: "img", original_url: "https://cdn.example.com/a.jpg" })],
    });
    assert.equal(summary.pending, 1);
    assert.equal(summary.conflicts, 1);
    assert.equal(summary.missing, 1);
    assert.equal(summary.imagesPending, 1);
    assert.equal(summary.ready, false);
  });

  it("exposes all required topics", () => {
    const ids = RESEARCH_REVIEW_CATEGORIES.map((category) => category.id);
    for (const required of [
      "identity",
      "battery",
      "range",
      "charging",
      "performance",
      "dimensions",
      "practical",
      "equipment",
      "warranty",
      "editorial",
      "sources",
      "images",
      "variants",
    ] as ResearchReviewCategoryId[]) {
      assert.ok(ids.includes(required));
    }
  });
});

describe("one-item-at-a-time navigation", () => {
  it("builds a topic queue with conflicts separated from ordinary fields", () => {
    const fields = [
      field({
        id: "a",
        field_key: "battery_usable_kwh",
        status: "conflict",
        proposed_value: 75,
        conflict_group: "battery_usable_kwh",
      }),
      field({
        id: "b",
        field_key: "battery_usable_kwh",
        status: "conflict",
        proposed_value: 78,
        conflict_group: "battery_usable_kwh",
      }),
      field({
        id: "c",
        field_key: "battery_total_kwh",
        status: "pending",
        proposed_value: 82,
      }),
      field({
        id: "d",
        field_key: "battery_chemistry",
        status: "approved",
        proposed_value: "NMC",
      }),
    ];

    const queue = buildTopicQueue({
      categoryId: "battery",
      fields,
      missingFields: ["battery_kwh"],
      images: [],
    });

    assert.equal(queue[0].kind, "conflict");
    assert.equal(queue.filter((row) => row.kind === "field").length, 2);
    assert.equal(queue.some((row) => row.kind === "missing"), true);
    assert.equal(
      queue.filter((row) => row.kind === "field" && row.field.id === "a").length,
      0,
    );
  });

  it("advances to the next unresolved item after a decision", () => {
    const queue = buildTopicQueue({
      categoryId: "practical",
      fields: [
        field({ id: "1", field_key: "seats", status: "pending" }),
        field({ id: "2", field_key: "frunk_l", status: "approved" }),
        field({ id: "3", field_key: "cargo_l", status: "pending" }),
      ],
      missingFields: [],
      images: [],
    });

    // Sorted pending-first: seats (0), cargo (1), frunk approved (2)
    assert.equal(nextUnresolvedIndex(queue, 0), 1);
    assert.equal(indexAfterDecision(queue, 0), 1);

    const afterApprove = buildTopicQueue({
      categoryId: "practical",
      fields: [
        field({ id: "1", field_key: "seats", status: "approved" }),
        field({ id: "2", field_key: "frunk_l", status: "approved" }),
        field({ id: "3", field_key: "cargo_l", status: "pending" }),
      ],
      missingFields: [],
      images: [],
      includeResolved: true,
    });
    // After seats is approved, next unresolved is cargo_l
    const cargoIndex = afterApprove.findIndex(
      (row) => row.kind === "field" && row.field.id === "3",
    );
    assert.equal(indexAfterDecision(afterApprove, 0), cargoIndex);
  });
});

describe("focus mode", () => {
  it("collects unresolved items across topics and reports remaining progress", () => {
    const focus = buildFocusQueue({
      fields: [
        field({
          id: "1",
          field_key: "range_km",
          status: "pending",
        }),
        field({
          id: "2",
          field_key: "battery_usable_kwh",
          status: "approved",
        }),
        field({
          id: "3",
          field_key: "seats",
          status: "conflict",
          conflict_group: "seats",
        }),
      ],
      missingFields: ["warranty"],
      images: [
        image({ id: "img", original_url: "https://cdn.example.com/a.jpg" }),
      ],
    });

    assert.ok(focus.every(isUnresolvedQueueItem));
    assert.ok(focus.some((row) => row.kind === "field"));
    assert.ok(focus.some((row) => row.kind === "conflict"));
    assert.ok(focus.some((row) => row.kind === "missing"));
    assert.ok(focus.some((row) => row.kind === "image"));

    const progress = focusProgress(focus, 0);
    assert.equal(progress.remaining, focus.length);
    assert.equal(progress.total, focus.length);
    assert.equal(progress.position, 1);
  });
});

describe("conflict flow", () => {
  it("groups conflict options and never auto-picks a winner", () => {
    const fields = [
      field({
        id: "a",
        field_key: "battery_usable_kwh",
        status: "conflict",
        proposed_value: 75,
        conflict_group: "battery_usable_kwh",
        source_name: "EV-Database",
        confidence: 0.55,
      }),
      field({
        id: "b",
        field_key: "battery_usable_kwh",
        status: "conflict",
        proposed_value: 78,
        conflict_group: "battery_usable_kwh",
        source_name: "EVKX",
        confidence: 0.5,
      }),
    ];
    const groups = groupConflicts(fields);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].options.length, 2);
    assert.equal(canBulkApproveField(fields[0]), false);
  });
});

describe("variant separation", () => {
  it("keeps base and variant fields in separate scopes", () => {
    const fields = [
      field({
        id: "base",
        field_key: "range_km",
        status: "pending",
        entity_type: "car",
      }),
      field({
        id: "lr",
        field_key: "range_km",
        status: "pending",
        entity_type: "variant",
        variant_slug: "long-range-rwd",
      }),
      field({
        id: "perf",
        field_key: "power_hp",
        status: "pending",
        entity_type: "variant",
        variant_slug: "performance",
      }),
    ];
    const scopes = listVariantScopes(
      item({
        proposed_variants: [
          { name: "Long Range RWD", slug: "long-range-rwd", fields: [] },
          { name: "Performance", slug: "performance", fields: [] },
        ],
      }),
      fields,
    );
    assert.equal(scopes.length, 3);
    assert.equal(fieldsForScope(fields, { kind: "base" })[0].id, "base");
    assert.equal(
      fieldsForScope(fields, {
        kind: "variant",
        slug: "long-range-rwd",
        name: "Long Range RWD",
      })[0].id,
      "lr",
    );
  });
});

describe("missing-data actions", () => {
  it("marks not available by removing the checklist item and leaves later untouched", () => {
    const missing = ["warranty", "range_km"];
    assert.deepEqual(
      applyMissingFieldAction(missing, "warranty", "not_available"),
      ["range_km"],
    );
    assert.deepEqual(
      applyMissingFieldAction(missing, "warranty", "later"),
      missing,
    );
    assert.deepEqual(
      applyMissingFieldAction(missing, "warranty", "research"),
      missing,
    );
  });
});

describe("human-readable labels", () => {
  it("maps database keys to Norwegian labels", () => {
    assert.equal(
      researchFieldLabel("battery_usable_kwh"),
      "Brukbar batterikapasitet",
    );
    assert.equal(researchFieldLabel("dc_charging_kw"), "Maks DC-lading");
    assert.equal(researchFieldLabel("acceleration_0_100"), "0–100 km/t");
    assert.equal(researchFieldLabel("towing_kg"), "Tillatt tilhengervekt");
    assert.equal(categoryForFieldKey("battery_usable_kwh"), "battery");
  });
});

describe("image labeling", () => {
  it("never treats page URLs as approveable image previews", () => {
    assert.equal(
      isPreviewableImageUrl("https://www.tesla.com/no_NO/model3"),
      false,
    );
    assert.equal(
      labelImageCandidate(
        image({
          id: "page",
          original_url: "https://www.tesla.com/no_NO/model3",
        }),
      ).label,
      "Source page — manual image selection required",
    );
  });
});

describe("no auto-publish", () => {
  it("apply layer remains needs_review and never sets is_published true", () => {
    const applySource = readFileSync(
      path.join(process.cwd(), "lib/admin/research/apply.ts"),
      "utf8",
    );
    assert.match(applySource, /import_status:\s*"needs_review"/);
    assert.doesNotMatch(applySource, /is_published:\s*true/);
  });
});
