import "server-only";

import sharp from "sharp";
import { randomUUID } from "node:crypto";
import type { AdminCar, ImportStatus } from "@/lib/admin/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCarImageType, type CarImageType } from "@/lib/admin/car-image-types";
import { buildImportPreview, emptyImportSummary } from "@/lib/admin/import/preview";
import type {
  FieldSources,
  ImportApplyOptions,
  ImportCarRow,
  ImportReportSummary,
  ImportVariantRow,
  PreviewRow,
} from "@/lib/admin/import/types";

const CHUNK_SIZE = 50;
const IMAGE_BUCKET = "car-images";

type BrandLookup = Map<string, string>;

function buildFieldSources(
  row: ImportCarRow,
  changedFields: string[],
  jobId: string,
  nowIso: string,
  previous: FieldSources | null | undefined,
  isNew: boolean,
): FieldSources {
  const next: FieldSources = { ...(previous ?? {}) };
  const fields = isNew
    ? Object.keys(row).filter(
        (key) =>
          key !== "gallery_images" &&
          key !== "is_published" &&
          key !== "variants",
      )
    : changedFields;

  for (const field of fields) {
    next[field] = {
      source_name: row.source_name,
      source_url: row.source_url,
      imported_at: nowIso,
      import_job_id: jobId,
    };
  }

  return next;
}

function toDbPayload(
  row: ImportCarRow,
  brandId: string | null,
  importStatus: ImportStatus,
  fieldSources: FieldSources,
  jobId: string,
  nowIso: string,
  preservePublished: boolean | null,
) {
  return {
    slug: row.slug,
    brand: row.brand,
    brand_id: brandId,
    model: row.model,
    variant: row.variant,
    trim_level: row.trim_level,
    model_generation: row.model_generation,
    year: row.year,
    price_nok: row.price_nok,
    range_km: row.range_km,
    battery_kwh: row.battery_kwh,
    battery_total_kwh: row.battery_total_kwh,
    battery_usable_kwh: row.battery_usable_kwh,
    battery_chemistry: row.battery_chemistry,
    winter_range_km: row.winter_range_km,
    real_world_range_km: row.real_world_range_km,
    dc_charging_kw: row.dc_charging_kw,
    charge_time_10_80_minutes: row.charge_time_10_80_minutes,
    charging_connector_ac: row.charging_connector_ac,
    charging_connector_dc: row.charging_connector_dc,
    drivetrain: row.drivetrain,
    image_url: row.image_url,
    description: row.description,
    // Never publish from import. New rows always false; updates keep existing flag.
    is_published: preservePublished === null ? false : preservePublished,
    consumption_kwh_100km: row.consumption_kwh_100km,
    power_hp: row.power_hp,
    torque_nm: row.torque_nm,
    acceleration_0_100: row.acceleration_0_100,
    top_speed_kmh: row.top_speed_kmh,
    seats: row.seats,
    cargo_l: row.cargo_l,
    towing_kg: row.towing_kg,
    warranty: row.warranty,
    ac_charging_kw: row.ac_charging_kw,
    vehicle_type: row.vehicle_type,
    body_style: row.body_style,
    length_mm: row.length_mm,
    width_mm: row.width_mm,
    height_mm: row.height_mm,
    wheelbase_mm: row.wheelbase_mm,
    curb_weight_kg: row.curb_weight_kg,
    gross_weight_kg: row.gross_weight_kg,
    frunk_l: row.frunk_l,
    heat_pump: row.heat_pump,
    v2l: row.v2l,
    v2g: row.v2g,
    apple_carplay: row.apple_carplay,
    android_auto: row.android_auto,
    head_up_display: row.head_up_display,
    panoramic_roof: row.panoramic_roof,
    ota_updates: row.ota_updates,
    pros: row.pros,
    cons: row.cons,
    suitable_for: row.suitable_for,
    country: row.country || "NO",
    source_name: row.source_name,
    source_url: row.source_url,
    source_updated_at: row.source_updated_at,
    data_last_checked_at: row.data_last_checked_at,
    import_status: importStatus,
    import_notes: row.import_notes,
    field_sources: fieldSources,
    imported_at: nowIso,
    last_import_job_id: jobId,
  };
}

async function loadBrandLookup(): Promise<BrandLookup> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("brands").select("id, name");
  const map: BrandLookup = new Map();
  for (const brand of data ?? []) {
    map.set(String(brand.name).trim().toLowerCase(), brand.id as string);
  }
  return map;
}

