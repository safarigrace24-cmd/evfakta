/**
 * Finish Volkswagen Phase 1:
 * - ID. Buzz: visual image attach + editorial finalize (unpublished)
 * - ID.5: mark NOT_READY (no invented specs)
 *
 * Usage: npx tsx scripts/phase1-volkswagen-id-buzz-and-id5.ts
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import {
  buildCarImageStoragePath,
  resolveStorageRole,
} from "../lib/admin/image-production";
import {
  IMAGE_BUCKET,
  publicUrlForCarImagePath,
} from "../lib/admin/image-review-preview";
import { getPublishIssues } from "../lib/admin/publish-readiness";

const BUZZ_ID = "52e06fcd-2e61-4cd7-8916-1dcf6b841f88";
const BUZZ_SLUG = "volkswagen-id-buzz";
const ID5_ID = "78d4d39b-af28-434e-9a26-8a1fc198c550";
const BRAND = "Volkswagen";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Existing LWB album candidates (visual review 2026-07-28). */
const BUZZ_KEEP = {
  /** Front three-quarter → Hero + Front */
  frontHero: "34fdc8dc-0063-4d66-8bdf-e127cf8d5740",
  /** Rear three-quarter (was mislabeled side) */
  rear: "16e01f6d-ef49-41a1-9d12-bf8b02fa7d3b",
  /** Cabin interior (was mislabeled rear) */
  interior: "a6a9777b-8b1c-42da-9f2b-2ef101deae32",
  /** Second interior — keep pending/other */
  otherInterior: "b9826940-4832-4a16-9f12-0aae77fe8728",
  otherSeats: "b355f3f7-0825-43e7-af4e-430878b15c8d",
} as const;

/** True side from Newsroom album volkswagen-id-buzz-3418 (visual verified). */
const SIDE_ALBUM =
  "https://www.volkswagen-newsroom.com/en/images/albums/volkswagen-id-buzz-3418";

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

async function resolveSideUrl(): Promise<{ url: string; album: string }> {
  const album = SIDE_ALBUM;
  const html = await (
    await fetch(album, {
      headers: { "User-Agent": UA, Accept: "text/html" },
    })
  ).text();
  const urls = [
    ...new Set(
      (
        html.match(
          /https?:\/\/uploads\.vw-mms\.de\/[^"'\s<>]+_retina_2400\.jpg[^"'\s<>]*/gi,
        ) || []
      ).map((u) => u.replace(/&amp;/g, "&")),
    ),
  ];
  const hit = urls.find((u) => u.includes("DB2022AU00383"));
  if (!hit) throw new Error("Could not resolve official side URL for ID. Buzz");
  return { url: hit, album };
}

async function applyApproved(
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
      license_note?: string | null;
      source_name?: string | null;
      source_url?: string | null;
      original_url?: string | null;
      applied_image_id?: string | null;
    };
    sortOrder: number;
  },
): Promise<{ ok: true; galleryImageId: string } | { ok: false; error: string }> {
  const image = input.image;
  if (image.applied_image_id) {
    return { ok: true, galleryImageId: image.applied_image_id };
  }
  if (!image.storage_path?.trim()) {
    return { ok: false, error: "Mangler lokal review-kopi." };
  }
  await sb
    .from("research_image_candidates")
    .update({ status: "approved" })
    .eq("id", image.id);

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
    const { data, error } = await sb.storage
      .from(IMAGE_BUCKET)
      .download(image.storage_path);
    if (error || !data) {
      return { ok: false, error: error?.message || "Review-kopi mangler." };
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    const { error: up } = await sb.storage
      .from(IMAGE_BUCKET)
      .upload(galleryPath, buffer, {
        contentType: "image/webp",
        upsert: false,
        cacheControl: "3600",
      });
    if (up) return { ok: false, error: up.message };
  }

  const publicUrl = publicUrlForCarImagePath(galleryPath);
  const imageType = ["front", "side", "rear", "interior", "other"].includes(
    image.image_type || "",
  )
    ? (image.image_type as string)
    : "other";

  if (image.is_primary_candidate) {
    await sb
      .from("car_images")
      .update({ is_primary: false })
      .eq("car_id", input.carId);
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
    await sb
      .from("cars")
      .update({ image_url: publicUrl })
      .eq("id", input.carId);
  }

  await sb
    .from("research_image_candidates")
    .update({
      status: "applied",
      applied_image_id: inserted.id,
      storage_path: galleryPath,
      notes: appendNote(image.notes, "applied-via-phase1-script-2026-07-28"),
    })
    .eq("id", image.id);

  return { ok: true, galleryImageId: inserted.id as string };
}

