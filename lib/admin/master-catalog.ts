/**
 * EVFAKTA Master Catalog — first 50 priority models for Norway.
 * Source of truth for planning + /admin/import progress.
 * Specs are never invented here; only identity and workflow metadata.
 */

export type MasterCatalogStatus =
  | "planned"
  | "shell"
  | "partial"
  | "ready"
  | "published";

export type MasterAssetStatus = "missing" | "placeholder" | "present" | "verified";

export type MasterReviewStatus =
  | "not_started"
  | "needs_review"
  | "approved"
  | "published";

export type MasterCatalogModel = {
  brand: string;
  model: string;
  slug: string;
  expectedVariants: string[];
  catalogStatus: MasterCatalogStatus;
  missingDataChecklist: string[];
  imageStatus: MasterAssetStatus;
  sourceStatus: MasterAssetStatus;
  reviewStatus: MasterReviewStatus;
  batch?: string | null;
};

export const DEFAULT_MISSING_DATA_CHECKLIST = [
  "price_nok",
  "range_km / winter_range_km",
  "battery_total_kwh / battery_usable_kwh",
  "dc_charging_kw / charge_time_10_80_minutes",
  "drivetrain / power_hp",
  "dimensions / weights",
  "official Norwegian source",
  "primary image + gallery",
  "variant specs (if multi-trim)",
] as const;

function entry(
  brand: string,
  model: string,
  slug: string,
  expectedVariants: string[],
  extras: Partial<MasterCatalogModel> = {},
): MasterCatalogModel {
  return {
    brand,
    model,
    slug,
    expectedVariants,
    catalogStatus: "planned",
    missingDataChecklist: [...DEFAULT_MISSING_DATA_CHECKLIST],
    imageStatus: "missing",
    sourceStatus: "missing",
    reviewStatus: "not_started",
    batch: null,
    ...extras,
  };
}

/** First 50 important EV models for the Norwegian market, grouped by brand. */
export const MASTER_CATALOG_MODELS: MasterCatalogModel[] = [
  // Tesla (4) — batch 01 shells
  entry("Tesla", "Model 3", "tesla-model-3", [
    "Rear-Wheel Drive",
    "Long Range AWD",
    "Performance",
  ], { batch: "catalog-batch-01-tesla", catalogStatus: "shell" }),
  entry("Tesla", "Model Y", "tesla-model-y", [
    "Long Range RWD",
    "Long Range AWD",
    "Performance",
  ], { batch: "catalog-batch-01-tesla", catalogStatus: "shell" }),
  entry("Tesla", "Model S", "tesla-model-s", ["Model S", "Plaid"], {
    batch: "catalog-batch-01-tesla",
    catalogStatus: "shell",
  }),
  entry("Tesla", "Model X", "tesla-model-x", ["Model X", "Plaid"], {
    batch: "catalog-batch-01-tesla",
    catalogStatus: "shell",
  }),

  // Volkswagen (3)
  entry("Volkswagen", "ID.3", "volkswagen-id-3", ["Pro", "Pro S", "GTX"]),
  entry("Volkswagen", "ID.4", "volkswagen-id-4", ["Pro", "Pro 4MOTION", "GTX"]),
  entry("Volkswagen", "ID.7", "volkswagen-id-7", ["Pro", "Pro S", "GTX"]),

  // Volvo (3)
  entry("Volvo", "EX30", "volvo-ex30", ["Single Motor", "Twin Motor Performance"]),
  entry("Volvo", "EX40", "volvo-ex40", ["Single Motor", "Twin Motor"]),
  entry("Volvo", "EX90", "volvo-ex90", ["Twin Motor", "Performance"]),

  // BMW (3)
  entry("BMW", "i4", "bmw-i4", ["eDrive40", "xDrive40", "M50"]),
  entry("BMW", "iX1", "bmw-ix1", ["eDrive20", "xDrive30"]),
  entry("BMW", "iX", "bmw-ix", ["xDrive40", "xDrive50", "M60"]),

  // Audi (2)
  entry("Audi", "Q4 e-tron", "audi-q4-e-tron", ["45", "55 quattro"]),
  entry("Audi", "Q6 e-tron", "audi-q6-e-tron", ["performance", "SQ6"]),

  // Kia (3)
  entry("Kia", "EV3", "kia-ev3", ["Standard Range", "Long Range", "GT-Line"]),
  entry("Kia", "EV6", "kia-ev6", ["RWD", "AWD", "GT"]),
  entry("Kia", "EV9", "kia-ev9", ["RWD", "AWD", "GT-Line"]),

  // Hyundai (3)
  entry("Hyundai", "Ioniq 5", "hyundai-ioniq-5", ["RWD", "AWD", "N"]),
  entry("Hyundai", "Ioniq 6", "hyundai-ioniq-6", ["RWD", "AWD"]),
  entry("Hyundai", "Kona Electric", "hyundai-kona-electric", [
    "Standard Range",
    "Long Range",
  ]),

  // Polestar (3)
  entry("Polestar", "2", "polestar-2", ["Long Range Single Motor", "Long Range Dual Motor"]),
  entry("Polestar", "3", "polestar-3", ["Long Range Dual Motor", "Performance"]),
  entry("Polestar", "4", "polestar-4", ["Long Range Single Motor", "Long Range Dual Motor"]),

  // BYD (3)
  entry("BYD", "Seal", "byd-seal", ["Design", "Excellence"]),
  entry("BYD", "Atto 3", "byd-atto-3", ["Comfort", "Design"]),
  entry("BYD", "Sealion 7", "byd-sealion-7", ["Comfort", "Design", "Excellence"]),

  // Toyota (2)
  entry("Toyota", "bZ4X", "toyota-bz4x", ["FWD", "AWD"]),
  entry("Toyota", "C-HR+", "toyota-c-hr-plus", ["FWD", "AWD"]),

  // Ford (2)
  entry("Ford", "Explorer EV", "ford-explorer-ev", ["Extended Range RWD", "Extended Range AWD"]),
  entry("Ford", "Mustang Mach-E", "ford-mustang-mach-e", [
    "Standard Range",
    "Extended Range",
    "GT",
  ]),

  // Mercedes-Benz (3)
  entry("Mercedes-Benz", "EQA", "mercedes-benz-eqa", ["250+", "350 4MATIC"]),
  entry("Mercedes-Benz", "EQB", "mercedes-benz-eqb", ["250+", "350 4MATIC"]),
  entry("Mercedes-Benz", "EQE", "mercedes-benz-eqe", ["350+", "500 4MATIC"]),

  // Nissan (2)
  entry("Nissan", "Leaf", "nissan-leaf", ["Base", "e+"]),
  entry("Nissan", "Ariya", "nissan-ariya", ["Engage", "Evolve+", "e-4ORCE"]),

  // MG (2)
  entry("MG", "MG4", "mg-mg4", ["Standard", "Luxury", "XPower"]),
  entry("MG", "ZS EV", "mg-zs-ev", ["Standard", "Long Range"]),

  // Renault (2)
  entry("Renault", "Megane E-Tech", "renault-megane-e-tech", [
    "Equilibre",
    "Techno",
    "Iconic",
  ]),
  entry("Renault", "5 E-Tech", "renault-5-e-tech", ["Evolution", "Techno", "Iconic"]),

  // Xpeng (2)
  entry("Xpeng", "G6", "xpeng-g6", ["RWD Standard", "RWD Long Range", "AWD Performance"]),
  entry("Xpeng", "G9", "xpeng-g9", ["RWD Long Range", "AWD Performance"]),

  // Zeekr (2)
  entry("Zeekr", "001", "zeekr-001", ["Long Range RWD", "Performance AWD"]),
  entry("Zeekr", "7X", "zeekr-7x", ["Long Range RWD", "Performance AWD"]),

  // Skoda (2)
  entry("Skoda", "Enyaq", "skoda-enyaq", ["60", "85", "85x", "vRS"]),
  entry("Skoda", "Elroq", "skoda-elroq", ["50", "60", "85"]),

  // Cupra (2)
  entry("Cupra", "Born", "cupra-born", ["V1", "V2", "VZ"]),
  entry("Cupra", "Tavascan", "cupra-tavascan", ["Endurance", "VZ"]),

  // Peugeot (2)
  entry("Peugeot", "e-208", "peugeot-e-208", ["Active", "Allure", "GT"]),
  entry("Peugeot", "E-3008", "peugeot-e-3008", ["Allure", "GT"]),
];

