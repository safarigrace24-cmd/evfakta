import type { CarImageRow } from "@/lib/admin/car-image-types";
import {
  containsEditorialDraftMarker,
  getPublishIssues,
  type PublishIssue,
} from "@/lib/admin/publish-readiness";
import type { AdminCar } from "@/lib/admin/types";
import type { AdminCarVariant } from "@/lib/admin/variant-types";

/** Minimum Review Assistant completion for Launch Ready / Publish Ready. */
export const LAUNCH_COMPLETION_THRESHOLD = 95;

export type EditorialCheckItem = {
  id: string;
  label: string;
  complete: boolean;
  /** When true, incomplete items also appear as hard publish blockers when relevant. */
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
  /** True when publish gates pass AND completion ≥ LAUNCH_COMPLETION_THRESHOLD. */
  canPublish: boolean;
  /** True when launch content gates pass AND completion ≥ LAUNCH_COMPLETION_THRESHOLD. */
  canLaunchReady: boolean;
  launchCompletionThreshold: number;
  meetsCompletionThreshold: boolean;
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

function anyVariantNumber(
  variants: AdminCarVariant[],
  key: keyof AdminCarVariant,
): boolean {
  return variants.some((variant) => hasNumber(variant[key] as number | null));
}

function anyVariantText(
  variants: AdminCarVariant[],
  key: keyof AdminCarVariant,
): boolean {
  return variants.some((variant) => hasText(variant[key] as string | null));
}

/** Official real-world / winter figures are often absent — document honesty, never invent. */
function hasDocumentedRangeHonesty(scoreNotes: string | null | undefined): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  return (
    /vinter|winter|reell|real[- ]?world|ikke testet|ikke oppgitt|ikke gjettet|laboratoriemål/.test(
      text,
    )
  );
}

/**
 * Official WLTP range sometimes cannot be confirmed live (e.g. Tesla Norge 403) —
 * document honesty, never invent.
 */
function hasDocumentedWltpHonesty(scoreNotes: string | null | undefined): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  return (
    /(wltp|rekkevidde)/.test(text) &&
    /(ikke gjettet|ikke bekreftet|ikke lagret|ikke oppgitt|tesla norge|live[- ]?side)/.test(
      text,
    )
  );
}

/**
 * Battery kWh sometimes cannot be confirmed from live market pages —
 * document honesty, never invent.
 */
function hasDocumentedBatteryHonesty(
  scoreNotes: string | null | undefined,
): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  return (
    /batteri/.test(text) &&
    /(ikke gjettet|ikke bekreftet|ikke lagret|ikke oppgitt|tesla norge|live[- ]?side)/.test(
      text,
    )
  );
}

/**
 * AC/DC kW / 10–80 sometimes cannot be confirmed from live market pages —
 * document honesty, never invent.
 */
function hasDocumentedChargingHonesty(
  scoreNotes: string | null | undefined,
): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  return (
    /(lading|ac\/dc|dc-effekt|dc\s*kW|10\s*[–-]\s*80)/i.test(text) &&
    /(ikke gjettet|ikke bekreftet|ikke lagret|ikke oppgitt|tesla norge|live[- ]?side)/.test(
      text,
    )
  );
}

/** WLTP kWh/100 km is sometimes omitted from Norwegian price PDFs — document honesty, never invent. */
function hasDocumentedConsumptionHonesty(
  scoreNotes: string | null | undefined,
): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  return (
    /forbruk/.test(text) &&
    /(ikke oppgitt|ikke gjettet|ikke lagret|mangler|uten tall|ikke publisert)/.test(
      text,
    )
  );
}

/**
 * Official docs may state towing is not possible, brake-dependent dual ratings,
 * or market-dependent — count as complete without inventing a single kg.
 */
function hasDocumentedTowHonesty(scoreNotes: string | null | undefined): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  return /tilhenger\s+ikke\s+mulig|ingen\s+tilhenger|tilhenger\s+ikke\s+tillatt|tow(ing)?\s+not\s+possible|750\s*\/\s*1000|med\/uten.*brems|avhengig av tilhengerbrems|markedsavhengig|ikke én bilnivåverdi|ikke bekreftet mot tesla norge/.test(
    text,
  );
}

/** Battery chemistry sometimes omitted from price PDFs — document honesty, never invent. */
function hasDocumentedChemistryHonesty(
  scoreNotes: string | null | undefined,
): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  return (
    /(batteri\s*kjemi|battery\s*chemistry|batteritype)/.test(text) &&
    /(ikke oppgitt|ikke gjettet|ikke lagret|mangler|ikke publisert)/.test(text)
  );
}

