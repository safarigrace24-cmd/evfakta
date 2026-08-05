"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  generateEditorialAiDraftAction,
  generateImproveAllEditorialDraftsAction,
  getAdminAiServicesStatusAction,
  researchAndFillMissingFieldsAction,
} from "@/app/admin/editorial-actions";
import {
  computeEditorialCompletion,
  type EditorialCompletion,
} from "@/lib/admin/editorial-completion";
import type { CarImageRow } from "@/lib/admin/car-image-types";
import {
  completionBarGlyphs,
  completionStatusText,
  resolveEditorJump,
  type CarEditorTab,
} from "@/lib/admin/editor-navigation";
import type { AdminCar } from "@/lib/admin/types";
import type { AdminCarVariant } from "@/lib/admin/variant-types";
import type { EditorialAiDraftKind } from "@/lib/admin/google-ai-editorial-drafts";

type AdminEditorialAssistantProps = {
  car: AdminCar;
  images: CarImageRow[];
  variants: AdminCarVariant[];
  variant?: "panel" | "sidebar";
  onNavigate?: (tab: CarEditorTab, anchorId?: string) => void;
};

type ImproveAllDraft = {
  kind: EditorialAiDraftKind;
  draft: string;
  model?: string;
};

function CompletionProgress({
  percent,
  threshold,
}: {
  percent: number;
  threshold: number;
}) {
  const status = completionStatusText(percent, threshold);
  const ready = percent >= threshold;
  const barClass = ready
    ? "adminCompletionBarFill is-ready"
    : percent >= 70
      ? "adminCompletionBarFill is-mid"
      : "adminCompletionBarFill is-low";

  return (
    <div className="adminCompletionProgress" role="group" aria-label="Completion">
      <div
        className="adminCompletionBarTrack"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}% — ${status}`}
      >
        <div className={barClass} style={{ width: `${percent}%` }} />
      </div>
      <p className="adminCompletionGlyphs" aria-hidden="true">
        {completionBarGlyphs(percent)}
      </p>
      <p className="adminEditorialPercent">
        <strong>{percent}%</strong>
        <span className={ready ? "adminCompletionStatus is-ready" : "adminCompletionStatus"}>
          {ready ? "🟢 Ready for Publish" : status}
        </span>
      </p>
    </div>
  );
}

function JumpButton({
  label,
  openLabel,
  onClick,
}: {
  label: string;
  openLabel: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="adminJumpLink" onClick={onClick}>
      <span>{label}</span>
      <em>Open {openLabel}</em>
    </button>
  );
}

function ChecklistView({
  completion,
  onNavigate,
}: {
  completion: EditorialCompletion;
  onNavigate?: (tab: CarEditorTab, anchorId?: string) => void;
}) {
  return (
    <div className="adminEditorialSections">
      {completion.sections.map((section) => (
        <section key={section.id} className="adminEditorialSection">
          <h3>{section.title}</h3>
          <ul>
            {section.items.map((entry) => {
              const jump = !entry.complete ? resolveEditorJump(entry.id) : null;
              return (
                <li
                  key={entry.id}
                  className={entry.complete ? "is-complete" : "is-missing"}
                >
                  <span className="adminEditorialCheck" aria-hidden="true">
                    {entry.complete ? "✓" : "○"}
                  </span>
                  {jump && onNavigate ? (
                    <JumpButton
                      label={`${entry.label}${
                        entry.requiredForPublish ? " (påkrevd)" : ""
                      }`}
                      openLabel={jump.openLabel}
                      onClick={() => onNavigate(jump.tab, jump.anchorId)}
                    />
                  ) : (
                    <span>
                      {entry.label}
                      {entry.requiredForPublish && !entry.complete ? (
                        <em className="adminEditorialRequired"> påkrevd</em>
                      ) : null}
                    </span>
                  )}
                </li>
              );
            })}
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
  onNavigate,
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
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [aiDraftKind, setAiDraftKind] = useState<EditorialAiDraftKind | null>(
    null,
  );
  const [aiSourceText, setAiSourceText] = useState<string | null>(null);
  const [aiClaimHints, setAiClaimHints] = useState<string[]>([]);
  const [rewriteSource, setRewriteSource] = useState(
    () => car.description?.trim() || "",
  );
  const [editorBuffer, setEditorBuffer] = useState("");
  const [aiStatusLines, setAiStatusLines] = useState<
    Array<{ id: string; available: boolean; label: string }>
  >([]);
  const [aiStatusSummary, setAiStatusSummary] = useState("AI Status");
  const [aiAllFailed, setAiAllFailed] = useState(false);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [improveAllDrafts, setImproveAllDrafts] = useState<ImproveAllDraft[]>(
    [],
  );
  const [improveAllFailed, setImproveAllFailed] = useState<
    EditorialAiDraftKind[]
  >([]);

  const completion = computeEditorialCompletion({ car, images, variants });

  useEffect(() => {
    let cancelled = false;
    void getAdminAiServicesStatusAction().then((result) => {
      if (cancelled || !result.ok) return;
      setAiStatusLines(result.lines);
      setAiStatusSummary(result.summaryLabel);
      setAiAllFailed(result.allFailed);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function jump(idOrCode: string) {
    const target = resolveEditorJump(idOrCode);
    if (!target || !onNavigate) return;
    onNavigate(target.tab, target.anchorId);
  }

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

  function runAiDraft(kind: EditorialAiDraftKind) {
    setMessage(null);
    setError(null);
    setCopyNote(null);
    setAiDraft(null);
    setAiSourceText(null);
    setAiClaimHints([]);
    setAiDraftKind(kind);
    startTransition(async () => {
      const result = await generateEditorialAiDraftAction({
        carId: car.id,
        kind,
        sourceText: rewriteSource,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAiDraft(result.draft);
      setAiSourceText(result.sourceText ?? null);
      setAiClaimHints(result.claimHints ?? []);
      setMessage(result.message);
    });
  }

  function runImproveAll() {
    setMessage(null);
    setError(null);
    setCopyNote(null);
    setImproveAllDrafts([]);
    setImproveAllFailed([]);
    startTransition(async () => {
      const result = await generateImproveAllEditorialDraftsAction({
        carId: car.id,
        sourceText: rewriteSource,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setImproveAllDrafts(result.drafts);
      setImproveAllFailed(result.failedKinds);
      setMessage(result.message);
    });
  }

  function copyDraft() {
    if (!aiDraft) return;
    void navigator.clipboard?.writeText(aiDraft).then(
      () => setCopyNote("Utkast kopiert. Ingenting er lagret i databasen."),
      () => setCopyNote("Kunne ikke kopiere automatisk."),
    );
  }

  function applyDraftToBuffer() {
    if (!aiDraft) return;
    setEditorBuffer(aiDraft);
    setCopyNote(
      "Utkast lagt i redigeringsbuffer. Eksisterende biltekst er uendret til du limer inn manuelt i skjemaet.",
    );
  }

  function applyImproveAllToBuffer() {
    if (improveAllDrafts.length === 0) return;
    const combined = improveAllDrafts
      .map((entry) => `## ${entry.kind}\n\n${entry.draft}`)
      .join("\n\n---\n\n");
    setEditorBuffer(combined);
    setCopyNote(
      "Improve-all preview applied to buffer only. Review each section, then paste into the form manually. Nothing was saved.",
    );
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
          <p className="adminEditorialEyebrow">Redaksjonell gjennomgang</p>
          <h2 id="editorial-assistant-heading">
            {variant === "sidebar" ? "Gjennomgangsassistent" : completion.title}
          </h2>
          <CompletionProgress
            percent={completion.percent}
            threshold={completion.launchCompletionThreshold}
          />
          <p className="adminHint">
            {completion.completedCount} av {completion.totalCount} sjekkpunkter
            {" · "}mål ≥{completion.launchCompletionThreshold}%
          </p>
        </div>
      </div>

      <div className="adminAiStatusPanel" role="status" aria-label="AI Status">
        <h3>{aiStatusSummary}</h3>
        {aiStatusLines.length > 0 ? (
          <ul className="adminAiStatusList">
            {aiStatusLines.map((line) => (
              <li
                key={line.id}
                className={line.available ? "is-available" : "is-unavailable"}
              >
                {line.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="adminHint">Loading AI status…</p>
        )}
        {aiAllFailed ? (
          <p className="authAlert authAlertError" role="alert">
            All AI services are unavailable right now.
          </p>
        ) : null}
      </div>

      <div className="adminQuickActions">
        <button
          type="button"
          className="button primary"
          disabled={isPending}
          onClick={runAssist}
        >
          {isPending ? "Fyller manglende felt…" : "Research og fyll manglende felt"}
        </button>
        {jobId ? (
          <Link
            href={`/admin/import/research/${jobId}`}
            className="button secondary"
          >
            Åpne research-jobb
          </Link>
        ) : null}
      </div>

      <div className="adminEditorialAiDrafts">
        <h3>AI-tekstassistent (Gemini)</h3>
        <p className="adminEditorialAiNotice" role="note">
          AI-forslag må kontrolleres av en redaktør før publisering. Ingenting lagres
          eller publiseres automatisk.
        </p>
        <div className="adminQuickActions">
          <button
            type="button"
            className="button primary buttonSm"
            disabled={isPending}
            onClick={runImproveAll}
          >
            ✨ Improve all editorial text
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("description")}
          >
            Generer introduksjon
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("summary")}
          >
            Generer sammendrag
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("faq")}
          >
            Generer FAQ
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("seo_title")}
          >
            Generer SEO-tittel
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("meta_description")}
          >
            Generer meta-beskrivelse
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("social_caption")}
          >
            Generer sosial tekst
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("metadata")}
          >
            Foreslå metadata
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("claim_check")}
          >
            Sjekk mulige påstander
          </button>
        </div>

        <label className="authField">
          <span>Kildetekst for omskrivning / påstandsjekk</span>
          <textarea
            rows={5}
            value={rewriteSource}
            onChange={(e) => setRewriteSource(e.target.value)}
            placeholder="Lim inn eksisterende tekst. Eksisterende beskrivelse brukes som standard."
          />
        </label>
        <div className="adminQuickActions">
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("rewrite_clearer")}
          >
            Omskriv klarere
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("rewrite_shorter")}
          >
            Omskriv kortere
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={isPending}
            onClick={() => runAiDraft("rewrite_neutral")}
          >
            Omskriv nøytralt
          </button>
        </div>

        {improveAllDrafts.length > 0 ? (
          <div className="adminImproveAllPreview">
            <h4>Improve-all preview (not saved)</h4>
            {improveAllDrafts.map((entry) => (
              <label key={entry.kind} className="authField">
                <span>{entry.kind}</span>
                <textarea rows={6} value={entry.draft} readOnly />
              </label>
            ))}
            {improveAllFailed.length > 0 ? (
              <p className="adminHint">
                Failed sections: {improveAllFailed.join(", ")}
              </p>
            ) : null}
            <div className="adminQuickActions">
              <button
                type="button"
                className="button primary buttonSm"
                onClick={applyImproveAllToBuffer}
              >
                Apply
              </button>
            </div>
          </div>
        ) : null}

        {aiDraft ? (
          <>
            {aiSourceText ? (
              <div className="adminEditorialAiCompare">
                <label className="authField">
                  <span>Før</span>
                  <textarea rows={6} value={aiSourceText} readOnly />
                </label>
                <label className="authField">
                  <span>Etter (utkast{aiDraftKind ? ` · ${aiDraftKind}` : ""})</span>
                  <textarea rows={6} value={aiDraft} readOnly />
                </label>
              </div>
            ) : (
              <label className="authField">
                <span>
                  Utkast{aiDraftKind ? ` · ${aiDraftKind}` : ""} (ikke lagret)
                </span>
                <textarea rows={10} value={aiDraft} readOnly />
              </label>
            )}
            {aiClaimHints.length > 0 ? (
              <ul className="adminEditorialMissingList" role="status">
                {aiClaimHints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            ) : null}
            <div className="adminQuickActions">
              <button
                type="button"
                className="button secondary buttonSm"
                onClick={copyDraft}
              >
                Kopier utkast
              </button>
              <button
                type="button"
                className="button primary buttonSm"
                onClick={applyDraftToBuffer}
              >
                Apply
              </button>
            </div>
          </>
        ) : null}

        {editorBuffer ? (
          <label className="authField">
            <span>Redigeringsbuffer (lim inn manuelt i bilskjemaet etter gjennomgang)</span>
            <textarea
              rows={8}
              value={editorBuffer}
              onChange={(e) => setEditorBuffer(e.target.value)}
            />
          </label>
        ) : null}
        {copyNote ? (
          <p className="adminSuccess" role="status">
            {copyNote}
          </p>
        ) : null}
      </div>

      <p className="adminHint">
        Fyller bare tomme felt via research-pipelinen. Eksisterende verdier overskrives
        aldri. Konflikter og bildekandidater blir til manuell gjennomgang.
        Lanseringsklart / publiseringsklart krever minst{" "}
        {completion.launchCompletionThreshold}% fullføring — stopp ikke ved bare
        påkrevde minimumsfelt.
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
              Fylt: {lastFilled.join(", ")}
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
              {imageSuggestions} bildekandidat(er) foreslått — ikke publisert.
            </p>
          )}
        </div>
      )}

      <div className="adminEditorialPublish">
        {completion.canPublish ? (
          <p className="adminSuccess" role="status">
            Publiseringsklar: harde porter passerer og fullføring er ≥
            {completion.launchCompletionThreshold}%. Forblir upublisert til du
            publiserer bevisst.
          </p>
        ) : completion.canLaunchReady ? (
          <p className="adminSuccess" role="status">
            Lanseringsklart innhold (≥{completion.launchCompletionThreshold}%).
            Godkjenning kan fortsatt kreves før publisering.
          </p>
        ) : (
          <div className="adminNotice" role="status">
            <strong>Lansering / publisering blokkert</strong>
            <ul className="adminEditorialMissingList adminJumpList">
              {completion.publishIssues.map((issue) => {
                const target = resolveEditorJump(issue.code);
                return (
                  <li key={issue.code}>
                    {target && onNavigate ? (
                      <JumpButton
                        label={issue.message}
                        openLabel={target.openLabel}
                        onClick={() => jump(issue.code)}
                      />
                    ) : (
                      issue.message
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {completion.missing.length > 0 ? (
        <div className="adminEditorialMissing">
          <h3>Mangler</h3>
          <ul className="adminEditorialMissingList adminJumpList">
            {completion.missingItemIds.map((itemId, index) => {
              const label = completion.missing[index] ?? itemId;
              const target = resolveEditorJump(itemId);
              return (
                <li key={itemId}>
                  {target && onNavigate ? (
                    <JumpButton
                      label={label}
                      openLabel={target.openLabel}
                      onClick={() => jump(itemId)}
                    />
                  ) : (
                    label
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="adminSuccess" role="status">
          Sjekkliste komplett — klar for endelig publiseringsgjennomgang.
        </p>
      )}

      <ChecklistView completion={completion} onNavigate={onNavigate} />
    </section>
  );
}
