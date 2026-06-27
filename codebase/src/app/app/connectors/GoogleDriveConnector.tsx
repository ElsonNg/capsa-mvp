"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GoogleDriveIcon,
  GoogleDocIcon,
  Pdf01Icon,
  CloudUploadIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Cancel01Icon,
  Search01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { connectGoogleDrive } from "@/app/auth/actions";
import { disconnectGoogleDrive } from "./actions";

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";

type SpaceOption = { id: string; name: string; icon: string | null };

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
};

type ImportedDoc = {
  id: string;
  title: string;
  health_status: "healthy" | "needs_review";
};

type ImportResponse = {
  space_id: string;
  documents_imported: number;
  documents_needing_review: number;
  documents: ImportedDoc[];
  import_errors: { file_id: string; error: string }[];
};

type Connection = "checking" | "connected" | "needs_connection" | "error";

export function GoogleDriveConnector({
  spaces,
  disconnected,
}: {
  spaces: SpaceOption[];
  disconnected: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const deepLinkSpaceId = searchParams.get("spaceId");
  const initialSpaceId =
    deepLinkSpaceId && spaces.some((s) => s.id === deepLinkSpaceId)
      ? deepLinkSpaceId
      : spaces[0]?.id ?? "";
  const shouldAutoOpen = searchParams.get("add") === "google-drive";

  const [open, setOpen] = useState(shouldAutoOpen);
  const [connection, setConnection] = useState<Connection>(
    disconnected ? "needs_connection" : "checking",
  );
  const [targetSpaceId, setTargetSpaceId] = useState(initialSpaceId);

  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [view, setView] = useState<"browse" | "results">("browse");
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importing, startImport] = useTransition();
  const [connecting, startConnect] = useTransition();

  const [resyncMessage, setResyncMessage] = useState<string | null>(null);
  const [resyncing, startResync] = useTransition();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, startDisconnect] = useTransition();

  const didInit = useRef(false);

  async function checkStatus(): Promise<Connection> {
    if (disconnected) {
      setConnection("needs_connection");
      return "needs_connection";
    }
    setConnection("checking");
    try {
      const res = await fetch("/api/sources/google-drive/status", {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok && json.connected) {
        setConnection("connected");
        return "connected";
      }
      if (json.code === "reconnect_required" || json.code === "unauthenticated") {
        setConnection("needs_connection");
        return "needs_connection";
      }
      setConnection("error");
      return "error";
    } catch {
      setConnection("error");
      return "error";
    }
  }

  async function loadFiles(reset: boolean, token?: string | null) {
    setLoadingFiles(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({ pageSize: "25" });
      if (search.trim()) params.set("search", search.trim());
      if (token) params.set("pageToken", token);

      const res = await fetch(
        `/api/sources/google-drive/files?${params.toString()}`,
        { cache: "no-store" },
      );
      const json = await res.json();

      if (!res.ok) {
        if (json.code === "reconnect_required") {
          setConnection("needs_connection");
        } else {
          setErrorMessage(json.reason ?? "Could not list Google Drive files.");
        }
        return;
      }

      const incoming: DriveFile[] = json.files ?? [];
      setFiles((prev) => (reset ? incoming : [...prev, ...incoming]));
      setNextPageToken(json.nextPageToken ?? null);
    } catch {
      setErrorMessage("Could not list Google Drive files.");
    } finally {
      setLoadingFiles(false);
    }
  }

  // On mount: clean the deep-link query, check status, and prefetch files when
  // auto-opened and already connected. setState runs in async continuations, so
  // it does not violate the synchronous-setState-in-effect rule.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (shouldAutoOpen) {
      router.replace("/app/connectors");
    }

    void (async () => {
      const state = await checkStatus();
      if (shouldAutoOpen && state === "connected") {
        void loadFiles(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search while browsing.
  useEffect(() => {
    if (!open || connection !== "connected" || view !== "browse") return;

    const handle = setTimeout(() => {
      void loadFiles(true);
    }, 350);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, open, connection, view]);

  async function openDialog() {
    setView("browse");
    setResult(null);
    setErrorMessage(null);
    setSelected(new Set());
    setOpen(true);

    const state = connection === "connected" ? connection : await checkStatus();
    if (state === "connected") {
      void loadFiles(true);
    }
  }

  function closeDialog() {
    setOpen(false);
  }

  function handleConnect() {
    const nextPath =
      "/app/connectors?add=google-drive" +
      (targetSpaceId ? `&spaceId=${targetSpaceId}` : "");
    startConnect(async () => {
      await connectGoogleDrive(nextPath);
    });
  }

  function handleResync() {
    setResyncMessage(null);
    startResync(async () => {
      try {
        const res = await fetch("/api/sources/google-drive/resync", {
          method: "POST",
        });
        const json = await res.json();

        if (!res.ok) {
          if (json.code === "reconnect_required") {
            setConnection("needs_connection");
            setResyncMessage("Reconnect Google Drive to resync.");
          } else {
            setResyncMessage(json.error ?? "Resync failed.");
          }
          return;
        }

        const parts = [`${json.updated} updated`];
        if (json.removed > 0) parts.push(`${json.removed} removed`);
        setResyncMessage(`Resync complete. ${parts.join(", ")}.`);
        router.refresh();
      } catch {
        setResyncMessage("Resync failed.");
      }
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      await disconnectGoogleDrive();
      setConnection("needs_connection");
      setConfirmDisconnect(false);
      setResyncMessage(null);
      setFiles([]);
      setSelected(new Set());
      router.refresh();
    });
  }

  function toggleFile(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleImport() {
    if (!targetSpaceId || selected.size === 0) return;

    startImport(async () => {
      setErrorMessage(null);
      try {
        const res = await fetch("/api/sources/google-drive/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            space_id: targetSpaceId,
            file_ids: Array.from(selected),
          }),
        });
        const json = await res.json();

        if (!res.ok) {
          if (json.code === "reconnect_required") {
            setConnection("needs_connection");
          } else {
            setErrorMessage(json.error ?? "Import failed. Please try again.");
          }
          return;
        }

        setResult(json as ImportResponse);
        setView("results");
        router.refresh();
      } catch {
        setErrorMessage("Import failed. Please try again.");
      }
    });
  }

  const statusLabel =
    connection === "connected"
      ? "Connected"
      : connection === "needs_connection"
        ? "Not connected"
        : connection === "checking"
          ? "Checking…"
          : "Connection error";

  return (
    <>
      <div className="flex flex-col rounded-xl border border-[#e6e8ea] bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f6] text-[#191c1e]">
            <HugeiconsIcon icon={GoogleDriveIcon} size={24} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#191c1e]">
              Google Drive
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#5f666d]">
              {connection === "connected" ? (
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={15}
                  strokeWidth={1.8}
                  className="text-[#087a53]"
                />
              ) : null}
              {statusLabel}
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-[#5f666d]">
          Import Google Docs (docx) from your Drive into a space.
        </p>

        <div className="mt-4">
          <button
            type="button"
            onClick={openDialog}
            className="inline-flex items-center gap-2 rounded-md bg-[#191c1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34393e]"
          >
            {connection === "needs_connection" ? "Connect" : "Import documents"}
          </button>

          {connection === "connected" ? (
            <div className="mt-3 flex items-center gap-4 border-t border-[#eef0f2] pt-3">
              <button
                type="button"
                onClick={handleResync}
                disabled={resyncing}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5f666d] transition hover:text-[#191c1e] disabled:text-[#9aa0a6]"
              >
                <HugeiconsIcon icon={RefreshIcon} size={15} strokeWidth={1.8} />
                {resyncing ? "Resyncing…" : "Resync"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDisconnect(true)}
                className="text-sm font-semibold text-[#ba1a1a] transition hover:text-[#9a1414]"
              >
                Disconnect
              </button>
            </div>
          ) : null}

          {resyncMessage ? (
            <p className="mt-2 text-sm text-[#5f666d]">{resyncMessage}</p>
          ) : null}
        </div>
      </div>

      {confirmDisconnect ? (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/30 px-4"
          onClick={() => setConfirmDisconnect(false)}
        >
          <div
            className="animate-pop-in w-full max-w-md rounded-xl border border-[#e6e8ea] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#191c1e]">
              Disconnect Google Drive
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f666d]">
              Capsa will stop accessing your Drive. Documents you&apos;ve already
              imported stay in their spaces — disconnecting does not delete them.
              You can reconnect anytime.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDisconnect(false)}
                className="rounded-md px-4 py-2 text-sm font-semibold text-[#5f666d] transition hover:text-[#191c1e]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="rounded-md bg-[#ba1a1a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9a1414] disabled:cursor-not-allowed disabled:bg-[#e0a3a0]"
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {open ? (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/30 px-4"
          onClick={closeDialog}
        >
          <div
            className="animate-pop-in flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-[#e6e8ea] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e6e8ea] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon
                  icon={GoogleDriveIcon}
                  size={20}
                  strokeWidth={1.8}
                  className="text-[#191c1e]"
                />
                <h2 className="text-base font-semibold text-[#191c1e]">
                  {view === "results"
                    ? "Import complete"
                    : "Import from Google Drive"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#5f666d] transition hover:bg-[#f2f4f6] hover:text-[#191c1e]"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {connection === "needs_connection"
                ? renderConnect()
                : view === "results"
                  ? renderResults()
                  : renderBrowse()}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  function renderConnect() {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0e8] text-[#a04100]">
          <HugeiconsIcon icon={GoogleDriveIcon} size={24} strokeWidth={1.8} />
        </span>
        <h3 className="mt-4 text-base font-semibold text-[#191c1e]">
          Grant Google Drive access
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#5f666d]">
          Capsa needs read-only access to your Google Drive to import documents.
          You&apos;ll be returned here after granting access.
        </p>
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#191c1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34393e] disabled:cursor-not-allowed disabled:bg-[#d4d8dc]"
        >
          {connecting ? "Redirecting…" : "Grant Google Drive access"}
        </button>
      </div>
    );
  }

  function renderBrowse() {
    return (
      <div className="space-y-4">
        <div>
          <label
            htmlFor="import-space"
            className="block text-sm font-semibold text-[#191c1e]"
          >
            Import into
          </label>
          {spaces.length === 0 ? (
            <p className="mt-1.5 text-sm text-[#5f666d]">
              Create a space first, then come back to import documents.
            </p>
          ) : (
            <select
              id="import-space"
              value={targetSpaceId}
              onChange={(event) => setTargetSpaceId(event.target.value)}
              className="mt-1.5 w-full rounded-md border border-[#d4d8dc] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#191c1e]"
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-[#d4d8dc] px-3 py-2 focus-within:border-[#191c1e]">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              strokeWidth={1.8}
              className="text-[#9aa0a6]"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Drive files"
              className="w-full text-sm text-[#191c1e] outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => loadFiles(true)}
            disabled={loadingFiles}
            title="Refresh"
            aria-label="Refresh Drive files"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-[#d4d8dc] text-[#5f666d] transition hover:bg-[#f7f9fb] hover:text-[#191c1e] disabled:opacity-60"
          >
            <HugeiconsIcon icon={RefreshIcon} size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="rounded-md border border-[#e6e8ea]">
          {files.length === 0 && !loadingFiles ? (
            <p className="px-3 py-6 text-center text-sm leading-6 text-[#9aa0a6]">
              No Google Docs or PDFs found. A just-created doc can take a moment
              to appear in Drive — try Refresh.
            </p>
          ) : (
            <ul className="divide-y divide-[#eef0f2]">
              {files.map((file) => {
                const isDoc = file.mimeType === GOOGLE_DOC_MIME;
                const checked = selected.has(file.id);
                return (
                  <li key={file.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-[#f7f9fb]">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFile(file.id)}
                        className="h-4 w-4 accent-[#191c1e]"
                      />
                      <HugeiconsIcon
                        icon={isDoc ? GoogleDocIcon : Pdf01Icon}
                        size={18}
                        strokeWidth={1.8}
                        className="shrink-0 text-[#5f666d]"
                      />
                      <span className="truncate text-sm text-[#191c1e]">
                        {file.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {loadingFiles ? (
            <p className="px-3 py-3 text-center text-sm text-[#9aa0a6]">
              Loading…
            </p>
          ) : nextPageToken ? (
            <button
              type="button"
              onClick={() => loadFiles(false, nextPageToken)}
              className="w-full border-t border-[#eef0f2] px-3 py-2.5 text-sm font-semibold text-[#5f666d] transition hover:bg-[#f7f9fb] hover:text-[#191c1e]"
            >
              Load more
            </button>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="text-sm font-medium text-[#ba1a1a]">{errorMessage}</p>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-sm text-[#9aa0a6]">
            {selected.size > 0
              ? `${selected.size} selected`
              : "Select files to import"}
          </span>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !targetSpaceId || selected.size === 0}
            className="inline-flex items-center gap-2 rounded-md bg-[#ff6a00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d95800] disabled:cursor-not-allowed disabled:bg-[#d4d8dc]"
          >
            <HugeiconsIcon icon={CloudUploadIcon} size={16} strokeWidth={1.8} />
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    );
  }

  function renderResults() {
    if (!result) return null;
    const space = spaces.find((s) => s.id === result.space_id);

    return (
      <div className="animate-fade-in space-y-4">
        <p className="text-sm text-[#5f666d]">
          {result.documents_imported}{" "}
          {result.documents_imported === 1 ? "document" : "documents"} imported
          {space ? (
            <>
              {" "}
              into{" "}
              <span className="font-semibold text-[#191c1e]">
                {space.name}
              </span>
            </>
          ) : null}
          .
        </p>

        <ul className="divide-y divide-[#eef0f2] rounded-md border border-[#e6e8ea]">
          {result.documents.map((doc) => {
            const healthy = doc.health_status === "healthy";
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <HugeiconsIcon
                  icon={healthy ? CheckmarkCircle02Icon : AlertCircleIcon}
                  size={18}
                  strokeWidth={1.8}
                  className={healthy ? "text-[#087a53]" : "text-[#a04100]"}
                />
                <span className="truncate text-sm text-[#191c1e]">
                  {doc.title}
                </span>
                {!healthy ? (
                  <span className="ml-auto shrink-0 text-xs font-semibold text-[#a04100]">
                    Needs review
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>

        {result.import_errors.length > 0 ? (
          <div className="rounded-md border border-[#f1b3ae] bg-[#fff5f4] px-3 py-2.5">
            <p className="text-sm font-semibold text-[#ba1a1a]">
              {result.import_errors.length} file
              {result.import_errors.length === 1 ? "" : "s"} could not be
              imported.
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setView("browse");
              setSelected(new Set());
              setResult(null);
            }}
            className="rounded-md px-4 py-2 text-sm font-semibold text-[#5f666d] transition hover:text-[#191c1e]"
          >
            Import more
          </button>
          {space ? (
            <Link
              href={`/app/spaces/${space.id}`}
              className="rounded-md bg-[#191c1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34393e]"
            >
              Go to space
            </Link>
          ) : null}
        </div>
      </div>
    );
  }
}
