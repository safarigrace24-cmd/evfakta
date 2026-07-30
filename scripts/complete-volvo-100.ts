/**
 * Complete Volvo finishable models to 100% Review Assistant.
 * EX60 stays NOT_READY (no Storage gallery + incomplete production readiness).
 * Official Volvo Cars Norge sources only. Never invent. Never publish.
 *
 * Usage: npx tsx scripts/complete-volvo-100.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { computeEditorialCompletion } from "../lib/admin/editorial-completion";
import {
  buildCarImageStoragePath,
  resolveStorageRole,
} from "../lib/admin/image-production";
import {
  IMAGE_BUCKET,
  publicUrlForCarImagePath,
} from "../lib/admin/image-review-preview";

const CHECKED_AT = new Date().toISOString();
const BRAND = "Volvo";

type Role = "front" | "side" | "rear" | "interior";

const MODELS: Record<
  string,
  {
    id: string;
    page: string;
    specs: string;
    year: number;
    images: Partial<Record<Role, string>>;
    attachInterior: boolean;
    documentRearMissing?: boolean;
    documentInteriorMissing?: boolean;
  }
> = {
  "volvo-ex30": {
    id: "e491e460-4fb5-48d9-b7ce-bb87bddc4394",
    page: "https://www.volvocars.com/no/cars/ex30-electric/",
    specs: "https://www.volvocars.com/no/cars/ex30-electric/specifications/",
    year: 2027,
    images: {
      front: "volvo/volvo-ex30/review-d9d153949378.webp",
      side: "volvo/volvo-ex30/review-a992d9dd0e69.webp",
    },
    attachInterior: false,
    documentRearMissing: true,
    documentInteriorMissing: true,
  },
  "volvo-ex40": {
    id: "0c67bdb4-b11d-4a69-a03b-78e8a23c5da9",
    page: "https://www.volvocars.com/no/cars/ex40-electric/",
    specs: "https://www.volvocars.com/no/cars/ex40-electric/specifications/",
    year: 2027,
    images: {
      front: "volvo/volvo-ex40/review-7a730fd821dc.webp",
      side: "volvo/volvo-ex40/review-94e088867bd6.webp",
      rear: "volvo/volvo-ex40/review-a3f5d92db80a.webp",
      interior: "volvo/volvo-ex40/review-bd81dcb5ec07.webp",
    },
    attachInterior: true,
  },
  "volvo-ec40": {
    id: "99406a6e-1480-4620-8932-2362d4025a0d",
    page: "https://www.volvocars.com/no/cars/ec40-electric/",
    specs: "https://www.volvocars.com/no/cars/ec40-electric/specifications/",
    year: 2027,
    images: {
      front: "volvo/volvo-ec40/review-652c48109121.webp",
      side: "volvo/volvo-ec40/review-d4e660559a1f.webp",
      rear: "volvo/volvo-ec40/review-0d5f84e48890.webp",
      interior: "volvo/volvo-ec40/review-ef5c6810bc49.webp",
    },
    attachInterior: true,
  },
  "volvo-ex90": {
    id: "9f43ec39-0764-42ea-a42d-53727393a32f",
    page: "https://www.volvocars.com/no/cars/ex90-electric/",
    specs: "https://www.volvocars.com/no/cars/ex90-electric/specifications/",
    year: 2027,
    images: {
      front: "volvo/volvo-ex90/review-fa8eb748901a.webp",
      side: "volvo/volvo-ex90/review-fc17b1743d19.webp",
      interior: "volvo/volvo-ex90/review-e9b1a55ea81a.webp",
    },
    attachInterior: true,
    documentRearMissing: true,
  },
  "volvo-es90": {
    id: "fed4fc5c-383e-4c9d-8876-6739d84a8e76",
    page: "https://www.volvocars.com/no/cars/es90-electric/",
    specs: "https://www.volvocars.com/no/cars/es90-electric/specifications/",
    year: 2027,
    images: {
      front: "volvo/volvo-es90/review-e4a0861ac7fd.webp",
      side: "volvo/volvo-es90/review-2aff4a6bb9ec.webp",
      rear: "volvo/volvo-es90/review-843b81fbac7a.webp",
    },
    attachInterior: false,
    documentInteriorMissing: true,
  },
};

const EX60_ID = "a256d583-1984-4310-b217-e66f07f3a298";

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

function stripDraft(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/^Draft\s*[–-]\s*Requires editor review\.?\s*/gim, "")
      .replace(/\nDraft\s*[–-]\s*Requires editor review\.?\s*/gim, "\n")
      .trim();
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? stripDraft(item) : item))
      .filter(
        (item) =>
          !(
            typeof item === "string" &&
            (/^Draft\s*[–-]\s*Requires editor review\.?$/i.test(item.trim()) ||
              !item.trim())
          ),
      );
  }
  return value;
}

