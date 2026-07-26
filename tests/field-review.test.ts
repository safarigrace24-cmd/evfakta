import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFieldReviewQueue,
  FIELD_REVIEW_CONFIDENCE_THRESHOLD,
  parseFieldReviewEditValue,
} from "../lib/admin/field-review";
import type { AdminCar } from "../lib/admin/types";

function car(overrides: Partial<AdminCar> = {}): AdminCar {
  return {
    id: "1",
    slug: "tesla-model-3",
    brand: "Tesla",
    brand_id: null,
    model: "Model 3",
    variant: null,
    trim_level: null,
    model_generation: null,
    year: null,
    price_nok: null,
    range_km: 500,
    battery_kwh: null,
    battery_total_kwh: 60,
    battery_usable_kwh: null,
    battery_chemistry: "NMC",
    winter_range_km: null,
    real_world_range_km: null,
    dc_charging_kw: 250,
    charge_time_10_80_minutes: null,
    charging_connector_ac: null,
    charging_connector_dc: null,
    drivetrain: null,
    image_url: null,
    description: "A draft description",
    is_published: false,
    consumption_kwh_100km: null,
    power_hp: null,
    torque_nm: null,
    acceleration_0_100: null,
    top_speed_kmh: null,
    seats: 5,
    cargo_l: null,
    towing_kg: null,
    warranty: null,
    ac_charging_kw: null,
    vehicle_type: null,
    body_style: null,
    length_mm: null,
    width_mm: null,
    height_mm: null,
    wheelbase_mm: null,
    curb_weight_kg: null,
    gross_weight_kg: null,
    frunk_l: null,
    heat_pump: null,
    v2l: null,
    v2g: null,
    apple_carplay: null,
    android_auto: null,
    head_up_display: null,
    panoramic_roof: null,
    ota_updates: null,
    pros: null,
    cons: null,
    suitable_for: null,
    source_url: "https://www.tesla.com/no_NO",
    source_name: "Tesla Norge",
    source_updated_at: null,
    data_last_checked_at: "2026-07-26T00:00:00.000Z",
    import_status: "needs_review",
    import_notes: null,
    country: null,
    last_import_job_id: null,
    field_sources: {
      range_km: {
        source_name: "Tesla Norge",
        source_url: "https://www.tesla.com/no_NO",
        imported_at: "2026-07-26T00:00:00.000Z",
        import_job_id: null,
        confidence: 0.95,
        data_last_checked_at: "2026-07-26T00:00:00.000Z",
        review_status: "pending",
      },
      battery_chemistry: {
        source_name: "Secondary",
        source_url: "https://example.com",
        imported_at: "2026-07-26T00:00:00.000Z",
        import_job_id: null,
        confidence: 0.55,
        data_last_checked_at: "2026-07-25T00:00:00.000Z",
        review_status: "pending",
      },
      dc_charging_kw: {
        source_name: "Tesla Norge",
        source_url: "https://www.tesla.com/no_NO",
        imported_at: "2026-07-26T00:00:00.000Z",
        import_job_id: null,
        confidence: 0.8,
        review_status: "pending",
      },
    },
    imported_at: null,
    range_score: null,
    charging_score: null,
    winter_score: null,
    comfort_score: null,
    space_score: null,
    value_score: null,
    reliability_score: null,
    overall_score: null,
    score_notes: null,
    score_methodology: null,
    created_at: "2026-07-26T00:00:00.000Z",
    updated_at: "2026-07-26T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildFieldReviewQueue", () => {
  it("sorts lowest confidence first and highlights below 90%", () => {
    const queue = buildFieldReviewQueue(car());
    assert.ok(queue.length >= 3);

    const chemistry = queue.find((item) => item.fieldKey === "battery_chemistry");
    const dc = queue.find((item) => item.fieldKey === "dc_charging_kw");
    const range = queue.find((item) => item.fieldKey === "range_km");

    assert.ok(chemistry);
    assert.ok(dc);
    assert.ok(range);

    const chemistryIndex = queue.findIndex((item) => item.fieldKey === "battery_chemistry");
    const dcIndex = queue.findIndex((item) => item.fieldKey === "dc_charging_kw");
    const rangeIndex = queue.findIndex((item) => item.fieldKey === "range_km");

    assert.ok(chemistryIndex < dcIndex);
    assert.ok(dcIndex < rangeIndex);

    assert.equal(chemistry!.lowConfidence, true);
    assert.equal(dc!.lowConfidence, true);
    assert.equal(range!.lowConfidence, false);
    assert.ok(FIELD_REVIEW_CONFIDENCE_THRESHOLD === 0.9);

    assert.equal(chemistry!.sourceName, "Secondary");
    assert.ok(chemistry!.lastChecked);
    assert.equal(chemistry!.displayValue, "NMC");
  });

  it("parses edited list and number values", () => {
    const list = parseFieldReviewEditValue("list", "One\nTwo");
    assert.equal(list.ok, true);
    if (list.ok) assert.deepEqual(list.value, ["One", "Two"]);

    const number = parseFieldReviewEditValue("number", "12,5");
    assert.equal(number.ok, true);
    if (number.ok) assert.equal(number.value, 12.5);
  });
});
