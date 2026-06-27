import { notFound } from "next/navigation";
import { getSpaceById } from "@/lib/spaces/queries";
import {
  getAgentsForSpace,
  getRecentAgentQueryLogs,
} from "@/lib/agents/queries";
import { CreateAgentModal } from "./CreateAgentModal";
import { AgentsList } from "./AgentsList";
import { AgentTestPanel } from "./AgentTestPanel";

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AgentsTabPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const space = await getSpaceById(spaceId);

  if (!space) {
    notFound();
  }

  const agents = await getAgentsForSpace(space.id);
  const logs = await getRecentAgentQueryLogs(space.id);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#e6e8ea] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#191c1e]">
              Allowed agents
            </h2>
            <p className="mt-1 text-sm text-[#5f666d]">
              Agents read only healthy documents — quarantined content is never
              used.
            </p>
          </div>
          <CreateAgentModal spaceId={space.id} />
        </div>

        {agents.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-[#5f666d]">
            No agents yet. Create one to get an API key for safe document search.
          </p>
        ) : (
          <div className="mt-4">
            <AgentsList agents={agents} />
          </div>
        )}
      </section>

      <AgentTestPanel />

      <section className="rounded-xl border border-[#e6e8ea] bg-white p-5">
        <h2 className="text-base font-semibold text-[#191c1e]">
          Recent queries
        </h2>
        {logs.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-[#5f666d]">
            No agent queries yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#eef0f2] rounded-lg border border-[#e6e8ea]">
            {logs.map((log) => (
              <li key={log.id} className="px-4 py-3">
                <p className="text-sm font-medium text-[#191c1e]">
                  {log.question}
                </p>
                <p className="mt-0.5 text-xs text-[#9aa0a6]">
                  {log.source_count} source
                  {log.source_count === 1 ? "" : "s"} · {log.blocked_count}{" "}
                  blocked · {formatDateTime(log.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
