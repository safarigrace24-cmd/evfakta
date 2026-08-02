"use client";

import { startTransition, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAiIllustrationCandidateAction,
  uploadAiIllustrationBytesAction,
} from "@/app/admin/ai-image-actions";
import AdminAiImageGeneratorModal from "@/components/admin/admin-ai-image-generator-modal";
import { AI_ILLUSTRATION_USAGE_OPTIONS } from "@/lib/admin/ai-image-candidates";

type Props = {
  carId: string;
  brand: string;
  model: string;
  variant?: string | null;
  year?: number | null;
  heroImageUrl?: string | null;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function AdminAiIllustrationPanel({
  carId,
  brand,
  model,
  variant = null,
  year = null,
  heroImageUrl = null,
}: Props) {
  const router = useRouter();
  const [isPending, begin] = useTransition();
  const [usageType, setUsageType] = useState("front_three_quarter");
  const [usageNote, setUsageNote] = useState("");
  const [changeRequest, setChangeRequest] = useState("");
  const [includeMark, setIncludeMark] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  function runCreate() {
    setMessage(null);
    setError(null);
    begin(async () => {
      let imageBase64: string | null = null;
      if (file) {
        try {
          imageBase64 = await fileToBase64(file);
        } catch {
          setError("Kunne ikke lese bildefilen.");
          return;
        }
      }

      const result = await createAiIllustrationCandidateAction({
        carId,
        usageType,
        usageNote: usageNote.trim() || undefined,
        changeRequest: changeRequest.trim() || undefined,
        includeEvfaktaMark: includeMark,
        imageBase64,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setLastPrompt(result.prompt || null);
      setMessage(result.message);
      setFile(null);
      startTransition(() => router.refresh());
    });
  }

  return (
    <section
      className="adminImageReviewSection adminAiIllustrationPanel"
      aria-labelledby="ai-illustration-heading"
    >
      <div className="adminProductionSectionHeader">
        <h2 id="ai-illustration-heading">AI illustration candidates</h2>
        <p className="adminHint">
          Official manufacturer photography remains preferred. Use AI only when official
          candidates are unavailable, URLs are broken, rights are unclear, or the editor
          explicitly requests an illustration (articles, banners, social). Never auto-approved.
          Never auto-hero. Never presented as official photography.
        </p>
        <button
          type="button"
          className="button secondary buttonSm"
          onClick={() => setGeneratorOpen(true)}
        >
          ✨ Lag AI-bilde
        </button>
      </div>

      <AdminAiImageGeneratorModal
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        vehicle={{
          carId,
          brand,
          model,
          variant,
          year,
          heroImageUrl,
        }}
      />

      <p className="adminNotice" role="status">
        AI-generated illustration — requires human approval. Illustrative image — verify
        against official model before public use.
      </p>

      <div className="adminAiIllustrationForm">
        <label>
          <span>Usage type</span>
          <select
            value={usageType}
            onChange={(event) => setUsageType(event.target.value)}
            disabled={isPending}
          >
            {AI_ILLUSTRATION_USAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Usage note</span>
          <input
            type="text"
            value={usageNote}
            onChange={(event) => setUsageNote(event.target.value)}
            placeholder="Why AI is needed (optional)"
            disabled={isPending}
          />
        </label>

        <label>
          <span>Change request / detail brief</span>
          <textarea
            value={changeRequest}
            onChange={(event) => setChangeRequest(event.target.value)}
            rows={3}
            placeholder="Required for editor-requested detail images"
            disabled={isPending}
          />
        </label>

        <label className="adminAiIllustrationCheck">
          <input
            type="checkbox"
            checked={includeMark}
            onChange={(event) => setIncludeMark(event.target.checked)}
            disabled={isPending}
          />
          <span>Optional small EVFAKTA mark (marketing graphics only)</span>
        </label>

        <label>
          <span>
            Upload generated image (optional — leave empty to create Awaiting Generation +
            prompt)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isPending}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <div className="adminQuickActions">
          <button
            type="button"
            className="button secondary"
            disabled={isPending}
            onClick={runCreate}
          >
            {file ? "Create AI candidate from upload" : "Create Awaiting Generation prompt"}
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          className="adminNotice"
          role="status"
          style={error ? { borderColor: "#c2410c", background: "#fff7ed" } : undefined}
        >
          {error || message}
        </div>
      )}

      {lastPrompt ? (
        <details className="adminAiPromptDetails">
          <summary>
            Generation prompt for {brand} {model}
          </summary>
          <pre className="adminAiPrompt">{lastPrompt}</pre>
        </details>
      ) : null}
    </section>
  );
}

/** Upload bytes onto an existing Awaiting Generation card. */
export function AiCandidateUploadButton({
  imageId,
  disabled,
}: {
  imageId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, begin] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <label className="button ghost buttonSm adminAiUploadLabel">
      {isPending ? "Uploading…" : "Upload generated image"}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        disabled={disabled || isPending}
        onChange={(event) => {
          const next = event.target.files?.[0];
          if (!next) return;
          setError(null);
          begin(async () => {
            try {
              const imageBase64 = await fileToBase64(next);
              const result = await uploadAiIllustrationBytesAction({
                imageId,
                imageBase64,
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              startTransition(() => router.refresh());
            } catch {
              setError("Upload failed.");
            }
          });
        }}
      />
      {error ? <span className="adminHint">{error}</span> : null}
    </label>
  );
}
