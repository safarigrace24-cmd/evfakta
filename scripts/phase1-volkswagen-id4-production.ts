/**
 * Phase 1 production batch — Volkswagen ID.4
 * Editorial finalize + image label correction + gallery attach.
 * Never invents specs. Does not auto-publish.
 *
 * Usage: npx tsx scripts/phase1-volkswagen-id4-production.ts
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildCarImageStoragePath,
  resolveStorageRole,
} from "../lib/admin/image-production";
import {
  IMAGE_BUCKET,
  publicUrlForCarImagePath,
} from "../lib/admin/image-review-preview";

const CAR_ID = "c8c17bab-7248-46f9-8cc9-e7ed36a42706";
const SLUG = "volkswagen-id-4";
const BRAND = "Volkswagen";

/** Visually verified Newsroom set (2026-07-28 review). Album labels were wrong. */
const KEEP = {
  /** Front three-quarter → Hero + Front */
  frontHero: "8cb773d9-4b97-45cc-8d50-f25421045dd0",
  /** True side profile (was mislabeled rear) */
  side: "4243104e-d61a-4a94-a57d-642c55e49568",
  /** Rear three-quarter (was mislabeled side) */
  rear: "ee65e3ed-246a-4a06-ac80-ccaa22ed9b88",
  /** Verified cabin interior */
  interior: "9c4a2909-49db-4d6a-91e4-914c06061edb",
  /** Second interior angle — keep as other */
  otherInterior: "2477386e-dd69-45f3-a97a-cdb89a905306",
} as const;

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

function appendNote(notes: string | null | undefined, marker: string): string {
  const existing = notes?.trim() || "";
  if (existing.includes(marker)) return existing;
  return existing ? `${existing} | ${marker}` : marker;
}

