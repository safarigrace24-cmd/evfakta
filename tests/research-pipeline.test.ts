import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectConflicts,
  findDuplicateSlugs,
  listMissingFields,
  validateSourceAttribution,
} from "../lib/admin/research/conflicts";
import {
  buildModelProposalFromText,
  extractFieldsFromText,
  parseStructuredResearchJson,
} from "../lib/admin/research/extract";
import { runResearchProvider } from "../lib/admin/research/providers";
import { sourcesForBrand } from "../lib/admin/research/sources";
import {
  isResearchJobAwaitingManual,
  RESEARCH_BLOCKED_EXPLANATION,
  type ResearchModelProposal,
} from "../lib/admin/research/types";
import {
  inferManualSourceMode,
  resolveManualProviderKey,
} from "../lib/admin/research/manual-input";
import {
  PUBLIC_SHOW_PRICES,
  PUBLIC_SHOW_SCORES,
} from "../lib/public/display-policy";
import { buildComparisonRows } from "../lib/compare/comparison";
import type { Car } from "../data/cars";

function source(confidence = 0.7) {
  return {
    source_name: "Testkilde",
    source_url: "https://example.com/specs",
    retrieved_at: "2026-07-26T00:00:00.000Z",
    confidence,
    provider_key: "manual" as const,
  };
}

describe("research extraction", () => {
  it("extracts known patterns and leaves unknowns null/absent", () => {
    const fields = extractFieldsFromText(
      "WLTP-rekkevidde 568 km. Brukbart batteri 75 kWh. DC 250 kW. 10–80 % på 27 min. Firehjulsdrift.",
      source(),
    );
    const map = Object.fromEntries(fields.map((field) => [field.field_key, field.value]));
    assert.equal(map.range_km, 568);
    assert.equal(map.battery_usable_kwh, 75);
    assert.equal(map.dc_charging_kw, 250);
    assert.equal(map.charge_time_10_80_minutes, 27);
    assert.equal(map.drivetrain, "Firehjulsdrift");
    assert.equal(map.price_nok, undefined);
  });

  it("never invents values without source patterns", () => {
    const proposal = buildModelProposalFromText({
      brand: "Tesla",
      model: "Model Y",
      text: "En elektrisk SUV uten tall.",
      sourceName: "Tesla Norge",
      sourceUrl: "https://www.tesla.com/no_NO/modely",
      providerKey: "manual",
    });
    assert.equal(proposal.fields.length, 0);
    assert.ok(proposal.missing_fields.includes("range_km"));
  });
});

describe("research source attribution", () => {
  it("flags populated fields without source", () => {
    const proposal: ResearchModelProposal = {
      brand: "Tesla",
      model: "Model Y",
      slug: "tesla-model-y",
      fields: [
        {
          field_key: "range_km",
          value: 500,
          source: {
            source_name: null,
            source_url: null,
            retrieved_at: "2026-07-26T00:00:00.000Z",
            confidence: 0.5,
            provider_key: "manual",
          },
        },
      ],
      variants: [],
      images: [],
      warnings: [],
      missing_fields: [],
      conflicts: [],
    };
    const errors = validateSourceAttribution(proposal);
    assert.ok(errors.some((error) => error.includes("range_km")));
  });
});

describe("research conflicts", () => {
  it("creates conflict warnings instead of silent choice", () => {
    const proposal: ResearchModelProposal = {
      brand: "Kia",
      model: "EV6",
      slug: "kia-ev6",
      fields: [
        { field_key: "range_km", value: 500, source: source(0.8) },
        {
          field_key: "range_km",
          value: 528,
          source: {
            ...source(0.5),
            source_name: "Sekundær",
            is_secondary: true,
          },
        },
      ],
      variants: [],
      images: [],
      warnings: [],
      missing_fields: [],
      conflicts: [],
    };

    const [result] = detectConflicts([proposal]);
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.conflicts[0].field_key, "range_km");
    assert.ok(result.warnings.some((warning) => warning.includes("Konflikt")));
    // First value kept for draft apply; conflict still recorded.
    assert.equal(result.fields.length, 1);
    assert.equal(result.fields[0].value, 500);
  });
});

describe("research duplicates and missing", () => {
  it("detects duplicate slugs", () => {
    const dupes = findDuplicateSlugs([
      {
        brand: "A",
        model: "One",
        slug: "a-one",
        fields: [],
        variants: [],
        images: [],
        warnings: [],
        missing_fields: [],
        conflicts: [],
      },
      {
        brand: "A",
        model: "One",
        slug: "a-one",
        fields: [],
        variants: [],
        images: [],
        warnings: [],
        missing_fields: [],
        conflicts: [],
      },
    ]);
    assert.deepEqual(dupes, ["a-one"]);
  });

  it("lists missing priority fields", () => {
    const missing = listMissingFields({
      brand: "A",
      model: "One",
      slug: "a-one",
      fields: [{ field_key: "range_km", value: 400, source: source() }],
      variants: [],
      images: [],
      warnings: [],
      missing_fields: [],
      conflicts: [],
    });
    assert.ok(missing.includes("battery_usable_kwh"));
    assert.ok(!missing.includes("range_km"));
  });
});

