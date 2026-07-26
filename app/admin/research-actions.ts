"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import { applyApprovedResearchItems } from "@/lib/admin/research/apply";
import {
  clearResearchJobItems,
  createResearchJob,
  executeResearchJob,
  getResearchJob,
  listResearchFieldCandidates,
  listResearchImageCandidates,
  listResearchItems,
  listResearchJobs,
  updateResearchJob,
} from "@/lib/admin/research/jobs";
import {
  extractTextFromPdfBase64,
  inferManualSourceMode,
  resolveManualProviderKey,
} from "@/lib/admin/research/manual-input";
import { RESEARCH_PROVIDERS } from "@/lib/admin/research/providers";
import {
  isResearchJobAwaitingManual,
  RESEARCH_MESSAGES,
  type ResearchItemDecision,
  type ResearchProviderKey,
  type ResearchSourceMode,
} from "@/lib/admin/research/types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type ResearchActionResult =
  | {
      ok: true;
      message: string;
      jobId?: string;
      awaitingManual?: boolean;
    }
  | { ok: false; error: string };

async function assertAdmin() {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false as const, error: RESEARCH_MESSAGES.unauthorized, user: null };
  }
  return { ok: true as const, user };
}

function dbReady() {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function revalidateResearchPaths(jobId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/import");
  revalidatePath("/admin/import/research");
  revalidatePath("/admin/biler");
  if (jobId) revalidatePath(`/admin/import/research/${jobId}`);
}

export async function listResearchProvidersAction() {
  return RESEARCH_PROVIDERS.map((provider) => ({
    key: provider.key,
    label: provider.label,
    description: provider.description,
    supportsLive: provider.supportsLive,
  }));
}

export async function startResearchJobAction(input: {
  brandId?: string;
  brandName?: string;
  modelQuery?: string;
  providerKey: ResearchProviderKey;
  sourceMode: ResearchSourceMode;
  sourceName?: string;
  sourceUrl?: string;
  filename?: string;
  rawInput?: string;
}): Promise<ResearchActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: RESEARCH_MESSAGES.unavailable };

  const hasInput =
    Boolean(input.rawInput?.trim()) || Boolean(input.sourceUrl?.trim());
  if (!hasInput && input.providerKey !== "stub") {
    return { ok: false, error: RESEARCH_MESSAGES.emptyInput };
  }
  if (
    input.providerKey === "manufacturer_http" &&
    !input.brandName?.trim() &&
    !input.brandId
  ) {
    return { ok: false, error: "Velg et merke før research startes." };
  }

  const job = await createResearchJob({
    createdBy: auth.user?.id ?? null,
    brandId: input.brandId || null,
    brandName: input.brandName || null,
    modelQuery: input.modelQuery || null,
    providerKey: input.providerKey,
    sourceMode: input.sourceMode,
    sourceName: input.sourceName || null,
    sourceUrl: input.sourceUrl || null,
    filename: input.filename || null,
    rawInput: input.rawInput || null,
  });

  if (!job) return { ok: false, error: RESEARCH_MESSAGES.unavailable };

  // Execute inline (server action). For long jobs this can be moved to a queue later.
  const finished = await executeResearchJob(job.id);
  revalidateResearchPaths(job.id);

  if (!finished) return { ok: false, error: RESEARCH_MESSAGES.genericError };

  // Blocked live fetch → soft handoff to manual mode (not an error).
  if (finished.status === "awaiting_manual" || isResearchJobAwaitingManual(finished)) {
    return {
      ok: true,
      message: RESEARCH_MESSAGES.switchedToManual,
      jobId: job.id,
      awaitingManual: true,
    };
  }

  if (finished.status === "failed") {
    return {
      ok: false,
      error: finished.error_message || RESEARCH_MESSAGES.genericError,
    };
  }

  return {
    ok: true,
    message: RESEARCH_MESSAGES.createSuccess,
    jobId: job.id,
  };
}

/**
 * Continue a blocked (or awaiting_manual) research job with pasted/uploaded source.
 * Keeps the same job id and review workflow.
 */
