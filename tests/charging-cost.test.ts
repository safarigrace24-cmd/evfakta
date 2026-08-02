import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateChargingCost,
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
});
