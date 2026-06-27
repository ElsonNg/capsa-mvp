"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { createSpace, type CreateSpaceState } from "@/app/app/spaces/actions";
import { DEFAULT_SPACE_ICON_KEY } from "@/lib/spaces/icons";
import { IconPicker } from "./IconPicker";

const initialState: CreateSpaceState = {};

type Variant = "primary" | "sidebar";

export function CreateSpaceModal({
  label = "New space",
  variant = "primary",
}: {
  label?: string;
  variant?: Variant;
}) {
  const [open, setOpen] = useState(false);
  const [iconKey, setIconKey] = useState(DEFAULT_SPACE_ICON_KEY);
  const [state, formAction, pending] = useActionState(
    createSpace,
    initialState,
  );
  const nameRef = useRef<HTMLInputElement>(null);

  function openModal() {
    setIconKey(DEFAULT_SPACE_ICON_KEY);
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
    nameRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={openModal}
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-[#d4d8dc] px-3 py-2 text-sm font-semibold text-[#5f666d] transition hover:border-[#191c1e] hover:text-[#191c1e]"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
          {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-md bg-[#191c1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#34393e]"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
          {label}
        </button>
      )}

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
              Create a space
            </h2>
            <p className="mt-1 text-sm text-[#5f666d]">
              Spaces group related documents so Capsa can monitor them together.
            </p>

            <form action={formAction} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="space-name"
                  className="block text-sm font-semibold text-[#191c1e]"
                >
                  Name
                </label>
                <input
                  ref={nameRef}
                  id="space-name"
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  placeholder="Support"
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
                  htmlFor="space-purpose"
                  className="block text-sm font-semibold text-[#191c1e]"
                >
                  Purpose{" "}
                  <span className="font-normal text-[#9aa0a6]">(optional)</span>
                </label>
                <textarea
                  id="space-purpose"
                  name="purpose"
                  rows={3}
                  maxLength={300}
                  placeholder="Support policies and customer-facing operational knowledge."
                  className="mt-1.5 w-full resize-none rounded-md border border-[#d4d8dc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#191c1e]"
                />
              </div>

              {state.error ? (
                <p className="text-sm font-medium text-[#ba1a1a]">
                  {state.error}
                </p>
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
                  {pending ? "Creating…" : "Create space"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
