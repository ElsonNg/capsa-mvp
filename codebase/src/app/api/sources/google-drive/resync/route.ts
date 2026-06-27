import { NextResponse } from "next/server";
import {
  getAuthenticatedGoogleDriveContext,
  getGoogleDriveFileMetadata,
  GoogleDriveConnectorError,
  importGoogleDriveFileText,
} from "@/lib/google-drive/server";

export const runtime = "nodejs";

type DocRow = {
  id: string;
  space_id: string;
  google_file_id: string | null;
};

export async function POST() {
  try {
    const { supabase, googleAccessToken } =
      await getAuthenticatedGoogleDriveContext();

    const { data: docData } = await supabase
      .from("documents")
      .select("id, space_id, google_file_id")
      .not("google_file_id", "is", null);

    const documents = (docData ?? []) as DocRow[];

    let updated = 0;
    let removed = 0;
    let failed = 0;
    const touchedSpaces = new Set<string>();

    for (const doc of documents) {
      if (!doc.google_file_id) continue;
      touchedSpaces.add(doc.space_id);

      try {
        const file = await getGoogleDriveFileMetadata(
          googleAccessToken,
          doc.google_file_id,
        );

        if (file.trashed) {
          await supabase.from("documents").delete().eq("id", doc.id);
          removed += 1;
          continue;
        }

        // Refresh metadata and re-pull text so chunks reflect current content.
        const importResult = await importGoogleDriveFileText(
          googleAccessToken,
          file,
        );
        await supabase
          .from("documents")
          .update({
            title: file.name,
            modified_at: file.modifiedTime ?? null,
            source_url: file.webViewLink ?? null,
          })
          .eq("id", doc.id);

        const chunks = chunkDocumentText(importResult.text);
        if (chunks.length > 0) {
          await replaceDocumentChunks(supabase, doc.id, chunks);
        }
        updated += 1;
      } catch (error) {
        if (error instanceof GoogleDriveConnectorError) {
          if (error.code === "reconnect_required") {
            return NextResponse.json(
              { code: error.code, error: error.message },
              { status: error.status },
            );
          }
          // A missing file (404) means it was deleted from Drive.
          if (error.code === "drive_request_failed" && error.status === 404) {
            await supabase.from("documents").delete().eq("id", doc.id);
            removed += 1;
            continue;
          }
        }
        failed += 1;
      }
    }

    if (touchedSpaces.size > 0) {
      await supabase
        .from("sources")
        .update({ status: "connected", last_sync_at: new Date().toISOString() })
        .eq("type", "google_drive");
    }

    return NextResponse.json({ updated, removed, failed });
  } catch (error) {
    if (error instanceof GoogleDriveConnectorError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { code: "resync_failed", error: "Google Drive resync failed." },
      { status: 500 },
    );
  }
}

type ResyncSupabase = Awaited<
  ReturnType<typeof getAuthenticatedGoogleDriveContext>
>["supabase"];

async function replaceDocumentChunks(
  supabase: ResyncSupabase,
  documentId: string,
  chunks: string[],
) {
  await supabase.from("document_chunks").delete().eq("document_id", documentId);
  await supabase.from("document_chunks").insert(
    chunks.map((content, chunkIndex) => ({
      document_id: documentId,
      chunk_index: chunkIndex,
      content,
    })),
  );
}

function chunkDocumentText(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  const maxChunkLength = 3500;
  for (let index = 0; index < normalized.length; index += maxChunkLength) {
    chunks.push(normalized.slice(index, index + maxChunkLength));
  }
  return chunks;
}
