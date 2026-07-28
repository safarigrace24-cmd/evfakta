import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCarImageStoragePath,
  buildImageProductionModelReport,
  canCollectAsImageCandidate,
  classifyImageSourceCategory,
  collectImageProductionWarnings,
  formatImageProductionBatchMarkdown,
  isRejectedImageSourceUrl,
  resolveStorageRole,
  summarizeImageProductionBatch,
} from "../lib/admin/image-production";
import type { ResearchImageCandidate } from "../lib/admin/research/types";
import { canApproveImageCandidate } from "../lib/admin/image-review";

function candidate(
  overrides: Partial<ResearchImageCandidate> = {},
): ResearchImageCandidate {
  return {
    id: "img-1",
    item_id: "item-1",
    created_at: "2026-07-26T00:00:00.000Z",
    original_url: "https://www.volvocars.com/images/ex30-front.jpg",
    source_name: "Volvo Cars Norge",
    source_url: "https://www.volvocars.com/no/",
    license_note: "Press kit — verify terms",
    usage_terms: "Editorial use pending confirmation",
    alt_text: "EX30 front",
    image_type: "front",
    is_primary_candidate: false,
    status: "pending",
    applied_image_id: null,
    storage_path: null,
    notes: null,
    ...overrides,
  };
}

describe("image production source policy", () => {
  it("rejects Google / Pinterest / social aggregator URLs", () => {
    assert.equal(
      isRejectedImageSourceUrl("https://www.google.com/imgres?imgurl=x"),
      true,
    );
    assert.equal(
      isRejectedImageSourceUrl("https://i.pinimg.com/originals/ab/cd.jpg"),
      true,
    );
    assert.equal(
      canCollectAsImageCandidate("https://images.google.com/search?q=tesla"),
      false,
    );
  });

  it("allows official manufacturer CDN candidates for collection only", () => {
    assert.equal(
      canCollectAsImageCandidate("https://www.tesla.com/ns_videos/model-y.jpg"),
      true,
    );
    assert.equal(
      classifyImageSourceCategory({
        originalUrl: "https://www.tesla.com/ns_videos/model-y.jpg",
        sourceUrl: "https://www.tesla.com/no_NO/modely",
        sourceName: "Tesla Norge",
      }),
      "official_no_manufacturer",
    );
  });

  it("blocks approval for rejected sources", () => {
    const google = candidate({
      original_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:xyz",
      source_url: "https://www.google.com/search?tbm=isch&q=ex30",
    });
    assert.equal(canApproveImageCandidate(google), false);
    assert.ok(
      collectImageProductionWarnings(google).includes("Rejected source"),
    );
  });
});

describe("image production storage paths", () => {
  it("builds brand/model role paths without overwriting siblings", () => {
    const path = buildCarImageStoragePath({
      brand: "Volvo",
      modelSlug: "ex30",
      role: "hero",
      uniqueId: "a1b2c3d4-e5f6",
    });
    assert.equal(path, "volvo/ex30/hero-a1b2c3d4-e5f.webp");
    assert.equal(resolveStorageRole({ isPrimary: true, imageType: "front" }), "hero");
    assert.equal(resolveStorageRole({ imageType: "side" }), "side");
  });
});

describe("image production batch reporting", () => {
  it("includes Image Ready status and Image Review admin path", () => {
    const report = buildImageProductionModelReport({
      carId: "car-123",
      brand: "Volvo",
      model: "EX30",
      slug: "ex30",
      gallery: [],
      candidates: [
        candidate({ id: "1", is_primary_candidate: true, status: "approved" }),
        candidate({ id: "2", image_type: "front", status: "approved" }),
        candidate({ id: "3", image_type: "side", status: "pending" }),
      ],
    });

    assert.equal(report.imagesReady, false);
    assert.equal(report.readinessLabel, "Images Pending Review");
    assert.equal(report.imageReviewPath, "/admin/images/car-123");
    assert.deepEqual(report.missingRequiredTypes, ["side"]);

    const summary = summarizeImageProductionBatch([report]);
    const markdown = formatImageProductionBatchMarkdown(summary);
    assert.match(markdown, /Image Ready/);
    assert.match(markdown, /\/admin\/images\/car-123/);
    assert.match(markdown, /Images Pending/);
  });
});
