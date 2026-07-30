/**
 * Audit locked manufacturers for empty/invalid dropdown enum fields.
 * Usage: npx tsx scripts/audit-dropdown-enums.ts
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BODY_STYLE_OPTIONS,
  DRIVETRAIN_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from "../lib/admin/types";

const BRANDS = [
  "Volkswagen",
  "Volvo",
  "Tesla",
  "BMW",
  "Audi",
  "Kia",
  "Hyundai",
  "Toyota",
] as const;

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

function issue(
  field: string,
  value: string | null | undefined,
  allowed: readonly string[],
): string | null {
  const v = value?.trim() ?? "";
  if (!v) return `${field}=EMPTY (shows Velg …)`;
  if (!(allowed as readonly string[]).includes(v)) {
    return `${field}=INVALID("${v}")`;
  }
  return null;
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");

  const sb = createClient(url, key);
  const { data, error } = await sb
    .from("cars")
    .select(
      "id,slug,brand,model,import_status,is_published,vehicle_type,body_style,drivetrain",
    )
    .in("brand", [...BRANDS])
    .order("brand")
    .order("model");
  if (error) throw error;

  const rows = data ?? [];
  console.log(`Audited ${rows.length} cars across locked brands\n`);

  const problems: Array<{
    slug: string;
    brand: string;
    status: string | null;
    issues: string[];
    vehicle_type: string | null;
    body_style: string | null;
    drivetrain: string | null;
  }> = [];

  for (const row of rows) {
    const issues = [
      issue("vehicle_type", row.vehicle_type, VEHICLE_TYPE_OPTIONS),
      issue("body_style", row.body_style, BODY_STYLE_OPTIONS),
      // drivetrain may be empty on car if only on variants — flag empty on approved
      row.import_status === "approved"
        ? issue("drivetrain", row.drivetrain, DRIVETRAIN_OPTIONS)
        : row.drivetrain?.trim() &&
            !(DRIVETRAIN_OPTIONS as readonly string[]).includes(row.drivetrain.trim())
          ? `drivetrain=INVALID("${row.drivetrain}")`
          : null,
    ].filter(Boolean) as string[];

    if (issues.length) {
      problems.push({
        slug: row.slug,
        brand: row.brand,
        status: row.import_status,
        issues,
        vehicle_type: row.vehicle_type,
        body_style: row.body_style,
        drivetrain: row.drivetrain,
      });
    }
  }

  const approvedProblems = problems.filter((p) => p.status === "approved");
  console.log("=== APPROVED with dropdown issues ===");
  for (const p of approvedProblems) {
    console.log(
      `${p.brand} ${p.slug}: ${p.issues.join("; ")} | vt=${p.vehicle_type} bs=${p.body_style} dt=${p.drivetrain}`,
    );
  }
  console.log(`\nApproved problems: ${approvedProblems.length}`);
  console.log(`All-status problems: ${problems.length}`);

  console.log("\n=== Distinct vehicle_type ===");
  const vt = new Map<string, number>();
  for (const r of rows) {
    const k = r.vehicle_type ?? "(null)";
    vt.set(k, (vt.get(k) ?? 0) + 1);
  }
  console.log([...vt.entries()].sort((a, b) => b[1] - a[1]));

  console.log("\n=== Distinct body_style ===");
  const bs = new Map<string, number>();
  for (const r of rows) {
    const k = r.body_style ?? "(null)";
    bs.set(k, (bs.get(k) ?? 0) + 1);
  }
  console.log([...bs.entries()].sort((a, b) => b[1] - a[1]));

  console.log("\nAllowed VEHICLE_TYPE_OPTIONS:", VEHICLE_TYPE_OPTIONS);
  console.log("Allowed BODY_STYLE_OPTIONS:", BODY_STYLE_OPTIONS);
  console.log("Allowed DRIVETRAIN_OPTIONS:", DRIVETRAIN_OPTIONS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
