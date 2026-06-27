"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { updateSpace } from "@/app/app/spaces/actions";
import type { Space } from "@/lib/spaces/queries";
import { DEFAULT_SPACE_ICON_KEY } from "@/lib/spaces/icons";
import { IconPicker } from "./IconPicker";

export function EditSpaceModal({ space }: { space: Space }) {
  const [open, setOpen] = useState(false);
  const [iconKey, setIconKey] = useState(space.icon ?? DEFAULT_SPACE_ICON_KEY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  function openModal() {
    setIconKey(space.icon ?? DEFAULT_SPACE_ICON_KEY);
    setError(null);
    setOpen(true);
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateSpace({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
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
    nameRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="Edit space"
        title="Edit space"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#e6e8ea] bg-white text-[#5f666d] transition hover:border-[#d4d8dc] hover:text-[#191c1e]"
      >
        <HugeiconsIcon icon={PencilEdit02Icon} size={18} strokeWidth={1.8} />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/30 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#e6e8ea] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#191c1e]">
              Edit space
            </h2>

            <form action={onSubmit} className="mt-5 space-y-4">
              <input type="hidden" name="space_id" value={space.id} />

              <div>
                <label
                  htmlFor="edit-space-name"
                  className="block text-sm font-semibold text-[#191c1e]"
                >
                  Name
                </label>
                <input
                  ref={nameRef}
                  id="edit-space-name"
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  defaultValue={space.name}
                  className="mt-1.5 w-full rounded-md border border-[#d4d8dc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#191c1e]"
                />
              </div>

              <div>
                <span className="block text-sm font-semibold text-[#191c1e]">
                  Icon
                </span>
                <div className="mt-1.5">
                  <IconPicker value={iconKey} onChange={setIconKey} />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-space-purpose"
                  className="block text-sm font-semibold text-[#191c1e]"
                >
                  Purpose{" "}
                  <span className="font-normal text-[#9aa0a6]">(optional)</span>
                </label>
                <textarea
                  id="edit-space-purpose"
                  name="purpose"
                  rows={3}
                  maxLength={300}
                  defaultValue={space.purpose ?? ""}
                  className="mt-1.5 w-full resize-none rounded-md border border-[#d4d8dc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#191c1e]"
                />
              </div>

              {error ? (
                <p className="text-sm font-medium text-[#ba1a1a]">{error}</p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-[#5f666d] transition hover:text-[#191c1e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-[#ff6a00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d95800] disabled:cursor-not-allowed disabled:bg-[#d4d8dc]"
                >
                  {pending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
