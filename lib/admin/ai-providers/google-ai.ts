/**
 * Safe error classification for Google AI — never include API keys or raw bodies.
 */

export type GoogleAiHealthCode =
  | "connected"
  | "missing_api_key"
  | "feature_disabled"
  | "model_unavailable"
  | "quota_or_billing"
  | "temporary_error"
  | "not_configured";

/** Distinct 429 / failure categories for retry policy + admin copy. */
export type GoogleAiFailureCategory =
  | "quota_limit_0"
  | "temporary_rate_limit"
  | "billing_problem"
  | "model_unavailable"
  | "auth_or_key"
  | "temporary_error"
  | "unknown";

export type GoogleAiFailureClassification = {
  code: GoogleAiHealthCode;
  category: GoogleAiFailureCategory;
  /** Safe Norwegian (or short EN health) message for admin UI — never includes secrets. */
  message: string;
  /** Only temporary rate limits / 5xx are retryable. */
  retryable: boolean;
};

/**
 * Shown when Google image quota is not enabled for the project (FreeTier limit 0, etc.).
 * Manual upload remains available.
 */
export const GOOGLE_AI_IMAGE_QUOTA_ADMIN_MESSAGE =
  "Google har ikke aktivert bildekvote for dette prosjektet ennå. Du kan laste opp et generert bilde manuelt.";

/** Default stable Gemini image model — override with GOOGLE_AI_IMAGE_MODEL. */
export const DEFAULT_GOOGLE_AI_IMAGE_MODEL = "gemini-2.5-flash-image";

/** Max retry attempts after the first failed HTTP call (total attempts = 1 + this). */
export const GOOGLE_AI_IMAGE_MAX_RETRIES = 2;

export function getGoogleAiApiKey(): string | null {
  return process.env.GOOGLE_AI_API_KEY?.trim() || null;
}

export function getGoogleAiImageModel(): string {
  return (
    process.env.GOOGLE_AI_IMAGE_MODEL?.trim() || DEFAULT_GOOGLE_AI_IMAGE_MODEL
  );
}

/** Map aspect ratio to Gemini imageConfig values. */
export function googleAspectRatioFor(
  aspect: string,
): "1:1" | "3:4" | "4:3" | "9:16" | "16:9" {
  if (aspect === "1:1") return "1:1";
  if (aspect === "9:16") return "9:16";
  if (aspect === "4:3" || aspect === "3:2") return "4:3";
  return "16:9";
}

function detectQuotaSignals(bodyText: string): {
  freeTier: boolean;
  limitZero: boolean;
  paidTier: boolean;
  billing: boolean;
  rateLimit: boolean;
  quotaIds: string[];
  providerStatus?: string;
} {
  const lower = bodyText.toLowerCase();
  let freeTier = /freetier/i.test(bodyText);
  let limitZero = /limit:\s*0\b/i.test(bodyText);
  let paidTier = /paidtier|tier_?1/i.test(bodyText);
  let billing = /\bbilling\b/i.test(lower);
  let rateLimit = /rate[- ]?limit|too many requests/i.test(lower);
  const quotaIds: string[] = [];
  let providerStatus: string | undefined;

  try {
    const parsed = JSON.parse(bodyText) as {
      error?: {
        status?: string;
        message?: string;
        details?: Array<{
          violations?: Array<{ quotaId?: string; quotaMetric?: string }>;
          "@type"?: string;
        }>;
      };
    };
    providerStatus = parsed.error?.status;
    const msg = parsed.error?.message || "";
    if (/freetier/i.test(msg)) freeTier = true;
    if (/limit:\s*0\b/i.test(msg)) limitZero = true;
    if (/\bbilling\b/i.test(msg)) billing = true;
    for (const detail of parsed.error?.details || []) {
      for (const v of detail.violations || []) {
        if (v.quotaId) {
          quotaIds.push(v.quotaId);
          if (/freetier/i.test(v.quotaId)) freeTier = true;
        }
        if (v.quotaMetric) quotaIds.push(v.quotaMetric);
      }
    }
  } catch {
    // non-JSON body — use string signals only
  }

  return {
    freeTier,
    limitZero,
    paidTier,
    billing,
    rateLimit,
    quotaIds: [...new Set(quotaIds)].slice(0, 12),
    providerStatus,
  };
}

/**
 * Classify a failed Google AI HTTP response for admin messaging + retry policy.
 * Never returns raw provider bodies.
 */
