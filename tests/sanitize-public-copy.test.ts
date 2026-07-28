import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EDITORIAL_DRAFT_MARKER } from "../lib/admin/editorial-assist-core";
import {
  hasRenderablePublicCopy,
  sanitizePublicCopy,
  sanitizePublicList,
} from "../lib/public/sanitize-public-copy";

describe("sanitizePublicCopy", () => {
  it("strips draft markers from public strings", () => {
    const raw = `${EDITORIAL_DRAFT_MARKER}\n\nGod plass i bagasjerommet.`;
    assert.equal(sanitizePublicCopy(raw), "God plass i bagasjerommet.");
  });

  it("returns empty for draft-only copy", () => {
    assert.equal(sanitizePublicCopy(EDITORIAL_DRAFT_MARKER), "");
    assert.equal(hasRenderablePublicCopy(EDITORIAL_DRAFT_MARKER), false);
  });

  it("filters draft-only list items", () => {
    assert.deepEqual(
      sanitizePublicList([EDITORIAL_DRAFT_MARKER, "Lang rekkevidde", ""]),
      ["Lang rekkevidde"],
    );
  });
});
