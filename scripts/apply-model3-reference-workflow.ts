/**
 * Editorial apply: Tesla Model 3 — first Reference Workflow example.
 * Official Tesla sources only. Never publishes.
 * Editorial page standard: docs/CAR_BLUEPRINT.md
 * Workflow: docs/REFERENCE_WORKFLOW.md
 *
 * Usage: npx tsx scripts/apply-model3-reference-workflow.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const CAR_ID = "cd2df65a-f868-4385-9c73-f79356f295ae";
const CHECKED = "2026-07-26T10:00:00.000Z";
const MANUAL_NAME = "Tesla Model 3 Owner's Manual (Europe)";
const MANUAL_URL =
  "https://www.tesla.com/ownersmanual/model3/en_eu/Owners_Manual.pdf";
const MANUAL_DIMS_URL =
  "https://www.tesla.com/ownersmanual/model3/en_eu/GUID-56562137-FC31-4110-A13C-9A9FC6657BF0.html";
const WARRANTY_NAME = "Tesla New Vehicle Limited Warranty (Europe)";
const WARRANTY_URL =
  "https://digitalassets.tesla.com/tesla-contents/image/upload/tesla-new-vehicle-limited-warranty-fr-fr.pdf";
const NORGE_URL = "https://www.tesla.com/no_NO/model3";

function src(
  source_name: string,
  source_url: string,
  confidence: number,
  notes?: string,
  draft = false,
) {
  return {
    source_name,
    source_url,
    imported_at: CHECKED,
    retrieved_at: CHECKED,
    data_last_checked_at: CHECKED,
    confidence,
    review_status: "pending" as const,
    draft,
    notes: notes ?? null,
    research_job_id: null,
    import_job_id: null,
  };
}

const description = `Tesla Model 3 er en helelektrisk sedan solgt i Norge via Tesla. Highland-generasjonen er en kompakt fire-dørs elbil med fem sitteplasser, frunk og CCS-lading i det europeiske markedet.

Denne oppføringen er det første validerte eksempel i EVFAKTAs Reference Workflow (se docs/REFERENCE_WORKFLOW.md). Sidekrav følger CAR_BLUEPRINT.md — ikke denne bilen som permanent innholdsmal. Tall for batteri, WLTP-rekkevidde, forbruk og ytelse må hentes direkte fra Tesla Norge per variant før publisering — de er bevisst tomme her fordi Tesla Norge ikke kunne bekreftes automatisk i denne runden.

Draft – Requires editor review.`;

const pros = [
  "Romslig bagasjerom bak (594 l bak andre seterad) pluss frunk (88 l) ifølge Tesla Owner's Manual (Europe).",
  "Kompakt sedan-format med 2 875 mm akselavstand — praktisk til daglig bruk og parkering.",
  "Varmepumpe er del av klimasystemet i manualen — relevant for norsk vinter (kvalitativt, uten offisielle vintertall).",
  "CCS-støtte i Europa er dokumentert i Tesla-manualen (Supercharger-kart viser CCS).",
  "Draft – Requires editor review.",
];

const cons = [
  "WLTP-rekkevidde, batterikapasitet, forbruk og ytelse mangler fortsatt offisiell bekreftelse fra Tesla Norge for hver variant.",
  "Tilhengervekt er ikke én tallverdi: Tesla-manualen oppgir 750 kg uten / 1 000 kg med tilhengerbremser (krever fabrikkfestet trekkpakke).",
  "Lengde og høyde er variantavhengig (RWD/Long Range vs Performance) — Performance er 4 mm lengre og 9 mm lavere.",
  "Offisielle produktbilder må lastes ned manuelt fra Tesla (automatisk henting blokkert).",
  "Draft – Requires editor review.",
];

const suitable_for = [
  "Pendling og daglig bruk",
  "Små familier (5 seter)",
  "Langtur når variantens WLTP er bekreftet mot Tesla Norge",
  "Vinterbruk med forventning om varmepumpe — uten offisielle vinterrekkeviddetall",
  "Draft – Requires editor review.",
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env");
  }
  const sb = createClient(url, key);

  const field_sources: Record<string, ReturnType<typeof src>> = {
    length_mm: src(
      MANUAL_NAME,
      MANUAL_DIMS_URL,
      0.95,
      "RWD/Long Range overall length 4720 mm. Performance is 4724 mm (stored on Performance variant).",
    ),
    height_mm: src(
      MANUAL_NAME,
      MANUAL_DIMS_URL,
      0.95,
      "RWD/Long Range overall height 1440 mm. Performance is 1431 mm (stored on Performance variant).",
    ),
    width_mm: src(
      MANUAL_NAME,
      MANUAL_DIMS_URL,
      0.95,
      "Overall width excluding mirrors 1850 mm. Including mirrors 2089 mm; folded 1933 mm — catalog uses excluding mirrors.",
    ),
    wheelbase_mm: src(MANUAL_NAME, MANUAL_DIMS_URL, 0.98, "Wheel base 2875 mm for RWD/Long Range and Performance."),
    cargo_l: src(
      MANUAL_NAME,
      MANUAL_DIMS_URL,
      0.95,
      "Behind 2nd row 594 L (current EU manual). Older GB pre-Highland 561 L rejected.",
    ),
    frunk_l: src(MANUAL_NAME, MANUAL_DIMS_URL, 0.95, "Front trunk 88 L."),
    seats: src(
      MANUAL_NAME,
      MANUAL_DIMS_URL,
      0.9,
      "Cargo volume table references maximum total cargo with 5 passengers.",
    ),
    warranty: src(
      WARRANTY_NAME,
      WARRANTY_URL,
      0.9,
      "Basic vehicle limited warranty 4 years / 80 000 km (Europe). Battery/drive unit: Standard 8y/160 000 km; Long Range or Performance 8y/192 000 km; min 70% capacity.",
    ),
    heat_pump: src(
      MANUAL_NAME,
      MANUAL_URL,
      0.9,
      "Owner's Manual references heat pump system in climate/Battery thermal discussion.",
    ),
    charging_connector_ac: src(
      MANUAL_NAME,
      MANUAL_URL,
      0.85,
      "Europe market AC inlet (Type 2) — retained from prior official Europe research; confirm on Tesla Norge before publish.",
    ),
    charging_connector_dc: src(
      MANUAL_NAME,
      MANUAL_URL,
      0.85,
      "Manual references CCS Superchargers for CCS-capable vehicles in Europe.",
    ),
    source_name: src("Tesla Norge + Tesla Owner's Manual (Europe)", NORGE_URL, 0.95),
    source_url: src("Tesla Norge", NORGE_URL, 0.95),
    description: src("EVFAKTA editorial draft", NORGE_URL, 0.55, "Draft – Requires editor review.", true),
    pros: src("EVFAKTA editorial draft", MANUAL_DIMS_URL, 0.55, "Draft – Requires editor review.", true),
    cons: src("EVFAKTA editorial draft", MANUAL_DIMS_URL, 0.55, "Draft – Requires editor review.", true),
    suitable_for: src("EVFAKTA editorial draft", NORGE_URL, 0.55, "Draft – Requires editor review.", true),
    body_style: src(MANUAL_NAME, MANUAL_URL, 0.9, "Four-door sedan body."),
    vehicle_type: src(MANUAL_NAME, MANUAL_URL, 0.9),
    model_generation: src(MANUAL_NAME, MANUAL_URL, 0.7, "Highland generation label — confirm trim year on Tesla Norge."),
  };

  const patch = {
    length_mm: 4720,
    height_mm: 1440,
    width_mm: 1850,
    wheelbase_mm: 2875,
    cargo_l: 594,
    frunk_l: 88,
    seats: 5,
    // Towing: two official values — leave empty (see review doc)
    towing_kg: null,
    // Battery / range / performance / charging kW: leave empty until Tesla Norge
    range_km: null,
    winter_range_km: null,
    real_world_range_km: null,
    battery_kwh: null,
    battery_total_kwh: null,
    battery_usable_kwh: null,
    battery_chemistry: null,
    consumption_kwh_100km: null,
    ac_charging_kw: null,
    dc_charging_kw: null,
    charge_time_10_80_minutes: null,
    power_hp: null,
    torque_nm: null,
    acceleration_0_100: null,
    top_speed_kmh: null,
    warranty:
      "Nybilgaranti (Europa): 4 år / 80 000 km. Batteri og drivlinje: 8 år / 160 000 km (Standard) eller 8 år / 192 000 km (Long Range/Performance), minimum 70 % kapasitet. Bekreft norsk garantiark før publisering.",
    description,
    pros,
    cons,
    suitable_for,
    source_name: "Tesla Norge + Tesla Owner's Manual (Europe)",
    source_url: NORGE_URL,
    data_last_checked_at: CHECKED,
    import_status: "needs_review",
    is_published: false,
    field_sources,
    import_notes:
      "Reference Workflow example package 2026-07-26 (Tesla Model 3). Conflicts resolved only with official Tesla docs. Variant WLTP/battery left empty pending Tesla Norge.",
  };

  const { error: carError } = await sb.from("cars").update(patch).eq("id", CAR_ID);
  if (carError) throw new Error(carError.message);

  const { data: variants, error: vErr } = await sb
    .from("car_variants")
    .select("id, slug")
    .eq("car_id", CAR_ID);
  if (vErr) throw new Error(vErr.message);

  // car_variants has no length/height/width columns — dimensions live on cars + review notes.
  for (const variant of variants ?? []) {
    const isPerf = variant.slug === "performance";
    const { error } = await sb
      .from("car_variants")
      .update({
        battery_usable_kwh: null,
        range_km: null,
        real_world_range_km: null,
        import_status: "needs_review",
        is_active: false,
        import_notes: isPerf
          ? "Official EU manual: length 4724 mm, height 1431 mm, width excl. mirrors 1850 mm, wheelbase 2875 mm. Battery/range empty until Tesla Norge."
          : "Official EU manual (RWD/Long Range table): length 4720 mm, height 1440 mm, width excl. mirrors 1850 mm, wheelbase 2875 mm. Battery/range empty until Tesla Norge.",
      })
      .eq("id", variant.id);
    if (error) throw new Error(`${variant.slug}: ${error.message}`);
  }

  // Safety: never publish
  const { data: check } = await sb
    .from("cars")
    .select("is_published, import_status, length_mm, cargo_l, warranty")
    .eq("id", CAR_ID)
    .single();

  if (check?.is_published) {
    await sb.from("cars").update({ is_published: false }).eq("id", CAR_ID);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        car_id: CAR_ID,
        is_published: false,
        import_status: check?.import_status,
        length_mm: check?.length_mm,
        cargo_l: check?.cargo_l,
        warranty_set: Boolean(check?.warranty),
        variants_updated: variants?.length ?? 0,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
