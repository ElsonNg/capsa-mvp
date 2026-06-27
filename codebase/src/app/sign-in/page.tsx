import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signInWithGoogle } from "@/app/auth/actions";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

export default async function SignInPage({
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
    redirect("/app");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-md rounded-lg border border-[#e6e8ea] bg-white p-6 shadow-sm">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/capsa-primary-logo-only.svg"
            alt="Capsa"
            width={38}
            height={38}
            priority
          />
          <span className="text-2xl font-bold text-[#191c1e]">Capsa</span>
        </Link>

        <h1 className="mt-10 text-3xl font-semibold text-[#191c1e]">
          Sign in to Capsa
        </h1>
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
            Add Supabase URL and publishable key to `codebase/.env` before
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
          Google provider setup is completed in the Supabase dashboard. Redirect
          back to `/auth/callback` for local and Vercel URLs.
        </p>
      </section>
    </main>
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
