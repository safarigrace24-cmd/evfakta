/**
 * CLI CSV import → public.cars (Supabase)
 *
 * Uses the same parser as /admin/import (lib/admin/import/parse-csv.ts).
 * Admin UI is preferred for preview + reports. This script remains for local ops.
 *
 * Run:
 *   npm run import:cars:csv
 *   npm run import:cars:csv -- path/to/file.csv
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCarsFromCsv } from "../lib/admin/import/parse-csv";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));

  const csvArg = process.argv[2];
  const csvPath = resolve(process.cwd(), csvArg || "data/cars-import.csv");

  console.log(`CSV import → public.cars`);
  console.log(`File: ${csvPath}`);

  if (!existsSync(csvPath)) {
    console.error(
      [
        "ERROR: CSV file not found.",
        "Copy the template and fill in your models:",
        "  cp data/cars-import.template.csv data/cars-import.csv",
        "Or use the admin UI: /admin/import/ny",
      ].join("\n"),
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    console.error(
      "ERROR: Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
    process.exit(1);
  }

  const content = readFileSync(csvPath, "utf8");
  const { rows, warnings, errors } = parseCarsFromCsv(content);

  for (const warning of warnings) {
    console.warn(`WARN: ${warning}`);
  }

  if (errors.length > 0) {
    console.error(`ERROR: Validation failed with ${errors.length} issue(s):`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  if (rows.length === 0) {
    console.error("ERROR: No data rows found in CSV.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const payload = rows.map(({ gallery_images: _gallery, ...row }) => row);

  console.log(`Importing ${payload.length} car(s) (upsert on slug)…`);
  console.log("Note: rows stay unpublished; review in /admin/import or /admin/biler.");

  const { data, error } = await supabase
    .from("cars")
    .upsert(payload, { onConflict: "slug" })
    .select("id, slug, brand, model, is_published, import_status");

  if (error) {
    console.error(`ERROR: Supabase upsert failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`SUCCESS: Upserted ${data?.length ?? payload.length} row(s).`);
  for (const row of data ?? []) {
    console.log(
      `  ✓ ${row.slug} (${row.brand} ${row.model}) status=${row.import_status} published=${row.is_published}`,
    );
  }
}

main().catch((error) => {
  console.error("ERROR: Unexpected failure:", error);
  process.exit(1);
});
