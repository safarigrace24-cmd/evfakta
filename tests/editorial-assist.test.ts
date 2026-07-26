import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EDITORIAL_DRAFT_MARKER,
  generateEditorialDrafts,
  isEmptyCarValue,
  shouldFillField,
} from "../lib/admin/editorial-assist-core";
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
    battery_kwh: 60,
    battery_total_kwh: null,
    battery_usable_kwh: null,
    battery_chemistry: null,
    winter_range_km: null,
    real_world_range_km: null,
    dc_charging_kw: 250,
    charge_time_10_80_minutes: null,
    charging_connector_ac: null,
    charging_connector_dc: null,
    drivetrain: "RWD",
    image_url: null,
    description: null,
    is_published: false,
    consumption_kwh_100km: null,
    power_hp: null,
    torque_nm: null,
    acceleration_0_100: null,
    top_speed_kmh: null,
    seats: 5,
    cargo_l: 425,
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
    source_url: null,
    source_name: null,
    source_updated_at: null,
    data_last_checked_at: null,
    import_status: "draft",
    import_notes: null,
    country: null,
    last_import_job_id: null,
    field_sources: null,
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

describe("editorial assist fill rules", () => {
  it("never fills when a value already exists", () => {
    assert.equal(
      shouldFillField({
        fieldKey: "range_km",
        currentValue: 500,
        proposedValue: 480,
        hasConflict: false,
      }),
      "skip_existing",
    );
  });

  it("fills only empty fillable fields", () => {
    assert.equal(
      shouldFillField({
        fieldKey: "towing_kg",
        currentValue: null,
        proposedValue: 1000,
        hasConflict: false,
      }),
      "fill",
    );
  });

  it("does not auto-choose conflicts", () => {
    assert.equal(
      shouldFillField({
        fieldKey: "battery_usable_kwh",
        currentValue: null,
        proposedValue: 75,
        hasConflict: true,
      }),
      "skip_conflict",
    );
  });

  it("keeps null when no proposed value", () => {
    assert.equal(
      shouldFillField({
        fieldKey: "battery_chemistry",
        currentValue: null,
        proposedValue: null,
        hasConflict: false,
      }),
      "skip_empty",
    );
  });
});

describe("editorial drafts", () => {
  it("marks generated editorial text as draft requiring review", () => {
    const drafts = generateEditorialDrafts(car());
    assert.ok(drafts.description.startsWith(EDITORIAL_DRAFT_MARKER));
    assert.equal(drafts.pros[0], EDITORIAL_DRAFT_MARKER);
    assert.equal(drafts.cons[0], EDITORIAL_DRAFT_MARKER);
    assert.equal(drafts.suitable_for[0], EDITORIAL_DRAFT_MARKER);
    assert.ok(drafts.description.includes("500 km"));
    assert.ok(!drafts.description.includes("9999"));
  });

  it("treats empty arrays and blank strings as empty", () => {
    assert.equal(isEmptyCarValue(null), true);
    assert.equal(isEmptyCarValue(""), true);
    assert.equal(isEmptyCarValue(["", "  "]), true);
    assert.equal(isEmptyCarValue(["Range"]), false);
    assert.equal(isEmptyCarValue(0), false);
  });
});
