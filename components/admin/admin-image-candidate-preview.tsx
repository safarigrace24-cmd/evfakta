"use client";

import { useState } from "react";

type Props = {
  url: string;
  alt: string;
  isHero?: boolean;
  onOpenFullSize?: (url: string) => void;
  onResolution?: (resolution: string | null) => void;
  onLoadStateChange?: (state: "loading" | "loaded" | "error") => void;
};

/**
 * Always attempts to render the candidate URL as an image.
 * On failure: placeholder + Broken URL warning (no DB writes).
 */
export default function AdminImageCandidatePreview({
  url,
  alt,
  isHero = false,
  onOpenFullSize,
  onResolution,
  onLoadStateChange,
}: Props) {
  const trimmed = url.trim();
  const [state, setState] = useState<"loading" | "loaded" | "error">(
    trimmed ? "loading" : "error",
  );

  function setLoadState(next: "loading" | "loaded" | "error") {
    setState(next);
    onLoadStateChange?.(next);
  }

  if (!trimmed) {
    return (
      <div className="adminImageReviewPreview is-error">
        <div className="adminImageReviewPlaceholder">
          <strong>No local review copy</strong>
          <span>Download Failed or pending — OEM CDN is never hotlinked</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        state === "error"
          ? "adminImageReviewPreview is-error"
          : "adminImageReviewPreview"
      }
    >
      {state !== "error" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={trimmed}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={(event) => {
            const image = event.currentTarget;
            const width = image.naturalWidth;
            const height = image.naturalHeight;
            if (width > 0 && height > 0) {
              onResolution?.(`${width}×${height}`);
            }
            setLoadState("loaded");
          }}
          onError={() => {
            onResolution?.(null);
            setLoadState("error");
          }}
          onClick={() => {
            if (state === "loaded") onOpenFullSize?.(trimmed);
          }}
          style={state === "loaded" && onOpenFullSize ? { cursor: "zoom-in" } : undefined}
        />
      ) : (
        <div className="adminImageReviewPlaceholder">
          <strong>Preview unavailable</strong>
          <span>Broken URL — image failed to load</span>
        </div>
      )}
      {state === "loading" ? (
        <span className="adminImageReviewLoading" aria-hidden="true">
          Loading…
        </span>
      ) : null}
      {isHero ? <span className="adminImageReviewHeroBadge">Hero</span> : null}
    </div>
  );
}
