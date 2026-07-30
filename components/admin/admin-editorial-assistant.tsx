"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { researchAndFillMissingFieldsAction } from "@/app/admin/editorial-actions";
import {
  computeEditorialCompletion,
  type EditorialCompletion,
} from "@/lib/admin/editorial-completion";
import type { CarImageRow } from "@/lib/admin/car-image-types";
import type { AdminCar } from "@/lib/admin/types";
import type { AdminCarVariant } from "@/lib/admin/variant-types";

type AdminEditorialAssistantProps = {
  car: AdminCar;
  images: CarImageRow[];
  variants: AdminCarVariant[];
  variant?: "panel" | "sidebar";
};

function CompletionRing({ percent }: { percent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="adminEditorialRing" aria-hidden="true">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle className="adminEditorialRingTrack" cx="40" cy="40" r={radius} />
        <circle
          className="adminEditorialRingValue"
          cx="40"
          cy="40"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <strong>{percent}%</strong>
    </div>
  );
}

function ChecklistView({ completion }: { completion: EditorialCompletion }) {
  return (
    <div className="adminEditorialSections">
      {completion.sections.map((section) => (
        <section key={section.id} className="adminEditorialSection">
          <h3>{section.title}</h3>
          <ul>
            {section.items.map((entry) => (
              <li
                key={entry.id}
                className={entry.complete ? "is-complete" : "is-missing"}
              >
                <span className="adminEditorialCheck" aria-hidden="true">
                  {entry.complete ? "✓" : "○"}
                </span>
                <span>
                  {entry.label}
                  {entry.requiredForPublish && !entry.complete ? (
                    <em className="adminEditorialRequired"> required</em>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function AdminEditorialAssistant({
  car,
  images,
  variants,
  variant = "panel",
}: AdminEditorialAssistantProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [lastFilled, setLastFilled] = useState<string[]>([]);
  const [lastConflicts, setLastConflicts] = useState<
    Array<{ field_key: string; message: string }>
  >([]);
  const [imageSuggestions, setImageSuggestions] = useState(0);

  const completion = computeEditorialCompletion({ car, images, variants });

  function runAssist() {
    setMessage(null);
    setError(null);
    setJobId(null);
    setLastFilled([]);
    setLastConflicts([]);
    setImageSuggestions(0);

    startTransition(async () => {
      const result = await researchAndFillMissingFieldsAction(car.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessage(result.message);
      setJobId(result.jobId);
      setLastFilled(result.filledFields);
      setLastConflicts(result.conflicts);
      setImageSuggestions(result.imageSuggestions);
      router.refresh();
    });
  }

  return (
    <section
      className={
        variant === "sidebar"
          ? "adminEditorialAssistant adminEditorialAssistantSidebar"
          : "adminEditorialAssistant"
      }
      aria-labelledby="editorial-assistant-heading"
    >
      <div className="adminEditorialHeader">
        <div>
          <p className="adminEditorialEyebrow">Editorial Review Assistant</p>
          <h2 id="editorial-assistant-heading">
            {variant === "sidebar" ? "Review Assistant" : completion.title}
          </h2>
          <p className="adminEditorialPercent">
            <strong>{completion.percent}% Complete</strong>
            <span>
              {completion.completedCount} of {completion.totalCount} checklist items
              {" · "}target ≥{completion.launchCompletionThreshold}%
            </span>
          </p>
          {completion.meetsCompletionThreshold ? (
            <p className="adminSuccess" role="status">
              Completion meets the {completion.launchCompletionThreshold}% Launch Ready
              standard.
            </p>
          ) : (
            <p className="adminNotice" role="status">
              Below {completion.launchCompletionThreshold}% — not Launch Ready / Publish
              Ready. Continue reviewing incomplete fields.
            </p>
          )}
        </div>
        {variant === "sidebar" ? null : (
          <CompletionRing percent={completion.percent} />
        )}
      </div>

      <div className="adminQuickActions">
        <button
          type="button"
          className="button primary"
          disabled={isPending}
          onClick={runAssist}
        >
          {isPending ? "Researches missing fields…" : "Research & Fill Missing Fields"}
        </button>
        {jobId ? (
          <Link
            href={`/admin/import/research/${jobId}`}
            className="button secondary"
          >
            Open research job
          </Link>
        ) : null}
      </div>

      <p className="adminHint">
        Fills only empty fields via the research pipeline. Existing values are never
        overwritten. Conflicts and image candidates stay for manual review. Launch Ready
        and Publish Ready require at least {completion.launchCompletionThreshold}%
        completion — do not stop at required-field minimums.
      </p>

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

      {(lastFilled.length > 0 || lastConflicts.length > 0 || imageSuggestions > 0) && (
        <div className="adminEditorialAssistSummary">
          {lastFilled.length > 0 && (
            <p className="adminHint">
              Filled: {lastFilled.join(", ")}
            </p>
          )}
          {lastConflicts.length > 0 && (
            <ul className="adminEditorialMissingList">
              {lastConflicts.map((conflict) => (
                <li key={conflict.field_key}>{conflict.message}</li>
              ))}
            </ul>
          )}
          {imageSuggestions > 0 && (
            <p className="adminHint">
              {imageSuggestions} image candidate(s) suggested — not published.
            </p>
          )}
        </div>
      )}

      <div className="adminEditorialPublish">
        {completion.canPublish ? (
          <p className="adminSuccess" role="status">
            Publish Ready: hard gates pass and completion is ≥
            {completion.launchCompletionThreshold}%. Remains unpublished until you publish
            intentionally.
          </p>
        ) : completion.canLaunchReady ? (
          <p className="adminSuccess" role="status">
            Launch Ready content gates pass (≥{completion.launchCompletionThreshold}%).
            Approval may still be required before Publish Ready.
          </p>
        ) : (
          <div className="adminNotice" role="status">
            <strong>Launch / Publish blocked</strong>
            <ul className="adminEditorialMissingList">
              {completion.publishIssues.map((issue) => (
                <li key={issue.code}>{issue.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {completion.missing.length > 0 ? (
        <div className="adminEditorialMissing">
          <h3>Missing</h3>
          <ul className="adminEditorialMissingList">
            {completion.missing.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="adminSuccess" role="status">
          Checklist complete — ready for final publish review.
        </p>
      )}

      <ChecklistView completion={completion} />
    </section>
  );
}