async function insertSideCandidate(
  sb: SupabaseClient,
  itemId: string,
  side: { url: string; album: string },
) {
  const res = await fetch(side.url, {
    headers: {
      "User-Agent": UA,
      Referer: `${side.album}/`,
      Accept: "image/*",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Side download HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const webp = await sharp(buf)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const { data: inserted, error } = await sb
    .from("research_image_candidates")
    .insert({
      item_id: itemId,
      original_url: side.url,
      source_name: "Volkswagen Newsroom",
      source_url: side.album,
      license_note:
        "Official Volkswagen Newsroom press image — editorial use; verify rights before publish.",
      usage_terms: "Pending editor approval. Do not auto-attach.",
      alt_text:
        "Volkswagen ID. Buzz i tofarget hvit/lime, sideprofil (offisiell press)",
      image_type: "side",
      is_primary_candidate: false,
      status: "pending",
      notes:
        "phase1-side-hunt-2026-07-28 | visual-verified true side | album:volkswagen-id-buzz-3418",
    })
    .select("*")
    .single();
  if (error || !inserted) throw new Error(error?.message || "side insert failed");

  const uniqueId = createHash("sha1")
    .update(String(inserted.id))
    .digest("hex")
    .slice(0, 12);
  const storagePath = `volkswagen/${BUZZ_SLUG}/review-${uniqueId}.webp`;
  const { error: upErr } = await sb.storage
    .from(IMAGE_BUCKET)
    .upload(storagePath, webp.data, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "3600",
    });
  if (upErr) throw new Error(upErr.message);

  await sb
    .from("research_image_candidates")
    .update({
      storage_path: storagePath,
      notes: appendNote(inserted.notes, "review-copy:stored"),
    })
    .eq("id", inserted.id);

  return {
    ...inserted,
    storage_path: storagePath,
    image_type: "side",
    is_primary_candidate: false,
    alt_text:
      "Volkswagen ID. Buzz i tofarget hvit/lime, sideprofil (offisiell press)",
  };
}

async function main() {
  loadEnv();
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const report: Record<string, unknown> = {
    startedAt: new Date().toISOString(),
    buzz: { steps: [] as string[] },
    id5: { steps: [] as string[] },
  };
  const buzzSteps = (report.buzz as { steps: string[] }).steps;
  const id5Steps = (report.id5 as { steps: string[] }).steps;

  // ── ID. Buzz ──
  const { data: buzz, error: buzzErr } = await sb
    .from("cars")
    .select("*")
    .eq("id", BUZZ_ID)
    .single();
  if (buzzErr || !buzz) throw new Error(buzzErr?.message || "buzz missing");

  const { data: items } = await sb
    .from("research_items")
    .select("id")
    .eq("existing_car_id", BUZZ_ID);
  const itemId = items?.[0]?.id as string;
  if (!itemId) throw new Error("buzz research_item missing");

  const side = await resolveSideUrl();
  buzzSteps.push(`Resolved official side URL from ${side.album}`);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "front",
      is_primary_candidate: true,
      alt_text:
        "Volkswagen ID. Buzz i tofarget hvit/mintgrønn, front trekvart, kjørende (offisiell press)",
      notes: "editor-relabel:front+hero-visual-2026-07-28",
    })
    .eq("id", BUZZ_KEEP.frontHero);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "rear",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID. Buzz i tofarget hvit/mintgrønn, bak trekvart, kjørende (offisiell press)",
      notes: "editor-relabel:rear-visual-2026-07-28",
    })
    .eq("id", BUZZ_KEEP.rear);

  await sb
    .from("research_image_candidates")
    .update({
      image_type: "interior",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID. Buzz interiør, forsete og dashbord (offisiell press)",
      notes: "editor-relabel:interior-visual-2026-07-28",
    })
    .eq("id", BUZZ_KEEP.interior);

  for (const id of [BUZZ_KEEP.otherInterior, BUZZ_KEEP.otherSeats]) {
    await sb
      .from("research_image_candidates")
      .update({
        image_type: "other",
        is_primary_candidate: false,
        notes: appendNote(
          "editor-relabel:other-extra-interior-visual-2026-07-28",
          "kept-pending",
        ),
      })
      .eq("id", id);
  }
  buzzSteps.push(
    "Relabeled LWB curated set (front/rear/interior); album-order side was rear 3/4",
  );

  const sideCand = await insertSideCandidate(sb, itemId, side);
  buzzSteps.push(`Inserted visual-verified side ${sideCand.id}`);

  const { data: frontRow } = await sb
    .from("research_image_candidates")
    .select("*")
    .eq("id", BUZZ_KEEP.frontHero)
    .single();
  const { data: rearRow } = await sb
    .from("research_image_candidates")
    .select("*")
    .eq("id", BUZZ_KEEP.rear)
    .single();
  const { data: interiorRow } = await sb
    .from("research_image_candidates")
    .select("*")
    .eq("id", BUZZ_KEEP.interior)
    .single();

  const plan = [
    {
      ...frontRow!,
      image_type: "front",
      is_primary_candidate: true,
      alt_text:
        "Volkswagen ID. Buzz i tofarget hvit/mintgrønn, front trekvart, kjørende (offisiell press)",
    },
    {
      ...sideCand,
      image_type: "side",
      is_primary_candidate: false,
    },
    {
      ...rearRow!,
      image_type: "rear",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID. Buzz i tofarget hvit/mintgrønn, bak trekvart, kjørende (offisiell press)",
    },
    {
      ...interiorRow!,
      image_type: "interior",
      is_primary_candidate: false,
      alt_text:
        "Volkswagen ID. Buzz interiør, forsete og dashbord (offisiell press)",
    },
  ];

  for (const [i, img] of plan.entries()) {
    const applied = await applyApproved(sb, {
      carId: BUZZ_ID,
      slug: BUZZ_SLUG,
      brand: BRAND,
      image: {
        id: img.id as string,
        status: "approved",
        storage_path: img.storage_path as string,
        image_type: img.image_type as string,
        is_primary_candidate: Boolean(img.is_primary_candidate),
        alt_text: (img.alt_text as string) || null,
        notes: (img.notes as string) || null,
        license_note: (img.license_note as string) || null,
        source_name: (img.source_name as string) || null,
        source_url: (img.source_url as string) || null,
        original_url: (img.original_url as string) || null,
        applied_image_id: (img.applied_image_id as string) || null,
      },
      sortOrder: i,
    });
    buzzSteps.push(
      applied.ok
        ? `Applied ${img.image_type}${img.is_primary_candidate ? "+hero" : ""} → ${applied.galleryImageId}`
        : `FAIL ${img.image_type}: ${applied.error}`,
    );
  }

  const description = `Volkswagen ID. Buzz er en helelektrisk MPV solgt i Norge i kort og lang akselavstand, inkludert GTX 4MOTION. Rekkevidde, lengde, batteri, tilhenger og bagasje må leses per kort/lang- og Pro/GTX-variant.

Kildene er Volkswagens norske Pro- og GTX-dokumenter. WLTP er laboratoriemål. EVFAKTA har ikke testet bilen.`;

  const pros = [
    "Kort og lang akselavstand dekker ulike plassbehov",
    "GTX 4MOTION med dokumentert høyere effekt og tilhengertall i GTX-PDF",
    "Romslig MPV-format med flere seteoppsett oppgitt av produsenten",
    "CCS-hurtiglading med variantspesifikke DC-verdier",
  ];

  const cons = [
    "Kan være mindre egnet som ren kompakt bybil på grunn av størrelse",
    "Seteantall og bagasjevolum varierer med konfigurasjon (5/6/7) og er ikke én bilnivåverdi",
    "GTX Exclusive vs ikke-Exclusive WLTP er dokumentert konflikt — non-Exclusive er lagret",
    "Varme pumpe er oppgitt som ekstrautstyr i Pro-dokumentasjon og er derfor ikke satt som standard",
  ];

  const suitable_for = [
    "Familier",
    "Lengre turer der høyere WLTP-variant er valgt",
    "Tilhengerbruk der PDF-verdiene dekker behovet",
  ];

  const score_notes = `## Hvem bilen passer for
ID. Buzz passer for familier og brukere som trenger mer plass enn en typisk personbil, inkludert mulig 6-/7-seters oppsett etter konfigurasjon.

## Vinter
Ingen offisiell vinterrekkevidde er lagret. 4MOTION på GTX kan være relevant i vinterføre, men erstatter ikke vinterdekk.

## Lading
AC/DC og 10–80 % er dokumentert der PDF oppgir dem. Praktisk ladetid varierer.

## Langtur
Lang-varianter har høyere WLTP enn kort i denne katalogen. Exclusive-linjer har lavere WLTP i GTX-PDF og er ikke blandet inn.

## FAQ (redaksjonelt — ikke eget CMS-felt)
**Har ID. Buzz varme pumpe?** Oppgitt som ekstrautstyr i Pro-dokumentasjon — ikke satt som standard her.
**Hva er vinterrekkevidden?** Ikke oppgitt som offisiell katalogverdi — ikke gjettet.
**Kort eller lang?** Sammenlign lengde, WLTP og bagasje/seteoppsett per variant.`;

  const field_sources = {
    ...((buzz.field_sources as Record<string, unknown>) || {}),
  } as Record<string, Record<string, unknown>>;
  for (const key of [
    "pros",
    "cons",
    "description",
    "score_notes",
    "suitable_for",
  ]) {
    if (field_sources[key] && typeof field_sources[key] === "object") {
      field_sources[key] = {
        ...field_sources[key],
        draft: false,
        notes: "phase1-editorial-final-2026-07-28",
        review_status: "approved",
      };
    }
  }

  const now = new Date().toISOString();
  const { error: upBuzz } = await sb
    .from("cars")
    .update({
      description,
      pros,
      cons,
      suitable_for,
      score_notes,
      field_sources,
      data_last_checked_at: now,
      import_status: "approved",
      is_published: false,
      body_style: buzz.body_style || "MPV / bus",
      vehicle_type: buzz.vehicle_type || "Personbil",
      import_notes:
        "Phase1 complete 2026-07-28. Image Ready + editorial final. Unpublished (no auto-publish). GTX Exclusive WLTP not applied.",
    })
    .eq("id", BUZZ_ID);
  if (upBuzz) throw new Error(upBuzz.message);

  await sb
    .from("car_variants")
    .update({ import_status: "approved" })
    .eq("car_id", BUZZ_ID);
  buzzSteps.push("Editorial finalized; variants approved; unpublished");

  const { data: buzzGallery } = await sb
    .from("car_images")
    .select("image_type,is_primary,alt_text,image_url")
    .eq("car_id", BUZZ_ID)
    .order("sort_order");
  const buzzIssues = getPublishIssues({
    ...buzz,
    description,
    pros,
    cons,
    suitable_for,
    score_notes,
    import_status: "approved",
    data_last_checked_at: now,
    image_url:
      buzzGallery?.find((g) => g.is_primary)?.image_url || buzz.image_url,
    gallery_images: buzzGallery || [],
  });
  (report.buzz as Record<string, unknown>).gallery = buzzGallery;
  (report.buzz as Record<string, unknown>).imageReady = Boolean(
    buzzGallery?.some((g) => g.is_primary) &&
      buzzGallery?.some((g) => g.image_type === "front") &&
      buzzGallery?.some((g) => g.image_type === "side"),
  );
  (report.buzz as Record<string, unknown>).publishReady =
    buzzIssues.length === 0;
  (report.buzz as Record<string, unknown>).publishIssues = buzzIssues;

  // ── ID.5 NOT_READY ──
  const id5Description = `Volkswagen ID.5 er foreløpig ikke klar for EVFAKTA-katalogen.

Offisiell norsk teknisk PDF for ID.5 er ikke tilgjengelig i tilstrekkelig form for denne produksjonsbatchen. Spesifikasjoner, varianter og bilder er derfor ikke ferdigstilt.

Status: NOT_READY. Ingen verdier er gjettet.`;

  const { error: upId5 } = await sb
    .from("cars")
    .update({
      description: id5Description,
      pros: [],
      cons: [
        "Offisiell norsk teknisk dokumentasjon mangler for komplett katalogføring",
      ],
      suitable_for: [],
      score_notes: `## Status
NOT_READY — blokkert på manglende offisiell norsk teknisk PDF.

## FAQ
**Når blir ID.5 klar?** Når offisiell norsk kilde er tilgjengelig og Image Ready-krav er oppfylt.`,
      import_status: "needs_review",
      is_published: false,
      data_last_checked_at: now,
      import_notes:
        "NOT_READY 2026-07-28. Blocked: insufficient official Norwegian tech documentation. Do not invent specs/images.",
    })
    .eq("id", ID5_ID);
  if (upId5) throw new Error(upId5.message);
  id5Steps.push("Marked NOT_READY; draft inventiveness removed; unpublished");

  // Verify all finishable VW models
  const summary: Array<Record<string, unknown>> = [];
  for (const slug of [
    "volkswagen-id-3",
    "volkswagen-id-4",
    "volkswagen-id-7",
    "volkswagen-id-buzz",
    "volkswagen-id-5",
  ]) {
    const { data: car } = await sb
      .from("cars")
      .select("*")
      .eq("slug", slug)
      .single();
    const { data: gallery } = await sb
      .from("car_images")
      .select("image_type,is_primary")
      .eq("car_id", car!.id);
    const issues = getPublishIssues({
      ...car!,
      gallery_images: gallery || [],
    });
    const draft = /Draft – Requires editor review/i.test(
      JSON.stringify({
        d: car!.description,
        p: car!.pros,
        c: car!.cons,
        s: car!.score_notes,
      }),
    );
    summary.push({
      slug,
      import_status: car!.import_status,
      published: car!.is_published,
      draft,
      imageReady: Boolean(
        (gallery || []).some((g) => g.is_primary || car!.image_url) &&
          (gallery || []).some((g) => g.image_type === "front") &&
          (gallery || []).some((g) => g.image_type === "side"),
      ),
      hasRear: (gallery || []).some((g) => g.image_type === "rear"),
      hasInterior: (gallery || []).some((g) => g.image_type === "interior"),
      publishReady: issues.length === 0,
      publishIssues: issues,
      notReadyNote: /NOT_READY/i.test(String(car!.import_notes || "")),
    });
  }
  report.summary = summary;
  report.finishedAt = new Date().toISOString();

  writeFileSync(
    resolve(process.cwd(), "docs/PHASE1_VOLKSWAGEN_ID_BUZZ_PRODUCTION.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
