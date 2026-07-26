"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import {
  createAdminCarAction,
  updateAdminCarAction,
} from "@/app/admin/actions";
import AdminCarImageField from "@/components/admin/admin-car-image-field";
import type { AdminBrand } from "@/lib/admin/brand-types";
import { boolToInput, textListToInput } from "@/lib/admin/field-parsers";
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

export type CarEditorFormTab =
  | "overview"
  | "specifications"
  | "editorial"
  | "sources";

type AdminCarFormProps = {
  mode: "create" | "edit";
  car?: AdminCar;
  brands?: AdminBrand[];
  layout?: "classic" | "workspace";
  activeTab?: CarEditorFormTab;
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
    variant: car?.variant ?? "",
    trim_level: car?.trim_level ?? "",
    model_generation: car?.model_generation ?? "",
    year: numToInput(car?.year),
    price_nok: numToInput(car?.price_nok),
    range_km: numToInput(car?.range_km),
    battery_kwh: numToInput(car?.battery_kwh),
    battery_total_kwh: numToInput(car?.battery_total_kwh),
    battery_usable_kwh: numToInput(car?.battery_usable_kwh),
    battery_chemistry: car?.battery_chemistry ?? "",
    winter_range_km: numToInput(car?.winter_range_km),
    real_world_range_km: numToInput(car?.real_world_range_km),
    dc_charging_kw: numToInput(car?.dc_charging_kw),
    charge_time_10_80_minutes: numToInput(car?.charge_time_10_80_minutes),
    charging_connector_ac: car?.charging_connector_ac ?? "",
    charging_connector_dc: car?.charging_connector_dc ?? "",
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
    length_mm: numToInput(car?.length_mm),
    width_mm: numToInput(car?.width_mm),
    height_mm: numToInput(car?.height_mm),
    wheelbase_mm: numToInput(car?.wheelbase_mm),
    curb_weight_kg: numToInput(car?.curb_weight_kg),
    gross_weight_kg: numToInput(car?.gross_weight_kg),
    frunk_l: numToInput(car?.frunk_l),
    heat_pump: boolToInput(car?.heat_pump),
    v2l: boolToInput(car?.v2l),
    v2g: boolToInput(car?.v2g),
    apple_carplay: boolToInput(car?.apple_carplay),
    android_auto: boolToInput(car?.android_auto),
    head_up_display: boolToInput(car?.head_up_display),
    panoramic_roof: boolToInput(car?.panoramic_roof),
    ota_updates: boolToInput(car?.ota_updates),
    pros: textListToInput(car?.pros),
    cons: textListToInput(car?.cons),
    suitable_for: textListToInput(car?.suitable_for),
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

function BoolSelect({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="authField">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="">Ukjent</option>
        <option value="true">Ja</option>
        <option value="false">Nei</option>
      </select>
    </label>
  );
}

function SpecTable({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="adminSpecTableBlock">
      <h3>{title}</h3>
      <table className="adminEditorTable adminSpecTable">
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}

function SpecInputRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{children}</td>
    </tr>
  );
}

