import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EDITORIAL_DRAFT_MARKER } from "../lib/admin/editorial-assist-core";
import {
  getLaunchContentIssues,
  getPublishIssues,
  getSeoPublishIssues,
  type PublishReadinessInput,
} from "../lib/admin/publish-readiness";

const longDescription =
  "Volkswagen ID.3 er en kompakt elbil for det norske markedet med dokumenterte spesifikasjoner.";

function baseReady(
  overrides: Partial<PublishReadinessInput> = {},
): PublishReadinessInput {
  return {
    brand: "Tesla",
    model: "Model Y",
    slug: "tesla-model-y",
    description: longDescription,
    image_url: "https://example.com/y.webp",
    source_name: "Tesla Norge",
    source_url: "https://www.tesla.com/no_NO",
    data_last_checked_at: "2026-07-25T00:00:00.000Z",
    import_status: "approved",
    pros: ["God rekkevidde"],
    cons: ["Pris"],
    suitable_for: ["Familie"],
    score_notes: null,
    gallery_images: [
      { image_type: "front", is_primary: true },
      { image_type: "side", is_primary: false },
    ],
    has_gallery_image: true,
    ...overrides,
  };
}

describe("getPublishIssues", () => {
  it("blocks publish when review data is missing", () => {
    const issues = getPublishIssues({
      brand: "Tesla",
      model: "Model Y",
      slug: "tesla-model-y",
      description: null,
      image_url: null,
      source_name: null,
      source_url: null,
      data_last_checked_at: null,
      import_status: "draft",
    });

    assert.ok(issues.some((issue) => issue.code === "description"));
    assert.ok(issues.some((issue) => issue.code === "hero_image"));
    assert.ok(issues.some((issue) => issue.code === "front_image"));
    assert.ok(issues.some((issue) => issue.code === "side_image"));
    assert.ok(issues.some((issue) => issue.code === "source"));
    assert.ok(issues.some((issue) => issue.code === "checked"));
    assert.ok(issues.some((issue) => issue.code === "import_status"));
  });

  it("allows publish when required launch fields are present", () => {
    const issues = getPublishIssues(baseReady());
    assert.equal(issues.length, 0);
  });

  it("blocks draft editorial marker anywhere in public copy", () => {
    const issues = getPublishIssues(
      baseReady({
        description: `${EDITORIAL_DRAFT_MARKER}\n\n${longDescription}`,
      }),
    );
    assert.ok(issues.some((issue) => issue.code === "editorial_draft"));

    const prosIssues = getPublishIssues(
      baseReady({
        pros: [EDITORIAL_DRAFT_MARKER, "Kompakt"],
      }),
    );
    assert.ok(prosIssues.some((issue) => issue.code === "editorial_draft"));
  });

  it("requires approved hero, front, and side gallery images", () => {
    const issues = getPublishIssues(
      baseReady({
        gallery_images: [{ image_type: "front", is_primary: true }],
      }),
    );
    assert.ok(issues.some((issue) => issue.code === "side_image"));
    assert.ok(!issues.some((issue) => issue.code === "front_image"));
    assert.ok(!issues.some((issue) => issue.code === "hero_image"));
  });

  it("accepts image_url as hero when gallery has primary missing", () => {
    const issues = getPublishIssues(
      baseReady({
        image_url: "https://example.com/hero.webp",
        gallery_images: [
          { image_type: "front", is_primary: false },
          { image_type: "side", is_primary: false },
        ],
      }),
    );
    assert.ok(!issues.some((issue) => issue.code === "hero_image"));
  });

  it("blocks short SEO descriptions", () => {
    const issues = getPublishIssues(baseReady({ description: "For kort tekst." }));
    assert.ok(issues.some((issue) => issue.code === "seo_description_short"));
  });
});

describe("launch content vs publish gates", () => {
  it("launch content can be ready before approval", () => {
    const launch = getLaunchContentIssues(
      baseReady({ import_status: "needs_review" }),
    );
    const publish = getPublishIssues(baseReady({ import_status: "needs_review" }));
    assert.equal(launch.length, 0);
    assert.ok(publish.some((issue) => issue.code === "import_status"));
  });

  it("seo helper flags missing OG image", () => {
    const seo = getSeoPublishIssues(
      baseReady({
        image_url: null,
        gallery_images: [
          { image_type: "front", is_primary: false },
          { image_type: "side", is_primary: false },
        ],
      }),
    );
    assert.ok(seo.some((issue) => issue.code === "seo_image"));
  });
});
