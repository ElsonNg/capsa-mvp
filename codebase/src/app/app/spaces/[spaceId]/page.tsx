import { notFound } from "next/navigation";
import { getSpaceById } from "@/lib/spaces/queries";
import { SpaceIcon } from "@/app/app/components/SpaceIcon";
import { EditSpaceModal } from "@/app/app/components/EditSpaceModal";
import { DeleteSpaceModal } from "@/app/app/components/DeleteSpaceModal";

export default async function SpaceDetailPage({
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
  const needsAttention = space.health_status !== "healthy";

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f6] text-[#191c1e]">
            <SpaceIcon iconKey={space.icon} size={24} />
          </span>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-[#191c1e]">
                {space.name}
              </h1>
              {needsAttention ? (
                <span className="rounded-full bg-[#fff0e8] px-3 py-1 text-sm font-semibold text-[#a04100]">
                  Needs review
                </span>
              ) : null}
            </div>
            {space.purpose ? (
              <p className="mt-2 max-w-2xl text-sm text-[#5f666d]">
                {space.purpose}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <EditSpaceModal space={space} />
          <DeleteSpaceModal spaceId={space.id} spaceName={space.name} />
        </div>
      </header>

      <p className="mt-6 text-sm text-[#5f666d]">
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

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <SectionCard
          title="Documents"
          body="No documents yet. Import from Google Drive to get started."
        />
        <SectionCard
          title="Conflicts"
          body="No conflicts found. Capsa flags contradictions between documents here."
        />
        <SectionCard
          title="Research"
          body="Bring in external policy and market context to compare against your documents."
        />
        <SectionCard
          title="Agents"
          body="Connect an agent to answer questions using only healthy documents."
        />
      </div>
    </div>
  );
}

function SectionCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border border-[#e6e8ea] bg-white p-5">
      <h2 className="text-base font-semibold text-[#191c1e]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5f666d]">{body}</p>
    </section>
  );
}
