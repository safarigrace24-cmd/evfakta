"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  AI_ILLUSTRATION_USAGE_OPTIONS,
  appendAiApprovalEvent,
  isAiIllustrationCandidate,
  parseAiUsageType,
  withAiEditorialArchiveNotes,
  type AiIllustrationUsageType,
} from "@/lib/admin/ai-image-candidates";
import {
  archiveAiIllustrationsWhenOfficialAvailable,
  attachGeneratedBytesToAiCandidate,
  createAiIllustrationCandidate,
  galleryHasOfficialManufacturerImage,
} from "@/lib/admin/ai-image-candidate-service";
import {
  buildAdminGeneratorPrompt,
  defaultNegativePrompt,
  estimateAiGenerationCostPlaceholder,
  isAiGeneratorPrecheckComplete,
  usageRequiresExplicitDetail,
  type AiGeneratorAspectRatio,
  type AiGeneratorStyle,
} from "@/lib/admin/ai-image-generator";
import {
  generateAiImageBytes,
  getAiProviderHealth,
  isAiImageProviderAvailable,
} from "@/lib/admin/ai-image-provider";
import {
  getActiveAiImageProvider,
  getConfiguredAiProviderId,
} from "@/lib/admin/ai-providers";
import { listAdminCarImages } from "@/lib/admin/car-images";
import { CAR_IMAGE_TYPE_LABELS } from "@/lib/admin/car-image-types";
import { listImageCandidatesForCar } from "@/lib/admin/image-review-data";
import type { ResearchImageCandidate } from "@/lib/admin/research/types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type AiOfficialGalleryThumb = {
  id: string;
  imageUrl: string;
  imageTypeLabel: string;
  isPrimary: boolean;
};

export type AiImageActionResult =
  | {
      ok: true;
      message: string;
      candidateId?: string;
      prompt?: string;
      negativePrompt?: string;
      awaitingGeneration?: boolean;
      previewDataUrl?: string | null;
      providerAvailable?: boolean;
      providerId?: string;
      providerLabel?: string;
      providerConnected?: boolean;
      providerHealthy?: boolean;
      providerMessage?: string;
      providerStatusCode?: string;
      costEstimateLabel?: string;
      costEstimateAmount?: string;
      costEstimateNote?: string;
      officialImagesExist?: boolean;
      officialImageCount?: number;
      officialImages?: AiOfficialGalleryThumb[];
      reviewPath?: string;
    }
  | { ok: false; error: string };

async function assertAdmin(): Promise<AiImageActionResult | null> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "403 Forbidden" };
  }
  return null;
}

async function requireAdminUser(): Promise<
  | { ok: true; email: string }
  | { ok: false; error: string }
> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "403 Forbidden" };
  }
  return { ok: true, email: user.email || "admin" };
}

function dbReady() {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function revalidateAiPaths(carId: string, slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/images");
  revalidatePath(`/admin/images/${carId}`);
  revalidatePath("/admin/production");
  revalidatePath(`/admin/biler/${carId}/rediger`);
  if (slug) {
    revalidatePath(`/modeller/${slug}`);
    revalidatePath("/");
  }
}

function parseUsageType(raw: string): AiIllustrationUsageType | null {
  return AI_ILLUSTRATION_USAGE_OPTIONS.some((o) => o.value === raw)
    ? (raw as AiIllustrationUsageType)
    : null;
}

async function loadCar(carId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("cars")
    .select("id, slug, brand, model, variant, year, image_url")
    .eq("id", carId)
    .maybeSingle();
  return data as {
    id: string;
    slug: string;
    brand: string;
    model: string;
    variant: string | null;
    year: number | null;
    image_url: string | null;
  } | null;
}

async function buildProviderStatusFields(aspectRatio?: string | null) {
  const provider = getActiveAiImageProvider();
  const health = await getAiProviderHealth();
  const cost = estimateAiGenerationCostPlaceholder({
    providerId: getConfiguredAiProviderId(),
    aspectRatio,
  });
  return {
    providerAvailable: isAiImageProviderAvailable(),
    providerId: provider.id,
    providerLabel: provider.label,
    providerConnected: health.connected,
    providerHealthy: health.healthy,
    providerMessage: health.message,
    providerStatusCode: health.statusCode,
    costEstimateLabel: cost.label,
    costEstimateAmount: `${cost.amountDisplay} (${cost.currencyNote})`,
    costEstimateNote: cost.note,
  };
}

async function buildOfficialImageFields(carId: string): Promise<{
  officialImagesExist: boolean;
  officialImageCount: number;
  officialImages: AiOfficialGalleryThumb[];
}> {
  const [gallery, candidates] = await Promise.all([
    listAdminCarImages(carId),
    listImageCandidatesForCar(carId),
  ]);
  const aiAppliedIds = new Set(
    candidates
      .filter((c) => isAiIllustrationCandidate(c) && Boolean(c.applied_image_id?.trim()))
      .map((c) => c.applied_image_id as string),
  );
  const official = gallery.filter((image) => !aiAppliedIds.has(image.id));
  return {
    officialImagesExist: galleryHasOfficialManufacturerImage(gallery, candidates),
    officialImageCount: official.length,
    officialImages: official.slice(0, 8).map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      imageTypeLabel: CAR_IMAGE_TYPE_LABELS[image.image_type] || image.image_type,
      isPrimary: image.is_primary,
    })),
  };
}

