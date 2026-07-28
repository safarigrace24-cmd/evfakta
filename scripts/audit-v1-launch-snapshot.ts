/**
 * Read-only V1 launch audit snapshot (no writes).
 * Usage: npx tsx scripts/audit-v1-launch-snapshot.ts
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { MASTER_CATALOG_MODELS } from "../lib/admin/master-catalog";

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

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("missing supabase env");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: cars, error } = await sb
    .from("cars")
    .select(
      "id,slug,brand,model,is_published,import_status,image_url,description,source_name,source_url,data_last_checked_at,pros,cons,suitable_for,score_notes",
    );
  if (error) throw new Error(error.message);

  const ids = (cars || []).map((c) => c.id);
  const { data: images } = await sb
    .from("car_images")
    .select("car_id,image_type,is_primary,alt_text")
    .in("car_id", ids);
  const { data: variants } = await sb
    .from("car_variants")
    .select("car_id,slug,name")
    .in("car_id", ids);
  const { data: brands } = await sb.from("brands").select("id,slug,name,is_active,logo_url");
  const { data: items } = await sb
    .from("research_items")
    .select("id,existing_car_id")
    .in("existing_car_id", ids);
  const itemIds = (items || []).map((i) => i.id);
  const { data: candidates } =
    itemIds.length > 0
      ? await sb
          .from("research_image_candidates")
          .select(
            "id,item_id,image_type,status,storage_path,notes,is_primary_candidate",
          )
          .in("item_id", itemIds)
      : { data: [] as never[] };

  const itemToCar = new Map(
    (items || []).map((i) => [i.id as string, i.existing_car_id as string]),
  );

  const DRAFT = /Draft – Requires editor review/i;

  const models = (cars || []).map((c) => {
    const gal = (images || []).filter((i) => i.car_id === c.id);
    const vars = (variants || []).filter((v) => v.car_id === c.id);
    const cands = (candidates || []).filter(
      (x) => itemToCar.get(x.item_id as string) === c.id,
    );
    const failed = cands.filter(
      (x) =>
        String(x.notes || "").includes("Download Failed") ||
        String(x.notes || "").includes("HTTP 410") ||
        (!x.storage_path && x.status === "pending"),
    );
    const usable = cands.filter(
      (x) =>
        x.storage_path &&
        !String(x.notes || "").includes("Download Failed") &&
        !String(x.notes || "")
          .toLowerCase()
          .includes("superseded") &&
        x.status !== "rejected",
    );
    const approvedTypes = new Set(
      [
        ...gal.map((g) => (g.is_primary ? "hero" : g.image_type)),
        ...cands
          .filter((x) => x.status === "approved" || x.status === "applied")
          .map((x) =>
            x.is_primary_candidate ? "hero" : (x.image_type as string),
          ),
      ].filter(Boolean),
    );
    const textBlob = [
      c.description,
      ...(Array.isArray(c.pros) ? c.pros : []),
      ...(Array.isArray(c.cons) ? c.cons : []),
      ...(Array.isArray(c.suitable_for) ? c.suitable_for : []),
      c.score_notes,
    ]
      .filter(Boolean)
      .join(" ");

    const hasHero =
      gal.some((g) => g.is_primary) || Boolean(String(c.image_url || "").trim());
    const hasFront =
      gal.some((g) => g.image_type === "front") ||
      approvedTypes.has("front");
    const hasSide =
      gal.some((g) => g.image_type === "side") || approvedTypes.has("side");
    const hasInterior = gal.some((g) => g.image_type === "interior");

    return {
      id: c.id,
      slug: c.slug,
      brand: c.brand,
      model: c.model,
      published: Boolean(c.is_published),
      import_status: c.import_status,
      descriptionLen: (c.description || "").length,
      hasDescription40: (c.description || "").length >= 40,
      draftMarker: DRAFT.test(textBlob),
      hasSource: Boolean(c.source_name || c.source_url),
      hasChecked: Boolean(c.data_last_checked_at),
      hasFaq: false,
      hasRelated: false,
      variants: vars.length,
      galleryCount: gal.length,
      galleryTypes: gal.map(
        (g) => `${g.image_type}${g.is_primary ? ":primary" : ""}`,
      ),
      missingAlt: gal.filter((g) => !String(g.alt_text || "").trim()).length,
      candidates: cands.length,
      usableCandidates: usable.length,
      failedCandidates: failed.length,
      approvedCandidateCount: cands.filter(
        (x) => x.status === "approved" || x.status === "applied",
      ).length,
      hasHero,
      hasFront,
      hasSide,
      hasInterior,
      imageReady: hasHero && hasFront && hasSide,
      hasImageUrl: Boolean(String(c.image_url || "").trim()),
    };
  });

  const requestedBrands = [
    "Volkswagen",
    "Volvo",
    "Tesla",
    "Toyota",
    "BMW",
    "Audi",
    "Kia",
    "Hyundai",
    "BYD",
    "Mercedes-Benz",
    "Ford",
    "Nissan",
    "MG",
    "Polestar",
    "XPENG",
    "Xpeng",
    "Zeekr",
    "Renault",
    "Peugeot",
    "Skoda",
    "Cupra",
    "Mini",
    "Porsche",
  ];

  const byBrand: Record<string, typeof models> = {};
  for (const m of models) {
    const b = m.brand || "?";
    if (!byBrand[b]) byBrand[b] = [];
    byBrand[b].push(m);
  }

  const brandReports = requestedBrands
    .filter((b, i, arr) => arr.indexOf(b) === i)
    .map((brand) => {
      const catalog = MASTER_CATALOG_MODELS.filter(
        (m) => m.brand.toLowerCase() === brand.toLowerCase(),
      );
      const present = models.filter(
        (m) => (m.brand || "").toLowerCase() === brand.toLowerCase(),
      );
      const presentSlugs = new Set(present.map((m) => m.slug));
      const missingFromCatalog = catalog
        .filter((m) => !presentSlugs.has(m.slug))
        .map((m) => m.slug);
      return {
        brand,
        masterCatalogPlanned: catalog.length,
        inDb: present.length,
        published: present.filter((m) => m.published).length,
        approvedStatus: present.filter((m) => m.import_status === "approved")
          .length,
        needsReview: present.filter((m) => m.import_status === "needs_review")
          .length,
        draftMarkers: present.filter((m) => m.draftMarker).length,
        missingSources: present.filter((m) => !m.hasSource).length,
        missingChecked: present.filter((m) => !m.hasChecked).length,
        missingFaq: present.filter((m) => !m.hasFaq).length,
        missingRelated: present.filter((m) => !m.hasRelated).length,
        imageReady: present.filter((m) => m.imageReady).length,
        missingHero: present.filter((m) => !m.hasHero).length,
        missingFront: present.filter((m) => !m.hasFront).length,
        missingSide: present.filter((m) => !m.hasSide).length,
        missingInterior: present.filter((m) => !m.hasInterior).length,
        zeroGallery: present.filter((m) => m.galleryCount === 0).length,
        usableCandidatesModels: present.filter((m) => m.usableCandidates > 0)
          .length,
        failedCandidateModels: present.filter((m) => m.failedCandidates > 0)
          .length,
        missingFromMasterCatalog: missingFromCatalog,
        models: present.sort((a, b) => a.slug.localeCompare(b.slug)),
      };
    });

  const summary = {
    auditedAt: new Date().toISOString(),
    totals: {
      cars: models.length,
      published: models.filter((m) => m.published).length,
      approved: models.filter((m) => m.import_status === "approved").length,
      needsReview: models.filter((m) => m.import_status === "needs_review")
        .length,
      draftMarkers: models.filter((m) => m.draftMarker).length,
      imageReady: models.filter((m) => m.imageReady).length,
      zeroGallery: models.filter((m) => m.galleryCount === 0).length,
      brandsActive: (brands || []).filter((b) => b.is_active).length,
      brandsTotal: (brands || []).length,
      brandsMissingLogo: (brands || []).filter(
        (b) => !String(b.logo_url || "").trim(),
      ).length,
      masterCatalogPlanned: MASTER_CATALOG_MODELS.length,
    },
    brandReports,
    brandsInDbNotInRequest: Object.keys(byBrand)
      .filter(
        (b) =>
          !requestedBrands.some((r) => r.toLowerCase() === b.toLowerCase()),
      )
      .sort(),
    brands: brands || [],
  };

  const out = resolve(process.cwd(), "docs/EVFAKTA_V1_LAUNCH_AUDIT_SNAPSHOT.json");
  writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.totals, null, 2));
  console.log("wrote", out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
