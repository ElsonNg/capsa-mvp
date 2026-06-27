import { HugeiconsIcon } from "@hugeicons/react";
import {
  GoogleDocIcon,
  Pdf01Icon,
  File01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import type {
  SpaceDocument,
  DocumentAuthorityLevel,
  DocumentHealthStatus,
} from "@/lib/spaces/queries";

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const PDF_MIME = "application/pdf";

const AUTHORITY_LABELS: Record<DocumentAuthorityLevel, string> = {
  approved_policy: "Approved policy",
  current_document: "Current",
  draft: "Draft",
  archived: "Archived",
};

// Health is surfaced only when a document needs attention; healthy stays quiet.
const HEALTH_TAGS: Partial<
  Record<DocumentHealthStatus, { label: string; className: string }>
> = {
  conflict: { label: "Conflict", className: "bg-[#fff0e8] text-[#a04100]" },
  needs_review: {
    label: "Needs review",
    className: "bg-[#fff0e8] text-[#a04100]",
  },
  quarantined: {
    label: "Quarantined",
    className: "bg-[#ffdad6] text-[#ba1a1a]",
  },
};

function fileIcon(mimeType: string) {
  if (mimeType === GOOGLE_DOC_MIME) return GoogleDocIcon;
  if (mimeType === PDF_MIME) return Pdf01Icon;
  return File01Icon;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentList({ documents }: { documents: SpaceDocument[] }) {
  return (
    <ul className="mt-4 divide-y divide-[#eef0f2] rounded-lg border border-[#e6e8ea]">
      {documents.map((doc) => {
        const tag = HEALTH_TAGS[doc.health_status];
        const modified = formatDate(doc.modified_at);

        return (
          <li
            key={doc.id}
            className="flex items-center gap-3 px-4 py-3 first:rounded-t-lg last:rounded-b-lg hover:bg-[#f7f9fb]"
          >
            <HugeiconsIcon
              icon={fileIcon(doc.mime_type)}
              size={20}
              strokeWidth={1.8}
              className="shrink-0 text-[#5f666d]"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {doc.source_url ? (
                  <a
                    href={doc.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-1 truncate text-sm font-semibold text-[#191c1e] hover:text-[#0062a1]"
                  >
                    <span className="truncate">{doc.title}</span>
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      size={14}
                      strokeWidth={2}
                      className="shrink-0 text-[#9aa0a6] group-hover:text-[#0062a1]"
                    />
                  </a>
                ) : (
                  <span className="truncate text-sm font-semibold text-[#191c1e]">
                    {doc.title}
                  </span>
                )}
                {tag ? (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${tag.className}`}
                  >
                    {tag.label}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-[#9aa0a6]">
                {AUTHORITY_LABELS[doc.authority_level]}
                {modified ? ` · Updated ${modified}` : null}
              </p>
              {doc.health_status === "quarantined" && doc.quarantine_reason ? (
                <p className="mt-1 text-xs leading-5 text-[#a04100]">
                  {doc.quarantine_reason}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