async function applyApprovedCandidate(
  sb: SupabaseClient,
  input: {
    carId: string;
    slug: string;
    brand: string;
    image: {
      id: string;
      status: string;
      storage_path: string | null;
      image_type: string | null;
      is_primary_candidate: boolean;
      alt_text: string | null;
      notes: string | null;
      license_note: string | null;
      source_name: string | null;
      source_url: string | null;
      original_url: string | null;
      applied_image_id: string | null;
    };
    sortOrder: number;
  },
): Promise<{ ok: true; galleryImageId: string } | { ok: false; error: string }> {
  const image = input.image;
  if (image.status !== "approved") {
    return { ok: false, error: "Bildet er ikke godkjent." };
  }
  if (image.applied_image_id) {
    return { ok: true, galleryImageId: image.applied_image_id };
  }
  if (!image.storage_path?.trim()) {
    return { ok: false, error: "Mangler lokal review-kopi." };
  }

  const role = resolveStorageRole({
    isPrimary: image.is_primary_candidate,
    imageType: image.image_type,
  });
  const galleryPath = buildCarImageStoragePath({
    brand: input.brand,
    modelSlug: input.slug,
    role,
    uniqueId: randomUUID(),
  });

  const { error: copyError } = await sb.storage
    .from(IMAGE_BUCKET)
    .copy(image.storage_path, galleryPath);

  if (copyError) {
    const { data, error: downloadError } = await sb.storage
      .from(IMAGE_BUCKET)
      .download(image.storage_path);
    if (downloadError || !data) {
      return {
        ok: false,
        error: downloadError?.message || "Review-kopi mangler i Storage.",
      };
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    const { error: uploadError } = await sb.storage
      .from(IMAGE_BUCKET)
      .upload(galleryPath, buffer, {
        contentType: "image/webp",
        upsert: false,
        cacheControl: "3600",
      });
    if (uploadError) return { ok: false, error: uploadError.message };
  }

  const publicUrl = publicUrlForCarImagePath(galleryPath);
  const imageType = ["front", "side", "rear", "interior", "other"].includes(
    image.image_type || "",
  )
    ? (image.image_type as string)
    : "other";

  if (image.is_primary_candidate) {
    await sb.from("car_images").update({ is_primary: false }).eq("car_id", input.carId);
  }

  const { data: inserted, error: insertError } = await sb
    .from("car_images")
    .insert({
      car_id: input.carId,
      image_url: publicUrl,
      storage_path: galleryPath,
      image_type: imageType,
      alt_text:
        image.alt_text ||
        `Kilde: ${image.source_name || image.source_url || image.original_url}`,
      is_primary: image.is_primary_candidate,
      sort_order: input.sortOrder,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return {
      ok: false,
      error: insertError?.message || "Kunne ikke lagre bildeposten.",
    };
  }

  if (image.is_primary_candidate) {
    await sb.from("cars").update({ image_url: publicUrl }).eq("id", input.carId);
  }

  await sb
    .from("research_image_candidates")
    .update({
      status: "applied",
      applied_image_id: inserted.id,
      storage_path: galleryPath,
      notes: [
        image.notes,
        image.license_note,
        "applied-via-phase1-script-2026-07-28",
      ]
        .filter(Boolean)
        .join(" | "),
    })
    .eq("id", image.id);

  return { ok: true, galleryImageId: inserted.id as string };
}

function clearDraftFieldSources(
  fieldSources: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(fieldSources || {}) };
  for (const key of [
    "pros",
    "cons",
    "description",
    "score_notes",
    "suitable_for",
  ]) {
    const row = next[key];
    if (!row || typeof row !== "object") continue;
    next[key] = {
      ...(row as Record<string, unknown>),
      draft: false,
      notes: "phase1-editorial-final-2026-07-28",
      review_status: "approved",
      source_name: "EVFAKTA editorial (sourced claims only)",
    };
  }
  return next;
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const report: Record<string, unknown> = {
    slug: SLUG,
    startedAt: new Date().toISOString(),
    steps: [] as string[],
  };
  const steps = report.steps as string[];

  const { data: car, error: carErr } = await sb
    .from("cars")
    .select("*")
    .eq("id", CAR_ID)
    .single();
  if (carErr || !car) throw new Error(carErr?.message || "car missing");

  const { data: items } = await sb
    .from("research_items")
    .select("id")
    .eq("existing_car_id", CAR_ID);
  const itemIds = (items || []).map((i) => i.id as string);
  const { data: candidates } = await sb
    .from("research_image_candidates")
    .select("*")
    .in("item_id", itemIds);

  const keepIds = new Set(Object.values(KEEP));
  let supersededSpam = 0;
  for (const row of candidates || []) {
    if (keepIds.has(row.id)) continue;
    if (row.status === "applied" || row.status === "approved") continue;
    const notes = String(row.notes || "");
    if (notes.toLowerCase().includes("superseded")) continue;
    const next = appendNote(
      appendNote(notes, "superseded"),
      "phase1-cleanup-2026-07-28",
    );
    await sb
      .from("research_image_candidates")
      .update({ notes: next, status: "rejected" })
      .eq("id", row.id);
    supersededSpam += 1;
  }
  steps.push(`Superseded/rejected non-curated candidates: ${supersededSpam}`);

  const noteFor = (id: string) =>
    (candidates || []).find((c) => c.id === id)?.notes;

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "front",
      is_primary_candidate: true,
      alt_text:
        "Volkswagen ID.4 i lys blå, front trekvart, parkert (offisiell press)",
      notes: appendNote(noteFor(KEEP.frontHero), "editor-relabel:front+hero-visual-2026-07-28"),
    })
    .eq("id", KEEP.frontHero);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "side",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID.4 i lys blå, sideprofil (offisiell press)",
      notes: appendNote(noteFor(KEEP.side), "editor-relabel:side-visual-2026-07-28"),
    })
    .eq("id", KEEP.side);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "rear",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID.4 i lys blå, bak trekvart (offisiell press)",
      notes: appendNote(noteFor(KEEP.rear), "editor-relabel:rear-visual-2026-07-28"),
    })
    .eq("id", KEEP.rear);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "interior",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID.4 interiør, førerplass og sentralskjerm (offisiell press)",
      notes: appendNote(
        noteFor(KEEP.interior),
        "editor-relabel:interior-visual-2026-07-28",
      ),
    })
    .eq("id", KEEP.interior);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "other",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID.4 interiør, dashbord sett forfra (offisiell press)",
      notes: appendNote(
        noteFor(KEEP.otherInterior),
        "editor-relabel:other-second-interior-visual-2026-07-28",
      ),
    })
    .eq("id", KEEP.otherInterior);

  steps.push(
    "Relabeled curated set after visual review (front/side/rear/interior; album labels were swapped)",
  );

  const approvePlan: Array<{
    id: string;
    image_type: string;
    primary: boolean;
  }> = [
    { id: KEEP.frontHero, image_type: "front", primary: true },
    { id: KEEP.side, image_type: "side", primary: false },
    { id: KEEP.rear, image_type: "rear", primary: false },
    { id: KEEP.interior, image_type: "interior", primary: false },
  ];

  for (const [index, plan] of approvePlan.entries()) {
    const { data: image } = await sb
      .from("research_image_candidates")
      .select("*")
      .eq("id", plan.id)
      .single();
    if (!image?.storage_path) {
      steps.push(`SKIP approve ${plan.id}: missing storage`);
      continue;
    }
    await sb
      .from("research_image_candidates")
      .update({ status: "approved" })
      .eq("id", plan.id);

    const approved = {
      id: image.id as string,
      status: "approved",
      storage_path: image.storage_path as string | null,
      image_type: plan.image_type,
      is_primary_candidate: plan.primary,
      alt_text: (image.alt_text as string | null) ?? null,
      notes: (image.notes as string | null) ?? null,
      license_note: (image.license_note as string | null) ?? null,
      source_name: (image.source_name as string | null) ?? null,
      source_url: (image.source_url as string | null) ?? null,
      original_url: (image.original_url as string | null) ?? null,
      applied_image_id: (image.applied_image_id as string | null) ?? null,
    };

    const applied = await applyApprovedCandidate(sb, {
      carId: CAR_ID,
      slug: SLUG,
      brand: BRAND,
      image: approved,
      sortOrder: index,
    });
    steps.push(
      applied.ok
        ? `Applied ${approved.image_type}${approved.is_primary_candidate ? "+hero" : ""} → ${applied.galleryImageId}`
        : `FAIL apply ${plan.id}: ${applied.error}`,
    );
  }

  const description = `Volkswagen ID.4 er en helelektrisk SUV solgt i Norge. I denne katalogen er Pro 4MOTION og GTX 4MOTION Exclusive dokumentert med egne variantverdier for batteri, WLTP-rekkevidde, effekt og lading.

Tallene er hentet fra Volkswagens norske tekniske data (Mai 2026). WLTP er et laboratoriemål, ikke forventet reell rekkevidde. EVFAKTA har ikke testet bilen selv.`;

  const pros = [
    "SUV-format med fem seter og dokumentert bagasjevolum i norsk teknisk PDF",
    "4MOTION-varianter med offisielle effekt- og batteritall",
    "Dokumentert tilhengerkapasitet (se PDF for brems / uten brems)",
    "Varme pumpe og V2L er oppgitt i norsk teknisk dokumentasjon for aktuelle varianter",
    "CCS DC-lading med variantspesifikke maksimale verdier",
  ];

  const cons = [
    "Mindre egnet for dem som trenger en kompakt bybil",
    "Dreiemoment oppgis per aksel i PDF og er derfor ikke lagret som én katalogverdi",
    "Lengde kan avvike noen millimeter mellom Pro og GTX i samme PDF",
    "Vinterrekkevidde er ikke offisielt oppgitt som egen katalogverdi her",
  ];

  const suitable_for = [
    "Familier",
    "Pendling",
    "Lengre turer der høyere WLTP-variant er valgt",
    "Tilhengerbruk der PDF-verdiene dekker behovet",
  ];

  const score_notes = `## Hvem bilen passer for
ID.4 er en mellomstor elektrisk SUV. Passer til familier og hverdagsbruk der høyere sitteposisjon og bagasjevolum er viktigere enn kompakt byformat.

## Vinter
Kaldt vær reduserer typisk rekkevidde. EVFAKTA har ikke egne vintertall for ID.4. Bruk WLTP kun som referanse.

## Lading
AC 11 kW og DC-topp er dokumentert per variant i norsk teknisk PDF. Praktisk ladeopplevelse avhenger av infrastruktur og temperatur.

## Langtur
Lengre turer er mer realistiske på variantene med høyere WLTP (Pro 4MOTION i denne katalogen). Planlegg ladestopp ut fra faktisk forbruk.

## FAQ (redaksjonelt — ikke eget CMS-felt)
**Har ID.4 varme pumpe?** Ja — oppgitt i norsk teknisk dokumentasjon for aktuelle varianter.
**Har ID.4 V2L?** Ja — forberedelse for V2L er oppgitt som standardutstyr i PDF for aktuelle varianter.
**Hva er vinterrekkevidden?** Ikke oppgitt som offisiell katalogverdi i vår kilde — ikke gjettet.`;

  const now = new Date().toISOString();
  const { error: updateErr } = await sb
    .from("cars")
    .update({
      description,
      pros,
      cons,
      suitable_for,
      score_notes,
      field_sources: clearDraftFieldSources(
        car.field_sources as Record<string, unknown> | null,
      ),
      data_last_checked_at: now,
      import_status: "approved",
      is_published: false,
      vehicle_type: car.vehicle_type || "Personbil",
      body_style: car.body_style || "SUV",
    })
    .eq("id", CAR_ID);

  if (updateErr) throw new Error(updateErr.message);
  steps.push(
    "Editorial finalized (no draft markers); import_status=approved; remains unpublished",
  );

  await sb
    .from("car_variants")
    .update({ import_status: "approved" })
    .eq("car_id", CAR_ID);
  steps.push("Variants marked approved");

  const { data: gallery } = await sb
    .from("car_images")
    .select("id,image_type,is_primary,alt_text,image_url")
    .eq("car_id", CAR_ID)
    .order("sort_order");

  report.finishedAt = new Date().toISOString();
  report.gallery = gallery;
  report.imageReady = Boolean(
    gallery?.some((g) => g.is_primary) &&
      gallery?.some((g) => g.image_type === "front") &&
      gallery?.some((g) => g.image_type === "side"),
  );
  report.hasInterior = Boolean(gallery?.some((g) => g.image_type === "interior"));
  report.publishReadyNote =
    "Content+images ready for human publish; is_published left false";

  const out = resolve(
    process.cwd(),
    "docs/PHASE1_VOLKSWAGEN_ID4_PRODUCTION.md",
  );
  const md = [
    "# Phase 1 — Volkswagen ID.4 production batch",
    "",
    `Generated: ${report.finishedAt}`,
    "",
    "## Result",
    "",
    `- Image Ready (Hero+Front+Side): **${report.imageReady ? "YES" : "NO"}**`,
    `- Interior: **${report.hasInterior ? "YES" : "missing"}**`,
    "- Draft markers: **removed**",
    "- `import_status`: **approved**",
    "- `is_published`: **false** (quarantined until intentional publish)",
    "",
    "## Steps",
    "",
    ...steps.map((s) => `- ${s}`),
    "",
    "## Gallery",
    "",
    "```json",
    JSON.stringify(gallery, null, 2),
    "```",
    "",
    "## Sources",
    "",
    "- Volkswagen Norge — Tekniske data ID.4 (Mai 2026)",
    "- Volkswagen Newsroom album id-4-6723 (press images)",
    "",
    "## Visual label corrections",
    "",
    "- Album `side` → **rear** three-quarter",
    "- Album `rear` → **side** profile",
    "- Album `front` → **front** + Hero",
    "- Album `interior` → **interior** (applied)",
    "",
  ].join("\n");

  writeFileSync(out, md);
  writeFileSync(
    resolve(process.cwd(), "docs/PHASE1_VOLKSWAGEN_ID4_PRODUCTION.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  console.log("wrote", out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
