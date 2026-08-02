import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterStations,
  googleMapsDirectionsUrl,
  parseAllowedRadiusKm,
  sortStations,
} from "../lib/charging/geo";
import type { ChargingStation } from "../lib/charging/types";

function station(
  partial: Partial<ChargingStation> & Pick<ChargingStation, "id" | "name">,
): ChargingStation {
  return {
    operator: null,
    latitude: 59.9,
    longitude: 10.7,
    address: null,
    city: null,
    chargingPointCount: 2,
    connectorTypes: ["CCS"],
    maximumPowerKw: 50,
    accessInformation: null,
    openingHours: null,
    chargingCategory: "hurtiglading",
    distanceMeters: 1000,
    source: "NOBIL",
    lastUpdated: null,
    liveAvailability: null,
    ...partial,
  };
}

describe("charging geo helpers", () => {
  it("validates allowed radius values", () => {
    assert.equal(parseAllowedRadiusKm(10), 10);
    assert.equal(parseAllowedRadiusKm(300), null);
    assert.equal(parseAllowedRadiusKm("7"), null);
  });

  it("filters by connector and minimum power", () => {
    const stations = [
      station({ id: "1", name: "A", connectorTypes: ["CCS"], maximumPowerKw: 150 }),
      station({
        id: "2",
        name: "B",
        connectorTypes: ["Type2"],
        maximumPowerKw: 22,
        chargingCategory: "normallading",
      }),
      station({
        id: "3",
        name: "C",
        connectorTypes: ["CHAdeMO"],
        maximumPowerKw: 50,
      }),
    ];
    const filtered = filterStations(stations, {
      connectorType: "CCS",
      minimumPowerKw: 100,
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.id, "1");
  });

  it("sorts by nearest, power and charging points", () => {
    const stations = [
      station({
        id: "near",
        name: "Near",
        distanceMeters: 100,
        maximumPowerKw: 50,
        chargingPointCount: 2,
      }),
      station({
        id: "power",
        name: "Power",
        distanceMeters: 500,
        maximumPowerKw: 300,
        chargingPointCount: 1,
      }),
      station({
        id: "points",
        name: "Points",
        distanceMeters: 200,
        maximumPowerKw: 100,
        chargingPointCount: 8,
      }),
    ];
    assert.equal(sortStations(stations, "nearest")[0]?.id, "near");
    assert.equal(sortStations(stations, "highest_power")[0]?.id, "power");
    assert.equal(sortStations(stations, "most_points")[0]?.id, "points");
  });

  it("builds directions URL without embedding secrets", () => {
    const url = googleMapsDirectionsUrl(59.91, 10.75);
    assert.match(url, /maps\/dir/);
    assert.match(url, /59\.91/);
    assert.doesNotMatch(url, /AIza|NOBIL|API_KEY/i);
  });
});