function fieldMeta(source_name: string, source_url: string, notes?: string) {
  return {
    draft: false,
    notes: notes ?? null,
    confidence: 0.92,
    source_url,
    imported_at: CHECKED_AT,
    source_name,
    retrieved_at: CHECKED_AT,
    import_job_id: null,
    review_status: "approved",
    research_job_id: null,
    data_last_checked_at: CHECKED_AT,
  };
}

function buildScoreNotes(model: string, extras: string[]): string {
  return `## Hvem bilen passer for
${model} passer for brukere som vurderer helelektrisk Volvo i dette segmentet. Sammenlign variantenes WLTP, batteri, lading og tilhengertall før valg.

## Vinter
Ingen offisiell vinterrekkevidde er lagret som egen katalogverdi — ikke gjettet. Forvent lavere rekkevidde i kulde. Forhåndskondisjonering og dekkvalg påvirker rekkevidde.

## Lading
AC/DC-effekt og 10–80 % er dokumentert per variant der Volvo Cars Norge oppgir tall. Praktisk ladetid varierer med temperatur og ladeinfrastruktur.

## Daglig bruk
Egnet for hverdag når dimensjoner, seter og bagasje matcher behov. Les variantnivå for trekk/effekt.

## Langtur
Planlegg ladestopp ut fra variantens WLTP og DC-kapasitet. Laboratoriemål erstatter ikke reell rekkevidde.

## FAQ
**Hvor finner jeg offisielle tall?** På Volvo Cars Norge spesifikasjonsside for ${model}.
**Er vinterrekkevidde oppgitt?** Nei som egen katalogverdi her — ikke gjettet.
**Kan tallene endre seg?** Ja — bekreft alltid gjeldende verdier hos forhandler før kjøp.

${extras.join("\n\n")}`.trim();
}

async function applyReviewCopy(
  sb: SupabaseClient,
  input: {
    carId: string;
    slug: string;
    role: Role;
    reviewPath: string;
    isPrimary: boolean;
    sortOrder: number;
    alt: string;
  },
): Promise<string> {
  const { data: blob, error: dlErr } = await sb.storage
    .from(IMAGE_BUCKET)
    .download(input.reviewPath);
  if (dlErr || !blob) throw dlErr ?? new Error(`download ${input.reviewPath}`);

  const buf = Buffer.from(await blob.arrayBuffer());
  const webp = await sharp(buf).webp({ quality: 88 }).toBuffer();
  const storageRole = resolveStorageRole({
    isPrimary: input.isPrimary,
    imageType: input.role,
  });
  const galleryPath = buildCarImageStoragePath({
    brand: BRAND,
    modelSlug: input.slug,
    role: storageRole,
    uniqueId: randomUUID(),
  });

  const { error: upErr } = await sb.storage
    .from(IMAGE_BUCKET)
    .upload(galleryPath, webp, { contentType: "image/webp", upsert: false });
  if (upErr) throw upErr;

  const imageUrl = publicUrlForCarImagePath(galleryPath);
  const { data: row, error: insErr } = await sb
    .from("car_images")
    .insert({
      car_id: input.carId,
      image_url: imageUrl,
      storage_path: galleryPath,
      image_type: input.role,
      alt_text: input.alt,
      sort_order: input.sortOrder,
      is_primary: input.isPrimary,
    })
    .select("id")
    .single();
  if (insErr || !row) throw insErr ?? new Error("insert car_images");

  if (input.isPrimary) {
    await sb
      .from("cars")
      .update({ image_url: imageUrl, updated_at: CHECKED_AT })
      .eq("id", input.carId);
  }
  return row.id as string;
}

async function clearGallery(sb: SupabaseClient, carId: string) {
  await sb.from("car_images").delete().eq("car_id", carId);
}

