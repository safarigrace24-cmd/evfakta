"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  VARIANT_MESSAGES,
  type AdminCarVariantInput,
} from "@/lib/admin/variant-types";
import {
  mapVariantDbError,
  validateAdminCarVariantInput,
} from "@/lib/admin/validate-variant";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type VariantActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string };

async function assertAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: VARIANT_MESSAGES.unauthorized };
  }
  return { ok: true };
}

function adminDbReady(): boolean {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

async function getCarSlug(carId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cars")
    .select("slug")
    .eq("id", carId)
    .maybeSingle();
  if (error || !data) return null;
  return data.slug as string;
}

function revalidateVariantPaths(carId: string, slug?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/biler");
  revalidatePath(`/admin/biler/${carId}/rediger`);
  revalidatePath("/modeller");
  if (slug) {
    revalidatePath(`/modeller/${slug}`);
  }
}

async function clearOtherDefaults(carId: string, exceptId?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("car_variants")
    .update({ is_default: false })
    .eq("car_id", carId)
    .eq("is_default", true);
  if (exceptId) {
    query = query.neq("id", exceptId);
  }
  await query;
}

async function nextSortOrder(carId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("car_variants")
    .select("sort_order")
    .eq("car_id", carId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const max = data?.[0]?.sort_order;
  return typeof max === "number" ? max + 1 : 0;
}

export async function createAdminCarVariantAction(
  carId: string,
  input: AdminCarVariantInput,
): Promise<VariantActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!carId) return { ok: false, error: VARIANT_MESSAGES.carNotFound };

  const validated = validateAdminCarVariantInput(input);
  if (!validated.ok) return validated;

  if (!adminDbReady()) {
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const slug = await getCarSlug(carId);
    if (!slug) return { ok: false, error: VARIANT_MESSAGES.carNotFound };

    const sortOrder = await nextSortOrder(carId);
    const makeDefault = validated.data.is_default;

    if (makeDefault) {
      await clearOtherDefaults(carId);
    }

    // First variant becomes default if none requested.
    let isDefault = makeDefault;
    if (!isDefault) {
      const { count } = await supabase
        .from("car_variants")
        .select("id", { count: "exact", head: true })
        .eq("car_id", carId);
      if ((count ?? 0) === 0) {
        isDefault = true;
      }
    }

    const { data, error } = await supabase
      .from("car_variants")
      .insert({
        ...validated.data,
        car_id: carId,
        is_default: isDefault,
        sort_order: sortOrder,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: mapVariantDbError(error) };
    }

    revalidateVariantPaths(carId, slug);
    return {
      ok: true,
      message: VARIANT_MESSAGES.createSuccess,
      id: data.id as string,
    };
  } catch (error) {
    console.error("[admin] createAdminCarVariantAction exception:", error);
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }
}

export async function updateAdminCarVariantAction(
  id: string,
  input: AdminCarVariantInput,
): Promise<VariantActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const validated = validateAdminCarVariantInput(input);
  if (!validated.ok) return validated;

  if (!adminDbReady()) {
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data: existing, error: loadError } = await supabase
      .from("car_variants")
      .select("id, car_id, is_default")
      .eq("id", id)
      .maybeSingle();

    if (loadError || !existing) {
      return { ok: false, error: VARIANT_MESSAGES.notFound };
    }

    const carId = existing.car_id as string;
    const slug = await getCarSlug(carId);

    if (validated.data.is_default) {
      await clearOtherDefaults(carId, id);
    } else if (existing.is_default && !validated.data.is_default) {
      // Keep at least one default: refuse clearing without promoting another.
      return {
        ok: false,
        error: "Sett en annen variant som standard før du fjerner standardflagget.",
      };
    }

    const { error } = await supabase
      .from("car_variants")
      .update(validated.data)
      .eq("id", id);

    if (error) {
      return { ok: false, error: mapVariantDbError(error) };
    }

    revalidateVariantPaths(carId, slug);
    return { ok: true, message: VARIANT_MESSAGES.updateSuccess };
  } catch (error) {
    console.error("[admin] updateAdminCarVariantAction exception:", error);
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }
}

