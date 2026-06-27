import { notFound } from "next/navigation";
import { getSpaceById } from "@/lib/spaces/queries";
import { getResearchResultsForSpace } from "@/lib/research/queries";
import { ResearchPanel } from "./ResearchPanel";

export default async function ResearchTabPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const space = await getSpaceById(spaceId);

  if (!space) {
    notFound();
  }

  const results = await getResearchResultsForSpace(space.id);

  return <ResearchPanel spaceId={space.id} results={results} />;
}
