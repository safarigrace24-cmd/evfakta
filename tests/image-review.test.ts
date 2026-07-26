import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CarImageRow } from "../lib/admin/car-image-types";
import {
  buildImageReviewCard,
  canApproveImageCandidate,
  collectImageQualityWarnings,
  computeImageReviewReadiness,
  shouldAttemptImagePreview,
  toImageReviewStatus,
} from "../lib/admin/image-review";
import type { ResearchImageCandidate } from "../lib/admin/research/types";

function candidate(
  overrides: Partial<ResearchImageCandidate> = {},
): ResearchImageCandidate {
  return {
    id: "img-1",
    item_id: "item-1",
    created_at: "2026-07-26T00:00:00.000Z",
    original_url: "https://cdn.example.com/cars/ex30-front.jpg",
    source_name: "Volvo Cars Norge",
    source_url: "https://www.volvocars.com/no/",
    license_note: null,
    usage_terms: null,
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

function gallery(
  overrides: Partial<CarImageRow> = {},
): CarImageRow {
  return {
    id: "gal-1",
    car_id: "car-1",
    image_url: "/x.webp",
    storage_path: "x.webp",
    image_type: "front",
    alt_text: null,
    sort_order: 0,
    is_primary: false,
    created_at: "2026-07-26T00:00:00.000Z",
    ...overrides,
  };
}

describe("image review status mapping", () => {
  it("maps DB statuses to editor labels", () => {
    assert.equal(toImageReviewStatus("pending"), "Candidate");
    assert.equal(toImageReviewStatus("approved"), "Approved");
    assert.equal(toImageReviewStatus("applied"), "Approved");
    assert.equal(toImageReviewStatus("rejected"), "Rejected");
  });
});

describe("image review quality warnings", () => {
  it("flags missing attribution, empty URL, duplicate, low resolution", () => {
    const a = candidate({
      id: "a",
      source_name: null,
      source_url: null,
      original_url: "",
      notes: "resolution: 640x480",
    });
    const b = candidate({
      id: "b",
      original_url: "https://cdn.example.com/cars/ex30-front.jpg",
    });
    const c = candidate({
      id: "c",
      original_url: "https://cdn.example.com/cars/ex30-front.jpg",
    });
    const warningsA = collectImageQualityWarnings(a, [a, b]);
    assert.ok(warningsA.includes("Broken URL"));
    assert.ok(warningsA.includes("Missing attribution"));
    assert.ok(warningsA.includes("Low resolution"));

    const warningsB = collectImageQualityWarnings(b, [b, c]);
    assert.ok(warningsB.includes("Duplicate"));
  });

  it("attempts preview for real candidate image URLs", () => {
    assert.equal(
      shouldAttemptImagePreview(
        "https://wizz.volvocars.com/images/2027/416/exterior/studio/front/exterior-studio-front_abc.png",
      ),
      true,
    );
    assert.equal(
      shouldAttemptImagePreview(
        "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/exterior.jpg",
      ),
      true,
    );
    assert.equal(shouldAttemptImagePreview("https://example.com/file.pdf"), false);
    assert.equal(shouldAttemptImagePreview(""), false);

    const card = buildImageReviewCard(
      candidate({
        original_url:
          "https://wizz.volvocars.com/images/2027/416/exterior/studio/front/car.png",
      }),
      [],
    );
    assert.equal(card.previewKind, "image");
    assert.match(card.previewUrl, /\.png$/);
  });

  it("blocks approve for source-page URLs", () => {
    assert.equal(
      canApproveImageCandidate(
        candidate({ original_url: "https://www.tesla.com/no_NO/model3" }),
      ),
      false,
    );
    assert.equal(canApproveImageCandidate(candidate()), true);
  });
});

describe("image readiness publication rule", () => {
  it("requires hero + front + side before Image Ready", () => {
    const pending = computeImageReviewReadiness({
      gallery: [],
      candidates: [
        candidate({ id: "1", image_type: "front", status: "approved" }),
        candidate({ id: "2", image_type: "side", status: "approved" }),
      ],
    });
    assert.equal(pending.label, "Images Pending Review");
    assert.equal(pending.missingHero, true);
    assert.equal(pending.imagesReady, false);

    const ready = computeImageReviewReadiness({
      gallery: [
        gallery({ id: "g1", image_type: "front", is_primary: true }),
        gallery({ id: "g2", image_type: "side", is_primary: false }),
      ],
      candidates: [],
      carImageUrl: "/hero.webp",
    });
    assert.equal(ready.label, "Image Ready");
    assert.equal(ready.imagesReady, true);
    assert.equal(ready.missingHero, false);
    assert.equal(ready.missingGallery, false);
  });

  it("treats applied primary candidate as hero", () => {
    const readiness = computeImageReviewReadiness({
      gallery: [],
      candidates: [
        candidate({
          id: "h",
          image_type: "front",
          is_primary_candidate: true,
          status: "applied",
          applied_image_id: "gal-1",
        }),
        candidate({ id: "s", image_type: "side", status: "approved" }),
      ],
    });
    assert.equal(readiness.hasApprovedHero, true);
    assert.equal(readiness.hasApprovedFront, true);
    assert.equal(readiness.hasApprovedSide, true);
    assert.equal(readiness.label, "Image Ready");
  });

  it("builds review cards without mutating status", () => {
    const images = [
      candidate({ id: "1", is_primary_candidate: true }),
      candidate({ id: "2", image_type: "side", status: "rejected" }),
    ];
    const card = buildImageReviewCard(images[0]!, images);
    assert.equal(card.status, "Candidate");
    assert.equal(card.isHeroCandidate, true);
    assert.match(card.imageTypeLabel, /Hero/);
  });
});
