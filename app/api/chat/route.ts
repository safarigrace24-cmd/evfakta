import { NextResponse } from "next/server";
import {
  generateGeminiChatReply,
  isGeminiChatConfigured,
} from "@/lib/ai/gemini-chat";
import {
  buildChatSystemPrompt,
  checkChatRateLimit,
  searchPublishedCarsForChat,
  validateChatRequest,
  type ChatApiError,
  type ChatApiSuccess,
} from "@/lib/chat";
import { isChatbotEnabled } from "@/lib/integrations/feature-flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function jsonError(error: string, status: number, headers?: HeadersInit) {
  const body: ChatApiError = { ok: false, error };
  return NextResponse.json(body, { status, headers });
}

/**
 * POST /api/chat
 * Public EVFAKTA chatbot. Server-only Gemini key. Published cars only.
 */
export async function POST(request: Request) {
  if (!isChatbotEnabled()) {
    return jsonError("Chatboten er ikke aktivert ennå.", 503);
  }

  if (!isGeminiChatConfigured()) {
    return jsonError("Chatboten er midlertidig utilgjengelig.", 503);
  }

  const rate = checkChatRateLimit(`chat:${clientKey(request)}`);
  if (!rate.ok) {
    return jsonError("For mange spørsmål. Prøv igjen om litt.", 429, {
      "Retry-After": String(rate.retryAfterSec),
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Ugyldig JSON.", 400);
  }

  const validated = validateChatRequest(payload);
  if (!validated.ok) {
    return jsonError(validated.error, 400);
  }

  try {
    const search = await searchPublishedCarsForChat(validated.message);
    const system = buildChatSystemPrompt(search);
    const messages = [
      ...validated.history,
      { role: "user" as const, content: validated.message },
    ];

    const generated = await generateGeminiChatReply({ system, messages });
    if (!generated.ok) {
      return jsonError(generated.error, generated.retryable ? 503 : 502);
    }

    const body: ChatApiSuccess = {
      ok: true,
      reply: generated.reply,
      cars: search.cars.map((car) => ({
        slug: car.slug,
        brand: car.brand,
        model: car.model,
        url: car.url,
      })),
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "no-store",
        "X-RateLimit-Remaining": String(rate.remaining),
      },
    });
  } catch (error) {
    console.error("[chat]", error instanceof Error ? error.message : "unknown");
    return jsonError("Noe gikk galt. Prøv igjen senere.", 500);
  }
}
