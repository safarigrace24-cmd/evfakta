import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DOWNLOAD_FAILED_MARKER,
  NO_OFFICIAL_IMAGE_MESSAGE,
  SUPERSEDED_MARKER,
  filterDefaultImageReviewCandidates,
  hasDownloadFailed,
  hasHttp410Failure,
  imageCandidateRoleKey,
  isPermanentlyFailedImageCandidate,
  isUsableImageReviewCandidate,
  publicUrlForCarImagePath,
  resolveImageReviewPreviewUrl,
  withDownloadFailedNotes,
  withReplacementExhaustedNotes,
  withSupersededNotes,
} from "../lib/admin/image-review-preview";
import { extractOfficialImageUrlsFromHtml } from "../lib/admin/image-role-replacement-sources";

describe("image review preview helpers", () => {
  it("builds Storage public URLs only", () => {
    const prev = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    try {
      const url = publicUrlForCarImagePath("volvo/ex30/review-abc.webp");
      assert.match(url, /\/storage\/v1\/object\/public\/car-images\/volvo\/ex30\/review-abc\.webp$/);
      assert.equal(
        resolveImageReviewPreviewUrl({
          storage_path: "volkswagen/id-3/review-xyz.webp",
        }),
        "https://proj.supabase.co/storage/v1/object/public/car-images/volkswagen/id-3/review-xyz.webp",
      );
      assert.equal(resolveImageReviewPreviewUrl({ storage_path: null }), "");
      assert.equal(resolveImageReviewPreviewUrl({ storage_path: "  " }), "");
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = prev;
    }
  });

  it("marks and detects Download Failed notes without dropping prior notes", () => {
    assert.equal(hasDownloadFailed(null), false);
    assert.equal(hasDownloadFailed("ok"), false);
    const marked = withDownloadFailedNotes("resolution: 1200x800");
    assert.ok(marked.includes(DOWNLOAD_FAILED_MARKER));
    assert.ok(marked.includes("resolution: 1200x800"));
    assert.equal(hasDownloadFailed(marked), true);
    assert.equal(withDownloadFailedNotes(marked), marked);
  });
});

describe("failed candidate lifecycle", () => {
  it("detects permanent failures including HTTP 410 and no local copy", () => {
    assert.equal(
      isPermanentlyFailedImageCandidate({
        status: "pending",
        storage_path: null,
        notes: "Download Failed | download-error:HTTP 410",
      }),
      true,
    );
    assert.equal(hasHttp410Failure("download-error:HTTP 410"), true);
    assert.equal(
      isPermanentlyFailedImageCandidate({
        status: "pending",
        storage_path: "volvo/ex30/review.webp",
        notes: null,
      }),
      false,
    );
  });

  it("hides failed/superseded candidates from default Image Review list", () => {
    const failed = {
      id: "1",
      status: "pending",
      storage_path: null,
      notes: "Download Failed | No local review copy",
    };
    const superseded = {
      id: "2",
      status: "pending",
      storage_path: null,
      notes: `Download Failed | ${SUPERSEDED_MARKER}`,
    };
    const usable = {
      id: "3",
      status: "pending",
      storage_path: "volvo/ex30/review-ok.webp",
      notes: "review-copy:stored",
    };
    assert.equal(isUsableImageReviewCandidate(failed), false);
    assert.equal(isUsableImageReviewCandidate(superseded), false);
    assert.equal(isUsableImageReviewCandidate(usable), true);
    assert.deepEqual(filterDefaultImageReviewCandidates([failed, superseded, usable]), [
      usable,
    ]);
    assert.equal(NO_OFFICIAL_IMAGE_MESSAGE, "No official image available yet.");
  });

  it("maps hero primary to replacement role key", () => {
    assert.equal(
      imageCandidateRoleKey({ image_type: "front", is_primary_candidate: true }),
      "hero",
    );
    assert.equal(
      imageCandidateRoleKey({ image_type: "side", is_primary_candidate: false }),
      "side",
    );
  });

  it("marks superseded and exhausted notes without wiping prior history", () => {
    const base = "Download Failed | download-error:HTTP 410";
    const superseded = withSupersededNotes(base, "replaced-by:abc");
    assert.ok(superseded.includes(SUPERSEDED_MARKER));
    assert.ok(superseded.includes("Download Failed"));
    assert.ok(superseded.includes("replaced-by:abc"));
    const exhausted = withReplacementExhaustedNotes(base);
    assert.ok(exhausted.includes("replacement-exhausted"));
  });

  it("extracts official manufacturer image URLs from HTML only", () => {
    const html = `
      <meta property="og:image" content="https://www.volvocars.com/images/cs/v3/assets/blt123/EX30_front.jpg" />
      <img src="https://images.google.com/imgres?q=ex30" />
      <img src="https://www.pinterest.com/pin/123" />
      <img srcset="https://uploads.vw-mms.de/system/production/images/id3_side.jpg 2x" />
    `;
    const urls = extractOfficialImageUrlsFromHtml(
      html,
      "https://www.volvocars.com/no/cars/ex30-electric/",
    );
    assert.ok(urls.some((url) => url.includes("volvocars.com")));
    assert.ok(urls.some((url) => url.includes("vw-mms.de")));
    assert.ok(!urls.some((url) => /google|pinterest/i.test(url)));
  });
});
