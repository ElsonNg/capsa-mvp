"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ArrowUpRight01Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import type { ResearchResult } from "@/lib/research/queries";
import { clearResearch } from "./actions";

const SUGGESTED_QUERIES = [
  "enterprise refund policy SaaS 14 days 30 days",
  "consumer refund policy Singapore online services",
  "marketing claims policy AI software",
];

export function ResearchPanel({
  spaceId,
  results,
}: {
  spaceId: string;
  results: ResearchResult[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [clearing, startClear] = useTransition();

  function runSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    setError(null);
    startSearch(async () => {
      try {
        const res = await fetch("/api/research/exa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ space_id: spaceId, query: trimmed }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Search failed. Please try again.");
          return;
        }
        setQuery("");
        router.refresh();
      } catch {
        setError("Search failed. Please try again.");
      }
    });
  }

  function handleClear() {
    startClear(async () => {
      await clearResearch(spaceId);
      router.refresh();
    });
  }

  return (
    <div>
      <section className="rounded-xl border border-[#e6e8ea] bg-white p-5">
        <h2 className="text-base font-semibold text-[#191c1e]">
          External research
        </h2>
        <p className="mt-1 text-sm text-[#5f666d]">
          Pull public policy and market context to compare against your
          documents.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSearch(query);
          }}
          className="mt-4 flex gap-2"
        >
          <div className="flex flex-1 items-center gap-2 rounded-md border border-[#d4d8dc] px-3 py-2 focus-within:border-[#191c1e]">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              strokeWidth={1.8}
              className="text-[#9aa0a6]"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the web for relevant policy context"
              className="w-full text-sm text-[#191c1e] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="shrink-0 rounded-md bg-[#ff6a00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d95800] disabled:cursor-not-allowed disabled:bg-[#d4d8dc]"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_QUERIES.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              disabled={searching}
              className="rounded-full border border-[#e6e8ea] px-3 py-1 text-xs font-medium text-[#5f666d] transition hover:border-[#d4d8dc] hover:text-[#191c1e] disabled:opacity-60"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-3 text-sm font-medium text-[#ba1a1a]">{error}</p>
        ) : null}
      </section>

      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#191c1e]">
          {results.length > 0
            ? `${results.length} result${results.length === 1 ? "" : "s"}`
            : "Results"}
        </h3>
        {results.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing}
            className="text-sm font-semibold text-[#5f666d] transition hover:text-[#ba1a1a] disabled:opacity-60"
          >
            {clearing ? "Clearing…" : "Clear all"}
          </button>
        ) : null}
      </div>

      {results.length === 0 ? (
        <p className="mt-3 rounded-xl border border-[#e6e8ea] bg-white p-5 text-sm text-[#5f666d]">
          No research yet. Run a search to gather external context.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {results.map((result) => (
            <article
              key={result.id}
              className="animate-fade-in-up rounded-xl border border-[#e6e8ea] bg-white p-4"
            >
              <div className="flex items-center gap-1.5 text-xs text-[#9aa0a6]">
                <HugeiconsIcon
                  icon={Globe02Icon}
                  size={13}
                  strokeWidth={1.8}
                />
                {result.source ?? "source"}
              </div>
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="group mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#191c1e] hover:text-[#0062a1]"
              >
                <span>{result.title}</span>
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={14}
                  strokeWidth={2}
                  className="text-[#9aa0a6] group-hover:text-[#0062a1]"
                />
              </a>
              {result.snippet ? (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#5f666d]">
                  {result.snippet}
                </p>
              ) : null}
              {result.why_it_matters ? (
                <p className="mt-2 rounded-md bg-[#f7f9fb] px-3 py-2 text-sm text-[#5a4136]">
                  <span className="font-semibold">Why it matters:</span>{" "}
                  {result.why_it_matters}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
