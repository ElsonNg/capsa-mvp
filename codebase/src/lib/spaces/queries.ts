import { getSupabaseServerClient } from "@/lib/supabase/server";

export type SpaceHealthStatus = "healthy" | "degraded" | "needs_review";

export type DocumentHealthStatus =
  | "healthy"
  | "conflict"
  | "needs_review"
  | "quarantined";

export type DocumentAuthorityLevel =
  | "approved_policy"
  | "current_document"
  | "draft"
  | "archived";

export type SpaceDocument = {
  id: string;
  title: string;
  mime_type: string;
  source_url: string | null;
  modified_at: string | null;
  health_status: DocumentHealthStatus;
  authority_level: DocumentAuthorityLevel;
  quarantine_reason: string | null;
  created_at: string;
};

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

export type ConflictSeverity = "low" | "medium" | "high";
export type ConflictStatus = "open" | "quarantined" | "resolved";

export type SpaceConflict = {
  id: string;
  title: string;
  severity: ConflictSeverity;
  status: ConflictStatus;
  explanation: string;
  recommended_action: string;
  primary_document_id: string | null;
  conflicting_document_id: string | null;
  primary_document_title: string | null;
  conflicting_document_title: string | null;
  created_at: string;
};

const DOCUMENT_COLUMNS =
  "id, title, mime_type, source_url, modified_at, health_status, authority_level, quarantine_reason, created_at";

/**
 * Lists the documents in a space, newest first (RLS scopes to the owner).
 */
export async function getDocumentsForSpace(
  spaceId: string,
): Promise<SpaceDocument[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_COLUMNS)
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as SpaceDocument[];
}

/**
 * Lists the conflicts detected in a space, newest first, with the titles of the
 * primary (authoritative) and conflicting documents resolved.
 */
export async function getConflictsForSpace(
  spaceId: string,
): Promise<SpaceConflict[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("conflicts")
    .select(
      "id, title, severity, status, explanation, recommended_action, primary_document_id, conflicting_document_id, created_at, primary:documents!primary_document_id(title), conflicting:documents!conflicting_document_id(title)",
    )
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as RawConflictRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    severity: row.severity,
    status: row.status,
    explanation: row.explanation,
    recommended_action: row.recommended_action,
    primary_document_id: row.primary_document_id,
    conflicting_document_id: row.conflicting_document_id,
    primary_document_title: row.primary?.title ?? null,
    conflicting_document_title: row.conflicting?.title ?? null,
    created_at: row.created_at,
  }));
}

type RawConflictRow = {
  id: string;
  title: string;
  severity: ConflictSeverity;
  status: ConflictStatus;
  explanation: string;
  recommended_action: string;
  primary_document_id: string | null;
  conflicting_document_id: string | null;
  created_at: string;
  primary: { title: string } | null;
  conflicting: { title: string } | null;
};
