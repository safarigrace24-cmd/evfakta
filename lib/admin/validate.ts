import {
  emptyToNull,
  parseOptionalBoolean,
  parseTextList,
} from "@/lib/admin/field-parsers";
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

function parseOptionalScore(
  value: string,
  label: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const parsed = parseOptionalNumber(value, label);
  if (!parsed.ok) return parsed;
  if (parsed.value == null) return parsed;
  if (parsed.value < 0 || parsed.value > 10) {
    return { ok: false, error: `${label} må være mellom 0 og 10.` };
  }
  return parsed;
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

  const batteryTotal = parseOptionalNumber(input.battery_total_kwh, "Batteri totalt");
  if (!batteryTotal.ok) return batteryTotal;

  const batteryUsable = parseOptionalNumber(input.battery_usable_kwh, "Batteri brukbart");
  if (!batteryUsable.ok) return batteryUsable;

  const winterRange = parseOptionalInt(input.winter_range_km, "Vinterrekkevidde");
  if (!winterRange.ok) return winterRange;

  const realWorldRange = parseOptionalInt(input.real_world_range_km, "Real-world rekkevidde");
  if (!realWorldRange.ok) return realWorldRange;

  const charge1080 = parseOptionalInt(input.charge_time_10_80_minutes, "Ladetid 10–80");
  if (!charge1080.ok) return charge1080;

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

  const lengthMm = parseOptionalInt(input.length_mm, "Lengde");
  if (!lengthMm.ok) return lengthMm;
  const widthMm = parseOptionalInt(input.width_mm, "Bredde");
  if (!widthMm.ok) return widthMm;
  const heightMm = parseOptionalInt(input.height_mm, "Høyde");
  if (!heightMm.ok) return heightMm;
  const wheelbaseMm = parseOptionalInt(input.wheelbase_mm, "Akselavstand");
  if (!wheelbaseMm.ok) return wheelbaseMm;
  const curbWeight = parseOptionalInt(input.curb_weight_kg, "Egenvekt");
  if (!curbWeight.ok) return curbWeight;
  const grossWeight = parseOptionalInt(input.gross_weight_kg, "Totalvekt");
  if (!grossWeight.ok) return grossWeight;
  const frunk = parseOptionalInt(input.frunk_l, "Frunk");
  if (!frunk.ok) return frunk;

  const heatPump = parseOptionalBoolean(input.heat_pump, "Varmepumpe");
  if (!heatPump.ok) return heatPump;
  const v2l = parseOptionalBoolean(input.v2l, "V2L");
  if (!v2l.ok) return v2l;
  const v2g = parseOptionalBoolean(input.v2g, "V2G");
  if (!v2g.ok) return v2g;
  const appleCarplay = parseOptionalBoolean(input.apple_carplay, "Apple CarPlay");
  if (!appleCarplay.ok) return appleCarplay;
  const androidAuto = parseOptionalBoolean(input.android_auto, "Android Auto");
  if (!androidAuto.ok) return androidAuto;
  const headUpDisplay = parseOptionalBoolean(input.head_up_display, "Head-up display");
  if (!headUpDisplay.ok) return headUpDisplay;
  const panoramicRoof = parseOptionalBoolean(input.panoramic_roof, "Panoramatak");
  if (!panoramicRoof.ok) return panoramicRoof;
  const otaUpdates = parseOptionalBoolean(input.ota_updates, "OTA-oppdateringer");
  if (!otaUpdates.ok) return otaUpdates;

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

  if (import_status === "approved") {
    if (!vehicleType) {
      return {
        ok: false,
        error: "Godkjente biler må ha kjøretøytype (ikke «Velg type»).",
      };
    }
    if (!bodyStyle) {
      return {
        ok: false,
        error: "Godkjente biler må ha karosseri (ikke «Velg karosseri»).",
      };
    }
    if (!drivetrain) {
      return {
        ok: false,
        error: "Godkjente biler må ha drivlinje (ikke «Velg drivlinje»).",
      };
    }
  }

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

  const brandIdRaw = (input.brand_id ?? "").trim();
  const brand_id = brandIdRaw || null;

  const rangeScore = parseOptionalScore(input.range_score, "Rekkevidde-score");
  if (!rangeScore.ok) return rangeScore;
  const chargingScore = parseOptionalScore(input.charging_score, "Lade-score");
  if (!chargingScore.ok) return chargingScore;
  const winterScore = parseOptionalScore(input.winter_score, "Vinter-score");
  if (!winterScore.ok) return winterScore;
  const comfortScore = parseOptionalScore(input.comfort_score, "Komfort-score");
  if (!comfortScore.ok) return comfortScore;
  const spaceScore = parseOptionalScore(input.space_score, "Plass-score");
  if (!spaceScore.ok) return spaceScore;
  const valueScore = parseOptionalScore(input.value_score, "Verdi-score");
  if (!valueScore.ok) return valueScore;
  const reliabilityScore = parseOptionalScore(
    input.reliability_score,
    "Pålitelighets-score",
  );
  if (!reliabilityScore.ok) return reliabilityScore;
  const overallScore = parseOptionalScore(input.overall_score, "Totalscore");
  if (!overallScore.ok) return overallScore;

  return {
    ok: true,
    data: {
      brand,
      brand_id,
      model,
      slug,
      variant: emptyToNull(input.variant),
      trim_level: emptyToNull(input.trim_level),
      model_generation: emptyToNull(input.model_generation),
      year: year.value,
      price_nok: price.value,
      range_km: range.value,
      battery_kwh: battery.value,
      battery_total_kwh: batteryTotal.value,
      battery_usable_kwh: batteryUsable.value,
      battery_chemistry: emptyToNull(input.battery_chemistry),
      winter_range_km: winterRange.value,
      real_world_range_km: realWorldRange.value,
      dc_charging_kw: dc.value,
      charge_time_10_80_minutes: charge1080.value,
      charging_connector_ac: emptyToNull(input.charging_connector_ac),
      charging_connector_dc: emptyToNull(input.charging_connector_dc),
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
      length_mm: lengthMm.value,
      width_mm: widthMm.value,
      height_mm: heightMm.value,
      wheelbase_mm: wheelbaseMm.value,
      curb_weight_kg: curbWeight.value,
      gross_weight_kg: grossWeight.value,
      frunk_l: frunk.value,
      heat_pump: heatPump.value,
      v2l: v2l.value,
      v2g: v2g.value,
      apple_carplay: appleCarplay.value,
      android_auto: androidAuto.value,
      head_up_display: headUpDisplay.value,
      panoramic_roof: panoramicRoof.value,
      ota_updates: otaUpdates.value,
      pros: parseTextList(input.pros),
      cons: parseTextList(input.cons),
      suitable_for: parseTextList(input.suitable_for),
      source_url: sourceUrl,
      source_name: emptyToNull(input.source_name),
      source_updated_at: sourceUpdated.value,
      data_last_checked_at: lastChecked.value,
      import_status,
      import_notes: emptyToNull(input.import_notes),
      range_score: rangeScore.value,
      charging_score: chargingScore.value,
      winter_score: winterScore.value,
      comfort_score: comfortScore.value,
      space_score: spaceScore.value,
      value_score: valueScore.value,
      reliability_score: reliabilityScore.value,
      overall_score: overallScore.value,
      score_notes: emptyToNull(input.score_notes),
      score_methodology: emptyToNull(input.score_methodology),
    },
  };
}

export function mapAdminDbError(error: { code?: string; message?: string } | null): string {
  if (!error) return ADMIN_MESSAGES.genericError;
  if (error.code === "23505") return ADMIN_MESSAGES.slugTaken;
  if (error.code === "23503") {
    return "Valgt merke finnes ikke. Oppdater merkevalget og prøv igjen.";
  }
  console.error("[admin] database error:", {
    code: error.code,
    message: error.message,
  });
  return ADMIN_MESSAGES.genericError;
}
