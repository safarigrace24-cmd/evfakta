"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  createAdminCarAction,
  updateAdminCarAction,
} from "@/app/admin/actions";
import {
  DRIVETRAIN_OPTIONS,
  type AdminCar,
  type AdminCarInput,
} from "@/lib/admin/types";

type AdminCarFormProps = {
  mode: "create" | "edit";
  car?: AdminCar;
};

function toFormState(car?: AdminCar): AdminCarInput {
  return {
    brand: car?.brand ?? "",
    model: car?.model ?? "",
    slug: car?.slug ?? "",
    year: car?.year != null ? String(car.year) : "",
    price_nok: car?.price_nok != null ? String(car.price_nok) : "",
    range_km: car?.range_km != null ? String(car.range_km) : "",
    battery_kwh: car?.battery_kwh != null ? String(car.battery_kwh) : "",
    dc_charging_kw: car?.dc_charging_kw != null ? String(car.dc_charging_kw) : "",
    drivetrain: car?.drivetrain ?? "",
    image_url: car?.image_url ?? "",
    description: car?.description ?? "",
    is_published: car?.is_published ?? false,
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

export default function AdminCarForm({ mode, car }: AdminCarFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<AdminCarInput>(() => toFormState(car));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof AdminCarInput>(key: K, value: AdminCarInput[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (!slugTouched && (key === "brand" || key === "model")) {
        const brand = key === "brand" ? String(value) : next.brand;
        const model = key === "model" ? String(value) : next.model;
        next.slug = slugify(`${brand} ${model}`);
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
          ? await createAdminCarAction(form)
          : await updateAdminCarAction(car!.id, form);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(result.message);

      if (mode === "create" && result.id) {
        router.push(`/admin/biler/${result.id}/rediger`);
        router.refresh();
        return;
      }

      router.refresh();
    });
  }

  return (
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
          <span>Merke *</span>
          <input
            value={form.brand}
            onChange={(e) => updateField("brand", e.target.value)}
            required
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Modell *</span>
          <input
            value={form.model}
            onChange={(e) => updateField("model", e.target.value)}
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
            placeholder="tesla-model-y"
          />
        </label>

        <label className="authField">
          <span>Årsmodell</span>
          <input
            inputMode="numeric"
            value={form.year}
            onChange={(e) => updateField("year", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Pris (NOK)</span>
          <input
            inputMode="numeric"
            value={form.price_nok}
            onChange={(e) => updateField("price_nok", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Rekkevidde (km)</span>
          <input
            inputMode="numeric"
            value={form.range_km}
            onChange={(e) => updateField("range_km", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Batteri (kWh)</span>
          <input
            inputMode="decimal"
            value={form.battery_kwh}
            onChange={(e) => updateField("battery_kwh", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>DC-lading (kW)</span>
          <input
            inputMode="numeric"
            value={form.dc_charging_kw}
            onChange={(e) => updateField("dc_charging_kw", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Drivlinje</span>
          <select
            value={form.drivetrain}
            onChange={(e) => updateField("drivetrain", e.target.value)}
            disabled={isPending}
          >
            <option value="">Velg drivlinje</option>
            {DRIVETRAIN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="authField adminFormFull">
          <span>Bilde-URL</span>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => updateField("image_url", e.target.value)}
            disabled={isPending}
            placeholder="https://..."
          />
        </label>

        <label className="authField adminFormFull">
          <span>Beskrivelse</span>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="adminCheckbox adminFormFull">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => updateField("is_published", e.target.checked)}
            disabled={isPending}
          />
          <span>Publisert</span>
        </label>
      </div>

      <div className="adminFormActions">
        <button type="submit" className="button primary" disabled={isPending}>
          {isPending ? "Lagrer…" : "Lagre"}
        </button>
        <Link href="/admin/biler" className="button secondary">
          Avbryt
        </Link>
      </div>
    </form>
  );
}