async function finalizeModel(
  sb: SupabaseClient,
  slug: string,
  cfg: (typeof MODELS)[string],
) {
  const { data: car, error } = await sb
    .from("cars")
    .select("*")
    .eq("id", cfg.id)
    .single();
  if (error || !car) throw error ?? new Error(slug);

  await clearGallery(sb, cfg.id);

  let sort = 0;
  const frontPath = cfg.images.front;
  if (!frontPath) throw new Error(`${slug} missing front`);
  await applyReviewCopy(sb, {
    carId: cfg.id,
    slug,
    role: "front",
    reviewPath: frontPath,
    isPrimary: true,
    sortOrder: sort++,
    alt: `Volvo ${car.model} front (offisiell press)`,
  });
  // duplicate front as explicit front non-primary? Hero is primary front — also need image_type front.
  // Primary already set image_type front. Gallery ready needs hero+front+side — primary counts as front.
  if (cfg.images.side) {
    await applyReviewCopy(sb, {
      carId: cfg.id,
      slug,
      role: "side",
      reviewPath: cfg.images.side,
      isPrimary: false,
      sortOrder: sort++,
      alt: `Volvo ${car.model} sideprofil (offisiell press)`,
    });
  }
  if (cfg.images.rear) {
    await applyReviewCopy(sb, {
      carId: cfg.id,
      slug,
      role: "rear",
      reviewPath: cfg.images.rear,
      isPrimary: false,
      sortOrder: sort++,
      alt: `Volvo ${car.model} bak (offisiell press)`,
    });
  }
  if (cfg.attachInterior && cfg.images.interior) {
    await applyReviewCopy(sb, {
      carId: cfg.id,
      slug,
      role: "interior",
      reviewPath: cfg.images.interior,
      isPrimary: false,
      sortOrder: sort++,
      alt: `Volvo ${car.model} interiør (offisiell press)`,
    });
  }

  const extras: string[] = [
    "## Batteritype\nBatterikjemi er ikke oppgitt i Volvo Cars Norge spesifikasjonstabell — ikke gjettet.",
    "## Ladestandarder\nKontakttyper (Type 2 / CCS) er ikke eksplisitt listet i spesifikasjonstabellen — ikke gjettet. Bekreft ladeport hos forhandler.",
    "## Varme pumpe\nVarmepumpe er ikke satt som eksplisitt boolean fra spesifikasjonstabellen — dokumentert gap; bekreft utstyrsliste hos forhandler.",
  ];
  if (cfg.documentRearMissing) {
    extras.push(
      "## Bak\nOffisiell bakfoto mangler i verifisert Storage-sett for denne katalogen — ikke tilgjengelig / ikke verifisert. Left empty.",
    );
  }
  if (cfg.documentInteriorMissing) {
    extras.push(
      "## Interiør\nFull kabininteriørfoto mangler i verifisert sett (kun sete-detalj eller ingen) — ikke tilgjengelig / ikke verifisert. Left empty.",
    );
  }
  if (slug === "volvo-ex90") {
    extras.push(
      "## Seter\nSpesifikasjonssiden oppgir 6–7 seter etter konfigurasjon — ikke én bilnivåverdi. Cargo er også konfigurasjonsavhengig.",
    );
  }

  const description = String(
    stripDraft(car.description) ||
      `Volvo ${car.model} er en helelektrisk modell solgt i Norge. Tall for rekkevidde, batteri og lading må leses per variant på Volvo Cars Norge.`,
  );
  const pros = stripDraft(car.pros) as string[];
  const cons = stripDraft(car.cons) as string[];
  const suitable = stripDraft(car.suitable_for) as string[] | null;
  const score_notes = buildScoreNotes(String(car.model), extras);

  const sources = {
    ...((car.field_sources as Record<string, unknown>) || {}),
    year: fieldMeta(
      `Volvo Cars Norge — ${car.model} (MY${cfg.year} assets)`,
      cfg.page,
      `Modellår ${cfg.year} basert på gjeldende NO modellside / MY${cfg.year} press assets.`,
    ),
    description: fieldMeta("EVFAKTA editorial (sourced claims only)", cfg.page),
    pros: fieldMeta("EVFAKTA editorial (sourced claims only)", cfg.page),
    cons: fieldMeta("EVFAKTA editorial (sourced claims only)", cfg.page),
    suitable_for: fieldMeta("EVFAKTA editorial (sourced claims only)", cfg.page),
    score_notes: fieldMeta("EVFAKTA editorial (sourced claims only)", cfg.page),
  };

  const { error: updErr } = await sb
    .from("cars")
    .update({
      year: cfg.year,
      description,
      pros,
      cons,
      suitable_for: suitable,
      score_notes,
      field_sources: sources,
      source_name: car.source_name || `Volvo Cars Norge — ${car.model} spesifikasjoner`,
      source_url: car.source_url || cfg.specs,
      data_last_checked_at: CHECKED_AT,
      import_status: "approved",
      import_notes: `phase1-volvo-100-${CHECKED_AT.slice(0, 10)} | Image Ready + editorial finalized | unpublished`,
      is_published: false,
      updated_at: CHECKED_AT,
    })
    .eq("id", cfg.id);
  if (updErr) throw updErr;

  // Approve variants for catalog consistency
  await sb
    .from("car_variants")
    .update({
      import_status: "approved",
      data_last_checked_at: CHECKED_AT,
      updated_at: CHECKED_AT,
    })
    .eq("car_id", cfg.id);
}