/** Connectors sometimes omitted from Volvo NO specs tables — document honesty, never invent. */
function hasDocumentedConnectorHonesty(
  scoreNotes: string | null | undefined,
): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  return (
    /(kontakt|connector|ccs|type\s*2|ladestandard)/.test(text) &&
    /(ikke oppgitt|ikke eksplisitt|ikke listet|ikke gjettet|mangler|ikke publisert)/.test(
      text,
    )
  );
}

/** Seats may be config-dependent (6/7) — document honesty instead of inventing one value. */
function hasDocumentedSeatsHonesty(scoreNotes: string | null | undefined): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  return (
    /(sete|seter|seats)/.test(text) &&
    /(6\s*[–-]\s*7|konfigurasjon|ikke én bilnivåverdi|config)/.test(text)
  );
}

/**
 * Rear / Interior are required only when available.
 * Documented unavailability counts as complete — never invent images.
 */
function hasDocumentedOptionalMediaHonesty(
  scoreNotes: string | null | undefined,
  role: "interior" | "rear",
): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  const roleRe = role === "interior" ? /interi[øo]r/ : /\brek\b|rear|bakfoto|\bbak\b/;
  return (
    roleRe.test(text) &&
    /(ikke tilgjengelig|ikke verifisert|mangler|left empty|ikke funnet|not available|uten offisiell)/.test(
      text,
    )
  );
}

function hasFaqSection(scoreNotes: string | null | undefined): boolean {
  const text = scoreNotes ?? "";
  return /##\s*FAQ/i.test(text) || /\?\s*\n/.test(text);
}

function hasEditorialTopics(scoreNotes: string | null | undefined): boolean {
  const text = scoreNotes?.toLowerCase() ?? "";
  if (!text.trim()) return false;
  const topics = ["vinter", "lading", "langtur", "daglig", "hvem"];
  return topics.filter((topic) => text.includes(topic)).length >= 3;
}

function hasDraftMarker(car: AdminCar): boolean {
  return (
    containsEditorialDraftMarker(car.description) ||
    containsEditorialDraftMarker(car.pros) ||
    containsEditorialDraftMarker(car.cons) ||
    containsEditorialDraftMarker(car.suitable_for) ||
    containsEditorialDraftMarker(car.score_notes)
  );
}

/**
 * Editorial Review Assistant — completion checklist for editors.
 *
 * Specs count when present on the car OR any variant (variant catalogs are first-class).
 * Launch Ready / Publish Ready require completion ≥ {@link LAUNCH_COMPLETION_THRESHOLD}
 * in addition to hard publish gates (draft marker, hero/front/side, SEO, sources, approval).
 */
