/**
 * EVFAKTA AI image candidate helpers (pure).
 *
 * Official manufacturer photography remains preferred.
 * AI candidates are illustrations only — never auto-approved, never auto-hero,
 * never presented as official photography.
 *
 * Metadata is encoded into existing research_image_candidates text fields
 * (no schema change). source_category is stored in notes as source_category:ai_generated.
 */

export const AI_SOURCE_NAME = "EVFAKTA AI Illustration";
export const AI_SOURCE_CATEGORY = "ai_generated";
export const AI_WARNING = "Ikke offisielt produsentbilde";
export const AI_WARNING_EN = "Not official manufacturer photography";
export const AI_PUBLIC_LABEL =
  "AI-generert illustrasjon — krever menneskelig godkjenning.";
export const AI_INTERNAL_WARNING =
  "Illustrativt bilde — verifiser mot offisiell modell før offentlig bruk.";
export const AI_ILLUSTRATIVE_BADGE = "AI-generert illustrasjon";
export const AI_AWAITING_GENERATION_MARKER = "ai-status:awaiting-generation";
export const AI_GENERATED_MARKER = "ai-status:generated";
export const AI_SOURCE_CATEGORY_MARKER = `source_category:${AI_SOURCE_CATEGORY}`;
export const AI_NOTES_PREFIX = "ai-illustration";
export const AI_VISUALLY_VERIFIED_MARKER = "visual_review:verified";
export const AI_EDITORIAL_ARCHIVE_MARKER = "editorial-archive";
export const AI_VISUAL_CHECKLIST_PREFIX = "visual_checklist:";

/** Non-http provenance placeholder — never a manufacturer URL. */
export const AI_AWAITING_ORIGINAL_URL =
  "evfakta-ai-illustration:awaiting-generation";

export type AiIllustrationUsageType =
  | "hero_illustration"
  | "front_illustration"
  | "front_three_quarter"
  | "side_illustration"
  | "rear_illustration"
  | "interior_illustration"
  | "charging_illustration"
  | "cargo_illustration"
  | "article_cover"
  | "homepage_banner"
  | "social_media"
  | "editor_requested_detail";

export const AI_ILLUSTRATION_USAGE_OPTIONS: ReadonlyArray<{
  value: AiIllustrationUsageType;
  label: string;
  imageType: string;
  factualDetail: boolean;
}> = [
  {
    value: "hero_illustration",
    label: "Hero",
    imageType: "front",
    factualDetail: false,
  },
  {
    value: "front_illustration",
    label: "Front",
    imageType: "front",
    factualDetail: false,
  },
  {
    value: "front_three_quarter",
    label: "Front Three Quarter",
    imageType: "front",
    factualDetail: false,
  },
  {
    value: "side_illustration",
    label: "Side",
    imageType: "side",
    factualDetail: false,
  },
  {
    value: "rear_illustration",
    label: "Rear",
    imageType: "rear",
    factualDetail: false,
  },
  {
    value: "interior_illustration",
    label: "Interior",
    imageType: "interior",
    factualDetail: true,
  },
  {
    value: "charging_illustration",
    label: "Charging",
    imageType: "detail",
    factualDetail: true,
  },
  {
    value: "cargo_illustration",
    label: "Cargo",
    imageType: "cargo",
    factualDetail: true,
  },
  {
    value: "article_cover",
    label: "Article Cover",
    imageType: "other",
    factualDetail: false,
  },
  {
    value: "homepage_banner",
    label: "Homepage Banner",
    imageType: "other",
    factualDetail: false,
  },
  {
    value: "social_media",
    label: "Social Media",
    imageType: "other",
    factualDetail: false,
  },
  {
    value: "editor_requested_detail",
    label: "Editor-requested detail (explicit)",
    imageType: "detail",
    factualDetail: true,
  },
];

export type AiIllustrationPromptInput = {
  brand: string;
  model: string;
  usageType: AiIllustrationUsageType;
  changeRequest?: string | null;
  includeEvfaktaMark?: boolean;
  variant?: string | null;
  year?: number | string | null;
  bodyStyle?: string | null;
  style?: string | null;
  aspectRatio?: string | null;
};

