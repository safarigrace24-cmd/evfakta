"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { continueResearchJobManualAction } from "@/app/admin/research-actions";
import { RESEARCH_BLOCKED_EXPLANATION } from "@/lib/admin/research/types";
import type { ResearchJob } from "@/lib/admin/research/types";

type ManualTab = "paste" | "pdf" | "json" | "csv";

type AdminResearchManualContinueProps = {
  job: ResearchJob;
};

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Kunne ikke lese filen."));
    reader.readAsText(file);
  });
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64 || "");
    };
    reader.onerror = () => reject(new Error("Kunne ikke lese filen."));
    reader.readAsDataURL(file);
  });
}

export default function AdminResearchManualContinue({
  job,
}: AdminResearchManualContinueProps) {
  const router = useRouter();
  const [tab, setTab] = useState<ManualTab>("paste");
  const [rawInput, setRawInput] = useState("");
  const [modelQuery, setModelQuery] = useState(job.model_query ?? "");
  const [filename, setFilename] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const blockedReason =
    typeof job.options?.blocked_reason === "string"
      ? job.options.blocked_reason
      : null;

  function onTextFile(file: File | null, kind: "json" | "csv") {
    if (!file) return;
    setError(null);
    setFilename(file.name);
    setPdfBase64(null);
    void readFileAsText(file)
      .then((text) => {
        setRawInput(text);
        setMessage(
          kind === "json"
            ? `JSON lastet: ${file.name}`
            : `CSV lastet: ${file.name}`,
        );
      })
      .catch(() => setError("Kunne ikke lese filen."));
  }

  function onPdfFile(file: File | null) {
    if (!file) return;
    setError(null);
    setFilename(file.name);
    setRawInput("");
    void readFileAsBase64(file)
      .then((base64) => {
        setPdfBase64(base64);
        setMessage(`PDF klar: ${file.name}`);
      })
      .catch(() => setError("Kunne ikke lese PDF-en."));
  }

  function submit() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await continueResearchJobManualAction({
        jobId: job.id,
        rawInput: pdfBase64 ? undefined : rawInput || undefined,
        filename: filename || undefined,
        modelQuery: modelQuery || undefined,
        pdfBase64: pdfBase64 || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessage(result.message);
      router.refresh();
    });
  }

  const canSubmit =
    tab === "pdf" ? Boolean(pdfBase64) : Boolean(rawInput.trim());

  return (
    <section className="adminResearchManualPanel" aria-labelledby="manual-research-heading">
      <h2 id="manual-research-heading">Manuell research</h2>

      <div className="adminNotice adminResearchBlockedNotice" role="status">
        <strong>Automatisk tilgang ble blokkert — det er forventet.</strong>
        <p>{RESEARCH_BLOCKED_EXPLANATION}</p>
        {blockedReason ? (
          <p className="adminHint">Detalj: {blockedReason}</p>
        ) : null}
        {job.source_url ? (
          <p className="adminHint">
            Opprinnelig kilde:{" "}
            <a href={job.source_url} target="_blank" rel="noreferrer">
              {job.source_name || job.source_url}
            </a>
            . Åpne siden i nettleseren, kopier spesifikasjoner, og lim inn eller last
            opp under.
          </p>
        ) : null}
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

      <div className="adminResearchManualTabs" role="tablist" aria-label="Manuell kilde">
        {(
          [
            ["paste", "Lim inn tekst"],
            ["pdf", "Last opp PDF"],
            ["json", "Last opp JSON"],
            ["csv", "Last opp CSV"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`button buttonSm${tab === id ? " primary" : " secondary"}`}
            disabled={isPending}
            onClick={() => {
              setTab(id);
              setError(null);
              if (id !== "pdf") setPdfBase64(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="adminVariantForm">
        <label className="authField">
          <span>Modell (valgfritt om JSON inneholder model)</span>
          <input
            value={modelQuery}
            onChange={(e) => setModelQuery(e.target.value)}
            disabled={isPending}
            placeholder={job.brand_name ? `${job.brand_name} Model Y` : "Model Y"}
          />
        </label>

        {tab === "paste" && (
          <label className="authField adminFormFull">
            <span>Lim inn spesifikasjonstekst eller JSON</span>
            <textarea
              rows={12}
              value={rawInput}
              onChange={(e) => {
                setRawInput(e.target.value);
                setPdfBase64(null);
                setFilename(null);
              }}
              disabled={isPending}
              placeholder="Lim inn utdrag fra produsentside, PDF-tekst eller strukturert JSON…"
            />
          </label>
        )}

        {tab === "pdf" && (
          <label className="authField adminFormFull">
            <span>PDF fra offisiell kilde</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              disabled={isPending}
              onChange={(e) => onPdfFile(e.target.files?.[0] ?? null)}
            />
            <span className="adminHint">
              Vi forsøker å hente tekst fra PDF-en. Skannede/beskyttede PDF-er kan kreve
              at du limer inn teksten under «Lim inn tekst».
            </span>
          </label>
        )}

        {tab === "json" && (
          <label className="authField adminFormFull">
            <span>JSON-fil</span>
            <input
              type="file"
              accept=".json,application/json"
              disabled={isPending}
              onChange={(e) => onTextFile(e.target.files?.[0] ?? null, "json")}
            />
          </label>
        )}

        {tab === "csv" && (
          <label className="authField adminFormFull">
            <span>CSV-fil</span>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={isPending}
              onChange={(e) => onTextFile(e.target.files?.[0] ?? null, "csv")}
            />
          </label>
        )}
      </div>

      {(tab === "json" || tab === "csv") && rawInput && (
        <p className="adminHint">
          Forhåndsvisning: {rawInput.slice(0, 180)}
          {rawInput.length > 180 ? "…" : ""}
        </p>
      )}

      <div className="adminQuickActions">
        <button
          type="button"
          className="button primary"
          disabled={isPending || !canSubmit}
          onClick={submit}
        >
          {isPending ? "Behandler manuell kilde…" : "Fortsett research"}
        </button>
      </div>
    </section>
  );
}
