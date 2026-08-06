import type { ChatMessage } from "@/lib/chat/types";

export const CHAT_MAX_MESSAGE_CHARS = 1000;
export const CHAT_MAX_HISTORY = 20;

function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

export function validateChatRequest(input: unknown):
  | { ok: true; message: string; history: ChatMessage[] }
  | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Ugyldig forespørsel." };
  }

  const body = input as {
    message?: unknown;
    history?: unknown;
  };

  if (typeof body.message !== "string") {
    return { ok: false, error: "Meldingen mangler." };
  }

  const message = sanitizeText(body.message);
  if (!message) {
    return { ok: false, error: "Skriv et spørsmål først." };
  }
  if (message.length > CHAT_MAX_MESSAGE_CHARS) {
    return {
      ok: false,
      error: `Meldingen er for lang (maks ${CHAT_MAX_MESSAGE_CHARS} tegn).`,
    };
  }

  const historyRaw = Array.isArray(body.history) ? body.history : [];
  if (historyRaw.length > CHAT_MAX_HISTORY) {
    return {
      ok: false,
      error: `Samtalen er for lang (maks ${CHAT_MAX_HISTORY} tidligere meldinger).`,
    };
  }

  const history: ChatMessage[] = [];
  for (const item of historyRaw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const cleaned = sanitizeText(content).slice(0, CHAT_MAX_MESSAGE_CHARS);
    if (!cleaned) continue;
    history.push({ role, content: cleaned });
  }

  return { ok: true, message, history };
}
