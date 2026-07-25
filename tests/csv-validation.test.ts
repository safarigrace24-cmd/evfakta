import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Tesla CSV template", () => {
  it("includes required importer and review columns", () => {
    const csv = readFileSync(
      resolve(process.cwd(), "data/cars-import-tesla.csv"),
      "utf8",
    );
    const header = csv.split(/\r?\n/)[0] ?? "";
    for (const col of [
      "slug",
      "brand",
      "model",
      "is_published",
      "source_name",
      "source_url",
      "data_last_checked_at",
      "import_status",
      "import_notes",
      "range_km",
      "consumption_kwh_100km",
    ]) {
      assert.ok(header.includes(col), `missing column ${col}`);
    }
  });

  it("keeps rows unpublished and needs_review", () => {
    const csv = readFileSync(
      resolve(process.cwd(), "data/cars-import-tesla.csv"),
      "utf8",
    );
    const rows = csv.trim().split(/\r?\n/).slice(1);
    assert.ok(rows.length >= 9);
    for (const row of rows) {
      assert.match(row, /,false,/);
      assert.match(row, /,needs_review,/);
    }
  });
});