export function classifyGoogleAiHttpFailure(
  status: number,
  bodyText = "",
  retryAfterHeader: string | null = null,
): GoogleAiFailureClassification {
  if (status === 401 || status === 403) {
    return {
      code: "missing_api_key",
      category: "auth_or_key",
      message: "Google AI API-nøkkel mangler eller er ugyldig.",
      retryable: false,
    };
  }

  if (status === 404) {
    return {
      code: "model_unavailable",
      category: "model_unavailable",
      message: "AI-modellen er ikke tilgjengelig for denne nøkkelen.",
      retryable: false,
    };
  }

  if (status === 429) {
    const signals = detectQuotaSignals(bodyText);
    // FreeTier / hard zero quota — do not retry.
    if (signals.freeTier || signals.limitZero) {
      return {
        code: "quota_or_billing",
        category: "quota_limit_0",
        message: GOOGLE_AI_IMAGE_QUOTA_ADMIN_MESSAGE,
        retryable: false,
      };
    }
    // Temporary rate limit — only when explicitly signaled (do not guess).
    if (signals.rateLimit || Boolean(retryAfterHeader?.trim())) {
      return {
        code: "temporary_error",
        category: "temporary_rate_limit",
        message:
          "Midlertidig hastighetsbegrensning hos Google AI. Prøv igjen om litt, eller last opp et generert bilde manuelt.",
        retryable: true,
      };
    }
    if (signals.billing) {
      return {
        code: "quota_or_billing",
        category: "billing_problem",
        message: GOOGLE_AI_IMAGE_QUOTA_ADMIN_MESSAGE,
        retryable: false,
      };
    }
    // Unknown 429 — fail closed (no retry storm).
    return {
      code: "quota_or_billing",
      category: "quota_limit_0",
      message: GOOGLE_AI_IMAGE_QUOTA_ADMIN_MESSAGE,
      retryable: false,
    };
  }

  if (status >= 500) {
    return {
      code: "temporary_error",
      category: "temporary_error",
      message: "Midlertidig feil hos Google AI. Prøv igjen, eller last opp manuelt.",
      retryable: true,
    };
  }

  const fromText = classifyGoogleAiErrorText(bodyText);
  return {
    code: fromText.code,
    category:
      fromText.code === "model_unavailable"
        ? "model_unavailable"
        : fromText.code === "quota_or_billing"
          ? "quota_limit_0"
          : fromText.code === "missing_api_key"
            ? "auth_or_key"
            : "unknown",
    message: fromText.message,
    retryable: false,
  };
}

/** @deprecated Prefer classifyGoogleAiHttpFailure for full retry metadata. */
export function classifyGoogleAiHttpError(status: number): {
  code: GoogleAiHealthCode;
  message: string;
} {
  const full = classifyGoogleAiHttpFailure(status, "", null);
  return { code: full.code, message: full.message };
}

export function classifyGoogleAiErrorText(text: string): {
  code: GoogleAiHealthCode;
  message: string;
} {
  const lower = text.toLowerCase();
  if (
    /freetier/i.test(text) ||
    /limit:\s*0\b/i.test(text) ||
    lower.includes("quota") ||
    lower.includes("resource_exhausted")
  ) {
    return {
      code: "quota_or_billing",
      message: GOOGLE_AI_IMAGE_QUOTA_ADMIN_MESSAGE,
    };
  }
  if (lower.includes("billing")) {
    return {
      code: "quota_or_billing",
      message: GOOGLE_AI_IMAGE_QUOTA_ADMIN_MESSAGE,
    };
  }
  if (lower.includes("rate limit") || lower.includes("rate-limit")) {
    return {
      code: "temporary_error",
      message:
        "Midlertidig hastighetsbegrensning hos Google AI. Prøv igjen om litt, eller last opp et generert bilde manuelt.",
    };
  }
  if (
    lower.includes("not found") ||
    lower.includes("not supported") ||
    (lower.includes("model") && lower.includes("unavailable"))
  ) {
    return {
      code: "model_unavailable",
      message: "AI-modellen er ikke tilgjengelig for denne nøkkelen.",
    };
  }
  if (
    lower.includes("api key") ||
    lower.includes("permission") ||
    lower.includes("unauthenticated") ||
    lower.includes("forbidden")
  ) {
    return {
      code: "missing_api_key",
      message: "Google AI API-nøkkel mangler eller er ugyldig.",
    };
  }
  return {
    code: "temporary_error",
    message: "AI-leverandøren er ikke tilgjengelig",
  };
}

/**
 * Delay before a retry. Honours Retry-After (seconds) when present;
 * otherwise exponential backoff from the retry index (0-based).
 */
export function googleAiRetryDelayMs(
  retryIndex: number,
  retryAfterHeader: string | null,
): number {
  if (retryAfterHeader?.trim()) {
    const seconds = Number(retryAfterHeader.trim());
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(Math.max(0, seconds) * 1000, 30_000);
    }
  }
  // 1s, 2s (capped) for retryIndex 0, 1
  return Math.min(1000 * 2 ** retryIndex, 8000);
}

/**
 * Strip secrets from any diagnostic string before returning to UI/logs.
 */
export function sanitizeProviderErrorMessage(raw: string): string {
  return raw
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, "[redacted]")
    .replace(/key=[^&\s]+/gi, "key=[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .slice(0, 240);
}
