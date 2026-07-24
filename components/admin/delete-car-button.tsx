"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAdminCarAction } from "@/app/admin/actions";

type DeleteCarButtonProps = {
  id: string;
  label: string;
};

export default function DeleteCarButton({ id, label }: DeleteCarButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    if (isPending) return;

    const confirmed = window.confirm(
      `Er du sikker på at du vil slette «${label}»? Dette kan ikke angres.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAdminCarAction(id);
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
