import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isCarImageType, type CarImageType } from "@/lib/admin/car-image-types";
import { resolveStorageRole } from "@/lib/admin/image-production";
import {
  promoteReviewCopyToGalleryPath,
  publicUrlForCarImagePath,
} from "@/lib/admin/image-review-storage";
import type {
  ResearchFieldCandidate,
  ResearchImageCandidate,
  ResearchItem,
  ResearchJobSummary,
  ResearchVariantProposal,
} from "@/lib/admin/research/types";

function buildFieldSources(
  fields: ResearchFieldCandidate[],
  jobId: string,
): Record<string, unknown> {
  const sources: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.entity_type !== "car") continue;
    if (field.status !== "approved" && field.status !== "pending") continue;
    sources[field.field_key] = {
      source_name: field.source_name,
      source_url: field.source_url,
      imported_at: field.retrieved_at ?? new Date().toISOString(),
      import_job_id: null,
      research_job_id: jobId,
      confidence: field.confidence,
      retrieved_at: field.retrieved_at,
    };
  }
  return sources;
}

function carPayloadFromItem(
  item: ResearchItem,
  approvedFields: ResearchFieldCandidate[],
  jobId: string,
  nowIso: string,
  preservePublished: boolean | null,
) {
  const proposed = { ...(item.proposed_car ?? {}) };
  // Prefer explicitly approved field values.
  for (const field of approvedFields) {
    if (field.entity_type !== "car") continue;
    if (field.status !== "approved") continue;
    proposed[field.field_key] = field.proposed_value;
  }

  return {
    slug: String(proposed.slug ?? item.slug),
    brand: String(proposed.brand ?? item.brand),
    model: String(proposed.model ?? item.model),
    year: (proposed.year as number | null) ?? null,
    price_nok: (proposed.price_nok as number | null) ?? null,
    range_km: (proposed.range_km as number | null) ?? null,
    winter_range_km: (proposed.winter_range_km as number | null) ?? null,
    real_world_range_km: (proposed.real_world_range_km as number | null) ?? null,
    battery_kwh: (proposed.battery_kwh as number | null) ?? null,
    battery_total_kwh: (proposed.battery_total_kwh as number | null) ?? null,
    battery_usable_kwh: (proposed.battery_usable_kwh as number | null) ?? null,
    battery_chemistry: (proposed.battery_chemistry as string | null) ?? null,
    dc_charging_kw: (proposed.dc_charging_kw as number | null) ?? null,
    ac_charging_kw: (proposed.ac_charging_kw as number | null) ?? null,
    charge_time_10_80_minutes:
      (proposed.charge_time_10_80_minutes as number | null) ?? null,
    charging_connector_ac: (proposed.charging_connector_ac as string | null) ?? null,
    charging_connector_dc: (proposed.charging_connector_dc as string | null) ?? null,
    drivetrain: (proposed.drivetrain as string | null) ?? null,
    consumption_kwh_100km: (proposed.consumption_kwh_100km as number | null) ?? null,
    power_hp: (proposed.power_hp as number | null) ?? null,
    torque_nm: (proposed.torque_nm as number | null) ?? null,
    acceleration_0_100: (proposed.acceleration_0_100 as number | null) ?? null,
    top_speed_kmh: (proposed.top_speed_kmh as number | null) ?? null,
    seats: (proposed.seats as number | null) ?? null,
    cargo_l: (proposed.cargo_l as number | null) ?? null,
    frunk_l: (proposed.frunk_l as number | null) ?? null,
    towing_kg: (proposed.towing_kg as number | null) ?? null,
    length_mm: (proposed.length_mm as number | null) ?? null,
    width_mm: (proposed.width_mm as number | null) ?? null,
    height_mm: (proposed.height_mm as number | null) ?? null,
    wheelbase_mm: (proposed.wheelbase_mm as number | null) ?? null,
    curb_weight_kg: (proposed.curb_weight_kg as number | null) ?? null,
    gross_weight_kg: (proposed.gross_weight_kg as number | null) ?? null,
    vehicle_type: (proposed.vehicle_type as string | null) ?? null,
    body_style: (proposed.body_style as string | null) ?? null,
    warranty: (proposed.warranty as string | null) ?? null,
    heat_pump: (proposed.heat_pump as boolean | null) ?? null,
    description: (proposed.description as string | null) ?? null,
    country: (proposed.country as string | null) || "NO",
    source_name: (proposed.source_name as string | null) ?? null,
    source_url: (proposed.source_url as string | null) ?? null,
    data_last_checked_at: nowIso,
    import_status: "needs_review" as const,
    import_notes: `Applied from research job ${jobId}`,
    is_published: preservePublished === null ? false : preservePublished,
    field_sources: buildFieldSources(approvedFields, jobId),
    imported_at: nowIso,
  };
}

