"use client";

import { useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Shield01Icon,
  TestTube01Icon,
} from "@hugeicons/core-free-icons";

type DocRef = { id: string; title: string };

type SearchResult = {
  answer: string;
  sources: DocRef[];
  blocked: DocRef[];
};

const DEFAULT_QUESTION =
  "Can enterprise customers get a refund after 20 days?";

export function AgentTestPanel() {
  const [apiKey, setApiKey] = useState("");
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    if (!apiKey.trim() || !question.trim()) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/agents/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: apiKey.trim(),
            question: question.trim(),
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Request failed.");
          return;
        }
        setResult(json as SearchResult);
      } catch {
        setError("Request failed.");
      }
    });
  }

  return (
    <section className="rounded-xl border border-[#e6e8ea] bg-white p-5">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          icon={TestTube01Icon}
          size={18}
          strokeWidth={1.8}
          className="text-[#5f666d]"
        />
        <h2 className="text-base font-semibold text-[#191c1e]">Test an agent</h2>
      </div>
      <p className="mt-1 text-sm text-[#5f666d]">
        Run a question through the agent endpoint to see the safe answer and what
        was blocked.
      </p>

      <div className="mt-4 space-y-3">
        <input
          type="text"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="Paste an agent API key (capsa_sk_…)"
          className="w-full rounded-md border border-[#d4d8dc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#191c1e]"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question"
            className="flex-1 rounded-md border border-[#d4d8dc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#191c1e]"
          />
          <button
            type="button"
            onClick={run}
            disabled={pending || !apiKey.trim() || !question.trim()}
            className="shrink-0 rounded-md bg-[#ff6a00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d95800] disabled:cursor-not-allowed disabled:bg-[#d4d8dc]"
          >
            {pending ? "Asking…" : "Ask"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-[#ba1a1a]">{error}</p>
      ) : null}

      {result ? (
        <div className="animate-fade-in-up mt-4 space-y-4">
          <div className="rounded-md border border-[#e6e8ea] bg-[#f7f9fb] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9aa0a6]">
              Answer
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#191c1e]">
              {result.answer}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-[#e6e8ea] p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[#087a53]">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={15}
                  strokeWidth={1.8}
                />
                Sources used ({result.sources.length})
              </p>
              {result.sources.length === 0 ? (
                <p className="mt-1.5 text-sm text-[#9aa0a6]">None</p>
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {result.sources.map((doc) => (
                    <li key={doc.id} className="text-sm text-[#5f666d]">
                      {doc.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-md border border-[#e6e8ea] p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[#ba1a1a]">
                <HugeiconsIcon
                  icon={Shield01Icon}
                  size={15}
                  strokeWidth={1.8}
                />
                Blocked ({result.blocked.length})
              </p>
              {result.blocked.length === 0 ? (
                <p className="mt-1.5 text-sm text-[#9aa0a6]">None</p>
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {result.blocked.map((doc) => (
                    <li key={doc.id} className="text-sm text-[#5f666d]">
                      {doc.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