export async function getAiImageGeneratorStatusAction(): Promise<AiImageActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth;
  const provider = await buildProviderStatusFields();
  return {
    ok: true,
    message: provider.providerMessage || "Provider status loaded.",
    ...provider,
  };
}

export type CarImageWorkflowSummary = {
  officialCount: number;
  aiCandidateCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  heroReady: boolean;
  galleryCount: number;
  reviewPath: string;
  history: Array<{
    id: string;
    label: string;
    status: string;
    isAi: boolean;
    updatedAt: string | null;
  }>;
};

/** Lightweight Images-tab workflow counters (no schema / workflow changes). */
export async function getCarImageWorkflowSummaryAction(input: {
  carId: string;
}): Promise<
  | { ok: true; summary: CarImageWorkflowSummary; message: string }
  | { ok: false; error: string }
> {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth;
  if (!input.carId.trim()) {
    return { ok: false, error: "carId er påkrevd." };
  }

  const carId = input.carId.trim();
  const [gallery, candidates, official] = await Promise.all([
    listAdminCarImages(carId),
    listImageCandidatesForCar(carId),
    buildOfficialImageFields(carId),
  ]);

  const aiCandidates = candidates.filter((c) => isAiIllustrationCandidate(c));
  const history = [...candidates]
    .sort((a, b) => {
      const aTime = Date.parse(a.created_at || "") || 0;
      const bTime = Date.parse(b.created_at || "") || 0;
      return bTime - aTime;
    })
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      label:
        c.image_type?.trim() ||
        c.alt_text?.trim() ||
        (isAiIllustrationCandidate(c) ? "AI candidate" : "Candidate"),
      status: c.status,
      isAi: isAiIllustrationCandidate(c),
      updatedAt: c.created_at || null,
    }));

  return {
    ok: true,
    message: "Image workflow summary loaded.",
    summary: {
      officialCount: official.officialImageCount,
      aiCandidateCount: aiCandidates.length,
      pendingCount: candidates.filter((c) => c.status === "pending").length,
      approvedCount: candidates.filter(
        (c) => c.status === "approved" || c.status === "applied",
      ).length,
      rejectedCount: candidates.filter((c) => c.status === "rejected").length,
      heroReady: gallery.some((image) => image.is_primary),
      galleryCount: gallery.length,
      reviewPath: `/admin/images/${carId}`,
      history,
    },
  };
}

/** Full Lag AI-bilde context: provider status + official gallery preference. */
export async function getAiImageGeneratorContextAction(input: {
  carId: string;
  aspectRatio?: string;
}): Promise<AiImageActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth;
  if (!input.carId.trim()) {
    return { ok: false, error: "carId er påkrevd." };
  }

  const [provider, official] = await Promise.all([
    buildProviderStatusFields(input.aspectRatio),
    buildOfficialImageFields(input.carId),
  ]);

  return {
    ok: true,
    message: official.officialImagesExist
      ? "Offisielle bilder finnes — AI er sekundært. Offisiell foto er alltid foretrukket."
      : "Ingen offisielle galleribilder funnet ennå. AI kan brukes som illustrasjonskandidat.",
    ...provider,
    ...official,
    reviewPath: `/admin/images/${input.carId}`,
  };
}

/**
 * Prefer official photography: archive AI illustration candidates for this car.
 * Does not delete images. Does not auto-publish. Does not change approval gates.
 */
