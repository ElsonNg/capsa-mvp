"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Disconnects Google Drive at the app level: records the intent on the profile
 * and removes the per-space Google Drive source links. Imported documents are
 * kept — disconnecting is not deleting data.
 */
export async function disconnectGoogleDrive(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ google_drive_disconnected: true })
    .eq("id", user.id);

  await supabase.from("sources").delete().eq("type", "google_drive");

  revalidatePath("/app/connectors");
}
