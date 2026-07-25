import type { ImportStatus } from "@/lib/admin/types";

export type ImportMethod = "csv" | "json" | "api" | "images";

export type ImportJobStatus =
  | "preview"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type ImportRowAction =
  | "import"
  | "update"
  | "skip"
  | "error"
  | "warning"
  | "image";

export type ImageImportMode = "skip" | "replace";

export type FieldSourceMeta = {
  source_name: string | null;
  source_url: string | null;
  imported_at: string;
  import_job_id: string | null;
};

export type FieldSources = Record<string, FieldSourceMeta>;

/** Normalized variant payload nested under a car import row. */
export type ImportVariantRow = {
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
};

/** Normalized car payload from CSV/JSON (before DB apply). */
export type ImportCarRow = {
  slug: string;
  brand: string;
  model: string;
  variant: string | null;
  trim_level: string | null;
  model_generation: string | null;
  year: number | null;
  price_nok: number | null;
  range_km: number | null;
  battery_kwh: number | null;
  battery_total_kwh: number | null;
  battery_usable_kwh: number | null;
  battery_chemistry: string | null;
  winter_range_km: number | null;
  real_world_range_km: number | null;
  dc_charging_kw: number | null;
  charge_time_10_80_minutes: number | null;
  charging_connector_ac: string | null;
  charging_connector_dc: string | null;
  drivetrain: string | null;
  image_url: string | null;
  description: string | null;
  /** Always forced false on admin import apply. */
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
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  wheelbase_mm: number | null;
  curb_weight_kg: number | null;
  gross_weight_kg: number | null;
  frunk_l: number | null;
  heat_pump: boolean | null;
  v2l: boolean | null;
  v2g: boolean | null;
  apple_carplay: boolean | null;
  android_auto: boolean | null;
  head_up_display: boolean | null;
  panoramic_roof: boolean | null;
  ota_updates: boolean | null;
  pros: string[] | null;
  cons: string[] | null;
  suitable_for: string[] | null;
  country: string | null;
  source_name: string | null;
  source_url: string | null;
  source_updated_at: string | null;
  data_last_checked_at: string | null;
  import_status: ImportStatus;
  import_notes: string | null;
  gallery_images?: ImportGalleryImage[];
  /** Nested variants (never auto-publish the parent car). */
  variants?: ImportVariantRow[];
};

export type ImportGalleryImage = {
  url: string;
  image_type?: string;
  alt_text?: string;
  is_primary?: boolean;
};

export type ParsedImportResult = {
  rows: ImportCarRow[];
  warnings: string[];
  errors: string[];
};

export type PreviewDecision = "import" | "update" | "skip" | "error";

export type PreviewRow = {
  rowNumber: number;
  slug: string;
  brand: string;
  model: string;
  decision: PreviewDecision;
  messages: string[];
  changedFields: string[];
  existingId: string | null;
  payload: ImportCarRow | null;
};

export type ImportReportSummary = {
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  warnings: number;
  imagesImported?: number;
  imagesSkipped?: number;
  imagesReplaced?: number;
  variantsImported?: number;
  variantsUpdated?: number;
};

export type ImportJob = {
  id: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  created_by: string | null;
  method: ImportMethod;
  status: ImportJobStatus;
  filename: string | null;
  source_name: string | null;
  source_url: string | null;
  connector_key: string | null;
  options: Record<string, unknown>;
  summary: ImportReportSummary | Record<string, unknown>;
  error_message: string | null;
};

export type ImportJobItem = {
  id: string;
  job_id: string;
  row_number: number | null;
  slug: string | null;
  car_id: string | null;
  action: ImportRowAction;
  message: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type ImportApplyOptions = {
  sourceName?: string | null;
  sourceUrl?: string | null;
  /** Default needs_review for all imported/updated rows. */
  forceImportStatus?: ImportStatus;
  imageMode?: ImageImportMode;
  skipUnchanged?: boolean;
  updateExisting?: boolean;
};

/** Future API connector stub. */
export type ImportConnector = {
  key: string;
  label: string;
  method: "api";
  description: string;
  enabled: boolean;
};

export const FUTURE_IMPORT_CONNECTORS: ImportConnector[] = [
  {
    key: "ofv",
    label: "OFV / norske listpriser (kommende)",
    method: "api",
    description: "Planlagt kobling mot norske pris- og modellkilder.",
    enabled: false,
  },
  {
    key: "manufacturer",
    label: "Produsent-API (kommende)",
    method: "api",
    description: "Planlagt connector for offisielle produsentdata.",
    enabled: false,
  },
];

export const IMPORT_COMPARE_FIELDS = [
  "brand",
  "model",
  "variant",
  "trim_level",
  "model_generation",
  "year",
  "price_nok",
  "range_km",
  "battery_kwh",
  "battery_total_kwh",
  "battery_usable_kwh",
  "battery_chemistry",
  "winter_range_km",
  "real_world_range_km",
  "dc_charging_kw",
  "charge_time_10_80_minutes",
  "charging_connector_ac",
  "charging_connector_dc",
  "drivetrain",
  "image_url",
  "description",
  "consumption_kwh_100km",
  "power_hp",
  "torque_nm",
  "acceleration_0_100",
  "top_speed_kmh",
  "seats",
  "cargo_l",
  "towing_kg",
  "warranty",
  "ac_charging_kw",
  "vehicle_type",
  "body_style",
  "length_mm",
  "width_mm",
  "height_mm",
  "wheelbase_mm",
  "curb_weight_kg",
  "gross_weight_kg",
  "frunk_l",
  "heat_pump",
  "v2l",
  "v2g",
  "apple_carplay",
  "android_auto",
  "head_up_display",
  "panoramic_roof",
  "ota_updates",
  "pros",
  "cons",
  "suitable_for",
  "country",
  "source_name",
  "source_url",
  "source_updated_at",
  "data_last_checked_at",
  "import_notes",
] as const;

export type ImportCompareField = (typeof IMPORT_COMPARE_FIELDS)[number];

export const IMPORT_MESSAGES = {
  unauthorized: "Du har ikke tilgang til adminpanelet.",
  unavailable: "Import er midlertidig utilgjengelig. Prøv igjen senere.",
  emptyFile: "Filen er tom.",
  invalidFormat: "Ugyldig filformat. Bruk CSV eller JSON.",
  previewSuccess: "Forhåndsvisning er klar.",
  applySuccess: "Importen er fullført.",
  applyPartial: "Importen er fullført med feil. Se rapporten.",
  jobNotFound: "Importjobben ble ikke funnet.",
  connectorDisabled: "Denne API-koblingen er ikke aktivert ennå.",
} as const;
