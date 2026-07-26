import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatBoolNb,
  parseOptionalBoolean,
  parseTextList,
} from "../lib/admin/field-parsers";
import { parseCarsFromCsv } from "../lib/admin/import/parse-csv";
import { parseCarsFromJson } from "../lib/admin/import/parse-json";
import { buildComparisonRows } from "../lib/compare/comparison";
import type { Car } from "../data/cars";

describe("EV master field parsers", () => {
  it("parses tri-state booleans", () => {
    const empty = parseOptionalBoolean("", "x");
    assert.equal(empty.ok, true);
    if (empty.ok) assert.equal(empty.value, null);

    const yes = parseOptionalBoolean("ja", "x");
    assert.equal(yes.ok, true);
    if (yes.ok) assert.equal(yes.value, true);

    const no = parseOptionalBoolean("nei", "x");
    assert.equal(no.ok, true);
    if (no.ok) assert.equal(no.value, false);

    assert.equal(parseOptionalBoolean("maybe", "x").ok, false);
  });

  it("parses text lists from newlines or pipes", () => {
    assert.deepEqual(parseTextList("a\nb\n"), ["a", "b"]);
    assert.deepEqual(parseTextList("a|b|c"), ["a", "b", "c"]);
    assert.equal(parseTextList(""), null);
  });

  it("formats booleans in Norwegian", () => {
    assert.equal(formatBoolNb(true), "Ja");
    assert.equal(formatBoolNb(false), "Nei");
    assert.equal(formatBoolNb(null), null);
  });
});

describe("CSV/JSON master fields", () => {
  it("keeps legacy CSV headers working without master columns", () => {
    const csv = `slug,brand,model,year,price_nok,range_km,battery_kwh,dc_charging_kw,drivetrain,image_url,description,is_published
legacy-car,Kia,EV6,2025,450000,520,77,240,Firehjulsdrift,/a.webp,"Ok",false
`;
    const parsed = parseCarsFromCsv(csv);
    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.rows[0].heat_pump, null);
    assert.equal(parsed.rows[0].battery_usable_kwh, null);
    assert.equal(parsed.rows[0].variant, null);
  });

  it("parses optional master fields from CSV", () => {
    const csv = `slug,brand,model,year,price_nok,range_km,battery_kwh,dc_charging_kw,drivetrain,image_url,description,is_published,variant,battery_usable_kwh,winter_range_km,heat_pump,pros,suitable_for
master-car,Tesla,Model Y,2025,499990,568,75,250,Firehjulsdrift,/a.webp,"Ok",false,Long Range,75,420,ja,Lang rekkevidde|Romslig,Familie|Pendling
`;
    const parsed = parseCarsFromCsv(csv);
    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.rows[0].variant, "Long Range");
    assert.equal(parsed.rows[0].battery_usable_kwh, 75);
    assert.equal(parsed.rows[0].winter_range_km, 420);
    assert.equal(parsed.rows[0].heat_pump, true);
    assert.deepEqual(parsed.rows[0].pros, ["Lang rekkevidde", "Romslig"]);
    assert.deepEqual(parsed.rows[0].suitable_for, ["Familie", "Pendling"]);
  });

  it("parses master fields from JSON", () => {
    const parsed = parseCarsFromJson(
      JSON.stringify([
        {
          slug: "json-car",
          brand: "VW",
          model: "ID.4",
          year: 2025,
          price_nok: 480000,
          range_km: 500,
          battery_kwh: 77,
          dc_charging_kw: 175,
          drivetrain: "Bakhjulsdrift",
          image_url: "/x.webp",
          description: "Ok",
          is_published: false,
          heat_pump: true,
          v2l: false,
          charging_connector_dc: "CCS2",
          cons: ["Dyrest i klassen"],
        },
      ]),
    );
    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.rows[0].heat_pump, true);
    assert.equal(parsed.rows[0].v2l, false);
    assert.equal(parsed.rows[0].charging_connector_dc, "CCS2");
    assert.deepEqual(parsed.rows[0].cons, ["Dyrest i klassen"]);
  });
});

describe("comparison empty rows", () => {
  it("hides rows where no car has a value", () => {
    const base: Car = {
      slug: "a",
      brand: "A",
      model: "One",
      priceNok: 400000,
      rangeKm: 500,
      batteryKwh: 75,
      dcKw: 200,
      acKw: 11,
      drive: "Forhjulsdrift",
      description: "",
      updated: "2026-07-25",
    };
    const rows = buildComparisonRows(
      [base, { ...base, slug: "b", brand: "B", model: "Two", priceNok: 350000 }],
      { includeHiddenPublicFields: true },
    );
    assert.ok(rows.some((row) => row.key === "priceNok"));
    assert.ok(!rows.some((row) => row.key === "winterRange"));
    assert.ok(!rows.some((row) => row.key === "heatPump"));
  });
});
