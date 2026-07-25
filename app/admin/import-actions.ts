"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import { applyImportPreview, fetchExistingCarsBySlugs } from "@/lib/admin/import/apply";
import {
  createImportJob,
  getImportJob,
  insertImportJobItems,
  updateImportJob,
} from "@/lib/admin/import/jobs";
import { detectImportFormat, parseImportContent } from "@/lib/admin/import/parse-json";
import { buildImportPreview } from "@/lib/admin/import/preview";
import {
  FUTURE_IMPORT_CONNECTORS,
  IMPORT_MESSAGES,
  type ImportApplyOptions,
  type ImportMethod,
  type PreviewRow,
  type ImportReportSummary,
} from "@/lib/admin/import/types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type ImportActionResult =
  | {
      ok: true;
      message: string;
      jobId?: string;
      preview?: PreviewRow[];
      summary?: ImportReportSummary;
      parseWarnings?: string[];
      parseErrors?: string[];
    }
  | { ok: false; error: string };

async function assertAdmin() {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false as const, error: IMPORT_MESSAGES.unauthorized, user: null };
  }
  return { ok: true as const, user };
}

function dbReady() {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function revalidateImportPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/import");
  revalidatePath("/admin/biler");
  revalidatePath("/modeller");
}

export async function previewImportAction(input: {
  filename: string;
  content: string;
  sourceName?: string;
  sourceUrl?: string;
  updateExisting?: boolean;
  skipUnchanged?: boolean;
  imageMode?: "skip" | "replace";
}): Promise<ImportActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!dbReady()) return { ok: false, error: IMPORT_MESSAGES.unavailable };

  const content = String(input.content ?? "");
  if (!content.trim()) return { ok: false, error: IMPORT_MESSAGES.emptyFile };

  const format = detectImportFormat(input.filename || "", content);
  if (!format) return { ok: false, error: IMPORT_MESSAGES.invalidFormat };

  const parsed = parseImportContent(content, format);
  if (parsed.errors.length > 0 && parsed.rows.length === 0) {
    return {
      ok: false,
      error: parsed.errors.slice(0, 5).join(" "),
    };
  }

  const options: ImportApplyOptions = {
    sourceName: input.sourceName || null,
    sourceUrl: input.sourceUrl || null,
    updateExisting: input.updateExisting !== false,
    skipUnchanged: input.skipUnchanged !== false,
    imageMode: input.imageMode ?? "skip",
    forceImportStatus: "needs_review",
  };

  const existing = await fetchExistingCarsBySlugs(parsed.rows.map((row) => row.slug));
  const { preview, summary } = buildImportPreview(parsed.rows, existing, options);
  summary.warnings = parsed.warnings.length;
  summary.errors += parsed.errors.length;

  const job = await createImportJob({
    method: format as ImportMethod,
    filename: input.filename,
    sourceName: options.sourceName,
    sourceUrl: options.sourceUrl,
    createdBy: auth.user?.id ?? null,
    options: {
      ...options,
      rowCount: parsed.rows.length,
      previewSummary: summary,
    },
  });

  if (!job) {
    return { ok: false, error: IMPORT_MESSAGES.unavailable };
  }

  // Persist preview rows lightly for report continuity
  await insertImportJobItems(
    preview.slice(0, 500).map((row) => ({
      job_id: job.id,
      row_number: row.rowNumber,
      slug: row.slug,
      car_id: row.existingId,
      action: row.decision === "error" ? "error" : row.decision,
      message: row.messages.join(" "),
      payload: {
        decision: row.decision,
        changedFields: row.changedFields,
        stage: "preview",
      },
    })),
  );

  return {
    ok: true,
    message: IMPORT_MESSAGES.previewSuccess,
    jobId: job.id,
    preview,
    summary,
    parseWarnings: parsed.warnings,
    parseErrors: parsed.errors,
  };
}

export async function applyImportAction(input: {
  jobId: string;
  filename: string;
  content: string;
  sourceName?: string;
  sourceUrl?: string;
  updateExisting?: boolean;
  skipUnchanged?: boolean;
  imageMode?: "skip" | "replace";
}): Promise<ImportActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: IMPORT_MESSAGES.unavailable };

  const job = await getImportJob(input.jobId);
  if (!job) return { ok: false, error: IMPORT_MESSAGES.jobNotFound };

  const content = String(input.content ?? "");
  const format = detectImportFormat(input.filename || job.filename || "", content);
  if (!format) return { ok: false, error: IMPORT_MESSAGES.invalidFormat };

  const parsed = parseImportContent(content, format);
  if (parsed.rows.length === 0) {
    await updateImportJob(job.id, {
      status: "failed",
      error_message: parsed.errors[0] || "Ingen rader å importere.",
      completed_at: new Date().toISOString(),
    });
    return { ok: false, error: parsed.errors[0] || "Ingen rader å importere." };
  }

  const options: ImportApplyOptions = {
    sourceName: input.sourceName || job.source_name,
    sourceUrl: input.sourceUrl || job.source_url,
    updateExisting: input.updateExisting !== false,
    skipUnchanged: input.skipUnchanged !== false,
    imageMode: input.imageMode ?? "skip",
    forceImportStatus: "needs_review",
  };

  await updateImportJob(job.id, { status: "running", error_message: null });

  try {
    // Clear previous preview items before writing apply results
    const supabase = createAdminClient();
    await supabase.from("import_job_items").delete().eq("job_id", job.id);

    const { summary, items } = await applyImportPreview({
      jobId: job.id,
      rows: parsed.rows.map((row) => ({
        ...row,
        source_name: row.source_name || options.sourceName || null,
        source_url: row.source_url || options.sourceUrl || null,
      })),
      parseWarnings: parsed.warnings,
      options,
    });

    await insertImportJobItems(
      items.map((item) => ({
        job_id: job.id,
        row_number: item.row_number,
        slug: item.slug || null,
        car_id: item.car_id,
        action: item.action,
        message: item.message,
        payload: item.payload,
      })),
    );

    await updateImportJob(job.id, {
      status: summary.errors > 0 ? "completed" : "completed",
      summary,
      completed_at: new Date().toISOString(),
      error_message: summary.errors > 0 ? `${summary.errors} feil under import` : null,
      options: { ...options, parseErrors: parsed.errors },
    });

    revalidateImportPaths();

    return {
      ok: true,
      message: summary.errors > 0 ? IMPORT_MESSAGES.applyPartial : IMPORT_MESSAGES.applySuccess,
      jobId: job.id,
      summary,
      parseWarnings: parsed.warnings,
      parseErrors: parsed.errors,
    };
  } catch (error) {
    console.error("[import] applyImportAction exception:", error);
    await updateImportJob(job.id, {
      status: "failed",
      error_message: "Uventet feil under import.",
      completed_at: new Date().toISOString(),
    });
    return { ok: false, error: IMPORT_MESSAGES.unavailable };
  }
}

export async function listFutureConnectorsAction() {
  return FUTURE_IMPORT_CONNECTORS;
}
