import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSpacesForCurrentUser } from "@/lib/spaces/queries";
import { Sidebar } from "./components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    redirect("/sign-in");
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "Account";

  const spaces = await getSpacesForCurrentUser();

  return (
    <div className="flex min-h-screen bg-[#f7f9fb]">
      <Sidebar
        spaces={spaces}
        user={{ displayName, email: user.email ?? null }}
      />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
