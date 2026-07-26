export type ResearchProviderKey =
  | "manual"
  | "manufacturer_http"
  | "structured_json"
  | "stub";

export type ResearchSourceMode =
  | "live"
  | "manual_paste"
  | "manual_upload"
  | "structured";

export type ResearchJobStatus =
  | "queued"
  | "running"
  | "awaiting_manual"
  | "needs_review"
  | "applying"
  | "completed"
  | "failed"
  | "cancelled";

export type ResearchItemDecision =
  | "pending"
  | "approved"
  | "rejected"
  | "applied"
  | "skipped";

export type ResearchCandidateStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "conflict"
  | "applied";

export type ResearchImageStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "applied";

export type ResearchConfidence = number; // 0–1

export type ResearchSourceMeta = {
  source_name: string | null;
  source_url: string | null;
  retrieved_at: string;
  confidence: ResearchConfidence;
  provider_key: ResearchProviderKey;
  is_secondary?: boolean;
};

export type ResearchFieldValue = {
  field_key: string;
  value: string | number | boolean | string[] | null;
  source: ResearchSourceMeta;
  notes?: string | null;
};

export type ResearchConflict = {
  field_key: string;
  entity_type: "car" | "variant";
  variant_slug?: string | null;
  values: Array<{
    value: string | number | boolean | string[] | null;
    source: ResearchSourceMeta;
  }>;
  message: string;
};

export type ResearchImageCandidateInput = {
  original_url: string;
  source_name?: string | null;
  source_url?: string | null;
  license_note?: string | null;
  usage_terms?: string | null;
  alt_text?: string | null;
  image_type?: string | null;
  is_primary_candidate?: boolean;
  notes?: string | null;
};

export type ResearchVariantProposal = {
  name: string;
  slug: string;
  fields: ResearchFieldValue[];
  is_default?: boolean;
};

export type ResearchModelProposal = {
  brand: string;
  model: string;
  slug: string;
  fields: ResearchFieldValue[];
  variants: ResearchVariantProposal[];
  images: ResearchImageCandidateInput[];
  warnings: string[];
  missing_fields: string[];
  conflicts: ResearchConflict[];
};

export type ResearchProviderResult = {
  models: ResearchModelProposal[];
  warnings: string[];
  errors: string[];
  blocked?: boolean;
  progressMessage?: string;
};

export type ResearchProviderInput = {
  brandName?: string | null;
  brandId?: string | null;
  modelQuery?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  rawInput?: string | null;
  filename?: string | null;
  options?: Record<string, unknown>;
};

export type ResearchProvider = {
  key: ResearchProviderKey;
  label: string;
  description: string;
  supportsLive: boolean;
  run: (input: ResearchProviderInput) => Promise<ResearchProviderResult>;
};

export type ResearchJob = {
  id: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  created_by: string | null;
  brand_id: string | null;
  brand_name: string | null;
  model_query: string | null;
  provider_key: ResearchProviderKey;
  source_mode: ResearchSourceMode;
  status: ResearchJobStatus;
  source_name: string | null;
  source_url: string | null;
  filename: string | null;
  raw_input: string | null;
  options: Record<string, unknown>;
  summary: ResearchJobSummary | Record<string, unknown>;
  error_message: string | null;
  progress_message: string | null;
  progress_pct: number;
};

export type ResearchJobSummary = {
  modelsFound: number;
  fieldsFound: number;
  conflicts: number;
  warnings: number;
  missingFields: number;
  imageCandidates: number;
  applied: number;
  rejected: number;
  approved: number;
};

export type ResearchItem = {
  id: string;
  job_id: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
  slug: string | null;
  brand: string | null;
  model: string | null;
  existing_car_id: string | null;
  decision: ResearchItemDecision;
  warnings: string[];
  missing_fields: string[];
  conflicts: ResearchConflict[];
  proposed_car: Record<string, unknown>;
  proposed_variants: ResearchVariantProposal[];
  message: string | null;
};

