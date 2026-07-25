import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Car, CarVariant } from "../data/cars";
import {
  applyVariantToCar,
  resolveVariantSlug,
  withDefaultVariantSpecs,
} from "../lib/cars/variants";
import {
  buildCompareHref,
  parseCompareSelections,
  resolveCompareCars,
} from "../lib/compare/comparison";
import { parseCarsFromJson } from "../lib/admin/import/parse-json";
import { parseCarsFromCsv } from "../lib/admin/import/parse-csv";

function variant(partial: Partial<CarVariant> & Pick<CarVariant, "slug" | "name">): CarVariant {
  return {
    id: partial.id ?? partial.slug,
    trimLevel: null,
    modelYear: null,
    priceNok: null,
    batteryTotalKwh: null,
    batteryUsableKwh: null,
    rangeKm: null,
    winterRangeKm: null,
    realWorldRangeKm: null,
    consumptionKwh100km: null,
    acKw: null,
    dcKw: null,
    chargeTime1080Minutes: null,
    drive: null,
    powerHp: null,
    torqueNm: null,
    acceleration0100: null,
    topSpeedKmh: null,
    towingKg: null,
    curbWeightKg: null,
    isDefault: false,
    isActive: true,
    sortOrder: 0,
    sourceName: null,
    sourceUrl: null,
    dataLastCheckedAt: null,
    ...partial,
  };
}

function car(partial: Partial<Car> = {}): Car {
  return {
    slug: "tesla-model-y",
    brand: "Tesla",
    model: "Model Y",
    priceNok: 400000,
    rangeKm: 500,
    batteryKwh: 70,
    dcKw: 200,
    acKw: 11,
    drive: "Forhjulsdrift",
    description: "Test",
    updated: "2026-07-25",
    ...partial,
  };
}

describe("applyVariantToCar", () => {
  it("overlays selected variant and keeps base gaps", () => {
    const base = car({
      variants: [
        variant({
          slug: "long-range-rwd",
          name: "Long Range RWD",
          isDefault: true,
          priceNok: 499990,
          rangeKm: 600,
          drive: "Bakhjulsdrift",
        }),
        variant({
          slug: "performance",
          name: "Performance",
          priceNok: 589990,
          rangeKm: 550,
          drive: "Firehjulsdrift",
          powerHp: 514,
        }),
      ],
    });

    const selected = applyVariantToCar(base, "performance");
    assert.equal(selected.selectedVariantSlug, "performance");
    assert.equal(selected.variant, "Performance");
    assert.equal(selected.priceNok, 589990);
    assert.equal(selected.rangeKm, 550);
    assert.equal(selected.drive, "Firehjulsdrift");
    assert.equal(selected.powerHp, 514);
    assert.equal(selected.acKw, 11);
  });

  it("falls back to default variant for cards", () => {
    const base = car({
      priceNok: 1,
      rangeKm: 1,
      variants: [
        variant({
          slug: "long-range-rwd",
          name: "Long Range RWD",
          isDefault: true,
          priceNok: 499990,
          rangeKm: 600,
        }),
        variant({
          slug: "performance",
          name: "Performance",
          priceNok: 589990,
          rangeKm: 550,
        }),
      ],
    });

    const display = withDefaultVariantSpecs(base);
    assert.equal(display.priceNok, 499990);
    assert.equal(display.rangeKm, 600);
    assert.equal(resolveVariantSlug(base, "missing"), "long-range-rwd");
  });

  it("keeps cars without variants unchanged", () => {
    const base = car();
    const display = withDefaultVariantSpecs(base);
    assert.equal(display.priceNok, 400000);
    assert.equal(display.selectedVariantSlug, undefined);
  });
});

describe("compare variant tokens", () => {
  it("parses slug:variant selections", () => {
    assert.deepEqual(parseCompareSelections("tesla-model-y:performance,vw-id4"), [
      { slug: "tesla-model-y", variantSlug: "performance" },
      { slug: "vw-id4", variantSlug: null },
    ]);
    assert.equal(
      buildCompareHref([
        { slug: "tesla-model-y", variantSlug: "performance" },
        { slug: "vw-id4", variantSlug: null },
      ]),
      "/sammenlign?biler=tesla-model-y%3Aperformance%2Cvw-id4",
    );
  });

  it("resolves selected variants for comparison", () => {
    const cars = [
      car({
        variants: [
          variant({
            slug: "long-range-rwd",
            name: "Long Range RWD",
            isDefault: true,
            priceNok: 499990,
          }),
          variant({
            slug: "performance",
            name: "Performance",
            priceNok: 589990,
          }),
        ],
      }),
      car({
        slug: "vw-id4",
        brand: "Volkswagen",
        model: "ID.4",
        priceNok: 450000,
      }),
    ];

    const resolved = resolveCompareCars(cars, [
      { slug: "tesla-model-y", variantSlug: "performance" },
      { slug: "vw-id4", variantSlug: null },
    ]);

    assert.equal(resolved.length, 2);
    assert.equal(resolved[0].priceNok, 589990);
    assert.equal(resolved[0].variant, "Performance");
    assert.equal(resolved[1].priceNok, 450000);
  });
});

describe("import variants", () => {
  it("parses nested JSON variants without publishing", () => {
    const result = parseCarsFromJson(
      JSON.stringify({
        cars: [
          {
            slug: "tesla-model-y",
            brand: "Tesla",
            model: "Model Y",
            year: 2025,
            price_nok: 499990,
            range_km: 600,
            battery_kwh: 75,
            dc_charging_kw: 250,
            drivetrain: "Bakhjulsdrift",
            image_url: "/images/cars/tesla-model-y.webp",
            description: "Test",
            is_published: true,
            import_status: "approved",
            variants: [
              {
                name: "Long Range RWD",
                slug: "long-range-rwd",
                is_default: true,
                price_nok: 499990,
                range_km: 600,
                import_status: "approved",
              },
              {
                name: "Performance",
                slug: "performance",
                price_nok: 589990,
                range_km: 550,
              },
            ],
          },
        ],
      }),
    );

    assert.equal(result.errors.length, 0);
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].is_published, false);
    assert.equal(result.rows[0].import_status, "needs_review");
    assert.equal(result.rows[0].variants?.length, 2);
    assert.equal(result.rows[0].variants?.[0].import_status, "needs_review");
    assert.equal(result.rows[0].variants?.[0].is_default, true);
    assert.equal(result.rows[0].variants?.[1].slug, "performance");
  });

  it("parses CSV parent_slug variant rows", () => {
    const csv = [
      "slug,brand,model,year,price_nok,range_km,battery_kwh,dc_charging_kw,drivetrain,image_url,description,is_published,parent_slug,variant_name,is_default",
      "tesla-model-y,Tesla,Model Y,2025,499990,600,75,250,Bakhjulsdrift,/img.webp,Desc,false,,,",
      "long-range-rwd,Tesla,Model Y,2025,499990,600,75,250,Bakhjulsdrift,/img.webp,Desc,false,tesla-model-y,Long Range RWD,true",
      "performance,Tesla,Model Y,2025,589990,550,75,250,Firehjulsdrift,/img.webp,Desc,false,tesla-model-y,Performance,false",
    ].join("\n");

    const result = parseCarsFromCsv(csv);
    assert.equal(result.errors.length, 0);
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].variants?.length, 2);
    assert.equal(result.rows[0].variants?.[0].name, "Long Range RWD");
    assert.equal(result.rows[0].variants?.[1].slug, "performance");
    assert.equal(result.rows[0].is_published, false);
  });
});
