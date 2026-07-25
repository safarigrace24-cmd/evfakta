import type { AdminCar, AdminCarWrite } from "@/lib/admin/types";

export type PublishIssue = {
  code: string;
  message: string;
};

/** Required editorial/review data before a car may be published. */
export function getPublishIssues(
  car: Pick<
    AdminCar | AdminCarWrite,
    | "brand"
    | "model"
    | "slug"
    | "description"
    | "image_url"
    | "source_name"
    | "source_url"
    | "data_last_checked_at"
    | "import_status"
  > & { has_gallery_image?: boolean },
): PublishIssue[] {
  const issues: PublishIssue[] = [];

  if (!car.brand?.trim()) {
    issues.push({ code: "brand", message: "Merkenavn mangler." });
  }
  if (!car.model?.trim()) {
    issues.push({ code: "model", message: "Modellnavn mangler." });
  }
  if (!car.slug?.trim()) {
    issues.push({ code: "slug", message: "Slug mangler." });
  }
  if (!car.description?.trim()) {
    issues.push({ code: "description", message: "Beskrivelse mangler." });
  }
  if (!car.image_url?.trim() && !car.has_gallery_image) {
    issues.push({ code: "image", message: "Bilde mangler (bildebane eller galleri)." });
  }
  if (!car.source_name?.trim() && !car.source_url?.trim()) {
    issues.push({ code: "source", message: "Kilde (navn eller URL) mangler." });
  }
  if (!car.data_last_checked_at) {
    issues.push({ code: "checked", message: "Sist sjekket-dato mangler." });
  }
  if (car.import_status !== "approved") {
    issues.push({
      code: "import_status",
      message: "Bilen må være godkjent før publisering (godkjenning ≠ publisering).",
    });
  }

  return issues;
}

export function formatPublishIssues(issues: PublishIssue[]): string {
  if (issues.length === 0) return "";
  return `Kan ikke publisere: ${issues.map((issue) => issue.message).join(" ")}`;
}