export async function continueResearchJobManualAction(input: {
  jobId: string;
  rawInput?: string;
  filename?: string;
  modelQuery?: string;
  /** Base64-encoded PDF bytes when uploading a PDF. */
  pdfBase64?: string;
}): Promise<ResearchActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: RESEARCH_MESSAGES.unavailable };

  const job = await getResearchJob(input.jobId);
  if (!job) return { ok: false, error: RESEARCH_MESSAGES.jobNotFound };

  const canContinue =
    isResearchJobAwaitingManual(job) ||
    job.status === "failed" ||
    job.status === "awaiting_manual";
  if (!canContinue) {
    return {
      ok: false,
      error: "Denne jobben venter ikke på manuell kilde.",
    };
  }

  let rawInput = (input.rawInput ?? "").trim();
  let filename = input.filename?.trim() || null;

  if (input.pdfBase64?.trim()) {
    const extracted = await extractTextFromPdfBase64(input.pdfBase64.trim());
    if (!extracted.text) {
      return {
        ok: false,
        error:
          extracted.warning ||
          "Kunne ikke lese PDF. Lim inn teksten manuelt i stedet.",
      };
    }
    rawInput = extracted.text;
    filename = filename || "upload.pdf";
  }

  if (!rawInput) {
    return {
      ok: false,
      error: "Lim inn tekst, eller last opp PDF, JSON eller CSV for å fortsette.",
    };
  }

  const providerKey = resolveManualProviderKey({ rawInput, filename });
  const sourceMode: ResearchSourceMode = inferManualSourceMode({
    rawInput,
    filename,
  });

  await clearResearchJobItems(input.jobId);
  await updateResearchJob(input.jobId, {
    status: "queued",
    provider_key: providerKey,
    source_mode: sourceMode,
    raw_input: rawInput,
    filename,
    model_query: input.modelQuery?.trim() || job.model_query,
    error_message: null,
    progress_pct: 0,
    progress_message: "Manuell kilde mottatt — kjører research…",
    completed_at: null,
    options: {
      ...(typeof job.options === "object" && job.options ? job.options : {}),
      live_blocked: Boolean(
        (job.options as { live_blocked?: boolean } | null)?.live_blocked,
      ),
      continued_manually: true,
      continued_at: new Date().toISOString(),
    },
  });

  const finished = await executeResearchJob(input.jobId);
  revalidateResearchPaths(input.jobId);

  if (!finished) return { ok: false, error: RESEARCH_MESSAGES.genericError };
  if (finished.status === "failed") {
    return {
      ok: false,
      error: finished.error_message || RESEARCH_MESSAGES.genericError,
    };
  }

  return {
    ok: true,
    message: RESEARCH_MESSAGES.continueSuccess,
    jobId: input.jobId,
  };
}

export async function setResearchItemDecisionAction(input: {
  itemId: string;
  decision: ResearchItemDecision;
}): Promise<ResearchActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: RESEARCH_MESSAGES.unavailable };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("research_items")
    .update({ decision: input.decision })
    .eq("id", input.itemId)
    .select("job_id")
    .single();

  if (error || !data) return { ok: false, error: RESEARCH_MESSAGES.genericError };
  revalidateResearchPaths(data.job_id as string);
  return { ok: true, message: "Beslutning lagret." };
}

/** UI-only: mark a missing field as not available (removes from checklist). */
export async function markResearchMissingFieldAction(input: {
  itemId: string;
  fieldKey: string;
  action: "not_available";
}): Promise<ResearchActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: RESEARCH_MESSAGES.unavailable };

  const supabase = createAdminClient();
  const { data: item, error: loadError } = await supabase
    .from("research_items")
    .select("job_id, missing_fields, warnings")
    .eq("id", input.itemId)
    .maybeSingle();

  if (loadError || !item) return { ok: false, error: RESEARCH_MESSAGES.genericError };

  const missing = Array.isArray(item.missing_fields)
    ? (item.missing_fields as string[]).filter((key) => key !== input.fieldKey)
    : [];
  const warnings = Array.isArray(item.warnings)
    ? [...(item.warnings as string[])]
    : [];
  const note = `${input.fieldKey}: marked not available by editor`;
  if (!warnings.includes(note)) warnings.push(note);

  const { error } = await supabase
    .from("research_items")
    .update({ missing_fields: missing, warnings })
    .eq("id", input.itemId);

  if (error) return { ok: false, error: RESEARCH_MESSAGES.genericError };
  revalidateResearchPaths(item.job_id as string);
  return { ok: true, message: "Felt merket som ikke tilgjengelig." };
}

export async function setResearchFieldStatusAction(input: {
  fieldId: string;
  status: "approved" | "rejected" | "pending";
}): Promise<ResearchActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: RESEARCH_MESSAGES.unavailable };

  const supabase = createAdminClient();
  const { data: field, error } = await supabase
    .from("research_field_candidates")
    .update({ status: input.status })
    .eq("id", input.fieldId)
    .select("item_id")
    .single();

  if (error || !field) return { ok: false, error: RESEARCH_MESSAGES.genericError };

  const { data: item } = await supabase
    .from("research_items")
    .select("job_id")
    .eq("id", field.item_id)
    .maybeSingle();

  revalidateResearchPaths(item?.job_id as string | undefined);
  return { ok: true, message: "Feltstatus oppdatert." };
}

