import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCarsFromCsv } from "../lib/admin/import/parse-csv";
import { parseCarsFromJson } from "../lib/admin/import/parse-json";
import { buildImportPreview } from "../lib/admin/import/preview";
import type { AdminCar } from "../lib/admin/types";

const csvHeader =
  "slug,brand,model,year,price_nok,range_km,battery_kwh,dc_charging_kw,drivetrain,image_url,description,is_published,country,import_status";

function adminCar(partial: Partial<AdminCar> & Pick<AdminCar, "id" | "slug" | "brand" | "model">): AdminCar {
  return {
    brand_id: null,
    variant: null,
    trim_level: null,
    model_generation: null,
    year: null,
    price_nok: null,
    range_km: null,
    battery_kwh: null,
    battery_total_kwh: null,
    battery_usable_kwh: null,
    battery_chemistry: null,
    winter_range_km: null,
    real_world_range_km: null,
    dc_charging_kw: null,
    charge_time_10_80_minutes: null,
    charging_connector_ac: null,
    charging_connector_dc: null,
    drivetrain: null,
    image_url: null,
    description: null,
    is_published: false,
    consumption_kwh_100km: null,
    power_hp: null,
    torque_nm: null,
    acceleration_0_100: null,
    top_speed_kmh: null,
    seats: null,
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
    source_url: null,
    source_name: null,
    source_updated_at: null,
    data_last_checked_at: null,
    import_status: "needs_review",
    import_notes: null,
    country: "NO",
    last_import_job_id: null,
    field_sources: {},
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
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

describe("catalog import engine", () => {
  it("parses CSV and never marks rows published", () => {
    const csv = `${csvHeader}
tesla-model-y,Tesla,Model Y,2025,499990,568,75,250,Firehjulsdrift,/img.webp,"Test",true,NO,approved
`;
    const parsed = parseCarsFromCsv(csv);
    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.rows.length, 1);
    assert.equal(parsed.rows[0].is_published, false);
    assert.equal(parsed.rows[0].import_status, "needs_review");
    assert.equal(parsed.rows[0].country, "NO");
    assert.ok(parsed.warnings.some((w) => w.includes("is_published")));
  });

  it("parses JSON cars array", () => {
    const json = JSON.stringify({
      cars: [
        {
          slug: "vw-id4",
          brand: "Volkswagen",
          model: "ID.4",
          year: 2025,
          price_nok: 489900,
          range_km: 550,
          battery_kwh: 77,
          dc_charging_kw: 175,
          drivetrain: "Bakhjulsdrift",
          image_url: "/images/cars/volkswagen-id-4.webp",
          description: "Test",
          is_published: true,
          import_status: "draft",
        },
      ],
    });

    const parsed = parseCarsFromJson(json);
    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.rows[0].slug, "vw-id4");
    assert.equal(parsed.rows[0].is_published, false);
    assert.equal(parsed.rows[0].import_status, "draft");
  });

  it("detects duplicates and skips unchanged cars", () => {
    const csv = `${csvHeader}
existing-car,Tesla,Model 3,2025,400000,500,60,200,Bakhjulsdrift,/a.webp,"Same",false,NO,needs_review
new-car,Kia,EV6,2025,450000,520,77,240,Firehjulsdrift,/b.webp,"New",false,NO,draft
`;
    const parsed = parseCarsFromCsv(csv);
    const existing = new Map<string, AdminCar>([
      [
        "existing-car",
        adminCar({
          id: "1",
          slug: "existing-car",
          brand: "Tesla",
          model: "Model 3",
          year: 2025,
          price_nok: 400000,
          range_km: 500,
          battery_kwh: 60,
          dc_charging_kw: 200,
          drivetrain: "Bakhjulsdrift",
          image_url: "/a.webp",
          description: "Same",
          import_status: "needs_review",
        }),
      ],
    ]);

    const { preview, summary } = buildImportPreview(parsed.rows, existing, {
      skipUnchanged: true,
      updateExisting: true,
    });

    assert.equal(summary.imported, 1);
    assert.equal(summary.skipped, 1);
    assert.equal(summary.updated, 0);
    assert.equal(preview.find((row) => row.slug === "existing-car")?.decision, "skip");
    assert.equal(preview.find((row) => row.slug === "new-car")?.decision, "import");
  });

  it("marks changed existing cars as update", () => {
    const csv = `${csvHeader}
existing-car,Tesla,Model 3,2025,410000,500,60,200,Bakhjulsdrift,/a.webp,"Changed",false,NO,needs_review
`;
    const parsed = parseCarsFromCsv(csv);
    const existing = new Map<string, AdminCar>([
      [
        "existing-car",
        adminCar({
          id: "1",
          slug: "existing-car",
          brand: "Tesla",
          model: "Model 3",
          year: 2025,
          price_nok: 400000,
          range_km: 500,
          battery_kwh: 60,
          dc_charging_kw: 200,
          drivetrain: "Bakhjulsdrift",
          image_url: "/a.webp",
          description: "Old",
          is_published: true,
          import_status: "approved",
        }),
      ],
    ]);

    const { preview, summary } = buildImportPreview(parsed.rows, existing);
    assert.equal(summary.updated, 1);
    assert.equal(preview[0].decision, "update");
    assert.ok(preview[0].changedFields.includes("price_nok"));
  });
});
