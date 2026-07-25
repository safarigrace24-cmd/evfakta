"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import { BRAND_MESSAGES, type AdminBrandInput } from "@/lib/admin/brand-types";
import { mapBrandDbError, validateAdminBrandInput } from "@/lib/admin/validate-brand";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type BrandActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string };

const LOGO_BUCKET = "brand-logos";

async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: BRAND_MESSAGES.unauthorized };
  }
  return { ok: true };
}

function adminDbReady(): boolean {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function revalidateBrandPaths(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/merker");
  revalidatePath("/merker");
  if (slug) {
    revalidatePath(`/merker/${slug}`);
    revalidatePath(`/admin/merker`);
  }
  revalidatePath("/admin/biler");
  revalidatePath("/modeller");
}

async function syncCarsBrandName(brandId: string, brandName: string) {
  const supabase = createAdminClient();
  await supabase.from("cars").update({ brand: brandName }).eq("brand_id", brandId);
}

function isManagedLogoAtSlug(logoUrl: string, slug: string): boolean {
  try {
    const parsed = new URL(logoUrl);
    return parsed.pathname.endsWith(
      `/storage/v1/object/public/${LOGO_BUCKET}/${slug}.webp`,
    );
  } catch {
    return false;
  }
}

/** True when the URL is inside the managed brand-logos bucket (any slug). */
function isManagedBrandLogoUrl(logoUrl: string): boolean {
  try {
    const parsed = new URL(logoUrl);
    return parsed.pathname.includes(`/storage/v1/object/public/${LOGO_BUCKET}/`);
  } catch {
    return false;
  }
}

function publicLogoUrlForSlug(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${LOGO_BUCKET}/${slug}.webp`;
}

async function removeLogoIfManaged(logoUrl: string | null | undefined, slug: string) {
  if (!logoUrl || !isManagedLogoAtSlug(logoUrl, slug)) return;
  await removeManagedLogoAtSlug(slug);
}

async function removeManagedLogoAtSlug(slug: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(LOGO_BUCKET).remove([`${slug}.webp`]);
    if (error) {
      console.error(
        `[admin] Failed to remove brand logo at ${LOGO_BUCKET}/${slug}.webp:`,
        error.message,
      );
    }
  } catch (error) {
    console.error(
      `[admin] Exception removing brand logo at ${LOGO_BUCKET}/${slug}.webp:`,
      error,
    );
  }
}

async function managedLogoExists(slug: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(LOGO_BUCKET).download(`${slug}.webp`);
    if (error) {
      // Missing object is expected during renames — do not treat as hard failure.
      if (/not found|404|object not found/i.test(error.message)) {
        return false;
      }
      console.error(
        `[admin] Could not check brand logo ${LOGO_BUCKET}/${slug}.webp:`,
        error.message,
      );
      return false;
    }
    return Boolean(data);
  } catch (error) {
    console.error(
      `[admin] Exception checking brand logo ${LOGO_BUCKET}/${slug}.webp:`,
      error,
    );
    return false;
  }
}

/**
 * Copy old managed logo to the new slug path, then delete the old file.
 * Returns the new public URL, or null if the old file is missing / move failed.
 */
async function moveManagedLogo(oldSlug: string, newSlug: string): Promise<string | null> {
  if (!oldSlug || !newSlug || oldSlug === newSlug) return null;

  const supabase = createAdminClient();
  const oldPath = `${oldSlug}.webp`;
  const newPath = `${newSlug}.webp`;

  const { data: blob, error: downloadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .download(oldPath);

  if (downloadError || !blob) {
    if (downloadError && !/not found|404|object not found/i.test(downloadError.message)) {
      console.error(
        `[admin] Failed to download brand logo ${LOGO_BUCKET}/${oldPath}:`,
        downloadError.message,
      );
    }
    return null;
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(newPath, buffer, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "3600",
  });

  if (uploadError) {
    console.error(
      `[admin] Failed to copy brand logo to ${LOGO_BUCKET}/${newPath}:`,
      uploadError.message,
    );
    return null;
  }

  const { error: removeError } = await supabase.storage.from(LOGO_BUCKET).remove([oldPath]);
  if (removeError) {
    console.error(
      `[admin] Copied logo to ${newPath} but failed to delete ${oldPath}:`,
      removeError.message,
    );
  }

  return publicLogoUrlForSlug(newSlug);
}

/**
 * After a brand slug rename, relocate or clean up managed logos.
 * Returns an updated logo_url when the DB row needs a follow-up update.
 * External (non-managed) logos are left untouched.
 */
async function relocateLogoAfterSlugChange(input: {
  oldSlug: string;
  newSlug: string;
  existingLogoUrl: string | null;
  submittedLogoUrl: string | null;
}): Promise<string | null> {
  const { oldSlug, newSlug, existingLogoUrl, submittedLogoUrl } = input;

  // Case 3: no logo, or external URL — do not move/delete.
  if (!existingLogoUrl) return null;
  if (!isManagedBrandLogoUrl(existingLogoUrl)) return null;

  const newLogoUrl = publicLogoUrlForSlug(newSlug);
  const submittedPointsToNew =
    Boolean(submittedLogoUrl) && isManagedLogoAtSlug(submittedLogoUrl!, newSlug);
  const newFileExists = submittedPointsToNew || (await managedLogoExists(newSlug));

  // Case 1: logo already uploaded under the new slug.
  if (newFileExists) {
    if (isManagedLogoAtSlug(existingLogoUrl, oldSlug) || (await managedLogoExists(oldSlug))) {
      await removeManagedLogoAtSlug(oldSlug);
    }
    return newLogoUrl;
  }

  // Case 2: no new logo yet — move old managed file to the new slug path.
  if (!isManagedLogoAtSlug(existingLogoUrl, oldSlug)) {
    // Managed URL under an unexpected path; leave it alone.
    console.error(
      `[admin] Brand logo URL is managed but does not match old slug "${oldSlug}":`,
      existingLogoUrl,
    );
    return null;
  }

  const movedUrl = await moveManagedLogo(oldSlug, newSlug);
  if (movedUrl) {
    return movedUrl;
  }

  // Old file missing or copy failed — keep existing URL so we never lose a working logo reference.
  console.error(
    `[admin] Could not move brand logo from ${oldSlug}.webp to ${newSlug}.webp; leaving logo_url unchanged.`,
  );
  return null;
}

export async function createAdminBrandAction(
  input: AdminBrandInput,
): Promise<BrandActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const validated = validateAdminBrandInput(input);
  if (!validated.ok) return validated;

  if (!adminDbReady()) {
    return { ok: false, error: BRAND_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brands")
      .insert(validated.data)
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: mapBrandDbError(error) };
    }

    revalidateBrandPaths(validated.data.slug);
    return {
      ok: true,
      message: BRAND_MESSAGES.createSuccess,
      id: data.id as string,
    };
  } catch (error) {
    console.error("[admin] createAdminBrandAction exception:", error);
    return { ok: false, error: BRAND_MESSAGES.unavailable };
  }
}

export async function updateAdminBrandAction(
  id: string,
  input: AdminBrandInput,
): Promise<BrandActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!id) return { ok: false, error: BRAND_MESSAGES.notFound };

  const validated = validateAdminBrandInput(input);
  if (!validated.ok) return validated;

  if (!adminDbReady()) {
    return { ok: false, error: BRAND_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("brands")
      .select("id, slug, logo_url, name")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return { ok: false, error: BRAND_MESSAGES.notFound };
    }

    const { data, error } = await supabase
      .from("brands")
      .update(validated.data)
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapBrandDbError(error) };
    }

    if (!data) {
      return { ok: false, error: BRAND_MESSAGES.notFound };
    }

    if (existing.name !== validated.data.name) {
      await syncCarsBrandName(id, validated.data.name);
    }

    if (existing.slug !== validated.data.slug) {
      const nextLogoUrl = await relocateLogoAfterSlugChange({
        oldSlug: existing.slug as string,
        newSlug: validated.data.slug,
        existingLogoUrl: (existing.logo_url as string | null) ?? null,
        submittedLogoUrl: validated.data.logo_url,
      });

      if (nextLogoUrl && nextLogoUrl !== validated.data.logo_url) {
        const { error: logoUpdateError } = await supabase
          .from("brands")
          .update({ logo_url: nextLogoUrl })
          .eq("id", id);

        if (logoUpdateError) {
          console.error(
            "[admin] Failed to update brand logo_url after slug change:",
            logoUpdateError.message,
          );
        }
      }
    }

    revalidateBrandPaths(validated.data.slug);
    if (existing.slug !== validated.data.slug) {
      revalidateBrandPaths(existing.slug as string);
    }

    return { ok: true, message: BRAND_MESSAGES.updateSuccess, id };
  } catch (error) {
    console.error("[admin] updateAdminBrandAction exception:", error);
    return { ok: false, error: BRAND_MESSAGES.unavailable };
  }
}

export async function deleteAdminBrandAction(id: string): Promise<BrandActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!id) return { ok: false, error: BRAND_MESSAGES.notFound };
  if (!adminDbReady()) {
    return { ok: false, error: BRAND_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("brands")
      .select("id, slug, logo_url")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return { ok: false, error: BRAND_MESSAGES.notFound };
    }

    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) {
      return { ok: false, error: mapBrandDbError(error) };
    }

    await removeLogoIfManaged(existing.logo_url as string | null, existing.slug as string);
    revalidateBrandPaths(existing.slug as string);
    return { ok: true, message: BRAND_MESSAGES.deleteSuccess };
  } catch (error) {
    console.error("[admin] deleteAdminBrandAction exception:", error);
    return { ok: false, error: BRAND_MESSAGES.unavailable };
  }
}

export async function setAdminBrandActiveAction(
  id: string,
  isActive: boolean,
): Promise<BrandActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!id) return { ok: false, error: BRAND_MESSAGES.notFound };
  if (!adminDbReady()) {
    return { ok: false, error: BRAND_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brands")
      .update({ is_active: isActive })
      .eq("id", id)
      .select("id, slug")
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapBrandDbError(error) };
    }
    if (!data) {
      return { ok: false, error: BRAND_MESSAGES.notFound };
    }

    revalidateBrandPaths(data.slug as string);
    return {
      ok: true,
      message: isActive ? BRAND_MESSAGES.activateSuccess : BRAND_MESSAGES.deactivateSuccess,
    };
  } catch (error) {
    console.error("[admin] setAdminBrandActiveAction exception:", error);
    return { ok: false, error: BRAND_MESSAGES.unavailable };
  }
}
