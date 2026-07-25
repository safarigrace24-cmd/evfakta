export type ImportStatus = "draft" | "needs_review" | "approved";

export type AdminCar = {
  id: string;
  slug: string;
  brand: string;
  brand_id: string | null;
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
  consumption_kwh_100km: number | null;
  power_hp: number | null;
  torque_nm: number | null;
  acceleration_0_100: number | null;
  top_speed_kmh: number | null;
  seats: number | null;
  cargo_l: number | null;
  towing_kg: number | null;
  warranty: string | null;
  ac_charging_kw: number | null;
  vehicle_type: string | null;
  body_style: string | null;
  source_url: string | null;
  source_name: string | null;
  source_updated_at: string | null;
  data_last_checked_at: string | null;
  import_status: ImportStatus | null;
  import_notes: string | null;
  range_score: number | null;
  charging_score: number | null;
  winter_score: number | null;
  comfort_score: number | null;
  space_score: number | null;
  value_score: number | null;
  reliability_score: number | null;
  overall_score: number | null;
  score_notes: string | null;
  score_methodology: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminCarInput = {
  brand: string;
  brand_id: string;
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
  consumption_kwh_100km: string;
  power_hp: string;
  torque_nm: string;
  acceleration_0_100: string;
  top_speed_kmh: string;
  seats: string;
  cargo_l: string;
  towing_kg: string;
  warranty: string;
  ac_charging_kw: string;
  vehicle_type: string;
  body_style: string;
  source_url: string;
  source_name: string;
  source_updated_at: string;
  data_last_checked_at: string;
  import_status: string;
  import_notes: string;
  range_score: string;
  charging_score: string;
  winter_score: string;
  comfort_score: string;
  space_score: string;
  value_score: string;
  reliability_score: string;
  overall_score: string;
  score_notes: string;
  score_methodology: string;
};

export type AdminCarWrite = {
  brand: string;
  brand_id: string | null;
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
  consumption_kwh_100km: number | null;
  power_hp: number | null;
  torque_nm: number | null;
  acceleration_0_100: number | null;
  top_speed_kmh: number | null;
  seats: number | null;
  cargo_l: number | null;
  towing_kg: number | null;
  warranty: string | null;
  ac_charging_kw: number | null;
  vehicle_type: string | null;
  body_style: string | null;
  source_url: string | null;
  source_name: string | null;
  source_updated_at: string | null;
  data_last_checked_at: string | null;
  import_status: ImportStatus;
  import_notes: string | null;
  range_score: number | null;
  charging_score: number | null;
  winter_score: number | null;
  comfort_score: number | null;
  space_score: number | null;
  value_score: number | null;
  reliability_score: number | null;
  overall_score: number | null;
  score_notes: string | null;
  score_methodology: string | null;
};

export const DRIVETRAIN_OPTIONS = [
  "Forhjulsdrift",
  "Bakhjulsdrift",
  "Firehjulsdrift",
] as const;

export const VEHICLE_TYPE_OPTIONS = [
  "Personbil",
  "SUV",
  "Pickup",
  "Varebil",
] as const;

export const BODY_STYLE_OPTIONS = [
  "Sedan",
  "Hatchback",
  "Stasjonsvogn",
  "SUV",
  "Crossover",
  "Coupe",
  "MPV",
  "Pickup",
  "Varebil",
] as const;

export const IMPORT_STATUS_OPTIONS = [
  "draft",
  "needs_review",
  "approved",
] as const;

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  draft: "Utkast",
  needs_review: "Trenger gjennomgang",
  approved: "Godkjent",
};

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
  needsReviewSuccess: "Bilen er merket for gjennomgang.",
  approveSuccess: "Bilen er godkjent. Publisering er fortsatt en egen handling.",
  slugTaken: "Slug er allerede i bruk. Velg en unik slug.",
  genericError: "Noe gikk galt. Prøv igjen.",
} as const;
