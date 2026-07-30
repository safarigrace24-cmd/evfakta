import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CarImageRow } from "../lib/admin/car-image-types";
import {
  computeProductionBrandRows,
  computeProductionDashboardStats,
  computeProductionModelRow,
  deriveProductionStatus,
  filterProductionModels,
} from "../lib/admin/production-dashboard";
import type { AdminCar } from "../lib/admin/types";
import type { AdminCarVariant } from "../lib/admin/variant-types";

function baseCar(overrides: Partial<AdminCar> = {}): AdminCar {
  return {
    id: "car-1",
    slug: "volkswagen-id-3",
    brand: "Volkswagen",
    brand_id: null,
    model: "ID.3",
    variant: null,
    trim_level: null,
    model_generation: null,
    year: 2025,
    price_nok: null,
    range_km: null,
    battery_kwh: null,
    battery_total_kwh: null,
    battery_usable_kwh: null,
    battery_chemistry: "NMC",
    winter_range_km: null,
    real_world_range_km: null,
    dc_charging_kw: null,
    charge_time_10_80_minutes: null,
    charging_connector_ac: "Type 2",
    charging_connector_dc: "CCS",
    drivetrain: "RWD",
    image_url: null,
    description: "Draft – Requires editor review.\n\nKompakt elbil.",
    is_published: false,
    consumption_kwh_100km: null,
    power_hp: null,
    torque_nm: null,
    acceleration_0_100: null,
    top_speed_kmh: null,
    seats: 5,
    cargo_l: 385,
    towing_kg: null,
    warranty: "2 år",
    ac_charging_kw: 11,
    vehicle_type: null,
    body_style: "Hatchback",
    length_mm: 4264,
    width_mm: 1809,
    height_mm: 1564,
    wheelbase_mm: 2770,
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
    pros: ["Draft – Requires editor review.", "Kompakt format"],
    cons: ["Draft – Requires editor review.", "Begrenset bagasje"],
    suitable_for: ["Pendlerne"],
    source_url: "https://www.volkswagen.no/idhub/content/dam/x.pdf",
    source_name: "Volkswagen Norge — Tekniske data ID.3",
    source_updated_at: null,
    data_last_checked_at: "2026-07-26T14:00:00.000Z",
    import_status: "needs_review",
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

function baseVariant(overrides: Partial<AdminCarVariant> = {}): AdminCarVariant {
  return {
    id: "var-1",
    car_id: "car-1",
    name: "Pro Highline",
    slug: "pro-highline",
    trim_level: null,
    model_year: 2025,
    price_nok: null,
    battery_total_kwh: 62,
    battery_usable_kwh: 59,
    range_km: 430,
    winter_range_km: null,
    real_world_range_km: null,
    consumption_kwh_100km: 14,
    ac_charging_kw: 11,
    dc_charging_kw: 165,
    charge_time_10_80_minutes: 28,
    drivetrain: "RWD",
    power_hp: 204,
    torque_nm: 310,
    acceleration_0_100: 7.4,
    top_speed_kmh: 180,
    towing_kg: null,
    curb_weight_kg: null,
    is_default: true,
    is_active: false,
    sort_order: 0,
    source_name: "VW",
    source_url: "https://example.com",
    data_last_checked_at: "2026-07-26T14:00:00.000Z",
    import_status: "needs_review",
    import_notes: null,
    created_at: "2026-07-26T00:00:00.000Z",
    updated_at: "2026-07-26T00:00:00.000Z",
    ...overrides,
  };
}

describe("production dashboard readiness", () => {
  it("marks a sourced multi-variant draft as READY_FOR_HUMAN_APPROVAL", () => {
    const status = deriveProductionStatus({
      car: baseCar(),
      images: [],
      variants: [baseVariant()],
      imageCandidateCount: 3,
    });
    assert.equal(status, "READY_FOR_HUMAN_APPROVAL");
  });

  it("keeps shells as NOT_READY", () => {
    const status = deriveProductionStatus({
      car: baseCar({
        description: "Shell only",
        pros: [],
        cons: [],
        source_name: null,
        source_url: null,
        data_last_checked_at: null,
        import_status: "draft",
      }),
      images: [],
      variants: [],
      imageCandidateCount: 0,
    });
    assert.equal(status, "NOT_READY");
  });

  it("never overrides published with ready", () => {
    const status = deriveProductionStatus({
      car: baseCar({ is_published: true, import_status: "approved" }),
      images: [],
      variants: [baseVariant()],
      imageCandidateCount: 1,
    });
    assert.equal(status, "PUBLISHED");
  });

  it("filters publish-queue status and brand", () => {
    const ready = computeProductionModelRow({
      car: baseCar(),
      images: [],
      variants: [baseVariant()],
      imageCandidateCount: 2,
    });
    const shell = computeProductionModelRow({
      car: baseCar({
        id: "car-2",
        slug: "tesla-model-y",
        brand: "Tesla",
        model: "Model Y",
        import_status: "draft",
        source_name: null,
        source_url: null,
        data_last_checked_at: null,
        description: null,
        pros: null,
        cons: null,
      }),
      images: [],
      variants: [],
    });

    const filtered = filterProductionModels([ready, shell], {
      q: "",
      brand: "Volkswagen",
      status: "READY_FOR_HUMAN_APPROVAL",
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.slug, "volkswagen-id-3");
  });

  it("aggregates brand progress and overall stats", () => {
    const images: CarImageRow[] = [
      {
        id: "img-1",
        car_id: "car-1",
        image_url: "/x.jpg",
        storage_path: "x",
        image_type: "front",
        alt_text: "front",
        sort_order: 0,
        is_primary: true,
        created_at: "2026-07-26T00:00:00.000Z",
      },
    ];
    const models = [
      computeProductionModelRow({
        car: baseCar(),
        images,
        variants: [baseVariant()],
        imageCandidateCount: 1,
      }),
      computeProductionModelRow({
        car: baseCar({
          id: "car-2",
          slug: "volkswagen-id-5",
          model: "ID.5",
          import_status: "draft",
          source_name: null,
          source_url: null,
          data_last_checked_at: null,
          description: "NOT_READY shell",
          pros: null,
          cons: null,
        }),
        images: [],
        variants: [],
      }),
    ];

    const brands = computeProductionBrandRows(models);
    assert.equal(brands.length, 1);
    assert.equal(brands[0]?.ready, 1);
    assert.equal(brands[0]?.notReady, 1);
    assert.ok(brands[0]!.progressPercent >= 0);

    const stats = computeProductionDashboardStats(models, 1);
    assert.equal(stats.cars, 2);
    assert.equal(stats.readyForHumanApproval, 1);
    assert.equal(stats.notReady, 1);
    assert.equal(stats.brands, 1);
    assert.equal(typeof stats.imagesReady, "number");
    assert.equal(typeof stats.imagesPending, "number");
    assert.equal(typeof stats.missingHero, "number");
    assert.equal(typeof stats.missingGallery, "number");
    assert.equal(typeof stats.launchContentReady, "number");
    assert.equal(typeof stats.launchBlocked, "number");
    assert.equal(typeof stats.publishReady, "number");
    assert.equal(typeof stats.hasDraftMarker, "number");
  });

  it("exposes image readiness fields without changing publish state", () => {
    const row = computeProductionModelRow({
      car: baseCar(),
      images: [],
      variants: [baseVariant()],
      imageCandidateCount: 2,
    });
    assert.equal(row.imagesReady, false);
    assert.equal(row.imagesPending, true);
    assert.equal(row.missingHero, true);
    assert.equal(row.imageReadinessLabel, "Images Pending Review");
    assert.equal(row.isPublished, false);
    assert.equal(row.importStatus, "needs_review");
  });

  it("marks draft + missing gallery as launch blocked, not publish ready", () => {
    const row = computeProductionModelRow({
      car: baseCar(),
      images: [],
      variants: [baseVariant()],
      imageCandidateCount: 2,
    });
    assert.equal(row.hasDraftMarker, true);
    assert.equal(row.launchContentReady, false);
    assert.equal(row.launchBlocked, true);
    assert.equal(row.publishReady, false);
    assert.equal(row.nextAction, "Rewrite Draft");
  });

  it("blocks launch ready below 95% completion even with hero/front/side", () => {
    const row = computeProductionModelRow({
      car: baseCar({
        description:
          "Volkswagen ID.3 er en kompakt elbil med dokumenterte norske spesifikasjoner.",
        pros: ["Kompakt format"],
        cons: ["Begrenset bagasje"],
        suitable_for: ["Pendlerne"],
        score_notes: null,
        import_status: "needs_review",
        image_url: null,
      }),
      images: [
        {
          id: "img-1",
          car_id: "car-1",
          image_url: "/front.webp",
          storage_path: "front",
          image_type: "front",
          alt_text: "front",
          sort_order: 0,
          is_primary: true,
          created_at: "2026-07-26T00:00:00.000Z",
        },
        {
          id: "img-2",
          car_id: "car-1",
          image_url: "/side.webp",
          storage_path: "side",
          image_type: "side",
          alt_text: "side",
          sort_order: 1,
          is_primary: false,
          created_at: "2026-07-26T00:00:00.000Z",
        },
      ],
      variants: [baseVariant()],
    });
    assert.equal(row.hasDraftMarker, false);
    assert.ok(row.completionPercent < 95);
    assert.equal(row.launchContentReady, false);
    assert.equal(row.publishReady, false);
    assert.ok(row.launchBlockerCodes.includes("completion_below_threshold"));
    assert.equal(row.nextAction, "Raise Completion ≥95%");
  });

  it("reports launch content ready when completion ≥95% and hero/front/side attached", () => {
    const row = computeProductionModelRow({
      car: baseCar({
        description:
          "Volkswagen ID.3 er en kompakt elbil med dokumenterte norske spesifikasjoner for rekkevidde og lading.",
        pros: ["Kompakt format", "CCS-lading"],
        cons: ["Begrenset bagasje"],
        suitable_for: ["Pendlerne"],
        heat_pump: true,
        year: 2025,
        import_status: "needs_review",
        image_url: null,
        score_notes: `## Hvem bilen passer for
Pendling og daglig bruk.

## Vinter
Ingen offisiell vinterrekkevidde — ikke gjettet. WLTP er laboratoriemål.

## Lading
AC/DC dokumentert per variant.

## Langtur
Planlegg ladestopp.

## FAQ
**Har ID.3 varme pumpe?** Ja i denne testkatalogen.
**Hva er reell rekkevidde?** Ikke testet av EVFAKTA.`,
      }),
      images: [
        {
          id: "img-1",
          car_id: "car-1",
          image_url: "/front.webp",
          storage_path: "front",
          image_type: "front",
          alt_text: "front",
          sort_order: 0,
          is_primary: true,
          created_at: "2026-07-26T00:00:00.000Z",
        },
        {
          id: "img-2",
          car_id: "car-1",
          image_url: "/side.webp",
          storage_path: "side",
          image_type: "side",
          alt_text: "side",
          sort_order: 1,
          is_primary: false,
          created_at: "2026-07-26T00:00:00.000Z",
        },
        {
          id: "img-3",
          car_id: "car-1",
          image_url: "/rear.webp",
          storage_path: "rear",
          image_type: "rear",
          alt_text: "rear",
          sort_order: 2,
          is_primary: false,
          created_at: "2026-07-26T00:00:00.000Z",
        },
        {
          id: "img-4",
          car_id: "car-1",
          image_url: "/interior.webp",
          storage_path: "interior",
          image_type: "interior",
          alt_text: "interior",
          sort_order: 3,
          is_primary: false,
          created_at: "2026-07-26T00:00:00.000Z",
        },
      ],
      variants: [baseVariant({ towing_kg: 1000 })],
    });
    assert.equal(row.hasDraftMarker, false);
    assert.ok(row.completionPercent >= 95);
    assert.equal(row.launchContentReady, true);
    assert.equal(row.publishReady, false);
    assert.equal(Array.isArray(row.launchBlockerCodes), true);
  });
});
