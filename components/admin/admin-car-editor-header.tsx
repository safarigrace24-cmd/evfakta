"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveAdminCarAction,
  markAdminCarNeedsReviewAction,
  publishAdminCarAction,
  setAdminCarPublishedAction,
} from "@/app/admin/actions";
import {
  computeEditorialCompletion,
} from "@/lib/admin/editorial-completion";
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
      <div className="adminEditorHeaderStats">
        <div className="adminEditorStat">
          <span>Completion</span>
          <strong>{completion.percent}%</strong>
        </div>
        <div className="adminEditorStat">
          <span>Publish readiness</span>
          <strong className={completion.canPublish ? "is-ready" : "is-blocked"}>
            {completion.canPublish ? "Ready" : "Blocked"}
          </strong>
        </div>
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
            disabled={isPending}
            onClick={() => runAction(() => publishAdminCarAction(car.id))}
          >
            Publish
          </button>
        )}
      </div>

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