describe("research CMS sources", () => {
  it("returns curated presets for a brand", () => {
    const tesla = sourcesForBrand("Tesla");
    assert.ok(tesla.some((item) => item.sourceUrl.includes("tesla.com")));
    assert.equal(sourcesForBrand("UkjentMerke").length, 0);
  });

  it("brand + source URL without pasted text proposes master catalog shells", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        "<html><body><h1>Tesla</h1><p>Model Y Long Range</p><p>Model 3</p></body></html>",
        { status: 200, headers: { "content-type": "text/html" } },
      )) as typeof fetch;

    try {
      const result = await runResearchProvider("manufacturer_http", {
        brandName: "Tesla",
        sourceName: "Tesla Norge",
        sourceUrl: "https://www.tesla.com/no_NO",
      });
      assert.equal(result.errors.length, 0);
      assert.ok(result.models.length >= 2);
      assert.ok(result.models.some((model) => model.model === "Model Y"));
      assert.ok(
        result.models.every((model) => !("is_published" in model)),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("treats HTTP 403 as blocked soft-handoff (not a hard error list)", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("Forbidden", { status: 403 })) as typeof fetch;

    try {
      const result = await runResearchProvider("manufacturer_http", {
        brandName: "Tesla",
        sourceUrl: "https://www.tesla.com/no_NO",
      });
      assert.equal(result.blocked, true);
      assert.equal(result.models.length, 0);
      assert.equal(result.errors.length, 0);
      assert.ok(RESEARCH_BLOCKED_EXPLANATION.includes("forventet"));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("research manual handoff", () => {
  it("detects awaiting_manual and legacy blocked failures", () => {
    assert.equal(
      isResearchJobAwaitingManual({ status: "awaiting_manual", options: {} }),
      true,
    );
    assert.equal(
      isResearchJobAwaitingManual({
        status: "needs_review",
        options: { live_blocked: true },
      }),
      true,
    );
    assert.equal(
      isResearchJobAwaitingManual({
        status: "failed",
        error_message: "Kilden blokkerte automatisk tilgang",
        options: {},
      }),
      true,
    );
    assert.equal(
      isResearchJobAwaitingManual({
        status: "failed",
        error_message: "Uventet feil",
        options: {},
      }),
      false,
    );
  });

  it("routes JSON uploads to structured provider", () => {
    assert.equal(
      resolveManualProviderKey({
        rawInput: '{"cars":[]}',
        filename: "cars.json",
      }),
      "structured_json",
    );
    assert.equal(
      inferManualSourceMode({ rawInput: "WLTP 500 km", filename: "notes.csv" }),
      "manual_upload",
    );
  });
});

describe("research no auto-publish", () => {
  it("structured JSON import keeps is_published false conceptually via needs_review shells", async () => {
    const result = await runResearchProvider("structured_json", {
      rawInput: JSON.stringify({
        cars: [
          {
            slug: "tesla-model-y",
            brand: "Tesla",
            model: "Model Y",
            range_km: 568,
            source_name: "Tesla Norge",
            source_url: "https://www.tesla.com/no_NO/modely",
            variants: [
              { name: "Long Range RWD", slug: "long-range-rwd", is_default: true },
            ],
          },
        ],
      }),
      sourceName: "Tesla Norge",
      sourceUrl: "https://www.tesla.com/no_NO/modely",
    });

    assert.equal(result.errors.length, 0);
    assert.equal(result.models.length, 1);
    assert.equal(result.models[0].fields[0].source.source_name, "Tesla Norge");
    // Provider never returns a publish flag — apply layer hardcodes needs_review / is_published false.
    assert.equal(
      (result.models[0] as { is_published?: boolean }).is_published,
      undefined,
    );
  });

  it("parseStructuredResearchJson keeps missing values absent", () => {
    const parsed = parseStructuredResearchJson(
      JSON.stringify({
        cars: [{ brand: "Volvo", model: "EX30", range_km: 480 }],
      }),
      { sourceName: "Volvo", sourceUrl: "https://www.volvocars.com/no" },
    );
    assert.equal(parsed.models[0].fields.some((f) => f.field_key === "price_nok"), false);
  });
});

describe("public display policy", () => {
  it("hides prices and scores from public compare by default", () => {
    assert.equal(PUBLIC_SHOW_PRICES, false);
    assert.equal(PUBLIC_SHOW_SCORES, false);

    const car: Car = {
      slug: "a",
      brand: "A",
      model: "One",
      priceNok: 400000,
      rangeKm: 500,
      batteryKwh: 75,
      dcKw: 200,
      acKw: 11,
      drive: "Forhjulsdrift",
      description: "",
      updated: "2026-07-26",
      overallScore: 8,
    };
    const publicRows = buildComparisonRows([car, { ...car, slug: "b", priceNok: 350000 }]);
    assert.ok(!publicRows.some((row) => row.key === "priceNok"));
    assert.ok(!publicRows.some((row) => row.key === "overallScore"));
  });
});
