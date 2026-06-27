import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { runOpenAiScan, type ScanInputDocument } from "@/lib/scan/openai";

export const runtime = "nodejs";

type ScanRequest = { space_id?: string };

type DocRow = {
  id: string;
  title: string;
  authority_level: string;
  health_status: string;
  mime_type: string;
};

const AUTHORITY_RANK: Record<string, number> = {
  approved_policy: 0,
  current_document: 1,
  draft: 2,
  archived: 3,
};

// Higher precedence wins when a document is implicated in multiple conflicts.
const HEALTH_PRECEDENCE: Record<string, number> = {
  healthy: 0,
  needs_review: 1,
  conflict: 2,
  quarantined: 3,
};

function authorityRank(level: string) {
  return AUTHORITY_RANK[level] ?? 1;
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Workspace storage is not configured." },
      { status: 500 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ScanRequest;
  const spaceId = body.space_id?.trim();
  if (!spaceId) {
    return NextResponse.json({ error: "space_id is required." }, { status: 400 });
  }

  // RLS scopes this to the owner; null means not found / not accessible.
  const { data: space } = await supabase
    .from("spaces")
    .select("id")
    .eq("id", spaceId)
    .maybeSingle();
  if (!space) {
    return NextResponse.json({ error: "Space not found." }, { status: 404 });
  }

  const { data: docData } = await supabase
    .from("documents")
    .select("id, title, authority_level, health_status, mime_type")
    .eq("space_id", spaceId);
  const documents = (docData ?? []) as DocRow[];

  if (documents.length === 0) {
    return NextResponse.json(
      { error: "This space has no documents to scan." },
      { status: 400 },
    );
  }

  const docIds = documents.map((doc) => doc.id);
  const docsById = new Map(documents.map((doc) => [doc.id, doc]));

  // Build the text for each document from its chunks.
  const { data: chunkData } = await supabase
    .from("document_chunks")
    .select("document_id, chunk_index, content")
    .in("document_id", docIds)
    .order("chunk_index", { ascending: true });

  const textByDoc = new Map<string, string>();
  for (const chunk of (chunkData ?? []) as {
    document_id: string;
    content: string;
  }[]) {
    textByDoc.set(
      chunk.document_id,
      (textByDoc.get(chunk.document_id) ?? "") + chunk.content + "\n",
    );
  }

  const scanInput: ScanInputDocument[] = documents
    .filter((doc) => (textByDoc.get(doc.id) ?? "").trim().length > 0)
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      authority_level: doc.authority_level,
      text: textByDoc.get(doc.id) ?? "",
    }));

  if (scanInput.length === 0) {
    return NextResponse.json(
      {
        error:
          "No readable document text to scan yet. Imported PDFs need review before scanning.",
      },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await runOpenAiScan(scanInput);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Scan failed: ${error.message}`
            : "Scan failed.",
      },
      { status: 502 },
    );
  }

  // --- Reset prior scan state for this space ---
  await supabase.from("claims").delete().in("document_id", docIds);
  await supabase.from("quarantine_events").delete().eq("space_id", spaceId);
  await supabase.from("conflicts").delete().eq("space_id", spaceId);
  await supabase
    .from("documents")
    .update({ health_status: "healthy", quarantine_reason: null })
    .eq("space_id", spaceId)
    .in("health_status", ["conflict", "quarantined"]);

  // Baseline health after reset (PDFs stay needs_review).
  const finalHealth = new Map<string, { status: string; reason: string | null }>();
  for (const doc of documents) {
    const status =
      doc.health_status === "conflict" || doc.health_status === "quarantined"
        ? "healthy"
        : doc.health_status;
    finalHealth.set(doc.id, { status, reason: null });
  }

  function setHealth(docId: string, status: string, reason: string | null) {
    const current = finalHealth.get(docId);
    const currentRank = current ? HEALTH_PRECEDENCE[current.status] ?? 0 : 0;
    if ((HEALTH_PRECEDENCE[status] ?? 0) >= currentRank) {
      finalHealth.set(docId, { status, reason });
    }
  }

  // --- Persist claims ---
  let claimsExtracted = 0;
  const claimRows: Array<Record<string, unknown>> = [];
  for (const entry of result.documents) {
    if (!docsById.has(entry.document_id)) continue;
    for (const claim of entry.claims) {
      claimRows.push({
        document_id: entry.document_id,
        subject: claim.subject,
        predicate: claim.predicate,
        value: claim.value,
        unit: claim.unit,
        scope: claim.scope,
        evidence_text: claim.evidence_text,
      });
    }
  }
  if (claimRows.length > 0) {
    const { error } = await supabase.from("claims").insert(claimRows);
    if (!error) claimsExtracted = claimRows.length;
  }

  // --- Persist conflicts + auto-quarantine ---
  let quarantinedCount = 0;
  const conflictRows: Array<Record<string, unknown>> = [];
  const quarantineEvents: Array<Record<string, unknown>> = [];

  for (const conflict of result.conflicts) {
    const a = docsById.get(conflict.primary_document_id);
    const b = docsById.get(conflict.conflicting_document_id);
    if (!a || !b || a.id === b.id) continue;

    // Recompute authority so the more authoritative doc is always primary.
    const [source, stale] =
      authorityRank(a.authority_level) <= authorityRank(b.authority_level)
        ? [a, b]
        : [b, a];

    const differentAuthority =
      authorityRank(source.authority_level) !==
      authorityRank(stale.authority_level);
    const autoQuarantine = conflict.severity === "high" && differentAuthority;

    conflictRows.push({
      space_id: spaceId,
      primary_document_id: source.id,
      conflicting_document_id: stale.id,
      title: conflict.title,
      severity: conflict.severity,
      status: autoQuarantine ? "quarantined" : "open",
      explanation: conflict.explanation,
      recommended_action: conflict.recommended_action,
    });

    if (autoQuarantine) {
      setHealth(stale.id, "quarantined", conflict.recommended_action);
      quarantinedCount += 1;
      quarantineEvents.push({
        space_id: spaceId,
        document_id: stale.id,
        reason: conflict.explanation,
        actor: "capsa_auto",
      });
    } else {
      // Ambiguous or non-critical: flag for human review, never auto-quarantine.
      setHealth(stale.id, differentAuthority ? "conflict" : "needs_review", null);
    }
  }

  if (conflictRows.length > 0) {
    const { data: insertedConflicts } = await supabase
      .from("conflicts")
      .insert(conflictRows)
      .select("id, conflicting_document_id, status");

    // Link quarantine events to their conflict rows where possible.
    if (insertedConflicts && quarantineEvents.length > 0) {
      for (const event of quarantineEvents) {
        const match = insertedConflicts.find(
          (row) =>
            row.conflicting_document_id === event.document_id &&
            row.status === "quarantined",
        );
        if (match) event.conflict_id = match.id;
      }
    }
  }

  if (quarantineEvents.length > 0) {
    await supabase.from("quarantine_events").insert(quarantineEvents);
  }

  // --- Apply document health changes ---
  for (const doc of documents) {
    const final = finalHealth.get(doc.id);
    if (!final) continue;
    const changed =
      final.status !== doc.health_status ||
      (final.status === "quarantined" && final.reason !== null);
    if (changed) {
      await supabase
        .from("documents")
        .update({
          health_status: final.status,
          quarantine_reason:
            final.status === "quarantined" ? final.reason : null,
        })
        .eq("id", doc.id);
    }
  }

  // --- Roll up space health ---
  const statuses = Array.from(finalHealth.values()).map((f) => f.status);
  const spaceHealth = statuses.some(
    (s) => s === "quarantined" || s === "conflict",
  )
    ? "degraded"
    : statuses.some((s) => s === "needs_review")
      ? "needs_review"
      : "healthy";
  await supabase
    .from("spaces")
    .update({ health_status: spaceHealth })
    .eq("id", spaceId);

  return NextResponse.json({
    claims_extracted: claimsExtracted,
    conflicts_found: conflictRows.length,
    documents_quarantined: quarantinedCount,
    space_health: spaceHealth,
  });
}
