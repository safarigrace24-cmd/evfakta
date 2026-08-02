/**
 * Transparent charging-cost estimates for /kalkulator.
 * Pure functions — no network, no invented market prices.
 */

export type ChargingCostInput = {
  batteryCapacityKwh: number;
  startPercent: number;
  targetPercent: number;
  pricePerKwh: number;
  lossPercent: number;
  monthlyDistanceKm?: number | null;
  consumptionKwhPer100Km?: number | null;
};

export type ChargingCostResult = {
  ok: true;
  energyAddedKwh: number;
  energyFromGridKwh: number;
  chargeCostNok: number;
  monthlyEnergyKwh: number | null;
  monthlyCostNok: number | null;
  costPer100KmNok: number | null;
};

export type ChargingCostError = {
  ok: false;
  error: string;
};

export type ChargingCostPresetId = "home" | "public_ac" | "fast";

export const CHARGING_COST_PRESETS: Record<
  ChargingCostPresetId,
  { label: string; pricePerKwh: number; lossPercent: number; hint: string }
> = {
  home: {
    label: "Hjemmelading",
    pricePerKwh: 1.5,
    lossPercent: 10,
    hint: "Redigerbart eksempel — ikke en faktisk spotpris.",
  },
  public_ac: {
    label: "Offentlig AC",
    pricePerKwh: 4.5,
    lossPercent: 12,
    hint: "Redigerbart eksempel for offentlig AC.",
  },
  fast: {
    label: "Hurtiglading",
    pricePerKwh: 7.5,
    lossPercent: 15,
    hint: "Redigerbart eksempel for DC-hurtiglading.",
  },
};

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function validateChargingCostInput(
  input: ChargingCostInput,
): string | null {
  if (!finitePositive(input.batteryCapacityKwh) || input.batteryCapacityKwh > 300) {
    return "Oppgi batterikapasitet mellom 0 og 300 kWh.";
  }
  if (
    !Number.isFinite(input.startPercent) ||
    input.startPercent < 0 ||
    input.startPercent > 100
  ) {
    return "Startprosent må være mellom 0 og 100.";
  }
  if (
    !Number.isFinite(input.targetPercent) ||
    input.targetPercent < 0 ||
    input.targetPercent > 100
  ) {
    return "Målprosent må være mellom 0 og 100.";
  }
  if (input.targetPercent <= input.startPercent) {
    return "Målprosent må være høyere enn startprosent.";
  }
  if (!Number.isFinite(input.pricePerKwh) || input.pricePerKwh < 0) {
    return "Oppgi en gyldig strømpris (kr/kWh).";
  }
  if (
    !Number.isFinite(input.lossPercent) ||
    input.lossPercent < 0 ||
    input.lossPercent >= 80
  ) {
    return "Ladetap må være mellom 0 og 80 %.";
  }
  if (
    input.monthlyDistanceKm != null &&
    (!Number.isFinite(input.monthlyDistanceKm) || input.monthlyDistanceKm < 0)
  ) {
    return "Månedlig kjørelengde må være 0 eller høyere.";
  }
  if (
    input.consumptionKwhPer100Km != null &&
    (!Number.isFinite(input.consumptionKwhPer100Km) ||
      input.consumptionKwhPer100Km <= 0)
  ) {
    return "Forbruk må være et positivt tall (kWh/100 km).";
  }
  return null;
}

/**
 * Formulas (transparent estimates):
 * - energyAdded = capacity * (target - start) / 100
 * - energyFromGrid = energyAdded / (1 - loss/100)
 * - chargeCost = energyFromGrid * price
 * - monthlyEnergy = (distance/100) * consumption
 * - monthlyCost = monthlyEnergy * price * (1 + loss/100)  [grid draw for driving]
 * - costPer100Km = consumption * price * (1 + loss/100)
 */
export function calculateChargingCost(
  input: ChargingCostInput,
): ChargingCostResult | ChargingCostError {
  const validationError = validateChargingCostInput(input);
  if (validationError) return { ok: false, error: validationError };

  const energyAddedKwh =
    input.batteryCapacityKwh * ((input.targetPercent - input.startPercent) / 100);
  const efficiency = 1 - input.lossPercent / 100;
  const energyFromGridKwh = energyAddedKwh / efficiency;
  const chargeCostNok = energyFromGridKwh * input.pricePerKwh;

  let monthlyEnergyKwh: number | null = null;
  let monthlyCostNok: number | null = null;
  let costPer100KmNok: number | null = null;

  if (
    input.monthlyDistanceKm != null &&
    input.consumptionKwhPer100Km != null &&
    input.monthlyDistanceKm > 0
  ) {
    monthlyEnergyKwh =
      (input.monthlyDistanceKm / 100) * input.consumptionKwhPer100Km;
    // Approximate grid energy including charging loss for the distance driven.
    monthlyCostNok = (monthlyEnergyKwh / efficiency) * input.pricePerKwh;
  }

  if (input.consumptionKwhPer100Km != null) {
    costPer100KmNok =
      (input.consumptionKwhPer100Km / efficiency) * input.pricePerKwh;
  }

  return {
    ok: true,
    energyAddedKwh: round2(energyAddedKwh),
    energyFromGridKwh: round2(energyFromGridKwh),
    chargeCostNok: round2(chargeCostNok),
    monthlyEnergyKwh:
      monthlyEnergyKwh == null ? null : round2(monthlyEnergyKwh),
    monthlyCostNok: monthlyCostNok == null ? null : round2(monthlyCostNok),
    costPer100KmNok:
      costPer100KmNok == null ? null : round2(costPer100KmNok),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseChargingCostSearchParams(
  params: URLSearchParams,
): Partial<ChargingCostInput> {
  const num = (key: string) => {
    const raw = params.get(key);
    if (raw == null || raw === "") return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    batteryCapacityKwh: num("kwh"),
    startPercent: num("start"),
    targetPercent: num("maal"),
    pricePerKwh: num("pris"),
    lossPercent: num("tap"),
    monthlyDistanceKm: num("km"),
    consumptionKwhPer100Km: num("forbruk"),
  };
}

export function buildChargingCostSearchParams(
  input: ChargingCostInput,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("kwh", String(input.batteryCapacityKwh));
  params.set("start", String(input.startPercent));
  params.set("maal", String(input.targetPercent));
  params.set("pris", String(input.pricePerKwh));
  params.set("tap", String(input.lossPercent));
  if (input.monthlyDistanceKm != null) {
    params.set("km", String(input.monthlyDistanceKm));
  }
  if (input.consumptionKwhPer100Km != null) {
    params.set("forbruk", String(input.consumptionKwhPer100Km));
  }
  return params;
}
