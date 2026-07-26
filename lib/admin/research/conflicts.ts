import type {
  ResearchConflict,
  ResearchModelProposal,
  ResearchTrackedField,
} from "@/lib/admin/research/types";
import { RESEARCH_TRACKED_FIELDS } from "@/lib/admin/research/types";

function normalizeComparable(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(String).join("|");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return String(value).trim().toLowerCase();
}

/**
 * Detect conflicting values for the same field across sources.
 * Does not silently pick a winner — marks conflict warnings.
 */
export function detectFieldConflicts(
  proposal: ResearchModelProposal,
): ResearchConflict[] {
  const conflicts: ResearchConflict[] = [];

  const byField = new Map<string, typeof proposal.fields>();
  for (const item of proposal.fields) {
    const list = byField.get(item.field_key) ?? [];
    list.push(item);
    byField.set(item.field_key, list);
  }

  for (const [fieldKey, values] of byField) {
    const unique = new Map<string, (typeof values)[number]>();
    for (const value of values) {
      const key = normalizeComparable(value.value);
      if (!key) continue;
      if (!unique.has(key)) unique.set(key, value);
    }
    if (unique.size <= 1) continue;

    conflicts.push({
      field_key: fieldKey,
      entity_type: "car",
      values: [...unique.values()].map((entry) => ({
        value: entry.value,
        source: entry.source,
      })),
      message: `Konflikt for ${fieldKey}: ${unique.size} ulike verdier funnet. Velg manuelt.`,
    });
  }

  for (const variant of proposal.variants) {
    const map = new Map<string, typeof variant.fields>();
    for (const item of variant.fields) {
      const list = map.get(item.field_key) ?? [];
      list.push(item);
      map.set(item.field_key, list);
    }
    for (const [fieldKey, values] of map) {
      const unique = new Map<string, (typeof values)[number]>();
      for (const value of values) {
        const key = normalizeComparable(value.value);
        if (!key) continue;
        if (!unique.has(key)) unique.set(key, value);
      }
      if (unique.size <= 1) continue;
      conflicts.push({
        field_key: fieldKey,
        entity_type: "variant",
        variant_slug: variant.slug,
        values: [...unique.values()].map((entry) => ({
          value: entry.value,
          source: entry.source,
        })),
        message: `Konflikt for variant ${variant.name} / ${fieldKey}.`,
      });
    }
  }

  return conflicts;
}

export function detectConflicts(
  models: ResearchModelProposal[],
): ResearchModelProposal[] {
  return models.map((model) => {
    const conflicts = detectFieldConflicts(model);
    const warnings = [...model.warnings];
    for (const conflict of conflicts) {
      warnings.push(conflict.message);
    }
    // Keep only first value per field for proposed_car apply; conflicts stay visible.
    const seen = new Set<string>();
    const dedupedFields = model.fields.filter((item) => {
      if (seen.has(item.field_key)) return false;
      seen.add(item.field_key);
      return true;
    });
    return {
      ...model,
      fields: dedupedFields,
      conflicts,
      warnings,
      missing_fields: listMissingFields({ ...model, fields: dedupedFields }),
    };
  });
}

export function listMissingFields(proposal: ResearchModelProposal): string[] {
  const present = new Set(proposal.fields.map((field) => field.field_key));
  const priority: ResearchTrackedField[] = [
    "range_km",
    "battery_usable_kwh",
    "dc_charging_kw",
    "drivetrain",
    "consumption_kwh_100km",
    "power_hp",
  ];
  const missing = priority.filter((field) => !present.has(field));
  // Also note empty description / year as soft gaps when tracked
  for (const field of RESEARCH_TRACKED_FIELDS) {
    if (priority.includes(field)) continue;
    if (!present.has(field) && ["year", "body_style", "vehicle_type"].includes(field)) {
      missing.push(field);
    }
  }
  return missing;
}

export function findDuplicateSlugs(models: ResearchModelProposal[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const model of models) {
    const slug = model.slug.toLowerCase();
    if (seen.has(slug)) dupes.push(slug);
    seen.add(slug);
  }
  return dupes;
}

/** Ensure every populated field has source attribution. */
export function validateSourceAttribution(
  proposal: ResearchModelProposal,
): string[] {
  const errors: string[] = [];
  for (const item of proposal.fields) {
    if (item.value == null || item.value === "") continue;
    if (!item.source?.source_name && !item.source?.source_url) {
      errors.push(`Felt ${item.field_key} mangler kilde.`);
    }
  }
  for (const variant of proposal.variants) {
    for (const item of variant.fields) {
      if (item.value == null || item.value === "") continue;
      if (!item.source?.source_name && !item.source?.source_url) {
        errors.push(`Variant ${variant.slug}.${item.field_key} mangler kilde.`);
      }
    }
  }
  return errors;
}
