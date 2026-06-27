"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

type ScanResponse = {
  claims_extracted: number;
  conflicts_found: number;
  documents_quarantined: number;
  error?: string;
};

export function ScanButton({
  spaceId,
  disabled,
}: {
  spaceId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function runScan() {
    setMessage(null);
    setIsError(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/scans/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ space_id: spaceId }),
        });
        const json = (await res.json()) as ScanResponse;

        if (!res.ok) {
          setIsError(true);
          setMessage(json.error ?? "Scan failed. Please try again.");
          return;
        }

        if (json.conflicts_found === 0) {
          setMessage("Scan complete. No conflicts found.");
        } else {
          const quarantined =
            json.documents_quarantined > 0
              ? `, ${json.documents_quarantined} quarantined`
              : "";
          setMessage(
            `Scan complete. ${json.conflicts_found} conflict${
              json.conflicts_found === 1 ? "" : "s"
            } found${quarantined}.`,
          );
        }
        router.refresh();
      } catch {
        setIsError(true);
        setMessage("Scan failed. Please try again.");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {message ? (
        <span
          className={`text-sm font-medium ${
            isError ? "text-[#ba1a1a]" : "text-[#5f666d]"
          }`}
        >
          {message}
        </span>
      ) : null}
      <button
        type="button"
        onClick={runScan}
        disabled={pending || disabled}
        className="inline-flex items-center gap-2 rounded-md border border-[#e6e8ea] bg-white px-4 py-2 text-sm font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6] disabled:cursor-not-allowed disabled:text-[#9aa0a6]"
      >
        <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={1.8} />
        {pending ? "Scanning…" : "Scan for conflicts"}
      </button>
    </div>
  );
}
