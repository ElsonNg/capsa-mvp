import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import type { SpaceConflict, ConflictSeverity } from "@/lib/spaces/queries";

const SEVERITY_STYLES: Record<ConflictSeverity, string> = {
  high: "bg-[#ffdad6] text-[#ba1a1a]",
  medium: "bg-[#fff0e8] text-[#a04100]",
  low: "bg-[#f2f4f6] text-[#5f666d]",
};

export function ConflictList({ conflicts }: { conflicts: SpaceConflict[] }) {
  return (
    <div className="space-y-3">
      {conflicts.map((conflict) => (
        <article
          key={conflict.id}
          className="animate-fade-in-up rounded-lg border border-[#e6e8ea] bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={18}
                strokeWidth={1.8}
                className="shrink-0 text-[#a04100]"
              />
              <h3 className="text-sm font-semibold text-[#191c1e]">
                {conflict.title}
              </h3>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                SEVERITY_STYLES[conflict.severity]
              }`}
            >
              {conflict.severity}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-[#5f666d]">
            {conflict.explanation}
          </p>

          <div className="mt-3 rounded-md bg-[#f7f9fb] px-3 py-2 text-sm text-[#5a4136]">
            <span className="font-semibold">Recommended:</span>{" "}
            {conflict.recommended_action}
          </div>

          <p className="mt-3 text-xs text-[#9aa0a6]">
            Source of truth:{" "}
            <span className="font-semibold text-[#5f666d]">
              {conflict.primary_document_title ?? "Unknown"}
            </span>
            {conflict.status === "quarantined" ? (
              <>
                {" · "}
                Quarantined:{" "}
                <span className="font-semibold text-[#ba1a1a]">
                  {conflict.conflicting_document_title ?? "Unknown"}
                </span>
              </>
            ) : (
              <>
                {" · "}
                Conflicting:{" "}
                <span className="font-semibold text-[#a04100]">
                  {conflict.conflicting_document_title ?? "Unknown"}
                </span>
              </>
            )}
          </p>
        </article>
      ))}
    </div>
  );
}