export type ResearchFieldCandidate = {
  id: string;
  item_id: string;
  created_at: string;
  entity_type: "car" | "variant";
  variant_slug: string | null;
  field_key: string;
  proposed_value: unknown;
  source_name: string | null;
  source_url: string | null;
  retrieved_at: string | null;
  confidence: number | null;
  status: ResearchCandidateStatus;
  conflict_group: string | null;
  notes: string | null;
};

export type ResearchImageCandidate = {
  id: string;
  item_id: string;
  created_at: string;
  original_url: string;
  source_name: string | null;
  source_url: string | null;
  license_note: string | null;
  usage_terms: string | null;
  alt_text: string | null;
  image_type: string | null;
  is_primary_candidate: boolean;
  status: ResearchImageStatus;
  applied_image_id: string | null;
  storage_path: string | null;
  notes: string | null;
};

export const RESEARCH_MESSAGES = {
  unauthorized: "Du har ikke tilgang til research-pipeline.",
  unavailable: "Research er midlertidig utilgjengelig.",
  jobNotFound: "Research-jobben ble ikke funnet.",
  emptyInput: "Velg merke og kilde (URL), eller lim inn tekst under Avansert.",
  blocked:
    "Noen produsenter blokkerer automatisk tilgang. Det er forventet — fortsett med manuell research.",
  switchedToManual:
    "Automatisk henting ble blokkert. Jobben er byttet til manuell research — lim inn eller last opp kilde.",
  createSuccess: "Research-jobb er startet.",
  continueSuccess: "Manuell kilde er behandlet — klar for gjennomgang.",
  applySuccess: "Godkjente data er lagret som utkast (needs_review).",
  noApproved: "Ingen godkjente elementer å anvende.",
  genericError: "Noe gikk galt. Prøv igjen.",
} as const;

/** Soft copy shown when a manufacturer blocks bots (not treated as a hard error). */
export const RESEARCH_BLOCKED_EXPLANATION =
  "Noen produsentnettsteder blokkerer automatisk tilgang (f.eks. HTTP 403). Det er vanlig og forventet. Research-jobben er beholdt — fortsett med manuell research ved å lime inn tekst eller laste opp PDF, JSON eller CSV fra den offisielle kilden.";

/** Whether the job should show the manual-research continue panel. */
export function isResearchJobAwaitingManual(job: {
  status: ResearchJobStatus;
  provider_key?: ResearchProviderKey;
  error_message?: string | null;
  options?: Record<string, unknown> | null;
}): boolean {
  if (job.status === "awaiting_manual") return true;
  if (job.options?.live_blocked) return true;
  // Legacy failed jobs from before awaiting_manual status.
  if (
    job.status === "failed" &&
    typeof job.error_message === "string" &&
    /blokk/i.test(job.error_message)
  ) {
    return true;
  }
  return false;
}

/** Core fields research tries to fill (never invent). */
export const RESEARCH_TRACKED_FIELDS = [
  "year",
  "price_nok",
  "range_km",
  "winter_range_km",
  "real_world_range_km",
  "battery_kwh",
  "battery_total_kwh",
  "battery_usable_kwh",
  "battery_chemistry",
  "dc_charging_kw",
  "ac_charging_kw",
  "charge_time_10_80_minutes",
  "charging_connector_ac",
  "charging_connector_dc",
  "drivetrain",
  "consumption_kwh_100km",
  "power_hp",
  "torque_nm",
  "acceleration_0_100",
  "top_speed_kmh",
  "seats",
  "cargo_l",
  "frunk_l",
  "towing_kg",
  "length_mm",
  "width_mm",
  "height_mm",
  "wheelbase_mm",
  "curb_weight_kg",
  "gross_weight_kg",
  "vehicle_type",
  "body_style",
  "warranty",
  "heat_pump",
  "description",
] as const;

export type ResearchTrackedField = (typeof RESEARCH_TRACKED_FIELDS)[number];
