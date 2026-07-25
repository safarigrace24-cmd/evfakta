"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setAdminBrandActiveAction } from "@/app/admin/brand-actions";

type BrandActiveToggleButtonProps = {
  id: string;
  isActive: boolean;
};

export default function BrandActiveToggleButton({
  id,
  isActive,
}: BrandActiveToggleButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await setAdminBrandActiveAction(id, !isActive);
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
        {isPending ? "Oppdaterer…" : isActive ? "Deaktiver" : "Aktiver"}
      </button>
      {error && (
        <span className="adminInlineError" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
