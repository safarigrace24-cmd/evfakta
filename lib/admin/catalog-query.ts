import type { AdminCar, ImportStatus } from "@/lib/admin/types";

export type AdminCatalogFilters = {
  q: string;
  brand: string;
  status: "" | ImportStatus | "published" | "unpublished";
  country: string;
  year: string;
  body: string;
  drive: string;
};

export const EMPTY_CATALOG_FILTERS: AdminCatalogFilters = {
  q: "",
  brand: "",
  status: "",
  country: "",
  year: "",
  body: "",
  drive: "",
};

function firstParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseAdminCatalogFilters(
  params: Record<string, string | string[] | undefined>,
): AdminCatalogFilters {
  const statusRaw = firstParam(params.status);
  const allowedStatus = [
    "",
    "draft",
    "needs_review",
    "approved",
    "published",
    "unpublished",
  ] as const;

  return {
    q: firstParam(params.q).trim(),
    brand: firstParam(params.brand).trim(),
    status: (allowedStatus as readonly string[]).includes(statusRaw)
      ? (statusRaw as AdminCatalogFilters["status"])
      : "",
    country: firstParam(params.country).trim(),
    year: firstParam(params.year).trim(),
    body: firstParam(params.body).trim(),
    drive: firstParam(params.drive).trim(),
  };
}

export function catalogFiltersToParams(filters: AdminCatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.status) params.set("status", filters.status);
  if (filters.country) params.set("country", filters.country);
  if (filters.year) params.set("year", filters.year);
  if (filters.body) params.set("body", filters.body);
  if (filters.drive) params.set("drive", filters.drive);
  return params;
}

export function filterAdminCars(
  cars: AdminCar[],
  filters: AdminCatalogFilters,
): AdminCar[] {
  const q = filters.q.toLowerCase();

  return cars.filter((car) => {
    if (q) {
      const hay = `${car.brand} ${car.model} ${car.slug}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.brand && car.brand !== filters.brand) return false;
    if (filters.country) {
      const country = (car as AdminCar & { country?: string | null }).country ?? "NO";
      if (country !== filters.country) return false;
    }
    if (filters.year && String(car.year ?? "") !== filters.year) return false;
    if (filters.body && (car.body_style ?? "") !== filters.body) return false;
    if (filters.drive && (car.drivetrain ?? "") !== filters.drive) return false;

    if (filters.status === "published") return car.is_published;
    if (filters.status === "unpublished") return !car.is_published;
    if (filters.status) {
      return (car.import_status ?? "draft") === filters.status;
    }
    return true;
  });
}

export function uniqueCatalogValues(cars: AdminCar[]) {
  const brands = new Set<string>();
  const countries = new Set<string>();
  const years = new Set<string>();
  const bodies = new Set<string>();
  const drives = new Set<string>();

  for (const car of cars) {
    if (car.brand) brands.add(car.brand);
    const country = (car as AdminCar & { country?: string | null }).country ?? "NO";
    if (country) countries.add(country);
    if (car.year) years.add(String(car.year));
    if (car.body_style) bodies.add(car.body_style);
    if (car.drivetrain) drives.add(car.drivetrain);
  }

  return {
    brands: [...brands].sort((a, b) => a.localeCompare(b, "nb")),
    countries: [...countries].sort((a, b) => a.localeCompare(b, "nb")),
    years: [...years].sort((a, b) => Number(b) - Number(a)),
    bodies: [...bodies].sort((a, b) => a.localeCompare(b, "nb")),
    drives: [...drives].sort((a, b) => a.localeCompare(b, "nb")),
  };
}
