/**
 * Automatic image-role replacement when a candidate is permanently failed.
 *
 * Flow:
 * 1. Failed candidate marked Download Failed / HTTP 410 / no local copy
 * 2. Queue replacement research for that image role
 * 3. Scrape official source page for alternate downloadable image URLs
 * 4. Download immediately → EVFAKTA Storage review WebP
 * 5. Insert new pending candidate; mark failed as superseded (history only)
 *
 * Never auto-approves, never chooses Hero, never publishes.
 */

import "server-only";

import { isRejectedImageSourceUrl } from "@/lib/admin/image-production";
import {
  hasReplacementExhausted,
  hasReplacementQueued,
  hasSupersededMarker,
  imageCandidateRoleKey,
  isPermanentlyFailedImageCandidate,
  isUsableImageReviewCandidate,
  withReplacementExhaustedNotes,
  withReplacementQueuedNotes,
  withSupersededNotes,
} from "@/lib/admin/image-review-preview";
import {
  ensureCandidateReviewCopy,
  fetchRemoteImageBuffer,
} from "@/lib/admin/image-review-storage";
import {
  extractOfficialImageUrlsFromHtml,
  scoreUrlForImageRole,
} from "@/lib/admin/image-role-replacement-sources";
import type { ResearchImageCandidate } from "@/lib/admin/research/types";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_CANDIDATE_URLS = 12;
const MAX_DOWNLOAD_ATTEMPTS = 6;

export { extractOfficialImageUrlsFromHtml } from "@/lib/admin/image-role-replacement-sources";

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.trim().toLowerCase();
  }
}

async function fetchOfficialPageHtml(
  url: string,
): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EVFAKTAImageReview/1.0; +https://www.evfakta.no)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "nb-NO,nb;q=0.9,en;q=0.8",
      },
    });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !/html|text|xml/i.test(contentType)) {
      return { ok: false, error: "Not an HTML page" };
    }
    const html = await response.text();
    if (!html.trim()) return { ok: false, error: "Empty page" };
    return { ok: true, html };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }
}

async function updateCandidateNotes(
  id: string,
  notes: string,
): Promise<ResearchImageCandidate | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("research_image_candidates")
    .update({ notes })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return (data as ResearchImageCandidate) ?? null;
}

function hasUsableSiblingForRole(
  all: ResearchImageCandidate[],
  failed: ResearchImageCandidate,
): boolean {
  const role = imageCandidateRoleKey(failed);
  return all.some((candidate) => {
    if (candidate.id === failed.id) return false;
    if (!isUsableImageReviewCandidate(candidate)) return false;
    return imageCandidateRoleKey(candidate) === role;
  });
}

/**
 * Create a research job audit row for an image-role replacement,
 * then attempt to find + store a working pending candidate.
 */
