/**
 * Finish Volkswagen to 100% Review Assistant where official sources allow.
 * ID.5 stays NOT_READY. No invented specs/images.
 *
 * Usage: npx tsx scripts/complete-volkswagen-100.ts
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeEditorialCompletion } from "../lib/admin/editorial-completion";

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

const CHECKED_AT = new Date().toISOString();

function fieldMeta(input: {
  source_name: string;
  source_url: string;
  notes?: string;
  confidence?: number;
}) {
  return {
    draft: false,
    notes: input.notes ?? null,
    confidence: input.confidence ?? 0.95,
    source_url: input.source_url,
    imported_at: CHECKED_AT,
    source_name: input.source_name,
    retrieved_at: CHECKED_AT,
    import_job_id: null,
    review_status: "approved",
    research_job_id: null,
    data_last_checked_at: CHECKED_AT,
  };
}

function appendNote(existing: string | null | undefined, section: string) {
  const base = String(existing ?? "").trim();
  if (base.includes(section.slice(0, 40))) return base;
  return `${base}\n\n${section}`.trim();
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  // ── ID.3: towing not possible + interior honesty + heat pump documented ──
  {
    const slug = "volkswagen-id-3";
    const { data: car, error } = await sb.from("cars").select("*").eq("slug", slug).single();
    if (error || !car) throw error ?? new Error(slug);
    const sources = { ...(car.field_sources as Record<string, unknown> | null) };
    const pdf =
      "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-3/tekniske_data_id3.pdf";
    sources.towing_kg = fieldMeta({
      source_name: "Volkswagen Norge — Tekniske data ID.3",
      source_url: pdf,
      notes: "PDF: Tilhenger ikke mulig. Car-level towing_kg=0.",
    });
    sources.heat_pump = fieldMeta({
      source_name: "Volkswagen Norge — Tekniske data ID.3",
      source_url: pdf,
      notes:
        "Varmepumpe appears in Lading og varmepumpe section; standard vs option not forced as boolean — documented in score_notes.",
      confidence: 0.9,
    });

    let notes = String(car.score_notes ?? "");
    notes = appendNote(
      notes,
      "## Tilhenger\nTilhenger ikke mulig ifølge Volkswagen Norge tekniske data ID.3 — ikke gjettet kapasitet.",
    );
    notes = appendNote(
      notes,
      "## Interiør\nOffisiell interiørfoto mangler i verifisert Newsroom-sett for denne katalogen — ikke tilgjengelig / ikke verifisert. Left empty.",
    );
    notes = appendNote(
      notes,
      "## Varme pumpe\nVarmepumpe er dokumentert i ID.3 tekniske data (Lading og varmepumpe). Bekreft standard vs ekstrautstyr per variant hos forhandler — boolean ikke tvunget uten matrise-bekreftelse.",
    );

    const { error: upd } = await sb
      .from("cars")
      .update({
        towing_kg: 0,
        score_notes: notes,
        field_sources: sources,
        data_last_checked_at: CHECKED_AT,
        updated_at: CHECKED_AT,
      })
      .eq("id", car.id);
    if (upd) throw upd;
  }

  // ── ID.4: model year 2027 ──
  {
    const slug = "volkswagen-id-4";
    const { data: car, error } = await sb.from("cars").select("*").eq("slug", slug).single();
    if (error || !car) throw error ?? new Error(slug);
    const sources = { ...(car.field_sources as Record<string, unknown> | null) };
    const pdf =
      "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-4/prisliste_id4.pdf";
    sources.year = fieldMeta({
      source_name: "Volkswagen Norge — ID.4 prisliste (Modellår 2027)",
      source_url: pdf,
      notes: "PDF header: Modellår 2027. Kundepriser per 01.07.2026.",
    });
    const { error: upd } = await sb
      .from("cars")
      .update({
        year: 2027,
        field_sources: sources,
        data_last_checked_at: CHECKED_AT,
        updated_at: CHECKED_AT,
      })
      .eq("id", car.id);
    if (upd) throw upd;
  }

  // ── ID.7: model year 2027 + interior honesty ──
  {
    const slug = "volkswagen-id-7";
    const { data: car, error } = await sb.from("cars").select("*").eq("slug", slug).single();
    if (error || !car) throw error ?? new Error(slug);
    const sources = { ...(car.field_sources as Record<string, unknown> | null) };
    const pdf =
      "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/prisliste-id7.pdf";
    sources.year = fieldMeta({
      source_name: "Volkswagen Norge — ID.7 prisliste (Modellår 2027)",
      source_url: pdf,
      notes: "PDF header: Modellår 2027. Kundepriser per 01.07.2026. Also stated on volkswagen.no ID.7 Tourer page.",
    });
    let notes = String(car.score_notes ?? "");
    notes = appendNote(
      notes,
      "## Interiør\nOffisiell interiørfoto mangler i verifisert Newsroom-sett for denne katalogen — ikke tilgjengelig / ikke verifisert. Left empty.",
    );
    // Set car-level towing from strongest documented variant (GTX 1800) for clarity
    sources.towing_kg = fieldMeta({
      source_name: "Volkswagen Norge — Tekniske data ID.7 / variant catalog",
      source_url:
        "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/tekniske-data-id7.pdf",
      notes: "Car-level 1800 kg mirrors GTX variants; Pro S Stasjonsvogn variant retains 1000 kg.",
    });
    const { error: upd } = await sb
      .from("cars")
      .update({
        year: 2027,
        towing_kg: 1800,
        score_notes: notes,
        field_sources: sources,
        data_last_checked_at: CHECKED_AT,
        updated_at: CHECKED_AT,
      })
      .eq("id", car.id);
    if (upd) throw upd;
  }

  // ── ID. Buzz: chemistry honesty + heat pump optional (false) ──
  {
    const slug = "volkswagen-id-buzz";
    const { data: car, error } = await sb.from("cars").select("*").eq("slug", slug).single();
    if (error || !car) throw error ?? new Error(slug);
    const sources = { ...(car.field_sources as Record<string, unknown> | null) };
    const pdf =
      "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz.pdf";
    sources.heat_pump = fieldMeta({
      source_name: "Volkswagen Norge — ID. Buzz prisliste",
      source_url: pdf,
      notes: "Varmepumpe ZW1 listed as ekstrautstyr (○) — not set as standard. heat_pump=false.",
    });
    sources.battery_chemistry = fieldMeta({
      source_name: "Volkswagen Norge — ID. Buzz prisliste/tekniske data",
      source_url: pdf,
      notes:
        "Batteritype / kjemi not stated in Norwegian Pro/GTX price PDFs — not invented. Documented gap.",
      confidence: 0.9,
    });
    // Mirror default Pro Kort towing to car level for practicality clarity
    sources.towing_kg = fieldMeta({
      source_name: "Volkswagen Norge — ID. Buzz tekniske data",
      source_url: pdf,
      notes: "Car-level 1200 kg = Pro Kort; see variants for Lang/GTX capacities.",
    });
    let notes = String(car.score_notes ?? "");
    notes = appendNote(
      notes,
      "## Batteritype\nBatterikjemi / Batteritype er ikke oppgitt i norsk ID. Buzz prisliste-PDF — ikke gjettet.",
    );
    notes = appendNote(
      notes,
      "## Varme pumpe\nVarmepumpe er ekstrautstyr (ZW1) i ID. Buzz Pro-dokumentasjon — ikke satt som standard her.",
    );
    const { error: upd } = await sb
      .from("cars")
      .update({
        heat_pump: false,
        towing_kg: 1200,
        score_notes: notes,
        field_sources: sources,
        data_last_checked_at: CHECKED_AT,
        updated_at: CHECKED_AT,
      })
      .eq("id", car.id);
    if (upd) throw upd;
  }

  // ── Confirm ID.5 still NOT_READY ──
  {
    const { data: id5 } = await sb
      .from("cars")
      .select("slug,import_status,is_published,import_notes")
      .eq("slug", "volkswagen-id-5")
      .single();
    if (id5?.is_published) {
      await sb.from("cars").update({ is_published: false }).eq("slug", "volkswagen-id-5");
    }
    if (id5 && id5.import_status === "approved") {
      await sb
        .from("cars")
        .update({
          import_status: "needs_review",
          import_notes: appendNote(
            id5.import_notes,
            "NOT_READY: insufficient official Norwegian tech PDF — do not invent specs/images.",
          ),
        })
        .eq("slug", "volkswagen-id-5");
    }
  }

  console.log("\nModel\tCompletion\tImage\tLaunch\tPublish\tStatus");
  for (const slug of [
    "volkswagen-id-3",
    "volkswagen-id-4",
    "volkswagen-id-7",
    "volkswagen-id-buzz",
    "volkswagen-id-5",
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
    const imageReady = hasHero && hasFront && hasSide;
    const notReady =
      slug === "volkswagen-id-5" ||
      /NOT_READY/i.test(String(car.import_notes ?? ""));
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