async function upsertVariants(
  carId: string,
  variants: ResearchVariantProposal[],
  approvedFields: ResearchFieldCandidate[],
) {
  if (!variants.length) return;
  const supabase = createAdminClient();

  for (let index = 0; index < variants.length; index += 1) {
    const variant = variants[index];
    const row: Record<string, unknown> = {
      car_id: carId,
      name: variant.name,
      slug: variant.slug,
      is_default: Boolean(variant.is_default) || index === 0,
      is_active: true,
      sort_order: index,
      import_status: "needs_review",
      import_notes: "From research pipeline",
    };

    for (const field of variant.fields) {
      row[field.field_key] = field.value;
    }
    for (const field of approvedFields) {
      if (field.entity_type !== "variant") continue;
      if (field.variant_slug !== variant.slug) continue;
      if (field.status !== "approved") continue;
      row[field.field_key] = field.proposed_value;
    }

    if (row.is_default) {
      await supabase
        .from("car_variants")
        .update({ is_default: false })
        .eq("car_id", carId)
        .eq("is_default", true);
    }

    const { data: existing } = await supabase
      .from("car_variants")
      .select("id")
      .eq("car_id", carId)
      .eq("slug", variant.slug)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from("car_variants").update(row).eq("id", existing.id);
    } else {
      await supabase.from("car_variants").insert(row);
    }
  }
}

/**
 * Attach one human-approved candidate into car_images.
 * Promotes the already-stored review copy — does not re-fetch OEM CDN URLs.
 * Never auto-approves; caller must set status=approved first.
 * Does not publish the car.
 */
