"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Robot01Icon } from "@hugeicons/core-free-icons";
import type { AgentConnection } from "@/lib/agents/queries";
import { revokeAgent } from "./actions";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AgentRow({ agent }: { agent: AgentConnection }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function revoke() {
    startTransition(async () => {
      await revokeAgent(agent.id);
      setConfirming(false);
      router.refresh();
    });
  }

  const revoked = agent.status === "revoked";

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <HugeiconsIcon
        icon={Robot01Icon}
        size={20}
        strokeWidth={1.8}
        className={`shrink-0 ${revoked ? "text-[#c2c7cc]" : "text-[#5f666d]"}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-sm font-semibold ${
              revoked ? "text-[#9aa0a6]" : "text-[#191c1e]"
            }`}
          >
            {agent.agent_name}
          </span>
          {revoked ? (
            <span className="shrink-0 rounded-full bg-[#f2f4f6] px-2 py-0.5 text-xs font-semibold text-[#9aa0a6]">
              Revoked
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-[#9aa0a6]">
          {agent.purpose ? `${agent.purpose} · ` : ""}
          Added {formatDate(agent.created_at)}
        </p>
      </div>

      {!revoked ? (
        confirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-sm font-semibold text-[#5f666d] transition hover:text-[#191c1e]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={revoke}
              disabled={pending}
              className="text-sm font-semibold text-[#ba1a1a] transition hover:text-[#9a1414] disabled:opacity-60"
            >
              {pending ? "Revoking…" : "Confirm"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 text-sm font-semibold text-[#5f666d] transition hover:text-[#ba1a1a]"
          >
            Revoke
          </button>
        )
      ) : null}
    </li>
  );
}

export function AgentsList({ agents }: { agents: AgentConnection[] }) {
  return (
    <ul className="divide-y divide-[#eef0f2] rounded-lg border border-[#e6e8ea]">
      {agents.map((agent) => (
        <AgentRow key={agent.id} agent={agent} />
      ))}
    </ul>
  );
}
