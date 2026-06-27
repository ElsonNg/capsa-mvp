import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * A service-role Supabase client that bypasses RLS. Use ONLY in trusted
 * server contexts that authenticate the caller themselves — specifically the
 * agent search endpoint, which is authenticated by an API key rather than a
 * Supabase user session. Never expose this client to the browser.
 */
export function getSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    return null;
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
