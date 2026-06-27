import Link from "next/link";
import { SmokeTestClient } from "./smoke-test-client";

export default function SmokePage() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-semibold text-[#191c1e]">
          LLM smoke test
        </h1>
        <Link
          href="/app"
          className="inline-flex items-center justify-center rounded-md border border-[#e6e8ea] bg-white px-4 py-2 text-sm font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
        >
          Back to spaces
        </Link>
      </div>

      <SmokeTestClient />
    </div>
  );
}
