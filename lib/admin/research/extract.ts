import { slugify } from "@/lib/admin/import/parse-csv";
import type {
  ResearchFieldValue,
  ResearchModelProposal,
  ResearchProviderKey,
  ResearchSourceMeta,
  ResearchVariantProposal,
} from "@/lib/admin/research/types";
import { RESEARCH_TRACKED_FIELDS } from "@/lib/admin/research/types";
import { detectConflicts } from "@/lib/admin/research/conflicts";

function sourceMeta(input: {
  sourceName?: string | null;
  sourceUrl?: string | null;
  providerKey: ResearchProviderKey;
  confidence: number;
  isSecondary?: boolean;
}): ResearchSourceMeta {
  return {
    source_name: input.sourceName ?? null,
    source_url: input.sourceUrl ?? null,
    retrieved_at: new Date().toISOString(),
    confidence: input.confidence,
    provider_key: input.providerKey,
    is_secondary: input.isSecondary,
  };
}

function field(
  key: string,
  value: ResearchFieldValue["value"],
  source: ResearchSourceMeta,
  notes?: string,
): ResearchFieldValue {
  return { field_key: key, value, source, notes: notes ?? null };
}

/** Extract a number near a label (Norwegian/English). Never invents. */
function extractNumberNear(
  text: string,
  patterns: RegExp[],
): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const raw = (match[1] ?? "").replace(/\s/g, "").replace(",", ".");
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function extractIntNear(text: string, patterns: RegExp[]): number | null {
  const n = extractNumberNear(text, patterns);
  return n == null ? null : Math.trunc(n);
}

function extractBoolNear(text: string, patterns: RegExp[]): boolean | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const token = (match[1] ?? match[0] ?? "").toLowerCase();
    if (["ja", "yes", "true", "inkl", "included"].some((t) => token.includes(t))) {
      return true;
    }
    if (["nei", "no", "false", "ikke"].some((t) => token.includes(t))) {
      return false;
    }
  }
  return null;
}

/**
 * Heuristic extraction from pasted manufacturer text / HTML-ish content.
 * Only returns values matched by patterns — never invents.
 */
