"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import { ADMIN_MESSAGES, type AdminCarInput } from "@/lib/admin/types";
import { mapAdminDbError, validateAdminCarInput } from "@/lib/admin/validate";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type AdminActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string };

async function assertAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: ADMIN_MESSAGES.unauthorized };
  }
  if (!isAdminEmail(user.email)) {
    return { ok: false, error: ADMIN_MESSAGES.unauthorized };
  }
  return { ok: true };
}

function adminDbReady(): boolean {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function revalidateAdminPaths(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/biler");
  if (slug) {
    revalidatePath(`/modeller/${slug}`);
  }
}

export async function createAdminCarAction(
  input: AdminCarInput,
): Promise<AdminActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const validated = validateAdminCarInput(input);
  if (!validated.ok) return validated;

  if (!adminDbReady()) {
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    // Manual/admin creates stay unpublished unless explicitly checked;
    // imported cars should also arrive with is_published=false + draft/needs_review.
    const { data, error } = await supabase
      .from("cars")
      .insert({
        ...validated.data,
        import_status: validated.data.import_status || "draft",
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: mapAdminDbError(error) };
    }

    revalidateAdminPaths(validated.data.slug);
    return {
      ok: true,
      message: ADMIN_MESSAGES.createSuccess,
      id: data.id as string,
    };
  } catch (error) {
    console.error("[admin] createAdminCarAction exception:", error);
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }
}

export async function updateAdminCarAction(
  id: string,
  input: AdminCarInput,
): Promise<AdminActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!id) {
    return { ok: false, error: ADMIN_MESSAGES.notFound };
  }

  const validated = validateAdminCarInput(input);
  if (!validated.ok) return validated;

  if (!adminDbReady()) {
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cars")
      .update(validated.data)
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapAdminDbError(error) };
    }

    if (!data) {
      return { ok: false, error: ADMIN_MESSAGES.notFound };
    }

    revalidateAdminPaths(validated.data.slug);
    return { ok: true, message: ADMIN_MESSAGES.updateSuccess, id };
  } catch (error) {
    console.error("[admin] updateAdminCarAction exception:", error);
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }
}

export async function setAdminCarPublishedAction(
  id: string,
  isPublished: boolean,
): Promise<AdminActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!id) {
    return { ok: false, error: ADMIN_MESSAGES.notFound };
  }

  if (!adminDbReady()) {
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cars")
      .update({ is_published: isPublished })
      .eq("id", id)
      .select("id, slug")
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapAdminDbError(error) };
    }

    if (!data) {
      return { ok: false, error: ADMIN_MESSAGES.notFound };
    }

    revalidateAdminPaths(data.slug as string);
    return {
      ok: true,
      message: isPublished
        ? ADMIN_MESSAGES.publishSuccess
        : ADMIN_MESSAGES.unpublishSuccess,
      id,
    };
  } catch (error) {
    console.error("[admin] setAdminCarPublishedAction exception:", error);
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }
}

async function setAdminCarImportStatusAction(
  id: string,
  importStatus: "draft" | "needs_review" | "approved",
  successMessage: string,
): Promise<AdminActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!id) {
    return { ok: false, error: ADMIN_MESSAGES.notFound };
  }

  if (!adminDbReady()) {
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    // Approval must never publish — only import_status changes here.
    const { data, error } = await supabase
      .from("cars")
      .update({ import_status: importStatus })
      .eq("id", id)
      .select("id, slug")
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapAdminDbError(error) };
    }

    if (!data) {
      return { ok: false, error: ADMIN_MESSAGES.notFound };
    }

    revalidateAdminPaths(data.slug as string);
    return { ok: true, message: successMessage, id };
  } catch (error) {
    console.error("[admin] setAdminCarImportStatusAction exception:", error);
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }
}

/** Mark car for manual review. Does not publish. */
export async function markAdminCarNeedsReviewAction(
  id: string,
): Promise<AdminActionResult> {
  return setAdminCarImportStatusAction(
    id,
    "needs_review",
    ADMIN_MESSAGES.needsReviewSuccess,
  );
}

/** Approve car data after review. Does not publish. */
export async function approveAdminCarAction(id: string): Promise<AdminActionResult> {
  return setAdminCarImportStatusAction(id, "approved", ADMIN_MESSAGES.approveSuccess);
}

/** Publish to public site. Separate from approval. */
export async function publishAdminCarAction(id: string): Promise<AdminActionResult> {
  return setAdminCarPublishedAction(id, true);
}

export async function deleteAdminCarAction(id: string): Promise<AdminActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!id) {
    return { ok: false, error: ADMIN_MESSAGES.notFound };
  }

  if (!adminDbReady()) {
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("cars")
      .select("id, slug")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return { ok: false, error: mapAdminDbError(fetchError) };
    }

    if (!existing) {
      return { ok: false, error: ADMIN_MESSAGES.notFound };
    }

    const { error } = await supabase.from("cars").delete().eq("id", id);

    if (error) {
      return { ok: false, error: mapAdminDbError(error) };
    }

    revalidateAdminPaths(existing.slug as string);
    return { ok: true, message: ADMIN_MESSAGES.deleteSuccess, id };
  } catch (error) {
    console.error("[admin] deleteAdminCarAction exception:", error);
    return { ok: false, error: ADMIN_MESSAGES.unavailable };
  }
}
