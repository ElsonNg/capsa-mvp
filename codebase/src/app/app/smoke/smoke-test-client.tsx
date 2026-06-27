"use client";

import { useState } from "react";

const defaultOpenAiPrompt =
  "In one sentence, say whether this smoke test reached OpenAI successfully.";

const defaultExaPrompt =
  "Find a concise public web answer: what is Exa used for in AI applications?";

type SmokeResult = {
  ok: boolean;
  response?: unknown;
  error?: string;
};

type TestKind = "openai" | "exa";

export function SmokeTestClient() {
  const [openAiPrompt, setOpenAiPrompt] = useState(defaultOpenAiPrompt);
  const [exaPrompt, setExaPrompt] = useState(defaultExaPrompt);
  const [openAiResult, setOpenAiResult] = useState<SmokeResult | null>(null);
  const [exaResult, setExaResult] = useState<SmokeResult | null>(null);
  const [loading, setLoading] = useState<TestKind | null>(null);

  async function runTest(kind: TestKind) {
    setLoading(kind);

    if (kind === "openai") {
      setOpenAiResult(null);
    } else {
      setExaResult(null);
    }

    try {
      const response = await fetch(`/api/smoke/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: kind === "openai" ? openAiPrompt : exaPrompt,
        }),
      });
      const payload = (await response.json()) as SmokeResult;

      if (kind === "openai") {
        setOpenAiResult(payload);
      } else {
        setExaResult(payload);
      }
    } catch (error) {
      const payload = {
        ok: false,
        error: error instanceof Error ? error.message : "Request failed.",
      };

      if (kind === "openai") {
        setOpenAiResult(payload);
      } else {
        setExaResult(payload);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SmokePanel
        title="OpenAI"
        buttonLabel="Test OpenAI"
        prompt={openAiPrompt}
        result={openAiResult}
        loading={loading === "openai"}
        onPromptChange={setOpenAiPrompt}
        onRun={() => runTest("openai")}
      />
      <SmokePanel
        title="Exa Search"
        buttonLabel="Test Exa Search"
        prompt={exaPrompt}
        result={exaResult}
        loading={loading === "exa"}
        onPromptChange={setExaPrompt}
        onRun={() => runTest("exa")}
      />
    </div>
  );
}

function SmokePanel({
  title,
  buttonLabel,
  prompt,
  result,
  loading,
  onPromptChange,
  onRun,
}: {
  title: string;
  buttonLabel: string;
  prompt: string;
  result: SmokeResult | null;
  loading: boolean;
  onPromptChange: (value: string) => void;
  onRun: () => void;
}) {
  return (
    <section className="rounded-lg border border-[#e6e8ea] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[#191c1e]">{title}</h2>
        <button
          onClick={onRun}
          disabled={loading || !prompt.trim()}
          className="rounded-md bg-[#ff6a00] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#d95800] disabled:cursor-not-allowed disabled:bg-[#d4d8dc]"
        >
          {loading ? "Testing..." : buttonLabel}
        </button>
      </div>

      <label className="mt-5 block text-sm font-bold text-[#5f666d]">
        Prompt
      </label>
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        rows={5}
        className="mt-2 min-h-32 w-full resize-y rounded-md border border-[#d4d8dc] bg-[#f7f9fb] p-3 text-sm font-medium leading-6 text-[#191c1e] outline-none transition focus:border-[#ff6a00] focus:bg-white"
      />

      <div className="mt-5 rounded-md border border-[#e6e8ea] bg-[#f7f9fb] p-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5f666d]">
          Response
        </div>
        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-[#191c1e]">
          {result
            ? JSON.stringify(result, null, 2)
            : "Click the button to run a smoke test."}
        </pre>
      </div>
    </section>
  );
}
