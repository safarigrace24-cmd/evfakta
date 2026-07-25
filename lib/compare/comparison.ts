import type { Car } from "@/data/cars";
import { applyVariantToCar, resolveVariantSlug } from "@/lib/cars/variants";

export type CompareDirection = "higher" | "lower" | "none";

export type CompareRow = {
  key: string;
  label: string;
  values: Array<string | number | null>;
  numericValues: Array<number | null>;
  direction: CompareDirection;
  bestIndexes: number[];
};

/** Compare selection: car slug, optional variant slug (`slug` or `slug:variant`). */
export type CompareSelection = {
  slug: string;
  variantSlug: string | null;
};

function num(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value === 0) return value === 0 ? 0 : null;
  return value;
}

/** Treat 0 price/range/battery as missing for highlight purposes. */
function meaningful(value: number | null, key: string): number | null {
  if (value == null) return null;
  if (["priceNok", "rangeKm", "batteryKwh", "dcKw"].includes(key) && value <= 0) {
    return null;
  }
  return value;
}

function bestIndexes(
  values: Array<number | null>,
  direction: CompareDirection,
): number[] {
  if (direction === "none") return [];
  const present = values
    .map((value, index) => ({ value, index }))
    .filter((entry) => entry.value != null) as Array<{ value: number; index: number }>;
  if (present.length < 2) return [];
  const target =
    direction === "higher"
      ? Math.max(...present.map((entry) => entry.value))
      : Math.min(...present.map((entry) => entry.value));
  return present.filter((entry) => entry.value === target).map((entry) => entry.index);
}

function formatValue(value: string | number | null): string {
  if (value == null || value === "") return "—";
  return String(value);
}

export function parseCompareToken(token: string): CompareSelection | null {
  const trimmed = token.trim().toLowerCase();
  if (!trimmed) return null;
  const colon = trimmed.indexOf(":");
  if (colon === -1) {
    return { slug: trimmed, variantSlug: null };
  }
  const slug = trimmed.slice(0, colon).trim();
  const variantSlug = trimmed.slice(colon + 1).trim() || null;
  if (!slug) return null;
  return { slug, variantSlug };
}

export function formatCompareToken(selection: CompareSelection): string {
  if (selection.variantSlug) {
    return `${selection.slug}:${selection.variantSlug}`;
  }
  return selection.slug;
}

export function selectionKey(selection: CompareSelection): string {
  return formatCompareToken(selection);
}

export function parseCompareSelections(
  raw: string | string[] | undefined,
): CompareSelection[] {
  if (!raw) return [];
  const value = Array.isArray(raw) ? raw.join(",") : raw;
  const parsed = value
    .split(",")
    .map(parseCompareToken)
    .filter((item): item is CompareSelection => Boolean(item));

  const unique: CompareSelection[] = [];
  const seen = new Set<string>();
  for (const item of parsed) {
    const key = selectionKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= 3) break;
  }
  return unique;
}

/** Backwards-compatible: returns car slugs only (first occurrence). */
export function parseCompareSlugs(raw: string | string[] | undefined): string[] {
  return parseCompareSelections(raw).map((item) => item.slug);
}

export function buildCompareHref(
  selections: Array<string | CompareSelection>,
): string {
  if (selections.length === 0) return "/sammenlign";
  const tokens = selections.map((item) =>
    typeof item === "string" ? item : formatCompareToken(item),
  );
  return `/sammenlign?biler=${encodeURIComponent(tokens.join(","))}`;
}

export function resolveCompareCars(
  cars: Car[],
  selections: CompareSelection[],
): Car[] {
  return selections
    .map((selection) => {
      const base = cars.find((car) => car.slug === selection.slug);
      if (!base) return null;
      const variantSlug = resolveVariantSlug(base, selection.variantSlug);
      return applyVariantToCar(base, variantSlug);
    })
    .filter((car): car is Car => Boolean(car));
}

