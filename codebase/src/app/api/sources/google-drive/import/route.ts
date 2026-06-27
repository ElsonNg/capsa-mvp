import { NextResponse } from "next/server";
import {
  getAuthenticatedGoogleDriveContext,
  getGoogleDriveFileMetadata,
  GoogleDriveConnectorError,
  importGoogleDriveFileText,
} from "@/lib/google-drive/server";
import type { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ImportRequest = {
  space_id?: string;
  file_ids?: string[];
};

type ImportedDocument = {
  id: string;
  google_file_id: string;
  title: string;
  health_status: "healthy" | "needs_review";
  authority_level: "approved_policy" | "current_document" | "draft";
  chunks_created: number;
  import_error?: string;
};

const SUPPORT_SPACE = {
  name: "Support",
  purpose: "Support policies and customer-facing operational knowledge.",
};

export async function POST(request: Request) {
  let sourceId: string | null = null;
  let supabaseClient: Awaited<ReturnType<typeof getSupabaseServerClient>> = null;

  try {
    const body = (await request.json().catch(() => ({}))) as ImportRequest;
    const fileIds = normalizeFileIds(body.file_ids);

    if (fileIds.length === 0) {
      return NextResponse.json(
        { error: "file_ids must include at least one Google Drive file ID." },
        { status: 400 },
      );
    }

    const { supabase, user, googleAccessToken } =
      await getAuthenticatedGoogleDriveContext();
    supabaseClient = supabase;
    const spaceId = body.space_id
      ? await verifySpaceAccess(supabase, body.space_id)
      : await getOrCreateSupportSpace(supabase, user.id);
    const source = await upsertGoogleDriveSource(supabase, spaceId, "syncing");
    sourceId = source.id;

    const imported: ImportedDocument[] = [];
    const importErrors: Array<{ file_id: string; error: string }> = [];

    for (const fileId of fileIds) {
      try {
        const file = await getGoogleDriveFileMetadata(
          googleAccessToken,
          fileId,
        );
        const importResult = await importGoogleDriveFileText(
          googleAccessToken,
          file,
        );
        const chunks = chunkDocumentText(importResult.text);
        const healthStatus = importResult.needsReviewReason
          ? "needs_review"
          : "healthy";
        const document = await upsertImportedDocument(supabase, {
          spaceId,
          sourceId: source.id,
          file,
          healthStatus,
          quarantineReason: importResult.needsReviewReason,
        });

        await replaceDocumentChunks(supabase, document.id, chunks);

        imported.push({
          id: document.id,
          google_file_id: file.id,
          title: file.name,
          health_status: healthStatus,
          authority_level: inferAuthorityLevel(file.name),
          chunks_created: chunks.length,
          ...(importResult.needsReviewReason
            ? { import_error: importResult.needsReviewReason }
            : {}),
        });
      } catch (error) {
        if (
          error instanceof GoogleDriveConnectorError &&
          error.code === "reconnect_required"
        ) {
          throw error;
        }

        const message =
          error instanceof Error ? error.message : "Import failed.";
        importErrors.push({ file_id: fileId, error: message });
      }
    }

    await updateGoogleDriveSourceStatus(
      supabase,
      source.id,
      importErrors.length === fileIds.length ? "failed" : "connected",
    );

    return NextResponse.json({
      space_id: spaceId,
      source_id: source.id,
      documents_imported: imported.length,
      documents_needing_review: imported.filter(
        (document) => document.health_status === "needs_review",
      ).length,
      documents: imported,
      import_errors: importErrors,
    });
  } catch (error) {
    if (sourceId && supabaseClient) {
      await updateGoogleDriveSourceStatus(supabaseClient, sourceId, "failed");
    }

    if (error instanceof GoogleDriveConnectorError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { code: "import_failed", error: "Google Drive import failed." },
      { status: 500 },
    );
  }
}

function normalizeFileIds(fileIds: ImportRequest["file_ids"]) {
  if (!Array.isArray(fileIds)) {
    return [];
  }

  return Array.from(
    new Set(
      fileIds
        .filter((fileId): fileId is string => typeof fileId === "string")
        .map((fileId) => fileId.trim())
        .filter(Boolean),
    ),
  );
}

async function verifySpaceAccess(
  supabase: Awaited<
    ReturnType<typeof getAuthenticatedGoogleDriveContext>
  >["supabase"],
  spaceId: string,
) {
  const { data, error } = await supabase
    .from("spaces")
    .select("id")
    .eq("id", spaceId)
    .single();

  if (error || !data) {
    throw new GoogleDriveConnectorError(
      "drive_request_failed",
      "Space was not found or is not accessible.",
      404,
    );
  }

  return data.id as string;
}

async function getOrCreateSupportSpace(
  supabase: Awaited<
    ReturnType<typeof getAuthenticatedGoogleDriveContext>
  >["supabase"],
  ownerId: string,
) {
  const { data, error } = await supabase
    .from("spaces")
    .upsert(
      {
        owner_id: ownerId,
        name: SUPPORT_SPACE.name,
        purpose: SUPPORT_SPACE.purpose,
        health_status: "healthy",
      },
      { onConflict: "owner_id,name" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new GoogleDriveConnectorError(
      "drive_request_failed",
      "Could not create Support space.",
      500,
    );
  }

  return data.id as string;
}

async function upsertGoogleDriveSource(
  supabase: Awaited<
    ReturnType<typeof getAuthenticatedGoogleDriveContext>
  >["supabase"],
  spaceId: string,
  status: "connected" | "syncing" | "failed",
) {
  const { data, error } = await supabase
    .from("sources")
    .upsert(
      {
        space_id: spaceId,
        type: "google_drive",
        name: "Google Drive",
        status,
        last_sync_at: new Date().toISOString(),
      },
      { onConflict: "space_id,type" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new GoogleDriveConnectorError(
      "drive_request_failed",
      "Could not update Google Drive source.",
      500,
    );
  }

  return { id: data.id as string };
}

async function updateGoogleDriveSourceStatus(
  supabase: Awaited<
    ReturnType<typeof getAuthenticatedGoogleDriveContext>
  >["supabase"],
  sourceId: string,
  status: "connected" | "syncing" | "failed",
) {
  await supabase
    .from("sources")
    .update({ status, last_sync_at: new Date().toISOString() })
    .eq("id", sourceId);
}

async function upsertImportedDocument(
  supabase: Awaited<
    ReturnType<typeof getAuthenticatedGoogleDriveContext>
  >["supabase"],
  {
    spaceId,
    sourceId,
    file,
    healthStatus,
    quarantineReason,
  }: {
    spaceId: string;
    sourceId: string;
    file: {
      id: string;
      name: string;
      mimeType: string;
      modifiedTime?: string;
      webViewLink?: string;
    };
    healthStatus: "healthy" | "needs_review";
    quarantineReason: string | null;
  },
) {
  const { data, error } = await supabase
    .from("documents")
    .upsert(
      {
        space_id: spaceId,
        source_id: sourceId,
        google_file_id: file.id,
        title: file.name,
        mime_type: file.mimeType,
        source_url: file.webViewLink ?? null,
        modified_at: file.modifiedTime ?? null,
        health_status: healthStatus,
        authority_level: inferAuthorityLevel(file.name),
        quarantine_reason: quarantineReason,
      },
      { onConflict: "space_id,google_file_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new GoogleDriveConnectorError(
      "drive_request_failed",
      "Could not store imported document.",
      500,
    );
  }

  return { id: data.id as string };
}

async function replaceDocumentChunks(
  supabase: Awaited<
    ReturnType<typeof getAuthenticatedGoogleDriveContext>
  >["supabase"],
  documentId: string,
  chunks: string[],
) {
  await supabase.from("document_chunks").delete().eq("document_id", documentId);

  if (chunks.length === 0) {
    return;
  }

  const { error } = await supabase.from("document_chunks").insert(
    chunks.map((content, chunkIndex) => ({
      document_id: documentId,
      chunk_index: chunkIndex,
      content,
    })),
  );

  if (error) {
    throw new GoogleDriveConnectorError(
      "drive_request_failed",
      "Could not store document chunks.",
      500,
    );
  }
}

function chunkDocumentText(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  const maxChunkLength = 3500;

  for (let index = 0; index < normalized.length; index += maxChunkLength) {
    chunks.push(normalized.slice(index, index + maxChunkLength));
  }

  return chunks;
}

function inferAuthorityLevel(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("approved")) {
    return "approved_policy";
  }

  if (normalized.includes("draft")) {
    return "draft";
  }

  return "current_document";
}
