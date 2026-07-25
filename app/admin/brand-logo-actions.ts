"use server";

import sharp from "sharp";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import { SLUG_PATTERN } from "@/lib/admin/types";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

const BUCKET = "brand-logos";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type BrandLogoActionResult =
  | { ok: true; message: string; url?: string | null }
  | { ok: false; error: string };

async function assertAdmin(): Promise<BrandLogoActionResult | null> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "Du har ikke tilgang til å laste opp logoer." };
  }
  return null;
}

function storageReady(): boolean {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function objectPath(slug: string): string {
  return `${slug}.webp`;
}

function publicUrlForSlug(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${objectPath(slug)}`;
}

function isManagedBrandLogoUrl(url: string, slug: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname.endsWith(`/storage/v1/object/public/${BUCKET}/${objectPath(slug)}`);
  } catch {
    return false;
  }
}

export async function uploadBrandLogoAction(input: {
  slug: string;
  base64: string;
  contentType: string;
}): Promise<BrandLogoActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;

  if (!storageReady()) {
    return {
      ok: false,
      error: "Bildelagring er ikke konfigurert. Sett SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const slugRaw = String(input.slug ?? "").trim().toLowerCase();
  const contentType = String(input.contentType ?? "").trim().toLowerCase();
  const base64 = String(input.base64 ?? "").trim();

  if (!slugRaw || !SLUG_PATTERN.test(slugRaw)) {
    return {
      ok: false,
      error: "Gyldig slug kreves før opplasting (f.eks. tesla).",
    };
  }

  if (!base64) {
    return { ok: false, error: "Velg en logo å laste opp." };
  }

  if (!ALLOWED_TYPES.has(contentType)) {
    return {
      ok: false,
      error: "Ugyldig filtype. Bruk JPEG, PNG, WebP eller GIF.",
    };
  }

  try {
    const inputBuffer = Buffer.from(base64, "base64");
    if (inputBuffer.byteLength === 0) {
      return { ok: false, error: "Velg en logo å laste opp." };
    }
    if (inputBuffer.byteLength > MAX_BYTES) {
      return { ok: false, error: "Logoen er for stor. Maks 5 MB." };
    }

    const webp = await sharp(inputBuffer)
      .rotate()
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const supabase = createAdminClient();
    const path = objectPath(slugRaw);
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, webp, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "3600",
    });

    if (uploadError) {
      console.error("[admin] uploadBrandLogoAction failed:", uploadError.message);
      return { ok: false, error: "Kunne ikke laste opp logoen til Storage." };
    }

    return {
      ok: true,
      message: "Logoen er lastet opp.",
      url: publicUrlForSlug(slugRaw),
    };
  } catch (error) {
    console.error("[admin] uploadBrandLogoAction exception:", error);
    return { ok: false, error: "Kunne ikke behandle logoen. Prøv et annet bilde." };
  }
}

export async function removeBrandLogoAction(
  slug: string,
  currentUrl?: string,
): Promise<BrandLogoActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;

  if (!storageReady()) {
    return {
      ok: false,
      error: "Bildelagring er ikke konfigurert. Sett SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const slugRaw = String(slug ?? "").trim().toLowerCase();
  if (!slugRaw || !SLUG_PATTERN.test(slugRaw)) {
    return { ok: false, error: "Ugyldig slug." };
  }

  try {
    const supabase = createAdminClient();
    if (!currentUrl || isManagedBrandLogoUrl(currentUrl, slugRaw)) {
      await supabase.storage.from(BUCKET).remove([objectPath(slugRaw)]);
    }

    return { ok: true, message: "Logoen er fjernet.", url: null };
  } catch (error) {
    console.error("[admin] removeBrandLogoAction exception:", error);
    return { ok: false, error: "Kunne ikke fjerne logoen." };
  }
}
