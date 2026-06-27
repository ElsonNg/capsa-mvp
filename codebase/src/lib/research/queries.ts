import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ResearchResult = {
  id: string;
  query: string;
  title: string;
  url: string;
  source: string | null;
  snippet: string | null;
  why_it_matters: string | null;
  created_at: string;
};

const RESEARCH_COLUMNS =
  "id, query, title, url, source, snippet, why_it_matters, created_at";

/**
 * Lists external research results for a space, newest first (RLS-scoped).
 */
export async function getResearchResultsForSpace(
  spaceId: string,
): Promise<ResearchResult[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("external_research_results")
    .select(RESEARCH_COLUMNS)
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as ResearchResult[];
}
