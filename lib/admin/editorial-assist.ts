import "server-only";

import { getAdminBrandById } from "@/lib/admin/brands";
import { getAdminCarById } from "@/lib/admin/cars";
import { listAdminCarImages } from "@/lib/admin/car-images";
import {
  EDITORIAL_DRAFT_MARKER,
  generateEditorialDrafts,
  isEmptyCarValue,
  shouldFillField,
} from "@/lib/admin/editorial-assist-core";
import { computeEditorialCompletion } from "@/lib/admin/editorial-completion";
import { sourcesForBrand } from "@/lib/admin/research/sources";
import {
  createResearchJob,
  executeResearchJob,
  listResearchFieldCandidates,
  listResearchImageCandidates,
  listResearchItems,
  updateResearchJob,
} from "@/lib/admin/research/jobs";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";
import type { AdminCar } from "@/lib/admin/types";
import { listAdminCarVariants } from "@/lib/admin/variants";
import type {
  ResearchConflict,
  ResearchFieldCandidate,
  ResearchImageCandidate,
  ResearchItem,
  ResearchJob,
} from "@/lib/admin/research/types";

export {
  ASSIST_FILLABLE_FIELDS,
  EDITORIAL_DRAFT_MARKER,
  generateEditorialDrafts,
  isEmptyCarValue,
  shouldFillField,
} from "@/lib/admin/editorial-assist-core";

export type AssistedEditorialResult = {
  ok: boolean;
  message: string;
  jobId: string | null;
  filledFields: string[];
  skippedExisting: string[];
  conflicts: Array<{ field_key: string; message: string }>;
  imageSuggestions: number;
  editorialDrafts: string[];
  percentAfter: number | null;
  awaitingManual: boolean;
  error?: string;
};

