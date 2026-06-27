import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleDriveIcon } from "@hugeicons/core-free-icons";
import {
  getSpaceById,
  getDocumentsForSpace,
  getConflictsForSpace,
} from "@/lib/spaces/queries";
import { DocumentList } from "./DocumentList";
import { ConflictList } from "./ConflictList";
import { ScanButton } from "./ScanButton";

export default async function SpaceOverviewPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const space = await getSpaceById(spaceId);

  if (!space) {
    notFound();
  }

  const { stats } = space;
  const documents = await getDocumentsForSpace(space.id);
  const conflicts = await getConflictsForSpace(space.id);

  return (
    <div>
      <p className="text-sm text-[#5f666d]">
        {stats.total === 0
          ? "No documents yet"
          : `${stats.total} ${stats.total === 1 ? "document" : "documents"}`}
        {stats.conflict > 0 ? (
          <span className="text-[#a04100]"> · {stats.conflict} conflict</span>
        ) : null}
        {stats.quarantined > 0 ? (
          <span className="text-[#ba1a1a]">
            {" "}
            · {stats.quarantined} quarantined
          </span>
        ) : null}
      </p>

      <section className="mt-6 rounded-xl border border-[#e6e8ea] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#191c1e]">Documents</h2>
          <div className="flex items-center gap-2">
            <ScanButton spaceId={space.id} disabled={documents.length === 0} />
            <Link
              href={`/app/connectors?add=google-drive&spaceId=${space.id}`}
              className="inline-flex items-center gap-2 rounded-md bg-[#191c1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34393e]"
            >
              <HugeiconsIcon
                icon={GoogleDriveIcon}
                size={16}
                strokeWidth={1.8}
              />
              Import from Google Drive
            </Link>
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-[#5f666d]">
            No documents yet. Import from Google Drive to get started.
          </p>
        ) : (
          <DocumentList documents={documents} />
        )}
      </section>

      <section className="mt-4 rounded-xl border border-[#e6e8ea] bg-white p-5">
        <h2 className="text-base font-semibold text-[#191c1e]">Conflicts</h2>
        {conflicts.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-[#5f666d]">
            No conflicts found. Run a scan to check your documents for
            contradictions.
          </p>
        ) : (
          <div className="mt-4">
            <ConflictList conflicts={conflicts} />
          </div>
        )}
      </section>
    </div>
  );
}
