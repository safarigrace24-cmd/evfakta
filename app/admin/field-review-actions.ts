"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import { getAdminCarById } from "@/lib/admin/cars";
import {
  FIELD_REVIEW_DEFS,
  parseFieldReviewEditValue,
  type FieldReviewStatus,
  type FieldSourceMeta,
} from "@/lib/admin/field-review";
import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";

export type FieldReviewActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function dbReady() {
  return Boolean(getServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

async function assertAdmin() {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false as const, error: "Du har ikke tilgang til adminpanelet." };
  }
  return { ok: true as const, user };
}

function revalidateCar(carId: string) {
  revalidatePath("/admin/biler");
  revalidatePath(`/admin/biler/${carId}/rediger`);
}

function getDef(fieldKey: string) {
  return FIELD_REVIEW_DEFS.find((def) => def.key === fieldKey) ?? null;
}

async function patchFieldSource(
  carId: string,
  fieldKey: string,
  sourcePatch: Partial<FieldSourceMeta>,
  valuePatch?: Record<string, unknown>,
): Promise<FieldReviewActionResult> {
  const car = await getAdminCarById(carId);
  if (!car) return { ok: false, error: "Bilen ble ikke funnet." };

  const nowIso = new Date().toISOString();
  const previous = (car.field_sources as Record<string, FieldSourceMeta> | null) ?? {};
  const current = previous[fieldKey] ?? {};
  const field_sources = {
    ...previous,
    [fieldKey]: {
      ...current,
      source_name: current.source_name ?? car.source_name,
      source_url: current.source_url ?? car.source_url,
      imported_at: current.imported_at ?? nowIso,
      import_job_id: current.import_job_id ?? null,
      ...sourcePatch,
      data_last_checked_at: sourcePatch.data_last_checked_at ?? nowIso,
    },
  };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("cars")
    .update({
      ...(valuePatch ?? {}),
      field_sources,
      data_last_checked_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", carId);

  if (error) return { ok: false, error: error.message };
  revalidateCar(carId);
  return { ok: true, message: "Felt oppdatert." };
}

export async function setCarFieldReviewStatusAction(input: {
  carId: string;
  fieldKey: string;
  status: FieldReviewStatus;
}): Promise<FieldReviewActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: "Admin-databasen er utilgjengelig." };
  if (!getDef(input.fieldKey)) return { ok: false, error: "Ukjent felt." };

  const result = await patchFieldSource(input.carId, input.fieldKey, {
    review_status: input.status,
  });
  if (!result.ok) return result;

  if (input.status === "approved") {
    return { ok: true, message: "Felt godkjent." };
  }
  if (input.status === "rejected") {
    return { ok: true, message: "Felt avvist." };
  }
  return { ok: true, message: "Feltstatus oppdatert." };
}

export async function editCarFieldReviewAction(input: {
  carId: string;
  fieldKey: string;
  value: string;
}): Promise<FieldReviewActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!dbReady()) return { ok: false, error: "Admin-databasen er utilgjengelig." };

  const def = getDef(input.fieldKey);
  if (!def) return { ok: false, error: "Ukjent felt." };

  const parsed = parseFieldReviewEditValue(def.valueType, input.value);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const nowIso = new Date().toISOString();
  return patchFieldSource(
    input.carId,
    input.fieldKey,
    {
      review_status: "approved",
      confidence: 1,
      draft: false,
      notes: "Manually edited by editor",
      source_name: "Editor",
      data_last_checked_at: nowIso,
      retrieved_at: nowIso,
    },
    { [input.fieldKey]: parsed.value },
  );
}
