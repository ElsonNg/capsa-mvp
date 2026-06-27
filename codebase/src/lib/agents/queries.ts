import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AgentConnectionStatus = "active" | "revoked";

export type AgentConnection = {
  id: string;
  agent_name: string;
  purpose: string | null;
  status: AgentConnectionStatus;
  created_at: string;
};

export type AgentQueryLog = {
  id: string;
  question: string;
  answer: string;
  source_count: number;
  blocked_count: number;
  created_at: string;
};

/**
 * Lists a space's agent connections (RLS-scoped). Never selects the key hash.
 */
export async function getAgentsForSpace(
  spaceId: string,
): Promise<AgentConnection[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("agent_connections")
    .select("id, agent_name, purpose, status, created_at")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as AgentConnection[];
}

/**
 * Lists recent agent queries for a space (RLS-scoped), newest first.
 */
export async function getRecentAgentQueryLogs(
  spaceId: string,
  limit = 10,
): Promise<AgentQueryLog[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("agent_query_logs")
    .select(
      "id, question, answer, source_document_ids, blocked_document_ids, created_at",
    )
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (
    data as {
      id: string;
      question: string;
      answer: string;
      source_document_ids: string[];
      blocked_document_ids: string[];
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    source_count: row.source_document_ids?.length ?? 0,
    blocked_count: row.blocked_document_ids?.length ?? 0,
    created_at: row.created_at,
  }));
}
