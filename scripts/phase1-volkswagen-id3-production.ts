/**
 * Phase 1 production batch — Volkswagen ID.3
 * Editorial finalize + image label correction + gallery attach.
 * Never invents specs. Does not publish unless already gate-compliant.
 *
 * Usage: npx tsx scripts/phase1-volkswagen-id3-production.ts
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

const CAR_ID = "531fa6cc-a163-4b9d-963e-814bff2bffba";
const SLUG = "volkswagen-id-3";
const BRAND = "Volkswagen";

/** Visually verified Newsroom set (2026-07-28 review). */
const KEEP = {
  /** Front three-quarter → Hero + Front */
  frontHero: "6a0b0b12-acbc-4108-8f03-b3cd3cdeceed",
  /** True side profile (was mislabeled rear) */
  side: "e409df5e-5b1a-4224-a741-394b66318644",
  /** Rear three-quarter driving (was mislabeled side) */
  rear: "3bc5a81c-f13d-46d0-a0c1-ded6512288cd",
  /** Static rear three-quarter — keep as other (not interior) */
  otherRear: "496a4448-3380-4d28-ac54-8ab923c617bd",
  /** Blue front three-quarter — other */
  otherFront: "7ccf4793-4459-471f-ad13-3c192d06fc35",
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

/** Script-safe gallery apply (mirrors applySingleApprovedImage without server-only). */
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
    return { ok: false, error: insertError?.message || "Kunne ikke lagre bildeposten." };
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

  // 1) Hide spam / mislabeled pending candidates (history retained)
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

  // 2) Correct types from visual review
  await sb
    .from("research_image_candidates")
    .update({
      image_type: "front",
      is_primary_candidate: true,
      alt_text:
        "Volkswagen ID.3 i olivengrønn, front trekvart, kjørende på landevei (offisiell press)",
      notes: appendNote(
        (candidates || []).find((c) => c.id === KEEP.frontHero)?.notes,
        "editor-relabel:front+hero-visual-2026-07-28",
      ),
    })
    .eq("id", KEEP.frontHero);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "side",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID.3 i olivengrønn, sideprofil, kjørende (offisiell press)",
      notes: appendNote(
        (candidates || []).find((c) => c.id === KEEP.side)?.notes,
        "editor-relabel:side-visual-2026-07-28",
      ),
    })
    .eq("id", KEEP.side);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "rear",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID.3 i olivengrønn, bak trekvart, kjørende (offisiell press)",
      notes: appendNote(
        (candidates || []).find((c) => c.id === KEEP.rear)?.notes,
        "editor-relabel:rear-visual-2026-07-28",
      ),
    })
    .eq("id", KEEP.rear);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "other",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID.3 i olivengrønn, bak trekvart parkert (offisiell press)",
      notes: appendNote(
        (candidates || []).find((c) => c.id === KEEP.otherRear)?.notes,
        "editor-relabel:other-not-interior-visual-2026-07-28",
      ),
    })
    .eq("id", KEEP.otherRear);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "other",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID.3 i blå, front trekvart, kjørende (offisiell press)",
      notes: appendNote(
        (candidates || []).find((c) => c.id === KEEP.otherFront)?.notes,
        "editor-relabel:other-visual-2026-07-28",
      ),
    })
    .eq("id", KEEP.otherFront);

  steps.push(
    "Relabeled curated set after visual review (front/side/rear; no verified interior in set)",
  );

  // 3) Approve + attach Hero/Front, Side, Rear
  const approveIds = [KEEP.frontHero, KEEP.side, KEEP.rear];
  for (const [index, imageId] of approveIds.entries()) {
    const { data: image } = await sb
      .from("research_image_candidates")
      .select("*")
      .eq("id", imageId)
      .single();
    if (!image?.storage_path) {
      steps.push(`SKIP approve ${imageId}: missing storage`);
      continue;
    }
    await sb
      .from("research_image_candidates")
      .update({ status: "approved" })
      .eq("id", imageId);
    const approved = {
      id: image.id as string,
      status: "approved",
      storage_path: image.storage_path as string | null,
      image_type:
        imageId === KEEP.frontHero
          ? "front"
          : imageId === KEEP.side
            ? "side"
            : "rear",
      is_primary_candidate: imageId === KEEP.frontHero,
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
        : `FAIL apply ${imageId}: ${applied.error}`,
    );
  }

  // 4) Editorial finalize — remove draft markers; keep sourced claims only
  const description = `Volkswagen ID.3 er en kompakt helelektrisk hatchback solgt i Norge. Modellen tilbys i flere batteri- og effektnivåer (Pure, Pro, Pro S og GTX). Variantspesifikke tall for rekkevidde, batteri, effekt og lading ligger på variantnivå i katalogen.

Tallene er hentet fra Volkswagens norske tekniske dokumentasjon (tekniske data ID.3). WLTP-rekkevidde er et laboratoriemål, ikke forventet reell rekkevidde. EVFAKTA har ikke gjennomført egen test av denne bilen.`;

  const pros = [
    "Kompakt format som egner seg godt til bybruk og daglig pendling",
    "Flere dokumenterte batteristørrelser og effektnivåer i norsk teknisk PDF",
    "CCS-hurtiglading og Type 2 vekselstrømlading er dokumentert per variant",
    "Fem sitteplasser og hatchback-bagasjevolum oppgitt av produsenten",
    "GTX-varianter gir høyere effekt innen samme modellfamilie",
  ];

  const cons = [
    "Mindre egnet for store familier som trenger mye bagasjeplass enn større SUV-/varebilmodeller",
    "Offisiell vinterrekkevidde er ikke oppgitt som katalogverdi og er ikke testet av EVFAKTA",
    "Modellside og teknisk PDF kan bruke ulike «inntil»-tall — bruk variantverdiene i katalogen",
    "Varme pumpe kan variere med utstyr og er ikke lagret som én bilnivåverdi",
  ];

  const suitable_for = [
    "Pendling",
    "Bybruk",
    "Små familier",
    "Firmabilbruk der kompakt størrelse er en fordel",
  ];

  const score_notes = `## Hvem bilen passer for
ID.3 passer primært til bybruk, pendling og hverdagskjøring der kompakt størrelse er en fordel. Langdistanseegenskapene avhenger av valgt batterivariant (WLTP), ikke av modellnavnet alene.

## Vinter
Kaldt vær reduserer typisk rekkevidde og kan øke ladetid. EVFAKTA har ikke egne vintertall for ID.3. Bruk WLTP kun som referanse.

## Lading
Offisiell dokumentasjon oppgir AC- og DC-verdier per variant. 10–80 %-tider er lagret der PDF oppgir dem. Praktisk ladeopplevelse avhenger av infrastruktur og temperatur.

## Langtur
Lengre turer er mer realistiske på Pro S / GTX med høyere WLTP-tall. Planlegg ladestopp ut fra faktisk forbruk.

## FAQ (redaksjonelt — ikke eget CMS-felt)
**Har ID.3 varme pumpe?** Kan variere med utstyr; ikke lagret som én bilnivåverdi her.
**Hva er vinterrekkevidden?** Ikke oppgitt som offisiell katalogverdi i vår kilde — ikke gjettet.
**Hvilken variant bør jeg velge?** Sammenlign variant-WLTP, batteri og DC-effekt i katalogen mot ditt kjøremønster.`;

  const now = new Date().toISOString();
  const { error: updateErr } = await sb
    .from("cars")
    .update({
      description,
      pros,
      cons,
      suitable_for,
      score_notes,
      data_last_checked_at: now,
      import_status: "approved",
      is_published: false,
      year: car.year || 2025,
      vehicle_type: car.vehicle_type || "Elbil",
      body_style: car.body_style || "Hatchback",
    })
    .eq("id", CAR_ID);

  if (updateErr) throw new Error(updateErr.message);
  steps.push(
    "Editorial finalized (no draft markers); import_status=approved; remains unpublished for final publish gate check",
  );

  // 5) Variant import_status → approved (specs already sourced)
  await sb
    .from("car_variants")
    .update({ import_status: "approved" })
    .eq("car_id", CAR_ID);
  steps.push("Variants marked approved");

  // Verify gallery
  const { data: gallery } = await sb
    .from("car_images")
    .select("id,image_type,is_primary,alt_text,image_url")
    .eq("car_id", CAR_ID);

  report.finishedAt = new Date().toISOString();
  report.gallery = gallery;
  report.imageReady = Boolean(
    gallery?.some((g) => g.is_primary) &&
      gallery?.some((g) => g.image_type === "front") &&
      gallery?.some((g) => g.image_type === "side"),
  );
  report.missingInterior = true;
  report.publishReadyNote =
    "Content+images ready for human publish; is_published left false";

  const out = resolve(
    process.cwd(),
    "docs/PHASE1_VOLKSWAGEN_ID3_PRODUCTION.md",
  );
  const md = [
    "# Phase 1 — Volkswagen ID.3 production batch",
    "",
    `Generated: ${report.finishedAt}`,
    "",
    "## Result",
    "",
    `- Image Ready (Hero+Front+Side): **${report.imageReady ? "YES" : "NO"}**`,
    "- Interior: **missing** (no verified interior in curated Newsroom set — left empty)",
    "- Draft markers: **removed**",
    "- `import_status`: **approved**",
    "- `is_published`: **false** (awaiting final publish after checklist)",
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
    "- Volkswagen Norge — Tekniske data ID.3",
    "- Volkswagen Newsroom album id-3-6607 (press images)",
    "",
    "## Related models",
    "",
    "Handled by existing `getRelatedCars` (same brand first) — no schema field.",
    "",
    "## FAQ",
    "",
    "Stored under `score_notes` FAQ section (no dedicated FAQ column; schema locked).",
    "",
  ].join("\n");

  writeFileSync(out, md);
  writeFileSync(
    resolve(process.cwd(), "docs/PHASE1_VOLKSWAGEN_ID3_PRODUCTION.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  console.log("wrote", out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