function dbReady() {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function resolveSourceForCar(
  car: AdminCar,
  brandWebsite: string | null,
): { sourceName: string; sourceUrl: string } {
  if (car.source_url?.trim()) {
    return {
      sourceName: car.source_name?.trim() || `${car.brand} (kilde)`,
      sourceUrl: car.source_url.trim(),
    };
  }
  const preset = sourcesForBrand(car.brand)[0];
  if (preset) {
    return { sourceName: preset.sourceName, sourceUrl: preset.sourceUrl };
  }
  if (brandWebsite?.trim()) {
    return {
      sourceName: `${car.brand} (offisiell)`,
      sourceUrl: brandWebsite.trim(),
    };
  }
  return { sourceName: "", sourceUrl: "" };
}

function pickMatchingItem(
  items: ResearchItem[],
  car: AdminCar,
): ResearchItem | null {
  const byId = items.find((item) => item.existing_car_id === car.id);
  if (byId) return byId;
  const bySlug = items.find(
    (item) => (item.slug ?? "").toLowerCase() === car.slug.toLowerCase(),
  );
  if (bySlug) return bySlug;
  const modelLower = car.model.toLowerCase();
  const byModel = items.find(
    (item) => (item.model ?? "").toLowerCase() === modelLower,
  );
  if (byModel) return byModel;
  return items[0] ?? null;
}

function conflictKeys(item: ResearchItem, fields: ResearchFieldCandidate[]): Set<string> {
  const keys = new Set<string>();
  for (const field of fields) {
    if (field.entity_type === "car" && field.status === "conflict") {
      keys.add(field.field_key);
    }
  }
  const stored = Array.isArray(item.conflicts) ? item.conflicts : [];
  for (const conflict of stored as ResearchConflict[]) {
    if (conflict.entity_type === "car") keys.add(conflict.field_key);
  }
  return keys;
}

/**
 * Apply research candidates onto a car — only empty fields, never overwrite.
 * Conflicts are skipped (left for research job review). Images are never applied.
 */
export async function applyAssistedFillMissing(input: {
  car: AdminCar;
  job: ResearchJob;
  item: ResearchItem;
  fields: ResearchFieldCandidate[];
  images: ResearchImageCandidate[];
}): Promise<{
  filledFields: string[];
  skippedExisting: string[];
  conflicts: Array<{ field_key: string; message: string }>;
  imageSuggestions: number;
  editorialDrafts: string[];
}> {
  const { car, job, item, fields } = input;
  const nowIso = new Date().toISOString();
  const conflicted = conflictKeys(item, fields);
  const filledFields: string[] = [];
  const skippedExisting: string[] = [];
  const conflicts: Array<{ field_key: string; message: string }> = [];
  const editorialDrafts: string[] = [];

  for (const key of conflicted) {
    conflicts.push({
      field_key: key,
      message: `Konflikt for ${key}: flere verdier funnet — velg manuelt i research-jobben.`,
    });
  }

  const patch: Record<string, unknown> = {};
  const fieldSources: Record<string, unknown> = {
    ...(car.field_sources ?? {}),
  };

  const carFields = fields.filter(
    (field) => field.entity_type === "car" && field.status !== "conflict",
  );

  // Group by field_key; if multiple distinct pending values → treat as conflict.
  const byKey = new Map<string, ResearchFieldCandidate[]>();
  for (const field of carFields) {
    const list = byKey.get(field.field_key) ?? [];
    list.push(field);
    byKey.set(field.field_key, list);
  }

  for (const [fieldKey, candidates] of byKey) {
    if (conflicted.has(fieldKey)) continue;

    const unique = new Map<string, ResearchFieldCandidate>();
    for (const candidate of candidates) {
      const norm =
        candidate.proposed_value == null
          ? ""
          : String(candidate.proposed_value).trim().toLowerCase();
      if (!norm) continue;
      if (!unique.has(norm)) unique.set(norm, candidate);
    }

    if (unique.size > 1) {
      conflicts.push({
        field_key: fieldKey,
        message: `Konflikt for ${fieldKey}: ${unique.size} ulike verdier — ikke auto-valgt.`,
      });
      continue;
    }

    const winner = [...unique.values()][0];
    const current = (car as Record<string, unknown>)[fieldKey];
    const decision = shouldFillField({
      fieldKey,
      currentValue: current,
      proposedValue: winner?.proposed_value,
      hasConflict: false,
    });
    if (decision === "skip_existing") {
      skippedExisting.push(fieldKey);
      continue;
    }
    if (decision !== "fill" || !winner) continue;

    patch[fieldKey] = winner.proposed_value;
    fieldSources[fieldKey] = {
      source_name: winner.source_name,
      source_url: winner.source_url,
      imported_at: nowIso,
      import_job_id: null,
      research_job_id: job.id,
      confidence: winner.confidence,
      retrieved_at: winner.retrieved_at ?? nowIso,
      data_last_checked_at: nowIso,
    };
    filledFields.push(fieldKey);
  }

  // Editorial drafts from known + newly filled specs — never invent numbers.
  const enrichedCar = { ...car, ...patch } as AdminCar;
  const drafts = generateEditorialDrafts(enrichedCar);
  const draftSource = {
    source_name: job.source_name ?? "EVFAKTA Editorial Assistant",
    source_url: job.source_url,
    imported_at: nowIso,
    import_job_id: null as string | null,
    research_job_id: job.id,
    confidence: 0.35,
    retrieved_at: nowIso,
    data_last_checked_at: nowIso,
    draft: true,
    notes: EDITORIAL_DRAFT_MARKER,
  };

  if (isEmptyCarValue(car.description) && !("description" in patch)) {
    patch.description = drafts.description;
    fieldSources.description = draftSource;
    filledFields.push("description");
    editorialDrafts.push("description");
  }
  if (isEmptyCarValue(car.pros) && !("pros" in patch)) {
    patch.pros = drafts.pros;
    fieldSources.pros = { ...draftSource };
    filledFields.push("pros");
    editorialDrafts.push("pros");
  }
  if (isEmptyCarValue(car.cons) && !("cons" in patch)) {
    patch.cons = drafts.cons;
    fieldSources.cons = { ...draftSource };
    filledFields.push("cons");
    editorialDrafts.push("cons");
  }
  if (isEmptyCarValue(car.suitable_for) && !("suitable_for" in patch)) {
    patch.suitable_for = drafts.suitable_for;
    fieldSources.suitable_for = { ...draftSource };
    filledFields.push("suitable_for");
    editorialDrafts.push("suitable_for");
  }

  if (isEmptyCarValue(car.source_name) && job.source_name && !("source_name" in patch)) {
    patch.source_name = job.source_name;
    filledFields.push("source_name");
  }
  if (isEmptyCarValue(car.source_url) && job.source_url && !("source_url" in patch)) {
    patch.source_url = job.source_url;
    filledFields.push("source_url");
  }

  if (filledFields.length > 0) {
    patch.field_sources = fieldSources;
    patch.data_last_checked_at = nowIso;
    if ((car.import_status ?? "draft") === "draft") {
      patch.import_status = "needs_review";
    }
    const note = `Assisted fill from research ${job.id}: ${filledFields.join(", ")}`;
    patch.import_notes = car.import_notes?.trim()
      ? `${car.import_notes}\n${note}`
      : note;

    const supabase = createAdminClient();
    const { error } = await supabase.from("cars").update(patch).eq("id", car.id);
    if (error) {
      throw new Error(error.message);
    }

    // Mark safely applied research candidates.
    const appliedIds = carFields
      .filter((field) => filledFields.includes(field.field_key))
      .map((field) => field.id);
    if (appliedIds.length) {
      await supabase
        .from("research_field_candidates")
        .update({ status: "applied" })
        .in("id", appliedIds);
    }
  }

  // Images: suggest only — never auto-publish / never insert into car_images.
  const imageSuggestions = input.images.length;

  return {
    filledFields,
    skippedExisting,
    conflicts,
    imageSuggestions,
    editorialDrafts,
  };
}

/**
 * Research missing fields for a car and fill only empty values.
 * Uses the research pipeline; keeps conflicts + image candidates for review.
 */
export async function runAssistedEditorialFill(input: {
  carId: string;
  createdBy?: string | null;
}): Promise<AssistedEditorialResult> {
  if (!dbReady()) {
    return {
      ok: false,
      message: "",
      jobId: null,
      filledFields: [],
      skippedExisting: [],
      conflicts: [],
      imageSuggestions: 0,
      editorialDrafts: [],
      percentAfter: null,
      awaitingManual: false,
      error: "Admin-databasen er utilgjengelig.",
    };
  }

  const car = await getAdminCarById(input.carId);
  if (!car) {
    return {
      ok: false,
      message: "",
      jobId: null,
      filledFields: [],
      skippedExisting: [],
      conflicts: [],
      imageSuggestions: 0,
      editorialDrafts: [],
      percentAfter: null,
      awaitingManual: false,
      error: "Bilen ble ikke funnet.",
    };
  }

  const brand = car.brand_id ? await getAdminBrandById(car.brand_id) : null;
  const source = resolveSourceForCar(car, brand?.website_url ?? null);

  const job = await createResearchJob({
    createdBy: input.createdBy ?? null,
    brandId: car.brand_id,
    brandName: car.brand,
    modelQuery: car.model,
    providerKey: source.sourceUrl ? "manufacturer_http" : "stub",
    sourceMode: source.sourceUrl ? "live" : "manual_paste",
    sourceName: source.sourceName || `${car.brand} research`,
    sourceUrl: source.sourceUrl || null,
    options: {
      assisted: true,
      car_id: car.id,
      car_slug: car.slug,
    },
  });

  if (!job) {
    return {
      ok: false,
      message: "",
      jobId: null,
      filledFields: [],
      skippedExisting: [],
      conflicts: [],
      imageSuggestions: 0,
      editorialDrafts: [],
      percentAfter: null,
      awaitingManual: false,
      error: "Kunne ikke opprette research-jobb.",
    };
  }

  const finished = await executeResearchJob(job.id);
  if (!finished) {
    return {
      ok: false,
      message: "",
      jobId: job.id,
      filledFields: [],
      skippedExisting: [],
      conflicts: [],
      imageSuggestions: 0,
      editorialDrafts: [],
      percentAfter: null,
      awaitingManual: false,
      error: "Research-jobben feilet.",
    };
  }

  if (finished.status === "awaiting_manual") {
    // Still generate editorial drafts from known car data when live fetch is blocked.
    try {
      const emptyItem: ResearchItem = {
        id: "local",
        job_id: finished.id,
        created_at: finished.created_at,
        updated_at: finished.updated_at,
        sort_order: 0,
        slug: car.slug,
        brand: car.brand,
        model: car.model,
        existing_car_id: car.id,
        decision: "pending",
        warnings: [],
        missing_fields: [],
        conflicts: [],
        proposed_car: {},
        proposed_variants: [],
        message: null,
      };
      const draftOnly = await applyAssistedFillMissing({
        car,
        job: finished,
        item: emptyItem,
        fields: [],
        images: [],
      });
      const images = await listAdminCarImages(car.id);
      const variants = await listAdminCarVariants(car.id);
      const refreshed = await getAdminCarById(car.id);
      const percentAfter = refreshed
        ? computeEditorialCompletion({
            car: refreshed,
            images,
            variants,
          }).percent
        : null;

      return {
        ok: true,
        message:
          "Automatisk tilgang ble blokkert (forventet). Jobben venter på manuell kilde. Utkast til redaksjonell tekst er fylt inn der feltene var tomme.",
        jobId: finished.id,
        filledFields: draftOnly.filledFields,
        skippedExisting: draftOnly.skippedExisting,
        conflicts: draftOnly.conflicts,
        imageSuggestions: 0,
        editorialDrafts: draftOnly.editorialDrafts,
        percentAfter,
        awaitingManual: true,
      };
    } catch (error) {
      return {
        ok: true,
        message:
          "Automatisk tilgang ble blokkert. Åpne research-jobben og fortsett med manuell kilde.",
        jobId: finished.id,
        filledFields: [],
        skippedExisting: [],
        conflicts: [],
        imageSuggestions: 0,
        editorialDrafts: [],
        percentAfter: null,
        awaitingManual: true,
        error: error instanceof Error ? error.message : undefined,
      };
    }
  }

  if (finished.status === "failed") {
    return {
      ok: false,
      message: "",
      jobId: finished.id,
      filledFields: [],
      skippedExisting: [],
      conflicts: [],
      imageSuggestions: 0,
      editorialDrafts: [],
      percentAfter: null,
      awaitingManual: false,
      error: finished.error_message || "Research feilet.",
    };
  }

  const items = await listResearchItems(finished.id);
  // Prefer matching this car; force existing_car_id link when slug matches.
  let item = pickMatchingItem(items, car);
  if (item && !item.existing_car_id) {
    const supabase = createAdminClient();
    await supabase
      .from("research_items")
      .update({ existing_car_id: car.id })
      .eq("id", item.id);
    item = { ...item, existing_car_id: car.id };
  }

  if (!item) {
    // No models found — still try editorial drafts.
    const emptyItem: ResearchItem = {
      id: "local",
      job_id: finished.id,
      created_at: finished.created_at,
      updated_at: finished.updated_at,
      sort_order: 0,
      slug: car.slug,
      brand: car.brand,
      model: car.model,
      existing_car_id: car.id,
      decision: "pending",
      warnings: [],
      missing_fields: [],
      conflicts: [],
      proposed_car: {},
      proposed_variants: [],
      message: null,
    };
    const draftOnly = await applyAssistedFillMissing({
      car,
      job: finished,
      item: emptyItem,
      fields: [],
      images: [],
    });
    const images = await listAdminCarImages(car.id);
    const variants = await listAdminCarVariants(car.id);
    const refreshed = await getAdminCarById(car.id);
    const percentAfter = refreshed
      ? computeEditorialCompletion({ car: refreshed, images, variants }).percent
      : null;

    await updateResearchJob(finished.id, {
      progress_message: "Assisted fill: ingen spesifikasjoner funnet — kun utkast",
    });

    return {
      ok: true,
      message:
        "Ingen spesifikasjoner ble hentet. Redaksjonelle utkast er laget der feltene var tomme.",
      jobId: finished.id,
      filledFields: draftOnly.filledFields,
      skippedExisting: draftOnly.skippedExisting,
      conflicts: [],
      imageSuggestions: 0,
      editorialDrafts: draftOnly.editorialDrafts,
      percentAfter,
      awaitingManual: false,
    };
  }

  const [fields, imageCandidates] = await Promise.all([
    listResearchFieldCandidates(item.id),
    listResearchImageCandidates(item.id),
  ]);

  const applied = await applyAssistedFillMissing({
    car,
    job: finished,
    item,
    fields,
    images: imageCandidates,
  });

  await updateResearchJob(finished.id, {
    status: applied.conflicts.length ? "needs_review" : finished.status,
    progress_message: `Assisted fill: ${applied.filledFields.length} felt fylt, ${applied.conflicts.length} konflikt(er), ${imageCandidates.length} bildkandidat(er)`,
  });

  const images = await listAdminCarImages(car.id);
  const variants = await listAdminCarVariants(car.id);
  const refreshed = await getAdminCarById(car.id);
  const percentAfter = refreshed
    ? computeEditorialCompletion({ car: refreshed, images, variants }).percent
    : null;

  const parts = [
    `Fylte ${applied.filledFields.length} manglende felt.`,
    applied.conflicts.length
      ? `${applied.conflicts.length} konflikt(er) krever manuelt valg.`
      : null,
    imageCandidates.length
      ? `${imageCandidates.length} bildkandidat(er) foreslått (ikke publisert).`
      : null,
    applied.editorialDrafts.length
      ? `Redaksjonelle utkast: ${applied.editorialDrafts.join(", ")}.`
      : null,
  ].filter(Boolean);

  return {
    ok: true,
    message: parts.join(" "),
    jobId: finished.id,
    filledFields: applied.filledFields,
    skippedExisting: applied.skippedExisting,
    conflicts: applied.conflicts,
    imageSuggestions: applied.imageSuggestions,
    editorialDrafts: applied.editorialDrafts,
    percentAfter,
    awaitingManual: false,
  };
}
