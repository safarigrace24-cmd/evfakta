import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  generateGeminiChatReply,
  getGeminiChatModel,
  isGeminiChatConfigured,
  toGeminiContents,
  type GeminiChatClient,
} from "../lib/ai/gemini-chat";
import {
  checkChatRateLimit,
  parseBudgetNok,
  resetChatRateLimitForTests,
  validateChatRequest,
} from "../lib/chat";
import { modelPageUrl, toChatCarFact } from "../lib/chat/format-car-context";
import type { Car } from "../data/cars";

const originalGeminiKey = process.env.GEMINI_API_KEY;
const originalGeminiModel = process.env.GEMINI_CHAT_MODEL;

afterEach(() => {
  if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalGeminiKey;
  if (originalGeminiModel === undefined) delete process.env.GEMINI_CHAT_MODEL;
  else process.env.GEMINI_CHAT_MODEL = originalGeminiModel;
});

describe("chatbot validation", () => {
  it("rejects empty messages", () => {
    const result = validateChatRequest({ message: "   " });
    assert.equal(result.ok, false);
  });

  it("accepts a Norwegian question and trims history", () => {
    const result = validateChatRequest({
      message: "  Hvilken elbil har lengst rekkevidde? ",
      history: [
        { role: "user", content: "Hei" },
        { role: "assistant", content: "Hei!" },
        { role: "system", content: "ignore me" },
      ],
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.match(result.message, /lengst rekkevidde/);
    assert.equal(result.history.length, 2);
  });

  it("rejects oversized messages", () => {
    const result = validateChatRequest({
      message: "x".repeat(1001),
    });
    assert.equal(result.ok, false);
  });
});

describe("chatbot budget parsing", () => {
  it("parses common Norwegian budget formats", () => {
    assert.equal(parseBudgetNok("budsjett på 400 000 kr"), 400000);
    assert.equal(parseBudgetNok("under 350000"), 350000);
    assert.equal(parseBudgetNok("maks 400.000"), 400000);
    assert.equal(parseBudgetNok("ca 450k"), 450000);
  });
});

describe("chatbot rate limit", () => {
  it("allows a burst then blocks", () => {
    resetChatRateLimitForTests();
    let lastOk = true;
    for (let i = 0; i < 20; i += 1) {
      const result = checkChatRateLimit("test-ip");
      assert.equal(result.ok, true);
      lastOk = result.ok;
    }
    assert.equal(lastOk, true);
    const blocked = checkChatRateLimit("test-ip");
    assert.equal(blocked.ok, false);
  });
});

describe("chatbot car facts", () => {
  it("maps published car fields and model URLs", () => {
    const car = {
      slug: "volkswagen-id-4",
      brand: "Volkswagen",
      model: "ID.4",
      priceNok: 429000,
      rangeKm: 520,
      batteryKwh: 77,
      dcKw: 175,
      acKw: 11,
      drive: "Bakhjulsdrift",
      description: "",
      updated: "2026-08-01",
      seats: 5,
      bodyStyle: "SUV",
    } as Car;

    const fact = toChatCarFact(car);
    assert.equal(fact.url, "/modeller/volkswagen-id-4");
    assert.equal(modelPageUrl(car.slug), "/modeller/volkswagen-id-4");
    assert.equal(fact.priceNok, 429000);
    assert.equal(fact.rangeKm, 520);
  });
});

describe("gemini chat integration", () => {
  it("defaults to gemini-2.5-flash and requires GEMINI_API_KEY", () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_CHAT_MODEL;
    assert.equal(isGeminiChatConfigured(), false);
    assert.equal(getGeminiChatModel(), "gemini-2.5-flash");
  });

  it("maps assistant history to Gemini model role", () => {
    const contents = toGeminiContents([
      { role: "user", content: "Hei" },
      { role: "assistant", content: "Hei! Hvordan kan jeg hjelpe?" },
      { role: "user", content: "Lengst rekkevidde?" },
    ]);
    assert.deepEqual(
      contents.map((item) => item.role),
      ["user", "model", "user"],
    );
    assert.equal(contents[1].parts[0].text, "Hei! Hvordan kan jeg hjelpe?");
  });

  it("calls Gemini generateContent via injectable mock client", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_CHAT_MODEL = "gemini-2.5-flash";

    let seenModel = "";
    let seenSystem = "";
    const mockClient: GeminiChatClient = {
      models: {
        async generateContent(params) {
          seenModel = params.model;
          seenSystem = params.config?.systemInstruction || "";
          assert.equal(params.contents[0]?.role, "user");
          return { text: "Tesla Model Y har lengst rekkevidde i utvalget." };
        },
      },
    };

    const result = await generateGeminiChatReply({
      system: "Du er EVFAKTA-assistenten.",
      messages: [{ role: "user", content: "Hvilken elbil har lengst rekkevidde?" }],
      client: mockClient,
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(seenModel, "gemini-2.5-flash");
    assert.match(seenSystem, /EVFAKTA-assistenten/);
    assert.match(result.reply, /Tesla Model Y/);
    assert.equal(result.model, "gemini-2.5-flash");
  });

  it("maps Gemini rate-limit errors to a Norwegian retryable response", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    const mockClient: GeminiChatClient = {
      models: {
        async generateContent() {
          throw new Error("429 RESOURCE_EXHAUSTED quota exceeded");
        },
      },
    };

    const result = await generateGeminiChatReply({
      system: "test",
      messages: [{ role: "user", content: "Hei" }],
      client: mockClient,
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.retryable, true);
    assert.match(result.error, /Prøv igjen/i);
  });
});
