import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, hasSupabaseConfig } from "./env";

export function hasSupabaseBrowserEnv() {
  return hasSupabaseConfig();
}

export function createSupabaseBrowserClient() {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  const publishableKey = getSupabasePublishableKey();

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey!,
  );
}