export async function preferOfficialOverAiAction(input: {
  carId: string;
}): Promise<AiImageActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth;
  if (!dbReady()) {
    return { ok: false, error: "Handlingen er midlertidig utilgjengelig." };
  }

  const car = await loadCar(input.carId);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const [gallery, candidates] = await Promise.all([
    listAdminCarImages(car.id),
    listImageCandidatesForCar(car.id),
  ]);

  if (!galleryHasOfficialManufacturerImage(gallery, candidates)) {
    return {
      ok: false,
      error:
        "Ingen offisielle galleribilder å foretrekke. Last opp / godkjenn offisiell foto først.",
    };
  }

  await archiveAiIllustrationsWhenOfficialAvailable({ gallery, candidates });
  revalidateAiPaths(car.id, car.slug);

  const official = await buildOfficialImageFields(car.id);
  return {
    ok: true,
    message:
      "AI-illustrasjoner flyttet til Editorial Archive. Offisiell foto er foretrukket. Ingen auto-publisering.",
    ...official,
    reviewPath: `/admin/images/${car.id}`,
  };
}

/**
 * Lag AI-bilde: create a pending Image Review candidate.
 * Tries the configured provider; otherwise Awaiting Generation (+ optional upload).
 * Never auto-approves. Never sets hero. Never publishes.
 */
export async function generateAiImageCandidateAction(input: {
  carId: string;
  usageType: string;
  prompt: string;
  negativePrompt?: string;
  style?: string;
  aspectRatio?: string;
  changeRequest?: string;
  /** Generator modal quality precheck keys — required before accepting into review. */
  precheckKeys?: string[];
  /** Optional manual upload / regenerate preview bytes. */
  imageBase64?: string | null;
  /** When true, call the AI provider (if configured). */
  attemptProvider?: boolean;
}): Promise<AiImageActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth;
  if (!dbReady()) {
    return { ok: false, error: "AI-illustrasjoner er midlertidig utilgjengelige." };
  }

  const usageType = parseUsageType(input.usageType);
  if (!usageType) {
    return { ok: false, error: "Ugyldig bildetype for AI-illustrasjon." };
  }

  if (
    usageRequiresExplicitDetail(usageType) &&
    !input.changeRequest?.trim()
  ) {
    return {
      ok: false,
      error:
        "Interior / Charging / Cargo krever en kort redaktør-note (eksplisitt forespørsel).",
    };
  }

  if (!isAiGeneratorPrecheckComplete(input.precheckKeys)) {
    return {
      ok: false,
      error:
        "Fullfør kvalitetsjekklisten før AI-kandidaten sendes til Image Review.",
    };
  }

  if (!input.prompt.trim()) {
    return { ok: false, error: "Prompt er påkrevd." };
  }

  const car = await loadCar(input.carId);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const style = (input.style || "scandinavian_studio") as AiGeneratorStyle;
  const aspectRatio = (input.aspectRatio || "16:9") as AiGeneratorAspectRatio;
  const negativePrompt = input.negativePrompt?.trim() || defaultNegativePrompt();

  let imageBuffer: Buffer | null = null;
  let previewDataUrl: string | null = null;
  let providerAvailable = isAiImageProviderAvailable();

  if (input.imageBase64?.trim()) {
    try {
      const raw = input.imageBase64.includes(",")
        ? input.imageBase64.split(",", 2)[1]
        : input.imageBase64;
      imageBuffer = Buffer.from(raw, "base64");
      previewDataUrl = `data:image/png;base64,${raw}`;
    } catch {
      return { ok: false, error: "Kunne ikke lese bildefilen." };
    }
  } else if (input.attemptProvider !== false && providerAvailable) {
    const generated = await generateAiImageBytes({
      prompt: input.prompt,
      negativePrompt,
      aspectRatio,
    });
    if (generated.ok) {
      imageBuffer = generated.buffer;
      previewDataUrl = `data:image/png;base64,${generated.buffer.toString("base64")}`;
    } else if (!generated.unavailable) {
      return { ok: false, error: generated.error };
    }
  }

  const created = await createAiIllustrationCandidate({
    carId: car.id,
    brand: car.brand || car.slug,
    model: car.model || car.slug,
    slug: car.slug,
    usageType,
    promptOverride: input.prompt,
    negativePrompt,
    style,
    aspectRatio,
    editorEmail: auth.email,
    variant: car.variant,
    year: car.year,
    changeRequest: input.changeRequest,
    generatorPrecheckComplete: true,
    usageNote:
      "Created via Lag AI-bilde (admin). Pending Image Review — never auto-approved.",
    imageBuffer,
  });

  if (!created.ok) return { ok: false, error: created.error };

  revalidateAiPaths(car.id, car.slug);

  const reviewPath = `/admin/images/${car.id}`;

  if (created.awaitingGeneration) {
    return {
      ok: true,
      message:
        "Pending AI-kandidat opprettet (Awaiting Generation). Last opp bilde manuelt eller generer eksternt — deretter fullfør Image Review. Ingen auto-godkjenning.",
      candidateId: created.candidate.id,
      prompt: created.prompt,
      negativePrompt,
      awaitingGeneration: true,
      previewDataUrl: null,
      providerAvailable,
      reviewPath,
    };
  }

  return {
    ok: true,
    message:
      "Pending AI-kandidat lagret i Storage. Åpne Image Review for godkjenning. Ingen auto-Hero. Ingen auto-publisering.",
    candidateId: created.candidate.id,
    prompt: created.prompt,
    negativePrompt,
    awaitingGeneration: false,
    previewDataUrl,
    providerAvailable,
    reviewPath,
  };
}

