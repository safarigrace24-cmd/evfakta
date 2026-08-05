"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveAdminCarAction,
  markAdminCarNeedsReviewAction,
  publishAdminCarAction,
  setAdminCarPublishedAction,
} from "@/app/admin/actions";
import { computeEditorialCompletion } from "@/lib/admin/editorial-completion";
import { buildProductionSummary } from "@/lib/admin/editor-navigation";
import type { CarImageRow } from "@/lib/admin/car-image-types";
import {
  IMPORT_STATUS_LABELS,
  type AdminCar,
  type ImportStatus,
} from "@/lib/admin/types";
import type { AdminCarVariant } from "@/lib/admin/variant-types";

type AdminCarEditorHeaderProps = {
  car: AdminCar;
  images: CarImageRow[];
  variants: AdminCarVariant[];
};

export default function AdminCarEditorHeader({
  car,
  images,
  variants,
}: AdminCarEditorHeaderProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const completion = computeEditorialCompletion({ car, images, variants });
  const importStatus = (car.import_status ?? "draft") as ImportStatus;
  const summary = buildProductionSummary({
    percent: completion.percent,
    canPublish: completion.canPublish,
    sections: completion.sections,
    publishIssueCodes: completion.publishIssues.map((issue) => issue.code),
  });

  const publishBlockedReasons = completion.publishIssues.map(
    (issue) => issue.message,
  );
  const publishBlockedTitle =
    publishBlockedReasons.length > 0
      ? `Publishing blocked:\n${publishBlockedReasons.map((reason) => `• ${reason}`).join("\n")}`
      : undefined;

  function runAction(
    action: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>,
  ) {
    if (isPending) return;
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <header className="adminEditorHeader" aria-label="Editorial status">
      <div className="adminEditorHeaderStats adminEditorProductionSummary">
        <div className="adminEditorStat">
          <span>Completion</span>
          <strong>{summary.completionPercent}%</strong>
        </div>
        {summary.flags.map((flag) => (
          <div key={flag.id} className="adminEditorStat">
            <span>{flag.label}</span>
            <strong className={flag.ok ? "is-ready" : "is-blocked"}>
              {flag.ok ? "✓" : "—"}
            </strong>
          </div>
        ))}
        <div className="adminEditorStat">
          <span>Status</span>
          <strong>{IMPORT_STATUS_LABELS[importStatus]}</strong>
        </div>
        <div className="adminEditorStat">
          <span>Published</span>
          <strong>{car.is_published ? "Yes" : "No"}</strong>
        </div>
      </div>

      <div className="adminEditorHeaderActions">
        <button
          type="button"
          className="button secondary buttonSm"
          disabled={isPending || importStatus === "needs_review"}
          onClick={() => runAction(() => markAdminCarNeedsReviewAction(car.id))}
        >
          Needs Review
        </button>
        <button
          type="button"
          className="button secondary buttonSm"
          disabled={isPending || importStatus === "approved"}
          onClick={() => runAction(() => approveAdminCarAction(car.id))}
        >
          Approved
        </button>
        {car.is_published ? (
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAction(() => setAdminCarPublishedAction(car.id, false))}
          >
            Unpublish
          </button>
        ) : (
          <button
            type="button"
            className="button primary buttonSm"
            disabled={isPending || !completion.canPublish}
            title={
              completion.canPublish
                ? "Publish this car when ready"
                : publishBlockedTitle
            }
            onClick={() => runAction(() => publishAdminCarAction(car.id))}
          >
            Publish
          </button>
        )}
      </div>

      {!completion.canPublish && !car.is_published ? (
        <p className="adminHint adminPublishBlockHint" title={publishBlockedTitle}>
          Publish disabled — hover the Publish button for exact blockers (
          {completion.publishIssues.length}).
        </p>
      ) : null}

      {(message || error) && (
        <div className="adminEditorHeaderFeedback">
          {message && (
            <p className="authAlert authAlertSuccess" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="authAlert authAlertError" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </header>
  );
}
