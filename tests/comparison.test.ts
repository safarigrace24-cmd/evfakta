import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Car } from "../data/cars";
import {
  buildCompareHref,
  buildComparisonRows,
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
    const rows = buildComparisonRows([
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
    ]);

    const price = rows.find((row) => row.key === "priceNok");
    const range = rows.find((row) => row.key === "rangeKm");
    const score = rows.find((row) => row.key === "overallScore");

    assert.ok(price);
    assert.deepEqual(price.bestIndexes, [1]);
    assert.ok(range);
    assert.deepEqual(range.bestIndexes, [0]);
    assert.ok(score);
    assert.deepEqual(score.bestIndexes, [1]);
  });
});
