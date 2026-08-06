import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AI_AWAITING_ORIGINAL_URL,
  AI_PUBLIC_LABEL,
  AI_SOURCE_NAME,
  AI_WARNING,
  AI_VISUAL_CHECKLIST_KEYS,
  AI_ILLUSTRATIVE_BADGE,
  buildAiCandidateNotes,
  buildAiIllustrationPrompt,
  buildAiVisualQualityReview,
  canAiIllustrationAppearPublicly,
  canApproveAiAfterVisualReview,
  canSelectAiHero,
  isAiAwaitingGeneration,
  isAiIllustrationCandidate,
  isVisibleAiIllustrationCandidate,
  parseAiGenerationPrompt,
  shouldSkipRemoteHydration,
  withAiVisualVerificationNotes,
} from "../lib/admin/ai-image-candidates";
import {
  buildImageReviewCard,
  canApproveImageCandidate,
  computeImageReviewReadiness,
} from "../lib/admin/image-review";
import type { ResearchImageCandidate } from "../lib/admin/research/types";
import type { CarImageRow } from "../lib/admin/car-image-types";

function candidate(
  overrides: Partial<ResearchImageCandidate> = {},
): ResearchImageCandidate {
  return {
    id: "ai-1",
    item_id: "item-1",
    created_at: "2026-07-31T00:00:00.000Z",
    original_url: AI_AWAITING_ORIGINAL_URL,
    source_name: AI_SOURCE_NAME,
    source_url: null,
    license_note: AI_PUBLIC_LABEL,
    usage_terms: AI_WARNING,
    alt_text: "Test — AI-generated illustration, not official manufacturer photography",
    image_type: "front",
    is_primary_candidate: false,
    status: "pending",
    applied_image_id: null,
    storage_path: null,
    notes: buildAiCandidateNotes({
      brand: "Audi",
      model: "Q8 e-tron",
      usageType: "front_three_quarter",
      prompt: "studio illustration",
      awaitingGeneration: true,
    }),
    ...overrides,
  };
}

describe("AI image candidate markers", () => {
  it("detects AI candidates and awaiting generation", () => {
    const awaiting = candidate();
    assert.equal(isAiIllustrationCandidate(awaiting), true);
    assert.equal(isAiAwaitingGeneration(awaiting), true);
    assert.equal(isVisibleAiIllustrationCandidate(awaiting), true);
    assert.equal(shouldSkipRemoteHydration(awaiting), true);
    assert.equal(canApproveImageCandidate(awaiting), false);
  });

  it("builds prompts that forbid fake official claims", () => {
    const prompt = buildAiIllustrationPrompt({
      brand: "Kia",
      model: "EV4",
      usageType: "side_illustration",
    });
    assert.match(prompt, /illustrative interpretation/i);
    assert.match(prompt, /Do not add fake manufacturer logos/i);
    assert.match(prompt, /Do not invent unsupported trims/i);
    assert.doesNotMatch(prompt, /official manufacturer photography/i);
  });

  it("parses generation prompt from notes", () => {
    const notes = buildAiCandidateNotes({
      brand: "Kia",
      model: "EV5",
      usageType: "hero_illustration",
      prompt: "neutral studio side view",
      awaitingGeneration: true,
    });
    assert.equal(parseAiGenerationPrompt(notes), "neutral studio side view");
    assert.match(notes, /source_category:ai_generated/);
    assert.match(notes, /ai-status:awaiting-generation/);
  });

  it("allows approve only after Storage copy exists", () => {
    const ready = candidate({
      storage_path: "brand/model/review-ai.webp",
      original_url: "https://example.supabase.co/storage/v1/object/public/car-images/x.webp",
      notes: buildAiCandidateNotes({
        brand: "Kia",
        model: "EV5",
        usageType: "side_illustration",
        prompt: "side",
        awaitingGeneration: false,
        generatedAt: "2026-07-31T12:00:00.000Z",
      }),
    });
    assert.equal(isAiAwaitingGeneration(ready), false);
    assert.equal(canApproveImageCandidate(ready), true);
  });

  it("never counts AI toward Image Ready", () => {
    const aiFront = candidate({
      id: "ai-front",
      status: "applied",
      is_primary_candidate: true,
      applied_image_id: "gal-ai",
      image_type: "front",
      storage_path: "x.webp",
      notes: buildAiCandidateNotes({
        brand: "Audi",
        model: "Q8",
        usageType: "hero_illustration",
        prompt: "hero",
        awaitingGeneration: false,
        generatedAt: "2026-07-31T12:00:00.000Z",
      }),
    });
    const aiSide = candidate({
      id: "ai-side",
      status: "applied",
      is_primary_candidate: false,
      applied_image_id: "gal-side",
      image_type: "side",
      storage_path: "y.webp",
      notes: buildAiCandidateNotes({
        brand: "Audi",
        model: "Q8",
        usageType: "side_illustration",
        prompt: "side",
        awaitingGeneration: false,
        generatedAt: "2026-07-31T12:00:00.000Z",
      }),
    });
    const gallery: CarImageRow[] = [
      {
        id: "gal-ai",
        car_id: "car-1",
        image_url: "/ai.webp",
        storage_path: "ai.webp",
        image_type: "front",
        alt_text: "AI",
        sort_order: 0,
        is_primary: true,
        created_at: "2026-07-31T00:00:00.000Z",
      },
      {
        id: "gal-side",
        car_id: "car-1",
        image_url: "/ai-side.webp",
        storage_path: "ai-side.webp",
        image_type: "side",
        alt_text: "AI side",
        sort_order: 1,
        is_primary: false,
        created_at: "2026-07-31T00:00:00.000Z",
      },
    ];
    const readiness = computeImageReviewReadiness({
      gallery,
      candidates: [aiFront, aiSide],
      carImageUrl: "/ai.webp",
    });
    assert.equal(readiness.imagesReady, false);
    assert.equal(readiness.hasApprovedHero, false);
    assert.equal(readiness.hasApprovedFront, false);
    assert.equal(readiness.hasApprovedSide, false);
  });

  it("labels AI review cards clearly", () => {
    const card = buildImageReviewCard(candidate(), [candidate()]);
    assert.equal(card.isAiIllustration, true);
    assert.equal(card.aiAwaitingGeneration, true);
    assert.equal(card.aiPublicLabel, AI_PUBLIC_LABEL);
    assert.equal(card.aiQualityReview?.illustrativeBadge, AI_ILLUSTRATIVE_BADGE);
    assert.equal(card.aiQualityReview?.notOfficialBadge, AI_WARNING);
    assert.equal(AI_ILLUSTRATIVE_BADGE, "AI-generert illustrasjon");
    assert.equal(AI_WARNING, "Ikke offisielt produsentbilde");
    assert.ok(card.warnings.includes("AI-generated illustration"));
    assert.ok(card.warnings.includes("Not official manufacturer photography"));
    assert.ok(card.warnings.includes("Awaiting Generation"));
    assert.ok(!card.warnings.includes("Broken URL"));
  });
});

