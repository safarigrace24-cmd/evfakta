import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeEditorialCompletion } from "../lib/admin/editorial-completion";
import type { CarImageRow } from "../lib/admin/car-image-types";
import type { AdminCar } from "../lib/admin/types";

function baseCar(overrides: Partial<AdminCar> = {}): AdminCar {
  return {
    id: "car-1",
    slug: "tesla-model-3",
    brand: "Tesla",
    brand_id: null,
    model: "Model 3",
    variant: null,
    trim_level: null,
    model_generation: null,
    year: 2025,
    price_nok: null,
    range_km: 500,
    battery_kwh: 60,
    battery_total_kwh: 60,
    battery_usable_kwh: 57,
    battery_chemistry: null,
    winter_range_km: null,
    real_world_range_km: null,
    dc_charging_kw: 250,
    charge_time_10_80_minutes: 27,
    charging_connector_ac: null,
    charging_connector_dc: null,
    drivetrain: "RWD",
    image_url: "https://example.com/front.webp",
    description:
      "Tesla Model 3 er en populær elbil med dokumenterte norske spesifikasjoner for rekkevidde og lading.",
    is_published: false,
    consumption_kwh_100km: 14,
    power_hp: 280,
    torque_nm: null,
    acceleration_0_100: 6.1,
    top_speed_kmh: null,
    seats: 5,
    cargo_l: 425,
    towing_kg: null,
    warranty: null,
    ac_charging_kw: 11,
    vehicle_type: null,
    body_style: null,
    length_mm: 4720,
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
    pros: ["Range"],
    cons: null,
    suitable_for: null,
    source_url: "https://www.tesla.com/no_NO",
    source_name: "Tesla Norge",
    source_updated_at: null,
    data_last_checked_at: "2026-07-26T00:00:00.000Z",
    import_status: "approved",
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

function image(type: CarImageRow["image_type"], id: string): CarImageRow {
  return {
    id,
    car_id: "car-1",
    image_url: `https://example.com/${type}.webp`,
    storage_path: `${type}.webp`,
    image_type: type,
    alt_text: null,
    sort_order: 0,
    is_primary: type === "front",
    created_at: "2026-07-26T00:00:00.000Z",
  };
}

describe("computeEditorialCompletion", () => {
  it("reports percent and missing editorial items without inventing data", () => {
    const completion = computeEditorialCompletion({
      car: baseCar(),
      images: [image("front", "1")],
      variants: [],
    });

    assert.equal(completion.title, "Tesla Model 3");
    assert.ok(completion.percent < 100);
    assert.ok(completion.missing.includes("Interior photo"));
    assert.ok(completion.missing.includes("Real-world range"));
    assert.ok(completion.missing.includes("Tow capacity"));
    assert.ok(completion.missing.includes("Battery chemistry"));
    assert.ok(completion.sections.some((section) => section.title === "Identity"));
  });

  it("allows publish when required fields are present even if checklist incomplete", () => {
    const completion = computeEditorialCompletion({
      car: baseCar(),
      images: [image("front", "1"), image("side", "2")],
      variants: [],
    });

    assert.equal(completion.canPublish, true);
    assert.equal(completion.publishIssues.length, 0);
    assert.ok(completion.missing.length > 0);
  });

  it("blocks publish only for required publish fields", () => {
    const completion = computeEditorialCompletion({
      car: baseCar({
        description: null,
        import_status: "draft",
        data_last_checked_at: null,
        source_name: null,
        source_url: null,
        image_url: null,
      }),
      images: [],
      variants: [],
    });

    assert.equal(completion.canPublish, false);
    assert.ok(completion.publishIssues.some((issue) => issue.code === "description"));
    assert.ok(completion.publishIssues.some((issue) => issue.code === "import_status"));
  });
});
