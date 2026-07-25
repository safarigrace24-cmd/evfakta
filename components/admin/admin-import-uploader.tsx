"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ChangeEvent } from "react";
import {
  applyImportAction,
  previewImportAction,
} from "@/app/admin/import-actions";
import type { ImportReportSummary, PreviewRow } from "@/lib/admin/import/types";

type Stage = "upload" | "preview" | "done";

export default function AdminImportUploader() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<Stage>("upload");
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [skipUnchanged, setSkipUnchanged] = useState(true);
  const [imageMode, setImageMode] = useState<"skip" | "replace">("skip");
  const [jobId, setJobId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<ImportReportSummary | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setContent(String(reader.result ?? ""));
      setStage("upload");
      setPreview([]);
      setSummary(null);
      setJobId(null);
      setMessage(null);
      setError(null);
    };
    reader.readAsText(file);
  }

  function runPreview() {
    if (!content.trim()) {
      setError("Velg en CSV- eller JSON-fil først.");
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await previewImportAction({
        filename,
        content,
        sourceName,
        sourceUrl,
        updateExisting,
        skipUnchanged,
        imageMode,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setJobId(result.jobId ?? null);
      setPreview(result.preview ?? []);
      setSummary(result.summary ?? null);
      setWarnings(result.parseWarnings ?? []);
      setErrors(result.parseErrors ?? []);
      setMessage(result.message);
      setStage("preview");
    });
  }

  function runApply() {
    if (!jobId || !content.trim()) {
      setError("Kjør forhåndsvisning først.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await applyImportAction({
        jobId,
        filename,
        content,
        sourceName,
        sourceUrl,
        updateExisting,
        skipUnchanged,
        imageMode,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSummary(result.summary ?? null);
      setWarnings(result.parseWarnings ?? []);
      setErrors(result.parseErrors ?? []);
      setMessage(result.message);
      setStage("done");
      router.refresh();
    });
  }

  return (
    <div className="adminImportLayout">
      <form className="adminForm" onSubmit={(event) => event.preventDefault()}>
        <h2 className="adminFormSectionTitle">1. Last opp fil</h2>
        <label className="adminFormFull">
          CSV eller JSON
          <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onFile} />
        </label>
        {filename ? <p className="adminHint">Valgt fil: {filename}</p> : null}

        <h2 className="adminFormSectionTitle">2. Kilde og alternativer</h2>
        <label>
          Kildenavn
          <input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Produsent / OFV / manuelt"
          />
        </label>
        <label>
          Kilde-URL
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="adminCheckbox">
          <input
            type="checkbox"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
          />
          Oppdater eksisterende biler (slug)
        </label>
        <label className="adminCheckbox">
          <input
            type="checkbox"
            checked={skipUnchanged}
            onChange={(e) => setSkipUnchanged(e.target.checked)}
          />
          Hopp over uendrede biler
        </label>
        <label>
          Bilder i galleri
          <select
            value={imageMode}
            onChange={(e) => setImageMode(e.target.value as "skip" | "replace")}
          >
            <option value="skip">Hop over duplikater</option>
            <option value="replace">Erstatt duplikater</option>
          </select>
        </label>

        <div className="adminNotice" role="note">
          <strong>Importregler:</strong> Alle rader blir <em>utkast</em> eller{" "}
          <em>trenger gjennomgang</em>. Publisering skjer aldri automatisk.
        </div>

        <div className="adminFormActions">
          <button
            type="button"
            className="button secondary"
            disabled={isPending || !content}
            onClick={runPreview}
          >
            {isPending && stage === "upload" ? "Validerer…" : "Forhåndsvis"}
          </button>
          <button
            type="button"
            className="button primary"
            disabled={isPending || stage === "upload" || !jobId}
            onClick={runApply}
          >
            {isPending && stage === "preview" ? "Importerer…" : "Bekreft import"}
          </button>
          {jobId ? (
            <Link href={`/admin/import/${jobId}`} className="button secondary">
              Åpne rapport
            </Link>
          ) : null}
        </div>

        {error ? (
          <p className="adminInlineError" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="adminSuccess" role="status">
            {message}
          </p>
        ) : null}
      </form>

      {summary ? (
        <div className="adminStatsGrid adminStatsGridWide">
          <article className="adminStatCard">
            <span>Importert</span>
            <strong>{summary.imported}</strong>
          </article>
          <article className="adminStatCard">
            <span>Oppdatert</span>
            <strong>{summary.updated}</strong>
          </article>
          <article className="adminStatCard">
            <span>Hoppet over</span>
            <strong>{summary.skipped}</strong>
          </article>
          <article className="adminStatCard">
            <span>Feil</span>
            <strong>{summary.errors}</strong>
          </article>
          <article className="adminStatCard">
            <span>Advarsler</span>
            <strong>{summary.warnings}</strong>
          </article>
          <article className="adminStatCard">
            <span>Bilder</span>
            <strong>{summary.imagesImported ?? 0}</strong>
          </article>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <details className="adminImportDetails">
          <summary>Advarsler ({warnings.length})</summary>
          <ul>
            {warnings.slice(0, 50).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {errors.length > 0 ? (
        <details className="adminImportDetails" open>
          <summary>Parse-feil ({errors.length})</summary>
          <ul>
            {errors.slice(0, 50).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {preview.length > 0 ? (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Rad</th>
                <th>Slug</th>
                <th>Bil</th>
                <th>Beslutning</th>
                <th>Merknad</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 200).map((row) => (
                <tr key={`${row.rowNumber}-${row.slug}`}>
                  <td>{row.rowNumber}</td>
                  <td>
                    <code className="adminSlug">{row.slug}</code>
                  </td>
                  <td>
                    {row.brand} {row.model}
                  </td>
                  <td>
                    <span className={`adminStatusBadge decision-${row.decision}`}>
                      {row.decision}
                    </span>
                  </td>
                  <td>{row.messages.join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 200 ? (
            <p className="adminHint">Viser 200 av {preview.length} rader.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
