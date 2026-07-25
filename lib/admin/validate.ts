import {
  ADMIN_MESSAGES,
  BODY_STYLE_OPTIONS,
  DRIVETRAIN_OPTIONS,
  IMPORT_STATUS_OPTIONS,
  SLUG_PATTERN,
  VEHICLE_TYPE_OPTIONS,
  type AdminCarInput,
  type AdminCarWrite,
  type ImportStatus,
} from "@/lib/admin/types";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalInt(value: string, label: string): { ok: true; value: number | null } | { ok: false; error: string } {
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

export function validateAdminCarInput(
  input: AdminCarInput,
): { ok: true; data: AdminCarWrite } | { ok: false; error: string } {
  const brand = input.brand.trim();
  const model = input.model.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!brand) return { ok: false, error: "Merke er påkrevd." };
  if (!model) return { ok: false, error: "Modell er påkrevd." };
  if (!slug) return { ok: false, error: "Slug er påkrevd." };
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      error: "Slug må være små bokstaver, tall og bindestrek (f.eks. tesla-model-y).",
    };
  }

  const year = parseOptionalInt(input.year, "Årsmodell");
  if (!year.ok) return year;

  const price = parseOptionalInt(input.price_nok, "Pris");
  if (!price.ok) return price;

  const range = parseOptionalInt(input.range_km, "Rekkevidde");
  if (!range.ok) return range;

  const battery = parseOptionalNumber(input.battery_kwh, "Batteri");
  if (!battery.ok) return battery;

  const dc = parseOptionalInt(input.dc_charging_kw, "DC-lading");
  if (!dc.ok) return dc;

  const consumption = parseOptionalNumber(input.consumption_kwh_100km, "Forbruk");
  if (!consumption.ok) return consumption;

  const power = parseOptionalInt(input.power_hp, "Effekt");
  if (!power.ok) return power;

  const torque = parseOptionalInt(input.torque_nm, "Moment");
  if (!torque.ok) return torque;

  const acceleration = parseOptionalNumber(input.acceleration_0_100, "0–100");
  if (!acceleration.ok) return acceleration;

  const topSpeed = parseOptionalInt(input.top_speed_kmh, "Toppfart");
  if (!topSpeed.ok) return topSpeed;

  const seats = parseOptionalInt(input.seats, "Seter");
  if (!seats.ok) return seats;

  const cargo = parseOptionalInt(input.cargo_l, "Bagasjerom");
  if (!cargo.ok) return cargo;

  const towing = parseOptionalInt(input.towing_kg, "Tilhengervekt");
  if (!towing.ok) return towing;

  const ac = parseOptionalNumber(input.ac_charging_kw, "AC-lading");
  if (!ac.ok) return ac;

  const sourceUpdated = parseOptionalTimestamptz(input.source_updated_at, "Kilde oppdatert");
  if (!sourceUpdated.ok) return sourceUpdated;

  const lastChecked = parseOptionalTimestamptz(input.data_last_checked_at, "Sist sjekket");
  if (!lastChecked.ok) return lastChecked;

  const drivetrain = emptyToNull(input.drivetrain);
  if (
    drivetrain &&
    !(DRIVETRAIN_OPTIONS as readonly string[]).includes(drivetrain)
  ) {
    return { ok: false, error: "Ugyldig drivlinje." };
  }

  const vehicleType = emptyToNull(input.vehicle_type);
  if (
    vehicleType &&
    !(VEHICLE_TYPE_OPTIONS as readonly string[]).includes(vehicleType)
  ) {
    return { ok: false, error: "Ugyldig kjøretøytype." };
  }

  const bodyStyle = emptyToNull(input.body_style);
  if (
    bodyStyle &&
    !(BODY_STYLE_OPTIONS as readonly string[]).includes(bodyStyle)
  ) {
    return { ok: false, error: "Ugyldig karosseri." };
  }

  const importStatusRaw = (input.import_status || "draft").trim().toLowerCase();
  if (!(IMPORT_STATUS_OPTIONS as readonly string[]).includes(importStatusRaw)) {
    return { ok: false, error: "Ugyldig gjennomgangsstatus." };
  }
  const import_status = importStatusRaw as ImportStatus;

  const imageUrl = emptyToNull(input.image_url);
  if (imageUrl && !imageUrl.startsWith("/")) {
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { ok: false, error: "Bildebane må være en gyldig http(s)-URL eller relativ sti." };
      }
    } catch {
      return { ok: false, error: "Bildebane må være en gyldig URL eller relativ sti." };
    }
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
      brand,
      model,
      slug,
      year: year.value,
      price_nok: price.value,
      range_km: range.value,
      battery_kwh: battery.value,
      dc_charging_kw: dc.value,
      drivetrain,
      image_url: imageUrl,
      description: emptyToNull(input.description),
      is_published: Boolean(input.is_published),
      consumption_kwh_100km: consumption.value,
      power_hp: power.value,
      torque_nm: torque.value,
      acceleration_0_100: acceleration.value,
      top_speed_kmh: topSpeed.value,
      seats: seats.value,
      cargo_l: cargo.value,
      towing_kg: towing.value,
      warranty: emptyToNull(input.warranty),
      ac_charging_kw: ac.value,
      vehicle_type: vehicleType,
      body_style: bodyStyle,
      source_url: sourceUrl,
      source_name: emptyToNull(input.source_name),
      source_updated_at: sourceUpdated.value,
      data_last_checked_at: lastChecked.value,
      import_status,
      import_notes: emptyToNull(input.import_notes),
    },
  };
}

export function mapAdminDbError(error: { code?: string; message?: string } | null): string {
  if (!error) return ADMIN_MESSAGES.genericError;
  if (error.code === "23505") return ADMIN_MESSAGES.slugTaken;
  console.error("[admin] database error:", {
    code: error.code,
    message: error.message,
  });
  return ADMIN_MESSAGES.genericError;
}