/** Preview-only generation attempt (does not create a candidate until Accept). */
export async function previewGenerateAiImageAction(input: {
  carId: string;
  usageType: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  changeRequest?: string;
}): Promise<AiImageActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth;

  const usageType = parseUsageType(input.usageType);
  if (!usageType) {
    return { ok: false, error: "Ugyldig bildetype for AI-illustrasjon." };
  }

  const car = await loadCar(input.carId);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const prompt =
    input.prompt.trim() ||
    buildAdminGeneratorPrompt({
      brand: car.brand || car.slug,
      model: car.model || car.slug,
      variant: car.variant,
      year: car.year,
      usageType,
      style: "scandinavian_studio",
      aspectRatio: (input.aspectRatio || "16:9") as AiGeneratorAspectRatio,
      changeRequest: input.changeRequest,
    });

  const negativePrompt = input.negativePrompt?.trim() || defaultNegativePrompt();
  const provider = await buildProviderStatusFields(input.aspectRatio);

  if (!provider.providerAvailable) {
    return {
      ok: true,
      message:
        "AI-leverandøren er ikke tilgjengelig. Prompten er bevart — last opp bilde manuelt eller prøv igjen senere.",
      prompt,
      negativePrompt,
      awaitingGeneration: true,
      previewDataUrl: null,
      ...provider,
    };
  }

  const generated = await generateAiImageBytes({
    prompt,
    negativePrompt,
    aspectRatio: (input.aspectRatio || "16:9") as AiGeneratorAspectRatio,
  });

  if (!generated.ok) {
    // Soft-fail: keep prompt + open manual upload path. Never invent a successful image.
    // Retries happen inside the provider (bounded); this action does not create candidates.
    const adminMessage =
      generated.error?.trim() ||
      "AI-leverandøren er ikke tilgjengelig. Prompten er bevart — prøv igjen eller last opp resultat manuelt.";
    return {
      ok: true,
      message: adminMessage,
      prompt,
      negativePrompt,
      awaitingGeneration: true,
      previewDataUrl: null,
      ...provider,
      providerAvailable: false,
    };
  }

  return {
    ok: true,
    message: "Forhåndsvisning klar. Godkjenn kvalitetsjekk før innsending til Image Review.",
    prompt,
    negativePrompt,
    awaitingGeneration: false,
    previewDataUrl: `data:image/png;base64,${generated.buffer.toString("base64")}`,
    ...provider,
    providerAvailable: true,
  };
}

export async function buildAiGeneratorPromptAction(input: {
  carId: string;
  usageType: string;
  style?: string;
  aspectRatio?: string;
  changeRequest?: string;
}): Promise<AiImageActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth;

  const usageType = parseUsageType(input.usageType);
  if (!usageType) {
    return { ok: false, error: "Ugyldig bildetype." };
  }

  const car = await loadCar(input.carId);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const prompt = buildAdminGeneratorPrompt({
    brand: car.brand || car.slug,
    model: car.model || car.slug,
    variant: car.variant,
    year: car.year,
    usageType,
    style: (input.style || "scandinavian_studio") as AiGeneratorStyle,
    aspectRatio: (input.aspectRatio || "16:9") as AiGeneratorAspectRatio,
    changeRequest: input.changeRequest,
  });

  return {
    ok: true,
    message: "Prompt klar.",
    prompt,
    negativePrompt: defaultNegativePrompt(),
    ...(await buildProviderStatusFields(input.aspectRatio)),
  };
}