export async function deleteAdminCarVariantAction(
  id: string,
): Promise<VariantActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!adminDbReady()) {
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data: existing, error: loadError } = await supabase
      .from("car_variants")
      .select("id, car_id, is_default")
      .eq("id", id)
      .maybeSingle();

    if (loadError || !existing) {
      return { ok: false, error: VARIANT_MESSAGES.notFound };
    }

    const carId = existing.car_id as string;
    const slug = await getCarSlug(carId);

    const { error } = await supabase.from("car_variants").delete().eq("id", id);
    if (error) {
      return { ok: false, error: mapVariantDbError(error) };
    }

    if (existing.is_default) {
      const { data: next } = await supabase
        .from("car_variants")
        .select("id")
        .eq("car_id", carId)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (next?.id) {
        await supabase
          .from("car_variants")
          .update({ is_default: true })
          .eq("id", next.id);
      }
    }

    revalidateVariantPaths(carId, slug);
    return { ok: true, message: VARIANT_MESSAGES.deleteSuccess };
  } catch (error) {
    console.error("[admin] deleteAdminCarVariantAction exception:", error);
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }
}

export async function setAdminCarVariantActiveAction(
  id: string,
  isActive: boolean,
): Promise<VariantActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!adminDbReady()) {
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data: existing, error: loadError } = await supabase
      .from("car_variants")
      .select("id, car_id")
      .eq("id", id)
      .maybeSingle();

    if (loadError || !existing) {
      return { ok: false, error: VARIANT_MESSAGES.notFound };
    }

    const { error } = await supabase
      .from("car_variants")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      return { ok: false, error: mapVariantDbError(error) };
    }

    const slug = await getCarSlug(existing.car_id as string);
    revalidateVariantPaths(existing.car_id as string, slug);
    return { ok: true, message: VARIANT_MESSAGES.updateSuccess };
  } catch (error) {
    console.error("[admin] setAdminCarVariantActiveAction exception:", error);
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }
}

export async function setAdminCarVariantDefaultAction(
  id: string,
): Promise<VariantActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!adminDbReady()) {
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const { data: existing, error: loadError } = await supabase
      .from("car_variants")
      .select("id, car_id")
      .eq("id", id)
      .maybeSingle();

    if (loadError || !existing) {
      return { ok: false, error: VARIANT_MESSAGES.notFound };
    }

    const carId = existing.car_id as string;
    await clearOtherDefaults(carId, id);
    const { error } = await supabase
      .from("car_variants")
      .update({ is_default: true, is_active: true })
      .eq("id", id);

    if (error) {
      return { ok: false, error: mapVariantDbError(error) };
    }

    const slug = await getCarSlug(carId);
    revalidateVariantPaths(carId, slug);
    return { ok: true, message: VARIANT_MESSAGES.updateSuccess };
  } catch (error) {
    console.error("[admin] setAdminCarVariantDefaultAction exception:", error);
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }
}

export async function reorderAdminCarVariantsAction(
  carId: string,
  orderedIds: string[],
): Promise<VariantActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!carId || orderedIds.length === 0) {
    return { ok: false, error: VARIANT_MESSAGES.genericError };
  }

  if (!adminDbReady()) {
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }

  try {
    const supabase = createAdminClient();
    const slug = await getCarSlug(carId);
    if (!slug) return { ok: false, error: VARIANT_MESSAGES.carNotFound };

    for (let index = 0; index < orderedIds.length; index += 1) {
      const id = orderedIds[index];
      const { error } = await supabase
        .from("car_variants")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("car_id", carId);
      if (error) {
        return { ok: false, error: mapVariantDbError(error) };
      }
    }

    revalidateVariantPaths(carId, slug);
    return { ok: true, message: VARIANT_MESSAGES.reorderSuccess };
  } catch (error) {
    console.error("[admin] reorderAdminCarVariantsAction exception:", error);
    return { ok: false, error: VARIANT_MESSAGES.unavailable };
  }
}
