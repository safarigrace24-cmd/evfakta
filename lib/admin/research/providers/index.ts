import {
  buildModelProposalFromText,
  parseStructuredResearchJson,
} from "@/lib/admin/research/extract";
import { findDuplicateSlugs } from "@/lib/admin/research/conflicts";
import {
  DEFAULT_MISSING_DATA_CHECKLIST,
  MASTER_CATALOG_MODELS,
} from "@/lib/admin/master-catalog";
import type {
  ResearchModelProposal,
  ResearchProvider,
  ResearchProviderInput,
  ResearchProviderResult,
} from "@/lib/admin/research/types";

function emptyShellProposal(input: {
  brand: string;
  model: string;
  slug: string;
  sourceName: string;
  sourceUrl: string;
  expectedVariants?: string[];
}): ResearchModelProposal {
  return {
    brand: input.brand,
    model: input.model,
    slug: input.slug,
    fields: [],
    variants: (input.expectedVariants ?? []).map((name, index) => ({
      name,
      slug: `${input.slug}-${name}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      fields: [],
      is_default: index === 0,
    })),
    images: [],
    warnings: [
      "Tomt skall fra masterkatalog / produsentside — ingen spesifikasjoner er diktet opp.",
    ],
    missing_fields: [...DEFAULT_MISSING_DATA_CHECKLIST],
    conflicts: [],
  };
}

function htmlToText(body: string): string {
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 200_000);
}

function researchBrandCatalogFromHtml(input: {
  brand: string;
  text: string;
  sourceName: string;
  sourceUrl: string;
}): ResearchProviderResult {
  const brandLower = input.brand.toLowerCase();
  const catalogModels = MASTER_CATALOG_MODELS.filter(
    (entry) => entry.brand.toLowerCase() === brandLower,
  );

  if (catalogModels.length === 0) {
    return {
      models: [
        emptyShellProposal({
          brand: input.brand,
          model: "Ukjent modell",
          slug: `${brandLower.replace(/[^a-z0-9]+/g, "-")}-ukjent`,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
        }),
      ],
      warnings: [
        "Ingen masterkatalog-modeller for merket. Angi modell under Avansert, eller lim inn spesifikasjonstekst.",
      ],
      errors: [],
      progressMessage: "Hentet produsentside — ingen kjente modeller i masterkatalog.",
    };
  }

  const models: ResearchModelProposal[] = [];
  const warnings: string[] = [
    "CMS-research: foreslo modeller fra masterkatalog mot produsentside.",
    "Kontroller alle verdier før godkjenning — systemet diktet ikke opp tall.",
  ];

  for (const entry of catalogModels) {
    const mentioned = input.text
      .toLowerCase()
      .includes(entry.model.toLowerCase());
    if (mentioned) {
      const proposal = buildModelProposalFromText({
        brand: input.brand,
        model: entry.model,
        text: input.text,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        providerKey: "manufacturer_http",
        confidence: 0.5,
      });
      if (proposal.variants.length === 0 && entry.expectedVariants.length > 0) {
        proposal.variants = emptyShellProposal({
          brand: entry.brand,
          model: entry.model,
          slug: entry.slug,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          expectedVariants: entry.expectedVariants,
        }).variants;
      }
      models.push(proposal);
    } else {
      models.push(
        emptyShellProposal({
          brand: entry.brand,
          model: entry.model,
          slug: entry.slug,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          expectedVariants: entry.expectedVariants,
        }),
      );
      warnings.push(
        `${entry.model}: ikke nevnt eksplisitt på siden — tomt skall uten spesifikasjoner.`,
      );
    }
  }

  return {
    models,
    warnings,
    errors: [],
    progressMessage: `Foreslo ${models.length} modeller for ${input.brand}.`,
  };
}

async function runManual(
  input: ResearchProviderInput,
): Promise<ResearchProviderResult> {
  const text = (input.rawInput ?? "").trim();
  if (!text) {
    return {
      models: [],
      warnings: [],
      errors: ["Lim inn spesifikasjonstekst eller last opp et dokument."],
    };
  }

  // Prefer structured JSON when content looks like JSON.
  if (text.startsWith("{") || text.startsWith("[")) {
    const structured = parseStructuredResearchJson(text, {
      brand: input.brandName,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
    });
    if (structured.models.length > 0) {
      const dupes = findDuplicateSlugs(structured.models);
      const warnings = [...structured.warnings];
      if (dupes.length) {
        warnings.push(`Duplikate slug i resultatet: ${dupes.join(", ")}`);
      }
      return {
        models: structured.models,
        warnings,
        errors: structured.errors,
      };
    }
  }

  const brand = (input.brandName ?? "").trim();
  const model = (input.modelQuery ?? "").trim();
  if (!brand || !model) {
    return {
      models: [],
      warnings: [],
      errors: [
        "For fri tekst må merke og modell angis, eller lim inn strukturert JSON med brand/model.",
      ],
    };
  }

  const proposal = buildModelProposalFromText({
    brand,
    model,
    text,
    sourceName: input.sourceName ?? "Manuell kilde",
    sourceUrl: input.sourceUrl,
    providerKey: "manual",
    confidence: 0.65,
  });

  return {
    models: [proposal],
    warnings: proposal.warnings,
    errors: [],
    progressMessage: "Ekstraherte felter fra manuell tekst.",
  };
}

async function runManufacturerHttp(
  input: ResearchProviderInput,
): Promise<ResearchProviderResult> {
  const url = (input.sourceUrl ?? "").trim();
  if (!url) {
    return {
      models: [],
      warnings: [],
      errors: ["Oppgi source_url for live henting."],
      blocked: false,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "EVFAKTA Research Bot (+https://www.evfakta.no; admin research)",
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (response.status === 403 || response.status === 401 || response.status === 429) {
      return {
        models: [],
        warnings: [
          `HTTP ${response.status}: produsenten blokkerte automatisk tilgang (forventet for enkelte merker).`,
        ],
        errors: [],
        blocked: true,
        progressMessage: `Kilden svarte ${response.status}.`,
      };
    }

    if (!response.ok) {
      const blocked = response.status === 403 || response.status >= 500;
      return {
        models: [],
        warnings: blocked
          ? [`Kunne ikke hente kilde (${response.status}).`]
          : [],
        errors: blocked ? [] : [`Kunne ikke hente kilde (${response.status}).`],
        blocked,
        progressMessage: blocked
          ? `Kilden svarte ${response.status}.`
          : undefined,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    const body = await response.text();

    if (contentType.includes("application/json") || body.trim().startsWith("{")) {
      const structured = parseStructuredResearchJson(body, {
        brand: input.brandName,
        sourceName: input.sourceName ?? "Manufacturer JSON",
        sourceUrl: url,
      });
      return {
        models: structured.models,
        warnings: [
          ...structured.warnings,
          "Live JSON hentet — verifiser at kilden er offisiell.",
        ],
        errors: structured.errors,
      };
    }

    const brand = (input.brandName ?? "").trim();
    const model = (input.modelQuery ?? "").trim();
    const text = htmlToText(body);
    const sourceName = input.sourceName ?? "Produsentside";

    if (!brand) {
      return {
        models: [],
        warnings: [],
        errors: ["Velg merke før research startes."],
      };
    }

    // CMS default: brand + source URL (no model paste required).
    if (!model) {
      return researchBrandCatalogFromHtml({
        brand,
        text,
        sourceName,
        sourceUrl: url,
      });
    }

    const proposal = buildModelProposalFromText({
      brand,
      model,
      text,
      sourceName,
      sourceUrl: url,
      providerKey: "manufacturer_http",
      confidence: 0.55,
    });

    return {
      models: [proposal],
      warnings: [
        ...proposal.warnings,
        "Automatisk HTML-ekstraksjon er heuristisk — kontroller alle verdier.",
      ],
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent nettverksfeil";
    const blocked =
      message.includes("abort") ||
      message.includes("Blocked") ||
      message.includes("fetch failed");
    return {
      models: [],
      warnings: [],
      errors: blocked
        ? []
        : [`Live henting feilet: ${message}`],
      blocked: true,
      progressMessage:
        "Live henting ble blokkert eller feilet (forventet for enkelte produsenter).",
    };
  }
}

async function runStructuredJson(
  input: ResearchProviderInput,
): Promise<ResearchProviderResult> {
  const text = (input.rawInput ?? "").trim();
  if (!text) {
    return { models: [], warnings: [], errors: ["Lim inn JSON."] };
  }
  const structured = parseStructuredResearchJson(text, {
    brand: input.brandName,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
  });
  const dupes = findDuplicateSlugs(structured.models);
  const warnings = [...structured.warnings];
  if (dupes.length) warnings.push(`Duplikate slug: ${dupes.join(", ")}`);
  return {
    models: structured.models,
    warnings,
    errors: structured.errors,
  };
}

async function runStub(
  input: ResearchProviderInput,
): Promise<ResearchProviderResult> {
  const brand = (input.brandName ?? "Ukjent").trim();
  const model = (input.modelQuery ?? "Modell").trim();
  return {
    models: [
      {
        brand,
        model,
        slug: `${brand}-${model}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        fields: [],
        variants: [],
        images: [],
        warnings: [
          "Stub-provider returnerer tomt skall uten spesifikasjoner (ingen oppdiktede tall).",
        ],
        missing_fields: [
          "range_km",
          "battery_usable_kwh",
          "dc_charging_kw",
          "drivetrain",
          "consumption_kwh_100km",
          "power_hp",
        ],
        conflicts: [],
      },
    ],
    warnings: ["Stub brukt — erstatt med manuell eller manufacturer_http."],
    errors: [],
  };
}

export const RESEARCH_PROVIDERS: ResearchProvider[] = [
  {
    key: "manual",
    label: "Manuell kilde (lim inn / fil)",
    description:
      "Lim inn tekst, CSV/JSON eller utdrag fra produsent-PDF. Anbefalt når nettsteder blokkerer bot-tilgang.",
    supportsLive: false,
    run: runManual,
  },
  {
    key: "manufacturer_http",
    label: "Offisiell produsent-URL",
    description:
      "Standard CMS-flyt: henter produsentside og foreslår modeller. Ved blokkering: åpne Avansert og lim inn manuelt.",
    supportsLive: true,
    run: runManufacturerHttp,
  },
  {
    key: "structured_json",
    label: "Strukturert JSON",
    description: "Importer research-JSON med brand/model/fields/variants/image_candidates.",
    supportsLive: false,
    run: runStructuredJson,
  },
  {
    key: "stub",
    label: "Tomt skall (test)",
    description: "Oppretter tomt modellskall uten spesifikasjoner.",
    supportsLive: false,
    run: runStub,
  },
];

export function getResearchProvider(key: string): ResearchProvider | null {
  return RESEARCH_PROVIDERS.find((provider) => provider.key === key) ?? null;
}

export async function runResearchProvider(
  key: string,
  input: ResearchProviderInput,
): Promise<ResearchProviderResult> {
  const provider = getResearchProvider(key) ?? getResearchProvider("manual");
  if (!provider) {
    return { models: [], warnings: [], errors: ["Ukjent provider."] };
  }
  return provider.run(input);
}
