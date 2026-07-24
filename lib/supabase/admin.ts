import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the service role key.
 * Bypasses RLS for admin writes. Never import this from client components.
 */
export function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = getServiceRoleKey();

  if (!url || !key) {
    throw new Error(
      "Admin-database er ikke konfigurert. Sett NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