export function extractFieldsFromText(
  text: string,
  source: ResearchSourceMeta,
): ResearchFieldValue[] {
  const fields: ResearchFieldValue[] = [];
  const t = text.replace(/\u00a0/g, " ");

  const push = (key: string, value: ResearchFieldValue["value"]) => {
    if (value == null || value === "") return;
    fields.push(field(key, value, source));
  };

  push(
    "range_km",
    extractIntNear(t, [
      /(?:WLTP[^.\n]{0,40}?|rekkevidde[^.\n]{0,20}?)(\d{2,4})\s*km/i,
      /(\d{2,4})\s*km\s*(?:WLTP|rekkevidde)/i,
    ]),
  );
  push(
    "winter_range_km",
    extractIntNear(t, [/(?:vinterrekkevidde|winter range)[^.\n]{0,20}?(\d{2,4})\s*km/i]),
  );
  push(
    "battery_usable_kwh",
    extractNumberNear(t, [
      /(?:brukbart|usable)[^.\n]{0,20}?(\d{2,3}(?:[.,]\d+)?)\s*kwh/i,
      /(\d{2,3}(?:[.,]\d+)?)\s*kwh\s*(?:brukbart|usable)/i,
    ]),
  );
  push(
    "battery_total_kwh",
    extractNumberNear(t, [
      /(?:totalt|total|nominell)[^.\n]{0,20}?(\d{2,3}(?:[.,]\d+)?)\s*kwh/i,
    ]),
  );
  push(
    "battery_kwh",
    extractNumberNear(t, [/(\d{2,3}(?:[.,]\d+)?)\s*kwh/i]),
  );
  push(
    "dc_charging_kw",
    extractIntNear(t, [
      /(?:DC|hurtiglading|max\.?\s*ladeeffekt)[^.\n]{0,30}?(\d{2,3})\s*kW/i,
      /(\d{2,3})\s*kW\s*(?:DC|CCS)/i,
    ]),
  );
  push(
    "ac_charging_kw",
    extractNumberNear(t, [/(?:AC|ombordlader)[^.\n]{0,20}?(\d{1,2}(?:[.,]\d+)?)\s*kW/i]),
  );
  push(
    "charge_time_10_80_minutes",
    extractIntNear(t, [
      /10\s*[–\-]\s*80\s*%[^.\n]{0,20}?(\d{1,3})\s*min/i,
      /(\d{1,3})\s*min[^.\n]{0,20}?10\s*[–\-]\s*80/i,
    ]),
  );
  push(
    "power_hp",
    extractIntNear(t, [/(?:effekt|power)[^.\n]{0,20}?(\d{2,4})\s*(?:hk|hp)/i]),
  );
  push(
    "torque_nm",
    extractIntNear(t, [/(?:moment|torque)[^.\n]{0,20}?(\d{2,4})\s*nm/i]),
  );
  push(
    "acceleration_0_100",
    extractNumberNear(t, [
      /0\s*[–\-]\s*100[^.\n]{0,20}?(\d{1,2}(?:[.,]\d+)?)\s*s/i,
    ]),
  );
  push(
    "top_speed_kmh",
    extractIntNear(t, [/(?:toppfart|top speed)[^.\n]{0,20}?(\d{2,3})\s*km/i]),
  );
  push(
    "consumption_kwh_100km",
    extractNumberNear(t, [
      /(?:forbruk|consumption)[^.\n]{0,30}?(\d{1,2}(?:[.,]\d+)?)\s*kwh\s*\/?\s*100/i,
    ]),
  );
  push(
    "seats",
    extractIntNear(t, [/(?:seter|seats)[^.\n]{0,10}?(\d{1,2})/i]),
  );
  push(
    "cargo_l",
    extractIntNear(t, [
      /(?:bagasjerom|luggage|cargo)[^.\n]{0,20}?(\d{2,4})\s*l/i,
    ]),
  );
  push(
    "towing_kg",
    extractIntNear(t, [
      /(?:tilhenger|towing)[^.\n]{0,30}?(\d{3,4})\s*kg/i,
    ]),
  );
  push(
    "curb_weight_kg",
    extractIntNear(t, [/(?:egenvekt|curb weight)[^.\n]{0,20}?(\d{3,4})\s*kg/i]),
  );
  push(
    "price_nok",
    extractIntNear(t, [
      /(?:pris|price|fra)[^.\n]{0,20}?(\d{1,3}(?:[\s ]?\d{3})+)\s*(?:kr|nok)?/i,
    ]),
  );
  push(
    "year",
    extractIntNear(t, [/(?:årsmodell|model year|årgang)\s*[:=]?\s*(20\d{2})/i]),
  );

  const heat = extractBoolNear(t, [/(?:varmepumpe|heat pump)[^.\n]{0,20}\b(ja|nei|yes|no)\b/i]);
  if (heat != null) push("heat_pump", heat);

  if (/\bCCS2?\b/i.test(t)) push("charging_connector_dc", "CCS2");
  if (/\bType\s*2\b/i.test(t)) push("charging_connector_ac", "Type 2");
  if (/\bNACS\b/i.test(t)) push("charging_connector_dc", "NACS");

  if (/\bFirehjulsdrift\b|\bAWD\b|\b4WD\b|\bquattro\b|\b4MATIC\b/i.test(t)) {
    push("drivetrain", "Firehjulsdrift");
  } else if (/\bBakhjulsdrift\b|\bRWD\b/i.test(t)) {
    push("drivetrain", "Bakhjulsdrift");
  } else if (/\bForhjulsdrift\b|\bFWD\b/i.test(t)) {
    push("drivetrain", "Forhjulsdrift");
  }

  // Deduplicate: keep first match per field (conflicts handled across sources).
  const byKey = new Map<string, ResearchFieldValue>();
  for (const item of fields) {
    if (!byKey.has(item.field_key)) byKey.set(item.field_key, item);
  }
  return [...byKey.values()];
}

function parseVariantHeadings(text: string): string[] {
  const names: string[] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(
      /^(?:variant|trim|utgave)\s*[:\-]\s*(.+)$/i,
    );
    if (match?.[1]) {
      names.push(match[1].trim());
      continue;
    }
    if (
      /^(Long Range|Performance|Standard Range|RWD|AWD|Plaid|Pro|GTX|Single Motor|Twin Motor)\b/i.test(
        trimmed,
      ) &&
      trimmed.length < 60
    ) {
      names.push(trimmed);
    }
  }
  return [...new Set(names)].slice(0, 12);
}