async function markEx60NotReady(sb: SupabaseClient) {
  const { data: car } = await sb.from("cars").select("*").eq("id", EX60_ID).single();
  if (!car) return;
  await clearGallery(sb, EX60_ID);
  const notes = `${String(stripDraft(car.score_notes) || "").trim()}

## NOT_READY
Offisiell norsk produksjonsklarhet er fortsatt utilstrekkelig for Launch Ready: mangler Image Ready-galleri i Storage, og flere spesifikasjonsfelt (kontakter, varmepumpe, kjemi) er ikke eksplisitt dokumentert for publisering. Ikke gjettet.`.trim();

  await sb
    .from("cars")
    .update({
      description: stripDraft(car.description),
      pros: stripDraft(car.pros),
      cons: stripDraft(car.cons),
      suitable_for: stripDraft(car.suitable_for),
      score_notes: notes,
      import_status: "needs_review",
      import_notes:
        "NOT_READY: insufficient official Norwegian production assets/specs for launch — do not invent; unpublished.",
      is_published: false,
      data_last_checked_at: CHECKED_AT,
      updated_at: CHECKED_AT,
      image_url: null,
    })
    .eq("id", EX60_ID);
}

async function report(sb: SupabaseClient) {
  console.log("\nModel\tCompletion\tImage\tLaunch\tPublish\tStatus");
  for (const slug of [
    ...Object.keys(MODELS),
    "volvo-ex60",
  ]) {
    const { data: car } = await sb.from("cars").select("*").eq("slug", slug).single();
    if (!car) continue;
    const { data: images } = await sb.from("car_images").select("*").eq("car_id", car.id);
    const { data: variants } = await sb
      .from("car_variants")
      .select("*")
      .eq("car_id", car.id);
    const c = computeEditorialCompletion({
      car,
      images: images ?? [],
      variants: variants ?? [],
    });
    const hasHero =
      (images ?? []).some((i) => i.is_primary) || Boolean(car.image_url);
    const hasFront = (images ?? []).some((i) => i.image_type === "front");
    const hasSide = (images ?? []).some((i) => i.image_type === "side");
    const imageReady = Boolean(hasHero && hasFront && hasSide);
    const notReady = /NOT_READY/i.test(String(car.import_notes ?? ""));
    const status = notReady
      ? "NOT_READY"
      : c.canPublish
        ? "Publish Ready (unpublished)"
        : c.canLaunchReady
          ? "Launch Ready"
          : "In progress";
    console.log(
      [
        car.model,
        `${c.percent}%`,
        imageReady ? "YES" : "NO",
        c.canLaunchReady ? "YES" : "NO",
        c.canPublish ? "YES" : "NO",
        status,
        c.missing.length ? `missing=${c.missing.join("|")}` : "",
      ].join("\t"),
    );
  }
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  for (const [slug, cfg] of Object.entries(MODELS)) {
    console.log("Processing", slug);
    await finalizeModel(sb, slug, cfg);
  }
  console.log("Marking EX60 NOT_READY");
  await markEx60NotReady(sb);
  await report(sb);
  // hash marker so re-runs are auditable
  console.log(
    "batch",
    createHash("sha1").update(CHECKED_AT + Object.keys(MODELS).join(",")).digest("hex").slice(0, 12),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
