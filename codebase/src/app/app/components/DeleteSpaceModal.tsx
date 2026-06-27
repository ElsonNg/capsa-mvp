"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { deleteSpace } from "@/app/app/spaces/actions";

function DeleteButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-md bg-[#ba1a1a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9a1414] disabled:cursor-not-allowed disabled:bg-[#e0a3a0]"
    >
      {pending ? "Deleting…" : "Delete space"}
    </button>
  );
}

export function DeleteSpaceModal({
  spaceId,
  spaceName,
}: {
  spaceId: string;
  spaceName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const matches = confirm.trim() === spaceName;

  function openModal() {
    setConfirm("");
    setOpen(true);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="Delete space"
        title="Delete space"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#e6e8ea] bg-white text-[#5f666d] transition hover:border-[#f1b3ae] hover:bg-[#fff5f4] hover:text-[#ba1a1a]"
      >
        <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} />
      </button>

      {open ? (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/30 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-pop-in w-full max-w-md rounded-xl border border-[#e6e8ea] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#191c1e]">
              Delete space
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f666d]">
              This permanently deletes{" "}
              <span className="font-semibold text-[#191c1e]">{spaceName}</span>{" "}
              and all of its documents, claims, and conflicts. This cannot be
              undone.
            </p>

            <form action={deleteSpace} className="mt-5 space-y-4">
              <input type="hidden" name="space_id" value={spaceId} />

              <div>
                <label
                  htmlFor="delete-confirm"
                  className="block text-sm font-medium text-[#5f666d]"
                >
                  Type{" "}
                  <span className="font-semibold text-[#191c1e]">
                    {spaceName}
                  </span>{" "}
                  to confirm.
                </label>
                <input
                  id="delete-confirm"
                  name="confirm_name"
                  type="text"
                  autoComplete="off"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#d4d8dc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#ba1a1a]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-[#5f666d] transition hover:text-[#191c1e]"
                >
                  Cancel
                </button>
                <DeleteButton disabled={!matches} />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
