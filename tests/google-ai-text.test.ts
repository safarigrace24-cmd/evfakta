import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  buildEditorialAiPrompt,
  detectUnsupportedClaimHints,
  ensureDraftMarker,
} from "../lib/admin/google-ai-editorial-drafts";
import { EDITORIAL_DRAFT_MARKER } from "../lib/admin/editorial-assist-core";
import { generateGoogleAiText } from "../lib/admin/google-ai-text";
import type { AdminCar } from "../lib/admin/types";

const ORIGINAL = {
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  GOOGLE_AI_TEXT_ENABLED: process.env.GOOGLE_AI_TEXT_ENABLED,
  GOOGLE_AI_TEXT_MODEL: process.env.GOOGLE_AI_TEXT_MODEL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function car(): AdminCar {
  return {
    id: "1",
    slug: "test-ev",
    brand: "BYD",
    brand_id: null,
    model: "Seal U",
    variant: "Comfort",
    trim_level: null,
    model_generation: null,
    year: 2025,
    price_nok: null,
    range_km: 500,
    battery_kwh: 71,
    battery_total_kwh: null,
    battery_usable_kwh: 71,
    battery_chemistry: null,
    winter_range_km: null,
    real_world_range_km: null,
    dc_charging_kw: 140,
    charge_time_10_80_minutes: null,
    charging_connector_ac: null,
    charging_connector_dc: null,
    drivetrain: "FWD",
    image_url: null,
    description: null,
    is_published: false,
    consumption_kwh_100km: null,
    power_hp: null,
    torque_nm: null,
    acceleration_0_100: null,
    top_speed_kmh: null,
    seats: 5,
    cargo_l: 550,
    towing_kg: null,
    warranty: null,
    ac_charging_kw: 11,
    vehicle_type: null,
    body_style: "SUV",
    length_mm: null,
    width_mm: null,
    height_mm: null,
    wheelbase_mm: null,
    curb_weight_kg: null,
    gross_weight_kg: null,
    frunk_l: null,
    heat_pump: null,
    v2l: null,
    v2g: null,
    apple_carplay: null,
    android_auto: null,
    head_up_display: null,
    panoramic_roof: null,
    ota_updates: null,
    pros: null,
    cons: null,
    suitable_for: null,
    source_url: null,
    source_name: null,
    source_updated_at: null,
    data_last_checked_at: null,
    import_status: "needs_review",
    import_notes: null,
    country: null,
    last_import_job_id: null,
    field_sources: {},
    score_notes: null,
    created_at: null,
    updated_at: null,
  } as unknown as AdminCar;
}

describe("Google AI editorial text drafts", () => {
  it("builds prompts with catalog facts and draft marker instruction", () => {
    const prompt = buildEditorialAiPrompt("description", car());
    assert.match(prompt, /BYD/);
    assert.match(prompt, /Seal U/);
    assert.match(prompt, /500/);
    assert.match(prompt, new RegExp(EDITORIAL_DRAFT_MARKER));
  });

  it("ensures draft marker on AI output", () => {
    assert.ok(ensureDraftMarker("Hei").startsWith(EDITORIAL_DRAFT_MARKER));
    assert.equal(
      ensureDraftMarker(`${EDITORIAL_DRAFT_MARKER}\n\nHei`),
      `${EDITORIAL_DRAFT_MARKER}\n\nHei`,
    );
  });

  it("builds rewrite prompts from source text without inventing specs", () => {
    const prompt = buildEditorialAiPrompt("rewrite_shorter", car(), {
      sourceText: "En lang tekst om bilen uten nye tall.",
    });
    assert.match(prompt, /Source text/);
    assert.match(prompt, /lang tekst/);
    assert.match(prompt, /do not invent/i);
  });

  it("flags unsupported claim hints locally", () => {
    const hints = detectUnsupportedClaimHints(
      "Vi har testet bilen og den er best i test med 999 km.",
      car(),
    );
    assert.ok(hints.length >= 1);
    assert.ok(hints.some((h) => /test/i.test(h)));
  });

  it("returns unavailable when text feature flag is off", async () => {
    process.env.GOOGLE_AI_TEXT_ENABLED = "false";
    process.env.GOOGLE_AI_API_KEY = "test-key";
    const result = await generateGoogleAiText({ prompt: "test" });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.unavailable, true);
  });

  it("normalizes mocked Gemini text without exposing the key", async () => {
    process.env.GOOGLE_AI_TEXT_ENABLED = "true";
    process.env.GOOGLE_AI_API_KEY = "secret-text-key";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Utkast tekst" }] } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;
    try {
      const result = await generateGoogleAiText({ prompt: "skriv" });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.match(result.text, /Utkast/);
        assert.doesNotMatch(JSON.stringify(result), /secret-text-key/);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
