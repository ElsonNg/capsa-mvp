import Link from "next/link";
import { getSpacesWithStats, type SpaceWithStats } from "@/lib/spaces/queries";
import { CreateSpaceModal } from "./components/CreateSpaceModal";
import { SpaceIcon } from "./components/SpaceIcon";

export default async function SpacesOverviewPage() {
  const spaces = await getSpacesWithStats();

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#191c1e]">Spaces</h1>
          <p className="mt-2 text-sm text-[#5f666d]">
            Each space groups related documents that Capsa monitors together.
          </p>
        </div>
        {spaces.length > 0 ? <CreateSpaceModal /> : null}
      </div>

      {spaces.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-xl border border-[#e6e8ea] bg-white p-10 text-center">
      <h2 className="text-lg font-semibold text-[#191c1e]">
        Create your first space
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#5f666d]">
        Start by creating a space for a set of documents — for example your
        support policies — then import documents into it.
      </p>
      <div className="mt-6 flex justify-center">
        <CreateSpaceModal />
      </div>
    </div>
  );
}

function SpaceCard({ space }: { space: SpaceWithStats }) {
  const { stats } = space;
  const needsAttention = space.health_status !== "healthy";

  return (
    <Link
      href={`/app/spaces/${space.id}`}
      className="group flex flex-col rounded-xl border border-[#e6e8ea] bg-white p-5 transition hover:border-[#d4d8dc] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f6] text-[#191c1e]">
            <SpaceIcon iconKey={space.icon} size={20} />
          </span>
          <h2 className="text-lg font-semibold text-[#191c1e] group-hover:text-[#000]">
            {space.name}
          </h2>
        </div>
        {needsAttention ? (
          <span className="shrink-0 rounded-full bg-[#fff0e8] px-2.5 py-0.5 text-xs font-semibold text-[#a04100]">
            Needs review
          </span>
        ) : null}
      </div>

      {space.purpose ? (
        <p className="mt-2 line-clamp-2 text-sm text-[#5f666d]">
          {space.purpose}
        </p>
      ) : null}

      <p className="mt-4 text-sm text-[#5f666d]">
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
    </Link>
  );
}
