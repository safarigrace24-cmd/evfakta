/**
 * Curated research source presets for the CMS workflow.
 * Prefer official Norwegian manufacturer pages.
 */

export type ResearchSourcePreset = {
  id: string;
  label: string;
  sourceName: string;
  sourceUrl: string;
  /** Match against brand name (case-insensitive). Empty = always available. */
  brandNames?: string[];
};

export const RESEARCH_SOURCE_PRESETS: ResearchSourcePreset[] = [
  {
    id: "tesla-no",
    label: "Tesla Norge (offisiell)",
    sourceName: "Tesla Norge",
    sourceUrl: "https://www.tesla.com/no_NO",
    brandNames: ["Tesla"],
  },
  {
    id: "vw-no",
    label: "Volkswagen Norge (offisiell)",
    sourceName: "Volkswagen Norge",
    sourceUrl: "https://www.volkswagen.no/no/modeller.html",
    brandNames: ["Volkswagen", "VW"],
  },
  {
    id: "volvo-no",
    label: "Volvo Cars Norge (offisiell)",
    sourceName: "Volvo Cars Norge",
    sourceUrl: "https://www.volvocars.com/no/",
    brandNames: ["Volvo"],
  },
  {
    id: "bmw-no",
    label: "BMW Norge (offisiell)",
    sourceName: "BMW Norge",
    sourceUrl: "https://www.bmw.no/nb/all-models.html",
    brandNames: ["BMW"],
  },
  {
    id: "audi-no",
    label: "Audi Norge (offisiell)",
    sourceName: "Audi Norge",
    sourceUrl: "https://www.audi.no/no/modeller.html",
    brandNames: ["Audi"],
  },
  {
    id: "kia-no",
    label: "Kia Norge (offisiell)",
    sourceName: "Kia Norge",
    sourceUrl: "https://www.kia.com/no/modeller.html",
    brandNames: ["Kia"],
  },
  {
    id: "hyundai-no",
    label: "Hyundai Norge (offisiell)",
    sourceName: "Hyundai Norge",
    sourceUrl: "https://www.hyundai.com/no/no/modeller",
    brandNames: ["Hyundai"],
  },
  {
    id: "polestar-no",
    label: "Polestar Norge (offisiell)",
    sourceName: "Polestar",
    sourceUrl: "https://www.polestar.com/no/",
    brandNames: ["Polestar"],
  },
  {
    id: "byd-no",
    label: "BYD Norge (offisiell)",
    sourceName: "BYD Norge",
    sourceUrl: "https://www.byd.com/no",
    brandNames: ["BYD"],
  },
  {
    id: "toyota-no",
    label: "Toyota Norge (offisiell)",
    sourceName: "Toyota Norge",
    sourceUrl: "https://www.toyota.no/",
    brandNames: ["Toyota"],
  },
  {
    id: "ford-no",
    label: "Ford Norge (offisiell)",
    sourceName: "Ford Norge",
    sourceUrl: "https://www.ford.no/",
    brandNames: ["Ford"],
  },
  {
    id: "mercedes-no",
    label: "Mercedes-Benz Norge (offisiell)",
    sourceName: "Mercedes-Benz Norge",
    sourceUrl: "https://www.mercedes-benz.no/",
    brandNames: ["Mercedes-Benz", "Mercedes"],
  },
  {
    id: "nissan-no",
    label: "Nissan Norge (offisiell)",
    sourceName: "Nissan Norge",
    sourceUrl: "https://www.nissan.no/",
    brandNames: ["Nissan"],
  },
  {
    id: "mg-no",
    label: "MG Norge (offisiell)",
    sourceName: "MG Norge",
    sourceUrl: "https://www.mgmotor.no/",
    brandNames: ["MG"],
  },
  {
    id: "renault-no",
    label: "Renault Norge (offisiell)",
    sourceName: "Renault Norge",
    sourceUrl: "https://www.renault.no/",
    brandNames: ["Renault"],
  },
  {
    id: "xpeng-no",
    label: "Xpeng Norge (offisiell)",
    sourceName: "Xpeng Norge",
    sourceUrl: "https://www.xpeng.com/no",
    brandNames: ["Xpeng", "XPENG"],
  },
  {
    id: "zeekr-no",
    label: "Zeekr Norge (offisiell)",
    sourceName: "Zeekr",
    sourceUrl: "https://www.zeekr.eu/no-no",
    brandNames: ["Zeekr"],
  },
  {
    id: "skoda-no",
    label: "Škoda Norge (offisiell)",
    sourceName: "Škoda Norge",
    sourceUrl: "https://www.skoda.no/",
    brandNames: ["Skoda", "Škoda"],
  },
  {
    id: "cupra-no",
    label: "Cupra Norge (offisiell)",
    sourceName: "Cupra Norge",
    sourceUrl: "https://www.cupraofficial.no/",
    brandNames: ["Cupra"],
  },
  {
    id: "peugeot-no",
    label: "Peugeot Norge (offisiell)",
    sourceName: "Peugeot Norge",
    sourceUrl: "https://www.peugeot.no/",
    brandNames: ["Peugeot"],
  },
];

export function sourcesForBrand(brandName: string | null | undefined): ResearchSourcePreset[] {
  const name = (brandName ?? "").trim().toLowerCase();
  if (!name) return [];
  return RESEARCH_SOURCE_PRESETS.filter((preset) =>
    (preset.brandNames ?? []).some((item) => item.toLowerCase() === name),
  );
}