const FOREST_GREEN = "#0F6B45";
const BACKGROUND = "#F7F8F6";

export function isAiIllustrationCandidate(image: {
  source_name?: string | null;
  notes?: string | null;
  original_url?: string | null;
}): boolean {
  if (image.source_name?.trim() === AI_SOURCE_NAME) return true;
  const notes = image.notes || "";
  if (notes.includes(AI_NOTES_PREFIX) || notes.includes(AI_SOURCE_CATEGORY_MARKER)) {
    return true;
  }
  const url = image.original_url?.trim() || "";
  return (
    url === AI_AWAITING_ORIGINAL_URL ||
    url.startsWith("evfakta-ai-illustration:")
  );
}

export function isAiAwaitingGeneration(image: {
  notes?: string | null;
  storage_path?: string | null;
  original_url?: string | null;
}): boolean {
  if (!isAiIllustrationCandidate(image)) return false;
  if (image.notes?.includes(AI_AWAITING_GENERATION_MARKER)) return true;
  if (
    (image.original_url?.trim() === AI_AWAITING_ORIGINAL_URL ||
      image.original_url?.startsWith("evfakta-ai-illustration:")) &&
    !image.storage_path?.trim()
  ) {
    return true;
  }
  return false;
}

export function parseAiUsageType(
  notes: string | null | undefined,
): AiIllustrationUsageType | null {
  if (!notes) return null;
  const match = notes.match(/usage:([a-z_]+)/i);
  if (!match) return null;
  const value = match[1] as AiIllustrationUsageType;
  return AI_ILLUSTRATION_USAGE_OPTIONS.some((option) => option.value === value)
    ? value
    : null;
}

export function parseAiGenerationPrompt(
  notes: string | null | undefined,
): string | null {
  if (!notes?.trim()) return null;
  const match = notes.match(/generation_prompt:«([\s\S]*?)»/);
  if (match?.[1]) return match[1].trim();
  // Fallback: older pipe-delimited single-line prompts
  const pipe = notes.match(/generation_prompt:([^|]+)/);
  return pipe?.[1]?.trim() || null;
}

export function parseAiGeneratedAt(
  notes: string | null | undefined,
): string | null {
  if (!notes) return null;
  const match = notes.match(/generated_at:([^\s|]+)/);
  return match?.[1] || null;
}

export function parseAiApprovalHistory(
  notes: string | null | undefined,
): string[] {
  if (!notes?.trim()) return [];
  return [...notes.matchAll(/approval_event:([^|]+)/g)].map((m) => m[1].trim());
}

export function imageTypeForAiUsage(usage: AiIllustrationUsageType): string {
  const found = AI_ILLUSTRATION_USAGE_OPTIONS.find((o) => o.value === usage);
  return found?.imageType ?? "other";
}

