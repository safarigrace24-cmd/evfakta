import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateChargingCost,
  chargingCostInputValue,
  parseChargingCostSearchParams,
  validateChargingCostInput,
} from "../lib/calculator/charging-cost";

describe("charging cost calculator", () => {
  it("calculates energy added, grid draw and cost with loss", () => {
    const result = calculateChargingCost({
      batteryCapacityKwh: 100,
      startPercent: 20,
      targetPercent: 80,
      pricePerKwh: 2,
      lossPercent: 10,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.energyAddedKwh, 60);
    assert.equal(result.energyFromGridKwh, 66.67);
    assert.equal(result.chargeCostNok, 133.33);
  });

  it("calculates monthly and per-100km estimates", () => {
    const result = calculateChargingCost({
      batteryCapacityKwh: 75,
      startPercent: 10,
      targetPercent: 90,
      pricePerKwh: 1.5,
      lossPercent: 10,
      monthlyDistanceKm: 1000,
      consumptionKwhPer100Km: 18,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.monthlyEnergyKwh, 180);
    assert.equal(result.monthlyCostNok, 300);
    assert.equal(result.costPer100KmNok, 30);
  });

  it("rejects invalid and boundary values", () => {
    assert.ok(validateChargingCostInput({
      batteryCapacityKwh: 0,
      startPercent: 20,
      targetPercent: 80,
      pricePerKwh: 1,
      lossPercent: 10,
    }));
    assert.ok(
      validateChargingCostInput({
        batteryCapacityKwh: 50,
        startPercent: 80,
        targetPercent: 20,
        pricePerKwh: 1,
        lossPercent: 10,
      }),
    );
    const zeroLoss = calculateChargingCost({
      batteryCapacityKwh: 50,
      startPercent: 0,
      targetPercent: 100,
      pricePerKwh: 1,
      lossPercent: 0,
    });
    assert.equal(zeroLoss.ok, true);
    if (zeroLoss.ok) {
      assert.equal(zeroLoss.energyAddedKwh, 50);
      assert.equal(zeroLoss.energyFromGridKwh, 50);
    }
  });

  it("keeps controlled input values as strings (never null/undefined/NaN)", () => {
    assert.equal(chargingCostInputValue(75), "75");
    assert.equal(chargingCostInputValue(0), "0");
    assert.equal(chargingCostInputValue(null), "");
    assert.equal(chargingCostInputValue(undefined), "");
    assert.equal(chargingCostInputValue(Number.NaN), "");
    assert.equal(chargingCostInputValue(Number.POSITIVE_INFINITY), "");
  });

  it("parses URL params without injecting undefined keys", () => {
    const empty = parseChargingCostSearchParams(new URLSearchParams());
    assert.deepEqual(empty, {});

    const partial = parseChargingCostSearchParams(
      new URLSearchParams("kwh=82&start=10"),
    );
    assert.deepEqual(partial, {
      batteryCapacityKwh: 82,
      startPercent: 10,
    });
    assert.equal(Object.hasOwn(partial, "targetPercent"), false);
    assert.equal(Object.hasOwn(partial, "monthlyDistanceKm"), false);

    const base = {
      batteryCapacityKwh: 75,
      startPercent: 20,
      targetPercent: 80,
      pricePerKwh: 1.5,
      lossPercent: 10,
      monthlyDistanceKm: 1000,
      consumptionKwhPer100Km: 18,
    };
    const merged = { ...base, ...partial };
    assert.equal(merged.batteryCapacityKwh, 82);
    assert.equal(merged.startPercent, 10);
    assert.equal(merged.targetPercent, 80);
    assert.equal(merged.monthlyDistanceKm, 1000);
    for (const value of Object.values(merged)) {
      assert.notEqual(value, undefined);
      assert.equal(Number.isFinite(value as number), true);
    }
  });

  it("ignores blank or non-finite URL values", () => {
    const parsed = parseChargingCostSearchParams(
      new URLSearchParams("kwh=&start=abc&maal=80"),
    );
    assert.deepEqual(parsed, { targetPercent: 80 });
  });
});
