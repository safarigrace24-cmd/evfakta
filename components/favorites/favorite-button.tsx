"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type MouseEvent } from "react";
import { addFavorite, removeFavorite } from "@/app/favorites/actions";

type FavoriteButtonProps = {
  carSlug: string;
  initialIsFavorite: boolean;
  isLoggedIn: boolean;
  variant?: "icon" | "labeled";
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function FavoriteButton({
  carSlug,
  initialIsFavorite,
  isLoggedIn,
  variant = "icon",
}: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  useEffect(() => {
    if (!status || status.type !== "success") return;
    const timer = window.setTimeout(() => setStatus(null), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      const next = pathname || `/modeller/${carSlug}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (isPending) return;

    const nextFavorite = !isFavorite;
    setStatus(null);
    setIsFavorite(nextFavorite);

    startTransition(async () => {
      const result = nextFavorite
        ? await addFavorite(carSlug)
        : await removeFavorite(carSlug);

      if (!result.ok) {
        setIsFavorite(!nextFavorite);
        setStatus({ type: "error", text: result.error });
        return;
      }

      setIsFavorite(result.isFavorite);
      setStatus({ type: "success", text: result.message });
      router.refresh();
    });
  }

  const label = isFavorite ? "Fjern fra favoritter" : "Lagre som favoritt";
  const pendingLabel = isFavorite ? "Fjerner…" : "Lagrer…";

  if (variant === "labeled") {
    return (
      <div className="favoriteLabeledWrap">
        <button
          type="button"
          className={`button secondary favoriteLabeledButton${isFavorite ? " isFavorite" : ""}`}
          onClick={handleClick}
          disabled={isPending}
          aria-pressed={isFavorite}
          aria-label={label}
        >
          <HeartIcon filled={isFavorite} />
          <span>{isPending ? pendingLabel : label}</span>
        </button>
        {status && (
          <p
            className={`favoriteStatus ${status.type === "error" ? "isError" : "isSuccess"}`}
            role={status.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {status.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="favoriteIconWrap">
      <button
        type="button"
        className={`favoriteIconButton${isFavorite ? " isFavorite" : ""}${isPending ? " isPending" : ""}`}
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={isFavorite}
        aria-label={isPending ? pendingLabel : label}
        title={label}
      >
        <HeartIcon filled={isFavorite} />
      </button>
      {status && (
        <span
          className={`favoriteStatusBubble ${status.type === "error" ? "isError" : "isSuccess"}`}
          role={status.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {status.text}
        </span>
      )}
    </div>
  );
}
