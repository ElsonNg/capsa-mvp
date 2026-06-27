"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function ownedAgentSpace(agentId: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  // RLS ensures the agent belongs to a space the user owns.
  const { data } = await supabase
    .from("agent_connections")
    .select("id, space_id")
    .eq("id", agentId)
    .maybeSingle();

  return data ? { supabase, spaceId: data.space_id as string } : null;
}

export async function revokeAgent(agentId: string): Promise<void> {
  const ctx = await ownedAgentSpace(agentId);
  if (!ctx) return;

  await ctx.supabase
    .from("agent_connections")
    .update({ status: "revoked" })
    .eq("id", agentId);

  revalidatePath(`/app/spaces/${ctx.spaceId}/agents`);
}

export async function deleteAgent(agentId: string): Promise<void> {
  const ctx = await ownedAgentSpace(agentId);
  if (!ctx) return;

  await ctx.supabase.from("agent_connections").delete().eq("id", agentId);

  revalidatePath(`/app/spaces/${ctx.spaceId}/agents`);
}