function BoolSelectBare({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">Ukjent</option>
      <option value="true">Ja</option>
      <option value="false">Nei</option>
    </select>
  );
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

export default function AdminCarForm({
  mode,
  car,
  brands = [],
  layout = "classic",
  activeTab = "overview",
}: AdminCarFormProps) {
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
      // Workspace publish lives in the header; keep server publish flag on save.
      const payload =
        layout === "workspace" && car
          ? { ...form, is_published: car.is_published }
          : form;

      const result =
        mode === "create"
          ? await createAdminCarAction(payload)
          : await updateAdminCarAction(car!.id, payload);

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


  if (layout === "workspace") {
    return (
      <div className="adminFormStack adminEditorForm">
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

          <input type="hidden" name="image_url" value={form.image_url} readOnly />
          <input
            type="hidden"
            name="is_published"
            value={form.is_published ? "true" : "false"}
            readOnly
          />

          <div hidden={activeTab !== "overview"} className="adminEditorFormPanel">
            <h2 className="adminEditorPanelTitle">Overview</h2>
            <SpecTable title="Identity">
              <SpecInputRow label="Merke (katalog)">
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
              </SpecInputRow>
              <SpecInputRow label="Merkenavn *">
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
              </SpecInputRow>
              <SpecInputRow label="Modell *">
                <input
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  required
                  disabled={isPending}
                />
              </SpecInputRow>
              <SpecInputRow label="Variant">
                <input
                  value={form.variant}
                  onChange={(e) => updateField("variant", e.target.value)}
                  disabled={isPending}
                  placeholder="Long Range AWD"
                />
              </SpecInputRow>
              <SpecInputRow label="Trim">
                <input
                  value={form.trim_level}
                  onChange={(e) => updateField("trim_level", e.target.value)}
                  disabled={isPending}
                />
              </SpecInputRow>
              <SpecInputRow label="Generasjon">
                <input
                  value={form.model_generation}
                  onChange={(e) => updateField("model_generation", e.target.value)}
                  disabled={isPending}
                  placeholder="Juniper / MEB"
                />
              </SpecInputRow>
              <SpecInputRow label="Slug *">
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
              </SpecInputRow>
              <SpecInputRow label="Årsmodell">
                <input
                  inputMode="numeric"
                  value={form.year}
                  onChange={(e) => updateField("year", e.target.value)}
                  disabled={isPending}
                />
              </SpecInputRow>
              <SpecInputRow label="Kjøretøytype">
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
              </SpecInputRow>
              <SpecInputRow label="Karosseri">
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
              </SpecInputRow>
              <SpecInputRow label="Hero image URL">
                <input
                  value={form.image_url}
                  onChange={(e) => updateField("image_url", e.target.value)}
                  disabled={isPending}
                  placeholder="Managed in Images tab"
                />
              </SpecInputRow>
            </SpecTable>
          </div>

          <div hidden={activeTab !== "specifications"} className="adminEditorFormPanel">
            <h2 className="adminEditorPanelTitle">Specifications</h2>
            <div className="adminSpecTables">
              <SpecTable title="Price & range">
                <SpecInputRow label="Pris (NOK)">
                  <input inputMode="numeric" value={form.price_nok} onChange={(e) => updateField("price_nok", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Rekkevidde (km)">
                  <input inputMode="numeric" value={form.range_km} onChange={(e) => updateField("range_km", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Vinterrekkevidde (km)">
                  <input inputMode="numeric" value={form.winter_range_km} onChange={(e) => updateField("winter_range_km", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Real-world rekkevidde (km)">
                  <input inputMode="numeric" value={form.real_world_range_km} onChange={(e) => updateField("real_world_range_km", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Forbruk (kWh/100 km)">
                  <input inputMode="decimal" value={form.consumption_kwh_100km} onChange={(e) => updateField("consumption_kwh_100km", e.target.value)} disabled={isPending} />
                </SpecInputRow>
              </SpecTable>

              <SpecTable title="Battery">
                <SpecInputRow label="Batteri (kWh, legacy)">
                  <input inputMode="decimal" value={form.battery_kwh} onChange={(e) => updateField("battery_kwh", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Batteri totalt (kWh)">
                  <input inputMode="decimal" value={form.battery_total_kwh} onChange={(e) => updateField("battery_total_kwh", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Batteri brukbart (kWh)">
                  <input inputMode="decimal" value={form.battery_usable_kwh} onChange={(e) => updateField("battery_usable_kwh", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Batterikjemi">
                  <input value={form.battery_chemistry} onChange={(e) => updateField("battery_chemistry", e.target.value)} disabled={isPending} placeholder="NMC / LFP" />
                </SpecInputRow>
              </SpecTable>

              <SpecTable title="Charging">
                <SpecInputRow label="DC-lading (kW)">
                  <input inputMode="numeric" value={form.dc_charging_kw} onChange={(e) => updateField("dc_charging_kw", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="AC-lading (kW)">
                  <input inputMode="decimal" value={form.ac_charging_kw} onChange={(e) => updateField("ac_charging_kw", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Ladetid 10–80 % (min)">
                  <input inputMode="numeric" value={form.charge_time_10_80_minutes} onChange={(e) => updateField("charge_time_10_80_minutes", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="AC-kontakt">
                  <input value={form.charging_connector_ac} onChange={(e) => updateField("charging_connector_ac", e.target.value)} disabled={isPending} placeholder="Type 2" />
                </SpecInputRow>
                <SpecInputRow label="DC-kontakt">
                  <input value={form.charging_connector_dc} onChange={(e) => updateField("charging_connector_dc", e.target.value)} disabled={isPending} placeholder="CCS2 / NACS" />
                </SpecInputRow>
              </SpecTable>

              <SpecTable title="Performance">
                <SpecInputRow label="Drivlinje">
                  <select value={form.drivetrain} onChange={(e) => updateField("drivetrain", e.target.value)} disabled={isPending}>
                    <option value="">Velg drivlinje</option>
                    {DRIVETRAIN_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </SpecInputRow>
                <SpecInputRow label="Effekt (hk)">
                  <input inputMode="numeric" value={form.power_hp} onChange={(e) => updateField("power_hp", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Moment (Nm)">
                  <input inputMode="numeric" value={form.torque_nm} onChange={(e) => updateField("torque_nm", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="0–100 km/t (s)">
                  <input inputMode="decimal" value={form.acceleration_0_100} onChange={(e) => updateField("acceleration_0_100", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Toppfart (km/t)">
                  <input inputMode="numeric" value={form.top_speed_kmh} onChange={(e) => updateField("top_speed_kmh", e.target.value)} disabled={isPending} />
                </SpecInputRow>
              </SpecTable>

              <SpecTable title="Dimensions & practicality">
                <SpecInputRow label="Seter">
                  <input inputMode="numeric" value={form.seats} onChange={(e) => updateField("seats", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Bagasjerom (l)">
                  <input inputMode="numeric" value={form.cargo_l} onChange={(e) => updateField("cargo_l", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Frunk (l)">
                  <input inputMode="numeric" value={form.frunk_l} onChange={(e) => updateField("frunk_l", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Tilhengervekt (kg)">
                  <input inputMode="numeric" value={form.towing_kg} onChange={(e) => updateField("towing_kg", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Lengde (mm)">
                  <input inputMode="numeric" value={form.length_mm} onChange={(e) => updateField("length_mm", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Bredde (mm)">
                  <input inputMode="numeric" value={form.width_mm} onChange={(e) => updateField("width_mm", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Høyde (mm)">
                  <input inputMode="numeric" value={form.height_mm} onChange={(e) => updateField("height_mm", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Akselavstand (mm)">
                  <input inputMode="numeric" value={form.wheelbase_mm} onChange={(e) => updateField("wheelbase_mm", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Egenvekt (kg)">
                  <input inputMode="numeric" value={form.curb_weight_kg} onChange={(e) => updateField("curb_weight_kg", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Totalvekt (kg)">
                  <input inputMode="numeric" value={form.gross_weight_kg} onChange={(e) => updateField("gross_weight_kg", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Garanti">
                  <input value={form.warranty} onChange={(e) => updateField("warranty", e.target.value)} disabled={isPending} placeholder="f.eks. 5 år / 100 000 km" />
                </SpecInputRow>
              </SpecTable>

              <SpecTable title="Equipment">
                <SpecInputRow label="Varmepumpe">
                  <BoolSelectBare value={form.heat_pump} disabled={isPending} onChange={(value) => updateField("heat_pump", value)} />
                </SpecInputRow>
                <SpecInputRow label="V2L">
                  <BoolSelectBare value={form.v2l} disabled={isPending} onChange={(value) => updateField("v2l", value)} />
                </SpecInputRow>
                <SpecInputRow label="V2G">
                  <BoolSelectBare value={form.v2g} disabled={isPending} onChange={(value) => updateField("v2g", value)} />
                </SpecInputRow>
                <SpecInputRow label="Apple CarPlay">
                  <BoolSelectBare value={form.apple_carplay} disabled={isPending} onChange={(value) => updateField("apple_carplay", value)} />
                </SpecInputRow>
                <SpecInputRow label="Android Auto">
                  <BoolSelectBare value={form.android_auto} disabled={isPending} onChange={(value) => updateField("android_auto", value)} />
                </SpecInputRow>
                <SpecInputRow label="Head-up display">
                  <BoolSelectBare value={form.head_up_display} disabled={isPending} onChange={(value) => updateField("head_up_display", value)} />
                </SpecInputRow>
                <SpecInputRow label="Panoramatak">
                  <BoolSelectBare value={form.panoramic_roof} disabled={isPending} onChange={(value) => updateField("panoramic_roof", value)} />
                </SpecInputRow>
                <SpecInputRow label="OTA-oppdateringer">
                  <BoolSelectBare value={form.ota_updates} disabled={isPending} onChange={(value) => updateField("ota_updates", value)} />
                </SpecInputRow>
              </SpecTable>
            </div>
          </div>

          <div hidden={activeTab !== "editorial"} className="adminEditorFormPanel">
            <h2 className="adminEditorPanelTitle">Editorial</h2>
            <div className="adminEditorEditorialFields">
              <label className="authField">
                <span>Beskrivelse</span>
                <textarea rows={6} value={form.description} onChange={(e) => updateField("description", e.target.value)} disabled={isPending} />
              </label>
              <label className="authField">
                <span>Fordeler (én per linje)</span>
                <textarea rows={3} value={form.pros} onChange={(e) => updateField("pros", e.target.value)} disabled={isPending} />
              </label>
              <label className="authField">
                <span>Ulemper (én per linje)</span>
                <textarea rows={3} value={form.cons} onChange={(e) => updateField("cons", e.target.value)} disabled={isPending} />
              </label>
              <label className="authField">
                <span>Passer for (én per linje)</span>
                <textarea rows={2} value={form.suitable_for} onChange={(e) => updateField("suitable_for", e.target.value)} disabled={isPending} />
              </label>
            </div>

            <SpecTable title="EVFAKTA Score (0–10)">
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
                <SpecInputRow key={key} label={label}>
                  <input
                    inputMode="decimal"
                    value={form[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                    disabled={isPending}
                    placeholder="0–10"
                  />
                </SpecInputRow>
              ))}
            </SpecTable>

            <div className="adminEditorEditorialFields">
              <label className="authField">
                <span>Score-merknader</span>
                <textarea rows={3} value={form.score_notes} onChange={(e) => updateField("score_notes", e.target.value)} disabled={isPending} />
              </label>
              <label className="authField">
                <span>Score-metodikk (offentlig)</span>
                <textarea rows={3} value={form.score_methodology} onChange={(e) => updateField("score_methodology", e.target.value)} disabled={isPending} />
              </label>
            </div>
          </div>

          <div hidden={activeTab !== "sources"} className="adminEditorFormPanel">
            <h2 className="adminEditorPanelTitle">Sources</h2>
            <table className="adminEditorTable adminSpecTable">
              <thead>
                <tr>
                  <th scope="col">Field</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                <SpecInputRow label="Kildenavn">
                  <input value={form.source_name} onChange={(e) => updateField("source_name", e.target.value)} disabled={isPending} placeholder="f.eks. Tesla Norge" />
                </SpecInputRow>
                <SpecInputRow label="Kilde-URL">
                  <input type="url" value={form.source_url} onChange={(e) => updateField("source_url", e.target.value)} disabled={isPending} placeholder="https://..." />
                </SpecInputRow>
                <SpecInputRow label="Kilde oppdatert">
                  <input type="datetime-local" value={form.source_updated_at} onChange={(e) => updateField("source_updated_at", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Sist sjekket">
                  <input type="datetime-local" value={form.data_last_checked_at} onChange={(e) => updateField("data_last_checked_at", e.target.value)} disabled={isPending} />
                </SpecInputRow>
                <SpecInputRow label="Gjennomgangsstatus">
                  <select value={form.import_status} onChange={(e) => updateField("import_status", e.target.value)} disabled={isPending}>
                    {IMPORT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {IMPORT_STATUS_LABELS[status as ImportStatus]}
                      </option>
                    ))}
                  </select>
                </SpecInputRow>
                <SpecInputRow label="Importmerknader">
                  <textarea rows={3} value={form.import_notes} onChange={(e) => updateField("import_notes", e.target.value)} disabled={isPending} />
                </SpecInputRow>
              </tbody>
            </table>
          </div>

          <div className="adminFormActions adminEditorFormActions">
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
            <span>Variant</span>
            <input
              value={form.variant}
              onChange={(e) => updateField("variant", e.target.value)}
              disabled={isPending}
              placeholder="Long Range AWD"
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
            <span>Generasjon</span>
            <input
              value={form.model_generation}
              onChange={(e) => updateField("model_generation", e.target.value)}
              disabled={isPending}
              placeholder="Juniper / MEB"
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
            <span>Batteri (kWh, legacy)</span>
            <input
              inputMode="decimal"
              value={form.battery_kwh}
              onChange={(e) => updateField("battery_kwh", e.target.value)}
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
            <span>Batterikjemi</span>
            <input
              value={form.battery_chemistry}
              onChange={(e) => updateField("battery_chemistry", e.target.value)}
              disabled={isPending}
              placeholder="NMC / LFP"
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
            <span>Ladetid 10–80 % (min)</span>
            <input
              inputMode="numeric"
              value={form.charge_time_10_80_minutes}
              onChange={(e) => updateField("charge_time_10_80_minutes", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>AC-kontakt</span>
            <input
              value={form.charging_connector_ac}
              onChange={(e) => updateField("charging_connector_ac", e.target.value)}
              disabled={isPending}
              placeholder="Type 2"
            />
          </label>

          <label className="authField">
            <span>DC-kontakt</span>
            <input
              value={form.charging_connector_dc}
              onChange={(e) => updateField("charging_connector_dc", e.target.value)}
              disabled={isPending}
              placeholder="CCS2 / NACS"
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
            <span>Frunk (l)</span>
            <input
              inputMode="numeric"
              value={form.frunk_l}
              onChange={(e) => updateField("frunk_l", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Lengde (mm)</span>
            <input
              inputMode="numeric"
              value={form.length_mm}
              onChange={(e) => updateField("length_mm", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Bredde (mm)</span>
            <input
              inputMode="numeric"
              value={form.width_mm}
              onChange={(e) => updateField("width_mm", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Høyde (mm)</span>
            <input
              inputMode="numeric"
              value={form.height_mm}
              onChange={(e) => updateField("height_mm", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField">
            <span>Akselavstand (mm)</span>
            <input
              inputMode="numeric"
              value={form.wheelbase_mm}
              onChange={(e) => updateField("wheelbase_mm", e.target.value)}
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
            <span>Totalvekt (kg)</span>
            <input
              inputMode="numeric"
              value={form.gross_weight_kg}
              onChange={(e) => updateField("gross_weight_kg", e.target.value)}
              disabled={isPending}
            />
          </label>

          <BoolSelect
            label="Varmepumpe"
            value={form.heat_pump}
            disabled={isPending}
            onChange={(value) => updateField("heat_pump", value)}
          />
          <BoolSelect
            label="V2L"
            value={form.v2l}
            disabled={isPending}
            onChange={(value) => updateField("v2l", value)}
          />
          <BoolSelect
            label="V2G"
            value={form.v2g}
            disabled={isPending}
            onChange={(value) => updateField("v2g", value)}
          />
          <BoolSelect
            label="Apple CarPlay"
            value={form.apple_carplay}
            disabled={isPending}
            onChange={(value) => updateField("apple_carplay", value)}
          />
          <BoolSelect
            label="Android Auto"
            value={form.android_auto}
            disabled={isPending}
            onChange={(value) => updateField("android_auto", value)}
          />
          <BoolSelect
            label="Head-up display"
            value={form.head_up_display}
            disabled={isPending}
            onChange={(value) => updateField("head_up_display", value)}
          />
          <BoolSelect
            label="Panoramatak"
            value={form.panoramic_roof}
            disabled={isPending}
            onChange={(value) => updateField("panoramic_roof", value)}
          />
          <BoolSelect
            label="OTA-oppdateringer"
            value={form.ota_updates}
            disabled={isPending}
            onChange={(value) => updateField("ota_updates", value)}
          />

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
            <span>Fordeler (én per linje)</span>
            <textarea
              rows={3}
              value={form.pros}
              onChange={(e) => updateField("pros", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField adminFormFull">
            <span>Ulemper (én per linje)</span>
            <textarea
              rows={3}
              value={form.cons}
              onChange={(e) => updateField("cons", e.target.value)}
              disabled={isPending}
            />
          </label>

          <label className="authField adminFormFull">
            <span>Passer for (én per linje)</span>
            <textarea
              rows={2}
              value={form.suitable_for}
              onChange={(e) => updateField("suitable_for", e.target.value)}
              disabled={isPending}
              placeholder="Familie&#10;Pendling&#10;Tilhenger"
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
