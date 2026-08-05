"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  editCarFieldReviewAction,
  setCarFieldReviewStatusAction,
} from "@/app/admin/field-review-actions";
import {
  buildFieldReviewQueue,
  FIELD_REVIEW_CONFIDENCE_THRESHOLD,
  type FieldReviewCard,
} from "@/lib/admin/field-review";
import type { AdminCar } from "@/lib/admin/types";

type AdminFieldReviewCardsProps = {
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

function confidenceLabel(confidence: number | null): string {
  if (confidence == null || !Number.isFinite(confidence)) return "Unknown";
  return `${Math.round(confidence * 100)}%`;
}

function confidencePercent(confidence: number | null): number | null {
  if (confidence == null || !Number.isFinite(confidence)) return null;
  return Math.round(Math.max(0, Math.min(1, confidence)) * 100);
}

function confidenceBand(
  percent: number | null,
): "low" | "mid" | "near" | "high" | "unknown" {
  if (percent == null) return "unknown";
  if (percent < 70) return "low";
  if (percent < 90) return "mid";
  if (percent < 95) return "near";
  return "high";
}

function confidenceBandLabel(
  band: ReturnType<typeof confidenceBand>,
): string {
  if (band === "low") return "Below 70%";
  if (band === "mid") return "Below 90%";
  if (band === "near") return "Below 95%";
  if (band === "high") return "95%+";
  return "";
}

function reviewStatusLabel(status: FieldReviewCard["reviewStatus"]): string {
  if (status === "approved") return "🟢 Approved";
  if (status === "rejected") return "🔴 Rejected";
  return "🟠 Pending";
}

function editSeed(card: FieldReviewCard): string {
  if (card.value == null) return "";
  if (Array.isArray(card.value)) return card.value.map(String).join("\n");
  if (typeof card.value === "boolean") return card.value ? "yes" : "no";
  return String(card.value);
}

function FieldCard({
  card,
  busy,
  onApprove,
  onReject,
  onSaveEdit,
}: {
  card: FieldReviewCard;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSaveEdit: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(editSeed(card));
  const percent = confidencePercent(card.confidence);
  const band = confidenceBand(percent);

  return (
    <article
      className={`adminFieldReviewCard${card.lowConfidence ? " is-lowConfidence" : ""}${
        card.reviewStatus === "approved" ? " is-approved" : ""
      }${card.reviewStatus === "rejected" ? " is-rejected" : ""}${
        card.reviewStatus === "pending" ? " is-pending" : ""
      } is-confidence-${band}`}
    >
      <header className="adminFieldReviewCardHeader">
        <div>
          <h3>{card.label}</h3>
          <code>{card.fieldKey}</code>
        </div>
        <div className="adminFieldReviewBadges">
          <span className={`adminStatusBadge decision-${card.reviewStatus}`}>
            {reviewStatusLabel(card.reviewStatus)}
          </span>
          {card.isDraft ? (
            <span className="adminStatusBadge status-needs_review">Draft</span>
          ) : null}
        </div>
      </header>

      <div
        className={`adminFieldConfidenceMeter is-${band}`}
        role="meter"
        aria-label="Confidence"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? 0}
      >
        <div
          className="adminFieldConfidenceFill"
          style={{ width: `${percent ?? 0}%` }}
        />
        <span>
          {confidenceLabel(card.confidence)}
          {confidenceBandLabel(band) ? ` · ${confidenceBandLabel(band)}` : ""}
        </span>
      </div>

      <dl className="adminFieldReviewMeta">
        <div>
          <dt>Current value</dt>
          <dd>{card.displayValue}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>
            {card.sourceUrl ? (
              <a href={card.sourceUrl} target="_blank" rel="noreferrer">
                {card.sourceName || card.sourceUrl}
              </a>
            ) : (
              card.sourceName || "—"
            )}
          </dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd className={card.lowConfidence ? "is-lowConfidenceText" : undefined}>
            {confidenceLabel(card.confidence)}
            {card.lowConfidence
              ? ` (below ${Math.round(FIELD_REVIEW_CONFIDENCE_THRESHOLD * 100)}%)`
              : ""}
          </dd>
        </div>
        <div>
          <dt>Last checked</dt>
          <dd>{formatDateTime(card.lastChecked)}</dd>
        </div>
      </dl>

      {editing ? (
        <div className="adminFieldReviewEdit">
          <label className="authField adminFormFull">
            <span>Edit value{card.valueType === "list" ? " (one per line)" : ""}</span>
            {card.valueType === "text" && card.fieldKey === "description" ? (
              <textarea
                rows={6}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={busy}
              />
            ) : card.valueType === "list" || card.fieldKey === "description" ? (
              <textarea
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={busy}
              />
            ) : (
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={busy}
              />
            )}
          </label>
          <div className="adminVariantActions">
            <button
              type="button"
              className="button primary buttonSm"
              disabled={busy}
              onClick={() => {
                onSaveEdit(draft);
                setEditing(false);
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="button ghost buttonSm"
              disabled={busy}
              onClick={() => {
                setDraft(editSeed(card));
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="adminVariantActions">
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={busy || card.reviewStatus === "approved"}
            onClick={onApprove}
          >
            Approve
          </button>
          <button
            type="button"
            className="button ghost buttonSm"
            disabled={busy || card.reviewStatus === "rejected"}
            onClick={onReject}
          >
            Reject
          </button>
          <button
            type="button"
            className="button ghost buttonSm"
            disabled={busy}
            onClick={() => {
              setDraft(editSeed(card));
              setEditing(true);
            }}
          >
            Edit
          </button>
        </div>
      )}

    </article>
  );
}

export default function AdminFieldReviewCards({ car }: AdminFieldReviewCardsProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "low">("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const queue = useMemo(() => buildFieldReviewQueue(car), [car]);

  const visible = useMemo(() => {
    if (filter === "pending") {
      return queue.filter((card) => card.reviewStatus === "pending");
    }
    if (filter === "low") {
      return queue.filter((card) => card.lowConfidence);
    }
    return queue;
  }, [filter, queue]);

  function run(
    action: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>,
  ) {
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
    <section className="adminFieldReview" aria-labelledby="field-review-heading">
      <div className="adminFieldReviewHeader">
        <div>
          <h2 id="field-review-heading">Field Review Cards</h2>
          <p className="adminHint">
            Queue sorted by lowest confidence first. Values below{" "}
            {Math.round(FIELD_REVIEW_CONFIDENCE_THRESHOLD * 100)}% are highlighted.
          </p>
        </div>
        <div className="adminFieldReviewFilters" role="group" aria-label="Filter queue">
          <button
            type="button"
            className={`button buttonSm${filter === "all" ? " primary" : " secondary"}`}
            onClick={() => setFilter("all")}
          >
            All ({queue.length})
          </button>
          <button
            type="button"
            className={`button buttonSm${filter === "pending" ? " primary" : " secondary"}`}
            onClick={() => setFilter("pending")}
          >
            Pending ({queue.filter((c) => c.reviewStatus === "pending").length})
          </button>
          <button
            type="button"
            className={`button buttonSm${filter === "low" ? " primary" : " secondary"}`}
            onClick={() => setFilter("low")}
          >
            Low confidence ({queue.filter((c) => c.lowConfidence).length})
          </button>
        </div>
      </div>

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

      {visible.length === 0 ? (
        <p className="adminEmpty">No fields in this review queue.</p>
      ) : (
        <div className="adminFieldReviewGrid">
          {visible.map((card) => (
            <FieldCard
              key={card.fieldKey}
              card={card}
              busy={isPending}
              onApprove={() =>
                run(() =>
                  setCarFieldReviewStatusAction({
                    carId: car.id,
                    fieldKey: card.fieldKey,
                    status: "approved",
                  }),
                )
              }
              onReject={() =>
                run(() =>
                  setCarFieldReviewStatusAction({
                    carId: car.id,
                    fieldKey: card.fieldKey,
                    status: "rejected",
                  }),
                )
              }
              onSaveEdit={(value) =>
                run(() =>
                  editCarFieldReviewAction({
                    carId: car.id,
                    fieldKey: card.fieldKey,
                    value,
                  }),
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
