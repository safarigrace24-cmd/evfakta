/**
 * Refresh failed VW/Volvo Image Review candidates from official sources only.
 *
 * - Keeps original_url + source_url provenance
 * - Downloads immediately into EVFAKTA Storage (review WebP)
 * - Inserts pending candidates (never approve / never publish)
 * - Marks old failed candidates as superseded (history retained)
 *
 * Usage: npx tsx scripts/refresh-vw-volvo-image-candidates.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const BUCKET = "car-images";
const FAILED = "Download Failed";
const SUPERSEDED = "superseded";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

type ImageType = "front" | "side" | "rear" | "interior" | "other";

type CandidateSpec = {
  original_url: string;
  source_url: string;
  source_name: string;
  image_type: ImageType;
  alt_text: string;
  is_primary_candidate: boolean;
  notes: string;
  license_note: string;
};

type ModelPlan = {
  slug: string;
  brand: string;
  model: string;
  pageUrl: string;
  candidates: CandidateSpec[];
};

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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function publicUrl(base: string, storagePath: string): string {
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

function cleanCsUrl(url: string): string {
  const u = new URL(url.replace(/&amp;/g, "&").split(");")[0]!.split(",")[0]!);
  u.searchParams.set("branch", "prod_alias");
  u.searchParams.set("format", "jpg");
  u.searchParams.set("quality", "90");
  if (!u.searchParams.get("w") || Number(u.searchParams.get("w")) < 1600) {
    u.searchParams.set("w", "2400");
  }
  u.searchParams.delete("imdensity");
  u.searchParams.delete("h");
  u.searchParams.delete("iar");
  return u.toString();
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html",
      "Accept-Language": "nb-NO,nb;q=0.9,en;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`HTML ${response.status} for ${url}`);
  return response.text();
}

async function downloadImage(
  url: string,
  referer: string,
): Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: referer,
      },
    });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    const contentType = response.headers.get("content-type") || "";
    if (/text\/html|application\/json/i.test(contentType)) {
      return { ok: false, error: "Not an image response" };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < 10_000) return { ok: false, error: "Too small" };
    return { ok: true, buffer };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }
}

function extractNewsroomPairs(html: string): Array<{ alt: string; url: string }> {
  const out: Array<{ alt: string; url: string }> = [];
  const re =
    /alt="([^"]+)"[\s\S]{0,800}?https:\/\/uploads\.vw-mms\.de\/([^"'\\\s>]+_retina_2400\.jpg\?[^"'\\\s>]*)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    out.push({
      alt: match[1]!,
      url: `https://uploads.vw-mms.de/${match[2]!.replace(/&amp;/g, "&")}`,
    });
  }
  // de-dupe by url
  const seen = new Set<string>();
  return out.filter((row) => {
    if (seen.has(row.url)) return false;
    seen.add(row.url);
    return true;
  });
}

function extractVolvoCsUrls(html: string, modelKeys: string[]): string[] {
  const re =
    /https:\/\/www\.volvocars\.com\/images\/cs\/v3\/assets\/[a-z0-9]+\/[a-z0-9]+\/[a-z0-9]+\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|PNG|webp)/g;
  const all = [...new Set(html.match(re) || [])];
  return all.filter((url) =>
    modelKeys.some((key) => url.toLowerCase().includes(key.toLowerCase())),
  );
}

function pickVolvoCandidates(
  urls: string[],
  pageUrl: string,
  modelLabel: string,
): CandidateSpec[] {
  const license =
    "Official Volvo Cars Norge website media — verify usage rights before publish.";
  const byType: Record<ImageType, string | null> = {
    front: null,
    side: null,
    rear: null,
    interior: null,
    other: null,
  };

  for (const raw of urls) {
    const lower = raw.toLowerCase();
    if (/rim_close|colorselector|forhandler|merch|-td\.|-top\.|poster/i.test(lower)) {
      continue;
    }
    if (!byType.side && /ext_side_left|ext_side/.test(lower)) byType.side = raw;
    else if (!byType.front && (/exterior-bento-front|modelintrohero|ext_tip_front|_front_/i.test(lower))) {
      byType.front = raw;
    } else if (!byType.rear && /exterior-bento-rear|ext_.*rear/i.test(lower)) {
      byType.rear = raw;
    } else if (
      !byType.interior &&
      /interior|dashboard|cockpit|seat/i.test(lower) &&
      !/rear_to_front/i.test(lower)
    ) {
      byType.interior = raw;
    } else if (!byType.other && /gallery|bento|hero/i.test(lower)) {
      byType.other = raw;
    }
  }

  // Prefer modelIntroHero as hero/front when available.
  const hero = urls.find((u) => /modelintrohero-16x9|modelintrohero-1x1/i.test(u));
  if (hero) byType.front = hero;

  const specs: CandidateSpec[] = [];
  const push = (
    type: ImageType,
    url: string | null,
    primary: boolean,
    label: string,
  ) => {
    if (!url) return;
    specs.push({
      original_url: cleanCsUrl(url),
      source_url: pageUrl,
      source_name: "Volvo Cars Norge",
      image_type: type,
      alt_text: `${modelLabel} ${label}`,
      is_primary_candidate: primary,
      notes: `refresh-2026-07-28 | official NO page asset | type:${type}`,
      license_note: license,
    });
  };

  push("front", byType.front, true, "front / hero");
  push("side", byType.side, false, "side");
  push("rear", byType.rear, false, "rear");
  push("interior", byType.interior, false, "interior");
  if (!byType.front && byType.other) push("front", byType.other, true, "hero gallery");
  return specs;
}

function assignVwTypes(
  pairs: Array<{ alt: string; url: string }>,
  pageUrl: string,
  modelLabel: string,
  albumLabel: string,
): CandidateSpec[] {
  const license =
    "Official Volkswagen Newsroom press image — editorial use; verify rights before publish.";
  const selected = pairs.slice(0, 5);
  const typeOrder: ImageType[] = ["front", "side", "rear", "interior", "other"];
  return selected.map((row, index) => ({
    original_url: row.url,
    source_url: pageUrl,
    source_name: "Volkswagen Newsroom",
    image_type: typeOrder[index] ?? "other",
    alt_text: row.alt || `${modelLabel} ${typeOrder[index] ?? "other"}`,
    is_primary_candidate: index === 0,
    notes: `refresh-2026-07-28 | ${albumLabel} | alt:${row.alt} | editor may reclassify type`,
    license_note: license,
  }));
}

async function buildPlans(): Promise<ModelPlan[]> {
  const plans: ModelPlan[] = [];

  // ── Volkswagen (NO pages expired/410 → official global Newsroom) ──
  const vwAlbums: Array<{
    slug: string;
    model: string;
    album: string;
    noPage: string;
  }> = [
    {
      slug: "volkswagen-id-3",
      model: "ID.3",
      album: "https://www.volkswagen-newsroom.com/en/images/albums/id-3-6607",
      noPage: "https://www.volkswagen.no/no/alle-bilmodeller/id3.html",
    },
    {
      slug: "volkswagen-id-4",
      model: "ID.4",
      album: "https://www.volkswagen-newsroom.com/en/images/albums/id-4-6723",
      noPage: "https://www.volkswagen.no/no/alle-bilmodeller/id4.html",
    },
    {
      slug: "volkswagen-id-7",
      model: "ID.7",
      album: "https://www.volkswagen-newsroom.com/en/images/albums/id-7-6594",
      noPage: "https://www.volkswagen.no/no/alle-bilmodeller/id7-fastback.html",
    },
    {
      slug: "volkswagen-id-buzz",
      model: "ID. Buzz",
      album:
        "https://www.volkswagen-newsroom.com/en/images/albums/id-buzz-with-long-wheelbase-6684",
      noPage: "https://www.volkswagen.no/no/alle-bilmodeller/id-buzz.html",
    },
  ];

  for (const item of vwAlbums) {
    const html = await fetchHtml(item.album);
    const pairs = extractNewsroomPairs(html).filter((row) =>
      new RegExp(item.model.replace(".", "\\."), "i").test(row.alt),
    );
    const candidates = assignVwTypes(
      pairs.length ? pairs : extractNewsroomPairs(html),
      item.album,
      `Volkswagen ${item.model}`,
      item.album,
    );
    plans.push({
      slug: item.slug,
      brand: "Volkswagen",
      model: item.model,
      pageUrl: item.noPage,
      candidates,
    });
  }

  // ── Volvo (official NO model pages → Contentstack CDN) ──
  const volvoModels: Array<{
    slug: string;
    model: string;
    path: string;
    keys: string[];
  }> = [
    { slug: "volvo-ex30", model: "EX30", path: "ex30-electric", keys: ["ex30"] },
    { slug: "volvo-ex40", model: "EX40", path: "ex40-electric", keys: ["ex40"] },
    { slug: "volvo-ec40", model: "EC40", path: "ec40-electric", keys: ["ec40"] },
    { slug: "volvo-ex90", model: "EX90", path: "ex90-electric", keys: ["ex90"] },
    { slug: "volvo-es90", model: "ES90", path: "es90-electric", keys: ["es90"] },
  ];

  for (const item of volvoModels) {
    const pageUrl = `https://www.volvocars.com/no/cars/${item.path}/`;
    const html = await fetchHtml(pageUrl);
    const urls = extractVolvoCsUrls(html, item.keys);
    const candidates = pickVolvoCandidates(urls, pageUrl, `Volvo ${item.model}`);
    plans.push({
      slug: item.slug,
      brand: "Volvo",
      model: item.model,
      pageUrl,
      candidates,
    });
  }

  return plans;
}

async function main() {
  loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) {
    throw new Error("Missing Supabase env");
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("Building official candidate plans…");
  const plans = await buildPlans();

  const report: any = {
    generatedAt: new Date().toISOString(),
    models: [] as any[],
    summary: {
      newCandidates: 0,
      downloadOk: 0,
      downloadFailed: 0,
      superseded: 0,
      completeSets: [] as string[],
      missingHeroFrontSide: [] as string[],
    },
  };

  for (const plan of plans) {
    console.log(`\n=== ${plan.brand} ${plan.model} (${plan.slug}) ===`);
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("id, slug, brand, model, is_published")
      .eq("slug", plan.slug)
      .maybeSingle();
    if (carError || !car) {
      console.error("Car missing:", plan.slug, carError?.message);
      report.models.push({ slug: plan.slug, error: "car not found" });
      continue;
    }

    if (car.is_published) {
      console.log("Note: car is_published=true — still only inserting pending candidates.");
    }

    // Ensure research item exists
    let itemId: string | null = null;
    const { data: items } = await supabase
      .from("research_items")
      .select("id")
      .eq("existing_car_id", car.id)
      .order("created_at", { ascending: false })
      .limit(1);
    itemId = (items?.[0]?.id as string) || null;

    if (!itemId) {
      const { data: job, error: jobErr } = await supabase
        .from("research_jobs")
        .insert({
          status: "completed",
          provider_key: "manual_refresh",
          source_mode: "manual",
          brand_name: plan.brand,
          model_query: plan.model,
          progress_pct: 100,
          progress_message: "Image candidate refresh 2026-07-28",
          summary: { imageCandidates: plan.candidates.length },
        })
        .select("id")
        .single();
      if (jobErr || !job) throw new Error(jobErr?.message || "job insert failed");

      const { data: item, error: itemErr } = await supabase
        .from("research_items")
        .insert({
          job_id: job.id,
          sort_order: 0,
          slug: plan.slug,
          brand: plan.brand,
          model: plan.model,
          existing_car_id: car.id,
          decision: "pending",
          warnings: ["Image refresh candidates — pending human review only."],
          missing_fields: [],
          conflicts: [],
          proposed_car: { slug: plan.slug, brand: plan.brand, model: plan.model },
          proposed_variants: [],
          message: "Image candidate refresh — Storage review copies only.",
        })
        .select("id")
        .single();
      if (itemErr || !item) throw new Error(itemErr?.message || "item insert failed");
      itemId = item.id as string;
    }

    // Load existing candidates for supersede + dedupe
    const { data: existingItems } = await supabase
      .from("research_items")
      .select("id")
      .eq("existing_car_id", car.id);
    const itemIds = (existingItems || []).map((row: any) => row.id as string);
    const { data: existingCandidates } = await supabase
      .from("research_image_candidates")
      .select("*")
      .in("item_id", itemIds);

    const existing = (existingCandidates || []) as any[];
    const existingUrls = new Set(
      existing.map((row) => String(row.original_url || "").trim().toLowerCase()),
    );

    const modelReport: any = {
      slug: plan.slug,
      brand: plan.brand,
      model: plan.model,
      carId: car.id,
      imageReviewUrl: `/admin/images/${car.id}`,
      pageUrl: plan.pageUrl,
      planned: plan.candidates.length,
      inserted: [] as any[],
      skippedDuplicates: 0,
      failedDownloads: [] as any[],
      supersededIds: [] as string[],
      retainedFailed: 0,
      types: [] as string[],
    };

    const workingTypes = new Set<string>();

    for (const candidate of plan.candidates) {
      const key = candidate.original_url.trim().toLowerCase();
      if (existingUrls.has(key)) {
        modelReport.skippedDuplicates += 1;
        continue;
      }

      // Download first — only insert if Storage review copy succeeds
      const fetched = await downloadImage(candidate.original_url, candidate.source_url);
      if (!fetched.ok) {
        modelReport.failedDownloads.push({
          url: candidate.original_url,
          type: candidate.image_type,
          error: fetched.error,
        });
        report.summary.downloadFailed += 1;
        continue;
      }

      const webp = await sharp(fetched.buffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });

      const meta = webp.info;
      if ((meta.width || 0) < 800 || (meta.height || 0) < 600) {
        modelReport.failedDownloads.push({
          url: candidate.original_url,
          type: candidate.image_type,
          error: `Low resolution ${meta.width}x${meta.height}`,
        });
        report.summary.downloadFailed += 1;
        continue;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from("research_image_candidates")
        .insert({
          item_id: itemId,
          original_url: candidate.original_url,
          source_name: candidate.source_name,
          source_url: candidate.source_url,
          license_note: candidate.license_note,
          usage_terms:
            "Pending editor approval. Do not auto-attach. Do not publish from this script.",
          alt_text: candidate.alt_text,
          image_type: candidate.image_type,
          is_primary_candidate: candidate.is_primary_candidate,
          status: "pending",
          notes: candidate.notes,
        })
        .select("*")
        .single();

      if (insertErr || !inserted) {
        modelReport.failedDownloads.push({
          url: candidate.original_url,
          type: candidate.image_type,
          error: insertErr?.message || "insert failed",
        });
        continue;
      }

      const uniqueId =
        createHash("sha1")
          .update(String(inserted.id) || randomUUID())
          .digest("hex")
          .slice(0, 12) || "img";
      const storagePath = `${slugify(plan.brand)}/${slugify(plan.slug)}/review-${uniqueId}.webp`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, webp.data, {
          contentType: "image/webp",
          upsert: false,
          cacheControl: "3600",
        });

      if (uploadError) {
        await supabase
          .from("research_image_candidates")
          .update({
            notes: `${candidate.notes} | download-error:${uploadError.message} | ${FAILED}`,
          })
          .eq("id", inserted.id);
        modelReport.failedDownloads.push({
          url: candidate.original_url,
          type: candidate.image_type,
          error: uploadError.message,
        });
        report.summary.downloadFailed += 1;
        continue;
      }

      const preview = publicUrl(supabaseUrl, storagePath);
      const head = await fetch(preview, { method: "HEAD" });
      const notes = [
        candidate.notes,
        `resolution: ${meta.width}x${meta.height}`,
        "review-copy:stored",
        head.ok ? "storage-preview:ok" : "storage-preview:unreachable",
      ].join(" | ");

      await supabase
        .from("research_image_candidates")
        .update({ storage_path: storagePath, notes })
        .eq("id", inserted.id);

      // Restart simulation: second HEAD
      const head2 = await fetch(preview, { method: "HEAD" });

      modelReport.inserted.push({
        id: inserted.id,
        type: candidate.image_type,
        original_url: candidate.original_url,
        source_url: candidate.source_url,
        storage_path: storagePath,
        preview,
        storageReachable: head.ok && head2.ok,
        hotlinksOem: false,
        status: "pending",
      });
      modelReport.types.push(candidate.image_type);
      workingTypes.add(candidate.image_type);
      if (candidate.is_primary_candidate) workingTypes.add("hero");
      existingUrls.add(key);
      report.summary.newCandidates += 1;
      report.summary.downloadOk += 1;
      console.log(
        `  + ${candidate.image_type} stored ${storagePath} preview=${head.ok && head2.ok}`,
      );
    }

    // Supersede failed/expired candidates when we have a working replacement of same type
    // or any working candidate for the model.
    const failedRows = existing.filter((row) => {
      const notes = String(row.notes || "");
      return (
        row.status === "pending" &&
        !row.storage_path &&
        (/Download Failed|HTTP 410|Broken URL|expired|download-error/i.test(notes) ||
          !row.storage_path)
      );
    });

    for (const row of failedRows) {
      if (/superseded/i.test(String(row.notes || ""))) {
        modelReport.retainedFailed += 1;
        continue;
      }
      if (modelReport.inserted.length === 0) {
        modelReport.retainedFailed += 1;
        continue;
      }
      const notes = [
        row.notes,
        SUPERSEDED,
        `replaced-by-refresh-2026-07-28`,
        `replacement-count:${modelReport.inserted.length}`,
      ]
        .filter(Boolean)
        .join(" | ");
      await supabase
        .from("research_image_candidates")
        .update({ notes })
        .eq("id", row.id);
      modelReport.supersededIds.push(row.id);
      report.summary.superseded += 1;
      modelReport.retainedFailed += 1;
    }

    const hasHero = workingTypes.has("hero") || workingTypes.has("front");
    const hasFront = workingTypes.has("front");
    const hasSide = workingTypes.has("side");
    modelReport.completeCandidateSet = hasHero && hasFront && hasSide;
    modelReport.missing = [
      !hasHero ? "Hero" : null,
      !hasFront ? "Front" : null,
      !hasSide ? "Side" : null,
      !workingTypes.has("rear") ? "Rear" : null,
      !workingTypes.has("interior") ? "Interior" : null,
    ].filter(Boolean);

    if (modelReport.completeCandidateSet) {
      report.summary.completeSets.push(plan.slug);
    } else {
      report.summary.missingHeroFrontSide.push(
        `${plan.slug}: missing ${modelReport.missing.filter((m: string) => ["Hero", "Front", "Side"].includes(m)).join("/") || "partial"}`,
      );
    }

    report.models.push(modelReport);
  }

  const reportJsonPath = resolve(
    process.cwd(),
    "docs/VW_VOLVO_IMAGE_REFRESH_REPORT.json",
  );
  writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));

  const md: string[] = [];
  md.push("# VW + Volvo Image Candidate Refresh Report");
  md.push("");
  md.push(`Generated: ${report.generatedAt}`);
  md.push("");
  md.push("## Scope");
  md.push("");
  md.push("- Volkswagen: ID.3, ID.4, ID.7, ID. Buzz");
  md.push("- Volvo: EX30, EX40, EC40, EX90, ES90");
  md.push("- EX60 not processed");
  md.push("");
  md.push("## Rules followed");
  md.push("");
  md.push("- No OEM hotlink previews (Storage review copies only)");
  md.push("- No auto-approve / no auto Hero / no publish");
  md.push("- Failed candidates retained and marked `superseded` when replaced");
  md.push("- Official sources only (VW Newsroom + Volvo Cars Norge Contentstack)");
  md.push("- Norwegian manufacturer DAM URLs currently return HTTP 410 → used global official press/media where NO CDN is dead");
  md.push("");
  md.push("## Summary");
  md.push("");
  md.push(`- New candidates collected: **${report.summary.newCandidates}**`);
  md.push(`- Downloads OK: **${report.summary.downloadOk}**`);
  md.push(`- Download failures skipped: **${report.summary.downloadFailed}**`);
  md.push(`- Failed candidates superseded (retained): **${report.summary.superseded}**`);
  md.push(
    `- Models with complete Hero/Front/Side candidate set: ${report.summary.completeSets.join(", ") || "none"}`,
  );
  md.push("");
  md.push("### Still missing Hero / Front / Side");
  md.push("");
  if (report.summary.missingHeroFrontSide.length) {
    for (const line of report.summary.missingHeroFrontSide) md.push(`- ${line}`);
  } else {
    md.push("- None");
  }
  md.push("");

  for (const model of report.models) {
    md.push(`## ${model.brand} ${model.model} (\`${model.slug}\`)`);
    md.push("");
    md.push(`- Car ID: \`${model.carId}\``);
    md.push(`- Image Review: [\`/admin/images/${model.carId}\`](/admin/images/${model.carId})`);
    md.push(`- Source page: ${model.pageUrl}`);
    md.push(`- New candidates: **${model.inserted?.length || 0}**`);
    md.push(`- Types found: ${(model.types || []).join(", ") || "—"}`);
    md.push(`- Duplicates skipped: ${model.skippedDuplicates || 0}`);
    md.push(`- Failed candidates retained/superseded: ${model.retainedFailed || 0}`);
    md.push(
      `- Complete Hero/Front/Side set: **${model.completeCandidateSet ? "yes" : "no"}**`,
    );
    if (model.missing?.length) md.push(`- Still missing: ${model.missing.join(", ")}`);
    md.push("");
    if (model.inserted?.length) {
      md.push("### Replacement candidates");
      md.push("");
      for (const row of model.inserted) {
        md.push(
          `- \`${row.type}\` · pending · storage \`${row.storage_path}\` · preview OK=${row.storageReachable}`,
        );
        md.push(`  - original: ${row.original_url}`);
        md.push(`  - source: ${row.source_url}`);
      }
      md.push("");
    }
    if (model.failedDownloads?.length) {
      md.push("### Planned URLs that failed validation");
      md.push("");
      for (const row of model.failedDownloads) {
        md.push(`- \`${row.type}\`: ${row.error} — ${row.url}`);
      }
      md.push("");
    }
  }

  md.push("## Verification");
  md.push("");
  md.push("- Previews use EVFAKTA Storage public URLs only");
  md.push("- No OEM CDN hotlinks in Image Review preview fields");
  md.push("- All new candidates status=`pending`");
  md.push("- No publication / no gallery attach from this script");
  md.push("");

  const reportMdPath = resolve(process.cwd(), "docs/VW_VOLVO_IMAGE_REFRESH_REPORT.md");
  writeFileSync(reportMdPath, md.join("\n"));
  console.log(`\nWrote ${reportMdPath}`);
  console.log(`Wrote ${reportJsonPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
