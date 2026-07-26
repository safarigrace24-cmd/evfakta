/**
 * Helpers for continuing a research job with manual paste / file upload.
 */

export async function extractTextFromPdfBase64(
  base64: string,
): Promise<{ text: string; warning?: string }> {
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length < 5 || buffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
    return { text: "", warning: "Filen ser ikke ut som en PDF." };
  }

  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    const raw = result.text;
    const text = (Array.isArray(raw) ? raw.join("\n") : String(raw ?? "")).trim();
    if (!text) {
      return {
        text: "",
        warning:
          "PDF-en inneholdt ingen lesbar tekst. Lim inn spesifikasjonsteksten manuelt i stedet.",
      };
    }
    return { text };
  } catch {
    return {
      text: "",
      warning:
        "Kunne ikke lese PDF automatisk. Lim inn teksten fra den offisielle PDF-en i stedet.",
    };
  }
}

export function looksLikeJson(text: string, filename?: string | null): boolean {
  const name = (filename ?? "").toLowerCase();
  const trimmed = text.trim();
  return (
    name.endsWith(".json") || trimmed.startsWith("{") || trimmed.startsWith("[")
  );
}

export function inferManualSourceMode(input: {
  filename?: string | null;
  rawInput?: string | null;
}): "manual_paste" | "manual_upload" | "structured" {
  const text = (input.rawInput ?? "").trim();
  if (looksLikeJson(text, input.filename)) return "structured";
  if (input.filename) return "manual_upload";
  return "manual_paste";
}

/** Prefer structured provider when content is JSON. */
export function resolveManualProviderKey(input: {
  filename?: string | null;
  rawInput?: string | null;
}): "manual" | "structured_json" {
  return looksLikeJson(input.rawInput ?? "", input.filename)
    ? "structured_json"
    : "manual";
}
