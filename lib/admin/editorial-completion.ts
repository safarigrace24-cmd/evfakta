import type { CarImageRow } from "@/lib/admin/car-image-types";
import { getPublishIssues, type PublishIssue } from "@/lib/admin/publish-readiness";
import type { AdminCar } from "@/lib/admin/types";
import type { AdminCarVariant } from "@/lib/admin/variant-types";

export type EditorialCheckItem = {
  id: string;
  label: string;
  complete: boolean;
  /** When false, item is editorial guidance only — does not block publish. */
  requiredForPublish?: boolean;
};

export type EditorialCheckSection = {
  id: string;
  title: string;
  items: EditorialCheckItem[];
};

export type EditorialCompletion = {
  title: string;
  percent: number;
  completedCount: number;
  totalCount: number;
  sections: EditorialCheckSection[];
  missing: string[];
  missingItemIds: string[];
  publishIssues: PublishIssue[];
  canPublish: boolean;
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function hasNumber(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function hasList(value: string[] | null | undefined): boolean {
  return Array.isArray(value) && value.some((item) => hasText(item));
}

function hasImageType(images: CarImageRow[], type: CarImageRow["image_type"]): boolean {
  return images.some((image) => image.image_type === type);
}

function item(
  id: string,
  label: string,
  complete: boolean,
  requiredForPublish = false,
): EditorialCheckItem {
  return { id, label, complete, requiredForPublish };
}

/**
 * Editorial Review Assistant — completion checklist for editors.
 * Publish is still gated only by getPublishIssues (required fields).
 */
export function computeEditorialCompletion(input: {
  car: AdminCar;
  images: CarImageRow[];
  variants: AdminCarVariant[];
}): EditorialCompletion {
  const { car, images, variants } = input;

  const hasVariant =
    variants.some((variant) => variant.is_active !== false) ||
    hasText(car.variant) ||
    hasText(car.trim_level);

  const hasBattery =
    hasNumber(car.battery_usable_kwh) ||
    hasNumber(car.battery_total_kwh) ||
    hasNumber(car.battery_kwh);

  const hasRange = hasNumber(car.range_km);
  const hasRealWorldRange = hasNumber(car.real_world_range_km);
  const hasConsumption = hasNumber(car.consumption_kwh_100km);
  const hasCharging =
    hasNumber(car.dc_charging_kw) ||
    hasNumber(car.ac_charging_kw) ||
    hasNumber(car.charge_time_10_80_minutes);

  const hasPerformance =
    hasNumber(car.power_hp) ||
    hasNumber(car.acceleration_0_100) ||
    hasText(car.drivetrain);

  const hasDimensions =
    hasNumber(car.length_mm) ||
    hasNumber(car.width_mm) ||
    hasNumber(car.height_mm) ||
    hasNumber(car.wheelbase_mm);

  const hasCargo = hasNumber(car.cargo_l) || hasNumber(car.frunk_l);
  const hasSeats = hasNumber(car.seats);
  const hasTowing = hasNumber(car.towing_kg);

  const hasFront = hasImageType(images, "front") || Boolean(car.image_url?.trim());
  const hasRear = hasImageType(images, "rear");
  const hasInterior = hasImageType(images, "interior");
  const galleryComplete = hasFront && hasRear && hasInterior && images.length >= 4;

  const importStatus = car.import_status ?? "draft";
  const enteredReview =
    importStatus === "needs_review" || importStatus === "approved";
  const isApproved = importStatus === "approved";

  const sections: EditorialCheckSection[] = [
    {
      id: "identity",
      title: "Identity",
      items: [
        item("brand", "Brand", hasText(car.brand), true),
        item("model", "Model", hasText(car.model), true),
        item("variant", "Variant", hasVariant),
      ],
    },
    {
      id: "specifications",
      title: "Specifications",
      items: [
        item("battery", "Battery", hasBattery),
        item("battery_chemistry", "Battery chemistry", hasText(car.battery_chemistry)),
        item("range", "Range (WLTP)", hasRange),
        item("real_world_range", "Real-world range", hasRealWorldRange),
        item("consumption", "Consumption", hasConsumption),
        item("charging", "Charging", hasCharging),
        item("performance", "Performance", hasPerformance),
        item("dimensions", "Dimensions", hasDimensions),
      ],
    },
    {
      id: "practical",
      title: "Practical",
      items: [
        item("cargo", "Cargo", hasCargo),
        item("seats", "Seats", hasSeats),
        item("towing", "Tow capacity", hasTowing),
      ],
    },
    {
      id: "media",
      title: "Media",
      items: [
        item("front_image", "Front image", hasFront, true),
        item("rear_image", "Rear image", hasRear),
        item("interior", "Interior photo", hasInterior),
        item("gallery_complete", "Gallery complete", galleryComplete),
      ],
    },
    {
      id: "editorial",
      title: "Editorial",
      items: [
        item("description", "Description", hasText(car.description), true),
        item("pros", "Pros", hasList(car.pros)),
        item("cons", "Cons", hasList(car.cons)),
        item("suitable_for", "Suitable for", hasList(car.suitable_for)),
      ],
    },
    {
      id: "sources",
      title: "Sources",
      items: [
        // Publish requires name or URL (see getPublishIssues); both are tracked here.
        item("source_url", "Source URL", hasText(car.source_url)),
        item("source_name", "Source Name", hasText(car.source_name)),
        item("last_checked", "Last Checked", Boolean(car.data_last_checked_at), true),
      ],
    },
    {
      id: "review",
      title: "Review",
      items: [
        item("needs_review", "Needs Review", enteredReview),
        item("approved", "Approved", isApproved, true),
      ],
    },
  ];

  const allItems = sections.flatMap((section) => section.items);
  const completedCount = allItems.filter((entry) => entry.complete).length;
  const totalCount = allItems.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const incomplete = allItems.filter((entry) => !entry.complete);
  const missing = incomplete.map((entry) => entry.label);
  const missingItemIds = incomplete.map((entry) => entry.id);

  const publishIssues = getPublishIssues({
    brand: car.brand,
    model: car.model,
    slug: car.slug,
    description: car.description,
    image_url: car.image_url,
    source_name: car.source_name,
    source_url: car.source_url,
    data_last_checked_at: car.data_last_checked_at,
    import_status: car.import_status,
    has_gallery_image: images.length > 0,
  });

  return {
    title: `${car.brand} ${car.model}`.trim() || "Untitled car",
    percent,
    completedCount,
    totalCount,
    sections,
    missing,
    missingItemIds,
    publishIssues,
    canPublish: publishIssues.length === 0,
  };
}