export function computeEditorialCompletion(input: {
  car: AdminCar;
  images: CarImageRow[];
  variants: AdminCarVariant[];
}): EditorialCompletion {
  const { car, images, variants } = input;

  const hasVariant =
    variants.length > 0 || hasText(car.variant) || hasText(car.trim_level);

  const hasBattery =
    hasNumber(car.battery_usable_kwh) ||
    hasNumber(car.battery_total_kwh) ||
    hasNumber(car.battery_kwh) ||
    anyVariantNumber(variants, "battery_usable_kwh") ||
    anyVariantNumber(variants, "battery_total_kwh") ||
    hasDocumentedBatteryHonesty(car.score_notes);

  const hasRange =
    hasNumber(car.range_km) ||
    anyVariantNumber(variants, "range_km") ||
    hasDocumentedWltpHonesty(car.score_notes);

  const hasRealWorldRange =
    hasNumber(car.real_world_range_km) ||
    hasNumber(car.winter_range_km) ||
    hasDocumentedRangeHonesty(car.score_notes);

  const hasConsumption =
    hasNumber(car.consumption_kwh_100km) ||
    anyVariantNumber(variants, "consumption_kwh_100km") ||
    hasDocumentedConsumptionHonesty(car.score_notes);

  const hasCharging =
    hasNumber(car.dc_charging_kw) ||
    hasNumber(car.ac_charging_kw) ||
    hasNumber(car.charge_time_10_80_minutes) ||
    anyVariantNumber(variants, "dc_charging_kw") ||
    anyVariantNumber(variants, "ac_charging_kw") ||
    anyVariantNumber(variants, "charge_time_10_80_minutes") ||
    hasDocumentedChargingHonesty(car.score_notes);

  const hasPerformance =
    hasNumber(car.power_hp) ||
    hasNumber(car.acceleration_0_100) ||
    hasText(car.drivetrain) ||
    anyVariantNumber(variants, "power_hp") ||
    anyVariantNumber(variants, "acceleration_0_100") ||
    anyVariantText(variants, "drivetrain");

  const hasDimensions =
    hasNumber(car.length_mm) ||
    hasNumber(car.width_mm) ||
    hasNumber(car.height_mm) ||
    hasNumber(car.wheelbase_mm);

  const hasCargo = hasNumber(car.cargo_l) || hasNumber(car.frunk_l);

  const hasSeats =
    hasNumber(car.seats) || hasDocumentedSeatsHonesty(car.score_notes);
  const hasTowing =
    hasNumber(car.towing_kg) ||
    anyVariantNumber(variants, "towing_kg") ||
    hasDocumentedTowHonesty(car.score_notes);

  const hasChemistry =
    hasText(car.battery_chemistry) ||
    hasDocumentedChemistryHonesty(car.score_notes);

  const hasHero =
    images.some((image) => image.is_primary) || Boolean(car.image_url?.trim());
  const hasFront = hasImageType(images, "front") || Boolean(car.image_url?.trim());
  const hasSide = hasImageType(images, "side");
  const hasRear =
    hasImageType(images, "rear") ||
    hasDocumentedOptionalMediaHonesty(car.score_notes, "rear");
  const hasInterior =
    hasImageType(images, "interior") ||
    hasDocumentedOptionalMediaHonesty(car.score_notes, "interior");
  /** Launch gallery floor: Hero + Front + Side. Rear/Interior tracked separately. */
  const galleryComplete = hasHero && hasFront && hasSide;

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
        item("year", "Model year", hasNumber(car.year)),
        item("variant", "Variants", hasVariant),
        item("body_style", "Body style", hasText(car.body_style)),
      ],
    },
    {
      id: "specifications",
      title: "Specifications",
      items: [
        item("battery", "Battery (or documented gap)", hasBattery),
        item(
          "battery_chemistry",
          "Battery chemistry (or documented gap)",
          hasChemistry,
        ),
        item("range", "Range (WLTP or documented gap)", hasRange),
        item(
          "real_world_range",
          "Real-world / winter range (or documented gap)",
          hasRealWorldRange,
        ),
        item(
          "consumption",
          "Consumption (or documented gap)",
          hasConsumption,
        ),
        item("charging", "Charging (AC/DC or documented gap)", hasCharging),
        item(
          "connectors",
          "Charging connectors (or documented gap)",
          hasText(car.charging_connector_ac) ||
            hasText(car.charging_connector_dc) ||
            hasDocumentedConnectorHonesty(car.score_notes),
        ),
        item("performance", "Performance", hasPerformance),
        item("dimensions", "Dimensions", hasDimensions),
      ],
    },
    {
      id: "practical",
      title: "Practicality",
      items: [
        item("cargo", "Cargo", hasCargo),
        item("seats", "Seats (or documented config range)", hasSeats),
        item("towing", "Tow capacity (or documented none)", hasTowing),
        item(
          "heat_pump",
          "Heat pump (set or documented)",
          car.heat_pump === true ||
            car.heat_pump === false ||
            /varme\s*pumpe/i.test(car.score_notes ?? "") ||
            /varme\s*pumpe/i.test(car.description ?? ""),
        ),
      ],
    },
    {
      id: "media",
      title: "Images",
      items: [
        item("hero_image", "Hero", hasHero, true),
        item("front_image", "Front", hasFront, true),
        item("side_image", "Side", hasSide, true),
        item("rear_image", "Rear (when available)", hasRear),
        item("interior", "Interior (when available)", hasInterior),
        item(
          "gallery_complete",
          "Gallery ready (Hero+Front+Side)",
          galleryComplete,
          true,
        ),
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
        item(
          "editorial_topics",
          "Charging / winter / daily / long-trip notes",
          hasEditorialTopics(car.score_notes),
        ),
        item("faq", "FAQ", hasFaqSection(car.score_notes)),
        item(
          "related_models",
          "Related models (brand catalog)",
          hasText(car.brand),
        ),
      ],
    },
    {
      id: "sources",
      title: "Sources",
      items: [
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
        item("no_draft_marker", "No Draft markers", !hasDraftMarker(car), true),
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

  const readinessInput = {
    brand: car.brand,
    model: car.model,
    slug: car.slug,
    description: car.description,
    image_url: car.image_url,
    source_name: car.source_name,
    source_url: car.source_url,
    data_last_checked_at: car.data_last_checked_at,
    import_status: car.import_status,
    pros: car.pros,
    cons: car.cons,
    suitable_for: car.suitable_for,
    score_notes: car.score_notes,
    has_gallery_image: images.length > 0,
    gallery_images: images.map((image) => ({
      image_type: image.image_type,
      is_primary: image.is_primary,
    })),
    completion_percent: percent,
  };

  const publishIssues: PublishIssue[] = getPublishIssues(readinessInput);
  const launchIssues: PublishIssue[] = getPublishIssues(readinessInput, {
    requireApproved: false,
  });

  const meetsCompletionThreshold = percent >= LAUNCH_COMPLETION_THRESHOLD;

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
    canLaunchReady: launchIssues.length === 0,
    launchCompletionThreshold: LAUNCH_COMPLETION_THRESHOLD,
    meetsCompletionThreshold,
  };
}