async function loadExistingBySlug(slugs: string[]): Promise<Map<string, AdminCar>> {
  const map = new Map<string, AdminCar>();
  if (slugs.length === 0) return map;

  const supabase = createAdminClient();
  for (let i = 0; i < slugs.length; i += CHUNK_SIZE) {
    const chunk = slugs.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase.from("cars").select("*").in("slug", chunk);
    if (error) {
      console.error("[import] loadExistingBySlug failed:", error.message);
      continue;
    }
    for (const row of data ?? []) {
      map.set(row.slug as string, row as AdminCar);
    }
  }
  return map;
}

async function publicUrlForPath(storagePath: string): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${IMAGE_BUCKET}/${storagePath}`;
}

async function importGalleryForCar(input: {
  carId: string;
  slug: string;
  images: NonNullable<ImportCarRow["gallery_images"]>;
  mode: "skip" | "replace";
  summary: ImportReportSummary;
}): Promise<string[]> {
  const messages: string[] = [];
  const { summary } = input;
  const supabase = createAdminClient();
  const { data: existingImages } = await supabase
    .from("car_images")
    .select("id, image_url, storage_path, is_primary, sort_order")
    .eq("car_id", input.carId);

  const existingUrls = new Set(
    (existingImages ?? []).map((img) => String(img.image_url ?? "").toLowerCase()),
  );

  let sortOrder =
    (existingImages ?? []).reduce(
      (max, img) => Math.max(max, Number(img.sort_order ?? 0)),
      -1,
    ) + 1;

  for (const image of input.images) {
    const url = image.url.trim();
    if (!url) continue;

    const duplicate = existingUrls.has(url.toLowerCase());
    if (duplicate && input.mode === "skip") {
      summary.imagesSkipped = (summary.imagesSkipped ?? 0) + 1;
      messages.push(`Bilde hoppet over (duplikat): ${url}`);
      continue;
    }

    try {
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok) {
        summary.errors += 1;
        messages.push(`Kunne ikke hente bilde (${response.status}): ${url}`);
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      const webp = await sharp(Buffer.from(arrayBuffer))
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const storagePath = `${input.slug}/${randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(storagePath, webp, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        summary.errors += 1;
        messages.push(`Opplasting feilet: ${uploadError.message}`);
        continue;
      }

      const publicUrl = await publicUrlForPath(storagePath);
      const imageType: CarImageType = isCarImageType(image.image_type ?? "")
        ? (image.image_type as CarImageType)
        : "other";

      if (duplicate && input.mode === "replace") {
        const match = (existingImages ?? []).find(
          (img) => String(img.image_url ?? "").toLowerCase() === url.toLowerCase(),
        );
        if (match) {
          await supabase
            .from("car_images")
            .update({
              image_url: publicUrl,
              storage_path: storagePath,
              image_type: imageType,
              alt_text: image.alt_text ?? null,
            })
            .eq("id", match.id);
          summary.imagesReplaced = (summary.imagesReplaced ?? 0) + 1;
          messages.push(`Bilde erstattet: ${url}`);
          continue;
        }
      }

      const makePrimary =
        Boolean(image.is_primary) || (existingImages ?? []).length === 0;
      if (makePrimary) {
        await supabase.from("car_images").update({ is_primary: false }).eq("car_id", input.carId);
      }

      const { error: insertError } = await supabase.from("car_images").insert({
        car_id: input.carId,
        image_url: publicUrl,
        storage_path: storagePath,
        image_type: imageType,
        alt_text: image.alt_text ?? null,
        is_primary: makePrimary,
        sort_order: sortOrder,
      });

      if (insertError) {
        summary.errors += 1;
        messages.push(`DB-insert bilde feilet: ${insertError.message}`);
        continue;
      }

      if (makePrimary) {
        await supabase.from("cars").update({ image_url: publicUrl }).eq("id", input.carId);
      }

      existingUrls.add(publicUrl.toLowerCase());
      sortOrder += 1;
      summary.imagesImported = (summary.imagesImported ?? 0) + 1;
      messages.push(`Bilde importert: ${url}`);
    } catch (error) {
      summary.errors += 1;
      console.error("[import] gallery image failed:", error);
      messages.push(`Bildefeil: ${url}`);
    }
  }

  return messages;
}

