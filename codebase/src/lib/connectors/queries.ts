import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Whether the user has disconnected Google Drive at the app level. Used by the
 * Connectors page to show "Not connected" even when a Google token still works.
 */
export async function isGoogleDriveDisconnected(): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("google_drive_disconnected")
    .eq("id", user.id)
    .maybeSingle();

  return Boolean(data?.google_drive_disconnected);
}
