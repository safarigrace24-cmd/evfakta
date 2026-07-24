import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth/get-user";
import { isAdminEmail } from "@/lib/auth/is-admin";

export async function requireAdminUser(nextPath = "/admin"): Promise<User> {
  const user = await getAuthUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!isAdminEmail(user.email)) {
    redirect("/min-side");
  }

  return user;
}

export async function getIsAdmin(): Promise<boolean> {
  const user = await getAuthUser();
  return isAdminEmail(user?.email);
}
