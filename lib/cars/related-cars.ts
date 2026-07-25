import type { Car } from "@/data/cars";

/** Related published cars: same brand first, then similar range, exclude self. */
export function getRelatedCars(car: Car, all: Car[], limit = 3): Car[] {
  const others = all.filter((item) => item.slug !== car.slug);
  const sameBrand = others.filter((item) => item.brand === car.brand);
  const rest = others
    .filter((item) => item.brand !== car.brand)
    .sort(
      (a, b) =>
        Math.abs(a.rangeKm - car.rangeKm) - Math.abs(b.rangeKm - car.rangeKm),
    );

  return [...sameBrand, ...rest].slice(0, limit);
}
