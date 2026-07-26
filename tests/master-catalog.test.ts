import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import {
  MASTER_CATALOG_BRANDS,
  MASTER_CATALOG_MODELS,
  MASTER_CATALOG_PLANNED_COUNT,
  computeMasterCatalogProgress,
} from "../lib/admin/master-catalog";
import { parseCarsFromJson } from "../lib/admin/import/parse-json";

describe("master catalog plan", () => {
  it("lists exactly 50 models across the required brands", () => {
    assert.equal(MASTER_CATALOG_PLANNED_COUNT, 50);
    assert.equal(MASTER_CATALOG_MODELS.length, 50);

    const required = [
      "Tesla",
      "Volkswagen",
      "Volvo",
      "BMW",
      "Audi",
      "Kia",
      "Hyundai",
      "Polestar",
      "BYD",
      "Toyota",
      "Ford",
      "Mercedes-Benz",
      "Nissan",
      "MG",
      "Renault",
      "Xpeng",
      "Zeekr",
      "Skoda",
      "Cupra",
      "Peugeot",
    ];
    for (const brand of required) {
      assert.ok(MASTER_CATALOG_BRANDS.includes(brand as never), `missing brand ${brand}`);
      assert.ok(
        MASTER_CATALOG_MODELS.some((model) => model.brand === brand),
        `no models for ${brand}`,
      );
    }

    const slugs = MASTER_CATALOG_MODELS.map((model) => model.slug);
    assert.equal(new Set(slugs).size, slugs.length, "duplicate slugs");
  });

  it("computes progress against imported cars", () => {
    const progress = computeMasterCatalogProgress([
      {
        slug: "tesla-model-y",
        is_published: false,
        import_status: "needs_review",
        image_url: null,
        source_name: null,
        source_url: null,
      },
      {
        slug: "volkswagen-id-4",
        is_published: true,
        import_status: "approved",
        image_url: "https://cdn.example/id4.webp",
        source_name: "VW Norge",
        source_url: "https://www.volkswagen.no",
      },
      {
        slug: "unrelated-car",
        is_published: true,
        import_status: "approved",
        image_url: "https://cdn.example/x.webp",
        source_name: "X",
        source_url: null,
      },
    ]);

    assert.equal(progress.plannedModels, 50);
    assert.equal(progress.importedModels, 2);
    assert.equal(progress.needsReview, 1);
    assert.equal(progress.approved, 1);
    assert.equal(progress.published, 1);
    assert.equal(progress.missingImages, 1);
    assert.equal(progress.missingSources, 1);
    assert.equal(progress.notYetImported, 48);
  });
});

describe("catalog-batch-01-tesla.json", () => {
  it("parses as empty unpublished shells with nested variants", () => {
    const raw = readFileSync(
      join(process.cwd(), "data/catalog-batch-01-tesla.json"),
      "utf8",
    );
    const parsed = parseCarsFromJson(raw);

    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.rows.length, 4);

    for (const row of parsed.rows) {
      assert.equal(row.brand, "Tesla");
      assert.equal(row.is_published, false);
      assert.equal(row.import_status, "needs_review");
      assert.equal(row.price_nok, null);
      assert.equal(row.range_km, null);
      assert.ok(row.variants && row.variants.length >= 2);
      assert.ok(row.variants.some((variant) => variant.is_default));
      for (const variant of row.variants) {
        assert.equal(variant.import_status, "needs_review");
        assert.equal(variant.price_nok, null);
        assert.equal(variant.range_km, null);
      }
    }

    const slugs = parsed.rows.map((row) => row.slug).sort();
    assert.deepEqual(slugs, [
      "tesla-model-3",
      "tesla-model-s",
      "tesla-model-x",
      "tesla-model-y",
    ]);
  });
});
