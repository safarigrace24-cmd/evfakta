import type { Car } from "@/data/cars";
import { applyVariantToCar, resolveVariantSlug } from "@/lib/cars/variants";
import {
  PUBLIC_SHOW_PRICES,
  PUBLIC_SHOW_SCORES,
} from "@/lib/public/display-policy";

export type CompareDirection = "higher" | "lower" | "none";

export type CompareGroup =
  | "identity"
  | "battery"
  | "range"
  | "charging"
  | "performance"
  | "dimensions"
  | "practicality"
  | "warranty"
  | "scores";

export const COMPARE_GROUP_ORDER: CompareGroup[] = [
  "identity",
  "battery",
  "range",
  "charging",
  "performance",
  "dimensions",
  "practicality",
  "warranty",
  "scores",
];

export const COMPARE_GROUP_LABELS: Record<CompareGroup, string> = {
  identity: "Identitet",
  battery: "Batteri",
  range: "Rekkevidde",
  charging: "Lading",
  performance: "Ytelse",
  dimensions: "Dimensjoner",
  practicality: "Praktisk",
  warranty: "Garanti",
  scores: "Score",
};

export type CompareRow = {
  key: string;
  label: string;
  group: CompareGroup;
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

export const COMPARE_MISSING_LABEL = "Ikke oppgitt";

function formatValue(value: string | number | null): string {
  if (value == null || value === "") return COMPARE_MISSING_LABEL;
  return String(value);
}

/** True when a row has at least two different non-missing display values. */
export function comparisonRowHasDifference(row: CompareRow): boolean {
  const present = row.values.filter(
    (value) => value != null && value !== "" && value !== COMPARE_MISSING_LABEL,
  );
  if (present.length === 0) return false;
  return new Set(present.map(String)).size > 1;
}

export function filterComparisonRows(
  rows: CompareRow[],
  differencesOnly: boolean,
): CompareRow[] {
  if (!differencesOnly) return rows;
  return rows.filter(comparisonRowHasDifference);
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

export function groupComparisonRows(rows: CompareRow[]): Array<{
  group: CompareGroup;
  label: string;
  rows: CompareRow[];
}> {
  return COMPARE_GROUP_ORDER.map((group) => ({
    group,
    label: COMPARE_GROUP_LABELS[group],
    rows: rows.filter((row) => row.group === group),
  })).filter((section) => section.rows.length > 0);
}

export function buildComparisonRows(
  cars: Car[],
  options?: { includeHiddenPublicFields?: boolean },
): CompareRow[] {
  const showPrices = options?.includeHiddenPublicFields || PUBLIC_SHOW_PRICES;
  const showScores = options?.includeHiddenPublicFields || PUBLIC_SHOW_SCORES;

  const defs: Array<{
    key: string;
    label: string;
    group: CompareGroup;
    direction: CompareDirection;
    get: (car: Car) => string | number | null;
    getNumeric?: (car: Car) => number | null;
  }> = [
    { key: "priceNok", label: "Pris fra (NOK)", group: "identity", direction: "lower", get: (c) => c.priceNok || null, getNumeric: (c) => meaningful(c.priceNok, "priceNok") },
    { key: "variant", label: "Variant", group: "identity", direction: "none", get: (c) => c.variant ?? null },
    { key: "drive", label: "Drivlinje", group: "identity", direction: "none", get: (c) => c.drive },
    { key: "body", label: "Karosseri", group: "identity", direction: "none", get: (c) => c.bodyStyle ?? null },
    { key: "vehicleType", label: "Kjøretøytype", group: "identity", direction: "none", get: (c) => c.vehicleType ?? null },
    { key: "batteryKwh", label: "Batteri (kWh)", group: "battery", direction: "higher", get: (c) => c.batteryKwh || null, getNumeric: (c) => meaningful(c.batteryKwh, "batteryKwh") },
    { key: "batteryUsable", label: "Batteri brukbart (kWh)", group: "battery", direction: "higher", get: (c) => c.batteryUsableKwh ?? null, getNumeric: (c) => num(c.batteryUsableKwh) },
    { key: "batteryTotal", label: "Batteri totalt (kWh)", group: "battery", direction: "higher", get: (c) => c.batteryTotalKwh ?? null, getNumeric: (c) => num(c.batteryTotalKwh) },
    { key: "batteryChemistry", label: "Batterikjemi", group: "battery", direction: "none", get: (c) => c.batteryChemistry ?? null },
    { key: "consumption", label: "Forbruk (kWh/100 km)", group: "battery", direction: "lower", get: (c) => c.consumptionKwh100km ?? null, getNumeric: (c) => num(c.consumptionKwh100km) },
    { key: "rangeKm", label: "WLTP-rekkevidde (km)", group: "range", direction: "higher", get: (c) => c.rangeKm || null, getNumeric: (c) => meaningful(c.rangeKm, "rangeKm") },
    { key: "winterRange", label: "Vinterrekkevidde (km)", group: "range", direction: "higher", get: (c) => c.winterRangeKm ?? null, getNumeric: (c) => num(c.winterRangeKm) },
    { key: "realWorldRange", label: "Real-world rekkevidde (km)", group: "range", direction: "higher", get: (c) => c.realWorldRangeKm ?? null, getNumeric: (c) => num(c.realWorldRangeKm) },
    { key: "dcKw", label: "DC-lading (kW)", group: "charging", direction: "higher", get: (c) => c.dcKw || null, getNumeric: (c) => meaningful(c.dcKw, "dcKw") },
    { key: "charge1080", label: "Ladetid 10–80 % (min)", group: "charging", direction: "lower", get: (c) => c.chargeTime1080Minutes ?? null, getNumeric: (c) => num(c.chargeTime1080Minutes) },
    { key: "acKw", label: "AC-lading (kW)", group: "charging", direction: "higher", get: (c) => c.acKw || null, getNumeric: (c) => num(c.acKw) },
    { key: "connectorAc", label: "AC-kontakt", group: "charging", direction: "none", get: (c) => c.chargingConnectorAc ?? null },
    { key: "connectorDc", label: "DC-kontakt", group: "charging", direction: "none", get: (c) => c.chargingConnectorDc ?? null },
    { key: "powerHp", label: "Effekt (hk)", group: "performance", direction: "higher", get: (c) => c.powerHp ?? null, getNumeric: (c) => num(c.powerHp) },
    { key: "torqueNm", label: "Moment (Nm)", group: "performance", direction: "higher", get: (c) => c.torqueNm ?? null, getNumeric: (c) => num(c.torqueNm) },
    { key: "accel", label: "0–100 km/t (s)", group: "performance", direction: "lower", get: (c) => c.acceleration0100 ?? null, getNumeric: (c) => num(c.acceleration0100) },
    { key: "topSpeed", label: "Toppfart (km/t)", group: "performance", direction: "higher", get: (c) => c.topSpeedKmh ?? null, getNumeric: (c) => num(c.topSpeedKmh) },
    { key: "length", label: "Lengde (mm)", group: "dimensions", direction: "none", get: (c) => c.lengthMm ?? null, getNumeric: (c) => num(c.lengthMm) },
    { key: "curbWeight", label: "Egenvekt (kg)", group: "dimensions", direction: "lower", get: (c) => c.curbWeightKg ?? null, getNumeric: (c) => num(c.curbWeightKg) },
    { key: "seats", label: "Seter", group: "practicality", direction: "higher", get: (c) => c.seats ?? null, getNumeric: (c) => num(c.seats) },
    { key: "cargo", label: "Bagasjerom (l)", group: "practicality", direction: "higher", get: (c) => c.cargoL ?? null, getNumeric: (c) => num(c.cargoL) },
    { key: "frunk", label: "Frunk (l)", group: "practicality", direction: "higher", get: (c) => c.frunkL ?? null, getNumeric: (c) => num(c.frunkL) },
    { key: "towing", label: "Tilhengervekt (kg)", group: "practicality", direction: "higher", get: (c) => c.towingKg ?? null, getNumeric: (c) => num(c.towingKg) },
    { key: "heatPump", label: "Varmepumpe", group: "practicality", direction: "none", get: (c) => (c.heatPump == null ? null : c.heatPump ? "Ja" : "Nei") },
    { key: "v2l", label: "V2L", group: "practicality", direction: "none", get: (c) => (c.v2l == null ? null : c.v2l ? "Ja" : "Nei") },
    { key: "warranty", label: "Garanti", group: "warranty", direction: "none", get: (c) => c.warranty ?? null },
    { key: "overallScore", label: "EVFAKTA totalscore", group: "scores", direction: "higher", get: (c) => c.overallScore ?? null, getNumeric: (c) => num(c.overallScore) },
    { key: "rangeScore", label: "Score: rekkevidde", group: "scores", direction: "higher", get: (c) => c.rangeScore ?? null, getNumeric: (c) => num(c.rangeScore) },
    { key: "chargingScore", label: "Score: lading", group: "scores", direction: "higher", get: (c) => c.chargingScore ?? null, getNumeric: (c) => num(c.chargingScore) },
    { key: "winterScore", label: "Score: vinter", group: "scores", direction: "higher", get: (c) => c.winterScore ?? null, getNumeric: (c) => num(c.winterScore) },
    { key: "comfortScore", label: "Score: komfort", group: "scores", direction: "higher", get: (c) => c.comfortScore ?? null, getNumeric: (c) => num(c.comfortScore) },
    { key: "spaceScore", label: "Score: plass", group: "scores", direction: "higher", get: (c) => c.spaceScore ?? null, getNumeric: (c) => num(c.spaceScore) },
    { key: "valueScore", label: "Score: verdi", group: "scores", direction: "higher", get: (c) => c.valueScore ?? null, getNumeric: (c) => num(c.valueScore) },
    { key: "reliabilityScore", label: "Score: pålitelighet", group: "scores", direction: "higher", get: (c) => c.reliabilityScore ?? null, getNumeric: (c) => num(c.reliabilityScore) },
  ];

  return defs
    .filter((def) => {
      if (!showPrices && def.key === "priceNok") return false;
      if (
        !showScores &&
        [
          "overallScore",
          "rangeScore",
          "chargingScore",
          "winterScore",
          "comfortScore",
          "spaceScore",
          "valueScore",
          "reliabilityScore",
        ].includes(def.key)
      ) {
        return false;
      }
      return true;
    })
    .map((def) => {
      const values = cars.map((car) => def.get(car));
      const numericValues = cars.map((car) =>
        def.getNumeric ? def.getNumeric(car) : null,
      );
      return {
        key: def.key,
        label: def.label,
        group: def.group,
        values: values.map(formatValue),
        numericValues,
        direction: def.direction,
        bestIndexes: bestIndexes(numericValues, def.direction),
      };
    })
    .filter((row) =>
      row.values.some(
        (value) =>
          value != null && value !== "" && value !== COMPARE_MISSING_LABEL,
      ),
    );
}
