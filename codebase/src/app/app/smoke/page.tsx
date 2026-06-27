import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SmokeTestClient } from "./smoke-test-client";

export default async function SmokePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb]">
      <header className="border-b border-[#e2bfb0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/app" className="flex items-center gap-3">
            <Image
              src="/capsa-primary-logo-only.svg"
              alt="Capsa"
              width={32}
              height={32}
              priority
            />
            <span className="text-xl font-bold text-[#191c1e]">Capsa</span>
          </Link>
          <form action={signOut}>
            <button className="rounded-md border border-[#e2bfb0] bg-white px-4 py-2 text-sm font-semibold text-[#5a4136] transition hover:bg-[#fff0e8]">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a04100]">
              Throwaway test
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#191c1e]">
              LLM smoke test
            </h1>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-md border border-[#e6e8ea] bg-white px-4 py-2 text-sm font-bold text-[#191c1e] transition hover:bg-[#f2f4f6]"
          >
            Back to dashboard
          </Link>
        </div>

        <SmokeTestClient />
      </section>
    </main>
  );
}