async function upsertVariantsForCar(input: {
  carId: string;
  variants: ImportVariantRow[];
  forceStatus: ImportStatus;
  summary: ImportReportSummary;
}): Promise<string[]> {
  const messages: string[] = [];
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("car_variants")
    .select("id, slug, is_default")
    .eq("car_id", input.carId);

  const bySlug = new Map(
    (existing ?? []).map((row) => [String(row.slug), row as { id: string; slug: string }]),
  );

  const hasDefault = input.variants.some((variant) => variant.is_default);
  const variants = input.variants.map((variant, index) => ({
    ...variant,
    is_default: hasDefault ? variant.is_default : index === 0,
    sort_order: variant.sort_order || index,
  }));

  if (variants.some((variant) => variant.is_default)) {
    await supabase
      .from("car_variants")
      .update({ is_default: false })
      .eq("car_id", input.carId)
      .eq("is_default", true);
  }

  for (const variant of variants) {
    const importStatus: ImportStatus =
      variant.import_status === "draft" ? "draft" : input.forceStatus;
    const payload = {
      car_id: input.carId,
      name: variant.name,
      slug: variant.slug,
      trim_level: variant.trim_level,
      model_year: variant.model_year,
      price_nok: variant.price_nok,
      battery_total_kwh: variant.battery_total_kwh,
      battery_usable_kwh: variant.battery_usable_kwh,
      range_km: variant.range_km,
      winter_range_km: variant.winter_range_km,
      real_world_range_km: variant.real_world_range_km,
      consumption_kwh_100km: variant.consumption_kwh_100km,
      ac_charging_kw: variant.ac_charging_kw,
      dc_charging_kw: variant.dc_charging_kw,
      charge_time_10_80_minutes: variant.charge_time_10_80_minutes,
      drivetrain: variant.drivetrain,
      power_hp: variant.power_hp,
      torque_nm: variant.torque_nm,
      acceleration_0_100: variant.acceleration_0_100,
      top_speed_kmh: variant.top_speed_kmh,
      towing_kg: variant.towing_kg,
      curb_weight_kg: variant.curb_weight_kg,
      is_default: variant.is_default,
      is_active: variant.is_active,
      sort_order: variant.sort_order,
      source_name: variant.source_name,
      source_url: variant.source_url,
      data_last_checked_at: variant.data_last_checked_at,
      import_status: importStatus,
      import_notes: variant.import_notes,
    };

    const existingRow = bySlug.get(variant.slug);
    if (existingRow) {
      const { error } = await supabase
        .from("car_variants")
        .update(payload)
        .eq("id", existingRow.id);
      if (error) {
        input.summary.errors += 1;
        messages.push(`Variant-oppdatering feilet (${variant.slug}): ${error.message}`);
        continue;
      }
      input.summary.variantsUpdated = (input.summary.variantsUpdated ?? 0) + 1;
      messages.push(`Variant oppdatert: ${variant.name} (${variant.slug})`);
    } else {
      const { error } = await supabase.from("car_variants").insert(payload);
      if (error) {
        input.summary.errors += 1;
        messages.push(`Variant-import feilet (${variant.slug}): ${error.message}`);
        continue;
      }
      input.summary.variantsImported = (input.summary.variantsImported ?? 0) + 1;
      messages.push(`Variant importert: ${variant.name} (${variant.slug})`);
    }
  }

  return messages;
}

export async function applyImportPreview(input: {
  jobId: string;
  rows: ImportCarRow[];
  parseWarnings?: string[];
  options?: ImportApplyOptions;
}): Promise<{
  summary: ImportReportSummary;
  items: Array<{
    row_number: number;
    slug: string;
    car_id: string | null;
    action: "import" | "update" | "skip" | "error" | "warning" | "image";
    message: string;
    payload: Record<string, unknown>;
  }>;
}> {
  const options = input.options ?? {};
  const forceStatus: ImportStatus = options.forceImportStatus ?? "needs_review";
  const imageMode = options.imageMode ?? "skip";
  const nowIso = new Date().toISOString();

  const existingBySlug = await loadExistingBySlug(input.rows.map((row) => row.slug));
  const { preview } = buildImportPreview(input.rows, existingBySlug, options);
  const brandLookup = await loadBrandLookup();
  const supabase = createAdminClient();

  const summary = emptyImportSummary();
  summary.warnings = input.parseWarnings?.length ?? 0;

  const items: Array<{
    row_number: number;
    slug: string;
    car_id: string | null;
    action: "import" | "update" | "skip" | "error" | "warning" | "image";
    message: string;
    payload: Record<string, unknown>;
  }> = [];

  for (const warning of input.parseWarnings ?? []) {
    items.push({
      row_number: 0,
      slug: "",
      car_id: null,
      action: "warning",
      message: warning,
      payload: {},
    });
  }

  for (const row of preview) {
    await applyPreviewRow({
      row,
      jobId: input.jobId,
      forceStatus,
      imageMode,
      brandLookup,
      existingBySlug,
      nowIso,
      summary,
      items,
      supabase,
    });
  }

  return { summary, items };
}