export const MASTER_CATALOG_PLANNED_COUNT = MASTER_CATALOG_MODELS.length;

export const MASTER_CATALOG_BRANDS = [
  ...new Set(MASTER_CATALOG_MODELS.map((item) => item.brand)),
] as const;

export type MasterCatalogProgress = {
  plannedModels: number;
  importedModels: number;
  needsReview: number;
  approved: number;
  published: number;
  missingImages: number;
  missingSources: number;
  notYetImported: number;
};

export type CatalogCarLite = {
  slug: string;
  is_published: boolean;
  import_status: string | null;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
};

/** Image considered present if a non-empty URL is set. */
function hasImageUrl(car: CatalogCarLite): boolean {
  return Boolean(car.image_url?.trim());
}

function hasSource(car: CatalogCarLite): boolean {
  return Boolean(car.source_name?.trim() || car.source_url?.trim());
}

export function computeMasterCatalogProgress(
  cars: CatalogCarLite[],
): MasterCatalogProgress {
  const bySlug = new Map(cars.map((car) => [car.slug, car]));

  let importedModels = 0;
  let needsReview = 0;
  let approved = 0;
  let published = 0;
  let missingImages = 0;
  let missingSources = 0;

  for (const model of MASTER_CATALOG_MODELS) {
    const car = bySlug.get(model.slug);
    if (!car) continue;

    importedModels += 1;
    if (car.is_published) published += 1;
    if (car.import_status === "needs_review") needsReview += 1;
    if (car.import_status === "approved") approved += 1;
    if (!hasImageUrl(car)) missingImages += 1;
    if (!hasSource(car)) missingSources += 1;
  }

  return {
    plannedModels: MASTER_CATALOG_PLANNED_COUNT,
    importedModels,
    needsReview,
    approved,
    published,
    missingImages,
    missingSources,
    notYetImported: MASTER_CATALOG_PLANNED_COUNT - importedModels,
  };
}

export function groupMasterCatalogByBrand(): Array<{
  brand: string;
  models: MasterCatalogModel[];
}> {
  const order: string[] = [];
  const map = new Map<string, MasterCatalogModel[]>();
  for (const model of MASTER_CATALOG_MODELS) {
    if (!map.has(model.brand)) {
      map.set(model.brand, []);
      order.push(model.brand);
    }
    map.get(model.brand)!.push(model);
  }
  return order.map((brand) => ({ brand, models: map.get(brand)! }));
}
