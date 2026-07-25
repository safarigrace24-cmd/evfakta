"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  removeCarImageAction,
  uploadCarImageAction,
} from "@/app/admin/image-actions";

type AdminCarImageFieldProps = {
  slug: string;
  imageUrl: string;
  disabled?: boolean;
  onChange: (url: string) => void;
};

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.split(",")[1] ?? "" : result;
      if (!base64) {
        reject(new Error("empty"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export default function AdminCarImageField({
  slug,
  imageUrl,
  disabled = false,
  onChange,
}: AdminCarImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [previewFailed, setPreviewFailed] = useState(false);

  const hasImage = Boolean(imageUrl.trim());
  const busy = disabled || isPending;
  const previewSrc = imageUrl.trim()
    ? `${imageUrl.trim()}${imageUrl.includes("?") ? "&" : "?"}v=${previewVersion}`
    : "";

  function openPicker() {
    setError(null);
    setMessage(null);
    inputRef.current?.click();
  }

  function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (!slug.trim()) {
      setError("Fyll inn slug før du laster opp bilde.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    setMessage(null);
    setProgress(12);

    const tick = window.setInterval(() => {
      setProgress((current) => {
        if (current == null || current >= 90) return current;
        return current + 8;
      });
    }, 200);

    startTransition(async () => {
      try {
        const base64 = await readFileAsBase64(file);
        const result = await uploadCarImageAction({
          slug: slug.trim().toLowerCase(),
          base64,
          contentType: file.type,
        });

        if (!result.ok) {
          setError(result.error);
          setProgress(null);
          return;
        }

        setProgress(100);
        onChange(result.url ?? "");
        setPreviewVersion(Date.now());
        setPreviewFailed(false);
        setMessage(result.message);
        window.setTimeout(() => setProgress(null), 400);
      } catch {
        setError("Kunne ikke lese bildefilen. Prøv igjen.");
        setProgress(null);
      } finally {
        window.clearInterval(tick);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function onRemove() {
    if (busy) return;
    setError(null);
    setMessage(null);

    if (!slug.trim()) {
      onChange("");
      setMessage("Bildet er fjernet.");
      return;
    }

    setProgress(20);
    startTransition(async () => {
      const result = await removeCarImageAction(slug.trim().toLowerCase(), imageUrl);
      setProgress(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChange("");
      setPreviewFailed(false);
      setMessage(result.message);
    });
  }

  return (
    <div className="adminImageField">
      <span className="adminImageLabel">Bildebane</span>

      <div className="adminImageStack">
        <div className="adminImagePreview" aria-hidden={!hasImage}>
          {hasImage && !previewFailed ? (
            <Image
              src={previewSrc}
              alt="Forhåndsvisning av bilde"
              fill
              sizes="320px"
              unoptimized
              className="adminImagePreviewImg"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <span className="adminImagePlaceholder">
              {hasImage ? "Kunne ikke vise forhåndsvisning" : "Ingen bilde ennå"}
            </span>
          )}
        </div>

        <div className="adminImageControls">
          {/*
            Keep this file input outside any parent <form> (see AdminCarForm).
            Also omit name + use form="" so it never participates in Lagre submit.
          */}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            form=""
            hidden
            disabled={busy}
            onChange={(e) => onFileChange(e.target.files)}
          />

          {!hasImage ? (
            <button
              type="button"
              className="button primary buttonSm"
              onClick={openPicker}
              disabled={busy}
            >
              {isPending ? "Laster opp…" : "Last opp bilde"}
            </button>
          ) : (
            <div className="adminImageActions">
              <button
                type="button"
                className="button secondary buttonSm"
                onClick={openPicker}
                disabled={busy}
              >
                {isPending ? "Laster opp…" : "Bytt bilde"}
              </button>
              <button
                type="button"
                className="button ghost buttonSm adminDangerButton"
                onClick={onRemove}
                disabled={busy}
              >
                Fjern bilde
              </button>
            </div>
          )}

          <p className="adminImageHint">
            Enkeltbilde (bakoverkompatibilitet): <code>car-images/{slug || "{slug}"}.webp</code>.
            Maks 5 MB. Bruk bildegalleriet under redigering for flere bilder. Husk å lagre bilen
            etter opplasting.
          </p>

          {progress != null && (
            <div
              className="adminImageProgress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Opplastingsfremdrift"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          )}

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
      </div>
    </div>
  );
}
