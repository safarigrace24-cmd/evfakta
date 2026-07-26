/**
 * Complete Tesla + Volkswagen production batches.
 * Official sources only. Never publishes. Improves readiness + writes report.
 *
 * Usage: npx tsx scripts/complete-tesla-vw-batches.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { EDITORIAL_DRAFT_MARKER } from "../lib/admin/editorial-assist-core";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq);
    let v = t.slice(eq + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const CHECKED = "2026-07-26T12:00:00.000Z";
const REPORT = resolve(process.cwd(), "docs/TESLA_VW_BATCH_READINESS.md");
const DRAFT = EDITORIAL_DRAFT_MARKER;

type FieldSrc = {
  source_name: string;
  source_url: string;
  imported_at: string;
  retrieved_at: string;
  data_last_checked_at: string;
  confidence: number;
  review_status: "pending";
  draft?: boolean;
  notes?: string | null;
  research_job_id: null;
  import_job_id: null;
};

function src(
  name: string,
  url: string,
  confidence: number,
  notes?: string,
  draft = false,
): FieldSrc {
  return {
    source_name: name,
    source_url: url,
    imported_at: CHECKED,
    retrieved_at: CHECKED,
    data_last_checked_at: CHECKED,
    confidence,
    review_status: "pending",
    draft,
    notes: notes ?? null,
    research_job_id: null,
    import_job_id: null,
  };
}

function sb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureBrand(client: SupabaseClient, name: string, slug: string, website: string) {
  const { data: existing } = await client
    .from("brands")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await client
    .from("brands")
    .insert({
      name,
      slug,
      website_url: website,
      is_active: true,
      country: slug === "tesla" ? "US" : "DE",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

async function storeImageCandidates(
  client: SupabaseClient,
  brandId: string,
  brandName: string,
  carId: string,
  slug: string,
  model: string,
  sourceName: string,
  sourceUrl: string,
  images: Array<{
    original_url: string;
    alt_text: string;
    image_type: string;
    is_primary_candidate?: boolean;
  }>,
) {
  if (!images.length) return null;
  const { data: job, error: jobErr } = await client
    .from("research_jobs")
    .insert({
      brand_id: brandId,
      brand_name: brandName,
      model_query: model,
      provider_key: "structured_json",
      source_mode: "structured",
      source_name: sourceName,
      source_url: sourceUrl,
      status: "completed",
      progress_pct: 100,
      progress_message: "Image candidates (not attached)",
      summary: {
        modelsFound: 1,
        fieldsFound: 0,
        conflicts: 0,
        warnings: 0,
        missingFields: 0,
        imageCandidates: images.length,
        applied: 0,
        rejected: 0,
        approved: 0,
      },
      options: { production_batch: "tesla-vw-complete", car_id: carId },
    })
    .select("id")
    .single();
  if (jobErr) throw new Error(jobErr.message);

  const { data: item, error: itemErr } = await client
    .from("research_items")
    .insert({
      job_id: job.id,
      sort_order: 0,
      slug,
      brand: brandName,
      model,
      existing_car_id: carId,
      decision: "pending",
      warnings: ["Candidates only — do not auto-attach."],
      missing_fields: [],
      conflicts: [],
      proposed_car: { slug, brand: brandName, model },
      proposed_variants: [],
      message: "Official media candidates for editor review.",
    })
    .select("id")
    .single();
  if (itemErr) throw new Error(itemErr.message);

  const { error: imgErr } = await client.from("research_image_candidates").insert(
    images.map((image, index) => ({
      item_id: item.id,
      original_url: image.original_url,
      source_name: sourceName,
      source_url: sourceUrl,
      license_note: "Official manufacturer website media — verify rights before publish.",
      usage_terms: "Do not auto-attach or auto-approve.",
      alt_text: image.alt_text,
      image_type: image.image_type,
      is_primary_candidate: image.is_primary_candidate ?? index === 0,
      status: "pending",
      notes: "Candidate only.",
    })),
  );
  if (imgErr) throw new Error(imgErr.message);
  return { jobId: job.id as string, itemId: item.id as string, count: images.length };
}

async function upsertInactiveVariants(
  client: SupabaseClient,
  carId: string,
  variants: Array<Record<string, unknown>>,
) {
  for (let i = 0; i < variants.length; i += 1) {
    const v = variants[i];
    const slug = String(v.slug);
    const row = {
      car_id: carId,
      ...v,
      is_default: Boolean(v.is_default) || i === 0,
      is_active: false,
      sort_order: i,
      import_status: "needs_review",
      data_last_checked_at: CHECKED,
    };
    const { data: existing } = await client
      .from("car_variants")
      .select("id")
      .eq("car_id", carId)
      .eq("slug", slug)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await client.from("car_variants").update(row).eq("id", existing.id);
      if (error) throw new Error(`${slug}: ${error.message}`);
    } else {
      const { error } = await client.from("car_variants").insert(row);
      if (error) throw new Error(`${slug}: ${error.message}`);
    }
  }
}

type Readiness = {
  slug: string;
  brand: string;
  model: string;
  carId: string;
  status: "READY_FOR_APPROVAL" | "NOT_READY";
  why: string[];
  missing: string[];
  improved: string[];
  variants: number;
  imageCandidates: number;
  galleryCount: number;
  isPublished: boolean;
  importStatus: string;
};

async function main() {
  const client = sb();
  const teslaBrandId = await ensureBrand(
    client,
    "Tesla",
    "tesla",
    "https://www.tesla.com/no_NO",
  );
  const vwBrandId = await ensureBrand(
    client,
    "Volkswagen",
    "volkswagen",
    "https://www.volkswagen.no",
  );

  const results: Readiness[] = [];

  // ── Tesla Model 3: polish editorial + sources (specs already from EU manual) ──
  {
    const id = "cd2df65a-f868-4385-9c73-f79356f295ae";
    const page = "https://www.tesla.com/no_NO/model3";
    const manual =
      "https://www.tesla.com/ownersmanual/model3/en_eu/GUID-56562137-FC31-4110-A13C-9A9FC6657BF0.html";
    const description = [
      DRAFT,
      "",
      "Tesla Model 3 er en helelektrisk sedan solgt i Norge via Tesla. Highland-generasjonen er dokumentert i Tesla Model 3 Owner's Manual (Europe) med fem seter, frunk og CCS-lading.",
      "",
      "Bekreftede mål fra EU-manualen (RWD/Long Range-tabell): lengde 4720 mm, bredde uten speil 1850 mm, høyde 1440 mm, akselavstand 2875 mm, bagasje bak andre seterad 594 liter, frunk 88 liter. Performance har egne lengde-/høydetall (4724 / 1431 mm) notert på varianten.",
      "",
      "Batteri, WLTP-rekkevidde, forbruk, effekt og DC-ladeeffekt er bevisst tomme: Tesla Norge-siden kunne ikke bekreftes automatisk (HTTP 403). Tilhengervekt er todelt (750 kg uten / 1000 kg med brems) og lagres ikke som ett tall. Offisielle bilder må godkjennes manuelt.",
    ].join("\n");
    const pros = [
      DRAFT,
      "Offisiell EU-manual dokumenterer 594 l bagasje bak andre seterad + 88 l frunk",
      "Kompakt sedan med 2875 mm akselavstand — praktisk til daglig bruk",
      "CCS2 / Type 2 dokumentert for Europa i Tesla-manualen",
      "Varmepumpe omtalt i klimasystemet i Owner's Manual (kvalitativt — ingen vinter-km)",
    ];
    const cons = [
      DRAFT,
      "Variantspesifikk WLTP/batteri/effekt mangler offisiell Tesla Norge-bekreftelse (live-side blokkert)",
      "Tilhengervekt kan ikke lagres som én verdi (750 / 1000 kg)",
      "Ingen godkjent gallery-bilde ennå — kun kandidater",
      "Lengde/høyde varierer mellom RWD/Long Range og Performance",
    ];
    const suitable_for = [
      DRAFT,
      "Pendling og daglig bruk",
      "Små familier (5 seter)",
      "Langtur når variantens WLTP er bekreftet mot Tesla Norge",
      "Vinterbruk med forventning om varmepumpe — uten offisielle vintertall",
    ];
    const score_notes = [
      DRAFT,
      "",
      "## Winter considerations",
      "Owner's Manual beskriver varmepumpe i klimasystemet. Ingen offisiell vinterrekkevidde (km). Ikke finn opp tall.",
      "",
      "## Charging experience",
      "Europa: Type 2 AC + CCS DC ifølge manual. kW-tall og 10–80 %-tid mangler Tesla Norge-bekreftelse — tomme på bil/varianter.",
      "",
      "## Daily usability",
      "Sedan med frunk + 594 l bak. Fem seter. Parkeringsevne støttes av kompakte mål. Tilhenger krever fabrikkpakke og valg av brems/uten brems-kapasitet.",
    ].join("\n");

    const { data: prev } = await client
      .from("cars")
      .select("field_sources")
      .eq("id", id)
      .single();
    const field_sources = {
      ...((prev?.field_sources as Record<string, unknown>) ?? {}),
      description: src("EVFAKTA editorial draft", page, 0.55, DRAFT, true),
      pros: src("EVFAKTA editorial draft", manual, 0.55, DRAFT, true),
      cons: src("EVFAKTA editorial draft", manual, 0.55, DRAFT, true),
      suitable_for: src("EVFAKTA editorial draft", page, 0.55, DRAFT, true),
      score_notes: src("EVFAKTA editorial draft", page, 0.55, DRAFT, true),
      source_name: src("Tesla Norge + Tesla Owner's Manual (Europe)", page, 0.95),
      source_url: src("Tesla Norge", page, 0.95),
    };
    await client
      .from("cars")
      .update({
        description,
        pros,
        cons,
        suitable_for,
        score_notes,
        is_published: false,
        import_status: "needs_review",
        data_last_checked_at: CHECKED,
        source_name: "Tesla Norge + Tesla Owner's Manual (Europe)",
        source_url: page,
        field_sources,
        import_notes:
          "Tesla/VW completion pass 2026-07-26. Variant WLTP/battery empty pending Tesla Norge. Image candidates only.",
      })
      .eq("id", id);

    const { count: gallery } = await client
      .from("car_images")
      .select("id", { count: "exact", head: true })
      .eq("car_id", id);
    const { data: items } = await client
      .from("research_items")
      .select("id")
      .eq("existing_car_id", id);
    let candidates = 0;
    if (items?.length) {
      const { count } = await client
        .from("research_image_candidates")
        .select("id", { count: "exact", head: true })
        .in(
          "item_id",
          items.map((i) => i.id),
        );
      candidates = count ?? 0;
    }
    const { count: variantCount } = await client
      .from("car_variants")
      .select("id", { count: "exact", head: true })
      .eq("car_id", id);

    results.push({
      slug: "tesla-model-3",
      brand: "Tesla",
      model: "Model 3",
      carId: id,
      status: "READY_FOR_APPROVAL",
      why: [
        "Official EU Owner's Manual dimensions/cargo/frunk/warranty/connectors are sourced with field_sources.",
        "Four official trim shells exist; powertrain numbers left empty because Tesla Norge live fetch is blocked — documented, not invented.",
        "Image candidates already stored (pending) — none auto-attached.",
        "Editorial drafts improved and marked Draft – Requires editor review.",
        "Still unpublished / needs_review. Editor must attach image + rewrite drafts + confirm variant energy figures before publish.",
      ],
      missing: [
        "variant range_km / battery_* / power_hp / dc_charging_kw (Tesla Norge blocked)",
        "winter_range_km",
        "towing_kg as single value (750/1000 conflict)",
        "approved gallery image",
        "draft markers still present (expected until human edit)",
      ],
      improved: ["editorial description/pros/cons/suitable_for/score_notes", "source last-checked"],
      variants: variantCount ?? 0,
      imageCandidates: candidates,
      galleryCount: gallery ?? 0,
      isPublished: false,
      importStatus: "needs_review",
    });
  }

  // ── Tesla Model Y: unpublish, clear unsourced specs, create shells ──
  {
    const page = "https://www.tesla.com/no_NO/modely";
    const { data: car } = await client
      .from("cars")
      .select("id, image_url")
      .eq("slug", "tesla-model-y")
      .maybeSingle();
    if (!car) throw new Error("tesla-model-y missing");

    const description = [
      DRAFT,
      "",
      "Tesla Model Y er en helelektrisk SUV/crossover solgt i Norge via Tesla.",
      "",
      "Denne oppføringen er tilbakestilt til produksjonsskall: tidligere verdier for rekkevidde og DC-lading manglet offisiell kilde/field_sources og er fjernet. Tesla Norge-siden returnerte HTTP 403 i denne runden, og EU Owner's Manual-dimensjoner kunne ikke hentes pålitelig automatisk.",
      "",
      "Fyll batteri/WLTP/ytelse/mål kun fra Tesla Norge eller Tesla Model Y Owner's Manual (Europe) før godkjenning. Bildene må hentes manuelt fra offisielle Tesla-medier.",
    ].join("\n");

    const field_sources: Record<string, FieldSrc> = {
      description: src("EVFAKTA editorial draft", page, 0.55, DRAFT, true),
      pros: src("EVFAKTA editorial draft", page, 0.55, DRAFT, true),
      cons: src("EVFAKTA editorial draft", page, 0.55, DRAFT, true),
      suitable_for: src("EVFAKTA editorial draft", page, 0.55, DRAFT, true),
      score_notes: src("EVFAKTA editorial draft", page, 0.55, DRAFT, true),
      source_name: src("Tesla Norge (pending confirmation)", page, 0.7),
      source_url: src("Tesla Norge", page, 0.7),
      vehicle_type: src("Tesla Norge", page, 0.7, "SUV/crossover product family"),
      body_style: src("Tesla Norge", page, 0.7),
    };

    // Clear unsourced numbers; keep image_url only as pointer if present but do not treat as approved gallery
    await client
      .from("cars")
      .update({
        brand: "Tesla",
        brand_id: teslaBrandId,
        model: "Model Y",
        is_published: false,
        import_status: "needs_review",
        country: "NO",
        source_name: "Tesla Norge (pending official confirmation)",
        source_url: page,
        data_last_checked_at: CHECKED,
        range_km: null,
        battery_kwh: null,
        battery_total_kwh: null,
        battery_usable_kwh: null,
        dc_charging_kw: null,
        ac_charging_kw: null,
        charge_time_10_80_minutes: null,
        power_hp: null,
        torque_nm: null,
        acceleration_0_100: null,
        top_speed_kmh: null,
        winter_range_km: null,
        real_world_range_km: null,
        consumption_kwh_100km: null,
        length_mm: null,
        width_mm: null,
        height_mm: null,
        wheelbase_mm: null,
        cargo_l: null,
        frunk_l: null,
        seats: null,
        towing_kg: null,
        heat_pump: null,
        warranty: null,
        charging_connector_ac: null,
        charging_connector_dc: null,
        vehicle_type: "Personbil",
        body_style: "SUV",
        description,
        pros: [
          DRAFT,
          "Offisiell Tesla Norge-produktside finnes som kildepeker",
          "Ingen falske tall beholdt etter produksjonsgjennomgang",
        ],
        cons: [
          DRAFT,
          "Ingen bekreftede dimensjoner/batteri/WLTP i denne runden (Tesla Norge 403 / EU-manual ikke hentet)",
          "Ingen research image candidates lagret (Tesla CDN blokkert)",
          "Må ikke publiseres før offisiell manuell bekreftelse",
        ],
        suitable_for: [DRAFT, "Ukjent til spesifikasjoner er bekreftet"],
        score_notes: [
          DRAFT,
          "",
          "## Winter considerations",
          "Ikke dokumentert i denne runden — ikke gjett.",
          "",
          "## Charging experience",
          "Ikke dokumentert i denne runden — ikke gjett.",
          "",
          "## Daily usability",
          "SUV-format forventet, men ingen offisielle litertall lagret ennå.",
        ].join("\n"),
        field_sources,
        import_notes:
          "Was incorrectly published with unsourced range/DC. Unpublished and cleared 2026-07-26. Shell awaiting Tesla Norge / EU manual.",
      })
      .eq("id", car.id);

    await upsertInactiveVariants(client, car.id, [
      {
        name: "Long Range RWD",
        slug: "long-range-rwd",
        drivetrain: "Bakhjulstrekk",
        is_default: true,
        source_name: "Tesla Norge (pending)",
        source_url: page,
        import_notes: "Empty shell — fill from Tesla Norge only.",
      },
      {
        name: "Long Range AWD",
        slug: "long-range-awd",
        drivetrain: "Firehjulsdrift",
        source_name: "Tesla Norge (pending)",
        source_url: page,
        import_notes: "Empty shell — fill from Tesla Norge only.",
      },
      {
        name: "Performance",
        slug: "performance",
        drivetrain: "Firehjulsdrift",
        source_name: "Tesla Norge (pending)",
        source_url: page,
        import_notes: "Empty shell — fill from Tesla Norge only.",
      },
    ]);

    results.push({
      slug: "tesla-model-y",
      brand: "Tesla",
      model: "Model Y",
      carId: car.id,
      status: "NOT_READY",
      why: [
        "Was published with unsourced range_km/dc_charging_kw — unpublished and cleared.",
        "Tesla Norge live page blocked (403); EU Owner's Manual dimensions not verified in this pass.",
        "No official image candidates stored (Tesla media fetch blocked).",
        "Variant shells created empty — no inventing of WLTP/battery.",
      ],
      missing: [
        "all technical specs",
        "field provenance for specs",
        "official image candidates",
        "gallery",
        "verified EU manual dimensions/cargo",
      ],
      improved: [
        "is_published=false",
        "import_status=needs_review",
        "cleared unsourced specs",
        "3 variant shells",
        "editorial draft shell",
      ],
      variants: 3,
      imageCandidates: 0,
      galleryCount: 0,
      isPublished: false,
      importStatus: "needs_review",
    });
  }

  // ── Tesla Model S / Model X shells ──
  for (const model of [
    {
      slug: "tesla-model-s",
      model: "Model S",
      page: "https://www.tesla.com/no_NO/models",
      variants: [
        { name: "Model S", slug: "model-s", is_default: true },
        { name: "Plaid", slug: "plaid", is_default: false },
      ],
    },
    {
      slug: "tesla-model-x",
      model: "Model X",
      page: "https://www.tesla.com/no_NO/modelx",
      variants: [
        { name: "Model X", slug: "model-x", is_default: true },
        { name: "Plaid", slug: "plaid", is_default: false },
      ],
    },
  ]) {
    const { data: existing } = await client
      .from("cars")
      .select("id")
      .eq("slug", model.slug)
      .maybeSingle();

    const description = [
      DRAFT,
      "",
      `Tesla ${model.model} er en helelektrisk modell solgt i Norge via Tesla.`,
      "",
      "Produksjonsskall i Tesla batch 01: ingen spesifikasjoner er fylt fordi Tesla Norge ikke kunne bekreftes automatisk i denne runden. Ikke gjett tall.",
      "",
      "Neste steg: manuell research mot Tesla Norge + Owner's Manual (Europe), lagre field_sources, lag variants, foreslå offisielle bilder — aldri auto-publiser.",
    ].join("\n");

    const patch = {
      brand: "Tesla",
      brand_id: teslaBrandId,
      model: model.model,
      slug: model.slug,
      is_published: false,
      import_status: "needs_review",
      country: "NO",
      vehicle_type: "Personbil",
      source_name: "Tesla Norge (pending official confirmation)",
      source_url: model.page,
      data_last_checked_at: CHECKED,
      description,
      pros: [DRAFT, "Offisiell Tesla Norge-produktside som kildepeker"],
      cons: [
        DRAFT,
        "Ingen offisielt bekreftede spesifikasjoner i denne batchen",
        "Ingen image candidates",
      ],
      suitable_for: [DRAFT, "Ukjent til spesifikasjoner er bekreftet"],
      score_notes: [
        DRAFT,
        "",
        "## Winter considerations",
        "Ikke dokumentert — ikke gjett.",
        "",
        "## Charging experience",
        "Ikke dokumentert — ikke gjett.",
        "",
        "## Daily usability",
        "Ikke dokumentert — ikke gjett.",
      ].join("\n"),
      field_sources: {
        description: src("EVFAKTA editorial draft", model.page, 0.55, DRAFT, true),
        pros: src("EVFAKTA editorial draft", model.page, 0.55, DRAFT, true),
        cons: src("EVFAKTA editorial draft", model.page, 0.55, DRAFT, true),
        suitable_for: src("EVFAKTA editorial draft", model.page, 0.55, DRAFT, true),
        score_notes: src("EVFAKTA editorial draft", model.page, 0.55, DRAFT, true),
        source_name: src("Tesla Norge (pending)", model.page, 0.6),
        source_url: src("Tesla Norge", model.page, 0.6),
      },
      import_notes: "Tesla batch 01 shell — empty until official NO confirmation.",
    };

    let carId: string;
    if (existing?.id) {
      carId = existing.id;
      await client
        .from("cars")
        .update({ ...patch, is_published: false })
        .eq("id", carId);
    } else {
      const { data, error } = await client.from("cars").insert(patch).select("id").single();
      if (error) throw new Error(`${model.slug}: ${error.message}`);
      carId = data.id;
    }

    await upsertInactiveVariants(
      client,
      carId,
      model.variants.map((v) => ({
        ...v,
        source_name: "Tesla Norge (pending)",
        source_url: model.page,
        import_notes: "Empty shell.",
      })),
    );

    results.push({
      slug: model.slug,
      brand: "Tesla",
      model: model.model,
      carId,
      status: "NOT_READY",
      why: [
        "Empty production shell only — no official specs verified this pass.",
        "Tesla Norge live research blocked historically; no inventing.",
        "No image candidates.",
      ],
      missing: ["all technical specs", "image candidates", "editorial substance beyond draft shell"],
      improved: ["created/updated unpublished shell", "variant shells", "draft editorial markers"],
      variants: model.variants.length,
      imageCandidates: 0,
      galleryCount: 0,
      isPublished: false,
      importStatus: "needs_review",
    });
  }

  // ── Volkswagen improvements ──
  const vwPdf = {
    id3: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-3/tekniske_data_id3.pdf",
    id4: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-4/tekniske_data_id4.pdf",
    id7: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/tekniske-data-id7.pdf",
    buzz: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz.pdf",
    buzzGtx:
      "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz-gtx.pdf",
  };

  // ID.7 dimensions from PDF
  {
    const id = "2d799eaf-774d-4d1c-9d38-09da217efaaa";
    const { data: prev } = await client.from("cars").select("field_sources").eq("id", id).single();
    const field_sources = {
      ...((prev?.field_sources as Record<string, unknown>) ?? {}),
      width_mm: src(
        "Volkswagen Norge — Tekniske data ID.7 (April 2026)",
        vwPdf.id7,
        0.95,
        "Bredde 1862 mm (uten speil). Med speil 2141 mm.",
      ),
      wheelbase_mm: src(
        "Volkswagen Norge — Tekniske data ID.7 (April 2026)",
        vwPdf.id7,
        0.95,
        "Akselavstand 2971 mm.",
      ),
      height_mm: src(
        "Volkswagen Norge — Tekniske data ID.7 (April 2026)",
        vwPdf.id7,
        0.9,
        "Høyde med takreling 1536 mm / 1551 mm (Fastback vs Tourer) — bilnivå bruker 1536; se konflikt.",
      ),
    };
    await client
      .from("cars")
      .update({
        width_mm: 1862,
        wheelbase_mm: 2971,
        height_mm: 1536,
        field_sources,
        data_last_checked_at: CHECKED,
        is_published: false,
        import_status: "needs_review",
        import_notes:
          "Completion pass: width/wheelbase/height from ID.7 PDF. Height conflict Fastback 1536 vs Tourer 1551 documented.",
      })
      .eq("id", id);

    await storeImageCandidates(
      client,
      vwBrandId,
      "Volkswagen",
      id,
      "volkswagen-id-7",
      "ID.7",
      "Volkswagen Norge — ID.7 cutout / modellmedia",
      "https://www.volkswagen.no/no/alle-bilmodeller/id7.html",
      [
        {
          original_url:
            "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/cutout/personbil/id7-tourer/id7-tourer.jpg",
          alt_text: "Volkswagen ID.7 Tourer — offisielt cutout-bilde (VW Norge)",
          image_type: "exterior",
          is_primary_candidate: true,
        },
      ],
    );
  }

  // ID. Buzz GTX ranges from official GTX prisliste
  {
    const id = "52e06fcd-2e61-4cd7-8916-1dcf6b841f88";
    await client
      .from("car_variants")
      .update({
        range_km: 418,
        import_notes:
          "WLTP inntil 418 km from ID. Buzz GTX prisliste (GTX 4MOTION 79 kWh, non-Exclusive). Exclusive listed 411 km — not applied.",
        data_last_checked_at: CHECKED,
        source_name: "Volkswagen Norge — ID. Buzz GTX prisliste/tekniske data",
        source_url: vwPdf.buzzGtx,
      })
      .eq("car_id", id)
      .eq("slug", "gtx-kort");
    await client
      .from("car_variants")
      .update({
        range_km: 465,
        import_notes:
          "WLTP inntil 465 km from ID. Buzz GTX prisliste (GTX 4MOTION Lang 86 kWh, non-Exclusive). Exclusive listed 456 km — not applied.",
        data_last_checked_at: CHECKED,
        source_name: "Volkswagen Norge — ID. Buzz GTX prisliste/tekniske data",
        source_url: vwPdf.buzzGtx,
      })
      .eq("car_id", id)
      .eq("slug", "gtx-lang");

    await storeImageCandidates(
      client,
      vwBrandId,
      "Volkswagen",
      id,
      "volkswagen-id-buzz",
      "ID. Buzz",
      "Volkswagen Norge — ID. Buzz modellside",
      "https://www.volkswagen.no/no/alle-bilmodeller/id-buzz.html",
      [
        {
          original_url:
            "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/bjarne/16_9_DSC02506.jpg",
          alt_text: "Volkswagen ID. Buzz — offisielt bilde (VW Norge)",
          image_type: "exterior",
        },
        {
          original_url:
            "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/exterior/1_1_ib000715pic.jpg",
          alt_text: "Volkswagen ID. Buzz eksteriør — offisielt bilde",
          image_type: "exterior",
        },
        {
          original_url:
            "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/interior/1_1_ib000690pic.jpg",
          alt_text: "Volkswagen ID. Buzz interiør — offisielt bilde",
          image_type: "interior",
        },
      ],
    );
  }

  // Extra ID.3 / ID.4 image candidates
  await storeImageCandidates(
    client,
    vwBrandId,
    "Volkswagen",
    "531fa6cc-a163-4b9d-963e-814bff2bffba",
    "volkswagen-id-3",
    "ID.3",
    "Volkswagen Norge — ID.3 modellside",
    "https://www.volkswagen.no/no/alle-bilmodeller/id3.html",
    [
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/exterior/IN0285-ID3-exterior-front-side.jpg",
        alt_text: "Volkswagen ID.3 — offisielt eksteriørbilde",
        image_type: "exterior",
      },
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/interior/IN0333-id3-interior-unecce.jpg",
        alt_text: "Volkswagen ID.3 — offisielt interiørbilde",
        image_type: "interior",
      },
    ],
  );
  await storeImageCandidates(
    client,
    vwBrandId,
    "Volkswagen",
    "c8c17bab-7248-46f9-8cc9-e7ed36a42706",
    "volkswagen-id-4",
    "ID.4",
    "Volkswagen Norge — ID.4 modellside",
    "https://www.volkswagen.no/no/alle-bilmodeller/id4.html",
    [
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-4/exterior/IC0948_ID4_side_rear.jpg",
        alt_text: "Volkswagen ID.4 — offisielt eksteriørbilde",
        image_type: "exterior",
      },
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-4/exterior/IC1330_id4_exterior_black-style.jpg",
        alt_text: "Volkswagen ID.4 Black Style — offisielt bilde",
        image_type: "exterior",
      },
    ],
  );

  // ID.5: add official media candidate only (still no tech PDF)
  await storeImageCandidates(
    client,
    vwBrandId,
    "Volkswagen",
    "78d4d39b-af28-434e-9a26-8a1fc198c550",
    "volkswagen-id-5",
    "ID.5",
    "Volkswagen master media (ID.5 path on volkswagen.no)",
    "https://www.volkswagen.no/no/alle-bilmodeller.html",
    [
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-5/iqdrive/IC0464_ID5-iq-drive.jpg",
        alt_text: "Volkswagen ID.5 — offisielt media (IQ Drive-motiv; ikke teknisk brosjyre)",
        image_type: "other",
        is_primary_candidate: false,
      },
    ],
  );

  // Refresh VW readiness rows
  const vwCars = [
    {
      slug: "volkswagen-id-3",
      model: "ID.3",
      ready: true as const,
      whyReady: [
        "Official VW Norge tekniske-data PDF fully mapped to variants.",
        "Shared dimensions sourced; conflicts documented (length 4264 vs 4261; marketing 430 vs PDF max 586).",
        "Image candidates present; none attached/approved.",
        "Editorial drafts present with draft marker.",
      ],
      missing: [
        "approved gallery",
        "price_nok",
        "winter_range_km",
        "heat_pump on car row (variant-dependent)",
        "human rewrite of draft markers",
      ],
    },
    {
      slug: "volkswagen-id-4",
      model: "ID.4",
      ready: true as const,
      whyReady: [
        "Official ID.4 PDF (Mai 2026) for Pro 4MOTION + GTX 4MOTION.",
        "Towing 1800 kg (with brakes) stored; 750 kg conflict documented.",
        "Image candidates present.",
        "Editorial drafts present.",
      ],
      missing: [
        "approved gallery",
        "torque_nm (134/560 split)",
        "winter_range_km",
        "human draft rewrite",
      ],
    },
    {
      slug: "volkswagen-id-5",
      model: "ID.5",
      ready: false as const,
      whyReady: [],
      whyNot: [
        "No current ID.5 tekniske-data PDF / model page on volkswagen.no (redirects).",
        "Only warranty text + weak media candidate — not enough for approval.",
      ],
      missing: ["all technical specs", "variants", "usable primary exterior candidate", "NO tech PDF"],
    },
    {
      slug: "volkswagen-id-7",
      model: "ID.7",
      ready: true as const,
      whyReady: [
        "Official ID.7 PDF variants populated.",
        "Width/wheelbase/height filled from PDF this pass; height Fastback/Tourer conflict documented.",
        "Official Tourer cutout image candidate added.",
        "Editorial drafts present.",
      ],
      missing: [
        "approved gallery",
        "Pro without S / 77 kWh full column",
        "GTX torque as single value",
        "human draft rewrite",
      ],
    },
    {
      slug: "volkswagen-id-buzz",
      model: "ID. Buzz",
      ready: true as const,
      whyReady: [
        "Pro + GTX variants from official Pro/GTX PDFs.",
        "GTX WLTP filled this pass (418 / 465 km non-Exclusive).",
        "Additional official exterior/interior candidates stored.",
        "Editorial drafts present.",
      ],
      missing: [
        "approved gallery",
        "single cargo_l / seats (config-dependent)",
        "Exclusive vs non-Exclusive range conflict on GTX",
        "human draft rewrite",
      ],
    },
  ];

  for (const row of vwCars) {
    const { data: car } = await client
      .from("cars")
      .select("id, is_published, import_status")
      .eq("slug", row.slug)
      .single();
    if (!car) continue;
    await client
      .from("cars")
      .update({ is_published: false, import_status: "needs_review", data_last_checked_at: CHECKED })
      .eq("id", car.id);

    const { count: variantCount } = await client
      .from("car_variants")
      .select("id", { count: "exact", head: true })
      .eq("car_id", car.id);
    const { count: gallery } = await client
      .from("car_images")
      .select("id", { count: "exact", head: true })
      .eq("car_id", car.id);
    const { data: items } = await client
      .from("research_items")
      .select("id")
      .eq("existing_car_id", car.id);
    let candidates = 0;
    if (items?.length) {
      const { count } = await client
        .from("research_image_candidates")
        .select("id", { count: "exact", head: true })
        .in(
          "item_id",
          items.map((i) => i.id),
        );
      candidates = count ?? 0;
    }

    results.push({
      slug: row.slug,
      brand: "Volkswagen",
      model: row.model,
      carId: car.id,
      status: row.ready ? "READY_FOR_APPROVAL" : "NOT_READY",
      why: row.ready ? row.whyReady : (row as { whyNot: string[] }).whyNot,
      missing: row.missing,
      improved:
        row.slug === "volkswagen-id-7"
          ? ["width_mm", "height_mm", "wheelbase_mm", "image candidate"]
          : row.slug === "volkswagen-id-buzz"
            ? ["GTX range_km 418/465", "extra image candidates"]
            : row.slug === "volkswagen-id-5"
              ? ["media candidate (non-primary)"]
              : ["extra image candidates", "re-verified unpublished"],
      variants: variantCount ?? 0,
      imageCandidates: candidates,
      galleryCount: gallery ?? 0,
      isPublished: false,
      importStatus: "needs_review",
    });
  }

  // Safety: no Tesla/VW published
  await client
    .from("cars")
    .update({ is_published: false })
    .in("brand", ["Tesla", "Volkswagen"])
    .eq("is_published", true);

  const lines: string[] = [];
  lines.push("# Tesla + Volkswagen batch readiness");
  lines.push("");
  lines.push(`**Checked:** ${CHECKED}`);
  lines.push("**Standards:** `CAR_BLUEPRINT.md`, `REFERENCE_WORKFLOW.md`, `PRODUCTION_CHECKLIST.md`");
  lines.push("**Rule:** Never invent specs. Never auto-publish. Approval ≠ publish.");
  lines.push("");
  lines.push("## Status board");
  lines.push("");
  lines.push("| Brand | Model | Slug | Status | Variants | Image candidates | Gallery | Published |");
  lines.push("|-------|-------|------|--------|----------|------------------|---------|-----------|");
  for (const r of results) {
    lines.push(
      `| ${r.brand} | ${r.model} | \`${r.slug}\` | **${r.status}** | ${r.variants} | ${r.imageCandidates} | ${r.galleryCount} | ${r.isPublished} |`,
    );
  }
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push(
    `- READY_FOR_APPROVAL: ${results.filter((r) => r.status === "READY_FOR_APPROVAL").length}`,
  );
  lines.push(`- NOT_READY: ${results.filter((r) => r.status === "NOT_READY").length}`);
  lines.push("");
  lines.push("## Per model");
  lines.push("");
  for (const r of results) {
    lines.push(`### ${r.brand} ${r.model} — **${r.status}**`);
    lines.push("");
    lines.push(`- Car id: \`${r.carId}\``);
    lines.push(`- import_status: \`${r.importStatus}\``);
    lines.push(`- is_published: \`${r.isPublished}\``);
    lines.push("");
    lines.push("#### Why");
    lines.push("");
    for (const w of r.why) lines.push(`- ${w}`);
    lines.push("");
    lines.push("#### Missing");
    lines.push("");
    for (const m of r.missing) lines.push(`- ${m}`);
    lines.push("");
    lines.push("#### Improved this pass");
    lines.push("");
    for (const m of r.improved) lines.push(`- ${m}`);
    lines.push("");
  }
  lines.push("## Production checklist gate");
  lines.push("");
  lines.push("| Section | Tesla Model 3 | Other Tesla | VW ID.3/4/7/Buzz | VW ID.5 |");
  lines.push("|---------|---------------|-------------|------------------|---------|");
  lines.push("| Official source | Pass (EU manual + NO pointer) | Fail / pending NO | Pass (NO PDF) | Fail (no tech PDF) |");
  lines.push("| Images | Candidates only | Missing | Candidates only | Weak candidate |");
  lines.push("| Variants | Shells OK; energy empty | Shells empty | Pass | None |");
  lines.push("| Specifications | Partial (dims yes / energy no) | Empty | Pass (variant-level) | Empty |");
  lines.push("| Editorial | Drafts present | Shell drafts | Drafts present | Shell drafts |");
  lines.push("| Review | Ready for human | Blocked | Ready for human | Blocked |");
  lines.push("| Approval | Awaiting editor | No | Awaiting editor | No |");
  lines.push("| Publication | Blocked | Blocked | Blocked | Blocked |");
  lines.push("");
  lines.push("## Batch gate");
  lines.push("");
  lines.push("- No model was published by this pass.");
  lines.push("- Model Y was force-unpublished (had been published with unsourced specs).");
  lines.push("- Next human actions: attach/approve images, rewrite draft markers, confirm Tesla energy figures on Tesla Norge, then approve — still do not auto-publish.");
  lines.push("");

  writeFileSync(REPORT, lines.join("\n"));
  console.log(JSON.stringify({ report: REPORT, results }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
