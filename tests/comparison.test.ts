import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Car } from "../data/cars";
import {
  buildCompareHref,
  buildComparisonRows,
  COMPARE_MISSING_LABEL,
  filterComparisonRows,
  parseCompareSelections,
  parseCompareSlugs,
} from "../lib/compare/comparison";

function car(partial: Partial<Car> & Pick<Car, "slug" | "brand" | "model">): Car {
  return {
    priceNok: 0,
    rangeKm: 0,
    batteryKwh: 0,
    dcKw: 0,
    acKw: 11,
    drive: "Forhjulsdrift",
    description: "",
    updated: "2026-07-25",
    ...partial,
  };
}

describe("parseCompareSlugs", () => {
  it("parses unique slugs and caps at 3", () => {
    assert.deepEqual(
      parseCompareSlugs("a,b,a,c,d"),
      ["a", "b", "c"],
    );
  });
});

describe("buildCompareHref", () => {
  it("builds shareable URL", () => {
    assert.equal(buildCompareHref(["tesla-model-y", "vw-id4"]), "/sammenlign?biler=tesla-model-y%2Cvw-id4");
  });

  it("supports variant tokens", () => {
    assert.deepEqual(
      parseCompareSelections("tesla-model-y:performance,vw-id4"),
      [
        { slug: "tesla-model-y", variantSlug: "performance" },
        { slug: "vw-id4", variantSlug: null },
      ],
    );
  });
});

describe("buildComparisonRows", () => {
  it("highlights best numeric values", () => {
    const rows = buildComparisonRows(
      [
        car({
          slug: "a",
          brand: "A",
          model: "One",
          priceNok: 400000,
          rangeKm: 500,
          overallScore: 7,
        }),
        car({
          slug: "b",
          brand: "B",
          model: "Two",
          priceNok: 350000,
          rangeKm: 450,
          overallScore: 8,
        }),
      ],
      { includeHiddenPublicFields: true },
    );

    const price = rows.find((row) => row.key === "priceNok");
    const range = rows.find((row) => row.key === "rangeKm");
    const score = rows.find((row) => row.key === "overallScore");

    assert.ok(price);
    assert.deepEqual(price.bestIndexes, [1]);
    assert.equal(price.group, "identity");
    assert.ok(range);
    assert.deepEqual(range.bestIndexes, [0]);
    assert.equal(range.group, "range");
    assert.ok(score);
    assert.deepEqual(score.bestIndexes, [1]);
    assert.equal(score.group, "scores");
  });

  it("shows Ikke oppgitt for missing values and never invents zeros", () => {
    const rows = buildComparisonRows(
      [
        car({ slug: "a", brand: "A", model: "One", rangeKm: 500, cargoL: null }),
        car({ slug: "b", brand: "B", model: "Two", rangeKm: 400, cargoL: 400 }),
      ],
      { includeHiddenPublicFields: true },
    );
    const cargo = rows.find((row) => row.key === "cargo");
    assert.ok(cargo);
    assert.equal(cargo.values[0], COMPARE_MISSING_LABEL);
    assert.equal(cargo.values[1], "400");
  });

  it("filters to difference-only rows", () => {
    const rows = buildComparisonRows(
      [
        car({
          slug: "a",
          brand: "A",
          model: "One",
          rangeKm: 500,
          drive: "Forhjulsdrift",
        }),
        car({
          slug: "b",
          brand: "B",
          model: "Two",
          rangeKm: 400,
          drive: "Forhjulsdrift",
        }),
      ],
      { includeHiddenPublicFields: true },
    );
    const diffs = filterComparisonRows(rows, true);
    assert.ok(diffs.some((row) => row.key === "rangeKm"));
    assert.ok(!diffs.some((row) => row.key === "drive"));
  });
});