export async function queueImageRoleReplacement(input: {
  failed: ResearchImageCandidate;
  brand: string;
  modelSlug: string;
  modelName?: string | null;
  carId?: string | null;
  allCandidates?: ResearchImageCandidate[];
}): Promise<{
  queued: boolean;
  replaced: boolean;
  exhausted: boolean;
  candidate: ResearchImageCandidate | null;
  jobId: string | null;
}> {
  const { failed, brand, modelSlug } = input;
  const role = imageCandidateRoleKey(failed);

  if (!failed.id) {
    return {
      queued: false,
      replaced: false,
      exhausted: false,
      candidate: null,
      jobId: null,
    };
  }

  if (!isPermanentlyFailedImageCandidate(failed)) {
    return {
      queued: false,
      replaced: false,
      exhausted: false,
      candidate: failed,
      jobId: null,
    };
  }

  if (hasReplacementExhausted(failed.notes)) {
    return {
      queued: false,
      replaced: false,
      exhausted: true,
      candidate: failed,
      jobId: null,
    };
  }

  const siblings = input.allCandidates ?? [failed];
  if (hasUsableSiblingForRole(siblings, failed)) {
    const superseded = await updateCandidateNotes(
      failed.id,
      withSupersededNotes(
        failed.notes,
        `replaced-by-existing-${role}`,
      ),
    );
    return {
      queued: false,
      replaced: true,
      exhausted: false,
      candidate: superseded,
      jobId: null,
    };
  }

  let working = failed;
  if (!hasReplacementQueued(failed.notes)) {
    working =
      (await updateCandidateNotes(
        failed.id,
        withReplacementQueuedNotes(failed.notes),
      )) ?? { ...failed, notes: withReplacementQueuedNotes(failed.notes) };
  }

  const jobModule = await import("@/lib/admin/research/jobs");
  const job = await jobModule.createResearchJob({
    brandName: brand,
    modelQuery: input.modelName || modelSlug,
    providerKey: "manufacturer_http",
    sourceMode: "live",
    sourceName: failed.source_name || `${brand} official`,
    sourceUrl: failed.source_url || null,
    options: {
      image_role_replacement: true,
      image_role: role,
      image_type: failed.image_type || "other",
      failed_candidate_id: failed.id,
      item_id: failed.item_id,
      car_id: input.carId ?? null,
      model_slug: modelSlug,
    },
  });

  if (job) {
    await jobModule.updateResearchJob(job.id, {
      status: "running",
      progress_pct: 20,
      progress_message: `Research ${role} replacement…`,
    });
  }

  const result = await runImageRoleReplacementResearch({
    failed: working,
    brand,
    modelSlug,
    role,
    knownCandidates: siblings,
  });

  if (job) {
    if (result.replaced && result.candidate) {
      await jobModule.updateResearchJob(job.id, {
        status: "completed",
        progress_pct: 100,
        progress_message: `Replacement ${role} stored (pending review)`,
        completed_at: new Date().toISOString(),
        summary: {
          modelsFound: 1,
          fieldsFound: 0,
          conflicts: 0,
          warnings: 0,
          missingFields: 0,
          imageCandidates: 1,
          applied: 0,
          rejected: 0,
          approved: 0,
        },
      });
    } else {
      await jobModule.updateResearchJob(job.id, {
        status: "completed",
        progress_pct: 100,
        progress_message: "No official image available yet.",
        completed_at: new Date().toISOString(),
        error_message: result.error || "No official replacement found",
      });
    }
  }

  return {
    queued: true,
    replaced: result.replaced,
    exhausted: result.exhausted,
    candidate: result.failedAfter,
    jobId: job?.id ?? null,
  };
}

