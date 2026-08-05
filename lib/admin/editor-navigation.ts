/**
 * Map Review Assistant / publish blocker ids to car editor tabs + DOM anchors.
 * Pure helpers — no I/O. Used for click-to-jump in the admin CMS.
 */

export type CarEditorTab =
  | "overview"
  | "specifications"
  | "images"
  | "variants"
  | "editorial"
  | "sources"
  | "history";

export type EditorJumpTarget = {
  tab: CarEditorTab;
  anchorId?: string;
  /** Short label for “Open … section” affordance. */
  openLabel: string;
};

const ITEM_JUMPS: Record<string, EditorJumpTarget> = {
  brand: { tab: "overview", anchorId: "spec-identity", openLabel: "Identity" },
  model: { tab: "overview", anchorId: "spec-identity", openLabel: "Identity" },
  year: { tab: "overview", anchorId: "spec-identity", openLabel: "Identity" },
  variant: { tab: "variants", anchorId: "variants-heading", openLabel: "Variants" },
  body_style: { tab: "overview", anchorId: "spec-identity", openLabel: "Identity" },

  battery: { tab: "specifications", anchorId: "spec-battery", openLabel: "Battery" },
  battery_chemistry: {
    tab: "specifications",
    anchorId: "spec-battery",
    openLabel: "Battery",
  },
  range: {
    tab: "specifications",
    anchorId: "spec-price-range",
    openLabel: "Price & range",
  },
  real_world_range: {
    tab: "specifications",
    anchorId: "spec-price-range",
    openLabel: "Price & range",
  },
  consumption: {
    tab: "specifications",
    anchorId: "spec-price-range",
    openLabel: "Price & range",
  },
  charging: {
    tab: "specifications",
    anchorId: "spec-charging",
    openLabel: "Charging",
  },
  connectors: {
    tab: "specifications",
    anchorId: "spec-charging",
    openLabel: "Charging",
  },
  performance: {
    tab: "specifications",
    anchorId: "spec-performance",
    openLabel: "Performance",
  },
  dimensions: {
    tab: "specifications",
    anchorId: "spec-dimensions",
    openLabel: "Dimensions",
  },
  cargo: {
    tab: "specifications",
    anchorId: "spec-dimensions",
    openLabel: "Dimensions",
  },
  seats: {
    tab: "specifications",
    anchorId: "spec-dimensions",
    openLabel: "Dimensions",
  },
  towing: {
    tab: "specifications",
    anchorId: "spec-dimensions",
    openLabel: "Dimensions",
  },
  heat_pump: {
    tab: "specifications",
    anchorId: "spec-equipment",
    openLabel: "Equipment",
  },

  hero_image: { tab: "images", anchorId: "images-heading", openLabel: "Images" },
  front_image: { tab: "images", anchorId: "images-heading", openLabel: "Images" },
  side_image: { tab: "images", anchorId: "images-heading", openLabel: "Images" },
  rear_image: { tab: "images", anchorId: "images-heading", openLabel: "Images" },
  interior: { tab: "images", anchorId: "images-heading", openLabel: "Images" },
  gallery_complete: {
    tab: "images",
    anchorId: "images-heading",
    openLabel: "Images",
  },
  image: { tab: "images", anchorId: "images-heading", openLabel: "Images" },
  seo_image: { tab: "images", anchorId: "images-heading", openLabel: "Images" },

  description: {
    tab: "editorial",
    anchorId: "editorial-panel",
    openLabel: "Editorial",
  },
  pros: { tab: "editorial", anchorId: "editorial-panel", openLabel: "Editorial" },
  cons: { tab: "editorial", anchorId: "editorial-panel", openLabel: "Editorial" },
  suitable_for: {
    tab: "editorial",
    anchorId: "editorial-panel",
    openLabel: "Editorial",
  },
  editorial_topics: {
    tab: "editorial",
    anchorId: "editorial-panel",
    openLabel: "Editorial",
  },
  faq: { tab: "editorial", anchorId: "editorial-panel", openLabel: "Editorial" },
  related_models: {
    tab: "editorial",
    anchorId: "editorial-panel",
    openLabel: "Editorial",
  },
  editorial_draft: {
    tab: "editorial",
    anchorId: "editorial-panel",
    openLabel: "Editorial",
  },
  seo_title: {
    tab: "overview",
    anchorId: "spec-identity",
    openLabel: "Identity",
  },
  seo_slug: { tab: "overview", anchorId: "spec-identity", openLabel: "Identity" },
  seo_description: {
    tab: "editorial",
    anchorId: "editorial-panel",
    openLabel: "Editorial",
  },
  seo_description_short: {
    tab: "editorial",
    anchorId: "editorial-panel",
    openLabel: "Editorial",
  },
  seo_description_draft: {
    tab: "editorial",
    anchorId: "editorial-panel",
    openLabel: "Editorial",
  },

  source_url: { tab: "sources", anchorId: "sources-panel", openLabel: "Sources" },
  source_name: { tab: "sources", anchorId: "sources-panel", openLabel: "Sources" },
  source: { tab: "sources", anchorId: "sources-panel", openLabel: "Sources" },
  last_checked: { tab: "sources", anchorId: "sources-panel", openLabel: "Sources" },
  checked: { tab: "sources", anchorId: "sources-panel", openLabel: "Sources" },

  needs_review: {
    tab: "overview",
    anchorId: "field-review-heading",
    openLabel: "Field review",
  },
  approved: {
    tab: "overview",
    anchorId: "field-review-heading",
    openLabel: "Field review",
  },
  import_status: {
    tab: "overview",
    anchorId: "field-review-heading",
    openLabel: "Field review",
  },
  no_draft_marker: {
    tab: "editorial",
    anchorId: "editorial-panel",
    openLabel: "Editorial",
  },
  completion_below_threshold: {
    tab: "overview",
    anchorId: "field-review-heading",
    openLabel: "Overview",
  },
  slug: { tab: "overview", anchorId: "spec-identity", openLabel: "Identity" },
};

