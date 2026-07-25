import type { Car, CarVariant } from "@/data/cars";

const DRIVES = ["Forhjulsdrift", "Bakhjulsdrift", "Firehjulsdrift"] as const;

export function mapDriveOrNull(
  drivetrain: string | null | undefined,
): Car["drive"] | null {
  if (drivetrain && (DRIVES as readonly string[]).includes(drivetrain)) {
    return drivetrain as Car["drive"];
  }
  return null;
}

/** Overlay variant specs onto a car for display/compare. Base car fields fill gaps. */
export function applyVariantToCar(car: Car, variantSlug?: string | null): Car {
  const variants = car.variants ?? [];
  if (variants.length === 0) {
    return { ...car, selectedVariantSlug: null };
  }

  const requested = variantSlug
    ? variants.find((variant) => variant.slug === variantSlug)
    : undefined;
  const selected =
    requested ??
    variants.find((variant) => variant.isDefault) ??
    variants[0];

  if (!selected) {
    return { ...car, selectedVariantSlug: null };
  }

  return {
    ...car,
    selectedVariantSlug: selected.slug,
    variant: selected.name,
    trimLevel: selected.trimLevel ?? car.trimLevel ?? null,
    year: selected.modelYear ?? car.year ?? null,
    priceNok: selected.priceNok ?? car.priceNok,
    batteryTotalKwh: selected.batteryTotalKwh ?? car.batteryTotalKwh ?? null,
    batteryUsableKwh: selected.batteryUsableKwh ?? car.batteryUsableKwh ?? null,
    batteryKwh:
      selected.batteryUsableKwh ??
      selected.batteryTotalKwh ??
      car.batteryKwh,
    rangeKm: selected.rangeKm ?? car.rangeKm,
    winterRangeKm: selected.winterRangeKm ?? car.winterRangeKm ?? null,
    realWorldRangeKm: selected.realWorldRangeKm ?? car.realWorldRangeKm ?? null,
    consumptionKwh100km:
      selected.consumptionKwh100km ?? car.consumptionKwh100km ?? null,
    acKw: selected.acKw ?? car.acKw,
    dcKw: selected.dcKw ?? car.dcKw,
    chargeTime1080Minutes:
      selected.chargeTime1080Minutes ?? car.chargeTime1080Minutes ?? null,
    drive: selected.drive ?? car.drive,
    powerHp: selected.powerHp ?? car.powerHp ?? null,
    torqueNm: selected.torqueNm ?? car.torqueNm ?? null,
    acceleration0100: selected.acceleration0100 ?? car.acceleration0100 ?? null,
    topSpeedKmh: selected.topSpeedKmh ?? car.topSpeedKmh ?? null,
    towingKg: selected.towingKg ?? car.towingKg ?? null,
    curbWeightKg: selected.curbWeightKg ?? car.curbWeightKg ?? null,
    sourceName: selected.sourceName ?? car.sourceName ?? null,
    sourceUrl: selected.sourceUrl ?? car.sourceUrl ?? null,
    dataLastCheckedAt: selected.dataLastCheckedAt ?? car.dataLastCheckedAt ?? null,
  };
}

export function getDefaultVariant(car: Car): CarVariant | null {
  const variants = car.variants ?? [];
  if (!variants.length) return null;
  return variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;
}

export function resolveVariantSlug(
  car: Car,
  requested?: string | null,
): string | null {
  const variants = car.variants ?? [];
  if (!variants.length) return null;
  if (requested && variants.some((variant) => variant.slug === requested)) {
    return requested;
  }
  return getDefaultVariant(car)?.slug ?? null;
}

/** Apply default active variant for card/list headline specs. */
export function withDefaultVariantSpecs(car: Car): Car {
  if (!car.variants?.length) return car;
  return applyVariantToCar(car, null);
}
