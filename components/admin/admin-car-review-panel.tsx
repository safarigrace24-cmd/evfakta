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
  IMPORT_STATUS_LABELS,
  type AdminCar,
  type ImportStatus,
} from "@/lib/admin/types";

type AdminCarReviewPanelProps = {
  car: AdminCar;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("nb-NO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClass(status: ImportStatus | null): string {
  if (status === "approved") return "isApproved";
  if (status === "needs_review") return "isNeedsReview";
  return "isDraft";
}

export default function AdminCarReviewPanel({ car }: AdminCarReviewPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    <section className="adminReviewPanel" aria-label="Kilde og gjennomgang">
      <div className="adminReviewHeader">
        <h2>Kilde og gjennomgang</h2>
        <span className={`adminStatusBadge ${statusClass(importStatus)}`}>
          {IMPORT_STATUS_LABELS[importStatus]}
        </span>
      </div>

      <dl className="adminReviewMeta">
        <div>
          <dt>Kildenavn</dt>
          <dd>{car.source_name?.trim() || "—"}</dd>
        </div>
        <div>
          <dt>Kilde-URL</dt>
          <dd>
            {car.source_url ? (
              <a href={car.source_url} target="_blank" rel="noreferrer">
                {car.source_url}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt>Sist sjekket</dt>
          <dd>{formatDateTime(car.data_last_checked_at)}</dd>
        </div>
        <div>
          <dt>Kilde oppdatert</dt>
          <dd>{formatDateTime(car.source_updated_at)}</dd>
        </div>
        <div>
          <dt>Publisering</dt>
          <dd>{car.is_published ? "Publisert" : "Ikke publisert"}</dd>
        </div>
      </dl>

      {car.import_notes?.trim() && (
        <p className="adminReviewNotes">
          <strong>Importmerknad:</strong> {car.import_notes}
        </p>
      )}

      <p className="adminReviewHint">
        Godkjenning og publisering er separate steg. Godkjente biler blir ikke publisert
        automatisk.
      </p>

      <div className="adminReviewActions">
        <button
          type="button"
          className="button secondary buttonSm"
          disabled={isPending || importStatus === "needs_review"}
          onClick={() => runAction(() => markAdminCarNeedsReviewAction(car.id))}
        >
          Marker for gjennomgang
        </button>
        <button
          type="button"
          className="button secondary buttonSm"
          disabled={isPending || importStatus === "approved"}
          onClick={() => runAction(() => approveAdminCarAction(car.id))}
        >
          Godkjenn
        </button>
        {car.is_published ? (
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAction(() => setAdminCarPublishedAction(car.id, false))}
          >
            Avpubliser
          </button>
        ) : (
          <button
            type="button"
            className="button primary buttonSm"
            disabled={isPending}
            onClick={() => runAction(() => publishAdminCarAction(car.id))}
          >
            Publiser
          </button>
        )}
      </div>

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
    </section>
  );
}
