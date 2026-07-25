export type CarGalleryImage = {
  id: string;
  imageUrl: string;
  imageType: "front" | "rear" | "side" | "interior" | "cargo" | "detail" | "other";
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type CarVariant = {
  id: string;
  slug: string;
  name: string;
  trimLevel: string | null;
  modelYear: number | null;
  priceNok: number | null;
  batteryTotalKwh: number | null;
  batteryUsableKwh: number | null;
  rangeKm: number | null;
  winterRangeKm: number | null;
  realWorldRangeKm: number | null;
  consumptionKwh100km: number | null;
  acKw: number | null;
  dcKw: number | null;
  chargeTime1080Minutes: number | null;
  drive: "Forhjulsdrift" | "Bakhjulsdrift" | "Firehjulsdrift" | null;
  powerHp: number | null;
  torqueNm: number | null;
  acceleration0100: number | null;
  topSpeedKmh: number | null;
  towingKg: number | null;
  curbWeightKg: number | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  sourceName: string | null;
  sourceUrl: string | null;
  dataLastCheckedAt: string | null;
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
  /** Active variants from public.car_variants (optional). */
  variants?: CarVariant[];
  /** Currently selected variant slug when specs are overlaid. */
  selectedVariantSlug?: string | null;
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
  variant?: string | null;
  trimLevel?: string | null;
  modelGeneration?: string | null;
  batteryTotalKwh?: number | null;
  batteryUsableKwh?: number | null;
  batteryChemistry?: string | null;
  winterRangeKm?: number | null;
  realWorldRangeKm?: number | null;
  chargeTime1080Minutes?: number | null;
  chargingConnectorAc?: string | null;
  chargingConnectorDc?: string | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  wheelbaseMm?: number | null;
  curbWeightKg?: number | null;
  grossWeightKg?: number | null;
  frunkL?: number | null;
  heatPump?: boolean | null;
  v2l?: boolean | null;
  v2g?: boolean | null;
  appleCarplay?: boolean | null;
  androidAuto?: boolean | null;
  headUpDisplay?: boolean | null;
  panoramicRoof?: boolean | null;
  otaUpdates?: boolean | null;
  pros?: string[] | null;
  cons?: string[] | null;
  suitableFor?: string[] | null;
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
