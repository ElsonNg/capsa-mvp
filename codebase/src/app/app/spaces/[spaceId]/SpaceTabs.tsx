"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SpaceTabs({ spaceId }: { spaceId: string }) {
  const pathname = usePathname();
  const base = `/app/spaces/${spaceId}`;

  const tabs = [
    { label: "Overview", href: base, active: pathname === base },
    {
      label: "Research",
      href: `${base}/research`,
      active: pathname.startsWith(`${base}/research`),
    },
    {
      label: "Agents",
      href: `${base}/agents`,
      active: pathname.startsWith(`${base}/agents`),
    },
  ];

  return (
    <nav className="mt-6 flex gap-6 border-b border-[#e6e8ea]">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition ${
            tab.active
              ? "border-[#191c1e] text-[#191c1e]"
              : "border-transparent text-[#5f666d] hover:text-[#191c1e]"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
