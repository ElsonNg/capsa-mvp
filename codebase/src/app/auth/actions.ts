"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function getSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

async function startGoogleOAuth(nextPath?: string) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect("/?error=missing-env");
  }

  const callbackUrl = new URL(`${await getSiteUrl()}/auth/callback`);
  if (nextPath) {
    callbackUrl.searchParams.set("next", nextPath);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
        scope:
          "openid email profile https://www.googleapis.com/auth/drive.readonly",
      },
    },
  });

  if (error || !data.url) {
    redirect("/?error=oauth-start");
  }

  redirect(data.url);
}

export async function signInWithGoogle() {
  await startGoogleOAuth();
}

/**
 * Re-runs Google consent (to grant/refresh Drive access) and returns the user
 * to `nextPath` after the OAuth callback. Invoked from the Connectors UI.
 */
export async function connectGoogleDrive(nextPath: string) {
  await startGoogleOAuth(nextPath || "/app/connectors");
}

export async function signOut() {
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
