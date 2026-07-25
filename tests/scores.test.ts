import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasAnyScore, type EvfaktaScores } from "../lib/scores/types";

describe("hasAnyScore", () => {
  it("returns false when all scores are empty", () => {
    const scores: EvfaktaScores = {
      rangeScore: null,
      chargingScore: null,
      winterScore: null,
      comfortScore: null,
      spaceScore: null,
      valueScore: null,
      reliabilityScore: null,
      overallScore: null,
      scoreNotes: null,
      scoreMethodology: null,
    };
    assert.equal(hasAnyScore(scores), false);
  });

  it("returns true when overall score is set", () => {
    const scores: EvfaktaScores = {
      rangeScore: null,
      chargingScore: null,
      winterScore: null,
      comfortScore: null,
      spaceScore: null,
      valueScore: null,
      reliabilityScore: null,
      overallScore: 7.5,
      scoreNotes: null,
      scoreMethodology: null,
    };
    assert.equal(hasAnyScore(scores), true);
  });
});
