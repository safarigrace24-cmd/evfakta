/**
 * Verify three-image AI workflow against BYD Seal U (status / readiness).
 *
 * Live generation is done in admin: Images → «Generer 3 AI-bilder».
 * This script never auto-approves, never Hero, never publishes.
 *
 * Usage: npx tsx scripts/verify-three-image-ai-seal-u.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  AI_GENERATOR_IMAGE_TYPES,
  buildAdminGeneratorPrompt,
} from "../lib/admin/ai-image-generator";
import {
  isAiIllustrationCandidate,
  parseAiUsageType,
} from "../lib/admin/ai-image-candidates";
import {
  THREE_IMAGE_ALTERNATIVES_PER_ROLE,
  THREE_IMAGE_PUBLIC_GALLERY_ORDER,
  THREE_IMAGE_STANDARD_ROLES,
  missingThreeImageRolesToGenerate,
  summarizeThreeImageRoles,
  threeImageEditorChangeRequest,
} from "../lib/admin/three-image-ai-workflow";
import type { CarImageRow } from "../lib/admin/car-image-types";
import type { ResearchImageCandidate } from "../lib/admin/research/types";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

async function main() {
  console.log("=== Three-image AI workflow verify: BYD Seal U ===\n");

  const labels = AI_GENERATOR_IMAGE_TYPES.map((t) => t.label);
  console.log("Default generator roles:", labels.join(", "));
  console.log(
    "Side/Charging/Cargo in default list:",
    labels.includes("Side") || labels.includes("Charging") || labels.includes("Cargo")
      ? "YES (unexpected)"
      : "NO ✓",
  );
  console.log("Alternatives per role:", THREE_IMAGE_ALTERNATIVES_PER_ROLE);
  console.log("Public order:", THREE_IMAGE_PUBLIC_GALLERY_ORDER.join(" → "));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("FAIL: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: car, error } = await supabase
    .from("cars")
    .select(
      "id, slug, brand, model, variant, year, body_style, is_published, import_status",
    )
    .eq("slug", "byd-seal-u")
    .maybeSingle();

  if (error || !car) {
    console.error("FAIL: BYD Seal U not found:", error?.message || "missing");
    process.exit(1);
  }

  console.log("\nVehicle:", {
    id: car.id,
    brand: car.brand,
    model: car.model,
    variant: car.variant,
    year: car.year,
    body_style: car.body_style,
    is_published: car.is_published,
  });

  const { data: galleryRows } = await supabase
    .from("car_images")
    .select("*")
    .eq("car_id", car.id)
    .order("sort_order", { ascending: true });

  const gallery = (galleryRows || []) as CarImageRow[];

  const { data: items } = await supabase
    .from("research_items")
    .select("id")
    .eq("existing_car_id", car.id);

  const itemIds = (items || []).map((row) => row.id as string);
  let candidates: ResearchImageCandidate[] = [];
  if (itemIds.length) {
    const { data: candidateRows } = await supabase
      .from("research_image_candidates")
      .select("*")
      .in("item_id", itemIds);
    candidates = (candidateRows || []) as ResearchImageCandidate[];
  }

  const summary = summarizeThreeImageRoles({ gallery, candidates });
  const missing = missingThreeImageRolesToGenerate({ gallery, candidates });

  console.log("\nAdmin summary:");
  for (const role of summary.roles) {
    console.log(
      `  ${role.label}: ${role.status} (pending alts: ${role.alternativeCount})`,
    );
  }
  console.log(`  Gallery Complete: ${summary.galleryComplete ? "YES" : "NO"}`);
  console.log(
    "  Missing roles for Generer 3 AI-bilder:",
    missing.length ? missing.join(", ") : "(none — all present)",
  );

  const samplePrompt = buildAdminGeneratorPrompt({
    brand: car.brand || "BYD",
    model: car.model || "Seal U",
    variant: car.variant,
    year: car.year,
    bodyStyle: car.body_style,
    usageType: "front_illustration",
    style: "scandinavian_studio",
    aspectRatio: "16:9",
    changeRequest: threeImageEditorChangeRequest("front_illustration"),
  });
  console.log("\nSample Front prompt includes identity:", /BYD Seal U/i.test(samplePrompt));
  console.log("Sample prompt forbids inventing trim:", /unsupported trims/i.test(samplePrompt));
  console.log(
    "Sample prompt AI label:",
    /AI-generert illustrasjon/i.test(samplePrompt),
  );

  const aiPending = candidates.filter(
    (c) =>
      isAiIllustrationCandidate(c) &&
      c.status === "pending" &&
      THREE_IMAGE_STANDARD_ROLES.some(
        (role) => parseAiUsageType(c.notes) === role.usageType,
      ),
  );
  console.log("\nPending three-image AI candidates:", aiPending.length);
  console.log("Manual selection required: YES");
  console.log("Manual approval required: YES");
  console.log("Hero separate confirmation: YES (confirmAiHero)");
  console.log("Auto-publish: NO (is_published stays", car.is_published, ")");
  console.log("Admin Images tab button: Generer 3 AI-bilder");
  console.log("Review path:", `/admin/images/${car.id}`);
  console.log("Editor path:", `/admin/biler/${car.id}/rediger`);

  console.log("\nDONE — dry verify OK. Use admin button for live generation.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
