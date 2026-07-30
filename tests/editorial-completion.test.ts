import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LAUNCH_COMPLETION_THRESHOLD,
  computeEditorialCompletion,
} from "../lib/admin/editorial-completion";
import type { CarImageRow } from "../lib/admin/car-image-types";
import type { AdminCar } from "../lib/admin/types";
import type { AdminCarVariant } from "../lib/admin/variant-types";

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
    battery_chemistry: "NMC",
    winter_range_km: null,
    real_world_range_km: null,
    dc_charging_kw: 250,
    charge_time_10_80_minutes: 27,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS",
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
    towing_kg: 1000,
    warranty: null,
    ac_charging_kw: 11,
    vehicle_type: "Personbil",
    body_style: "Sedan",
    length_mm: 4720,
    width_mm: 1850,
    height_mm: 1440,
    wheelbase_mm: 2875,
    curb_weight_kg: null,
    gross_weight_kg: null,
    frunk_l: 88,
    heat_pump: true,
    v2l: null,
    v2g: null,
    apple_carplay: null,
    android_auto: null,
    head_up_display: null,
    panoramic_roof: null,
    ota_updates: null,
    pros: ["Range", "Charging"],
    cons: ["Price"],
    suitable_for: ["Pendlerne"],
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
    score_notes: `## Hvem bilen passer for
Pendling og daglig bruk.

## Vinter
Ingen offisiell vinterrekkevidde lagret — ikke gjettet. WLTP er laboratoriemål.

## Lading
AC/DC dokumentert.

## Langtur
Planlegg ladestopp.

## FAQ
**Har Model 3 varme pumpe?** Ja i denne katalogen.
**Hva er reell rekkevidde?** Ikke testet av EVFAKTA.`,
    score_methodology: null,
    created_at: "2026-07-26T00:00:00.000Z",
    updated_at: "2026-07-26T00:00:00.000Z",
    ...overrides,
  };
}

function image(
  type: CarImageRow["image_type"],
  id: string,
  isPrimary = type === "front",
): CarImageRow {
  return {
    id,
    car_id: "car-1",
    image_url: `https://example.com/${type}.webp`,
    storage_path: `${type}.webp`,
    image_type: type,
    alt_text: null,
    sort_order: 0,
    is_primary: isPrimary,
    created_at: "2026-07-26T00:00:00.000Z",
  };
}

function variant(overrides: Partial<AdminCarVariant> = {}): AdminCarVariant {
  return {
    id: "var-1",
    car_id: "car-1",
    name: "RWD",
    slug: "rwd",
    trim_level: null,
    model_year: 2025,
    price_nok: null,
    battery_total_kwh: 60,
    battery_usable_kwh: 57,
    range_km: 500,
    winter_range_km: null,
    real_world_range_km: null,
    consumption_kwh_100km: 14,
    ac_charging_kw: 11,
    dc_charging_kw: 250,
    charge_time_10_80_minutes: 27,
    drivetrain: "RWD",
    power_hp: 280,
    torque_nm: null,
    acceleration_0_100: 6.1,
    top_speed_kmh: null,
    towing_kg: 1000,
    curb_weight_kg: null,
    is_default: true,
    is_active: true,
    sort_order: 0,
    source_name: "Tesla Norge",
    source_url: "https://www.tesla.com/no_NO",
    data_last_checked_at: "2026-07-26T00:00:00.000Z",
    import_status: "approved",
    import_notes: null,
    created_at: "2026-07-26T00:00:00.000Z",
    updated_at: "2026-07-26T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeEditorialCompletion", () => {
  it("reports percent and missing editorial items without inventing data", () => {
    const completion = computeEditorialCompletion({
      car: baseCar({
        score_notes: null,
        heat_pump: null,
        battery_chemistry: null,
        towing_kg: null,
      }),
      images: [image("front", "1")],
      variants: [],
    });

    assert.equal(completion.title, "Tesla Model 3");
    assert.equal(completion.launchCompletionThreshold, LAUNCH_COMPLETION_THRESHOLD);
    assert.ok(completion.percent < 100);
    assert.ok(completion.missing.includes("Interior (when available)"));
    assert.ok(completion.missing.includes("Side"));
    assert.ok(completion.sections.some((section) => section.title === "Identity"));
  });

  it("counts variant-level specs when car-level fields are empty", () => {
    const completion = computeEditorialCompletion({
      car: baseCar({
        range_km: null,
        battery_usable_kwh: null,
        battery_total_kwh: null,
        battery_kwh: null,
        consumption_kwh_100km: null,
        dc_charging_kw: null,
        ac_charging_kw: null,
        power_hp: null,
        drivetrain: null,
      }),
      images: [
        image("front", "1", true),
        image("side", "2", false),
        image("rear", "3", false),
        image("interior", "4", false),
      ],
      variants: [variant()],
    });

    assert.ok(completion.percent >= LAUNCH_COMPLETION_THRESHOLD);
    assert.equal(completion.meetsCompletionThreshold, true);
    assert.ok(!completion.missing.includes("Battery"));
    assert.ok(!completion.missing.includes("Range (WLTP)"));
    assert.ok(!completion.missing.includes("Variants"));
  });

  it("blocks publish when completion is below 95% even if hard gates pass", () => {
    const completion = computeEditorialCompletion({
      car: baseCar({
        score_notes: null,
        heat_pump: null,
        battery_chemistry: null,
        pros: null,
        cons: null,
        suitable_for: null,
        year: null,
        body_style: null,
      }),
      images: [image("front", "1"), image("side", "2")],
      variants: [],
    });

    assert.ok(completion.percent < LAUNCH_COMPLETION_THRESHOLD);
    assert.equal(completion.meetsCompletionThreshold, false);
    assert.equal(completion.canPublish, false);
    assert.equal(completion.canLaunchReady, false);
    assert.ok(
      completion.publishIssues.some(
        (issue) => issue.code === "completion_below_threshold",
      ),
    );
  });

  it("allows publish when checklist reaches 95% and hard gates pass", () => {
    const completion = computeEditorialCompletion({
      car: baseCar(),
      images: [
        image("front", "1", true),
        image("side", "2", false),
        image("rear", "3", false),
        image("interior", "4", false),
      ],
      variants: [variant()],
    });

    assert.ok(completion.percent >= LAUNCH_COMPLETION_THRESHOLD);
    assert.equal(completion.canPublish, true);
    assert.equal(completion.canLaunchReady, true);
    assert.equal(completion.publishIssues.length, 0);
  });

  it("blocks publish only for required publish fields when description missing", () => {
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
