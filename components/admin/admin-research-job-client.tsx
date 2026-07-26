"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminResearchManualContinue from "@/components/admin/admin-research-manual-continue";
import AdminResearchReviewWorkspace from "@/components/admin/admin-research-review-workspace";
import {
  isResearchJobAwaitingManual,
  type ResearchFieldCandidate,
  type ResearchImageCandidate,
  type ResearchItem,
  type ResearchJob,
} from "@/lib/admin/research/types";

type Detail = {
  item: ResearchItem;
  fields: ResearchFieldCandidate[];
  images: ResearchImageCandidate[];
};

type AdminResearchJobClientProps = {
  job: ResearchJob;
  details: Detail[];
};

export default function AdminResearchJobClient({
  job,
  details,
}: AdminResearchJobClientProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summary = job.summary as {
    modelsFound?: number;
    fieldsFound?: number;
    conflicts?: number;
    warnings?: number;
    imageCandidates?: number;
  };

  const awaitingManual = isResearchJobAwaitingManual(job);
  const reviewReady = !awaitingManual && details.length > 0;

  return (
    <div className="adminImportLayout">
      <ol className="adminResearchSteps" aria-label="Research-steg">
        <li className={awaitingManual ? "is-current" : "is-done"}>
          <span>{awaitingManual ? "1" : "✓"}</span>{" "}
          {awaitingManual ? "Manuell research" : "Research kjørt"}
        </li>
        <li className={!awaitingManual && reviewReady ? "is-current" : ""}>
          <span>2</span> Forhåndsvis og godkjenn
        </li>
        <li>
          <span>3</span> Importer
        </li>
      </ol>

      {awaitingManual ? (
        <AdminResearchManualContinue job={job} />
      ) : (
        <div className="adminNotice" role="note">
          <strong>Research ≠ publisering.</strong> Import lagres som{" "}
          <code>needs_review</code> — aldri auto-publisert.
        </div>
      )}

      {message && (
        <p className="adminSuccess" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="authAlert authAlertError" role="alert">
          {error}
        </p>
      )}

      <details className="adminResearchJobMeta">
        <summary>
          Jobbhistorikk · {job.status} · {job.provider_key}
        </summary>
        <p className="adminHint">
          {summary.modelsFound ?? details.length} modeller ·{" "}
          {summary.fieldsFound ?? "—"} felter · {summary.conflicts ?? 0} konflikter
          · {summary.imageCandidates ?? 0} bilder
          {job.source_url ? (
            <>
              {" "}
              ·{" "}
              <a href={job.source_url} target="_blank" rel="noreferrer">
                {job.source_name || "Kilde"}
              </a>
            </>
          ) : null}
        </p>
        {job.progress_message ? (
          <p className="adminHint">{job.progress_message}</p>
        ) : null}
        <div className="adminQuickActions">
          <Link href="/admin/import/research" className="button ghost buttonSm">
            Ny research
          </Link>
        </div>
      </details>

      {!awaitingManual && details.length === 0 && (
        <p className="adminEmpty">Ingen modeller funnet i denne jobben.</p>
      )}

      {!awaitingManual && details.length > 0 && (
        <AdminResearchReviewWorkspace
          job={job}
          details={details}
          onMessage={setMessage}
          onError={setError}
          onRefresh={() => router.refresh()}
        />
      )}
    </div>
  );
}