export function buildComparisonRows(cars: Car[]): CompareRow[] {
  const defs: Array<{
    key: string;
    label: string;
    direction: CompareDirection;
    get: (car: Car) => string | number | null;
    getNumeric?: (car: Car) => number | null;
  }> = [
    { key: "priceNok", label: "Pris fra (NOK)", direction: "lower", get: (c) => c.priceNok || null, getNumeric: (c) => meaningful(c.priceNok, "priceNok") },
    { key: "variant", label: "Variant", direction: "none", get: (c) => c.variant ?? null },
    { key: "rangeKm", label: "WLTP-rekkevidde (km)", direction: "higher", get: (c) => c.rangeKm || null, getNumeric: (c) => meaningful(c.rangeKm, "rangeKm") },
    { key: "winterRange", label: "Vinterrekkevidde (km)", direction: "higher", get: (c) => c.winterRangeKm ?? null, getNumeric: (c) => num(c.winterRangeKm) },
    { key: "realWorldRange", label: "Real-world rekkevidde (km)", direction: "higher", get: (c) => c.realWorldRangeKm ?? null, getNumeric: (c) => num(c.realWorldRangeKm) },
    { key: "batteryKwh", label: "Batteri (kWh)", direction: "higher", get: (c) => c.batteryKwh || null, getNumeric: (c) => meaningful(c.batteryKwh, "batteryKwh") },
    { key: "batteryUsable", label: "Batteri brukbart (kWh)", direction: "higher", get: (c) => c.batteryUsableKwh ?? null, getNumeric: (c) => num(c.batteryUsableKwh) },
    { key: "batteryTotal", label: "Batteri totalt (kWh)", direction: "higher", get: (c) => c.batteryTotalKwh ?? null, getNumeric: (c) => num(c.batteryTotalKwh) },
    { key: "batteryChemistry", label: "Batterikjemi", direction: "none", get: (c) => c.batteryChemistry ?? null },
    { key: "consumption", label: "Forbruk (kWh/100 km)", direction: "lower", get: (c) => c.consumptionKwh100km ?? null, getNumeric: (c) => num(c.consumptionKwh100km) },
    { key: "dcKw", label: "DC-lading (kW)", direction: "higher", get: (c) => c.dcKw || null, getNumeric: (c) => meaningful(c.dcKw, "dcKw") },
    { key: "charge1080", label: "Ladetid 10–80 % (min)", direction: "lower", get: (c) => c.chargeTime1080Minutes ?? null, getNumeric: (c) => num(c.chargeTime1080Minutes) },
    { key: "acKw", label: "AC-lading (kW)", direction: "higher", get: (c) => c.acKw || null, getNumeric: (c) => num(c.acKw) },
    { key: "connectorAc", label: "AC-kontakt", direction: "none", get: (c) => c.chargingConnectorAc ?? null },
    { key: "connectorDc", label: "DC-kontakt", direction: "none", get: (c) => c.chargingConnectorDc ?? null },
    { key: "powerHp", label: "Effekt (hk)", direction: "higher", get: (c) => c.powerHp ?? null, getNumeric: (c) => num(c.powerHp) },
    { key: "torqueNm", label: "Moment (Nm)", direction: "higher", get: (c) => c.torqueNm ?? null, getNumeric: (c) => num(c.torqueNm) },
    { key: "accel", label: "0–100 km/t (s)", direction: "lower", get: (c) => c.acceleration0100 ?? null, getNumeric: (c) => num(c.acceleration0100) },
    { key: "topSpeed", label: "Toppfart (km/t)", direction: "higher", get: (c) => c.topSpeedKmh ?? null, getNumeric: (c) => num(c.topSpeedKmh) },
    { key: "seats", label: "Seter", direction: "higher", get: (c) => c.seats ?? null, getNumeric: (c) => num(c.seats) },
    { key: "cargo", label: "Bagasjerom (l)", direction: "higher", get: (c) => c.cargoL ?? null, getNumeric: (c) => num(c.cargoL) },
    { key: "frunk", label: "Frunk (l)", direction: "higher", get: (c) => c.frunkL ?? null, getNumeric: (c) => num(c.frunkL) },
    { key: "towing", label: "Tilhengervekt (kg)", direction: "higher", get: (c) => c.towingKg ?? null, getNumeric: (c) => num(c.towingKg) },
    { key: "curbWeight", label: "Egenvekt (kg)", direction: "lower", get: (c) => c.curbWeightKg ?? null, getNumeric: (c) => num(c.curbWeightKg) },
    { key: "length", label: "Lengde (mm)", direction: "none", get: (c) => c.lengthMm ?? null, getNumeric: (c) => num(c.lengthMm) },
    { key: "drive", label: "Drivhjul", direction: "none", get: (c) => c.drive },
    { key: "body", label: "Karosseri", direction: "none", get: (c) => c.bodyStyle ?? null },
    { key: "vehicleType", label: "Kjøretøytype", direction: "none", get: (c) => c.vehicleType ?? null },
    { key: "heatPump", label: "Varmepumpe", direction: "none", get: (c) => (c.heatPump == null ? null : c.heatPump ? "Ja" : "Nei") },
    { key: "v2l", label: "V2L", direction: "none", get: (c) => (c.v2l == null ? null : c.v2l ? "Ja" : "Nei") },
    { key: "warranty", label: "Garanti", direction: "none", get: (c) => c.warranty ?? null },
    { key: "overallScore", label: "EVFAKTA totalscore", direction: "higher", get: (c) => c.overallScore ?? null, getNumeric: (c) => num(c.overallScore) },
    { key: "rangeScore", label: "Score: rekkevidde", direction: "higher", get: (c) => c.rangeScore ?? null, getNumeric: (c) => num(c.rangeScore) },
    { key: "chargingScore", label: "Score: lading", direction: "higher", get: (c) => c.chargingScore ?? null, getNumeric: (c) => num(c.chargingScore) },
    { key: "winterScore", label: "Score: vinter", direction: "higher", get: (c) => c.winterScore ?? null, getNumeric: (c) => num(c.winterScore) },
    { key: "comfortScore", label: "Score: komfort", direction: "higher", get: (c) => c.comfortScore ?? null, getNumeric: (c) => num(c.comfortScore) },
    { key: "spaceScore", label: "Score: plass", direction: "higher", get: (c) => c.spaceScore ?? null, getNumeric: (c) => num(c.spaceScore) },
    { key: "valueScore", label: "Score: verdi", direction: "higher", get: (c) => c.valueScore ?? null, getNumeric: (c) => num(c.valueScore) },
    { key: "reliabilityScore", label: "Score: pålitelighet", direction: "higher", get: (c) => c.reliabilityScore ?? null, getNumeric: (c) => num(c.reliabilityScore) },
  ];

  return defs
    .map((def) => {
      const values = cars.map((car) => def.get(car));
      const numericValues = cars.map((car) =>
        def.getNumeric ? def.getNumeric(car) : null,
      );
      return {
        key: def.key,
        label: def.label,
        values: values.map(formatValue),
        numericValues,
        direction: def.direction,
        bestIndexes: bestIndexes(numericValues, def.direction),
      };
    })
    .filter((row) =>
      row.values.some((value) => value != null && value !== "" && value !== "—"),
    );
}
