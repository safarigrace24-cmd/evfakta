import "server-only";

import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";
import type {
  ImportJob,
  ImportJobItem,
  ImportMethod,
  ImportReportSummary,
} from "@/lib/admin/import/types";
import { emptyImportSummary } from "@/lib/admin/import/preview";

export type ImportDashboardStats = {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  recentImported: number;
  recentUpdated: number;
  drafts: number;
  needsReview: number;
  approved: number;
  published: number;
};

function dbReady() {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function createImportJob(input: {
  method: ImportMethod;
  filename?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  createdBy?: string | null;
  options?: Record<string, unknown>;
}): Promise<ImportJob | null> {
  if (!dbReady()) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("import_jobs")
      .insert({
        method: input.method,
        filename: input.filename ?? null,
        source_name: input.sourceName ?? null,
        source_url: input.sourceUrl ?? null,
        created_by: input.createdBy ?? null,
        status: "preview",
        options: input.options ?? {},
        summary: emptyImportSummary(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("[import] createImportJob failed:", error.message);
      return null;
    }
    return data as ImportJob;
  } catch (error) {
    console.error("[import] createImportJob exception:", error);
    return null;
  }
}

export async function updateImportJob(
  id: string,
  patch: Partial<{
    status: ImportJob["status"];
    summary: ImportReportSummary | Record<string, unknown>;
    error_message: string | null;
    completed_at: string | null;
    options: Record<string, unknown>;
  }>,
): Promise<boolean> {
  if (!dbReady()) return false;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("import_jobs").update(patch).eq("id", id);
    if (error) {
      console.error("[import] updateImportJob failed:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[import] updateImportJob exception:", error);
    return false;
  }
}

export async function insertImportJobItems(
  items: Array<{
    job_id: string;
    row_number: number | null;
    slug: string | null;
    car_id: string | null;
    action: ImportJobItem["action"];
    message: string | null;
    payload?: Record<string, unknown>;
  }>,
): Promise<void> {
  if (!dbReady() || items.length === 0) return;

  const supabase = createAdminClient();
  const chunkSize = 100;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize).map((item) => ({
      ...item,
      payload: item.payload ?? {},
    }));
    const { error } = await supabase.from("import_job_items").insert(chunk);
    if (error) {
      console.error("[import] insertImportJobItems failed:", error.message);
    }
  }
}

export async function listImportJobs(limit = 50): Promise<ImportJob[]> {
  if (!dbReady()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("import_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[import] listImportJobs failed:", error.message);
      return [];
    }
    return (data ?? []) as ImportJob[];
  } catch (error) {
    console.error("[import] listImportJobs exception:", error);
    return [];
  }
}

export async function getImportJob(id: string): Promise<ImportJob | null> {
  if (!id || !dbReady()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("import_jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[import] getImportJob failed:", error.message);
      return null;
    }
    return (data as ImportJob | null) ?? null;
  } catch (error) {
    console.error("[import] getImportJob exception:", error);
    return null;
  }
}

export async function listImportJobItems(jobId: string): Promise<ImportJobItem[]> {
  if (!jobId || !dbReady()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("import_job_items")
      .select("*")
      .eq("job_id", jobId)
      .order("row_number", { ascending: true })
      .limit(2000);

    if (error) {
      console.error("[import] listImportJobItems failed:", error.message);
      return [];
    }
    return (data ?? []) as ImportJobItem[];
  } catch (error) {
    console.error("[import] listImportJobItems exception:", error);
    return [];
  }
}

export async function getImportDashboardStats(
  carStats: {
    drafts: number;
    needsReview: number;
    approved: number;
    published: number;
  },
): Promise<ImportDashboardStats> {
  const jobs = await listImportJobs(200);
  const completed = jobs.filter((job) => job.status === "completed");
  const failed = jobs.filter((job) => job.status === "failed");

  let recentImported = 0;
  let recentUpdated = 0;
  for (const job of completed.slice(0, 20)) {
    const summary = job.summary as ImportReportSummary;
    recentImported += Number(summary.imported ?? 0);
    recentUpdated += Number(summary.updated ?? 0);
  }

  return {
    totalJobs: jobs.length,
    completedJobs: completed.length,
    failedJobs: failed.length,
    recentImported,
    recentUpdated,
    drafts: carStats.drafts,
    needsReview: carStats.needsReview,
    approved: carStats.approved,
    published: carStats.published,
  };
}
