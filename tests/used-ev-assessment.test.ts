import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessUsedEvDocumentation,
  defaultUsedEvAssessmentInput,
  USED_EV_CHECKLIST_ITEMS,
} from "../lib/bruktbil/assessment";

describe("used EV assessment", () => {
  it("handles missing inputs without diagnosing battery health", () => {
    const result = assessUsedEvDocumentation(defaultUsedEvAssessmentInput());
    assert.equal(result.riskLevel, "high");
    assert.match(result.riskLabel, /høy/i);
    const joined = result.batteryNotes.join(" ");
    assert.match(joined, /kan ikke bekrefte/i);
    assert.doesNotMatch(joined, /batteriet er godt/i);
    assert.doesNotMatch(joined, /batteriet er dårlig/i);
  });

  it("scores lower documentation risk when evidence is provided", () => {
    const input = defaultUsedEvAssessmentInput();
    input.year = 2022;
    input.mileageKm = 25_000;
    input.hasBatteryTestDocument = true;
    input.reportedSohPercent = 92;
    input.remainingBatteryWarrantyYears = 4;
    input.hasServiceHistory = true;
    input.hasDamageHistoryKnown = true;
    input.hasChargingHistoryKnown = true;
    for (const item of USED_EV_CHECKLIST_ITEMS) {
      input.checklist[item.key] = true;
    }
    const result = assessUsedEvDocumentation(input, 2026);
    assert.equal(result.riskLevel, "low");
    assert.match(result.riskLabel, /lav/i);
    assert.equal(result.checkedCount, USED_EV_CHECKLIST_ITEMS.length);
  });

  it("generates seller questions for gaps", () => {
    const input = defaultUsedEvAssessmentInput();
    input.hasBatteryTestDocument = false;
    const result = assessUsedEvDocumentation(input);
    assert.ok(
      result.sellerQuestions.some((q) => /batteri/i.test(q)),
    );
  });
});
