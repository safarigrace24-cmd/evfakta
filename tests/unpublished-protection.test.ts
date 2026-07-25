import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("unpublished car protection", () => {
  it("public car fetch helpers always filter is_published = true", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/cars/get-published-cars.ts"),
      "utf8",
    );
    const publishedFilters = source.match(/\.eq\("is_published", true\)/g) ?? [];
    assert.ok(
      publishedFilters.length >= 4,
      "expected multiple is_published=true filters in public car queries",
    );
    assert.doesNotMatch(source, /\.eq\("is_published", false\)/);
  });

  it("brand public policy requires active brands", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260725170000_create_brands.sql"),
      "utf8",
    );
    assert.match(migration, /is_active = true/);
  });
});
