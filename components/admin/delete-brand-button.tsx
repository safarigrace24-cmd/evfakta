"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAdminBrandAction } from "@/app/admin/brand-actions";

type DeleteBrandButtonProps = {
  id: string;
  label: string;
};

export default function DeleteBrandButton({ id, label }: DeleteBrandButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    if (isPending) return;

    const confirmed = window.confirm(
      `Er du sikker på at du vil slette «${label}»? Biler beholder merkenavnet som tekst.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAdminBrandAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="adminActionStack">
      <button
        type="button"
        className="button ghost buttonSm adminDangerButton"
        onClick={onDelete}
        disabled={isPending}
      >
        {isPending ? "Sletter…" : "Slett"}
      </button>
      {error && (
        <span className="adminInlineError" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
