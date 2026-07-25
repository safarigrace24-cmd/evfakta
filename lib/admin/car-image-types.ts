export type CarImageType =
  | "front"
  | "rear"
  | "side"
  | "interior"
  | "cargo"
  | "detail"
  | "other";

export type CarImageRow = {
  id: string;
  car_id: string;
  image_url: string;
  storage_path: string;
  image_type: CarImageType;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

export const CAR_IMAGE_TYPE_OPTIONS: CarImageType[] = [
  "front",
  "rear",
  "side",
  "interior",
  "cargo",
  "detail",
  "other",
];

export const CAR_IMAGE_TYPE_LABELS: Record<CarImageType, string> = {
  front: "Front",
  rear: "Bak",
  side: "Side",
  interior: "Interiør",
  cargo: "Bagasjerom",
  detail: "Detalj",
  other: "Annet",
};

export function isCarImageType(value: string): value is CarImageType {
  return (CAR_IMAGE_TYPE_OPTIONS as readonly string[]).includes(value);
}
