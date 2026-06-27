import Image from "next/image";
import { signInWithGoogle, signOut } from "@/app/auth/actions";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

const healthStats = [
  { label: "Healthy docs", value: "2", tone: "text-[#087a53]" },
  { label: "Conflicts", value: "0", tone: "text-[#a04100]" },
  { label: "Quarantined", value: "0", tone: "text-[#ba1a1a]" },
];

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const envReady = hasSupabaseEnv();
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (user) {
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
                  <DocumentRow title="Enterprise Refund Policy - Approved" status="Healthy" />
                  <DocumentRow title="Enterprise Refund Policy - Draft" status="Ready to scan" />
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
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-lg border border-[#e6e8ea] bg-white shadow-sm lg:grid-cols-[1fr_420px]">
        <div className="p-8 sm:p-12">
          <div className="flex items-center gap-3">
            <Image
              src="/capsa-primary-logo-only.svg"
              alt="Capsa"
              width={38}
              height={38}
              priority
            />
            <span className="text-2xl font-bold text-[#191c1e]">Capsa</span>
          </div>

          <div className="mt-20 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a04100]">
              Document health monitoring
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#191c1e] sm:text-5xl">
              Keep bad documents from becoming bad decisions.
            </h1>
            <p className="mt-5 text-lg font-medium leading-8 text-[#5f666d]">
              Capsa keeps company knowledge up to date, trusted, and ready for
              AI by quarantining risky policy drift before agents rely on it.
            </p>
          </div>
        </div>

        <div className="border-t border-[#e6e8ea] bg-[#f7f9fb] p-8 sm:p-10 lg:border-l lg:border-t-0">
          <div className="rounded-lg border border-[#e6e8ea] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#191c1e]">
              Sign in to Capsa
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-[#5f666d]">
              Use Google through Supabase Auth to open the Support Space.
            </p>

            {params?.error ? (
              <div className="mt-5 rounded-md bg-[#ffdad6] p-3 text-sm font-semibold text-[#8c1d18]">
                {errorMessage(params.error)}
              </div>
            ) : null}

            {!envReady ? (
              <div className="mt-5 rounded-md border border-[#e2bfb0] bg-[#fff0e8] p-4 text-sm font-semibold text-[#5a4136]">
                Add Supabase URL and anon key to `codebase/.env` before
                signing in.
              </div>
            ) : null}

            <form action={signInWithGoogle} className="mt-6">
              <button
                disabled={!envReady}
                className="flex w-full items-center justify-center rounded-md bg-[#ff6a00] px-4 py-3 text-base font-bold text-white transition hover:bg-[#d95800] disabled:cursor-not-allowed disabled:bg-[#d4d8dc]"
              >
                Sign in with Google
              </button>
            </form>

            <p className="mt-5 text-xs font-medium leading-5 text-[#7a8087]">
              Google provider setup is completed in the Supabase dashboard.
              Redirect back to `/auth/callback` for local and Vercel URLs.
            </p>
          </div>
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

function errorMessage(error: string) {
  if (error === "missing-env") {
    return "Supabase environment variables are missing.";
  }

  if (error === "auth-callback") {
    return "Supabase could not complete the auth callback.";
  }

  if (error === "oauth-start") {
    return "Supabase could not start Google sign-in.";
  }

  return "Authentication could not be completed.";
}