export async function applySingleApprovedImage(input: {
  carId: string;
  slug: string;
  brand?: string | null;
  image: ResearchImageCandidate;
  sortOrder?: number;
}): Promise<{ ok: true; galleryImageId: string } | { ok: false; error: string }> {
  const image = input.image;
  if (image.status !== "approved") {
    return { ok: false, error: "Bildet er ikke godkjent." };
  }
  if (image.applied_image_id) {
    return { ok: true, galleryImageId: image.applied_image_id };
  }
  if (!image.storage_path?.trim()) {
    return {
      ok: false,
      error: "Mangler lokal review-kopi. Last ned på nytt fra Image Review.",
    };
  }

  const supabase = createAdminClient();
  try {
    const role = resolveStorageRole({
      isPrimary: image.is_primary_candidate,
      imageType: image.image_type,
    });
    const promoted = await promoteReviewCopyToGalleryPath({
      reviewStoragePath: image.storage_path,
      brand: input.brand?.trim() || input.slug.split("-")[0] || "brand",
      modelSlug: input.slug,
      role,
    });
    if (!promoted.ok) {
      return { ok: false, error: promoted.error };
    }

    const storagePath = promoted.storagePath;
    const publicUrl = publicUrlForCarImagePath(storagePath);
    const imageType: CarImageType = isCarImageType(image.image_type ?? "")
      ? (image.image_type as CarImageType)
      : "other";

    if (image.is_primary_candidate) {
      await supabase.from("car_images").update({ is_primary: false }).eq("car_id", input.carId);
    }

    const { data: inserted, error: insertError } = await supabase
      .from("car_images")
      .insert({
        car_id: input.carId,
        image_url: publicUrl,
        storage_path: storagePath,
        image_type: imageType,
        alt_text:
          image.alt_text ||
          `Kilde: ${image.source_name || image.source_url || image.original_url}`,
        is_primary: image.is_primary_candidate,
        sort_order: input.sortOrder ?? 0,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return { ok: false, error: "Kunne ikke lagre bildeposten." };
    }

    if (image.is_primary_candidate) {
      await supabase.from("cars").update({ image_url: publicUrl }).eq("id", input.carId);
    }

    await supabase
      .from("research_image_candidates")
      .update({
        status: "applied",
        applied_image_id: inserted.id,
        // Keep gallery path; original_url provenance remains on the row.
        storage_path: storagePath,
        notes: [
          image.notes,
          image.license_note,
          image.usage_terms,
          `original:${image.original_url}`,
          `review-promoted-from:${image.storage_path}`,
        ]
          .filter(Boolean)
          .join(" | "),
      })
      .eq("id", image.id);

    return { ok: true, galleryImageId: inserted.id as string };
  } catch (error) {
    console.error("[research] apply image failed:", error);
    return { ok: false, error: "Kunne ikke anvende bildet." };
  }
}

async function applyApprovedImages(input: {
  carId: string;
  slug: string;
  brand?: string | null;
  images: ResearchImageCandidate[];
}): Promise<number> {
  let applied = 0;
  let sortOrder = 0;

  for (const image of input.images) {
    if (image.status !== "approved") continue;
    const result = await applySingleApprovedImage({
      carId: input.carId,
      slug: input.slug,
      brand: input.brand,
      image,
      sortOrder,
    });
    if (result.ok) {
      sortOrder += 1;
      applied += 1;
    }
  }

  return applied;
}

export async function applyApprovedResearchItems(input: {
  jobId: string;
  itemIds?: string[];
}): Promise<{
  applied: number;
  errors: string[];
  summary: ResearchJobSummary;
}> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const errors: string[] = [];

  let query = supabase
    .from("research_items")
    .select("*")
    .eq("job_id", input.jobId)
    .eq("decision", "approved");

  if (input.itemIds?.length) {
    query = query.in("id", input.itemIds);
  }

  const { data: items, error } = await query;
  if (error) {
    return {
      applied: 0,
      errors: [error.message],
      summary: {
        modelsFound: 0,
        fieldsFound: 0,
        conflicts: 0,
        warnings: 0,
        missingFields: 0,
        imageCandidates: 0,
        applied: 0,
        rejected: 0,
        approved: 0,
      },
    };
  }

  let applied = 0;

  for (const raw of items ?? []) {
    const item = raw as ResearchItem;
    try {
      const { data: fields } = await supabase
        .from("research_field_candidates")
        .select("*")
        .eq("item_id", item.id);

      const fieldRows = (fields ?? []) as ResearchFieldCandidate[];
      // Auto-approve non-conflict pending fields when item is approved.
      const usable = fieldRows.map((field) =>
        field.status === "pending"
          ? { ...field, status: "approved" as const }
          : field,
      );

      const { data: existing } = await supabase
        .from("cars")
        .select("id, is_published, field_sources")
        .eq("slug", item.slug)
        .maybeSingle();

      const payload = carPayloadFromItem(
        item,
        usable,
        input.jobId,
        nowIso,
        existing ? Boolean(existing.is_published) : null,
      );

      // Merge previous field_sources
      if (existing?.field_sources && typeof existing.field_sources === "object") {
        payload.field_sources = {
          ...(existing.field_sources as Record<string, unknown>),
          ...(payload.field_sources as Record<string, unknown>),
        };
      }

      // Never publish from research.
      if (!existing) {
        payload.is_published = false;
      }

      const { data: upserted, error: upsertError } = await supabase
        .from("cars")
        .upsert(payload, { onConflict: "slug" })
        .select("id, slug")
        .single();

      if (upsertError || !upserted) {
        errors.push(`${item.slug}: ${upsertError?.message || "upsert feilet"}`);
        continue;
      }

      const variants = (item.proposed_variants ?? []) as ResearchVariantProposal[];
      await upsertVariants(upserted.id as string, variants, usable);

      const { data: images } = await supabase
        .from("research_image_candidates")
        .select("*")
        .eq("item_id", item.id);
      await applyApprovedImages({
        carId: upserted.id as string,
        slug: upserted.slug as string,
        brand: item.brand,
        images: (images ?? []) as ResearchImageCandidate[],
      });

      await supabase
        .from("research_items")
        .update({
          decision: "applied",
          existing_car_id: upserted.id,
          message: "Anvendt som needs_review (ikke publisert).",
        })
        .eq("id", item.id);

      await supabase
        .from("research_field_candidates")
        .update({ status: "applied" })
        .eq("item_id", item.id)
        .in("status", ["approved", "pending"]);

      applied += 1;
    } catch (err) {
      console.error("[research] apply item failed:", err);
      errors.push(`${item.slug}: uventet feil`);
    }
  }

  return {
    applied,
    errors,
    summary: {
      modelsFound: items?.length ?? 0,
      fieldsFound: 0,
      conflicts: 0,
      warnings: errors.length,
      missingFields: 0,
      imageCandidates: 0,
      applied,
      rejected: 0,
      approved: items?.length ?? 0,
    },
  };
}
