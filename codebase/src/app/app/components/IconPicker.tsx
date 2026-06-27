"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SPACE_ICONS } from "@/lib/spaces/icons";

/** A grid of selectable space icons. The selected key is submitted via a
 * hidden input named `icon`. */
export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div>
      <input type="hidden" name="icon" value={value} />
      <div className="grid grid-cols-8 gap-1.5">
        {SPACE_ICONS.map((option) => {
          const selected = option.key === value;
          return (
            <button
              key={option.key}
              type="button"
              title={option.label}
              aria-label={option.label}
              aria-pressed={selected}
              onClick={() => onChange(option.key)}
              className={`flex aspect-square items-center justify-center rounded-md border transition ${
                selected
                  ? "border-[#191c1e] bg-[#191c1e] text-white"
                  : "border-[#e6e8ea] bg-white text-[#5f666d] hover:border-[#d4d8dc] hover:text-[#191c1e]"
              }`}
            >
              <HugeiconsIcon
                icon={option.icon}
                size={18}
                strokeWidth={1.8}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
