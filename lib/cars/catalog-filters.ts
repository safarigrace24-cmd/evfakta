import type { Car } from "@/data/cars";

export type CatalogSort =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "range-desc"
  | "score-desc";

export type CatalogFilters = {
  q: string;
  brand: string;
  drive: string;
  body: string;
  priceMin: string;
  priceMax: string;
  rangeMin: string;
  sort: CatalogSort;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  q: "",
  brand: "",
  drive: "Alle",
  body: "",
  priceMin: "",
  priceMax: "",
  rangeMin: "",
  sort: "newest",
};

export function parseCatalogFilters(
  params: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  };

  const sortRaw = get("sort");
  const sort = (
    ["newest", "price-asc", "price-desc", "range-desc", "score-desc"] as const
  ).includes(sortRaw as CatalogSort)
    ? (sortRaw as CatalogSort)
    : "newest";

  return {
    q: get("q"),
    brand: get("merke"),
    drive: get("drivlinje") || "Alle",
    body: get("karosseri"),
    priceMin: get("pris_min"),
    priceMax: get("pris_maks"),
    rangeMin: get("rekkevidde_min"),
    sort,
  };
}

export function catalogFiltersToParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.brand.trim()) params.set("merke", filters.brand.trim());
  if (filters.drive && filters.drive !== "Alle") params.set("drivlinje", filters.drive);
  if (filters.body.trim()) params.set("karosseri", filters.body.trim());
  if (filters.priceMin.trim()) params.set("pris_min", filters.priceMin.trim());
  if (filters.priceMax.trim()) params.set("pris_maks", filters.priceMax.trim());
  if (filters.rangeMin.trim()) params.set("rekkevidde_min", filters.rangeMin.trim());
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  return params;
}

function toInt(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export function filterAndSortCars(cars: Car[], filters: CatalogFilters): Car[] {
  const q = filters.q.trim().toLowerCase();
  const priceMin = toInt(filters.priceMin);
  const priceMax = toInt(filters.priceMax);
  const rangeMin = toInt(filters.rangeMin);

  let result = cars.filter((car) => {
    if (q && !`${car.brand} ${car.model}`.toLowerCase().includes(q)) return false;
    if (filters.brand && car.brand !== filters.brand) return false;
    if (filters.drive !== "Alle" && car.drive !== filters.drive) return false;
    if (filters.body && (car.bodyStyle ?? "") !== filters.body) return false;
    if (priceMin != null && (car.priceNok <= 0 || car.priceNok < priceMin)) return false;
    if (priceMax != null && (car.priceNok <= 0 || car.priceNok > priceMax)) return false;
    if (rangeMin != null && car.rangeKm < rangeMin) return false;
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case "price-asc":
        return (a.priceNok || Number.MAX_SAFE_INTEGER) - (b.priceNok || Number.MAX_SAFE_INTEGER);
      case "price-desc":
        return (b.priceNok || 0) - (a.priceNok || 0);
      case "range-desc":
        return b.rangeKm - a.rangeKm;
      case "score-desc":
        return (b.overallScore ?? -1) - (a.overallScore ?? -1);
      case "newest":
      default:
        return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, "nb");
    }
  });

  return result;
}

export function uniqueBrands(cars: Car[]): string[] {
  return [...new Set(cars.map((car) => car.brand))].sort((a, b) =>
    a.localeCompare(b, "nb"),
  );
}

export function uniqueBodyStyles(cars: Car[]): string[] {
  return [...new Set(cars.map((car) => car.bodyStyle).filter(Boolean) as string[])].sort(
    (a, b) => a.localeCompare(b, "nb"),
  );
}