/**
 * Create an AI illustration candidate for Image Review.
 * Does not generate pixels in this environment — stores Awaiting Generation + prompt
 * unless the editor uploads a file in the same request.
 * Never auto-approves. Never sets hero. Never publishes.
 */
export async function createAiIllustrationCandidateAction(input: {
  carId: string;
  usageType: string;
  usageNote?: string;
  changeRequest?: string;
  includeEvfaktaMark?: boolean;
  /** Optional editor upload (FormData file) when generation ran externally. */
  imageBase64?: string | null;
  imageContentType?: string | null;
}): Promise<AiImageActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!dbReady()) {
    return { ok: false, error: "AI-illustrasjoner er midlertidig utilgjengelige." };
  }

  const usageType = parseUsageType(input.usageType);
  if (!usageType) {
    return { ok: false, error: "Ugyldig brukstype for AI-illustrasjon." };
  }

  if (
    usageType === "editor_requested_detail" &&
    !input.changeRequest?.trim()
  ) {
    return {
      ok: false,
      error:
        "Detalj-/interior/lading-bilder krever eksplisitt endringsforespørsel fra redaktør.",
    };
  }

  const car = await loadCar(input.carId);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  let imageBuffer: Buffer | null = null;
  if (input.imageBase64?.trim()) {
    try {
      const raw = input.imageBase64.includes(",")
        ? input.imageBase64.split(",", 2)[1]
        : input.imageBase64;
      imageBuffer = Buffer.from(raw, "base64");
    } catch {
      return { ok: false, error: "Kunne ikke lese opplastet bildefil." };
    }
  }

  const created = await createAiIllustrationCandidate({
    carId: car.id,
    brand: car.brand || car.slug,
    model: car.model || car.slug,
    slug: car.slug,
    usageType,
    usageNote: input.usageNote,
    changeRequest: input.changeRequest,
    includeEvfaktaMark: input.includeEvfaktaMark,
    imageBuffer,
  });

  if (!created.ok) return { ok: false, error: created.error };

  revalidateAiPaths(car.id, car.slug);

  if (created.awaitingGeneration) {
    return {
      ok: true,
      message:
        "AI-kandidat opprettet som Awaiting Generation. Prompt klar — generer eller last opp manuelt. Ingen auto-godkjenning.",
      candidateId: created.candidate.id,
      prompt: created.prompt,
      awaitingGeneration: true,
    };
  }

  return {
    ok: true,
    message:
      "AI-illustrasjon lagret i Storage som pending Image Review-kandidat. Krever manuell godkjenning.",
    candidateId: created.candidate.id,
    prompt: created.prompt,
    awaitingGeneration: false,
  };
}

/** Attach editor-uploaded bytes to an existing Awaiting Generation AI candidate. */
export async function uploadAiIllustrationBytesAction(input: {
  imageId: string;
  imageBase64: string;
}): Promise<AiImageActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!dbReady()) {
    return { ok: false, error: "AI-illustrasjoner er midlertidig utilgjengelige." };
  }

  const supabase = createAdminClient();
  const { data: image } = await supabase
    .from("research_image_candidates")
    .select("*")
    .eq("id", input.imageId)
    .maybeSingle();

  if (!image) return { ok: false, error: "Kandidaten ble ikke funnet." };
  const candidate = image as ResearchImageCandidate;
  if (!isAiIllustrationCandidate(candidate)) {
    return { ok: false, error: "Kun AI-illustrasjonskandidater kan lastes opp her." };
  }

  const { data: item } = await supabase
    .from("research_items")
    .select("existing_car_id")
    .eq("id", candidate.item_id)
    .maybeSingle();
  if (!item?.existing_car_id) {
    return { ok: false, error: "Mangler bilkobling for kandidaten." };
  }

  const car = await loadCar(item.existing_car_id as string);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  let buffer: Buffer;
  try {
    const raw = input.imageBase64.includes(",")
      ? input.imageBase64.split(",", 2)[1]
      : input.imageBase64;
    buffer = Buffer.from(raw, "base64");
  } catch {
    return { ok: false, error: "Kunne ikke lese bildefilen." };
  }

  const attached = await attachGeneratedBytesToAiCandidate({
    candidate,
    brand: car.brand || car.slug,
    modelSlug: car.slug,
    buffer,
  });
  if (!attached.ok) return { ok: false, error: attached.error };

  revalidateAiPaths(car.id, car.slug);
  return {
    ok: true,
    message:
      "Bilde lastet opp til Storage. Status forblir pending — manuell godkjenning kreves.",
    candidateId: attached.candidate.id,
    awaitingGeneration: false,
  };
}

