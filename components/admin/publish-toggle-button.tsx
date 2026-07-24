"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setAdminCarPublishedAction } from "@/app/admin/actions";

type PublishToggleButtonProps = {
  id: string;
  isPublished: boolean;
};

export default function PublishToggleButton({
  id,
  isPublished,
}: PublishToggleButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    if (isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await setAdminCarPublishedAction(id, !isPublished);
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
        className="button secondary buttonSm"
        onClick={onToggle}
        disabled={isPending}
      >
        {isPending
          ? isPublished
            ? "Avpubliserer…"
            : "Publiserer…"
          : isPublished
            ? "Avpubliser"
            : "Publiser"}
      </button>
      {error && (
        <span className="adminInlineError" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
