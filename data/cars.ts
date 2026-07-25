export type CarGalleryImage = {
  id: string;
  imageUrl: string;
  imageType: "front" | "rear" | "side" | "interior" | "cargo" | "detail" | "other";
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type Car = {
  slug: string;
  brand: string;
  model: string;
  priceNok: number;
  rangeKm: number;
  batteryKwh: number;
  dcKw: number;
  acKw: number;
  drive: "Forhjulsdrift" | "Bakhjulsdrift" | "Firehjulsdrift";
  description: string;
  updated: string;
  /** Primary / legacy image; falls back to /images/cars/{slug}.webp */
  imageUrl?: string | null;
  /** Multi-image gallery from public.car_images (optional) */
  images?: CarGalleryImage[];
  year?: number | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  dataLastCheckedAt?: string | null;
  /** Extended EV fields from public.cars (optional for backwards compatibility) */
  consumptionKwh100km?: number | null;
  powerHp?: number | null;
  torqueNm?: number | null;
  acceleration0100?: number | null;
  topSpeedKmh?: number | null;
  seats?: number | null;
  cargoL?: number | null;
  towingKg?: number | null;
  warranty?: string | null;
  vehicleType?: string | null;
  bodyStyle?: string | null;
  /** Manual EVFAKTA scores (0–10). Never auto-generated. */
  rangeScore?: number | null;
  chargingScore?: number | null;
  winterScore?: number | null;
  comfortScore?: number | null;
  spaceScore?: number | null;
  valueScore?: number | null;
  reliabilityScore?: number | null;
  overallScore?: number | null;
  scoreNotes?: string | null;
  scoreMethodology?: string | null;
};

export const cars: Car[] = [
  {
    slug: "toyota-c-hr-plus",
    brand: "Toyota",
    model: "C-HR+",
    priceNok: 0,
    rangeKm: 0,
    batteryKwh: 0,
    dcKw: 0,
    acKw: 11,
    drive: "Forhjulsdrift",
    description: "Ny elektrisk crossover. Tallene er plassholdere og må fylles inn fra norske Toyota-kilder.",
    updated: "21.07.2026",
  },
  {
    slug: "tesla-model-y",
    brand: "Tesla",
    model: "Model Y",
    priceNok: 499990,
    rangeKm: 568,
    batteryKwh: 75,
    dcKw: 250,
    acKw: 11,
    drive: "Firehjulsdrift",
    description: "En romslig elektrisk SUV med lang rekkevidde og stort ladenettverk.",
    updated: "21.07.2026",
  },
  {
    slug: "volkswagen-id-4",
    brand: "Volkswagen",
    model: "ID.4",
    priceNok: 489900,
    rangeKm: 550,
    batteryKwh: 77,
    dcKw: 175,
    acKw: 11,
    drive: "Bakhjulsdrift",
    description: "Familievennlig elektrisk SUV med god plass og komfort.",
    updated: "21.07.2026",
  },
  {
    slug: "byd-seal-u",
    brand: "BYD",
    model: "Seal U",
    priceNok: 469900,
    rangeKm: 500,
    batteryKwh: 87,
    dcKw: 140,
    acKw: 11,
    drive: "Forhjulsdrift",
    description: "Elektrisk SUV med god standardutrustning og romslig kupé.",
    updated: "21.07.2026",
  },
];
