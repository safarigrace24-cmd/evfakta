"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  removeBrandLogoAction,
  uploadBrandLogoAction,
} from "@/app/admin/brand-logo-actions";

type AdminBrandLogoFieldProps = {
  slug: string;
  logoUrl: string;
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

export default function AdminBrandLogoField({
  slug,
  logoUrl,
  disabled = false,
  onChange,
}: AdminBrandLogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasLogo = Boolean(logoUrl.trim());
  const busy = disabled || isPending;
  const previewSrc = logoUrl.trim()
    ? `${logoUrl.trim()}${logoUrl.includes("?") ? "&" : "?"}v=${previewVersion}`
    : "";

  function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (!slug.trim()) {
      setError("Fyll inn slug før du laster opp logo.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const base64 = await readFileAsBase64(file);
        const result = await uploadBrandLogoAction({
          slug: slug.trim().toLowerCase(),
          base64,
          contentType: file.type,
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        onChange(result.url ?? "");
        setPreviewVersion(Date.now());
        setPreviewFailed(false);
        setMessage(result.message);
      } catch {
        setError("Kunne ikke lese logofilen. Prøv igjen.");
      } finally {
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
      setMessage("Logoen er fjernet.");
      return;
    }

    startTransition(async () => {
      const result = await removeBrandLogoAction(slug.trim().toLowerCase(), logoUrl);
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
      <span className="adminImageLabel">Logo</span>
      <div className="adminImageStack">
        <div className="adminImagePreview adminBrandLogoPreview" aria-hidden={!hasLogo}>
          {hasLogo && !previewFailed ? (
            <Image
              src={previewSrc}
              alt="Forhåndsvisning av logo"
              fill
              sizes="180px"
              unoptimized
              className="adminBrandLogoPreviewImg"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <span className="adminImagePlaceholder">
              {hasLogo ? "Kunne ikke vise forhåndsvisning" : "Ingen logo ennå"}
            </span>
          )}
        </div>

        <div className="adminImageControls">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            form=""
            hidden
            disabled={busy}
            onChange={(e) => onFileChange(e.target.files)}
          />

          {!hasLogo ? (
            <button
              type="button"
              className="button primary buttonSm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {isPending ? "Laster opp…" : "Last opp logo"}
            </button>
          ) : (
            <div className="adminImageActions">
              <button
                type="button"
                className="button secondary buttonSm"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                {isPending ? "Laster opp…" : "Bytt logo"}
              </button>
              <button
                type="button"
                className="button ghost buttonSm adminDangerButton"
                onClick={onRemove}
                disabled={busy}
              >
                Fjern logo
              </button>
            </div>
          )}

          <p className="adminImageHint">
            Lagres som <code>brand-logos/{slug || "{slug}"}.webp</code>. Maks 5 MB.
            Husk å lagre merket etter opplasting.
          </p>

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
