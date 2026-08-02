/**
 * Google Gemini text generation (server-side).
 * Never logs or returns API keys.
 */

import {
  classifyGoogleAiErrorText,
  classifyGoogleAiHttpError,
  getGoogleAiApiKey,
  sanitizeProviderErrorMessage,
} from "@/lib/admin/ai-providers/google-ai";
import { isGoogleAiTextEnabled } from "@/lib/integrations/feature-flags";

export type GoogleAiTextResult =
  | {
      ok: true;
      text: string;
      model: string;
      generationTimeMs: number;
    }
  | {
      ok: false;
      error: string;
      unavailable?: boolean;
    };

export function getGoogleAiTextModel(): string {
  return (
    process.env.GOOGLE_AI_TEXT_MODEL?.trim() ||
    process.env.GOOGLE_AI_IMAGE_MODEL?.trim() ||
    "gemini-2.5-flash"
  );
}

/**
 * Generate plain text via Gemini generateContent.
 * Prefer a text model; falls back safely when disabled/missing key.
 */
export async function generateGoogleAiText(input: {
  prompt: string;
  systemInstruction?: string;
}): Promise<GoogleAiTextResult> {
  const startedAt = Date.now();

  if (!isGoogleAiTextEnabled()) {
    return {
      ok: false,
      unavailable: true,
      error: "AI-tekst er ikke aktivert (GOOGLE_AI_TEXT_ENABLED).",
    };
  }

  const apiKey = getGoogleAiApiKey();
  if (!apiKey) {
    return {
      ok: false,
      unavailable: true,
      error: "AI-leverandøren er ikke tilgjengelig",
    };
  }

  const model = getGoogleAiTextModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const contents = [
    {
      role: "user",
      parts: [{ text: input.prompt.slice(0, 12000) }],
    },
  ];

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  };

  if (input.systemInstruction?.trim()) {
    body.systemInstruction = {
      parts: [{ text: input.systemInstruction.trim().slice(0, 4000) }],
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const classified = classifyGoogleAiHttpError(response.status);
      void (await response.text().catch(() => ""));
      return {
        ok: false,
        unavailable: response.status === 401 || response.status === 403,
        error: classified.message,
      };
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (json.error?.message) {
      const classified = classifyGoogleAiErrorText(json.error.message);
      return {
        ok: false,
        error: sanitizeProviderErrorMessage(classified.message),
      };
    }

    const text = (json.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text || "")
      .join("\n")
      .trim();

    if (!text) {
      return {
        ok: false,
        error: "AI-leverandøren er ikke tilgjengelig",
      };
    }

    return {
      ok: true,
      text,
      model,
      generationTimeMs: Math.max(0, Date.now() - startedAt),
    };
  } catch {
    return {
      ok: false,
      error: "AI-leverandøren er ikke tilgjengelig",
    };
  }
}
