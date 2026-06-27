import { notFound } from "next/navigation";
import { getSpaceById } from "@/lib/spaces/queries";
import { SpaceIcon } from "@/app/app/components/SpaceIcon";
import { EditSpaceModal } from "@/app/app/components/EditSpaceModal";
import { DeleteSpaceModal } from "@/app/app/components/DeleteSpaceModal";
import { SpaceTabs } from "./SpaceTabs";

export default async function SpaceLayout({
  params,
  children,
}: {
  params: Promise<{ spaceId: string }>;
  children: React.ReactNode;
}) {
  const { spaceId } = await params;
  const space = await getSpaceById(spaceId);

  if (!space) {
    notFound();
  }

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

      <SpaceTabs spaceId={space.id} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
