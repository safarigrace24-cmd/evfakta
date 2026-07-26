import type { AdminCar } from "@/lib/admin/types";

export const EDITORIAL_DRAFT_MARKER = "Draft – Requires editor review.";

/** Car columns the assistant may fill when currently empty. */
export const ASSIST_FILLABLE_FIELDS = [
  "battery_kwh",
  "battery_total_kwh",
  "battery_usable_kwh",
  "battery_chemistry",
  "range_km",
  "winter_range_km",
  "real_world_range_km",
  "consumption_kwh_100km",
  "dc_charging_kw",
  "ac_charging_kw",
  "charge_time_10_80_minutes",
  "charging_connector_ac",
  "charging_connector_dc",
  "drivetrain",
  "power_hp",
  "torque_nm",
  "acceleration_0_100",
  "top_speed_kmh",
  "length_mm",
  "width_mm",
  "height_mm",
  "wheelbase_mm",
  "curb_weight_kg",
  "gross_weight_kg",
  "cargo_l",
  "frunk_l",
  "seats",
  "towing_kg",
  "vehicle_type",
  "body_style",
  "warranty",
  "heat_pump",
  "description",
  "pros",
  "cons",
  "suitable_for",
  "source_name",
  "source_url",
  "variant",
  "trim_level",
] as const;

export type AssistFillableField = (typeof ASSIST_FILLABLE_FIELDS)[number];

export function isEmptyCarValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return !value.trim();
  if (Array.isArray(value)) {
    return (
      value.length === 0 ||
      !value.some((item) => String(item ?? "").trim().length > 0)
    );
  }
  if (typeof value === "number") return !Number.isFinite(value);
  return false;
}

/**
 * Build editorial drafts from known catalog facts only.
 * Always marked as requiring editor review.
 */
export function generateEditorialDrafts(car: AdminCar): {
  description: string;
  pros: string[];
  cons: string[];
  suitable_for: string[];
} {
  const facts: string[] = [];
  if (car.range_km) facts.push(`WLTP-rekkevidde ${car.range_km} km`);
  if (car.battery_usable_kwh || car.battery_total_kwh || car.battery_kwh) {
    const kwh =
      car.battery_usable_kwh ?? car.battery_total_kwh ?? car.battery_kwh;
    facts.push(`batteri ${kwh} kWh`);
  }
  if (car.dc_charging_kw) facts.push(`DC-lading opptil ${car.dc_charging_kw} kW`);
  if (car.drivetrain) facts.push(car.drivetrain);
  if (car.seats) facts.push(`${car.seats} seter`);
  if (car.cargo_l) facts.push(`bagasje ${car.cargo_l} liter`);

  const factSentence = facts.length
    ? ` Kjente tall i katalogen: ${facts.join(", ")}.`
    : " Spesifikasjoner er under redaksjonell gjennomgang.";

  const description = [
    EDITORIAL_DRAFT_MARKER,
    "",
    `${car.brand} ${car.model} er en elbil i EVFAKTA-katalogen.${factSentence}`,
    "Teksten er et utkast og må redigeres før publisering.",
  ].join("\n");

  const pros: string[] = [EDITORIAL_DRAFT_MARKER];
  if (car.range_km && car.range_km >= 400) {
    pros.push("Solid WLTP-rekkevidde for norsk bruk");
  }
  if (car.dc_charging_kw && car.dc_charging_kw >= 150) {
    pros.push("Rask DC-hurtiglading");
  }
  if (car.seats && car.seats >= 5) {
    pros.push("Plass til familie");
  }
  if (pros.length === 1) {
    pros.push("Elektrisk drift uten lokale utslipp");
  }

  const cons: string[] = [EDITORIAL_DRAFT_MARKER];
  if (isEmptyCarValue(car.towing_kg)) {
    cons.push("Tilhengervekt ikke bekreftet i katalogdata");
  }
  if (isEmptyCarValue(car.real_world_range_km)) {
    cons.push("Reell rekkevidde ikke dokumentert ennå");
  }
  if (cons.length === 1) {
    cons.push("Redaksjonell vurdering mangler — fyll inn etter manuell sjekk");
  }

  const suitable_for: string[] = [EDITORIAL_DRAFT_MARKER, "Daglig pendling"];
  if (car.seats && car.seats >= 5) suitable_for.push("Familiebruk");
  if (car.range_km && car.range_km >= 450) suitable_for.push("Lengre turer");
  if (car.cargo_l && car.cargo_l >= 400) suitable_for.push("Praktisk hverdag");

  return { description, pros, cons, suitable_for };
}

/** Decide whether a researched value may be written onto the car. */
export function shouldFillField(input: {
  fieldKey: string;
  currentValue: unknown;
  proposedValue: unknown;
  hasConflict: boolean;
}): "fill" | "skip_existing" | "skip_conflict" | "skip_empty" | "skip_not_fillable" {
  if (!(ASSIST_FILLABLE_FIELDS as readonly string[]).includes(input.fieldKey)) {
    return "skip_not_fillable";
  }
  if (input.hasConflict) return "skip_conflict";
  if (input.proposedValue == null || input.proposedValue === "") {
    return "skip_empty";
  }
  if (!isEmptyCarValue(input.currentValue)) return "skip_existing";
  return "fill";
}
