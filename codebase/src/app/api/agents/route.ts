import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateApiKey, hashApiKey } from "@/lib/agents/keys";

export const runtime = "nodejs";

type CreateAgentRequest = {
  space_id?: string;
  agent_name?: string;
  purpose?: string;
};

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Workspace storage is not configured." },
      { status: 500 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateAgentRequest;
  const spaceId = body.space_id?.trim();
  const agentName = body.agent_name?.trim();
  const purpose = body.purpose?.trim() || null;

  if (!spaceId || !agentName) {
    return NextResponse.json(
      { error: "space_id and agent_name are required." },
      { status: 400 },
    );
  }

  // RLS scopes this to the owner.
  const { data: space } = await supabase
    .from("spaces")
    .select("id")
    .eq("id", spaceId)
    .maybeSingle();
  if (!space) {
    return NextResponse.json({ error: "Space not found." }, { status: 404 });
  }

  const rawKey = generateApiKey();

  const { data, error } = await supabase
    .from("agent_connections")
    .insert({
      space_id: spaceId,
      agent_name: agentName,
      purpose,
      api_key_hash: hashApiKey(rawKey),
      access_level: "read_only",
      visibility_rule: "healthy_documents_only",
      status: "active",
    })
    .select("id, agent_name, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Could not create the agent." },
      { status: 500 },
    );
  }

  const origin = new URL(request.url).origin;
  const searchUrl = `${origin}/api/agents/search`;

  return NextResponse.json({
    id: data.id,
    agent_name: data.agent_name,
    // Shown once — the raw key is never stored or retrievable again.
    api_key: rawKey,
    search_url: searchUrl,
    curl: [
      `curl -X POST ${searchUrl} \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '{"api_key":"${rawKey}","question":"Can enterprise customers get a refund after 20 days?"}'`,
    ].join("\n"),
  });
}
