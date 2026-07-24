import {
  ADMIN_MESSAGES,
  DRIVETRAIN_OPTIONS,
  SLUG_PATTERN,
  type AdminCarInput,
  type AdminCarWrite,
} from "@/lib/admin/types";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalInt(value: string, label: string): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: `${label} må være et heltall.` };
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `${label} er ugyldig.` };
  }
  return { ok: true, value: parsed };
}

function parseOptionalNumber(
  value: string,
  label: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return { ok: true, value: null };
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, error: `${label} må være et gyldig tall.` };
  }
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `${label} er ugyldig.` };
  }
  return { ok: true, value: parsed };
}

export function validateAdminCarInput(
  input: AdminCarInput,
): { ok: true; data: AdminCarWrite } | { ok: false; error: string } {
  const brand = input.brand.trim();
  const model = input.model.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!brand) return { ok: false, error: "Merke er påkrevd." };
  if (!model) return { ok: false, error: "Modell er påkrevd." };
  if (!slug) return { ok: false, error: "Slug er påkrevd." };
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      error: "Slug må være små bokstaver, tall og bindestrek (f.eks. tesla-model-y).",
    };
  }

  const year = parseOptionalInt(input.year, "Årsmodell");
  if (!year.ok) return year;

  const price = parseOptionalInt(input.price_nok, "Pris");
  if (!price.ok) return price;

  const range = parseOptionalInt(input.range_km, "Rekkevidde");
  if (!range.ok) return range;

  const battery = parseOptionalNumber(input.battery_kwh, "Batteri");
  if (!battery.ok) return battery;

  const dc = parseOptionalInt(input.dc_charging_kw, "DC-lading");
  if (!dc.ok) return dc;

  const drivetrain = emptyToNull(input.drivetrain);
  if (
    drivetrain &&
    !(DRIVETRAIN_OPTIONS as readonly string[]).includes(drivetrain)
  ) {
    return { ok: false, error: "Ugyldig drivlinje." };
  }

  const imageUrl = emptyToNull(input.image_url);
  if (imageUrl && !imageUrl.startsWith("/")) {
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { ok: false, error: "Bildebane må være en gyldig http(s)-URL eller relativ sti." };
      }
    } catch {
      return { ok: false, error: "Bildebane må være en gyldig URL eller relativ sti." };
    }
  }

  return {
    ok: true,
    data: {
      brand,
      model,
      slug,
      year: year.value,
      price_nok: price.value,
      range_km: range.value,
      battery_kwh: battery.value,
      dc_charging_kw: dc.value,
      drivetrain,
      image_url: imageUrl,
      description: emptyToNull(input.description),
      is_published: Boolean(input.is_published),
    },
  };
}

export function mapAdminDbError(error: { code?: string; message?: string } | null): string {
  if (!error) return ADMIN_MESSAGES.genericError;
  if (error.code === "23505") return ADMIN_MESSAGES.slugTaken;
  console.error("[admin] database error:", {
    code: error.code,
    message: error.message,
  });
  return ADMIN_MESSAGES.genericError;
}
