"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Deletes all external research results for a space (RLS-scoped to the owner).
 */
export async function clearResearch(spaceId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return;

  await supabase
    .from("external_research_results")
    .delete()
    .eq("space_id", spaceId);

  revalidatePath(`/app/spaces/${spaceId}/research`);
}
