"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  createAdminBrandAction,
  updateAdminBrandAction,
} from "@/app/admin/brand-actions";
import AdminBrandLogoField from "@/components/admin/admin-brand-logo-field";
import type { AdminBrand, AdminBrandInput } from "@/lib/admin/brand-types";

type AdminBrandFormProps = {
  mode: "create" | "edit";
  brand?: AdminBrand;
};

function toFormState(brand?: AdminBrand): AdminBrandInput {
  return {
    name: brand?.name ?? "",
    slug: brand?.slug ?? "",
    logo_url: brand?.logo_url ?? "",
    country: brand?.country ?? "",
    website_url: brand?.website_url ?? "",
    description: brand?.description ?? "",
    is_active: brand?.is_active ?? true,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminBrandForm({ mode, brand }: AdminBrandFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<AdminBrandInput>(() => toFormState(brand));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof AdminBrandInput>(key: K, value: AdminBrandInput[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (!slugTouched && key === "name") {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAdminBrandAction(form)
          : await updateAdminBrandAction(brand!.id, form);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(result.message);

      if (mode === "create" && result.id) {
        router.push(`/admin/merker/${result.id}/rediger`);
        router.refresh();
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="adminFormStack">
      <div className="adminForm adminImageFormCard">
        <AdminBrandLogoField
          slug={form.slug}
          logoUrl={form.logo_url}
          disabled={isPending}
          onChange={(url) => updateField("logo_url", url)}
        />
      </div>

      <form className="adminForm" onSubmit={onSubmit} noValidate>
        {error && (
          <p className="authAlert authAlertError" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="authAlert authAlertSuccess" role="status">
            {success}
          </p>
        )}

        <div className="adminFormGrid">
          <label className="authField">
            <span>Merkenavn *</span>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Slug *</span>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                updateField("slug", e.target.value.toLowerCase());
              }}
              required
              disabled={isPending}
              placeholder="tesla"
            />
          </label>

          <label className="authField">
            <span>Land</span>
            <input
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              disabled={isPending}
              placeholder="f.eks. USA"
            />
          </label>

          <label className="authField">
            <span>Nettsted</span>
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => updateField("website_url", e.target.value)}
              disabled={isPending}
              placeholder="https://..."
            />
          </label>

          <label className="authField adminFormFull">
            <span>Beskrivelse</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="adminCheckbox adminFormFull">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)}
              disabled={isPending}
            />
            <span>Aktiv (vises på /merker)</span>
          </label>
        </div>

        <div className="adminFormActions">
          <button type="submit" className="button primary" disabled={isPending}>
            {isPending ? "Lagrer…" : "Lagre"}
          </button>
          <Link href="/admin/merker" className="button secondary">
            Avbryt
          </Link>
        </div>
      </form>
    </div>
  );
}
