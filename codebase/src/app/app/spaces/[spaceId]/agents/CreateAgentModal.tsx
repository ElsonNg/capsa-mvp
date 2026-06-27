"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Copy01Icon,
  Tick02Icon,
  Key01Icon,
} from "@hugeicons/core-free-icons";

type CreatedAgent = {
  agent_name: string;
  api_key: string;
  search_url: string;
  curl: string;
};

export function CreateAgentModal({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [created, setCreated] = useState<CreatedAgent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function openModal() {
    setName("");
    setPurpose("");
    setCreated(null);
    setError(null);
    setCopied(false);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    if (created) router.refresh();
  }

  function submit() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            space_id: spaceId,
            agent_name: name.trim(),
            purpose: purpose.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Could not create the agent.");
          return;
        }
        setCreated(json as CreatedAgent);
      } catch {
        setError("Could not create the agent.");
      }
    });
  }

  function copyKey() {
    if (!created) return;
    navigator.clipboard.writeText(created.api_key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-md bg-[#191c1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34393e]"
      >
        <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
        Create agent
      </button>

      {open ? (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/30 px-4"
          onClick={closeModal}
        >
          <div
            className="animate-pop-in w-full max-w-lg rounded-xl border border-[#e6e8ea] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            {created ? (
              <div>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Key01Icon}
                    size={20}
                    strokeWidth={1.8}
                    className="text-[#087a53]"
                  />
                  <h2 className="text-xl font-semibold text-[#191c1e]">
                    {created.agent_name} is ready
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#a04100]">
                  Copy this API key now — it won&apos;t be shown again.
                </p>

                <div className="mt-3 flex items-center gap-2 rounded-md border border-[#e6e8ea] bg-[#f7f9fb] px-3 py-2">
                  <code className="flex-1 truncate text-sm text-[#191c1e]">
                    {created.api_key}
                  </code>
                  <button
                    type="button"
                    onClick={copyKey}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#e6e8ea] bg-white px-2.5 py-1 text-xs font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
                  >
                    <HugeiconsIcon
                      icon={copied ? Tick02Icon : Copy01Icon}
                      size={14}
                      strokeWidth={1.8}
                    />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <p className="mt-4 text-sm font-semibold text-[#191c1e]">
                  Call the agent
                </p>
                <pre className="mt-1.5 overflow-x-auto rounded-md border border-[#e6e8ea] bg-[#191c1e] p-3 text-xs leading-5 text-[#e6e8ea]">
                  {created.curl}
                </pre>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-md bg-[#191c1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34393e]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-[#191c1e]">
                  Create an allowed agent
                </h2>
                <p className="mt-1 text-sm text-[#5f666d]">
                  Agents can query this space and only ever read healthy
                  documents.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="agent-name"
                      className="block text-sm font-semibold text-[#191c1e]"
                    >
                      Name
                    </label>
                    <input
                      id="agent-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={120}
                      placeholder="Support Copilot"
                      className="mt-1.5 w-full rounded-md border border-[#d4d8dc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#191c1e]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="agent-purpose"
                      className="block text-sm font-semibold text-[#191c1e]"
                    >
                      Purpose{" "}
                      <span className="font-normal text-[#9aa0a6]">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="agent-purpose"
                      type="text"
                      value={purpose}
                      onChange={(event) => setPurpose(event.target.value)}
                      maxLength={200}
                      placeholder="Answers customer refund questions"
                      className="mt-1.5 w-full rounded-md border border-[#d4d8dc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#191c1e]"
                    />
                  </div>

                  {error ? (
                    <p className="text-sm font-medium text-[#ba1a1a]">{error}</p>
                  ) : null}
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-md px-4 py-2 text-sm font-semibold text-[#5f666d] transition hover:text-[#191c1e]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={pending || !name.trim()}
                    className="rounded-md bg-[#ff6a00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d95800] disabled:cursor-not-allowed disabled:bg-[#d4d8dc]"
                  >
                    {pending ? "Creating…" : "Create agent"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
