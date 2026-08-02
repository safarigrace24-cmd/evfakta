"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import { getAdminCarById } from "@/lib/admin/cars";
import {
  runAssistedEditorialFill,
  type AssistedEditorialResult,
} from "@/lib/admin/editorial-assist";
import {
  buildEditorialAiPrompt,
  buildEditorialAiSystemInstruction,
  detectUnsupportedClaimHints,
  ensureDraftMarker,
  isEditorialAiDraftKind,
  isRewriteKind,
  type EditorialAiDraftKind,
} from "@/lib/admin/google-ai-editorial-drafts";
import { generateGoogleAiText } from "@/lib/admin/google-ai-text";
import { isGoogleAiTextEnabled } from "@/lib/integrations/feature-flags";

export type EditorialAssistActionResult =
  | (AssistedEditorialResult & { ok: true })
  | { ok: false; error: string };

export type EditorialAiDraftActionResult =
  | {
      ok: true;
      kind: EditorialAiDraftKind;
      draft: string;
      message: string;
      model?: string;
      sourceText?: string;
      claimHints?: string[];
    }
  | { ok: false; error: string };

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "403 Forbidden" };
  }
  return { ok: true };
}

export async function researchAndFillMissingFieldsAction(
  carId: string,
): Promise<EditorialAssistActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (!carId?.trim()) {
    return { ok: false, error: "Mangler bil-id." };
  }

  try {
    const user = await getAuthUser();
    const result = await runAssistedEditorialFill({
      carId: carId.trim(),
      createdBy: user!.id,
    });

    revalidatePath("/admin/biler");
    revalidatePath(`/admin/biler/${carId}/rediger`);
    revalidatePath("/admin/import/research");
    if (result.jobId) {
      revalidatePath(`/admin/import/research/${result.jobId}`);
    }

    if (!result.ok) {
      return { ok: false, error: result.error || "Assisted fill feilet." };
    }

    return { ...result, ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Uventet feil.",
    };
  }
}

/**
 * Generate an editorial draft suggestion via Gemini.
 * Does NOT write to the database — editor must copy/approve manually.
 */
export async function generateEditorialAiDraftAction(input: {
  carId: string;
  kind: EditorialAiDraftKind;
  /** Required for rewrite / claim_check kinds. */
  sourceText?: string;
}): Promise<EditorialAiDraftActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (!input.carId?.trim()) {
    return { ok: false, error: "Mangler bil-id." };
  }

  const kind = input.kind;
  if (!isEditorialAiDraftKind(kind)) {
    return { ok: false, error: "Ugyldig utkast-type." };
  }

  if (!isGoogleAiTextEnabled()) {
    return {
      ok: false,
      error: "AI-assistenten er midlertidig utilgjengelig.",
    };
  }

  const car = await getAdminCarById(input.carId.trim());
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const sourceText =
    input.sourceText?.trim() ||
    (isRewriteKind(kind) || kind === "claim_check"
      ? car.description?.trim() || ""
      : "");

  if ((isRewriteKind(kind) || kind === "claim_check") && !sourceText) {
    return {
      ok: false,
      error: "Mangler kildetekst å omskrive eller kontrollere.",
    };
  }

  const generated = await generateGoogleAiText({
    prompt: buildEditorialAiPrompt(kind, car, { sourceText }),
    systemInstruction: buildEditorialAiSystemInstruction(),
  });

  if (!generated.ok) {
    return {
      ok: false,
      error: "AI-assistenten er midlertidig utilgjengelig.",
    };
  }

  const labels: Record<EditorialAiDraftKind, string> = {
    description: "introduksjon",
    faq: "FAQ",
    summary: "sammendrag",
    metadata: "metadata",
    seo_title: "SEO-tittel",
    meta_description: "meta-beskrivelse",
    social_caption: "sosial tekst",
    rewrite_clearer: "klarere omskrivning",
    rewrite_shorter: "kortere omskrivning",
    rewrite_neutral: "nøytral omskrivning",
    claim_check: "påstandsjekk",
  };

  const draft = ensureDraftMarker(generated.text);
  const claimHints = detectUnsupportedClaimHints(
    kind === "claim_check" ? sourceText : draft,
    car,
  );

  return {
    ok: true,
    kind,
    draft,
    model: generated.model,
    sourceText: isRewriteKind(kind) ? sourceText : undefined,
    claimHints: claimHints.length ? claimHints : undefined,
    message: `Utkast til ${labels[kind]} klart. Ingenting er lagret — redaktør må kontrollere før publisering.`,
  };
}

export async function getEditorialAiTextStatusAction(): Promise<
  | {
      ok: true;
      enabled: boolean;
      configured: boolean;
      message: string;
    }
  | { ok: false; error: string }
> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const enabled = isGoogleAiTextEnabled();
  const configured = Boolean(process.env.GOOGLE_AI_API_KEY?.trim());
  return {
    ok: true,
    enabled,
    configured,
    message: !configured
      ? "API-nøkkel mangler"
      : !enabled
        ? "Funksjon deaktivert (GOOGLE_AI_TEXT_ENABLED)"
        : "Tilkoblet",
  };
}
