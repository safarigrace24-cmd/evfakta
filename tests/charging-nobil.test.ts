import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  availableFiltersFromStations,
  distanceMeters,
  filterStations,
  isValidLatitude,
  isValidLongitude,
  parseAllowedRadiusKm,
  radiusKmToMeters,
  sortStationsByDistance,
} from "../lib/charging/geo";
import { normalizeNobilResponse } from "../lib/charging/normalize-nobil";
import { fetchNearbyChargingStations } from "../lib/charging/nobil-client";
import type { ChargingStation } from "../lib/charging/types";

const ORIGINAL_NOBIL = process.env.NOBIL_API_KEY;
const ORIGINAL_FLAG = process.env.CHARGING_MAP_ENABLED;

afterEach(() => {
  if (ORIGINAL_NOBIL === undefined) delete process.env.NOBIL_API_KEY;
  else process.env.NOBIL_API_KEY = ORIGINAL_NOBIL;
  if (ORIGINAL_FLAG === undefined) delete process.env.CHARGING_MAP_ENABLED;
  else process.env.CHARGING_MAP_ENABLED = ORIGINAL_FLAG;
});

describe("Charging geo + validation", () => {
  it("rejects invalid coordinates", () => {
    assert.equal(isValidLatitude(91), false);
    assert.equal(isValidLongitude(-200), false);
    assert.equal(isValidLatitude(59.9), true);
    assert.equal(isValidLongitude(10.7), true);
  });

  it("limits radius to allowed values", () => {
    assert.equal(parseAllowedRadiusKm(10), 10);
    assert.equal(parseAllowedRadiusKm(7), null);
    assert.equal(parseAllowedRadiusKm("50"), 50);
    assert.equal(radiusKmToMeters(5), 5000);
  });

  it("computes distance and sorts nearest first", () => {
    const d = distanceMeters(59.91, 10.75, 59.92, 10.75);
    assert.ok(d > 0 && d < 2000);
    const stations: ChargingStation[] = [
      {
        id: "b",
        name: "Far",
        operator: null,
        latitude: 60,
        longitude: 11,
        address: null,
        city: null,
        chargingPointCount: 1,
        connectorTypes: ["CCS"],
        maximumPowerKw: 150,
        accessInformation: null,
        openingHours: null,
        chargingCategory: "hurtiglading",
        distanceMeters: 5000,
        source: "NOBIL",
        lastUpdated: null,
        liveAvailability: null,
      },
      {
        id: "a",
        name: "Near",
        operator: null,
        latitude: 59.91,
        longitude: 10.75,
        address: null,
        city: null,
        chargingPointCount: 2,
        connectorTypes: ["Type2"],
        maximumPowerKw: 22,
        accessInformation: null,
        openingHours: null,
        chargingCategory: "normallading",
        distanceMeters: 100,
        source: "NOBIL",
        lastUpdated: null,
        liveAvailability: null,
      },
    ];
    assert.equal(sortStationsByDistance(stations)[0].id, "a");
  });
});

describe("NOBIL normalization", () => {
  it("normalizes chargerstations envelope into EVFAKTA shape", () => {
    const payload = [
      {
        Provider: "NOBIL.no",
        chargerstations: [
          {
            csmd: {
              id: 41,
              name: "IKEA Slependen",
              Street: "Nesbruveien",
              House_number: "40",
              City: "BILLINGSTAD",
              Owned_by: "IKEA",
              Number_charging_points: 6,
              Position: "(59.87447,10.49982)",
              International_id: "NOR_00041",
              Updated: "2011-04-15 12:19:20",
            },
            attr: {
              st: {
                "24": {
                  attrtypeid: "24",
                  attrname: "Open 24h",
                  trans: "Yes",
                },
                "2": {
                  attrtypeid: "2",
                  attrname: "Availability",
                  trans: "Public",
                },
              },
              conn: {
                "1": {
                  "4": {
                    attrtypeid: "4",
                    attrname: "Connector",
                    trans: "CCS",
                  },
                  "5": {
                    attrtypeid: "5",
                    attrname: "Charging capacity",
                    trans: "50 kW DC",
                  },
                },
              },
            },
          },
        ],
      },
    ];

    const stations = normalizeNobilResponse(payload, {
      lat: 59.87,
      lng: 10.5,
    });
    assert.equal(stations.length, 1);
    assert.equal(stations[0].id, "NOR_00041");
    assert.equal(stations[0].source, "NOBIL");
    assert.equal(stations[0].liveAvailability, null);
    assert.ok(stations[0].connectorTypes.includes("CCS"));
    assert.equal(stations[0].maximumPowerKw, 50);
    assert.equal(stations[0].chargingCategory, "hurtiglading");
    assert.ok(stations[0].distanceMeters != null);
  });

  it("filters by connector and minimum power", () => {
    const stations = normalizeNobilResponse([
      {
        csmd: {
          name: "A",
          Position: "(59.9,10.7)",
          International_id: "A",
        },
        attr: {
          conn: {
            "1": {
              "4": { attrtypeid: "4", trans: "Type 2" },
              "5": { attrtypeid: "5", trans: "22 kW" },
            },
          },
        },
      },
      {
        csmd: {
          name: "B",
          Position: "(59.91,10.71)",
          International_id: "B",
        },
        attr: {
          conn: {
            "1": {
              "4": { attrtypeid: "4", trans: "CCS" },
              "5": { attrtypeid: "5", trans: "150 kW" },
            },
          },
        },
      },
    ]);
    const filtered = filterStations(stations, {
      connectorType: "CCS",
      minimumPowerKw: 100,
      chargingCategory: null,
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "B");
    const filters = availableFiltersFromStations(stations);
    assert.ok(filters.connectorTypes.includes("CCS"));
  });
});

describe("NOBIL server client (mocked)", () => {
  it("fails closed when NOBIL_API_KEY is missing", async () => {
    delete process.env.NOBIL_API_KEY;
    const result = await fetchNearbyChargingStations({
      latitude: 59.91,
      longitude: 10.75,
      radiusKm: 10,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "missing_key");
  });

  it("posts near-search and never returns the API key", async () => {
    process.env.NOBIL_API_KEY = "secret-nobil-key";
    let sawKeyInBody = false;
    const result = await fetchNearbyChargingStations(
      {
        latitude: 59.91673,
        longitude: 10.74782,
        radiusKm: 5,
        limit: 10,
      },
      {
        fetchImpl: async (_url, init) => {
          const body = String(init?.body || "");
          sawKeyInBody = body.includes("secret-nobil-key");
          return new Response(
            JSON.stringify([
              {
                chargerstations: [
                  {
                    csmd: {
                      name: "Test",
                      Position: "(59.917,10.748)",
                      International_id: "NOR_TEST",
                      Owned_by: "Test AS",
                      Number_charging_points: 2,
                    },
                    attr: {
                      conn: {
                        "1": {
                          "4": { attrtypeid: "4", trans: "CCS" },
                          "5": { attrtypeid: "5", trans: "150 kW" },
                        },
                      },
                    },
                  },
                ],
              },
            ]),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        },
      },
    );

    assert.equal(sawKeyInBody, true); // server request may include key
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.stations.length, 1);
      assert.match(result.attribution, /NOBIL/);
      assert.doesNotMatch(JSON.stringify(result), /secret-nobil-key/);
    }
  });
});
