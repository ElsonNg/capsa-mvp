import { getSupabaseServerClient } from "@/lib/supabase/server";

export type SpaceHealthStatus = "healthy" | "degraded" | "needs_review";

export type DocumentHealthStatus =
  | "healthy"
  | "conflict"
  | "needs_review"
  | "quarantined";

export type Space = {
  id: string;
  name: string;
  purpose: string | null;
  icon: string | null;
  health_status: SpaceHealthStatus;
  created_at: string;
};

export type SpaceStats = {
  total: number;
  healthy: number;
  conflict: number;
  needs_review: number;
  quarantined: number;
};

export type SpaceWithStats = Space & { stats: SpaceStats };

function emptyStats(): SpaceStats {
  return { total: 0, healthy: 0, conflict: 0, needs_review: 0, quarantined: 0 };
}

const SPACE_COLUMNS = "id, name, purpose, icon, health_status, created_at";

/**
 * Lists the signed-in user's spaces (RLS scopes rows to the owner).
 * Used by the sidebar. Returns an empty array when Supabase is not configured.
 */
export async function getSpacesForCurrentUser(): Promise<Space[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("spaces")
    .select(SPACE_COLUMNS)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Space[];
}

/**
 * Counts documents per space by their health status, in a single query.
 */
async function getStatsBySpaceId(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  spaceIds: string[],
): Promise<Map<string, SpaceStats>> {
  const statsBySpace = new Map<string, SpaceStats>();

  if (spaceIds.length === 0) {
    return statsBySpace;
  }

  const { data, error } = await supabase
    .from("documents")
    .select("space_id, health_status")
    .in("space_id", spaceIds);

  if (error || !data) {
    return statsBySpace;
  }

  for (const row of data as {
    space_id: string;
    health_status: DocumentHealthStatus;
  }[]) {
    const stats = statsBySpace.get(row.space_id) ?? emptyStats();
    stats.total += 1;
    stats[row.health_status] += 1;
    statsBySpace.set(row.space_id, stats);
  }

  return statsBySpace;
}

/**
 * Lists the user's spaces with per-space document counts. Used by the overview.
 */
export async function getSpacesWithStats(): Promise<SpaceWithStats[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("spaces")
    .select(SPACE_COLUMNS)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  const spaces = data as Space[];
  const statsBySpace = await getStatsBySpaceId(
    supabase,
    spaces.map((space) => space.id),
  );

  return spaces.map((space) => ({
    ...space,
    stats: statsBySpace.get(space.id) ?? emptyStats(),
  }));
}

/**
 * Loads a single space with its document counts. Returns null when the space
 * does not exist or is not accessible (RLS), so callers can render notFound().
 */
export async function getSpaceById(
  spaceId: string,
): Promise<SpaceWithStats | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("spaces")
    .select(SPACE_COLUMNS)
    .eq("id", spaceId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const space = data as Space;
  const statsBySpace = await getStatsBySpaceId(supabase, [space.id]);

  return { ...space, stats: statsBySpace.get(space.id) ?? emptyStats() };
}
