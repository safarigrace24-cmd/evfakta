import type { AdminCar } from "@/lib/admin/types";
import {
  IMPORT_COMPARE_FIELDS,
  type ImportApplyOptions,
  type ImportCarRow,
  type ImportReportSummary,
  type PreviewRow,
} from "@/lib/admin/import/types";

function normalizeValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map(String).join("|");
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).trim();
}

export function diffImportRow(
  incoming: ImportCarRow,
  existing: AdminCar | null | undefined,
): string[] {
  if (!existing) return [...IMPORT_COMPARE_FIELDS];

  const changed: string[] = [];
  for (const field of IMPORT_COMPARE_FIELDS) {
    const next = normalizeValue(incoming[field]);
    const prev = normalizeValue((existing as Record<string, unknown>)[field]);
    if (next !== prev) changed.push(field);
  }
  return changed;
}

export function buildImportPreview(
  rows: ImportCarRow[],
  existingBySlug: Map<string, AdminCar>,
  options: ImportApplyOptions = {},
): { preview: PreviewRow[]; summary: ImportReportSummary } {
  const skipUnchanged = options.skipUnchanged !== false;
  const updateExisting = options.updateExisting !== false;

  const preview: PreviewRow[] = [];
  const summary: ImportReportSummary = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    warnings: 0,
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const existing = existingBySlug.get(row.slug) ?? null;
    const messages: string[] = [];

    if (!row.brand || !row.model || !row.slug) {
      summary.errors += 1;
      preview.push({
        rowNumber,
        slug: row.slug || "(mangler)",
        brand: row.brand || "—",
        model: row.model || "—",
        decision: "error",
        messages: ["Mangler slug, brand eller model."],
        changedFields: [],
        existingId: existing?.id ?? null,
        payload: null,
      });
      return;
    }

    if (!existing) {
      summary.imported += 1;
      messages.push("Ny bil → draft/needs_review, upublisert.");
      preview.push({
        rowNumber,
        slug: row.slug,
        brand: row.brand,
        model: row.model,
        decision: "import",
        messages,
        changedFields: [],
        existingId: null,
        payload: row,
      });
      return;
    }

    if (!updateExisting) {
      summary.skipped += 1;
      messages.push("Eksisterer allerede — oppdatering er avslått.");
      preview.push({
        rowNumber,
        slug: row.slug,
        brand: row.brand,
        model: row.model,
        decision: "skip",
        messages,
        changedFields: [],
        existingId: existing.id,
        payload: row,
      });
      return;
    }

    const changedFields = diffImportRow(row, existing);
    const hasVariants = Boolean(row.variants?.length);
    if (skipUnchanged && changedFields.length === 0 && !hasVariants) {
      summary.skipped += 1;
      messages.push("Uendret — hoppes over.");
      preview.push({
        rowNumber,
        slug: row.slug,
        brand: row.brand,
        model: row.model,
        decision: "skip",
        messages,
        changedFields: [],
        existingId: existing.id,
        payload: row,
      });
      return;
    }

    summary.updated += 1;
    messages.push(
      changedFields.length > 0
        ? `Oppdaterer felt: ${changedFields.slice(0, 8).join(", ")}${changedFields.length > 8 ? "…" : ""}`
        : hasVariants
          ? `Oppdaterer ${row.variants!.length} variant(er).`
          : "Oppdaterer (tvungen).",
    );
    if (hasVariants) {
      messages.push(
        `${row.variants!.length} variant(er) importeres til gjennomgang (ingen auto-publisering).`,
      );
    }
    messages.push("Settes til needs_review. Publisering endres ikke automatisk.");
    preview.push({
      rowNumber,
      slug: row.slug,
      brand: row.brand,
      model: row.model,
      decision: "update",
      messages,
      changedFields,
      existingId: existing.id,
      payload: row,
    });
  });

  return { preview, summary };
}

export function emptyImportSummary(): ImportReportSummary {
  return {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    warnings: 0,
    imagesImported: 0,
    imagesSkipped: 0,
    imagesReplaced: 0,
    variantsImported: 0,
    variantsUpdated: 0,
  };
}
