/**
 * Server-side Gemini chat helper for the public EVFAKTA chatbot.
 * Uses @google/genai. Never log or return the API key.
 * Import only from API routes / server code — never from client components.
 */

import { GoogleGenAI } from "@google/genai";
import type { ChatMessage } from "@/lib/chat/types";

export const DEFAULT_GEMINI_CHAT_MODEL = "gemini-2.5-flash";

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

export function getGeminiChatModel(): string {
  return process.env.GEMINI_CHAT_MODEL?.trim() || DEFAULT_GEMINI_CHAT_MODEL;
}

export function isGeminiChatConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export type GeminiChatResult =
  | { ok: true; reply: string; model: string }
  | { ok: false; error: string; retryable: boolean };

/** Minimal client surface used by the chatbot (injectable for tests). */
export type GeminiChatClient = {
  models: {
    generateContent: (params: {
      model: string;
      contents: Array<{ role: string; parts: Array<{ text: string }> }>;
      config?: {
        systemInstruction?: string;
        temperature?: number;
        maxOutputTokens?: number;
      };
    }) => Promise<{ text?: string | null }>;
  };
};

/** Map OpenAI-style roles to Gemini contents (user / model). */
export function toGeminiContents(
  messages: ChatMessage[],
): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> =
    [];

  for (const message of messages) {
    if (message.role === "system") continue;
    const role = message.role === "assistant" ? "model" : "user";
    const text = message.content.trim();
    if (!text) continue;

    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text = `${last.parts[0].text}\n\n${text}`;
      continue;
    }
    contents.push({ role, parts: [{ text }] });
  }

  // Gemini expects the first turn to be from the user.
  if (contents.length && contents[0].role !== "user") {
    contents.unshift({
      role: "user",
      parts: [{ text: "Fortsett samtalen basert på konteksten." }],
    });
  }

  return contents;
}

function classifyGeminiError(error: unknown): {
  error: string;
  retryable: boolean;
} {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("rate") ||
    message.includes("quota")
  ) {
    return {
      error: "For mange forespørsler akkurat nå. Prøv igjen om litt.",
      retryable: true,
    };
  }
  if (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("api key") ||
    message.includes("permission")
  ) {
    return {
      error: "Chatboten er midlertidig utilgjengelig.",
      retryable: false,
    };
  }
  if (message.includes("500") || message.includes("503") || message.includes("unavailable")) {
    return {
      error: "AI-tjenesten svarte med en feil. Prøv igjen senere.",
      retryable: true,
    };
  }
  return {
    error: "AI-tjenesten svarte med en feil. Prøv igjen senere.",
    retryable: true,
  };
}

function createDefaultClient(apiKey: string): GeminiChatClient {
  return new GoogleGenAI({ apiKey }) as unknown as GeminiChatClient;
}

export async function generateGeminiChatReply(input: {
  system: string;
  messages: ChatMessage[];
  client?: GeminiChatClient;
}): Promise<GeminiChatResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "Chatboten er midlertidig utilgjengelig (mangler API-nøkkel).",
      retryable: false,
    };
  }

  const model = getGeminiChatModel();
  const contents = toGeminiContents(input.messages);
  if (!contents.length) {
    return {
      ok: false,
      error: "Skriv et spørsmål først.",
      retryable: false,
    };
  }

  const client = input.client ?? createDefaultClient(apiKey);

  try {
    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: input.system,
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      return {
        ok: false,
        error: "Tomt svar fra AI-tjenesten. Prøv igjen.",
        retryable: true,
      };
    }

    return { ok: true, reply, model };
  } catch (error) {
    const classified = classifyGeminiError(error);
    return { ok: false, ...classified };
  }
}
