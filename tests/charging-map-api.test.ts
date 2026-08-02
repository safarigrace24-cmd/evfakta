import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { chargingLocationErrorMessage } from "../lib/charging/location-errors";
import { GET as chargingStationsGet } from "../app/api/charging-stations/route";

const ORIGINAL_FLAG = process.env.CHARGING_MAP_ENABLED;
const ORIGINAL_NOBIL = process.env.NOBIL_API_KEY;

afterEach(() => {
  if (ORIGINAL_FLAG === undefined) delete process.env.CHARGING_MAP_ENABLED;
  else process.env.CHARGING_MAP_ENABLED = ORIGINAL_FLAG;
  if (ORIGINAL_NOBIL === undefined) delete process.env.NOBIL_API_KEY;
  else process.env.NOBIL_API_KEY = ORIGINAL_NOBIL;
});

describe("Charging map feature flag + location UI copy", () => {
  it("shows permission denial copy", () => {
    assert.match(
      chargingLocationErrorMessage("permission_denied"),
      /avslått/i,
    );
  });

  it("returns 503 when CHARGING_MAP_ENABLED is false", async () => {
    process.env.CHARGING_MAP_ENABLED = "false";
    const response = await chargingStationsGet(
      new Request(
        "http://localhost/api/charging-stations?latitude=59.9&longitude=10.7&radius=10",
      ),
    );
    assert.equal(response.status, 503);
    const json = (await response.json()) as { ok: boolean };
    assert.equal(json.ok, false);
  });

  it("returns 400 for invalid coordinates when enabled", async () => {
    process.env.CHARGING_MAP_ENABLED = "true";
    process.env.NOBIL_API_KEY = "test";
    const response = await chargingStationsGet(
      new Request(
        "http://localhost/api/charging-stations?latitude=999&longitude=10.7&radius=10",
      ),
    );
    assert.equal(response.status, 400);
  });

  it("returns 400 for invalid radius when enabled", async () => {
    process.env.CHARGING_MAP_ENABLED = "true";
    process.env.NOBIL_API_KEY = "test";
    const response = await chargingStationsGet(
      new Request(
        "http://localhost/api/charging-stations?latitude=59.9&longitude=10.7&radius=7",
      ),
    );
    assert.equal(response.status, 400);
  });

  it("returns unavailable when NOBIL key is missing (mocked, no network)", async () => {
    process.env.CHARGING_MAP_ENABLED = "true";
    delete process.env.NOBIL_API_KEY;
    const response = await chargingStationsGet(
      new Request(
        "http://localhost/api/charging-stations?latitude=59.9&longitude=10.7&radius=10",
      ),
    );
    assert.ok(response.status >= 400);
    const json = (await response.json()) as { ok: boolean };
    assert.equal(json.ok, false);
  });
});