/** Resolve a checklist item id or publish issue code to a jump target. */
export function resolveEditorJump(idOrCode: string): EditorJumpTarget | null {
  const key = idOrCode.trim();
  if (!key) return null;
  if (ITEM_JUMPS[key]) return ITEM_JUMPS[key];

  if (key.startsWith("battery")) {
    return ITEM_JUMPS.battery;
  }
  if (key.includes("image") || key === "media") {
    return ITEM_JUMPS.hero_image;
  }
  if (key.startsWith("seo_") || key.includes("editorial") || key.includes("draft")) {
    return ITEM_JUMPS.description;
  }
  if (key.includes("source") || key === "checked") {
    return ITEM_JUMPS.source;
  }
  return null;
}

export type ProductionSummaryFlag = {
  id: string;
  label: string;
  ok: boolean;
};

/**
 * Compact production summary for the editor header.
 * Derived from Review Assistant sections + publish readiness — no new gates.
 */
export function buildProductionSummary(input: {
  percent: number;
  canPublish: boolean;
  sections: Array<{
    id: string;
    items: Array<{ id: string; complete: boolean; requiredForPublish?: boolean }>;
  }>;
  publishIssueCodes: string[];
}): {
  completionPercent: number;
  flags: ProductionSummaryFlag[];
  publishReady: boolean;
} {
  const byId = (sectionId: string) =>
    input.sections.find((section) => section.id === sectionId)?.items ?? [];

  const allComplete = (items: Array<{ complete: boolean }>) =>
    items.length > 0 && items.every((item) => item.complete);

  const requiredComplete = (
    items: Array<{ complete: boolean; requiredForPublish?: boolean }>,
  ) => {
    const required = items.filter((item) => item.requiredForPublish);
    if (required.length === 0) return allComplete(items);
    return required.every((item) => item.complete);
  };

  const media = byId("media");
  const editorial = byId("editorial");
  const specs = byId("specifications");
  const codes = new Set(input.publishIssueCodes);

  const imagesOk =
    requiredComplete(media) &&
    !codes.has("hero_image") &&
    !codes.has("front_image") &&
    !codes.has("side_image") &&
    !codes.has("image") &&
    !codes.has("seo_image");

  const editorialOk =
    requiredComplete(editorial) &&
    !codes.has("description") &&
    !codes.has("editorial_draft") &&
    !codes.has("seo_description") &&
    !codes.has("seo_description_short") &&
    !codes.has("seo_description_draft");

  const specsOk = allComplete(specs);

  const seoOk = ![
    "seo_title",
    "seo_slug",
    "seo_description",
    "seo_description_short",
    "seo_description_draft",
    "seo_image",
    "brand",
    "model",
    "slug",
  ].some((code) => codes.has(code));

  return {
    completionPercent: input.percent,
    publishReady: input.canPublish,
    flags: [
      { id: "images", label: "Images", ok: imagesOk },
      { id: "editorial", label: "Editorial", ok: editorialOk },
      { id: "specifications", label: "Specifications", ok: specsOk },
      { id: "seo", label: "SEO", ok: seoOk },
      { id: "publish", label: "Publish Ready", ok: input.canPublish },
    ],
  };
}

/** Human status line for Review Assistant completion. */
export function completionStatusText(percent: number, threshold = 95): string {
  if (percent >= threshold) return "Ready for Publish";
  return "Needs Review";
}

/** Monospace-style progress glyphs for a quick visual read. */
export function completionBarGlyphs(percent: number, width = 14): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}
