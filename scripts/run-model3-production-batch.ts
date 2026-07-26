/**
 * Production batch: Tesla Model 3 reference car.
 * Uses research provider + DB writes (same tables as CMS). Never publishes.
 *
 * Run: node --import tsx scripts/run-model3-production-batch.ts
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runResearchProvider } from "../lib/admin/research/providers";
import { EDITORIAL_DRAFT_MARKER } from "../lib/admin/editorial-assist-core";
import { computeEditorialCompletion } from "../lib/admin/editorial-completion";
import { buildFieldReviewQueue } from "../lib/admin/field-review";
import type { AdminCar } from "../lib/admin/types";
import type {
  ResearchModelProposal,
  ResearchVariantProposal,
} from "../lib/admin/research/types";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
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

loadEnvFile(resolve(process.cwd(), ".env.local"));

const CHECKED_AT = "2026-07-26T08:00:00.000Z";
const BATCH_PATH = resolve(process.cwd(), "data/research-batch-model3-tesla.json");
const REPORT_PATH = resolve(process.cwd(), "docs/PRODUCTION_BATCH_MODEL3.md");

type ConflictValue = {
  value: string | number | boolean;
  source_name: string;
  source_url: string;
  confidence: number;
  notes?: string;
};

type BatchConflict = {
  field_key: string;
  entity_type: "car" | "variant";
  variant_slug?: string;
  message: string;
  values: ConflictValue[];
};

type BatchFile = {
  source_name: string;
  source_url: string;
  cars: Array<Record<string, unknown>>;
  conflicts: BatchConflict[];
};

function sb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureTeslaBrand(client: SupabaseClient) {
  const { data: existing } = await client
    .from("brands")
    .select("id, name, slug, website_url")
    .eq("slug", "tesla")
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await client
    .from("brands")
    .insert({
      name: "Tesla",
      slug: "tesla",
      website_url: "https://www.tesla.com/no_NO",
      country: "US",
      is_active: true,
      description: "Tesla Norge / Tesla, Inc.",
    })
    .select("id, name, slug, website_url")
    .single();
  if (error) throw new Error(`brand insert: ${error.message}`);
  return data;
}

function emptySummary() {
  return {
    modelsFound: 0,
    fieldsFound: 0,
    conflicts: 0,
    warnings: 0,
    missingFields: 0,
    imageCandidates: 0,
    applied: 0,
    rejected: 0,
    approved: 0,
  };
}

async function createJob(
  client: SupabaseClient,
  input: Record<string, unknown>,
) {
  const { data, error } = await client
    .from("research_jobs")
    .insert({
      ...input,
      status: "queued",
      summary: emptySummary(),
      progress_pct: 0,
      progress_message: "I kø",
    })
    .select("*")
    .single();
  if (error) throw new Error(`create job: ${error.message}`);
  return data;
}

async function persistProposal(
  client: SupabaseClient,
  jobId: string,
  proposal: ResearchModelProposal,
  existingCarId: string | null,
) {
  const proposedCar: Record<string, unknown> = {
    slug: proposal.slug,
    brand: proposal.brand,
    model: proposal.model,
    is_published: false,
    import_status: "needs_review",
    country: "NO",
  };
  for (const field of proposal.fields) {
    proposedCar[field.field_key] = field.value;
  }

  const { data: item, error } = await client
    .from("research_items")
    .insert({
      job_id: jobId,
      sort_order: 0,
      slug: proposal.slug,
      brand: proposal.brand,
      model: proposal.model,
      existing_car_id: existingCarId,
      decision: "pending",
      warnings: proposal.warnings,
      missing_fields: proposal.missing_fields,
      conflicts: proposal.conflicts,
      proposed_car: proposedCar,
      proposed_variants: proposal.variants,
      message: existingCarId
        ? "Matcher eksisterende bil (oppdatering)."
        : "Ny modell foreslått.",
    })
    .select("id")
    .single();
  if (error || !item) throw new Error(error?.message || "persist item failed");

  const itemId = item.id as string;
  const fieldRows = [];
  for (const field of proposal.fields) {
    const hasConflict = proposal.conflicts.some(
      (conflict) =>
        conflict.entity_type === "car" && conflict.field_key === field.field_key,
    );
    fieldRows.push({
      item_id: itemId,
      entity_type: "car",
      variant_slug: null,
      field_key: field.field_key,
      proposed_value: field.value,
      source_name: field.source.source_name,
      source_url: field.source.source_url,
      retrieved_at: field.source.retrieved_at,
      confidence: field.source.confidence,
      status: hasConflict ? "conflict" : "pending",
      conflict_group: hasConflict ? field.field_key : null,
      notes: field.notes ?? null,
    });
  }
  for (const variant of proposal.variants) {
    for (const field of variant.fields) {
      fieldRows.push({
        item_id: itemId,
        entity_type: "variant",
        variant_slug: variant.slug,
        field_key: field.field_key,
        proposed_value: field.value,
        source_name: field.source.source_name,
        source_url: field.source.source_url,
        retrieved_at: field.source.retrieved_at,
        confidence: field.source.confidence,
        status: "pending",
        conflict_group: null,
        notes: field.notes ?? null,
      });
    }
  }
  if (fieldRows.length) {
    const { error: fieldError } = await client
      .from("research_field_candidates")
      .insert(fieldRows);
    if (fieldError) throw new Error(fieldError.message);
  }
  if (proposal.images.length) {
    const { error: imageError } = await client.from("research_image_candidates").insert(
      proposal.images.map((image) => ({
        item_id: itemId,
        original_url: image.original_url,
        source_name: image.source_name ?? null,
        source_url: image.source_url ?? null,
        license_note: image.license_note ?? null,
        usage_terms: image.usage_terms ?? null,
        alt_text: image.alt_text ?? null,
        image_type: image.image_type ?? "other",
        is_primary_candidate: Boolean(image.is_primary_candidate),
        status: "pending",
        notes: image.notes ?? null,
      })),
    );
    if (imageError) throw new Error(imageError.message);
  }
  return itemId;
}

async function insertConflicts(
  client: SupabaseClient,
  itemId: string,
  conflicts: BatchConflict[],
) {
  const rows = [];
  for (const conflict of conflicts) {
    for (const value of conflict.values) {
      rows.push({
        item_id: itemId,
        entity_type: conflict.entity_type,
        variant_slug: conflict.variant_slug ?? null,
        field_key: conflict.field_key,
        proposed_value: value.value,
        source_name: value.source_name,
        source_url: value.source_url,
        retrieved_at: CHECKED_AT,
        confidence: value.confidence,
        status: "conflict",
        conflict_group:
          conflict.entity_type === "variant"
            ? `${conflict.variant_slug}:${conflict.field_key}`
            : conflict.field_key,
        notes: [conflict.message, value.notes].filter(Boolean).join(" | "),
      });
    }
  }
  if (!rows.length) return;
  const { error } = await client.from("research_field_candidates").insert(rows);
  if (error) throw new Error(`conflict insert: ${error.message}`);
}

async function upsertVariants(
  client: SupabaseClient,
  carId: string,
  variants: ResearchVariantProposal[],
) {
  for (let index = 0; index < variants.length; index += 1) {
    const variant = variants[index];
    const row: Record<string, unknown> = {
      car_id: carId,
      name: variant.name,
      slug: variant.slug,
      is_default: Boolean(variant.is_default) || index === 0,
      is_active: false,
      sort_order: index,
      import_status: "needs_review",
      import_notes:
        "Inactive until editor confirms specs against Tesla Norge. Do not guess WLTP/battery.",
      source_name: "Tesla Norge (pending confirmation)",
      source_url: "https://www.tesla.com/no_NO/model3",
      data_last_checked_at: CHECKED_AT,
    };
    for (const field of variant.fields) {
      row[field.field_key] = field.value;
    }
    const { data: existing } = await client
      .from("car_variants")
      .select("id")
      .eq("car_id", carId)
      .eq("slug", variant.slug)
      .maybeSingle();
    if (existing?.id) {
      await client.from("car_variants").update(row).eq("id", existing.id);
    } else {
      await client.from("car_variants").insert(row);
    }
  }
}

async function main() {
  const batch = JSON.parse(readFileSync(BATCH_PATH, "utf8")) as BatchFile;
  const client = sb();
  const brand = await ensureTeslaBrand(client);

  console.log("1) Live manufacturer research (expect block)…");
  const liveJob = await createJob(client, {
    brand_id: brand.id,
    brand_name: "Tesla",
    model_query: "Model 3",
    provider_key: "manufacturer_http",
    source_mode: "live",
    source_name: "Tesla Norge",
    source_url: "https://www.tesla.com/no_NO/model3",
    options: { production_batch: "model3-reference" },
  });

  await client
    .from("research_jobs")
    .update({ status: "running", progress_pct: 10, progress_message: "Starter…" })
    .eq("id", liveJob.id);

  const liveProvider = await runResearchProvider("manufacturer_http", {
    brandId: brand.id,
    brandName: "Tesla",
    modelQuery: "Model 3",
    sourceName: "Tesla Norge",
    sourceUrl: "https://www.tesla.com/no_NO/model3",
  });

  const liveStatus =
    liveProvider.blocked || liveProvider.models.length === 0
      ? "awaiting_manual"
      : "needs_review";
  await client
    .from("research_jobs")
    .update({
      status: liveStatus,
      provider_key: liveStatus === "awaiting_manual" ? "manual" : "manufacturer_http",
      source_mode: liveStatus === "awaiting_manual" ? "manual_paste" : "live",
      progress_pct: liveStatus === "awaiting_manual" ? 35 : 100,
      progress_message:
        liveStatus === "awaiting_manual"
          ? "Venter på manuell kilde (Tesla blokkerte live-tilgang)"
          : "Klar for gjennomgang",
      error_message: null,
      options: {
        production_batch: "model3-reference",
        live_blocked: liveStatus === "awaiting_manual",
        blocked_reason:
          liveProvider.progressMessage ||
          liveProvider.errors.join(" ") ||
          "No models from live fetch",
        original_provider: "manufacturer_http",
      },
      completed_at:
        liveStatus === "awaiting_manual" ? null : new Date().toISOString(),
    })
    .eq("id", liveJob.id);
  console.log("   live job:", liveJob.id, liveStatus, liveProvider.errors);

  console.log("2) Structured research from official-manual batch JSON…");
  const structuredPayload = {
    source_name: batch.source_name,
    source_url: batch.source_url,
    cars: batch.cars,
  };
  const structuredJob = await createJob(client, {
    brand_id: brand.id,
    brand_name: "Tesla",
    model_query: "Model 3",
    provider_key: "structured_json",
    source_mode: "structured",
    source_name: batch.source_name,
    source_url: batch.source_url,
    filename: "research-batch-model3-tesla.json",
    raw_input: JSON.stringify(structuredPayload),
    options: {
      production_batch: "model3-reference",
      live_job_id: liveJob.id,
      data_last_checked_at: CHECKED_AT,
    },
  });

  await client
    .from("research_jobs")
    .update({ status: "running", progress_pct: 20, progress_message: "Parser JSON…" })
    .eq("id", structuredJob.id);

  const structured = await runResearchProvider("structured_json", {
    brandName: "Tesla",
    modelQuery: "Model 3",
    sourceName: batch.source_name,
    sourceUrl: batch.source_url,
    rawInput: JSON.stringify(structuredPayload),
    filename: "research-batch-model3-tesla.json",
  });
  if (!structured.models.length) {
    throw new Error(`structured failed: ${structured.errors.join(" ")}`);
  }
  const proposal = structured.models[0];
  const itemId = await persistProposal(client, structuredJob.id, proposal, null);
  await insertConflicts(client, itemId, batch.conflicts);

  const summary = emptySummary();
  summary.modelsFound = 1;
  summary.fieldsFound = proposal.fields.length;
  summary.conflicts = batch.conflicts.length;
  summary.missingFields = proposal.missing_fields.length;
  summary.imageCandidates = proposal.images.length;

  await client
    .from("research_items")
    .update({
      conflicts: batch.conflicts,
      warnings: [
        ...proposal.warnings,
        ...batch.conflicts.map((conflict) => conflict.message),
      ],
      missing_fields: [
        "range_km",
        "battery_usable_kwh",
        "battery_total_kwh",
        "consumption_kwh_100km",
        "dc_charging_kw",
        "ac_charging_kw",
        "charge_time_10_80_minutes",
        "power_hp",
        "acceleration_0_100",
        "cargo_l",
        "towing_kg",
        "length_mm",
        "height_mm",
        "width_mm",
        "warranty",
        "image_url",
      ],
      decision: "approved",
    })
    .eq("id", itemId);

  await client
    .from("research_jobs")
    .update({
      status: "needs_review",
      summary,
      progress_pct: 100,
      progress_message: "Klar for gjennomgang",
      completed_at: new Date().toISOString(),
    })
    .eq("id", structuredJob.id);
  console.log("   structured job:", structuredJob.id, "item:", itemId);

  console.log("3) Apply safe fields to cars (never publish)…");
  const fieldSources: Record<string, unknown> = {};
  const carRow: Record<string, unknown> = {
    slug: "tesla-model-3",
    brand: "Tesla",
    brand_id: brand.id,
    model: "Model 3",
    model_generation: "Highland",
    country: "NO",
    is_published: false,
    import_status: "needs_review",
    source_name: "Tesla Norge + Tesla Owner's Manual (Europe)",
    source_url: "https://www.tesla.com/no_NO/model3",
    source_updated_at: CHECKED_AT,
    data_last_checked_at: CHECKED_AT,
    imported_at: CHECKED_AT,
  };

  for (const field of proposal.fields) {
    if ((field.source.confidence ?? 0) < 0.8) continue;
    if (
      batch.conflicts.some(
        (conflict) =>
          conflict.entity_type === "car" && conflict.field_key === field.field_key,
      )
    ) {
      continue;
    }
    carRow[field.field_key] = field.value;
    fieldSources[field.field_key] = {
      source_name: field.source.source_name,
      source_url: field.source.source_url,
      imported_at: CHECKED_AT,
      research_job_id: structuredJob.id,
      confidence: field.source.confidence,
      retrieved_at: field.source.retrieved_at ?? CHECKED_AT,
      data_last_checked_at: CHECKED_AT,
      review_status: "pending",
      notes: field.notes ?? null,
    };
    await client
      .from("research_field_candidates")
      .update({ status: "applied" })
      .eq("item_id", itemId)
      .eq("entity_type", "car")
      .eq("field_key", field.field_key)
      .eq("status", "pending");
  }

  const description = String(batch.cars[0]?.description ?? "");
  const pros = [
    "Offisiell EU-manual dokumenterer praktisk bagasjevolum inkludert frunk (88 l).",
    "CCS2-ladeport for Europa er dokumentert i Tesla-manualen.",
    "Varmepumpe er forventet på Highland-generasjonen (etter ca. oktober 2020) ifølge Tesla-manualens klimasystemskille.",
    EDITORIAL_DRAFT_MARKER,
  ];
  const cons = [
    "Variantspesifikke WLTP-/batteritall er ikke bekreftet mot Tesla Norge i denne batchen (live-side blokkert).",
    "Tilhengervekt kan ikke lagres som én verdi — manualen skiller 750 kg / 1000 kg.",
    "Lengde og høyde varierer mellom RWD/Long Range og Performance i Tesla-manualen.",
    EDITORIAL_DRAFT_MARKER,
  ];
  const suitableFor = [
    "Pendling",
    "Familie (5 seter)",
    "Lengre turer (når variantrekkevidde er bekreftet)",
    "Vinterkjøring med varmepumpe (kvalitativt — tall mangler)",
    EDITORIAL_DRAFT_MARKER,
  ];

  Object.assign(carRow, {
    description,
    pros,
    cons,
    suitable_for: suitableFor,
    field_sources: {
      ...fieldSources,
      description: {
        source_name: "EVFAKTA editorial draft",
        source_url: batch.source_url,
        imported_at: CHECKED_AT,
        research_job_id: structuredJob.id,
        confidence: 0.4,
        retrieved_at: CHECKED_AT,
        data_last_checked_at: CHECKED_AT,
        review_status: "pending",
        draft: true,
        notes: EDITORIAL_DRAFT_MARKER,
      },
      pros: {
        source_name: "EVFAKTA editorial draft",
        source_url: null,
        imported_at: CHECKED_AT,
        research_job_id: structuredJob.id,
        confidence: 0.35,
        retrieved_at: CHECKED_AT,
        data_last_checked_at: CHECKED_AT,
        review_status: "pending",
        draft: true,
        notes: EDITORIAL_DRAFT_MARKER,
      },
      cons: {
        source_name: "EVFAKTA editorial draft",
        source_url: null,
        imported_at: CHECKED_AT,
        research_job_id: structuredJob.id,
        confidence: 0.35,
        retrieved_at: CHECKED_AT,
        data_last_checked_at: CHECKED_AT,
        review_status: "pending",
        draft: true,
        notes: EDITORIAL_DRAFT_MARKER,
      },
      suitable_for: {
        source_name: "EVFAKTA editorial draft",
        source_url: null,
        imported_at: CHECKED_AT,
        research_job_id: structuredJob.id,
        confidence: 0.35,
        retrieved_at: CHECKED_AT,
        data_last_checked_at: CHECKED_AT,
        review_status: "pending",
        draft: true,
        notes: EDITORIAL_DRAFT_MARKER,
      },
    },
    import_notes: [
      "PRODUCTION BATCH Model 3 reference — needs_review.",
      `Live research job: ${liveJob.id} (${liveStatus}).`,
      `Structured research job: ${structuredJob.id}.`,
      "Conflicts left unresolved (length/height/cargo/towing/battery/warranty/width).",
      "Variants inactive until reviewed.",
      "No images attached/published.",
      "Prices and EVFAKTA scores remain hidden in public UI.",
    ].join(" "),
  });

  const { data: upserted, error: upsertError } = await client
    .from("cars")
    .upsert(carRow, { onConflict: "slug" })
    .select("id, slug")
    .single();
  if (upsertError || !upserted) {
    throw new Error(upsertError?.message || "car upsert failed");
  }

  await upsertVariants(client, upserted.id as string, proposal.variants);

  // Ensure all four market-relevant shells exist, inactive.
  const wanted = [
    {
      name: "Rear-Wheel Drive",
      slug: "rear-wheel-drive",
      drivetrain: "Bakhjulsdrift",
      is_default: true,
      sort_order: 0,
    },
    {
      name: "Long Range RWD",
      slug: "long-range-rwd",
      drivetrain: "Bakhjulsdrift",
      is_default: false,
      sort_order: 1,
    },
    {
      name: "Long Range AWD",
      slug: "long-range-awd",
      drivetrain: "Firehjulsdrift",
      is_default: false,
      sort_order: 2,
    },
    {
      name: "Performance",
      slug: "performance",
      drivetrain: "Firehjulsdrift",
      is_default: false,
      sort_order: 3,
    },
  ];
  const { data: existingVariants } = await client
    .from("car_variants")
    .select("slug")
    .eq("car_id", upserted.id);
  const have = new Set((existingVariants ?? []).map((row) => row.slug as string));
  for (const variant of wanted) {
    if (have.has(variant.slug)) continue;
    await client.from("car_variants").insert({
      car_id: upserted.id,
      ...variant,
      is_active: false,
      import_status: "needs_review",
      source_name: "Tesla Norge (pending confirmation)",
      source_url: "https://www.tesla.com/no_NO/model3",
      data_last_checked_at: CHECKED_AT,
      import_notes: "Shell created in production batch — specs empty on purpose.",
    });
  }
  await client
    .from("car_variants")
    .update({
      is_active: false,
      import_status: "needs_review",
      price_nok: null,
    })
    .eq("car_id", upserted.id);
  await client
    .from("car_variants")
    .update({ is_default: false })
    .eq("car_id", upserted.id);
  await client
    .from("car_variants")
    .update({ is_default: true })
    .eq("car_id", upserted.id)
    .eq("slug", "rear-wheel-drive");

  await client
    .from("research_items")
    .update({
      decision: "applied",
      existing_car_id: upserted.id,
      message: "Anvendt som needs_review (ikke publisert).",
    })
    .eq("id", itemId);

  summary.applied = 1;
  summary.approved = 1;
  await client
    .from("research_jobs")
    .update({ summary, status: "completed" })
    .eq("id", structuredJob.id);

  console.log("4) Load completion + write report…");
  const { data: car } = await client.from("cars").select("*").eq("id", upserted.id).single();
  const { data: variants } = await client
    .from("car_variants")
    .select("*")
    .eq("car_id", upserted.id)
    .order("sort_order");
  const { data: images } = await client
    .from("car_images")
    .select("*")
    .eq("car_id", upserted.id);
  const { data: fieldCandidates } = await client
    .from("research_field_candidates")
    .select("*")
    .eq("item_id", itemId);
  const { data: imageCandidates } = await client
    .from("research_image_candidates")
    .select("*")
    .eq("item_id", itemId);

  const adminCar = car as AdminCar;
  const completion = computeEditorialCompletion({
    car: adminCar,
    images: (images ?? []) as never[],
    variants: (variants ?? []) as never[],
  });
  const reviewCards = buildFieldReviewQueue(adminCar);
  const conflictRows = (fieldCandidates ?? []).filter(
    (row) => row.status === "conflict",
  );

  const populatedEntries = Object.entries({
    brand: adminCar.brand,
    model: adminCar.model,
    slug: adminCar.slug,
    model_generation: adminCar.model_generation,
    vehicle_type: adminCar.vehicle_type,
    body_style: adminCar.body_style,
    seats: adminCar.seats,
    frunk_l: adminCar.frunk_l,
    wheelbase_mm: adminCar.wheelbase_mm,
    heat_pump: adminCar.heat_pump,
    charging_connector_ac: adminCar.charging_connector_ac,
    charging_connector_dc: adminCar.charging_connector_dc,
    description: adminCar.description,
    pros: adminCar.pros,
    cons: adminCar.cons,
    suitable_for: adminCar.suitable_for,
    source_name: adminCar.source_name,
    source_url: adminCar.source_url,
    data_last_checked_at: adminCar.data_last_checked_at,
    import_status: adminCar.import_status,
    is_published: adminCar.is_published,
  }).filter(([, value]) => {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });

  const report = `# Production batch: Tesla Model 3 (reference car)

**Date checked:** 2026-07-26  
**Car id:** \`${upserted.id}\`  
**Slug:** \`tesla-model-3\`  
**Status:** \`needs_review\`, \`is_published=false\`  
**Public prices/scores:** still hidden (\`PUBLIC_SHOW_PRICES=false\`, \`PUBLIC_SHOW_SCORES=false\`)

## Jobs

| Step | Job id | Status |
|------|--------|--------|
| Live Tesla Norge fetch | \`${liveJob.id}\` | \`${liveStatus}\` |
| Structured official-manual JSON | \`${structuredJob.id}\` | \`completed\` (item applied as needs_review) |

## Finding

No prior \`tesla-model-3\` row existed in Supabase. This batch created the reference car via the research tables + apply path. Live Tesla Norge fetch did not yield usable specs (blocked / empty) and was left as \`awaiting_manual\`.

## Fields populated (applied to car)

| Field | Value |
|-------|-------|
${populatedEntries
  .map(([key, value]) => {
    const shown = Array.isArray(value)
      ? value.join("; ")
      : typeof value === "string"
        ? value.replace(/\n/g, " / ")
        : String(value);
    return `| \`${key}\` | ${shown.slice(0, 220)}${shown.length > 220 ? "…" : ""} |`;
  })
  .join("\n")}

### Variants (all inactive / needs_review)

${(variants ?? [])
  .map(
    (variant) =>
      `- \`${variant.slug}\` — ${variant.name} — drivetrain=${variant.drivetrain ?? "—"} — active=${variant.is_active} — default=${variant.is_default}`,
  )
  .join("\n")}

## Sources used

1. **Tesla Norge** — https://www.tesla.com/no_NO/model3 — preferred, live blocked; kept as primary source pointer on the car.
2. **Tesla Model 3 Owner's Manual (Europe)** — https://www.tesla.com/ownersmanual/model3/en_eu/Owners_Manual.pdf — applied facts (frunk, wheelbase, seats context, connectors, heat-pump generation context).
3. **Tesla Owner's Manual heat-pump note** — https://www.tesla.com/ownersmanual/2017_2023_model3/en_us/GUID-ECA7C07B-7944-496B-8FC5-12762BF061F1.html
4. **Secondary only (conflicts, not applied as facts):** EV-Database, EVKX.net, NAF/Motor summer-test coverage, Elbil RADAR, secondary warranty blogs.

Batch file: \`data/research-batch-model3-tesla.json\`

## Conflicts (unresolved)

${conflictRows
  .map(
    (row) =>
      `- **${row.entity_type}${row.variant_slug ? `:${row.variant_slug}` : ""}.\`${row.field_key}\`** = \`${JSON.stringify(row.proposed_value)}\` · confidence=${row.confidence ?? "—"} · ${row.source_name ?? "—"} · ${(row.notes as string | null) ?? ""}`,
  )
  .join("\n")}

## Missing fields

Editorial completion: **${completion.percent}%** (${completion.completedCount}/${completion.totalCount}). Publish ready: **${completion.canPublish ? "yes" : "no"}**.

Checklist missing:

${completion.missing.map((label) => `- ${label}`).join("\n") || "- (none)"}

Still empty on car (intentionally, awaiting Tesla Norge / conflict resolution):

- range_km, winter_range_km, real_world_range_km
- battery_total_kwh, battery_usable_kwh, battery_chemistry, battery_kwh
- consumption_kwh_100km
- ac_charging_kw, dc_charging_kw, charge_time_10_80_minutes
- power_hp, torque_nm, acceleration_0_100, top_speed_kmh
- length_mm, height_mm, width_mm
- cargo_l, towing_kg, warranty
- image_url / approved gallery images
- price_nok / EVFAKTA scores (kept empty / hidden)

## Image candidates (not attached)

${(imageCandidates ?? [])
  .map(
    (image) =>
      `- [${image.image_type}] ${image.alt_text ?? image.original_url} — ${image.source_name ?? "—"} — status=${image.status} — ${image.license_note ?? ""}`,
  )
  .join("\n")}

Attached \`car_images\` rows: **${(images ?? []).length}** (must stay 0 until approval).

## Field review queue (lowest confidence first)

${reviewCards
  .slice(0, 25)
  .map(
    (card) =>
      `- \`${card.fieldKey}\` confidence=${card.confidence ?? "null"} status=${card.reviewStatus} low=${card.lowConfidence} draft=${card.isDraft}`,
  )
  .join("\n")}

## Exact manual review steps

1. Open \`/admin/import/research/${structuredJob.id}\` and resolve every **conflict** candidate (do not auto-pick winners).
2. Continue the live job \`/admin/import/research/${liveJob.id}\` with a human-captured Tesla Norge / PDF paste once access works.
3. Open \`/admin/biler/${upserted.id}/rediger\`:
   - Overview → field review cards (sorted lowest confidence first)
   - Rewrite editorial drafts (description / pros / cons / suitable_for)
4. Specifications: enter only Tesla Norge / CoC-backed numbers; leave blanks when unsure.
5. Variants (\`/admin/biler/${upserted.id}/varianter\`): fill each inactive trim, then activate only after review.
6. Images: download official stills; attach front/rear/side/interior/cargo with source notes; do not publish yet.
7. Sources: finalize \`source_name\`, \`source_url\`, \`data_last_checked_at\`.
8. Keep **Needs Review** until conflicts cleared → **Approved** → separate **Publish** action.
9. Confirm public UI still hides prices and EVFAKTA scores.

## Hard rules respected

- No schema changes
- No new platform features
- No invented specs applied as facts
- No auto-publish / no image attach
- Conflicts preserved for humans
`;

  writeFileSync(REPORT_PATH, report, "utf8");
  console.log("Report:", REPORT_PATH);
  console.log(
    "Done.",
    "car=",
    upserted.id,
    "completion=",
    `${completion.percent}%`,
    "conflicts=",
    conflictRows.length,
    "variants=",
    (variants ?? []).length,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