/** UI edit / conflict resolution — updates candidate row only, not pipeline logic. */
export async function updateResearchFieldCandidateAction(input: {
  fieldId: string;
  proposedValue?: unknown;
  status?: "approved" | "rejected" | "pending";
  notes?: string | null;
}): Promise<ResearchActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: RESEARCH_MESSAGES.unavailable };

  const patch: Record<string, unknown> = {};
  if ("proposedValue" in input) patch.proposed_value = input.proposedValue;
  if (input.status) patch.status = input.status;
  if ("notes" in input) patch.notes = input.notes ?? null;
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Ingen endringer." };
  }

  const supabase = createAdminClient();
  const { data: field, error } = await supabase
    .from("research_field_candidates")
    .update(patch)
    .eq("id", input.fieldId)
    .select("item_id")
    .single();

  if (error || !field) return { ok: false, error: RESEARCH_MESSAGES.genericError };

  const { data: item } = await supabase
    .from("research_items")
    .select("job_id")
    .eq("id", field.item_id)
    .maybeSingle();

  revalidateResearchPaths(item?.job_id as string | undefined);
  return { ok: true, message: "Felt oppdatert." };
}

export async function bulkSetResearchFieldStatusAction(input: {
  updates: Array<{ fieldId: string; status: "approved" | "rejected" | "pending" }>;
}): Promise<ResearchActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: RESEARCH_MESSAGES.unavailable };
  if (!input.updates.length) {
    return { ok: false, error: "Ingen felter valgt." };
  }

  const supabase = createAdminClient();
  let jobId: string | undefined;
  let updated = 0;

  for (const row of input.updates) {
    const { data: field, error } = await supabase
      .from("research_field_candidates")
      .update({ status: row.status })
      .eq("id", row.fieldId)
      .select("item_id")
      .single();
    if (error || !field) continue;
    updated += 1;
    if (!jobId) {
      const { data: item } = await supabase
        .from("research_items")
        .select("job_id")
        .eq("id", field.item_id)
        .maybeSingle();
      jobId = item?.job_id as string | undefined;
    }
  }

  if (updated === 0) return { ok: false, error: RESEARCH_MESSAGES.genericError };
  revalidateResearchPaths(jobId);
  return { ok: true, message: `Oppdatert ${updated} felt.` };
}

export async function setResearchImageStatusAction(input: {
  imageId: string;
  status: "approved" | "rejected" | "pending";
}): Promise<ResearchActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: RESEARCH_MESSAGES.unavailable };

  const supabase = createAdminClient();
  const { data: image, error } = await supabase
    .from("research_image_candidates")
    .update({ status: input.status })
    .eq("id", input.imageId)
    .select("item_id")
    .single();

  if (error || !image) return { ok: false, error: RESEARCH_MESSAGES.genericError };

  const { data: item } = await supabase
    .from("research_items")
    .select("job_id")
    .eq("id", image.item_id)
    .maybeSingle();

  revalidateResearchPaths(item?.job_id as string | undefined);
  return { ok: true, message: "Bildestatus oppdatert." };
}

export async function applyResearchJobAction(input: {
  jobId: string;
  itemIds?: string[];
}): Promise<ResearchActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: RESEARCH_MESSAGES.unavailable };

  const job = await getResearchJob(input.jobId);
  if (!job) return { ok: false, error: RESEARCH_MESSAGES.jobNotFound };

  await updateResearchJob(input.jobId, {
    status: "applying",
    progress_message: "Anvender godkjente data…",
  });

  const result = await applyApprovedResearchItems({
    jobId: input.jobId,
    itemIds: input.itemIds,
  });

  if (result.applied === 0) {
    await updateResearchJob(input.jobId, {
      status: "needs_review",
      progress_message: "Ingen godkjente elementer",
      error_message: result.errors[0] || RESEARCH_MESSAGES.noApproved,
    });
    return { ok: false, error: result.errors[0] || RESEARCH_MESSAGES.noApproved };
  }

  await updateResearchJob(input.jobId, {
    status: "completed",
    summary: {
      ...(typeof job.summary === "object" ? job.summary : {}),
      ...result.summary,
    },
    progress_message: `Anvendt ${result.applied} modell(er) som needs_review`,
    progress_pct: 100,
    completed_at: new Date().toISOString(),
    error_message: result.errors.length ? result.errors.join(" ") : null,
  });

  revalidateResearchPaths(input.jobId);
  return {
    ok: true,
    message: `${RESEARCH_MESSAGES.applySuccess} (${result.applied})`,
    jobId: input.jobId,
  };
}

export async function getResearchJobBundleAction(jobId: string) {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const job = await getResearchJob(jobId);
  if (!job) return { ok: false as const, error: RESEARCH_MESSAGES.jobNotFound };

  const items = await listResearchItems(jobId);
  const details = [];
  for (const item of items) {
    details.push({
      item,
      fields: await listResearchFieldCandidates(item.id),
      images: await listResearchImageCandidates(item.id),
    });
  }

  return { ok: true as const, job, details };
}

export async function listResearchJobsAction(limit = 30) {
  const auth = await assertAdmin();
  if (!auth.ok) return [];
  return listResearchJobs(limit);
}
