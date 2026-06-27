"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon } from "@hugeicons/core-free-icons";
import { signOut } from "@/app/auth/actions";
import type { Space } from "@/lib/spaces/queries";
import { CreateSpaceModal } from "./CreateSpaceModal";
import { SpaceIcon } from "./SpaceIcon";

type SidebarUser = {
  displayName: string;
  email: string | null;
};

export function Sidebar({
  spaces,
  user,
}: {
  spaces: Space[];
  user: SidebarUser;
}) {
  const pathname = usePathname();
  const overviewActive = pathname === "/app";

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[#e6e8ea] bg-white">
      <div className="px-5 py-5">
        <Link href="/app" className="flex items-center gap-2.5">
          <Image
            src="/capsa-primary-logo-only.svg"
            alt="Capsa"
            width={28}
            height={28}
            priority
          />
          <span className="text-lg font-bold text-[#191c1e]">Capsa</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <Link
          href="/app"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-semibold transition ${
            overviewActive
              ? "bg-[#f2f4f6] text-[#191c1e]"
              : "text-[#5f666d] hover:bg-[#f7f9fb] hover:text-[#191c1e]"
          }`}
        >
          All spaces
        </Link>

        <div className="mt-5 mb-2 flex items-center justify-between px-3">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9aa0a6]">
            Spaces
          </span>
        </div>

        {spaces.length === 0 ? (
          <p className="px-3 py-1 text-sm text-[#9aa0a6]">No spaces yet</p>
        ) : (
          <ul className="space-y-0.5">
            {spaces.map((space) => {
              const href = `/app/spaces/${space.id}`;
              const active = pathname === href;
              const needsAttention = space.health_status !== "healthy";

              return (
                <li key={space.id}>
                  <Link
                    href={href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-[#f2f4f6] text-[#191c1e]"
                        : "text-[#5f666d] hover:bg-[#f7f9fb] hover:text-[#191c1e]"
                    }`}
                  >
                    <SpaceIcon
                      iconKey={space.icon}
                      size={18}
                      className="shrink-0"
                    />
                    <span className="truncate">{space.name}</span>
                    {needsAttention ? (
                      <span
                        aria-hidden
                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#a04100]"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-3 px-1">
          <CreateSpaceModal variant="sidebar" label="New space" />
        </div>
      </nav>

      <div className="border-t border-[#e6e8ea] px-4 py-4">
        <div className="flex items-center gap-2.5">
          <HugeiconsIcon
            icon={UserCircleIcon}
            size={32}
            strokeWidth={1.6}
            className="shrink-0 text-[#5f666d]"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#191c1e]">
              {user.displayName}
            </p>
            {user.email ? (
              <p className="truncate text-xs text-[#9aa0a6]">{user.email}</p>
            ) : null}
          </div>
        </div>
        <form action={signOut} className="mt-3">
          <button className="w-full rounded-md border border-[#e6e8ea] bg-white px-3 py-2 text-sm font-semibold text-[#5f666d] transition hover:bg-[#f7f9fb] hover:text-[#191c1e]">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