async function runImageRoleReplacementResearch(input: {
  failed: ResearchImageCandidate;
  brand: string;
  modelSlug: string;
  role: string;
  knownCandidates: ResearchImageCandidate[];
}): Promise<{
  replaced: boolean;
  exhausted: boolean;
  candidate: ResearchImageCandidate | null;
  failedAfter: ResearchImageCandidate;
  error?: string;
}> {
  const { failed, brand, modelSlug, role } = input;
  const knownUrls = new Set(
    input.knownCandidates
      .map((row) => normalizeUrl(row.original_url))
      .filter(Boolean),
  );

  const sourcePage = failed.source_url?.trim() || "";
  let urls: string[] = [];

  if (sourcePage && !isRejectedImageSourceUrl(sourcePage)) {
    const page = await fetchOfficialPageHtml(sourcePage);
    if (page.ok) {
      urls = extractOfficialImageUrlsFromHtml(page.html, sourcePage);
    }
  }

  // Prefer role-matching URLs. For typed roles (front/side/rear/interior/hero),
  // require at least one path hint match — prevents dumping every page asset as "exterior".
  const typedRole = !["other", "exterior", ""].includes(role);
  urls = urls
    .filter((url) => normalizeUrl(url) !== normalizeUrl(failed.original_url))
    .filter((url) => !knownUrls.has(normalizeUrl(url)))
    .filter((url) => !typedRole || scoreUrlForImageRole(url, role) > 0)
    .sort(
      (a, b) => scoreUrlForImageRole(b, role) - scoreUrlForImageRole(a, role),
    )
    .slice(0, MAX_CANDIDATE_URLS);

  let attempts = 0;
  for (const originalUrl of urls) {
    if (attempts >= MAX_DOWNLOAD_ATTEMPTS) break;
    attempts += 1;

    const fetched = await fetchRemoteImageBuffer(originalUrl);
    if (!fetched.ok) continue;

    const supabase = createAdminClient();
    const { data: inserted, error: insertError } = await supabase
      .from("research_image_candidates")
      .insert({
        item_id: failed.item_id,
        original_url: originalUrl,
        source_name: failed.source_name,
        source_url: failed.source_url || sourcePage || null,
        license_note: failed.license_note,
        usage_terms: failed.usage_terms,
        alt_text: failed.alt_text,
        // Never auto-choose Hero — keep type only.
        image_type:
          role === "hero"
            ? failed.image_type || "front"
            : failed.image_type || role,
        is_primary_candidate: false,
        status: "pending",
        notes: `replacement-for:${failed.id} | role:${role} | auto-research`,
      })
      .select("*")
      .maybeSingle();

    if (insertError || !inserted) {
      console.error(
        "[image-role-replacement] insert failed:",
        insertError?.message,
      );
      continue;
    }

    const hydrated = await ensureCandidateReviewCopy({
      candidate: inserted as ResearchImageCandidate,
      brand,
      modelSlug,
    });

    if (!isUsableImageReviewCandidate(hydrated)) {
      // Keep the failed attempt as history too.
      await updateCandidateNotes(
        hydrated.id,
        withSupersededNotes(
          withReplacementExhaustedNotes(hydrated.notes),
          "replacement-download-failed",
        ),
      );
      continue;
    }

    const superseded = await updateCandidateNotes(
      failed.id,
      withSupersededNotes(
        failed.notes,
        `replaced-by:${hydrated.id}`,
      ),
    );

    return {
      replaced: true,
      exhausted: false,
      candidate: hydrated,
      failedAfter: superseded ?? failed,
    };
  }

  const exhausted =
    (await updateCandidateNotes(
      failed.id,
      withReplacementExhaustedNotes(failed.notes),
    )) ?? {
      ...failed,
      notes: withReplacementExhaustedNotes(failed.notes),
    };

  return {
    replaced: false,
    exhausted: true,
    candidate: null,
    failedAfter: exhausted,
    error: "No official image available yet.",
  };
}

/**
 * Process permanent failures for a car: queue replacement research per role.
 * Safe to call when opening Image Review — never auto-approves.
 */
export async function processFailedImageCandidateReplacements(input: {
  candidates: ResearchImageCandidate[];
  brand: string;
  modelSlug: string;
  modelName?: string | null;
  carId?: string | null;
}): Promise<ResearchImageCandidate[]> {
  const byId = new Map(
    input.candidates.map((candidate) => [candidate.id, candidate]),
  );
  const processedRoles = new Set<string>();

  for (const candidate of input.candidates) {
    if (!isPermanentlyFailedImageCandidate(candidate)) continue;
    if (hasSupersededMarker(candidate.notes)) continue;
    if (candidate.status !== "pending") continue;
    if (hasReplacementExhausted(candidate.notes)) continue;

    const role = imageCandidateRoleKey(candidate);
    if (processedRoles.has(role)) continue;
    if (hasUsableSiblingForRole([...byId.values()], candidate)) {
      if (!hasSupersededMarker(candidate.notes)) {
        const superseded = await updateCandidateNotes(
          candidate.id,
          withSupersededNotes(candidate.notes, `replaced-by-existing-${role}`),
        );
        if (superseded) byId.set(candidate.id, superseded);
      }
      processedRoles.add(role);
      continue;
    }

    processedRoles.add(role);
    const result = await queueImageRoleReplacement({
      failed: candidate,
      brand: input.brand,
      modelSlug: input.modelSlug,
      modelName: input.modelName,
      carId: input.carId,
      allCandidates: [...byId.values()],
    });

    if (result.candidate) {
      byId.set(result.candidate.id, result.candidate);
    }
    // Newly inserted usable candidates are not in byId yet — reload below if needed.
    if (result.replaced) {
      // Pull fresh rows for this item so the workspace sees the replacement.
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("research_image_candidates")
        .select("*")
        .eq("item_id", candidate.item_id)
        .order("created_at", { ascending: true });
      for (const row of (data ?? []) as ResearchImageCandidate[]) {
        byId.set(row.id, row);
      }
    }
  }

  return [...byId.values()];
}