describe("AI visual quality review", () => {
  it("blocks approve until Visually verified + full checklist", () => {
    assert.equal(
      canApproveAiAfterVisualReview({
        confirmVisuallyVerified: false,
        checklistKeys: [...AI_VISUAL_CHECKLIST_KEYS],
      }),
      false,
    );
    assert.equal(
      canApproveAiAfterVisualReview({
        confirmVisuallyVerified: true,
        checklistKeys: ["vehicle_identity"],
      }),
      false,
    );
    assert.equal(
      canApproveAiAfterVisualReview({
        confirmVisuallyVerified: true,
        checklistKeys: [...AI_VISUAL_CHECKLIST_KEYS],
      }),
      true,
    );
  });

  it("blocks Hero until approved and visually verified", () => {
    const pending = candidate({
      storage_path: "x.webp",
      notes: buildAiCandidateNotes({
        brand: "Kia",
        model: "EV4",
        usageType: "front_three_quarter",
        prompt: "front",
        awaitingGeneration: false,
        generatedAt: "2026-07-31T12:00:00.000Z",
      }),
    });
    assert.equal(canSelectAiHero(pending), false);

    const verifiedNotes = withAiVisualVerificationNotes(
      pending.notes,
      [...AI_VISUAL_CHECKLIST_KEYS],
    );
    assert.equal(
      canSelectAiHero({ status: "approved", notes: verifiedNotes }),
      true,
    );
    assert.equal(
      canSelectAiHero({ status: "pending", notes: verifiedNotes }),
      false,
    );
  });

  it("public gate requires approved + verified + no official", () => {
    const notes = withAiVisualVerificationNotes(
      buildAiCandidateNotes({
        brand: "Kia",
        model: "EV4",
        usageType: "side_illustration",
        prompt: "side",
        awaitingGeneration: false,
        generatedAt: "2026-07-31T12:00:00.000Z",
      }),
      [...AI_VISUAL_CHECKLIST_KEYS],
    );
    assert.equal(
      canAiIllustrationAppearPublicly({
        image: { status: "applied", notes },
        officialImageAvailable: false,
      }),
      true,
    );
    assert.equal(
      canAiIllustrationAppearPublicly({
        image: { status: "applied", notes },
        officialImageAvailable: true,
      }),
      false,
    );
  });

  it("review panel recommends checklist or official preference", () => {
    const generated = candidate({
      storage_path: "x.webp",
      original_url: "https://example.supabase.co/storage/v1/object/public/car-images/x.webp",
      notes: buildAiCandidateNotes({
        brand: "Audi",
        model: "Q8",
        usageType: "front_three_quarter",
        prompt: "front",
        awaitingGeneration: false,
        generatedAt: "2026-07-31T12:00:00.000Z",
      }),
    });
    const review = buildAiVisualQualityReview({
      image: generated,
      officialImageAvailable: false,
    });
    assert.equal(review.confidence, "Medium");
    assert.equal(review.visualReview, "Not visually verified");
    assert.equal(review.recommendedAction, "Complete visual quality checklist");

    const withOfficial = buildAiVisualQualityReview({
      image: generated,
      officialImageAvailable: true,
    });
    assert.match(
      withOfficial.recommendedAction,
      /Prefer official manufacturer image/,
    );
  });
});
