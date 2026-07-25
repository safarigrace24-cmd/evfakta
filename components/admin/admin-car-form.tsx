"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  createAdminCarAction,
  updateAdminCarAction,
} from "@/app/admin/actions";
import AdminCarImageField from "@/components/admin/admin-car-image-field";
import type { AdminBrand } from "@/lib/admin/brand-types";
import {
  BODY_STYLE_OPTIONS,
  DRIVETRAIN_OPTIONS,
  IMPORT_STATUS_OPTIONS,
  IMPORT_STATUS_LABELS,
  VEHICLE_TYPE_OPTIONS,
  type AdminCar,
  type AdminCarInput,
  type ImportStatus,
} from "@/lib/admin/types";

type AdminCarFormProps = {
  mode: "create" | "edit";
  car?: AdminCar;
  brands?: AdminBrand[];
};

function numToInput(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

/** Convert timestamptz ISO to datetime-local value. */
function dateToInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toFormState(car?: AdminCar): AdminCarInput {
  return {
    brand: car?.brand ?? "",
    brand_id: car?.brand_id ?? "",
    model: car?.model ?? "",
    slug: car?.slug ?? "",
    year: numToInput(car?.year),
    price_nok: numToInput(car?.price_nok),
    range_km: numToInput(car?.range_km),
    battery_kwh: numToInput(car?.battery_kwh),
    dc_charging_kw: numToInput(car?.dc_charging_kw),
    drivetrain: car?.drivetrain ?? "",
    image_url: car?.image_url ?? "",
    description: car?.description ?? "",
    is_published: car?.is_published ?? false,
    consumption_kwh_100km: numToInput(car?.consumption_kwh_100km),
    power_hp: numToInput(car?.power_hp),
    torque_nm: numToInput(car?.torque_nm),
    acceleration_0_100: numToInput(car?.acceleration_0_100),
    top_speed_kmh: numToInput(car?.top_speed_kmh),
    seats: numToInput(car?.seats),
    cargo_l: numToInput(car?.cargo_l),
    towing_kg: numToInput(car?.towing_kg),
    warranty: car?.warranty ?? "",
    ac_charging_kw: numToInput(car?.ac_charging_kw),
    vehicle_type: car?.vehicle_type ?? "",
    body_style: car?.body_style ?? "",
    source_url: car?.source_url ?? "",
    source_name: car?.source_name ?? "",
    source_updated_at: dateToInput(car?.source_updated_at),
    data_last_checked_at: dateToInput(car?.data_last_checked_at),
    import_status: car?.import_status ?? "draft",
    import_notes: car?.import_notes ?? "",
    range_score: numToInput(car?.range_score),
    charging_score: numToInput(car?.charging_score),
    winter_score: numToInput(car?.winter_score),
    comfort_score: numToInput(car?.comfort_score),
    space_score: numToInput(car?.space_score),
    value_score: numToInput(car?.value_score),
    reliability_score: numToInput(car?.reliability_score),
    overall_score: numToInput(car?.overall_score),
    score_notes: car?.score_notes ?? "",
    score_methodology: car?.score_methodology ?? "",
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

export default function AdminCarForm({ mode, car, brands = [] }: AdminCarFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<AdminCarInput>(() => toFormState(car));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectableBrands = brands.filter(
    (brand) => brand.is_active || brand.id === form.brand_id,
  );

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

  function onBrandSelect(brandId: string) {
    if (!brandId) {
      updateField("brand_id", "");
      return;
    }
    const selected = brands.find((brand) => brand.id === brandId);
    if (!selected) {
      updateField("brand_id", "");
      return;
    }
    setForm((current) => {
      const next = {
        ...current,
        brand_id: selected.id,
        brand: selected.name,
      };
      if (!slugTouched) {
        next.slug = slugify(`${selected.name} ${next.model}`);
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
    <div className="adminFormStack">
      {/* Image upload stays outside <form> to avoid nested multipart / "Unexpected end of form". */}
      <div className="adminForm adminImageFormCard">
        <AdminCarImageField
          slug={form.slug}
          imageUrl={form.image_url}
          disabled={isPending}
          onChange={(url) => updateField("image_url", url)}
        />
      </div>

      <form id="admin-car-form" className="adminForm" onSubmit={onSubmit} noValidate>
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
            <span>Merke (katalog)</span>
            <select
              value={form.brand_id}
              onChange={(e) => onBrandSelect(e.target.value)}
              disabled={isPending}
            >
              <option value="">Fritekst / ikke koblet</option>
              {selectableBrands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                  {!brand.is_active ? " (inaktiv)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="authField">
            <span>Merkenavn *</span>
            <input
              value={form.brand}
              onChange={(e) => {
                const brandName = e.target.value;
                setForm((current) => {
                  const next = { ...current, brand_id: "", brand: brandName };
                  if (!slugTouched) {
                    next.slug = slugify(`${brandName} ${next.model}`);
                  }
                  return next;
                });
              }}
              required
              disabled={isPending || Boolean(form.brand_id)}
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
            <span>Kjøretøytype</span>
            <select
              value={form.vehicle_type}
              onChange={(e) => updateField("vehicle_type", e.target.value)}
              disabled={isPending}
            >
              <option value="">Velg type</option>
              {VEHICLE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="authField">
            <span>Karosseri</span>
            <select
              value={form.body_style}
              onChange={(e) => updateField("body_style", e.target.value)}
              disabled={isPending}
            >
              <option value="">Velg karosseri</option>
              {BODY_STYLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
            <span>Forbruk (kWh/100 km)</span>
            <input
              inputMode="decimal"
              value={form.consumption_kwh_100km}
              onChange={(e) => updateField("consumption_kwh_100km", e.target.value)}
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
            <span>AC-lading (kW)</span>
            <input
              inputMode="decimal"
              value={form.ac_charging_kw}
              onChange={(e) => updateField("ac_charging_kw", e.target.value)}
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

          <label className="authField">
            <span>Effekt (hk)</span>
            <input
              inputMode="numeric"
              value={form.power_hp}
              onChange={(e) => updateField("power_hp", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Moment (Nm)</span>
            <input
              inputMode="numeric"
              value={form.torque_nm}
              onChange={(e) => updateField("torque_nm", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>0–100 km/t (s)</span>
            <input
              inputMode="decimal"
              value={form.acceleration_0_100}
              onChange={(e) => updateField("acceleration_0_100", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Toppfart (km/t)</span>
            <input
              inputMode="numeric"
              value={form.top_speed_kmh}
              onChange={(e) => updateField("top_speed_kmh", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Seter</span>
            <input
              inputMode="numeric"
              value={form.seats}
              onChange={(e) => updateField("seats", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Bagasjerom (l)</span>
            <input
              inputMode="numeric"
              value={form.cargo_l}
              onChange={(e) => updateField("cargo_l", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Tilhengervekt (kg)</span>
            <input
              inputMode="numeric"
              value={form.towing_kg}
              onChange={(e) => updateField("towing_kg", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Garanti</span>
            <input
              value={form.warranty}
              onChange={(e) => updateField("warranty", e.target.value)}
              disabled={isPending}
              placeholder="f.eks. 5 år / 100 000 km"
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

          <label className="authField">
            <span>Kildenavn</span>
            <input
              value={form.source_name}
              onChange={(e) => updateField("source_name", e.target.value)}
              disabled={isPending}
              placeholder="f.eks. Tesla Norge"
            />
          </label>

          <label className="authField">
            <span>Kilde-URL</span>
            <input
              type="url"
              value={form.source_url}
              onChange={(e) => updateField("source_url", e.target.value)}
              disabled={isPending}
              placeholder="https://..."
            />
          </label>

          <label className="authField">
            <span>Kilde oppdatert</span>
            <input
              type="datetime-local"
              value={form.source_updated_at}
              onChange={(e) => updateField("source_updated_at", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Sist sjekket</span>
            <input
              type="datetime-local"
              value={form.data_last_checked_at}
              onChange={(e) => updateField("data_last_checked_at", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Gjennomgangsstatus</span>
            <select
              value={form.import_status}
              onChange={(e) => updateField("import_status", e.target.value)}
              disabled={isPending}
            >
              {IMPORT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {IMPORT_STATUS_LABELS[status as ImportStatus]}
                </option>
              ))}
            </select>
          </label>

          <label className="authField adminFormFull">
            <span>Importmerknader</span>
            <textarea
              rows={3}
              value={form.import_notes}
              onChange={(e) => updateField("import_notes", e.target.value)}
              disabled={isPending}
              placeholder="Notater fra automatisk import eller manuell gjennomgang"
            />
          </label>

          <p className="adminFormSectionTitle adminFormFull">
            EVFAKTA Score (manuell, 0–10 — ikke auto-generert)
          </p>

          {(
            [
              ["range_score", "Rekkevidde"],
              ["charging_score", "Lading"],
              ["winter_score", "Vinter"],
              ["comfort_score", "Komfort"],
              ["space_score", "Plass"],
              ["value_score", "Pris/verdi"],
              ["reliability_score", "Pålitelighet"],
              ["overall_score", "Totalt"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="authField">
              <span>{label}</span>
              <input
                inputMode="decimal"
                value={form[key]}
                onChange={(e) => updateField(key, e.target.value)}
                disabled={isPending}
                placeholder="0–10"
              />
            </label>
          ))}

          <label className="authField adminFormFull">
            <span>Score-merknader</span>
            <textarea
              rows={3}
              value={form.score_notes}
              onChange={(e) => updateField("score_notes", e.target.value)}
              disabled={isPending}
              placeholder="Interne/redaksjonelle merknader til score"
            />
          </label>

          <label className="authField adminFormFull">
            <span>Score-metodikk (offentlig)</span>
            <textarea
              rows={3}
              value={form.score_methodology}
              onChange={(e) => updateField("score_methodology", e.target.value)}
              disabled={isPending}
              placeholder="Kort forklaring som vises offentlig når score er satt"
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
    </div>
  );
}