export function buildModelProposalFromText(input: {
  brand: string;
  model: string;
  text: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  providerKey: ResearchProviderKey;
  confidence?: number;
  isSecondary?: boolean;
}): ResearchModelProposal {
  const source = sourceMeta({
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    providerKey: input.providerKey,
    confidence: input.confidence ?? 0.6,
    isSecondary: input.isSecondary,
  });

  const slug = slugify(`${input.brand} ${input.model}`) || "bil";
  const fields = extractFieldsFromText(input.text, source);
  const variantNames = parseVariantHeadings(input.text);

  const variants: ResearchVariantProposal[] = variantNames.map((name, index) => ({
    name,
    slug: slugify(name) || `variant-${index + 1}`,
    is_default: index === 0,
    fields: [], // variant-specific extraction requires clearer sectioning; leave empty
  }));

  const proposal: ResearchModelProposal = {
    brand: input.brand.trim(),
    model: input.model.trim(),
    slug,
    fields,
    variants,
    images: [],
    warnings: [],
    missing_fields: [],
    conflicts: [],
  };

  if (source.is_secondary) {
    proposal.warnings.push(
      "Sekundærkilde brukt — merk og verifiser før publisering.",
    );
  }

  const imageUrls = [
    ...input.text.matchAll(
      /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi,
    ),
  ].map((m) => m[0]);

  for (const url of imageUrls.slice(0, 8)) {
    proposal.images.push({
      original_url: url,
      source_name: input.sourceName ?? null,
      source_url: input.sourceUrl ?? url,
      license_note: "Candidate only — verify manufacturer press/media usage terms.",
      usage_terms: "Not approved for publish until admin confirms license.",
      is_primary_candidate: proposal.images.length === 0,
    });
  }

  const [enriched] = detectConflicts([proposal]);
  return enriched ?? proposal;
}

export function parseStructuredResearchJson(
  content: string,
  fallback: {
    brand?: string | null;
    sourceName?: string | null;
    sourceUrl?: string | null;
  },
): { models: ResearchModelProposal[]; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { models: [], errors: ["JSON er ugyldig."], warnings };
  }

  const root = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  const list: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(root?.cars)
      ? (root!.cars as unknown[])
      : Array.isArray(root?.models)
        ? (root!.models as unknown[])
        : [];

  if (list.length === 0) {
    return { models: [], errors: ["Fant ingen modeller i JSON."], warnings };
  }

  const source = sourceMeta({
    sourceName: fallback.sourceName ?? (root?.source_name as string) ?? null,
    sourceUrl: fallback.sourceUrl ?? (root?.source_url as string) ?? null,
    providerKey: "structured_json",
    confidence: 0.85,
  });

  const models: ResearchModelProposal[] = [];

  list.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errors.push(`Rad ${index + 1}: forventet objekt.`);
      return;
    }
    const obj = item as Record<string, unknown>;
    const brand = String(obj.brand ?? fallback.brand ?? "").trim();
    const model = String(obj.model ?? "").trim();
    if (!brand || !model) {
      errors.push(`Rad ${index + 1}: brand og model er påkrevd.`);
      return;
    }

    const fields: ResearchFieldValue[] = [];
    for (const key of RESEARCH_TRACKED_FIELDS) {
      if (!(key in obj)) continue;
      const value = obj[key];
      if (value == null || value === "") continue;
      fields.push(
        field(
          key,
          value as ResearchFieldValue["value"],
          {
            ...source,
            source_name:
              (obj.source_name as string) || source.source_name,
            source_url: (obj.source_url as string) || source.source_url,
          },
        ),
      );
    }

    const variantsRaw = Array.isArray(obj.variants) ? obj.variants : [];
    const variants: ResearchVariantProposal[] = [];
    variantsRaw.forEach((variant, vIndex) => {
      if (!variant || typeof variant !== "object") return;
      const v = variant as Record<string, unknown>;
      const name = String(v.name ?? v.variant ?? "").trim();
      if (!name) return;
      const vFields: ResearchFieldValue[] = [];
      for (const key of RESEARCH_TRACKED_FIELDS) {
        if (!(key in v)) continue;
        const value = v[key];
        if (value == null || value === "") continue;
        vFields.push(field(key, value as ResearchFieldValue["value"], source));
      }
      variants.push({
        name,
        slug: String(v.slug ?? slugify(name) ?? `variant-${vIndex + 1}`),
        is_default: Boolean(v.is_default) || vIndex === 0,
        fields: vFields,
      });
    });

    const proposal: ResearchModelProposal = {
      brand,
      model,
      slug: String(obj.slug ?? slugify(`${brand} ${model}`) ?? `bil-${index + 1}`),
      fields,
      variants,
      images: Array.isArray(obj.image_candidates)
        ? (obj.image_candidates as ResearchModelProposal["images"])
        : [],
      warnings: [],
      missing_fields: [],
      conflicts: [],
    };
    models.push(proposal);
  });

  return { models: detectConflicts(models), errors, warnings };
}
