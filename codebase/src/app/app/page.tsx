import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DriveTestPanel } from "./drive-test-panel";

const healthStats = [
  { label: "Healthy docs", value: "2", tone: "text-[#087a53]" },
  { label: "Conflicts", value: "0", tone: "text-[#a04100]" },
  { label: "Quarantined", value: "0", tone: "text-[#ba1a1a]" },
];

export default async function AppPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    redirect("/sign-in");
  }

  const displayName =
    user.user_metadata?.full_name || user.user_metadata?.name || user.email;

  return (
    <main className="min-h-screen bg-[#f7f9fb]">
      <header className="border-b border-[#e2bfb0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Image
              src="/capsa-primary-logo-only.svg"
              alt="Capsa"
              width={32}
              height={32}
              priority
            />
            <span className="text-xl font-bold text-[#191c1e]">Capsa</span>
          </div>
          <form action={signOut}>
            <button className="rounded-md border border-[#e2bfb0] bg-white px-4 py-2 text-sm font-semibold text-[#5a4136] transition hover:bg-[#fff0e8]">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-[#e6e8ea] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a04100]">
            Signed in
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[#191c1e]">
            {displayName}
          </h1>
          <p className="mt-2 break-words text-sm font-medium text-[#5f666d]">
            {user.email}
          </p>
          <div className="mt-6 rounded-md bg-[#fff0e8] p-4 text-sm font-medium text-[#5a4136]">
            Google Auth is connected. The next phase can add Drive import and
            document scanning.
          </div>
          <Link
            href="/app/smoke"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[#191c1e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#34393e]"
          >
            LLM smoke test
          </Link>
        </aside>

        <div className="space-y-6">
          <section className="rounded-lg border border-[#e6e8ea] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a04100]">
                  Support Space
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[#191c1e]">
                  Document health dashboard
                </h2>
                <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-[#5f666d]">
                  Capsa will import support policies, extract claims, detect
                  stale contradictions, and keep quarantined drafts away from
                  allowed agents.
                </p>
              </div>
              <span className="rounded-full bg-[#dff6eb] px-3 py-1 text-sm font-bold text-[#087a53]">
                Healthy
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {healthStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-md border border-[#e6e8ea] bg-[#f7f9fb] p-4"
                >
                  <div className={`text-3xl font-semibold ${stat.tone}`}>
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#5f666d]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[#e6e8ea] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-[#191c1e]">
                Demo documents
              </h3>
              <div className="mt-4 space-y-3">
                <DocumentRow
                  title="Enterprise Refund Policy - Approved"
                  status="Healthy"
                />
                <DocumentRow
                  title="Enterprise Refund Policy - Draft"
                  status="Ready to scan"
                />
              </div>
            </div>

            <div className="rounded-lg border border-[#e6e8ea] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-[#191c1e]">
                Allowed agent access
              </h3>
              <p className="mt-3 text-sm font-medium leading-6 text-[#5f666d]">
                Phase 1 proves authentication. Later phases will add API-key
                protected agent search that only reads healthy documents.
              </p>
              <div className="mt-5 rounded-md border border-dashed border-[#e2bfb0] bg-[#fff0e8] p-4 text-sm font-semibold text-[#5a4136]">
                Healthy documents only
              </div>
            </div>
          </section>

          <DriveTestPanel />
        </div>
      </section>
    </main>
  );
}

function DocumentRow({ title, status }: { title: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-[#e6e8ea] p-3">
      <span className="text-sm font-semibold text-[#191c1e]">{title}</span>
      <span className="shrink-0 rounded-full bg-[#f2f4f6] px-2.5 py-1 text-xs font-bold text-[#5f666d]">
        {status}
      </span>
    </div>
  );
}
