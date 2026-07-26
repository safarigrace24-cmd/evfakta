"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  runAssistedEditorialFill,
  type AssistedEditorialResult,
} from "@/lib/admin/editorial-assist";

export type EditorialAssistActionResult =
  | (AssistedEditorialResult & { ok: true })
  | { ok: false; error: string };

export async function researchAndFillMissingFieldsAction(
  carId: string,
): Promise<EditorialAssistActionResult> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "Du har ikke tilgang til adminpanelet." };
  }

  if (!carId?.trim()) {
    return { ok: false, error: "Mangler bil-id." };
  }

  try {
    const result = await runAssistedEditorialFill({
      carId: carId.trim(),
      createdBy: user.id,
    });

    revalidatePath("/admin/biler");
    revalidatePath(`/admin/biler/${carId}/rediger`);
    revalidatePath("/admin/import/research");
    if (result.jobId) {
      revalidatePath(`/admin/import/research/${result.jobId}`);
    }

    if (!result.ok) {
      return { ok: false, error: result.error || "Assisted fill feilet." };
    }

    return { ...result, ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Uventet feil.",
    };
  }
}
