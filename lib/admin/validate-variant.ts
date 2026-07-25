import { emptyToNull } from "@/lib/admin/field-parsers";
import {
  DRIVETRAIN_OPTIONS,
  IMPORT_STATUS_OPTIONS,
  SLUG_PATTERN,
  type ImportStatus,
} from "@/lib/admin/types";
import {
  VARIANT_MESSAGES,
  type AdminCarVariantInput,
  type AdminCarVariantWrite,
} from "@/lib/admin/variant-types";

function parseOptionalInt(
  value: string,
  label: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: `${label} må være et heltall.` };
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `${label} er ugyldig.` };
  }
  return { ok: true, value: parsed };
}

function parseOptionalNumber(
  value: string,
  label: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return { ok: true, value: null };
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, error: `${label} må være et gyldig tall.` };
  }
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `${label} er ugyldig.` };
  }
  return { ok: true, value: parsed };
}

function parseOptionalTimestamptz(
  value: string,
  label: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: `${label} er ugyldig dato.` };
  }
  return { ok: true, value: date.toISOString() };
}

export function validateAdminCarVariantInput(
  input: AdminCarVariantInput,
): { ok: true; data: AdminCarVariantWrite } | { ok: false; error: string } {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!name) return { ok: false, error: "Variantnavn er påkrevd." };
  if (!slug) return { ok: false, error: "Variant-slug er påkrevd." };
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      error: "Variant-slug må være små bokstaver, tall og bindestrek.",
    };
  }

  const modelYear = parseOptionalInt(input.model_year, "Årsmodell");
  if (!modelYear.ok) return modelYear;
  const price = parseOptionalInt(input.price_nok, "Pris");
  if (!price.ok) return price;
  const batteryTotal = parseOptionalNumber(input.battery_total_kwh, "Batteri totalt");
  if (!batteryTotal.ok) return batteryTotal;
  const batteryUsable = parseOptionalNumber(input.battery_usable_kwh, "Batteri brukbart");
  if (!batteryUsable.ok) return batteryUsable;
  const range = parseOptionalInt(input.range_km, "Rekkevidde");
  if (!range.ok) return range;
  const winterRange = parseOptionalInt(input.winter_range_km, "Vinterrekkevidde");
  if (!winterRange.ok) return winterRange;
  const realWorld = parseOptionalInt(input.real_world_range_km, "Real-world rekkevidde");
  if (!realWorld.ok) return realWorld;
  const consumption = parseOptionalNumber(input.consumption_kwh_100km, "Forbruk");
  if (!consumption.ok) return consumption;
  const ac = parseOptionalNumber(input.ac_charging_kw, "AC-lading");
  if (!ac.ok) return ac;
  const dc = parseOptionalInt(input.dc_charging_kw, "DC-lading");
  if (!dc.ok) return dc;
  const charge1080 = parseOptionalInt(input.charge_time_10_80_minutes, "Ladetid 10–80");
  if (!charge1080.ok) return charge1080;
  const power = parseOptionalInt(input.power_hp, "Effekt");
  if (!power.ok) return power;
  const torque = parseOptionalInt(input.torque_nm, "Moment");
  if (!torque.ok) return torque;
  const accel = parseOptionalNumber(input.acceleration_0_100, "0–100");
  if (!accel.ok) return accel;
  const topSpeed = parseOptionalInt(input.top_speed_kmh, "Toppfart");
  if (!topSpeed.ok) return topSpeed;
  const towing = parseOptionalInt(input.towing_kg, "Tilhengervekt");
  if (!towing.ok) return towing;
  const curb = parseOptionalInt(input.curb_weight_kg, "Egenvekt");
  if (!curb.ok) return curb;
  const checked = parseOptionalTimestamptz(input.data_last_checked_at, "Sist sjekket");
  if (!checked.ok) return checked;

  const drivetrain = emptyToNull(input.drivetrain);
  if (drivetrain && !(DRIVETRAIN_OPTIONS as readonly string[]).includes(drivetrain)) {
    return { ok: false, error: "Ugyldig drivlinje." };
  }

  const importStatusRaw = (input.import_status || "needs_review").trim().toLowerCase();
  if (!(IMPORT_STATUS_OPTIONS as readonly string[]).includes(importStatusRaw)) {
    return { ok: false, error: "Ugyldig gjennomgangsstatus." };
  }

  const sourceUrl = emptyToNull(input.source_url);
  if (sourceUrl && !sourceUrl.startsWith("/")) {
    try {
      const url = new URL(sourceUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { ok: false, error: "Kilde-URL må være en gyldig http(s)-URL." };
      }
    } catch {
      return { ok: false, error: "Kilde-URL må være en gyldig URL." };
    }
  }

  return {
    ok: true,
    data: {
      name,
      slug,
      trim_level: emptyToNull(input.trim_level),
      model_year: modelYear.value,
      price_nok: price.value,
      battery_total_kwh: batteryTotal.value,
      battery_usable_kwh: batteryUsable.value,
      range_km: range.value,
      winter_range_km: winterRange.value,
      real_world_range_km: realWorld.value,
      consumption_kwh_100km: consumption.value,
      ac_charging_kw: ac.value,
      dc_charging_kw: dc.value,
      charge_time_10_80_minutes: charge1080.value,
      drivetrain,
      power_hp: power.value,
      torque_nm: torque.value,
      acceleration_0_100: accel.value,
      top_speed_kmh: topSpeed.value,
      towing_kg: towing.value,
      curb_weight_kg: curb.value,
      is_default: Boolean(input.is_default),
      is_active: Boolean(input.is_active),
      source_name: emptyToNull(input.source_name),
      source_url: sourceUrl,
      data_last_checked_at: checked.value,
      import_status: importStatusRaw as ImportStatus,
      import_notes: emptyToNull(input.import_notes),
    },
  };
}

export function mapVariantDbError(error: { code?: string; message?: string } | null): string {
  if (!error) return VARIANT_MESSAGES.genericError;
  if (error.code === "23505") return VARIANT_MESSAGES.slugTaken;
  console.error("[admin] variant database error:", {
    code: error.code,
    message: error.message,
  });
  return VARIANT_MESSAGES.genericError;
}