async function applyPreviewRow(ctx: {
  row: PreviewRow;
  jobId: string;
  forceStatus: ImportStatus;
  imageMode: "skip" | "replace";
  brandLookup: BrandLookup;
  existingBySlug: Map<string, AdminCar>;
  nowIso: string;
  summary: ImportReportSummary;
  items: Array<{
    row_number: number;
    slug: string;
    car_id: string | null;
    action: "import" | "update" | "skip" | "error" | "warning" | "image";
    message: string;
    payload: Record<string, unknown>;
  }>;
  supabase: ReturnType<typeof createAdminClient>;
}) {
  const { row, summary, items } = ctx;

  if (row.decision === "error" || !row.payload) {
    summary.errors += 1;
    items.push({
      row_number: row.rowNumber,
      slug: row.slug,
      car_id: row.existingId,
      action: "error",
      message: row.messages.join(" "),
      payload: {},
    });
    return;
  }

  if (row.decision === "skip") {
    summary.skipped += 1;
    items.push({
      row_number: row.rowNumber,
      slug: row.slug,
      car_id: row.existingId,
      action: "skip",
      message: row.messages.join(" "),
      payload: { changedFields: row.changedFields },
    });
    return;
  }

  const payload = row.payload;
  const brandId = ctx.brandLookup.get(payload.brand.trim().toLowerCase()) ?? null;
  const existing = ctx.existingBySlug.get(payload.slug) ?? null;
  const importStatus: ImportStatus =
    payload.import_status === "draft" ? "draft" : ctx.forceStatus;

  const fieldSources = buildFieldSources(
    payload,
    row.changedFields,
    ctx.jobId,
    ctx.nowIso,
    (existing as AdminCar & { field_sources?: FieldSources } | null)?.field_sources,
    row.decision === "import",
  );

  const dbPayload = toDbPayload(
    payload,
    brandId,
    importStatus,
    fieldSources,
    ctx.jobId,
    ctx.nowIso,
    row.decision === "import" ? null : Boolean(existing?.is_published),
  );

  try {
    const { data, error } = await ctx.supabase
      .from("cars")
      .upsert(dbPayload, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (error || !data) {
      summary.errors += 1;
      console.error("[import] upsert failed:", error?.message);
      items.push({
        row_number: row.rowNumber,
        slug: row.slug,
        car_id: row.existingId,
        action: "error",
        message: error?.message || "Upsert feilet.",
        payload: { slug: row.slug },
      });
      return;
    }

    if (row.decision === "import") summary.imported += 1;
    else summary.updated += 1;

    items.push({
      row_number: row.rowNumber,
      slug: row.slug,
      car_id: data.id as string,
      action: row.decision,
      message: row.messages.join(" "),
      payload: { changedFields: row.changedFields, brand_id: brandId },
    });

    if (payload.gallery_images?.length) {
      const imageMessages = await importGalleryForCar({
        carId: data.id as string,
        slug: payload.slug,
        images: payload.gallery_images,
        mode: ctx.imageMode,
        summary,
      });
      for (const message of imageMessages) {
        items.push({
          row_number: row.rowNumber,
          slug: row.slug,
          car_id: data.id as string,
          action: "image",
          message,
          payload: {},
        });
      }
    }

    if (payload.variants?.length) {
      const variantMessages = await upsertVariantsForCar({
        carId: data.id as string,
        variants: payload.variants,
        forceStatus: ctx.forceStatus,
        summary,
      });
      for (const message of variantMessages) {
        items.push({
          row_number: row.rowNumber,
          slug: row.slug,
          car_id: data.id as string,
          action: "warning",
          message,
          payload: {},
        });
      }
    }
  } catch (error) {
    summary.errors += 1;
    console.error("[import] applyPreviewRow exception:", error);
    items.push({
      row_number: row.rowNumber,
      slug: row.slug,
      car_id: row.existingId,
      action: "error",
      message: "Uventet feil under import.",
      payload: {},
    });
  }
}

export async function fetchExistingCarsBySlugs(
  slugs: string[],
): Promise<Map<string, AdminCar>> {
  return loadExistingBySlug(slugs);
}
