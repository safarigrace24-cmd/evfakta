import type { ImportStatus } from "@/lib/admin/types";

export type AdminCarVariant = {
  id: string;
  car_id: string;
  name: string;
  slug: string;
  trim_level: string | null;
  model_year: number | null;
  price_nok: number | null;
  battery_total_kwh: number | null;
  battery_usable_kwh: number | null;
  range_km: number | null;
  winter_range_km: number | null;
  real_world_range_km: number | null;
  consumption_kwh_100km: number | null;
  ac_charging_kw: number | null;
  dc_charging_kw: number | null;
  charge_time_10_80_minutes: number | null;
  drivetrain: string | null;
  power_hp: number | null;
  torque_nm: number | null;
  acceleration_0_100: number | null;
  top_speed_kmh: number | null;
  towing_kg: number | null;
  curb_weight_kg: number | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  source_name: string | null;
  source_url: string | null;
  data_last_checked_at: string | null;
  import_status: ImportStatus;
  import_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminCarVariantInput = {
  name: string;
  slug: string;
  trim_level: string;
  model_year: string;
  price_nok: string;
  battery_total_kwh: string;
  battery_usable_kwh: string;
  range_km: string;
  winter_range_km: string;
  real_world_range_km: string;
  consumption_kwh_100km: string;
  ac_charging_kw: string;
  dc_charging_kw: string;
  charge_time_10_80_minutes: string;
  drivetrain: string;
  power_hp: string;
  torque_nm: string;
  acceleration_0_100: string;
  top_speed_kmh: string;
  towing_kg: string;
  curb_weight_kg: string;
  is_default: boolean;
  is_active: boolean;
  source_name: string;
  source_url: string;
  data_last_checked_at: string;
  import_status: string;
  import_notes: string;
};

export type AdminCarVariantWrite = {
  name: string;
  slug: string;
  trim_level: string | null;
  model_year: number | null;
  price_nok: number | null;
  battery_total_kwh: number | null;
  battery_usable_kwh: number | null;
  range_km: number | null;
  winter_range_km: number | null;
  real_world_range_km: number | null;
  consumption_kwh_100km: number | null;
  ac_charging_kw: number | null;
  dc_charging_kw: number | null;
  charge_time_10_80_minutes: number | null;
  drivetrain: string | null;
  power_hp: number | null;
  torque_nm: number | null;
  acceleration_0_100: number | null;
  top_speed_kmh: number | null;
  towing_kg: number | null;
  curb_weight_kg: number | null;
  is_default: boolean;
  is_active: boolean;
  source_name: string | null;
  source_url: string | null;
  data_last_checked_at: string | null;
  import_status: ImportStatus;
  import_notes: string | null;
};

export const VARIANT_MESSAGES = {
  unauthorized: "Du har ikke tilgang til adminpanelet.",
  unavailable: "Variant-administrasjon er midlertidig utilgjengelig.",
  notFound: "Varianten ble ikke funnet.",
  carNotFound: "Bilen ble ikke funnet.",
  createSuccess: "Varianten er lagret.",
  updateSuccess: "Varianten er oppdatert.",
  deleteSuccess: "Varianten er slettet.",
  reorderSuccess: "Rekkefølgen er lagret.",
  slugTaken: "Variant-slug er allerede i bruk for denne bilen.",
  genericError: "Noe gikk galt. Prøv igjen.",
} as const;
