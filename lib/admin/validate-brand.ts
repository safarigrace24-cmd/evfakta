import { SLUG_PATTERN } from "@/lib/admin/types";
import {
  BRAND_MESSAGES,
  type AdminBrandInput,
  type AdminBrandWrite,
} from "@/lib/admin/brand-types";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function validateAdminBrandInput(
  input: AdminBrandInput,
): { ok: true; data: AdminBrandWrite } | { ok: false; error: string } {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!name) return { ok: false, error: "Merkenavn er påkrevd." };
  if (!slug) return { ok: false, error: "Slug er påkrevd." };
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      error: "Slug må være små bokstaver, tall og bindestrek (f.eks. tesla).",
    };
  }

  const logoUrl = emptyToNull(input.logo_url);
  if (logoUrl && !logoUrl.startsWith("/")) {
    try {
      const url = new URL(logoUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { ok: false, error: "Logo-URL må være en gyldig http(s)-URL eller relativ sti." };
      }
    } catch {
      return { ok: false, error: "Logo-URL må være en gyldig URL eller relativ sti." };
    }
  }

  const websiteUrl = emptyToNull(input.website_url);
  if (websiteUrl) {
    try {
      const url = new URL(websiteUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { ok: false, error: "Nettsted må være en gyldig http(s)-URL." };
      }
    } catch {
      return { ok: false, error: "Nettsted må være en gyldig URL." };
    }
  }

  return {
    ok: true,
    data: {
      name,
      slug,
      logo_url: logoUrl,
      country: emptyToNull(input.country),
      website_url: websiteUrl,
      description: emptyToNull(input.description),
      is_active: Boolean(input.is_active),
    },
  };
}

export function mapBrandDbError(error: { code?: string; message?: string } | null): string {
  if (!error) return BRAND_MESSAGES.genericError;
  if (error.code === "23505") return BRAND_MESSAGES.slugTaken;
  console.error("[admin] brand database error:", {
    code: error.code,
    message: error.message,
  });
  return BRAND_MESSAGES.genericError;
}
