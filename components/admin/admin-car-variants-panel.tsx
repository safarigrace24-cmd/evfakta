"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createAdminCarVariantAction,
  deleteAdminCarVariantAction,
  reorderAdminCarVariantsAction,
  setAdminCarVariantActiveAction,
  setAdminCarVariantDefaultAction,
  updateAdminCarVariantAction,
} from "@/app/admin/variant-actions";
import {
  DRIVETRAIN_OPTIONS,
  IMPORT_STATUS_OPTIONS,
} from "@/lib/admin/types";
import type {
  AdminCarVariant,
  AdminCarVariantInput,
} from "@/lib/admin/variant-types";

type AdminCarVariantsPanelProps = {
  carId: string;
  initialVariants: AdminCarVariant[];
};

function numToInput(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function dateToInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function emptyForm(): AdminCarVariantInput {
  return {
    name: "",
    slug: "",
    trim_level: "",
    model_year: "",
    price_nok: "",
    battery_total_kwh: "",
    battery_usable_kwh: "",
    range_km: "",
    winter_range_km: "",
    real_world_range_km: "",
    consumption_kwh_100km: "",
    ac_charging_kw: "",
    dc_charging_kw: "",
    charge_time_10_80_minutes: "",
    drivetrain: "",
    power_hp: "",
    torque_nm: "",
    acceleration_0_100: "",
    top_speed_kmh: "",
    towing_kg: "",
    curb_weight_kg: "",
    is_default: false,
    is_active: true,
    source_name: "",
    source_url: "",
    data_last_checked_at: "",
    import_status: "needs_review",
    import_notes: "",
  };
}

function toForm(variant: AdminCarVariant): AdminCarVariantInput {
  return {
    name: variant.name ?? "",
    slug: variant.slug ?? "",
    trim_level: variant.trim_level ?? "",
    model_year: numToInput(variant.model_year),
    price_nok: numToInput(variant.price_nok),
    battery_total_kwh: numToInput(variant.battery_total_kwh),
    battery_usable_kwh: numToInput(variant.battery_usable_kwh),
    range_km: numToInput(variant.range_km),
    winter_range_km: numToInput(variant.winter_range_km),
    real_world_range_km: numToInput(variant.real_world_range_km),
    consumption_kwh_100km: numToInput(variant.consumption_kwh_100km),
    ac_charging_kw: numToInput(variant.ac_charging_kw),
    dc_charging_kw: numToInput(variant.dc_charging_kw),
    charge_time_10_80_minutes: numToInput(variant.charge_time_10_80_minutes),
    drivetrain: variant.drivetrain ?? "",
    power_hp: numToInput(variant.power_hp),
    torque_nm: numToInput(variant.torque_nm),
    acceleration_0_100: numToInput(variant.acceleration_0_100),
    top_speed_kmh: numToInput(variant.top_speed_kmh),
    towing_kg: numToInput(variant.towing_kg),
    curb_weight_kg: numToInput(variant.curb_weight_kg),
    is_default: Boolean(variant.is_default),
    is_active: Boolean(variant.is_active),
    source_name: variant.source_name ?? "",
    source_url: variant.source_url ?? "",
    data_last_checked_at: dateToInput(variant.data_last_checked_at),
    import_status: variant.import_status ?? "needs_review",
    import_notes: variant.import_notes ?? "",
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

export default function AdminCarVariantsPanel({
  carId,
  initialVariants,
}: AdminCarVariantsPanelProps) {
  const [variants, setVariants] = useState(initialVariants);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminCarVariantInput>(emptyForm());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sorted = useMemo(
    () =>
      [...variants].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.name.localeCompare(b.name, "nb");
      }),
    [variants],
  );

  function updateField<K extends keyof AdminCarVariantInput>(
    key: K,
    value: AdminCarVariantInput[K],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !editingId && !current.slug) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage(null);
    setError(null);
  }

  function startEdit(variant: AdminCarVariant) {
    setEditingId(variant.id);
    setForm(toForm(variant));
    setMessage(null);
    setError(null);
  }

  function refreshFromServer(next: AdminCarVariant[]) {
    setVariants(next);
  }

  function submitForm() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = editingId
        ? await updateAdminCarVariantAction(editingId, form)
        : await createAdminCarVariantAction(carId, form);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessage(result.message);
      // Soft refresh: reload page data via navigation would be heavier; keep local merge.
      if (editingId) {
        setVariants((current) =>
          current.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  name: form.name.trim(),
                  slug: form.slug.trim().toLowerCase(),
                  trim_level: form.trim_level.trim() || null,
                  model_year: form.model_year ? Number(form.model_year) : null,
                  price_nok: form.price_nok ? Number(form.price_nok) : null,
                  range_km: form.range_km ? Number(form.range_km) : null,
                  is_default: form.is_default,
                  is_active: form.is_active,
                  import_status: form.import_status as AdminCarVariant["import_status"],
                  import_notes: form.import_notes.trim() || null,
                }
              : form.is_default
                ? { ...item, is_default: false }
                : item,
          ),
        );
      } else {
        // Force a full reload of the list by refetching via location — simplest correct state.
        window.location.reload();
        return;
      }
      setEditingId(null);
      setForm(emptyForm());
    });
  }

  function move(id: string, direction: -1 | 1) {
    const ids = sorted.map((item) => item.id);
    const index = ids.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    const nextIds = [...ids];
    const [removed] = nextIds.splice(index, 1);
    nextIds.splice(target, 0, removed);

    setVariants((current) =>
      current.map((item) => ({
        ...item,
        sort_order: nextIds.indexOf(item.id),
      })),
    );

    startTransition(async () => {
      const result = await reorderAdminCarVariantsAction(carId, nextIds);
      if (!result.ok) {
        setError(result.error);
        setVariants(initialVariants);
        return;
      }
      setMessage(result.message);
    });
  }

  function toggleActive(variant: AdminCarVariant) {
    startTransition(async () => {
      const result = await setAdminCarVariantActiveAction(
        variant.id,
        !variant.is_active,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setVariants((current) =>
        current.map((item) =>
          item.id === variant.id
            ? { ...item, is_active: !variant.is_active }
            : item,
        ),
      );
      setMessage(result.message);
    });
  }

  function makeDefault(variant: AdminCarVariant) {
    startTransition(async () => {
      const result = await setAdminCarVariantDefaultAction(variant.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setVariants((current) =>
        current.map((item) => ({
          ...item,
          is_default: item.id === variant.id,
          is_active: item.id === variant.id ? true : item.is_active,
        })),
      );
      setMessage(result.message);
    });
  }

  function remove(variant: AdminCarVariant) {
    if (!window.confirm(`Slette varianten «${variant.name}»?`)) return;
    startTransition(async () => {
      const result = await deleteAdminCarVariantAction(variant.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const remaining = variants.filter((item) => item.id !== variant.id);
      if (variant.is_default && remaining[0]) {
        remaining[0] = { ...remaining[0], is_default: true };
      }
      refreshFromServer(remaining);
      if (editingId === variant.id) {
        startCreate();
      }
      setMessage(result.message);
    });
  }

  return (
    <section className="adminVariantsPanel" aria-labelledby="variants-heading">
      <h2 id="variants-heading">Varianter</h2>
      <p className="adminHint">
        Én offentlig modellside med flere trim. Standardvarianten brukes på kort og som
        standardvalg. Import publiserer aldri automatisk.
      </p>

      {message && (
        <p className="adminSuccess" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="authAlert authAlertError" role="alert">
          {error}
        </p>
      )}

      <ul className="adminVariantsList">
        {sorted.map((variant, index) => (
          <li key={variant.id} className="adminVariantRow">
            <div className="adminVariantMeta">
              <strong>{variant.name}</strong>
              <span className="adminStatusBadge">{variant.slug}</span>
              {variant.is_default && (
                <span className="adminStatusBadge status-completed">Standard</span>
              )}
              <span
                className={
                  variant.is_active
                    ? "adminStatusBadge status-completed"
                    : "adminStatusBadge status-preview"
                }
              >
                {variant.is_active ? "Aktiv" : "Inaktiv"}
              </span>
              <span className="adminStatusBadge">{variant.import_status}</span>
            </div>
            <div className="adminVariantActions">
              <button
                type="button"
                className="button ghost buttonSm"
                disabled={isPending || index === 0}
                onClick={() => move(variant.id, -1)}
              >
                Opp
              </button>
              <button
                type="button"
                className="button ghost buttonSm"
                disabled={isPending || index === sorted.length - 1}
                onClick={() => move(variant.id, 1)}
              >
                Ned
              </button>
              <button
                type="button"
                className="button secondary buttonSm"
                disabled={isPending}
                onClick={() => startEdit(variant)}
              >
                Rediger
              </button>
              {!variant.is_default && (
                <button
                  type="button"
                  className="button ghost buttonSm"
                  disabled={isPending}
                  onClick={() => makeDefault(variant)}
                >
                  Sett standard
                </button>
              )}
              <button
                type="button"
                className="button ghost buttonSm"
                disabled={isPending}
                onClick={() => toggleActive(variant)}
              >
                {variant.is_active ? "Deaktiver" : "Aktiver"}
              </button>
              <button
                type="button"
                className="button ghost buttonSm"
                disabled={isPending}
                onClick={() => remove(variant)}
              >
                Slett
              </button>
            </div>
          </li>
        ))}
      </ul>

      {sorted.length === 0 && (
        <p className="adminHint">Ingen varianter ennå. Bilen fungerer fortsatt uten.</p>
      )}

      <div className="adminQuickActions">
        <button
          type="button"
          className="button secondary"
          disabled={isPending}
          onClick={startCreate}
        >
          Ny variant
        </button>
      </div>

      <form
        className="adminVariantForm"
        onSubmit={(event) => {
          event.preventDefault();
          submitForm();
        }}
      >
        <h3 className="adminFormFull">
          {editingId ? "Rediger variant" : "Opprett variant"}
        </h3>

        <label className="authField">
          <span>Navn *</span>
          <input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            disabled={isPending}
            placeholder="Long Range AWD"
            required
          />
        </label>

        <label className="authField">
          <span>Slug *</span>
          <input
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            disabled={isPending}
            required
          />
        </label>

        <label className="authField">
          <span>Trim</span>
          <input
            value={form.trim_level}
            onChange={(e) => updateField("trim_level", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Årsmodell</span>
          <input
            inputMode="numeric"
            value={form.model_year}
            onChange={(e) => updateField("model_year", e.target.value)}
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
          <span>Batteri totalt (kWh)</span>
          <input
            inputMode="decimal"
            value={form.battery_total_kwh}
            onChange={(e) => updateField("battery_total_kwh", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Batteri brukbart (kWh)</span>
          <input
            inputMode="decimal"
            value={form.battery_usable_kwh}
            onChange={(e) => updateField("battery_usable_kwh", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Vinterrekkevidde (km)</span>
          <input
            inputMode="numeric"
            value={form.winter_range_km}
            onChange={(e) => updateField("winter_range_km", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Real-world rekkevidde (km)</span>
          <input
            inputMode="numeric"
            value={form.real_world_range_km}
            onChange={(e) => updateField("real_world_range_km", e.target.value)}
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
          <span>AC-lading (kW)</span>
          <input
            inputMode="decimal"
            value={form.ac_charging_kw}
            onChange={(e) => updateField("ac_charging_kw", e.target.value)}
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
          <span>Ladetid 10–80 % (min)</span>
          <input
            inputMode="numeric"
            value={form.charge_time_10_80_minutes}
            onChange={(e) =>
              updateField("charge_time_10_80_minutes", e.target.value)
            }
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
            <option value="">—</option>
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
          <span>0–100 (s)</span>
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
          <span>Tilhengervekt (kg)</span>
          <input
            inputMode="numeric"
            value={form.towing_kg}
            onChange={(e) => updateField("towing_kg", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Egenvekt (kg)</span>
          <input
            inputMode="numeric"
            value={form.curb_weight_kg}
            onChange={(e) => updateField("curb_weight_kg", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Kildenavn</span>
          <input
            value={form.source_name}
            onChange={(e) => updateField("source_name", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Kilde-URL</span>
          <input
            value={form.source_url}
            onChange={(e) => updateField("source_url", e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className="authField">
          <span>Sist sjekket</span>
          <input
            type="date"
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
            {IMPORT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="authField adminFormFull">
          <span>Importmerknader</span>
          <textarea
            rows={2}
            value={form.import_notes}
            onChange={(e) => updateField("import_notes", e.target.value)}
            disabled={isPending}
          />
        </label>

        <div className="adminFormFull adminVariantFormChecks">
          <label>
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => updateField("is_default", e.target.checked)}
              disabled={isPending}
            />
            Standardvariant
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)}
              disabled={isPending}
            />
            Aktiv
          </label>
        </div>

        <div className="adminFormFull adminQuickActions">
          <button type="submit" className="button primary" disabled={isPending}>
            {editingId ? "Lagre variant" : "Opprett variant"}
          </button>
          {editingId && (
            <button
              type="button"
              className="button secondary"
              disabled={isPending}
              onClick={startCreate}
            >
              Avbryt
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
