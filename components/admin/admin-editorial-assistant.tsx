"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  generateEditorialAiDraftAction,
  getEditorialAiTextStatusAction,
  researchAndFillMissingFieldsAction,
} from "@/app/admin/editorial-actions";
import {
  computeEditorialCompletion,
  type EditorialCompletion,
} from "@/lib/admin/editorial-completion";
import type { CarImageRow } from "@/lib/admin/car-image-types";
import type { AdminCar } from "@/lib/admin/types";
import type { AdminCarVariant } from "@/lib/admin/variant-types";
import type { EditorialAiDraftKind } from "@/lib/admin/google-ai-editorial-drafts";

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
                    <em className="adminEditorialRequired"> påkrevd</em>
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
  const [aiTextStatus, setAiTextStatus] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);

  const completion = computeEditorialCompletion({ car, images, variants });

  useEffect(() => {
    let cancelled = false;
    void getEditorialAiTextStatusAction().then((result) => {
      if (cancelled || !result.ok) return;
      setAiTextStatus(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
          <p className="adminEditorialPercent">
            <strong>{completion.percent}% fullført</strong>
            <span>
              {completion.completedCount} av {completion.totalCount} sjekkpunkter
              {" · "}mål ≥{completion.launchCompletionThreshold}%
            </span>
          </p>
          {completion.meetsCompletionThreshold ? (
            <p className="adminSuccess" role="status">
              Fullføring oppfyller {completion.launchCompletionThreshold}% for
              lanseringsklart innhold.
            </p>
          ) : (
            <p className="adminNotice" role="status">
              Under {completion.launchCompletionThreshold}% — ikke lanseringsklar /
              publiseringsklar. Fortsett med ufullstendige felt.
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
        <p className="adminHint">
          Kun admin · Server-side · Status: {aiTextStatus || "…"}
        </p>
        <div className="adminQuickActions">
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
                Legg i buffer (ikke lagre)
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
          <h3>Mangler</h3>
          <ul className="adminEditorialMissingList">
            {completion.missing.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="adminSuccess" role="status">
          Sjekkliste komplett — klar for endelig publiseringsgjennomgang.
        </p>
      )}

      <ChecklistView completion={completion} />
    </section>
  );
}
