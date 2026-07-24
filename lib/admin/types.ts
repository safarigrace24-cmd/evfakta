export type AdminCar = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number | null;
  price_nok: number | null;
  range_km: number | null;
  battery_kwh: number | null;
  dc_charging_kw: number | null;
  drivetrain: string | null;
  image_url: string | null;
  description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminCarInput = {
  brand: string;
  model: string;
  slug: string;
  year: string;
  price_nok: string;
  range_km: string;
  battery_kwh: string;
  dc_charging_kw: string;
  drivetrain: string;
  image_url: string;
  description: string;
  is_published: boolean;
};

export type AdminCarWrite = {
  brand: string;
  model: string;
  slug: string;
  year: number | null;
  price_nok: number | null;
  range_km: number | null;
  battery_kwh: number | null;
  dc_charging_kw: number | null;
  drivetrain: string | null;
  image_url: string | null;
  description: string | null;
  is_published: boolean;
};

export const DRIVETRAIN_OPTIONS = [
  "Forhjulsdrift",
  "Bakhjulsdrift",
  "Firehjulsdrift",
] as const;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ADMIN_MESSAGES = {
  unauthorized: "Du har ikke tilgang til adminpanelet.",
  unavailable: "Admin-databasen er midlertidig utilgjengelig. Prøv igjen senere.",
  notFound: "Bilen ble ikke funnet.",
  createSuccess: "Bilen er lagret.",
  updateSuccess: "Endringene er lagret.",
  deleteSuccess: "Bilen er slettet.",
  publishSuccess: "Bilen er publisert.",
  unpublishSuccess: "Bilen er avpublisert.",
  slugTaken: "Slug er allerede i bruk. Velg en unik slug.",
  genericError: "Noe gikk galt. Prøv igjen.",
} as const;
