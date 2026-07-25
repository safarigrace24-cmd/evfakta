import type { Car } from "@/data/cars";

export type CompareDirection = "higher" | "lower" | "none";

export type CompareRow = {
  key: string;
  label: string;
  values: Array<string | number | null>;
  numericValues: Array<number | null>;
  direction: CompareDirection;
  bestIndexes: number[];
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

export function buildComparisonRows(cars: Car[]): CompareRow[] {
  const defs: Array<{
    key: string;
    label: string;
    direction: CompareDirection;
    get: (car: Car) => string | number | null;
    getNumeric?: (car: Car) => number | null;
  }> = [
    { key: "priceNok", label: "Pris fra (NOK)", direction: "lower", get: (c) => c.priceNok || null, getNumeric: (c) => meaningful(c.priceNok, "priceNok") },
    { key: "rangeKm", label: "WLTP-rekkevidde (km)", direction: "higher", get: (c) => c.rangeKm || null, getNumeric: (c) => meaningful(c.rangeKm, "rangeKm") },
    { key: "batteryKwh", label: "Batteri (kWh)", direction: "higher", get: (c) => c.batteryKwh || null, getNumeric: (c) => meaningful(c.batteryKwh, "batteryKwh") },
    { key: "consumption", label: "Forbruk (kWh/100 km)", direction: "lower", get: (c) => c.consumptionKwh100km ?? null, getNumeric: (c) => num(c.consumptionKwh100km) },
    { key: "dcKw", label: "DC-lading (kW)", direction: "higher", get: (c) => c.dcKw || null, getNumeric: (c) => meaningful(c.dcKw, "dcKw") },
    { key: "acKw", label: "AC-lading (kW)", direction: "higher", get: (c) => c.acKw || null, getNumeric: (c) => num(c.acKw) },
    { key: "powerHp", label: "Effekt (hk)", direction: "higher", get: (c) => c.powerHp ?? null, getNumeric: (c) => num(c.powerHp) },
    { key: "torqueNm", label: "Moment (Nm)", direction: "higher", get: (c) => c.torqueNm ?? null, getNumeric: (c) => num(c.torqueNm) },
    { key: "accel", label: "0–100 km/t (s)", direction: "lower", get: (c) => c.acceleration0100 ?? null, getNumeric: (c) => num(c.acceleration0100) },
    { key: "topSpeed", label: "Toppfart (km/t)", direction: "higher", get: (c) => c.topSpeedKmh ?? null, getNumeric: (c) => num(c.topSpeedKmh) },
    { key: "seats", label: "Seter", direction: "higher", get: (c) => c.seats ?? null, getNumeric: (c) => num(c.seats) },
    { key: "cargo", label: "Bagasjerom (l)", direction: "higher", get: (c) => c.cargoL ?? null, getNumeric: (c) => num(c.cargoL) },
    { key: "towing", label: "Tilhengervekt (kg)", direction: "higher", get: (c) => c.towingKg ?? null, getNumeric: (c) => num(c.towingKg) },
    { key: "drive", label: "Drivhjul", direction: "none", get: (c) => c.drive },
    { key: "body", label: "Karosseri", direction: "none", get: (c) => c.bodyStyle ?? null },
    { key: "vehicleType", label: "Kjøretøytype", direction: "none", get: (c) => c.vehicleType ?? null },
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

  return defs.map((def) => {
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
  });
}

export function parseCompareSlugs(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const value = Array.isArray(raw) ? raw.join(",") : raw;
  return value
    .split(",")
    .map((slug) => slug.trim().toLowerCase())
    .filter(Boolean)
    .filter((slug, index, all) => all.indexOf(slug) === index)
    .slice(0, 3);
}

export function buildCompareHref(slugs: string[]): string {
  if (slugs.length === 0) return "/sammenlign";
  return `/sammenlign?biler=${encodeURIComponent(slugs.join(","))}`;
}