/**
 * Regenerate = create a new pending AI candidate from an existing one + change request.
 * Previous candidate is kept (optionally marked with request-changes note). Never auto-approves.
 */
export async function regenerateAiIllustrationCandidateAction(input: {
  imageId: string;
  changeRequest: string;
  usageType?: string;
}): Promise<AiImageActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!dbReady()) {
    return { ok: false, error: "AI-illustrasjoner er midlertidig utilgjengelige." };
  }
  if (!input.changeRequest.trim()) {
    return { ok: false, error: "Endringsforespørsel er påkrevd for regenerering." };
  }

  const supabase = createAdminClient();
  const { data: image } = await supabase
    .from("research_image_candidates")
    .select("*")
    .eq("id", input.imageId)
    .maybeSingle();

  if (!image) return { ok: false, error: "Kandidaten ble ikke funnet." };
  const candidate = image as ResearchImageCandidate;
  if (!isAiIllustrationCandidate(candidate)) {
    return { ok: false, error: "Kun AI-illustrasjoner kan regenereres her." };
  }

  const { data: item } = await supabase
    .from("research_items")
    .select("existing_car_id")
    .eq("id", candidate.item_id)
    .maybeSingle();
  if (!item?.existing_car_id) {
    return { ok: false, error: "Mangler bilkobling." };
  }

  const car = await loadCar(item.existing_car_id as string);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const usageType =
    parseUsageType(input.usageType || "") ||
    parseAiUsageType(candidate.notes) ||
    "front_three_quarter";

  await supabase
    .from("research_image_candidates")
    .update({
      notes: appendAiApprovalEvent(
        candidate.notes,
        `changes_requested:${input.changeRequest.trim().slice(0, 200)}`,
      ),
    })
    .eq("id", candidate.id);

  const created = await createAiIllustrationCandidate({
    carId: car.id,
    brand: car.brand || car.slug,
    model: car.model || car.slug,
    slug: car.slug,
    usageType,
    changeRequest: input.changeRequest,
    previousCandidateId: candidate.id,
    usageNote: "Regenerated after editor change request — pending review.",
  });

  if (!created.ok) return { ok: false, error: created.error };

  revalidateAiPaths(car.id, car.slug);
  return {
    ok: true,
    message:
      "Ny AI-kandidat opprettet (Awaiting Generation) med oppdatert prompt. Forrige kandidat beholdes i historikk.",
    candidateId: created.candidate.id,
    prompt: created.prompt,
    awaitingGeneration: true,
  };
}

/** Record an editorial-use-only / history note when official photography replaces AI. */
export async function markAiIllustrationEditorialOnlyAction(input: {
  imageId: string;
}): Promise<AiImageActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;
  if (!dbReady()) {
    return { ok: false, error: "AI-illustrasjoner er midlertidig utilgjengelige." };
  }

  const supabase = createAdminClient();
  const { data: image } = await supabase
    .from("research_image_candidates")
    .select("*")
    .eq("id", input.imageId)
    .maybeSingle();

  if (!image) return { ok: false, error: "Kandidaten ble ikke funnet." };
  const candidate = image as ResearchImageCandidate;
  if (!isAiIllustrationCandidate(candidate)) {
    return { ok: false, error: "Ikke en AI-illustrasjon." };
  }

  const { data: item } = await supabase
    .from("research_items")
    .select("existing_car_id")
    .eq("id", candidate.item_id)
    .maybeSingle();

  const notes = withAiEditorialArchiveNotes(candidate.notes);

  const { error } = await supabase
    .from("research_image_candidates")
    .update({
      notes,
      is_primary_candidate: false,
    })
    .eq("id", candidate.id);

  if (error) return { ok: false, error: "Kunne ikke oppdatere AI-kandidat." };

  if (item?.existing_car_id) {
    const car = await loadCar(item.existing_car_id as string);
    revalidateAiPaths(item.existing_car_id as string, car?.slug);
  }

  return {
    ok: true,
    message:
      "AI-illustrasjon merket editorial-use-only / historikk. Offisielle bilder forblir foretrukket.",
  };
}
