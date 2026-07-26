import "server-only";

import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";
import { runResearchProvider } from "@/lib/admin/research/providers";
import type {
  ResearchFieldCandidate,
  ResearchImageCandidate,
  ResearchItem,
  ResearchJob,
  ResearchJobStatus,
  ResearchJobSummary,
  ResearchModelProposal,
  ResearchProviderKey,
  ResearchSourceMode,
} from "@/lib/admin/research/types";

function dbReady() {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function emptySummary(): ResearchJobSummary {
  return {
    modelsFound: 0,
    fieldsFound: 0,
    conflicts: 0,
    warnings: 0,
    missingFields: 0,
    imageCandidates: 0,
    applied: 0,
    rejected: 0,
    approved: 0,
  };
}

export async function createResearchJob(input: {
  createdBy?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  modelQuery?: string | null;
  providerKey: ResearchProviderKey;
  sourceMode: ResearchSourceMode;
  sourceName?: string | null;
  sourceUrl?: string | null;
  filename?: string | null;
  rawInput?: string | null;
  options?: Record<string, unknown>;
}): Promise<ResearchJob | null> {
  if (!dbReady()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_jobs")
    .insert({
      created_by: input.createdBy ?? null,
      brand_id: input.brandId ?? null,
      brand_name: input.brandName ?? null,
      model_query: input.modelQuery ?? null,
      provider_key: input.providerKey,
      source_mode: input.sourceMode,
      status: "queued",
      source_name: input.sourceName ?? null,
      source_url: input.sourceUrl ?? null,
      filename: input.filename ?? null,
      raw_input: input.rawInput ?? null,
      options: input.options ?? {},
      summary: emptySummary(),
      progress_pct: 0,
      progress_message: "I kø",
    })
    .select("*")
    .single();

  if (error) {
    console.error("[research] createResearchJob failed:", error.message);
    return null;
  }
  return data as ResearchJob;
}

export async function updateResearchJob(
  id: string,
  patch: Partial<{
    status: ResearchJobStatus;
    provider_key: ResearchProviderKey;
    source_mode: ResearchSourceMode;
    summary: ResearchJobSummary | Record<string, unknown>;
    error_message: string | null;
    progress_message: string | null;
    progress_pct: number;
    completed_at: string | null;
    raw_input: string | null;
    filename: string | null;
    model_query: string | null;
    options: Record<string, unknown>;
  }>,
): Promise<void> {
  if (!dbReady()) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("research_jobs").update(patch).eq("id", id);
  if (error) console.error("[research] updateResearchJob failed:", error.message);
}

export async function clearResearchJobItems(jobId: string): Promise<void> {
  if (!dbReady()) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("research_items").delete().eq("job_id", jobId);
  if (error) console.error("[research] clearResearchJobItems failed:", error.message);
}

/** Switch a blocked live job into manual research mode (job is kept). */
export async function switchResearchJobToManual(input: {
  jobId: string;
  reason: string;
  originalProvider: ResearchProviderKey;
}): Promise<ResearchJob | null> {
  const job = await getResearchJob(input.jobId);
  if (!job) return null;

  await updateResearchJob(input.jobId, {
    status: "awaiting_manual",
    provider_key: "manual",
    source_mode: "manual_paste",
    error_message: null,
    progress_pct: 35,
    progress_message: "Venter på manuell kilde",
    completed_at: null,
    options: {
      ...(typeof job.options === "object" && job.options ? job.options : {}),
      live_blocked: true,
      blocked_expected: true,
      blocked_reason: input.reason,
      original_provider: input.originalProvider,
    },
  });

  return getResearchJob(input.jobId);
}

export async function getResearchJob(id: string): Promise<ResearchJob | null> {
  if (!id || !dbReady()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[research] getResearchJob failed:", error.message);
    return null;
  }
  return (data as ResearchJob | null) ?? null;
}

export async function listResearchJobs(limit = 30): Promise<ResearchJob[]> {
  if (!dbReady()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[research] listResearchJobs failed:", error.message);
    return [];
  }
  return (data ?? []) as ResearchJob[];
}

export async function listResearchItems(jobId: string): Promise<ResearchItem[]> {
  if (!jobId || !dbReady()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_items")
    .select("*")
    .eq("job_id", jobId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[research] listResearchItems failed:", error.message);
    return [];
  }
  return (data ?? []) as ResearchItem[];
}

export async function listResearchFieldCandidates(
  itemId: string,
): Promise<ResearchFieldCandidate[]> {
  if (!itemId || !dbReady()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_field_candidates")
    .select("*")
    .eq("item_id", itemId)
    .order("field_key", { ascending: true });
  if (error) {
    console.error("[research] listResearchFieldCandidates failed:", error.message);
    return [];
  }
  return (data ?? []) as ResearchFieldCandidate[];
}

export async function listResearchImageCandidates(
  itemId: string,
): Promise<ResearchImageCandidate[]> {
  if (!itemId || !dbReady()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_image_candidates")
    .select("*")
    .eq("item_id", itemId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[research] listResearchImageCandidates failed:", error.message);
    return [];
  }
  return (data ?? []) as ResearchImageCandidate[];
}

function proposedCarFromFields(proposal: ResearchModelProposal): Record<string, unknown> {
  const car: Record<string, unknown> = {
    slug: proposal.slug,
    brand: proposal.brand,
    model: proposal.model,
    is_published: false,
    import_status: "needs_review",
    country: "NO",
  };
  for (const item of proposal.fields) {
    car[item.field_key] = item.value;
  }
  return car;
}

async function persistProposal(
  jobId: string,
  proposal: ResearchModelProposal,
  sortOrder: number,
  existingCarId: string | null,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: item, error } = await supabase
    .from("research_items")
    .insert({
      job_id: jobId,
      sort_order: sortOrder,
      slug: proposal.slug,
      brand: proposal.brand,
      model: proposal.model,
      existing_car_id: existingCarId,
      decision: "pending",
      warnings: proposal.warnings,
      missing_fields: proposal.missing_fields,
      conflicts: proposal.conflicts,
      proposed_car: proposedCarFromFields(proposal),
      proposed_variants: proposal.variants,
      message: existingCarId ? "Matcher eksisterende bil (oppdatering)." : "Ny modell foreslått.",
    })
    .select("id")
    .single();

  if (error || !item) {
    console.error("[research] persist item failed:", error?.message);
    return null;
  }

  const itemId = item.id as string;
  const fieldRows = [];

  for (const field of proposal.fields) {
    const hasConflict = proposal.conflicts.some(
      (conflict) => conflict.entity_type === "car" && conflict.field_key === field.field_key,
    );
    fieldRows.push({
      item_id: itemId,
      entity_type: "car",
      variant_slug: null,
      field_key: field.field_key,
      proposed_value: field.value,
      source_name: field.source.source_name,
      source_url: field.source.source_url,
      retrieved_at: field.source.retrieved_at,
      confidence: field.source.confidence,
      status: hasConflict ? "conflict" : "pending",
      conflict_group: hasConflict ? field.field_key : null,
      notes: field.notes ?? null,
    });
  }

  for (const variant of proposal.variants) {
    for (const field of variant.fields) {
      const hasConflict = proposal.conflicts.some(
        (conflict) =>
          conflict.entity_type === "variant" &&
          conflict.variant_slug === variant.slug &&
          conflict.field_key === field.field_key,
      );
      fieldRows.push({
        item_id: itemId,
        entity_type: "variant",
        variant_slug: variant.slug,
        field_key: field.field_key,
        proposed_value: field.value,
        source_name: field.source.source_name,
        source_url: field.source.source_url,
        retrieved_at: field.source.retrieved_at,
        confidence: field.source.confidence,
        status: hasConflict ? "conflict" : "pending",
        conflict_group: hasConflict ? `${variant.slug}:${field.field_key}` : null,
        notes: field.notes ?? null,
      });
    }
  }

  if (fieldRows.length) {
    const { error: fieldError } = await supabase
      .from("research_field_candidates")
      .insert(fieldRows);
    if (fieldError) {
      console.error("[research] field candidates insert failed:", fieldError.message);
    }
  }

  if (proposal.images.length) {
    const { error: imageError } = await supabase.from("research_image_candidates").insert(
      proposal.images.map((image) => ({
        item_id: itemId,
        original_url: image.original_url,
        source_name: image.source_name ?? null,
        source_url: image.source_url ?? null,
        license_note: image.license_note ?? null,
        usage_terms: image.usage_terms ?? null,
        alt_text: image.alt_text ?? null,
        image_type: image.image_type ?? "other",
        is_primary_candidate: Boolean(image.is_primary_candidate),
        status: "pending",
        notes: image.notes ?? null,
      })),
    );
    if (imageError) {
      console.error("[research] image candidates insert failed:", imageError.message);
    }
  }

  return itemId;
}

/** Run provider and persist proposals for admin review. Never publishes. */
export async function executeResearchJob(jobId: string): Promise<ResearchJob | null> {
  const job = await getResearchJob(jobId);
  if (!job) return null;

  await updateResearchJob(jobId, {
    status: "running",
    progress_pct: 10,
    progress_message: "Starter research…",
  });

  try {
    const result = await runResearchProvider(job.provider_key, {
      brandId: job.brand_id,
      brandName: job.brand_name,
      modelQuery: job.model_query,
      sourceName: job.source_name,
      sourceUrl: job.source_url,
      rawInput: job.raw_input,
      filename: job.filename,
      options: job.options,
    });

    if (result.blocked && result.models.length === 0) {
      // Soft handoff — keep the job and switch to manual research.
      return switchResearchJobToManual({
        jobId,
        reason:
          result.progressMessage ||
          "Produsenten blokkerte automatisk tilgang.",
        originalProvider: job.provider_key,
      });
    }

    if (result.errors.length && result.models.length === 0) {
      await updateResearchJob(jobId, {
        status: "failed",
        error_message: result.errors.slice(0, 3).join(" "),
        progress_pct: 100,
        progress_message: "Feilet",
        completed_at: new Date().toISOString(),
      });
      return getResearchJob(jobId);
    }

    await updateResearchJob(jobId, {
      progress_pct: 60,
      progress_message: `Fant ${result.models.length} modell(er) — lagrer forslag…`,
    });

    const supabase = createAdminClient();
    const slugs = result.models.map((model) => model.slug);
    const existingBySlug = new Map<string, string>();
    if (slugs.length) {
      const { data } = await supabase.from("cars").select("id, slug").in("slug", slugs);
      for (const row of data ?? []) {
        existingBySlug.set(row.slug as string, row.id as string);
      }
    }

    const summary = emptySummary();
    summary.modelsFound = result.models.length;
    summary.warnings = result.warnings.length;

    for (let i = 0; i < result.models.length; i += 1) {
      const proposal = result.models[i];
      summary.fieldsFound += proposal.fields.length;
      summary.conflicts += proposal.conflicts.length;
      summary.missingFields += proposal.missing_fields.length;
      summary.imageCandidates += proposal.images.length;
      summary.warnings += proposal.warnings.length;

      await persistProposal(
        jobId,
        proposal,
        i,
        existingBySlug.get(proposal.slug) ?? null,
      );
    }

    await updateResearchJob(jobId, {
      status: "needs_review",
      summary,
      progress_pct: 100,
      progress_message: "Klar for gjennomgang",
      completed_at: new Date().toISOString(),
      error_message: result.errors.length ? result.errors.slice(0, 3).join(" ") : null,
    });

    return getResearchJob(jobId);
  } catch (error) {
    console.error("[research] executeResearchJob exception:", error);
    await updateResearchJob(jobId, {
      status: "failed",
      error_message: "Uventet feil under research.",
      progress_pct: 100,
      progress_message: "Feilet",
      completed_at: new Date().toISOString(),
    });
    return getResearchJob(jobId);
  }
}
