import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Car } from "../data/cars";
import {
  DEFAULT_CATALOG_FILTERS,
  filterAndSortCars,
  parseCatalogFilters,
} from "../lib/cars/catalog-filters";

function car(partial: Partial<Car> & Pick<Car, "slug" | "brand" | "model">): Car {
  return {
    priceNok: 400000,
    rangeKm: 500,
    batteryKwh: 75,
    dcKw: 200,
    acKw: 11,
    drive: "Firehjulsdrift",
    description: "",
    updated: "2026-07-25",
    ...partial,
  };
}

describe("parseCatalogFilters", () => {
  it("reads URL params", () => {
    const filters = parseCatalogFilters({
      q: "tesla",
      merke: "Tesla",
      drivlinje: "Firehjulsdrift",
      sort: "price-asc",
    });
    assert.equal(filters.q, "tesla");
    assert.equal(filters.brand, "Tesla");
    assert.equal(filters.drive, "Firehjulsdrift");
    assert.equal(filters.sort, "price-asc");
  });
});

describe("filterAndSortCars", () => {
  const cars = [
    car({ slug: "a", brand: "Tesla", model: "Y", priceNok: 500000, rangeKm: 600, overallScore: 8 }),
    car({
      slug: "b",
      brand: "VW",
      model: "ID.4",
      priceNok: 400000,
      rangeKm: 550,
      overallScore: 7,
      drive: "Bakhjulsdrift",
      bodyStyle: "SUV",
    }),
  ];

  it("filters by brand and sorts by price", () => {
    const result = filterAndSortCars(cars, {
      ...DEFAULT_CATALOG_FILTERS,
      brand: "Tesla",
      sort: "price-asc",
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].slug, "a");
  });

  it("sorts by score", () => {
    const result = filterAndSortCars(cars, {
      ...DEFAULT_CATALOG_FILTERS,
      sort: "score-desc",
    });
    assert.equal(result[0].slug, "a");
  });
});
