import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPublishIssues } from "../lib/admin/publish-readiness";

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
    assert.ok(issues.some((issue) => issue.code === "image"));
    assert.ok(issues.some((issue) => issue.code === "source"));
    assert.ok(issues.some((issue) => issue.code === "checked"));
    assert.ok(issues.some((issue) => issue.code === "import_status"));
  });

  it("allows publish when required fields are present", () => {
    const issues = getPublishIssues({
      brand: "Tesla",
      model: "Model Y",
      slug: "tesla-model-y",
      description: "Test",
      image_url: "https://example.com/y.webp",
      source_name: "Tesla Norge",
      source_url: "https://www.tesla.com/no_NO",
      data_last_checked_at: "2026-07-25T00:00:00.000Z",
      import_status: "approved",
    });

    assert.equal(issues.length, 0);
  });

  it("accepts gallery image instead of image_url", () => {
    const issues = getPublishIssues({
      brand: "Tesla",
      model: "Model Y",
      slug: "tesla-model-y",
      description: "Test",
      image_url: null,
      source_name: "Tesla Norge",
      source_url: null,
      data_last_checked_at: "2026-07-25T00:00:00.000Z",
      import_status: "approved",
      has_gallery_image: true,
    });

    assert.equal(issues.length, 0);
  });
});
