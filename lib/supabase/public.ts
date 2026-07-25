import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Cookie-free anon client for static/public generation (sitemap, etc.). */
export function createPublicClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createClient(env.url, env.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
