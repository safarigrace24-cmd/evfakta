/**
 * Volkswagen final editorial preparation (content only).
 * Never publishes. Never auto-approves. Does not touch Tesla.
 *
 * Usage: npx tsx scripts/finalize-volkswagen-editorial.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { EDITORIAL_DRAFT_MARKER } from "../lib/admin/editorial-assist-core";
import { getPublishIssues } from "../lib/admin/publish-readiness";

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

const CHECKED = "2026-07-26T14:00:00.000Z";
const DRAFT = EDITORIAL_DRAFT_MARKER;
const REPORT = resolve(process.cwd(), "docs/VOLKSWAGEN_FINAL_EDITORIAL_REVIEW.md");

const PDF = {
  id3: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-3/tekniske_data_id3.pdf",
  id4: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-4/tekniske_data_id4.pdf",
  id7: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/tekniske-data-id7.pdf",
  buzz: "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz.pdf",
  buzzGtx:
    "https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz-gtx.pdf",
};

const PAGE = {
  id3: "https://www.volkswagen.no/no/alle-bilmodeller/id3.html",
  id4: "https://www.volkswagen.no/no/alle-bilmodeller/id4.html",
  id7: "https://www.volkswagen.no/no/alle-bilmodeller/id7.html",
  buzz: "https://www.volkswagen.no/no/alle-bilmodeller/id-buzz.html",
  prices: "https://www.volkswagen.no/no/kjope-bil/prisliste.html",
};

const IDS = {
  id3: "531fa6cc-a163-4b9d-963e-814bff2bffba",
  id4: "c8c17bab-7248-46f9-8cc9-e7ed36a42706",
  id5: "78d4d39b-af28-434e-9a26-8a1fc198c550",
  id7: "2d799eaf-774d-4d1c-9d38-09da217efaaa",
  buzz: "52e06fcd-2e61-4cd7-8916-1dcf6b841f88",
} as const;

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

function withDraft(body: string) {
  return `${DRAFT}\n\n${body.trim()}`;
}

async function countGallery(client: SupabaseClient, carId: string) {
  const { count } = await client
    .from("car_images")
    .select("id", { count: "exact", head: true })
    .eq("car_id", carId);
  return count ?? 0;
}

async function listImageCandidates(client: SupabaseClient, carId: string) {
  const { data: items } = await client
    .from("research_items")
    .select("id")
    .eq("existing_car_id", carId);
  if (!items?.length) return [];
  const { data } = await client
    .from("research_image_candidates")
    .select("id, original_url, image_type, status, license_note, source_url, alt_text")
    .in(
      "item_id",
      items.map((i) => i.id),
    )
    .order("created_at", { ascending: true });
  return data ?? [];
}

async function storeImageCandidates(
  client: SupabaseClient,
  brandId: string,
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
    notes?: string;
  }>,
) {
  if (!images.length) return;
  const existing = await listImageCandidates(client, carId);
  const have = new Set(existing.map((r) => r.original_url));
  const fresh = images.filter((image) => !have.has(image.original_url));
  if (!fresh.length) return;

  const { data: job, error: jobErr } = await client
    .from("research_jobs")
    .insert({
      brand_id: brandId,
      brand_name: "Volkswagen",
      model_query: model,
      provider_key: "structured_json",
      source_mode: "structured",
      source_name: sourceName,
      source_url: sourceUrl,
      status: "completed",
      progress_pct: 100,
      progress_message: "Editorial image candidates (pending only)",
      summary: {
        modelsFound: 1,
        fieldsFound: 0,
        conflicts: 0,
        warnings: 0,
        missingFields: 0,
        imageCandidates: fresh.length,
        applied: 0,
        rejected: 0,
        approved: 0,
      },
      options: { production_batch: "volkswagen-final-editorial", car_id: carId },
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
      brand: "Volkswagen",
      model,
      existing_car_id: carId,
      decision: "pending",
      warnings: ["Candidates only — do not auto-attach or auto-approve."],
      missing_fields: [],
      conflicts: [],
      proposed_car: { slug, brand: "Volkswagen", model },
      proposed_variants: [],
      message: "Official VW media candidates for human image selection.",
    })
    .select("id")
    .single();
  if (itemErr) throw new Error(itemErr.message);

  const { error: imgErr } = await client.from("research_image_candidates").insert(
    fresh.map((image, index) => ({
      item_id: item.id,
      original_url: image.original_url,
      source_name: sourceName,
      source_url: sourceUrl,
      license_note:
        "Official Volkswagen website / DAM media — verify usage rights before attaching.",
      usage_terms: "Do not auto-attach or auto-approve. Pending human review.",
      alt_text: image.alt_text,
      image_type: image.image_type,
      is_primary_candidate: image.is_primary_candidate ?? index === 0,
      status: "pending",
      notes: image.notes ?? "Candidate only — human must select and approve.",
    })),
  );
  if (imgErr) throw new Error(imgErr.message);
}

async function updateEditorial(
  client: SupabaseClient,
  carId: string,
  pdfUrl: string,
  pageUrl: string,
  sourceName: string,
  payload: {
    description: string;
    pros: string[];
    cons: string[];
    suitable_for: string[];
    score_notes: string;
    import_notes: string;
  },
) {
  const { data: prev } = await client
    .from("cars")
    .select("field_sources")
    .eq("id", carId)
    .single();
  const field_sources = {
    ...((prev?.field_sources as Record<string, unknown>) ?? {}),
    description: src("EVFAKTA editorial draft", pageUrl, 0.55, DRAFT, true),
    pros: src("EVFAKTA editorial draft", pageUrl, 0.55, DRAFT, true),
    cons: src("EVFAKTA editorial draft", pageUrl, 0.55, DRAFT, true),
    suitable_for: src("EVFAKTA editorial draft", pageUrl, 0.55, DRAFT, true),
    score_notes: src("EVFAKTA editorial draft", pageUrl, 0.55, DRAFT, true),
  };

  const { error } = await client
    .from("cars")
    .update({
      description: withDraft(payload.description),
      pros: [DRAFT, ...payload.pros],
      cons: [DRAFT, ...payload.cons],
      suitable_for: payload.suitable_for,
      score_notes: withDraft(payload.score_notes),
      source_name: sourceName,
      source_url: pdfUrl,
      data_last_checked_at: CHECKED,
      field_sources,
      import_status: "needs_review",
      is_published: false,
      import_notes: payload.import_notes,
    })
    .eq("id", carId);
  if (error) throw new Error(error.message);
}

async function main() {
  const client = sb();
  const changed: string[] = [];

  const { data: brand } = await client
    .from("brands")
    .select("id")
    .eq("slug", "volkswagen")
    .maybeSingle();
  if (!brand) throw new Error("Volkswagen brand missing");
  const brandId = brand.id as string;

  // ── Spec gap fills (official PDF only) ──
  {
    const { data: gtxKort } = await client
      .from("car_variants")
      .select("id, towing_kg, torque_nm, range_km")
      .eq("car_id", IDS.buzz)
      .eq("slug", "gtx-kort")
      .maybeSingle();
    if (gtxKort) {
      const { error } = await client
        .from("car_variants")
        .update({
          towing_kg: 1800,
          torque_nm: 560,
          range_km: gtxKort.range_km ?? 418,
          source_name: "Volkswagen Norge — ID. Buzz GTX prisliste/tekniske data",
          source_url: PDF.buzzGtx,
          data_last_checked_at: CHECKED,
          import_notes:
            "Towing 1800 kg (PDF; footnote: 1700 kg on short 7-seater). Torque 560 Nm from GTX tech table. WLTP non-Exclusive 418 km (Exclusive 411 not applied).",
          import_status: "needs_review",
          is_active: false,
        })
        .eq("id", gtxKort.id);
      if (error) throw new Error(error.message);
      changed.push("variant gtx-kort: towing_kg=1800, torque_nm=560");
    }

    const { data: gtxLang } = await client
      .from("car_variants")
      .select("id, towing_kg, torque_nm, range_km")
      .eq("car_id", IDS.buzz)
      .eq("slug", "gtx-lang")
      .maybeSingle();
    if (gtxLang) {
      const { error } = await client
        .from("car_variants")
        .update({
          towing_kg: 1600,
          torque_nm: 560,
          range_km: gtxLang.range_km ?? 465,
          source_name: "Volkswagen Norge — ID. Buzz GTX prisliste/tekniske data",
          source_url: PDF.buzzGtx,
          data_last_checked_at: CHECKED,
          import_notes:
            "Towing 1600 kg (PDF). Torque 560 Nm from GTX tech table. WLTP non-Exclusive 465 km (Exclusive 456 not applied).",
          import_status: "needs_review",
          is_active: false,
        })
        .eq("id", gtxLang.id);
      if (error) throw new Error(error.message);
      changed.push("variant gtx-lang: towing_kg=1600, torque_nm=560");
    }
  }

  // ID.7 variant cargo notes (do not mix Fastback/Tourer onto car blindly)
  for (const row of [
    {
      slug: "pro-s-stasjonsvogn",
      note: "Tourer cargo 605 l (official ID.7 PDF). Do not use Fastback 532 l for this variant.",
    },
    {
      slug: "gtx-fastback",
      note: "Fastback cargo 532 l (official ID.7 PDF). Do not use Tourer 605 l for this variant.",
    },
    {
      slug: "gtx-stasjonsvogn",
      note: "Tourer cargo 605 l (official ID.7 PDF). Do not use Fastback 532 l for this variant.",
    },
  ]) {
    const { data: v } = await client
      .from("car_variants")
      .select("id, import_notes")
      .eq("car_id", IDS.id7)
      .eq("slug", row.slug)
      .maybeSingle();
    if (!v) continue;
    const prev = String(v.import_notes ?? "");
    if (prev.includes("cargo")) continue;
    await client
      .from("car_variants")
      .update({
        import_notes: prev ? `${prev} | ${row.note}` : row.note,
        data_last_checked_at: CHECKED,
      })
      .eq("id", v.id);
    changed.push(`variant ${row.slug}: cargo separation note`);
  }

  // ── Editorial packages ──
  await updateEditorial(
    client,
    IDS.id3,
    PDF.id3,
    PAGE.id3,
    "Volkswagen Norge — Tekniske data ID.3 (Desember 2025)",
    {
      description: `Volkswagen ID.3 er en kompakt helelektrisk hatchback solgt i Norge. Modellen tilbys i flere batteri- og effektnivåer (Pure, Pro, Pro S og GTX), og variantspesifikke tall for rekkevidde, batteri, effekt og lading er lagt på variantnivå i katalogen.

Tallene i spesifikasjonene er hentet fra Volkswagens norske tekniske dokumentasjon. WLTP-rekkevidde er laboratoriemål, ikke reell kjøreopplevelse. EVFAKTA har ikke gjennomført egen test av denne bilen.`,
      pros: [
        "Kompakt format som egner seg godt i by og for daglig pendling",
        "Flere batteristørrelser og effektnivåer dokumentert i norsk teknisk PDF",
        "CCS-hurtiglading og Type 2 vekselstrømlading er dokumentert",
        "Fem sitteplasser og praktisk hatchback-bagasjevolum oppgitt av produsenten",
        "GTX-varianter gir høyere effekt i samme modellfamilie",
      ],
      cons: [
        "Kan være mindre egnet for store familier som trenger mye bagasjeplass",
        "Vinterrekkevidde er ikke oppgitt som offisiell katalogverdi og er ikke testet av EVFAKTA",
        "Modellside og teknisk PDF kan bruke ulike «inntil»-tall for rekkevidde — bruk variantverdier",
        "Varme pumpe-status kan variere mellom utstyrsnivåer og er ikke lagret som én bilnivåverdi",
      ],
      suitable_for: [
        "Pendlerne",
        "Bybrukere",
        "Små familier",
        "Firmabilbrukere",
      ],
      score_notes: `## Hvem bilen passer for
ID.3 passer primært for bybruk, pendling og hverdagskjøring der kompakt størrelse er en fordel. Langdistanseegenskapene avhenger av valgt batterivariant (WLTP), ikke av modellnavnet alene.

## Styrker
Kompakt format, flere dokumenterte batteri-/effektnivåer, og klare lade-/batteritall i norsk teknisk PDF.

## Svakheter
Begrenset bagasje sammenlignet med større SUV-er/varebilvarianter. Vinterytelse er ikke dokumentert med offisiell vinterrekkevidde her.

## Vinterhensyn
Kaldt vær reduserer typisk rekkevidde og kan øke ladetid. EVFAKTA har ikke egne vintertall for ID.3. Bruk WLTP kun som referanse, ikke som forventet vinterrekkevidde.

## Ladeopplevelse
Offisiell dokumentasjon oppgir AC- og DC-ladeverdier per variant. 10–80 %-tider er lagret der PDF oppgir dem. Ladeopplevelse i praksis avhenger av ladeinfrastruktur og temperatur.

## Langdistanse
Lengre turer er mer realistiske på Pro S / GTX med høyere WLTP-tall. Planlegg ladestopp ut fra faktisk forbruk, ikke WLTP alene.

## Daglig bruk
Kompakt størrelse, fem seter og Type 2/CCS gjør bilen relevant for hverdagsbruk. Praktisk egnethet avhenger av valgt variant.

## Familie / praktisk
Fem seter og hatchback-volum kan dekke små familier. Større familier eller tung tilhengerbruk bør vurdere større modeller.`,
      import_notes:
        "Final editorial pass 2026-07-26. Specs from ID.3 tekniske-data PDF. Unpublished. Draft markers retained for human rewrite.",
    },
  );
  changed.push("ID.3 editorial package");

  await updateEditorial(
    client,
    IDS.id4,
    PDF.id4,
    PAGE.id4,
    "Volkswagen Norge — Tekniske data ID.4 (Mai 2026)",
    {
      description: `Volkswagen ID.4 er en helelektrisk SUV solgt i Norge. I denne katalogen er Pro 4MOTION og GTX 4MOTION dokumentert med egne variantverdier for batteri, WLTP-rekkevidde, effekt og lading.

Spesifikasjonene er hentet fra Volkswagens norske tekniske data (Mai 2026). WLTP er laboratoriemål. EVFAKTA har ikke testet bilen selv.`,
      pros: [
        "SUV-format med fem seter og dokumentert bagasjevolum",
        "4MOTION-varianter med offisielle effekt- og batteritall",
        "Dokumentert tilhengerkapasitet med brems (se også konflikt for uten brems)",
        "Varme pumpe og V2L er oppgitt i norsk teknisk dokumentasjon for aktuelle varianter",
        "CCS DC-lading med variantspesifikke maksimale verdier",
      ],
      cons: [
        "Kan være mindre egnet for dem som trenger en kompakt bybil",
        "Dreiemoment oppgis per aksel i PDF og er derfor ikke lagret som én katalogverdi",
        "Lengde kan avvike noen millimeter mellom Pro og GTX i samme PDF",
        "Vinterrekkevidde er ikke offisielt oppgitt som egen katalogverdi her",
      ],
      suitable_for: [
        "Familier",
        "Pendlerne",
        "Langdistansesjåfører",
        "Tilhengerbrukere",
        "Firmabilbrukere",
      ],
      score_notes: `## Hvem bilen passer for
ID.4 er rettet mot familier og brukere som vil ha SUV-format, firehjulstrekk-varianter og dokumentert tilhengerkapasitet.

## Styrker
Praktisk SUV-pakke, 4MOTION-varianter og relativt klare lade-/batteritall i norsk PDF.

## Svakheter
Større fotavtrykk enn kompaktmodeller. Enkelte verdier (dreiemoment, tilhenger uten/med brems) må leses nøye i kilden.

## Vinterhensyn
Ingen offisiell vinterrekkevidde er lagret. Forvent lavere rekkevidde og mulig lengre ladetid i kulde. 4MOTION kan være relevant for vinterføre, men erstatter ikke vinterdekk og forsiktig planlegging.

## Ladeopplevelse
AC- og DC-verdier er dokumentert per variant. Praktisk ladetid avhenger av ladestasjon, batteritemperatur og ladekurve.

## Langdistanse
WLTP-tallene for Pro/GTX gir et laboratoriegrunnlag for planlegging, men er ikke reell rekkevidde. Planlegg ladestopp med margin.

## Daglig bruk
SUV-format, fem seter og CCS gjør bilen aktuell for hverdag og familiebruk.

## Familie / praktisk
Dokumentert bagasjevolum og tilhengertall støtter familie- og fritidsbruk. Bekreft tilhengervekt for din konfigurasjon i offisiell dokumentasjon.`,
      import_notes:
        "Final editorial pass 2026-07-26. Specs from ID.4 PDF Mai 2026. Conflicts retained for length/towing/torque. Unpublished.",
    },
  );
  changed.push("ID.4 editorial package");

  await updateEditorial(
    client,
    IDS.id7,
    PDF.id7,
    PAGE.id7,
    "Volkswagen Norge — Tekniske data ID.7 (April 2026)",
    {
      description: `Volkswagen ID.7 er en helelektrisk bilfamilie i Norge med både fastback og Tourer (stasjonsvogn). Pro S Tourer, GTX Fastback og GTX Tourer er lagret som separate varianter. Bagasjevolum og enkelte mål må ikke blandes mellom karosseriformene.

Tallene kommer fra Volkswagens norske tekniske data (April 2026). WLTP er laboratoriemål. EVFAKTA har ikke testet bilen.`,
      pros: [
        "Lange dokumenterte WLTP-tall på Pro S Tourer i norsk PDF",
        "Tourer-varianter gir mer bagasjevolum enn fastback (offisielle tall holdes adskilt)",
        "Høy dokumentert DC-ladehastighet på 86 kWh-varianter",
        "Varme pumpe og V2L er oppgitt i teknisk dokumentasjon for aktuelle varianter",
        "Både fastback og stasjonsvogn dekker ulike praktiske behov i samme modellfamilie",
      ],
      cons: [
        "Kan være mindre egnet for dem som trenger kompakt bybil",
        "GTX dreiemoment er todelt i PDF og derfor ikke lagret som én verdi",
        "Pro uten S / 77 kWh-kolonnen er ikke fullt utlagt som egen variant i denne runden",
        "Høyde kan avvike mellom Fastback og Tourer — bilnivå bruker Fastback-tall med dokumentert konflikt",
      ],
      suitable_for: [
        "Familier",
        "Langdistansesjåfører",
        "Pendlerne",
        "Firmabilbrukere",
      ],
      score_notes: `## Hvem bilen passer for
ID.7 passer for dem som vil ha en større elbil med lange WLTP-tall og, i Tourer-utførelse, mer lastevolum.

## Styrker
Sterke dokumenterte rekkevidde-/ladetall på 86 kWh-varianter, samt tydelig skille mellom fastback og Tourer.

## Svakheter
Større bil. Enkelte tekniske verdier er kropps- eller variantspesifikke og må leses på rett rad.

## Vinterhensyn
Ingen offisiell vinterrekkevidde er lagret. Lange WLTP-tall reduseres typisk i kulde. Varme pumpe er dokumentert, men erstatter ikke realistisk vinterplanlegging.

## Ladeopplevelse
PDF oppgir blant annet 10–80 % og DC opptil 200 kW på 86 kWh-varianter. 77 kWh-linjer med lavere DC er dokumentert som konflikt/merknad, ikke blandet inn i 86 kWh-varianter.

## Langdistanse
Pro S Tourer har de høyeste WLTP-tallene i denne batchen. Bruk variantverdien, ikke et modellnivå-gjennomsnitt.

## Daglig bruk
Fem seter og CCS/Type 2 støtter hverdagsbruk. Tourer er mer relevant når bagasje er viktig.

## Familie / praktisk
Tourer 605 l vs Fastback 532 l (PDF) — velg variant etter behov. Ikke bland tallene.`,
      import_notes:
        "Final editorial pass 2026-07-26. Fastback/Tourer cargo kept separate in notes. Height conflict Fastback/Tourer documented. Unpublished.",
    },
  );
  changed.push("ID.7 editorial package");

  await updateEditorial(
    client,
    IDS.buzz,
    PDF.buzz,
    PAGE.buzz,
    "Volkswagen Norge — ID. Buzz prisliste/tekniske data",
    {
      description: `Volkswagen ID. Buzz er en helelektrisk personbil/MPV solgt i Norge i kort og lang akselavstand, inkludert GTX 4MOTION. Rekkevidde, lengde, batteri, tilhenger og bagasje må leses per kort/lang- og Pro/GTX-variant.

Kildene er Volkswagens norske Pro- og GTX-dokumenter. WLTP er laboratoriemål. EVFAKTA har ikke testet bilen.`,
      pros: [
        "Kort og lang akselavstand dekker ulike plassbehov",
        "GTX 4MOTION med dokumentert høyere effekt og tilhengertall i GTX-PDF",
        "Romslig MPV-format med flere seteoppsett oppgitt av produsenten",
        "CCS-hurtiglading med variantspesifikke DC-verdier",
        "Praktisk lasteadkomst dokumentert i offisielt materiale (kandidatbilder finnes)",
      ],
      cons: [
        "Kan være mindre egnet som ren kompakt bybil på grunn av størrelse",
        "Seteantall og bagasjevolum varierer med konfigurasjon (5/6/7) og er ikke én bilnivåverdi",
        "GTX Exclusive vs ikke-Exclusive WLTP er dokumentert konflikt — non-Exclusive er lagret",
        "Varme pumpe er oppgitt som ekstrautstyr i Pro-dokumentasjon og er derfor ikke satt som standard",
      ],
      suitable_for: [
        "Familier",
        "Langdistansesjåfører",
        "Tilhengerbrukere",
        "Firmabilbrukere",
      ],
      score_notes: `## Hvem bilen passer for
ID. Buzz passer for familier og brukere som trenger mer plass enn en typisk personbil, inkludert mulig 6-/7-seters oppsett etter konfigurasjon.

## Styrker
Kort/lang-varianter, GTX-ytelse og tydelig dokumenterte lade-/batteritall i norske PDF-er.

## Svakheter
Stor bil. Mange verdier er konfigurasjonsavhengige (seter, bagasje, Exclusive-rekkevidde).

## Vinterhensyn
Ingen offisiell vinterrekkevidde er lagret. Store elbilel med høyere forbruk kan merke kulde ekstra. 4MOTION på GTX kan være relevant i vinterføre, men erstatter ikke vinterdekk.

## Ladeopplevelse
AC/DC og 10–80 % er dokumentert der PDF oppgir dem. Praktisk ladetid varierer.

## Langdistanse
Lang-varianter har høyere WLTP enn kort i denne batchen. Exclusive-linjer har lavere WLTP i GTX-PDF og er ikke blandet inn.

## Daglig bruk
MPV-formatet støtter hverdag med passasjerer og bagasje. Størrelse kan være en ulempe i tett by.

## Familie / praktisk
Kort vs lang, Pro vs GTX og seteoppsett må velges bevisst. Tilhengertall er lagret per variant der PDF oppgir dem.`,
      import_notes:
        "Final editorial pass 2026-07-26. GTX towing/torque filled from GTX PDF. Exclusive WLTP not applied. Heat pump left null (optional). Unpublished.",
    },
  );
  changed.push("ID. Buzz editorial package");

  // ID.5 stays NOT_READY — refresh shell markers only, no invented specs
  {
    const { data: prev } = await client
      .from("cars")
      .select("field_sources")
      .eq("id", IDS.id5)
      .single();
    const field_sources = {
      ...((prev?.field_sources as Record<string, unknown>) ?? {}),
      description: src("EVFAKTA editorial draft", PAGE.prices, 0.4, DRAFT, true),
    };
    await client
      .from("cars")
      .update({
        description: withDraft(
          `Volkswagen ID.5 er midlertidig et produksjonsskall i EVFAKTA.

Gjeldende norsk teknisk data-PDF og aktiv modellside for ID.5 ble ikke funnet i denne runden (modellside redirecter). Ingen spesifikasjoner er fylt inn fra hukommelse eller sekundære databaser.

Status: NOT_READY inntil pålitelig aktuell norsk dokumentasjon finnes.`,
        ),
        pros: [DRAFT, "Ingen bekreftede styrker lagret — mangler aktuell norsk teknisk kilde"],
        cons: [
          DRAFT,
          "Ingen aktuell ID.5 tekniske-data-PDF / modellside bekreftet i denne runden",
          "Ikke klar for godkjenning eller publisering",
        ],
        suitable_for: [],
        score_notes: withDraft(
          `## Status
NOT_READY. Ikke fyll inn verdier før offisiell norsk dokumentasjon er verifisert.

## Neste steg for redaktør
1. Finn gjeldende ID.5 tekniske data / prisliste på volkswagen.no
2. Opprett varianter kun fra offisiell tabell
3. Lagre field_sources og bildekandidater
4. Hold is_published=false`,
        ),
        source_name: "Volkswagen Norge — Prislister (ID.5 mangler aktuell teknisk PDF)",
        source_url: PAGE.prices,
        data_last_checked_at: CHECKED,
        field_sources,
        import_status: "needs_review",
        is_published: false,
        import_notes:
          "NOT_READY: no current NO tech PDF / model page. Shell only. Do not invent specs.",
      })
      .eq("id", IDS.id5);
    changed.push("ID.5 shell refreshed (NOT_READY)");
  }

  // Extra typed image candidates (pending only)
  await storeImageCandidates(
    client,
    brandId,
    IDS.id3,
    "volkswagen-id-3",
    "ID.3",
    "Volkswagen Norge — ID.3 modellside / DAM",
    PAGE.id3,
    [
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/exterior/IN0276-ID3-exterior-front-stage.jpg",
        alt_text: "Volkswagen ID.3 — front (offisiell media)",
        image_type: "front",
        is_primary_candidate: true,
      },
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/exterior/IN0261-ID3-exterior-side-driving.jpg",
        alt_text: "Volkswagen ID.3 — side (offisiell media)",
        image_type: "side",
      },
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/exterior/IN0285-ID3-exterior-front-side.jpg",
        alt_text: "Volkswagen ID.3 — front/side (offisiell media)",
        image_type: "exterior",
      },
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/interior/IN0333-id3-interior-unecce.jpg",
        alt_text: "Volkswagen ID.3 — interiør (offisiell media)",
        image_type: "interior",
      },
    ],
  );
  await storeImageCandidates(
    client,
    brandId,
    IDS.id4,
    "volkswagen-id-4",
    "ID.4",
    "Volkswagen Norge — ID.4 modellside / DAM",
    PAGE.id4,
    [
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-4/bjarne/16_9_2M3A0972.jpg",
        alt_text: "Volkswagen ID.4 — eksteriør (offisiell VW Norge)",
        image_type: "exterior",
        is_primary_candidate: true,
      },
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-4/exterior/IC0948_ID4_side_rear.jpg",
        alt_text: "Volkswagen ID.4 — side/bak (offisiell media)",
        image_type: "rear",
      },
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-4/mjw26/IC0862_id4-interior_steering-wheel-dashboard-infotainment.jpg",
        alt_text: "Volkswagen ID.4 — interiør (offisiell media)",
        image_type: "interior",
      },
    ],
  );
  await storeImageCandidates(
    client,
    brandId,
    IDS.id7,
    "volkswagen-id-7",
    "ID.7",
    "Volkswagen Norge — ID.7 cutout / modellmedia",
    PAGE.id7,
    [
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/cutout/personbil/id7-tourer/id7-tourer.jpg",
        alt_text: "Volkswagen ID.7 Tourer — cutout (VW Norge DAM)",
        image_type: "exterior",
        is_primary_candidate: true,
        notes:
          "Tourer cutout only. Human must also find Fastback angles + interior/cargo before publish.",
      },
    ],
  );
  await storeImageCandidates(
    client,
    brandId,
    IDS.buzz,
    "volkswagen-id-buzz",
    "ID. Buzz",
    "Volkswagen Norge — ID. Buzz modellside / DAM",
    PAGE.buzz,
    [
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/bjarne/16_9_DSC02506.jpg",
        alt_text: "Volkswagen ID. Buzz — eksteriør (VW Norge)",
        image_type: "exterior",
        is_primary_candidate: true,
      },
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/exterior/1_1_ib000715pic.jpg",
        alt_text: "Volkswagen ID. Buzz — eksteriør detalj",
        image_type: "exterior",
      },
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/interior/1_1_ib000690pic.jpg",
        alt_text: "Volkswagen ID. Buzz — interiør",
        image_type: "interior",
      },
      {
        original_url:
          "https://www.volkswagen.no/content/dam/onehub_master/cv/models/id-buzz/new/equipment-and-packages/ib000363pic-vw-id-buzz-backview-loading-02-4x3.jpg",
        alt_text: "Volkswagen ID. Buzz — lasting / praktisk",
        image_type: "cargo",
        notes: "Cargo/loading candidate. Verify rights and body version before attach.",
      },
    ],
  );
  changed.push("image candidates deduped/added (pending only)");

  // Force safety: never published / never approved
  for (const id of Object.values(IDS)) {
    await client
      .from("cars")
      .update({ is_published: false, import_status: "needs_review" })
      .eq("id", id);
  }

  // Audit snapshot for report
  type Row = {
    slug: string;
    model: string;
    carId: string;
    final: "READY_FOR_HUMAN_APPROVAL" | "NOT_READY";
    reason: string;
    completion: string;
    specs: string;
    editorial: string;
    images: string;
    conflicts: string;
  };
  const rows: Row[] = [];
  const details: string[] = [];

  for (const meta of [
    {
      id: IDS.id3,
      model: "ID.3",
      slug: "volkswagen-id-3",
      ready: true as const,
      reason:
        "Offisiell NO teknisk PDF kartlagt til fire varianter, feltkilder på plass, editorial drafts komplette med draft-markør, bildekandidater finnes. Mangler menneskelig bildegodkjenning, draft-omskriving og import_status=approved.",
    },
    {
      id: IDS.id4,
      model: "ID.4",
      slug: "volkswagen-id-4",
      ready: true as const,
      reason:
        "Pro 4MOTION + GTX 4MOTION fra ID.4 PDF Mai 2026, konflikter dokumentert (ikke skjult), editorial drafts komplette, bildekandidater finnes. Human image approval + draft rewrite gjenstår.",
    },
    {
      id: IDS.id5,
      model: "ID.5",
      slug: "volkswagen-id-5",
      ready: false as const,
      reason:
        "Ingen aktuell norsk teknisk PDF / aktiv modellside bekreftet. Skall beholdes uten oppfinnede spesifikasjoner.",
    },
    {
      id: IDS.id7,
      model: "ID.7",
      slug: "volkswagen-id-7",
      ready: true as const,
      reason:
        "Pro S Tourer + GTX Fastback/Tourer fra ID.7 PDF, Fastback/Tourer adskilt i notater, dimensjoner/kilder oppdatert, minst én bildekandidat. Human må velge flere vinkler (spesielt Fastback/interiør) før publisering.",
    },
    {
      id: IDS.buzz,
      model: "ID. Buzz",
      slug: "volkswagen-id-buzz",
      ready: true as const,
      reason:
        "Pro/GTX kort/lang fra offisielle PDF-er, GTX WLTP/towing/torque fylt fra GTX-PDF, editorial drafts komplette, bildekandidater inkl. cargo. Exclusive-WLTP og sete/cargo-konfigurasjoner fortsatt åpne merknader.",
    },
  ]) {
    const { data: car } = await client.from("cars").select("*").eq("id", meta.id).single();
    if (!car) throw new Error(`Missing car ${meta.slug}`);
    const { data: variants } = await client
      .from("car_variants")
      .select("*")
      .eq("car_id", meta.id)
      .order("sort_order", { ascending: true });
    const gallery = await countGallery(client, meta.id);
    const candidates = await listImageCandidates(client, meta.id);
    const publishIssues = getPublishIssues({
      ...car,
      has_gallery_image: gallery > 0,
    });

    if (car.is_published) {
      throw new Error(`Safety fail: ${meta.slug} is_published=true`);
    }
    if (car.import_status === "approved") {
      throw new Error(`Safety fail: ${meta.slug} was auto-approved`);
    }

    const final = meta.ready ? "READY_FOR_HUMAN_APPROVAL" : "NOT_READY";
    rows.push({
      slug: meta.slug,
      model: meta.model,
      carId: meta.id,
      final,
      reason: meta.reason,
      completion: meta.ready ? "high" : "shell",
      specs: meta.ready ? "sourced / variant-split" : "empty shell",
      editorial: meta.ready ? "draft complete" : "shell draft",
      images: `${candidates.length} candidates / ${gallery} gallery`,
      conflicts: meta.ready ? "documented open" : "n/a",
    });

    details.push(`### ${meta.model} (\`${meta.slug}\`) — **${final}**

- Car id: \`${meta.id}\`
- Admin: [/admin/biler/${meta.id}/rediger](/admin/biler/${meta.id}/rediger)
- Variants admin: [/admin/biler/${meta.id}/varianter](/admin/biler/${meta.id}/varianter)
- Public preview (unpublished): [/modeller/${meta.slug}](/modeller/${meta.slug})
- import_status: \`${car.import_status}\`
- is_published: \`${car.is_published}\`
- source_name: ${car.source_name ?? "—"}
- source_url: ${car.source_url ?? "—"}
- data_last_checked_at: ${car.data_last_checked_at ?? "—"}
- Gallery images: ${gallery}
- Image candidates: ${candidates.length}
- Publish blockers (getPublishIssues): ${
      publishIssues.length
        ? publishIssues.map((i) => i.code).join(", ")
        : "none"
    }

**Why ${final}:** ${meta.reason}

#### Variants

| Variant | Slug | WLTP | Battery net/gross | Power | DC | Towing | Status |
|---------|------|------|-------------------|-------|----|--------|--------|
${
  (variants ?? [])
    .map(
      (v) =>
        `| ${v.name} | \`${v.slug}\` | ${v.range_km ?? "—"} | ${v.battery_usable_kwh ?? "—"} / ${v.battery_total_kwh ?? "—"} | ${v.power_hp ?? "—"} | ${v.dc_charging_kw ?? "—"} | ${v.towing_kg ?? "—"} | ${v.import_status}/${v.is_active ? "active" : "inactive"} |`,
    )
    .join("\n") || "| _(none)_ | | | | | | | |"
}

#### Image candidates (pending)

${
  candidates
    .map(
      (c) =>
        `- \`${c.image_type}\` / \`${c.status}\`: ${c.original_url}`,
    )
    .join("\n") || "_None_"
}
`);
  }

  const report = `# Volkswagen final editorial review

**Date:** ${CHECKED}
**Brand:** Volkswagen (first publication-ready brand candidate)
**Standards:** \`docs/CAR_BLUEPRINT.md\`, \`docs/REFERENCE_WORKFLOW.md\`, \`docs/PRODUCTION_CHECKLIST.md\`, \`docs/TESLA_VW_BATCH_READINESS.md\`
**Safety:** No model published. No automatic approval. No image auto-attach. Tesla untouched. No commit/push by this script.

---

## 1. Executive summary

Volkswagen ID.3, ID.4, ID.7 and ID. Buzz are prepared for **human approval** as the first brand package. All four remain \`is_published = false\` and \`import_status = needs_review\`.

Volkswagen ID.5 remains **NOT_READY** because no current official Norwegian technical PDF / active model page was available. No invented specs were added.

**Final publish is still blocked for every model** until a human:

1. Removes draft markers and rewrites editorial text as needed  
2. Selects, attaches and approves gallery images (candidates ≠ approved images)  
3. Sets \`import_status = approved\` after review  
4. Explicitly publishes (approval ≠ publish)

---

## 2. Status for every Volkswagen model

| Model | Final status | Reason (short) |
|-------|--------------|----------------|
| ID.3 | READY_FOR_HUMAN_APPROVAL | Official PDF + variants + drafts + candidates |
| ID.4 | READY_FOR_HUMAN_APPROVAL | Official PDF + variants + drafts + candidates |
| ID.5 | NOT_READY | No current NO tech documentation |
| ID.7 | READY_FOR_HUMAN_APPROVAL | Official PDF + body-split notes + candidate |
| ID. Buzz | READY_FOR_HUMAN_APPROVAL | Pro/GTX PDF + GTX towing/torque filled |

${details.join("\n")}

---

## 3. Status for every variant

See per-model tables above. All variants remain \`needs_review\` and inactive until human confirmation. Variant-specific powertrain numbers are not averaged onto the car row.

---

## 4. Fields verified

Verified against official VW Norge PDFs / model pages for ready models:

- Identity: brand, model, slug, body/vehicle type
- Per-variant: battery usable/total, WLTP range, power, DC charging, AC where stored, 0–100 / top speed where present
- Shared / car-level: connectors, warranty, chemistry where documented, dimensions where body-shared
- ID.4: towing (with brakes stored; without brakes conflict retained), heat pump, V2L
- ID.7: width/wheelbase/height; Fastback vs Tourer cargo separation notes
- ID. Buzz: Pro towing on variants; GTX towing/torque/WLTP from GTX PDF

---

## 5. Fields changed (this pass)

${changed.map((c) => `- ${c}`).join("\n")}

Notable numeric fills this pass (official GTX PDF only):

- \`gtx-kort\`: \`towing_kg=1800\`, \`torque_nm=560\` (footnote: 1700 kg on short 7-seater)
- \`gtx-lang\`: \`towing_kg=1600\`, \`torque_nm=560\`

---

## 6. Fields left empty (intentionally)

Common across ready models:

- \`price_nok\` (from-prices exist on prisliste; not stored as single public price)
- \`winter_range_km\` / \`real_world_range_km\`
- \`frunk_l\` where not documented
- Car-level blended \`range_km\` / \`power_hp\` when variants differ
- ID.3 car-level \`heat_pump\` (variant/equipment dependent)
- ID. Buzz car-level \`cargo_l\`, \`seats\`, \`heat_pump\` (config / optional)
- ID.4 / ID.7 car-level \`torque_nm\` when PDF lists split axle values
- ID.5: all technical fields

---

## 7. Sources used

1. ID.3 tekniske data — ${PDF.id3}
2. ID.4 tekniske data — ${PDF.id4}
3. ID.7 tekniske data — ${PDF.id7}
4. ID. Buzz Pro — ${PDF.buzz}
5. ID. Buzz GTX — ${PDF.buzzGtx}
6. Model pages — ${PAGE.id3}, ${PAGE.id4}, ${PAGE.id7}, ${PAGE.buzz}
7. Prislister (ID.5 shell pointer) — ${PAGE.prices}

---

## 8. Conflicts resolved

None silently resolved. Where a single clear variant explanation exists, the value stays on that variant (e.g. GTX non-Exclusive WLTP stored; Exclusive listed in notes only).

---

## 9. Conflicts still open

- **ID.3 length_mm:** 4264 vs 4261 in same PDF (NO table vs DE sketch)
- **ID.3 range messaging:** marketing «inntil 430» vs PDF max 586 — car-level range empty; variants used
- **ID.4 length_mm:** Pro 4584 vs GTX 4582
- **ID.4 towing_kg:** 1800 (braked) stored vs 750 (unbraked) conflict retained
- **ID.4 torque_nm:** 134 / 560 axle split — car torque empty
- **ID.7 cargo_l:** Fastback 532 vs Tourer 605 — car may hold one value; variant notes clarify
- **ID.7 height_mm:** Fastback 1536 vs Tourer 1551
- **ID.7 dc_charging_kw:** 175 (77 kWh) vs 200 (86 kWh) — 86 kWh variants use 200
- **ID. Buzz length / towing:** kort vs lang body-specific
- **ID. Buzz GTX WLTP:** Exclusive vs non-Exclusive; non-Exclusive stored
- **ID. Buzz GTX short towing footnote:** 1800 kg vs 1700 kg on short 7-seater

---

## 10. Editorial text completed

For ID.3, ID.4, ID.7, ID. Buzz:

- short introduction (\`description\`)
- who for (\`suitable_for\`)
- strengths (\`pros\`)
- weaknesses (\`cons\`)
- winter / charging / long-distance / daily / family (\`score_notes\` sections)

All public editorial fields still begin with **${DRAFT}** until a human removes the marker.

ID.5 has a shell explanation only.

---

## 11. Image candidates

Candidates are stored in \`research_image_candidates\` with \`status=pending\` only.

Required categories for publication quality:

| Model | front | rear/side | interior | cargo | Notes |
|-------|-------|-----------|----------|-------|-------|
| ID.3 | candidate | side/exterior candidates | candidate | missing dedicated | Human must pick set |
| ID.4 | exterior | rear/side candidate | candidate | missing dedicated | Human must pick set |
| ID.7 | Tourer cutout only | thin | missing | missing | **Needs manual media hunt** |
| ID. Buzz | exterior | exterior | interior | cargo candidate | Best coverage |
| ID.5 | weak/other only | — | — | — | NOT_READY |

**CDN note:** Automated HTTP checks against some DAM URLs returned \`410\` from this environment. Treat candidates as pending until a human opens them in-browser / downloads from VW media and confirms the file.

---

## 12. Image-rights concerns

- All candidates claim official Volkswagen DAM / volkswagen.no origin.
- Usage rights must be verified by a human before attach.
- No Google Images, screenshots, or page URLs used as image files.
- No candidate was attached to \`car_images\` or approved by this pass.

---

## 13. Human actions still required

1. Open each READY model in Car Editor and walk PRODUCTION_CHECKLIST.
2. Rewrite editorial text; remove draft markers.
3. Resolve or accept documented conflicts with explicit editor decision.
4. Activate/confirm default variants.
5. Download/verify image files; attach front/rear/side/interior/(cargo); write alt text; approve gallery.
6. Set \`import_status = approved\` only after checklist pass.
7. Publish manually only after approval + images — never automatic.
8. Keep ID.5 unpublished until NO tech PDF exists.
9. Do not start a new brand until VW human approval is done (optional process gate).

---

## 14. Publication-readiness checklist

| Check | ID.3 | ID.4 | ID.5 | ID.7 | ID. Buzz |
|-------|------|------|------|------|----------|
| Official source | Pass | Pass | Fail | Pass | Pass |
| Images (approved gallery) | Fail | Fail | Fail | Fail | Fail |
| Images (candidates exist) | Pass | Pass | Fail* | Pass (thin) | Pass |
| Variants | Pass | Pass | Fail | Pass | Pass |
| Specifications | Pass | Pass | Fail | Pass | Pass |
| Editorial drafts | Pass (draft) | Pass (draft) | Fail | Pass (draft) | Pass (draft) |
| Review (human) | Not performed | Not performed | Not performed | Not performed | Not performed |
| Approval | Not performed | Not performed | Not performed | Not performed | Not performed |
| Publication | Not performed | Not performed | Not performed | Not performed | Not performed |

\\* ID.5 may have a weak non-technical media candidate from an earlier pass; it does not unlock readiness.

---

## 15. Exact admin URLs for final review

- ID.3: [/admin/biler/${IDS.id3}/rediger](/admin/biler/${IDS.id3}/rediger)
- ID.4: [/admin/biler/${IDS.id4}/rediger](/admin/biler/${IDS.id4}/rediger)
- ID.5: [/admin/biler/${IDS.id5}/rediger](/admin/biler/${IDS.id5}/rediger)
- ID.7: [/admin/biler/${IDS.id7}/rediger](/admin/biler/${IDS.id7}/rediger)
- ID. Buzz: [/admin/biler/${IDS.buzz}/rediger](/admin/biler/${IDS.buzz}/rediger)
- Import / research: [/admin/import](/admin/import) · [/admin/import/research](/admin/import/research)

---

## 16. Final status

| Model | Completion | Specs | Editorial | Images | Conflicts | Final status |
|-------|------------|-------|-----------|--------|-----------|--------------|
${rows
  .map(
    (r) =>
      `| ${r.model} | ${r.completion} | ${r.specs} | ${r.editorial} | ${r.images} | ${r.conflicts} | **${r.final}** |`,
  )
  .join("\n")}

---

## Safety confirmation

- No model published (\`is_published=false\` enforced)
- No automatic approval (\`import_status=needs_review\` enforced)
- No image auto-approval
- Tesla records not modified by this script
`;

  writeFileSync(REPORT, report, "utf8");
  console.log("Wrote", REPORT);
  console.log("Changed:");
  for (const c of changed) console.log(" -", c);
  console.log("\nFinal table:");
  for (const r of rows) {
    console.log(`${r.model}: ${r.final} | ${r.images}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