export function buildAiIllustrationPrompt(
  input: AiIllustrationPromptInput,
): string {
  const usageLabel =
    AI_ILLUSTRATION_USAGE_OPTIONS.find((o) => o.value === input.usageType)
      ?.label ?? input.usageType;
  const change = input.changeRequest?.trim();
  const mark = input.includeEvfaktaMark
    ? "Optional small, discreet EVFAKTA wordmark in a corner (marketing graphic only)."
    : "No watermark, no logos, no badges, no license plates, no on-image text.";

  const variant = input.variant?.trim();
  const year = input.year != null && String(input.year).trim() ? String(input.year) : null;
  const bodyStyle = input.bodyStyle?.trim();
  const style = input.style?.trim() || "Clean Scandinavian studio";
  const aspect = input.aspectRatio?.trim() || "16:9";
  const detailAllowed =
    AI_ILLUSTRATION_USAGE_OPTIONS.find((o) => o.value === input.usageType)
      ?.factualDetail === true;

  return [
    `Create a clean Scandinavian studio-style illustration of a ${input.brand} ${input.model}${variant ? ` ${variant}` : ""}${year ? ` (${year})` : ""} electric vehicle for EVFAKTA.`,
    bodyStyle ? `Verified body style: ${bodyStyle}.` : null,
    `Usage: ${usageLabel}.`,
    `Style: ${style}. Aspect ratio: ${aspect}.`,
    `Composition: realistic lighting, minimal visual noise, neutral seamless backdrop near ${BACKGROUND}, subtle primary accent ${FOREST_GREEN} only if needed for atmosphere (not as branding overlays).`,
    "This is an illustrative interpretation — not exact OEM photography. Do not invent unsupported trims, badges, or unverified technical details.",
    "Do not add fake manufacturer logos or fake license plates.",
    "Label intent (internal): AI-generert illustrasjon – ikke offisielt produsentbilde.",
    detailAllowed
      ? "Editor explicitly requested this detail/interior/charging/cargo view — keep it generic and non-technical; no invented specs."
      : "Do not show dashboard, charging port, cargo, or technical cutaways unless explicitly requested.",
    mark,
    change ? `Editor change request: ${change}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildAiNegativePrompt(): string {
  return [
    "official manufacturer photography claim",
    "fake logos",
    "fake license plates",
    "watermarks",
    "text overlays",
    "invented trim badges",
    "distorted wheels",
    "extra limbs",
    "warped body panels",
    "low quality",
    "blurry",
    "stock photo watermark",
  ].join(", ");
}

export function buildAiCandidateNotes(input: {
  brand: string;
  model: string;
  usageType: AiIllustrationUsageType;
  prompt: string;
  usageNote?: string | null;
  generatedAt?: string | null;
  awaitingGeneration: boolean;
  approvalHistory?: string[];
  changeRequest?: string | null;
  previousCandidateId?: string | null;
  negativePrompt?: string | null;
  style?: string | null;
  aspectRatio?: string | null;
  editorEmail?: string | null;
  variant?: string | null;
  year?: number | string | null;
  bodyStyle?: string | null;
  providerId?: string | null;
  threeImageWorkflow?: boolean;
  generatorPrecheckComplete?: boolean;
}): string {
  const providerNote = input.providerId?.trim()
    ? `ai_provider:${input.providerId.trim().toLowerCase()}`
    : null;
  const parts = [
    AI_NOTES_PREFIX,
    AI_SOURCE_CATEGORY_MARKER,
    input.threeImageWorkflow ? "three-image-workflow" : null,
    `model:${input.brand} ${input.model}`.trim(),
    input.variant?.trim() ? `variant:${input.variant.trim()}` : null,
    input.year != null && String(input.year).trim()
      ? `year:${String(input.year).trim()}`
      : null,
    input.bodyStyle?.trim() ? `body_style:${input.bodyStyle.trim()}` : null,
    `usage:${input.usageType}`,
    providerNote,
    `warning:${AI_WARNING_EN}`,
    `label_no:${AI_ILLUSTRATIVE_BADGE}`,
    `label_no_warning:${AI_WARNING}`,
    "label_no_full:AI-generert illustrasjon – ikke offisielt produsentbilde",
    `internal_warning:${AI_INTERNAL_WARNING}`,
    input.awaitingGeneration
      ? AI_AWAITING_GENERATION_MARKER
      : AI_GENERATED_MARKER,
    input.generatedAt ? `generated_at:${input.generatedAt}` : null,
    input.editorEmail?.trim() ? `editor:${input.editorEmail.trim()}` : null,
    input.style?.trim() ? `style:${input.style.trim()}` : null,
    input.aspectRatio?.trim() ? `aspect_ratio:${input.aspectRatio.trim()}` : null,
    input.generatorPrecheckComplete ? "generator_precheck:complete" : null,
    input.usageNote?.trim()
      ? `usage_note:${input.usageNote.trim()}`
      : "usage_note:Editorial illustration candidate — human approval required before any public use.",
    input.changeRequest?.trim()
      ? `change_request:${input.changeRequest.trim()}`
      : null,
    input.previousCandidateId
      ? `regenerated_from:${input.previousCandidateId}`
      : null,
    input.negativePrompt?.trim()
      ? `negative_prompt:«${input.negativePrompt.replace(/»/g, "'")}»`
      : null,
    `generation_prompt:«${input.prompt.replace(/»/g, "'")}»`,
    ...(input.approvalHistory ?? []).map(
      (event) => `approval_event:${event}`,
    ),
  ];
  return parts.filter(Boolean).join(" | ");
}

export function appendAiApprovalEvent(
  notes: string | null | undefined,
  event: string,
): string {
  const stamp = `${new Date().toISOString()}:${event}`;
  const existing = notes?.trim() || "";
  if (existing.includes(`approval_event:${stamp}`)) return existing;
  return existing
    ? `${existing} | approval_event:${stamp}`
    : `approval_event:${stamp}`;
}

/** Whether Image Review should show this AI row (including Awaiting Generation). */
export function isVisibleAiIllustrationCandidate(image: {
  source_name?: string | null;
  notes?: string | null;
  original_url?: string | null;
  status?: string | null;
  storage_path?: string | null;
}): boolean {
  if (!isAiIllustrationCandidate(image)) return false;
  if (image.status === "rejected") return false;
  if (isAiAwaitingGeneration(image)) return true;
  return Boolean(image.storage_path?.trim());
}

/** Skip OEM CDN download for Awaiting Generation placeholders. */
export function shouldSkipRemoteHydration(image: {
  source_name?: string | null;
  notes?: string | null;
  original_url?: string | null;
  storage_path?: string | null;
}): boolean {
  return isAiIllustrationCandidate(image) && isAiAwaitingGeneration(image);
}

export function aiIllustrationAltText(input: {
  brand: string;
  model: string;
  usageType: AiIllustrationUsageType;
}): string {
  const usage =
    AI_ILLUSTRATION_USAGE_OPTIONS.find((o) => o.value === input.usageType)
      ?.label ?? "illustration";
  return `${input.brand} ${input.model} — ${usage} (AI-generated illustration, not official manufacturer photography)`;
}

export function aiCandidateLicenseNote(): string {
  return `${AI_PUBLIC_LABEL} ${AI_WARNING}. ${AI_WARNING_EN}. Prefer official photography when available.`;
}

export function aiCandidateUsageTerms(): string {
  return [
    AI_INTERNAL_WARNING,
    "Public use only after manual approval, visual verification, clear illustration labeling, and confirmation that no suitable official approved image is available.",
    "When an official approved image becomes available, prefer the official image; move this AI candidate to Editorial Archive (do not delete).",
  ].join(" ");
}

/** Mandatory visual quality checklist — all items required before Approve. */
export type AiVisualChecklistKey =
  | "vehicle_identity"
  | "front_design"
  | "headlights"
  | "body_shape"
  | "doors_proportions"
  | "wheels_realistic"
  | "rear_design"
  | "vehicle_color"
  | "no_ai_artifacts"
  | "no_incorrect_badges"
  | "no_fictional_trim"
  | "safe_for_public";

export const AI_VISUAL_CHECKLIST_ITEMS: ReadonlyArray<{
  key: AiVisualChecklistKey;
  label: string;
}> = [
  { key: "vehicle_identity", label: "Samlet bilidentitet er korrekt" },
  { key: "front_design", label: "Frontdesign matcher den offisielle bilen" },
  { key: "headlights", label: "Lykter er korrekte" },
  { key: "body_shape", label: "Karosseriform er korrekt" },
  { key: "doors_proportions", label: "Dører og proporsjoner er korrekte" },
  { key: "wheels_realistic", label: "Hjul ser realistiske ut" },
  { key: "rear_design", label: "Bakdesign (hvis synlig) matcher" },
  { key: "vehicle_color", label: "Farge er akseptabel" },
  { key: "no_ai_artifacts", label: "Ingen åpenbare AI-artefakter" },
  { key: "no_incorrect_badges", label: "Ingen feil produsentmerker" },
  { key: "no_fictional_trim", label: "Ingen oppdiktede trimdetaljer" },
  { key: "safe_for_public", label: "Trygt for offentlig visning" },
];

export const AI_VISUAL_CHECKLIST_KEYS: readonly AiVisualChecklistKey[] =
  AI_VISUAL_CHECKLIST_ITEMS.map((item) => item.key);

export type AiConfidenceLabel = "Low" | "Medium" | "High";
export type AiVisualReviewLabel =
  | "Awaiting Generation"
  | "Not visually verified"
  | "Visually verified"
  | "Editorial Archive";

export type AiRecommendedAction =
  | "Generate or upload illustration"
  | "Complete visual quality checklist"
  | "Prefer official manufacturer image — move AI to Editorial Archive"
  | "May approve after Visually verified confirmation"
  | "Approved & verified — official preferred when available"
  | "Keep in Editorial Archive (do not delete)";

export function isAiVisuallyVerified(image: {
  notes?: string | null;
}): boolean {
  return Boolean(image.notes?.includes(AI_VISUALLY_VERIFIED_MARKER));
}

export function isAiEditorialArchive(image: {
  notes?: string | null;
}): boolean {
  const notes = image.notes || "";
  return (
    notes.includes(AI_EDITORIAL_ARCHIVE_MARKER) ||
    notes.includes("editorial-use-only")
  );
}

export function parseAiVisualChecklist(
  notes: string | null | undefined,
): AiVisualChecklistKey[] {
  if (!notes?.trim()) return [];
  const match = notes.match(/visual_checklist:([a-z_,]+)/i);
  if (!match?.[1]) return [];
  const keys = match[1].split(",").map((k) => k.trim()) as AiVisualChecklistKey[];
  return keys.filter((key) =>
    AI_VISUAL_CHECKLIST_KEYS.includes(key),
  );
}

export function isAiVisualChecklistComplete(
  keys: readonly string[] | null | undefined,
): boolean {
  if (!keys?.length) return false;
  const set = new Set(keys);
  return AI_VISUAL_CHECKLIST_KEYS.every((key) => set.has(key));
}

export function encodeAiVisualChecklist(
  keys: readonly AiVisualChecklistKey[],
): string {
  const unique = AI_VISUAL_CHECKLIST_KEYS.filter((key) => keys.includes(key));
  return `${AI_VISUAL_CHECKLIST_PREFIX}${unique.join(",")}`;
}

export function withAiVisualVerificationNotes(
  notes: string | null | undefined,
  checklistKeys: readonly AiVisualChecklistKey[],
): string {
  let next = (notes || "")
    .replace(/visual_checklist:[a-z_,]+/gi, "")
    .replace(new RegExp(AI_VISUALLY_VERIFIED_MARKER, "g"), "")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/^\s*\|\s*|\s*\|\s*$/g, "")
    .trim();
  next = [
    next,
    encodeAiVisualChecklist(checklistKeys),
    AI_VISUALLY_VERIFIED_MARKER,
  ]
    .filter(Boolean)
    .join(" | ");
  return appendAiApprovalEvent(next, "visually_verified_checklist_complete");
}

export function withAiEditorialArchiveNotes(
  notes: string | null | undefined,
): string {
  let next = notes?.trim() || "";
  if (!next.includes(AI_EDITORIAL_ARCHIVE_MARKER)) {
    next = next
      ? `${next} | ${AI_EDITORIAL_ARCHIVE_MARKER}`
      : AI_EDITORIAL_ARCHIVE_MARKER;
  }
  if (!next.includes("editorial-use-only")) {
    next = `${next} | editorial-use-only`;
  }
  if (!next.includes("replaced-by-official-preference")) {
    next = `${next} | replaced-by-official-preference`;
  }
  return appendAiApprovalEvent(next, "moved_to_editorial_archive");
}

export function computeAiConfidence(image: {
  notes?: string | null;
  storage_path?: string | null;
  original_url?: string | null;
  source_name?: string | null;
}): AiConfidenceLabel {
  if (!isAiIllustrationCandidate(image)) return "Low";
  if (isAiAwaitingGeneration(image)) return "Low";
  if (isAiVisuallyVerified(image)) return "High";
  return "Medium";
}

export function computeAiVisualReviewLabel(image: {
  notes?: string | null;
  storage_path?: string | null;
  original_url?: string | null;
  source_name?: string | null;
}): AiVisualReviewLabel {
  if (isAiEditorialArchive(image)) return "Editorial Archive";
  if (isAiAwaitingGeneration(image)) return "Awaiting Generation";
  if (isAiVisuallyVerified(image)) return "Visually verified";
  return "Not visually verified";
}

export function hasOfficialManufacturerImageAvailable(input: {
  galleryHasOfficial?: boolean;
  officialCandidateAvailable?: boolean;
}): boolean {
  return Boolean(input.galleryHasOfficial || input.officialCandidateAvailable);
}

export function computeAiRecommendedAction(input: {
  image: {
    notes?: string | null;
    storage_path?: string | null;
    original_url?: string | null;
    source_name?: string | null;
    status?: string | null;
  };
  officialImageAvailable: boolean;
}): AiRecommendedAction {
  const { image, officialImageAvailable } = input;
  if (isAiEditorialArchive(image)) {
    return "Keep in Editorial Archive (do not delete)";
  }
  if (officialImageAvailable) {
    return "Prefer official manufacturer image — move AI to Editorial Archive";
  }
  if (isAiAwaitingGeneration(image)) {
    return "Generate or upload illustration";
  }
  if (!isAiVisuallyVerified(image)) {
    return "Complete visual quality checklist";
  }
  if (image.status === "approved" || image.status === "applied") {
    return "Approved & verified — official preferred when available";
  }
  return "May approve after Visually verified confirmation";
}

export type AiVisualQualityReview = {
  confidence: AiConfidenceLabel;
  visualReview: AiVisualReviewLabel;
  officialImageAvailable: boolean;
  recommendedAction: AiRecommendedAction;
  visuallyVerified: boolean;
  checklistComplete: boolean;
  inEditorialArchive: boolean;
  illustrativeBadge: string;
  notOfficialBadge: string;
};

export function buildAiVisualQualityReview(input: {
  image: {
    notes?: string | null;
    storage_path?: string | null;
    original_url?: string | null;
    source_name?: string | null;
    status?: string | null;
  };
  officialImageAvailable: boolean;
}): AiVisualQualityReview {
  const visuallyVerified = isAiVisuallyVerified(input.image);
  return {
    confidence: computeAiConfidence(input.image),
    visualReview: computeAiVisualReviewLabel(input.image),
    officialImageAvailable: input.officialImageAvailable,
    recommendedAction: computeAiRecommendedAction(input),
    visuallyVerified,
    checklistComplete: isAiVisualChecklistComplete(
      parseAiVisualChecklist(input.image.notes),
    ),
    inEditorialArchive: isAiEditorialArchive(input.image),
    illustrativeBadge: AI_ILLUSTRATIVE_BADGE,
    notOfficialBadge: AI_WARNING,
  };
}

/** Approve gate: all checklist items + Visually verified must be confirmed. */
export function canApproveAiAfterVisualReview(input: {
  confirmVisuallyVerified: boolean;
  checklistKeys: readonly string[];
}): boolean {
  return (
    input.confirmVisuallyVerified &&
    isAiVisualChecklistComplete(input.checklistKeys)
  );
}

/** Hero gate: must already be approved/applied and visually verified. */
export function canSelectAiHero(image: {
  status?: string | null;
  notes?: string | null;
}): boolean {
  const approved =
    image.status === "approved" || image.status === "applied";
  return approved && isAiVisuallyVerified(image) && !isAiEditorialArchive(image);
}

/** Public display gate for AI illustrations (car publish is separate). */
export function canAiIllustrationAppearPublicly(input: {
  image: {
    status?: string | null;
    notes?: string | null;
  };
  officialImageAvailable: boolean;
}): boolean {
  const { image, officialImageAvailable } = input;
  if (officialImageAvailable) return false;
  if (isAiEditorialArchive(image)) return false;
  if (image.status !== "approved" && image.status !== "applied") return false;
  return isAiVisuallyVerified(image);
}
