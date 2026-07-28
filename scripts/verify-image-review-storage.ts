/**
 * One-shot: verify Image Review Storage workflow for Volkswagen / Volvo / Toyota.
 *
 * - Existing OEM candidates that fail download → marked Download Failed (never hotlinked)
 * - Happy-path: downloadable bytes → review WebP in car-images → reachable after "restart"
 *
 * Usage: npx tsx scripts/verify-image-review-storage.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

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

const BRANDS = ["Volkswagen", "Volvo", "Toyota"] as const;
const BUCKET = "car-images";
const FAILED = "Download Failed";

type CandidateRow = {
  id: string;
  original_url: string | null;
  storage_path: string | null;
  notes: string | null;
};

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

async function ensureReviewCopy(
  supabase: SupabaseClient<any, "public", any>,
  candidate: CandidateRow,
  brand: string,
  modelSlug: string,
): Promise<CandidateRow> {
  if (candidate.storage_path?.trim()) return candidate;
  if (candidate.notes?.includes(FAILED)) return candidate;
  if (!candidate.original_url?.trim()) {
    const notes = candidate.notes?.includes(FAILED)
      ? candidate.notes
      : [candidate.notes, FAILED].filter(Boolean).join(" | ");
    await supabase
      .from("research_image_candidates")
      .update({ notes } as any)
      .eq("id", candidate.id);
    return { ...candidate, notes };
  }

  try {
    const response = await fetch(candidate.original_url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EVFAKTAImageReview/1.0; +https://www.evfakta.no)",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: new URL(candidate.original_url).origin + "/",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const webp = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const id = createHash("sha1")
      .update(candidate.id || randomUUID())
      .digest("hex")
      .slice(0, 12);
    const storagePath = `${slugify(brand)}/${slugify(modelSlug)}/review-${id}.webp`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, webp, {
        contentType: "image/webp",
        upsert: false,
        cacheControl: "3600",
      });
    if (uploadError) throw new Error(uploadError.message);

    const notes = [candidate.notes, "review-copy:stored"].filter(Boolean).join(" | ");
    await supabase
      .from("research_image_candidates")
      .update({ storage_path: storagePath, notes } as any)
      .eq("id", candidate.id);

    return { ...candidate, storage_path: storagePath, notes };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Fetch failed";
    const notes = [candidate.notes, `download-error:${reason}`, FAILED]
      .filter(Boolean)
      .join(" | ");
    await supabase
      .from("research_image_candidates")
      .update({ notes } as any)
      .eq("id", candidate.id);
    return { ...candidate, notes };
  }
}

async function verifyHappyPath(
  supabase: SupabaseClient<any, "public", any>,
  baseUrl: string,
  brand: string,
) {
  // Simulate: server downloads bytes → stores review WebP → Image Review uses Storage URL.
  const jpeg = await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 3,
      background: { r: 15, g: 107, b: 69 },
    },
  })
    .jpeg()
    .toBuffer();

  const webp = await sharp(jpeg)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const originalUrl = `https://cdn.example-${slugify(brand)}.invalid/official/${slugify(brand)}-studio.jpg`;
  const storagePath = `${slugify(brand)}/verify-${slugify(brand)}-fixture/review-fixture.webp`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, webp, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "3600",
  });
  if (uploadError) {
    console.error(`HAPPY-PATH FAIL ${brand}:`, uploadError.message);
    process.exitCode = 1;
    return;
  }

  const preview = publicUrl(baseUrl, storagePath);
  const head = await fetch(preview, { method: "HEAD" });
  const hotlink = preview === originalUrl;

  console.log(
    JSON.stringify({
      kind: "happy-path",
      brand,
      hasStoragePath: true,
      previewIsStorage: preview.includes("/storage/v1/object/public/car-images/"),
      storageReachable: head.ok,
      hotlinksOem: hotlink,
      originalUrlKept: Boolean(originalUrl),
    }),
  );

  if (!head.ok || hotlink) {
    console.error(`HAPPY-PATH FAIL ${brand}`);
    process.exitCode = 1;
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("--- Existing candidates (OEM URLs may be expired → Download Failed) ---");
  for (const brand of BRANDS) {
    const { data: cars, error: carsError } = await supabase
      .from("cars")
      .select("id, slug, brand, model")
      .ilike("brand", brand)
      .limit(3);

    if (carsError) {
      console.error(`[${brand}] cars query failed:`, carsError.message);
      continue;
    }
    if (!cars?.length) {
      console.log(`[${brand}] no cars found`);
      continue;
    }

    for (const car of cars) {
      const { data: items } = await supabase
        .from("research_items")
        .select("id")
        .eq("existing_car_id", car.id);

      const itemIds = (items ?? []).map((row: any) => row.id as string).filter(Boolean);
      if (!itemIds.length) {
        console.log(`[${brand}] ${car.slug}: no research items`);
        continue;
      }

      const { data: candidates } = await supabase
        .from("research_image_candidates")
        .select("id, original_url, storage_path, notes")
        .in("item_id", itemIds)
        .in("status", ["pending", "approved"])
        .limit(2);

      if (!candidates?.length) {
        console.log(`[${brand}] ${car.slug}: no candidates`);
        continue;
      }

      for (const row of candidates as CandidateRow[]) {
        const image = await ensureReviewCopy(
          supabase,
          row,
          car.brand || brand,
          car.slug,
        );
        const preview = image.storage_path
          ? publicUrl(url, image.storage_path)
          : "";
        const oem = image.original_url || "";
        const okStorage =
          Boolean(image.storage_path) &&
          preview.includes("/storage/v1/object/public/car-images/");
        const hotlink = Boolean(preview) && oem && preview === oem;
        const failed = Boolean(image.notes?.includes(FAILED));

        let storageReachable = false;
        if (okStorage) {
          const head = await fetch(preview, { method: "HEAD" });
          storageReachable = head.ok;
        }

        console.log(
          JSON.stringify({
            brand,
            slug: car.slug,
            candidateId: image.id,
            hasStoragePath: Boolean(image.storage_path),
            previewIsStorage: okStorage,
            storageReachable,
            hotlinksOem: hotlink,
            downloadFailed: failed,
            originalUrlKept: Boolean(oem),
          }),
        );

        if (hotlink) {
          console.error("FAIL: preview still hotlinks OEM URL");
          process.exitCode = 1;
        }
        if (!failed && !okStorage && oem) {
          console.error("FAIL: expected Storage preview or Download Failed");
          process.exitCode = 1;
        }
      }
    }
  }

  console.log("--- Happy-path (VW / Volvo / Toyota → durable Storage preview) ---");
  for (const brand of BRANDS) {
    await verifyHappyPath(supabase, url, brand);
  }

  console.log("--- Persistence check (Storage still reachable after restart sim) ---");
  for (const brand of BRANDS) {
    const storagePath = `${slugify(brand)}/verify-${slugify(brand)}-fixture/review-fixture.webp`;
    const preview = publicUrl(url, storagePath);
    const head = await fetch(preview, { method: "HEAD" });
    console.log(
      JSON.stringify({
        brand,
        storageReachableAfterRestartSim: head.ok,
        previewIsStorage: preview.includes("/storage/v1/object/public/car-images/"),
      }),
    );
    if (!head.ok) process.exitCode = 1;
  }

  if (process.exitCode) {
    console.error("Verification failed.");
  } else {
    console.log(
      "Verification complete — expired OEM → Download Failed; happy-path → durable Storage previews.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
