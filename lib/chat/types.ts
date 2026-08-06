export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatCarFact = {
  slug: string;
  brand: string;
  model: string;
  url: string;
  year: number | null;
  bodyStyle: string | null;
  seats: number | null;
  priceNok: number | null;
  rangeKm: number | null;
  winterRangeKm: number | null;
  batteryKwh: number | null;
  batteryUsableKwh: number | null;
  dcKw: number | null;
  acKw: number | null;
  chargeTime1080Minutes: number | null;
  consumptionKwh100km: number | null;
  drive: string | null;
  cargoL: number | null;
  towingKg: number | null;
  suitableFor: string[] | null;
  heatPump: boolean | null;
};

export type ChatSearchResult = {
  intent:
    | "general"
    | "compare"
    | "longest_range"
    | "budget"
    | "family"
    | "charging"
    | "battery"
    | "model_lookup";
  cars: ChatCarFact[];
  notes: string[];
};

export type ChatApiSuccess = {
  ok: true;
  reply: string;
  cars: Array<{ slug: string; brand: string; model: string; url: string }>;
};

export type ChatApiError = {
  ok: false;
  error: string;
};
