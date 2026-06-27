import Exa from "exa-js";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ResearchRequest = { space_id?: string; query?: string };

type ExaItem = { title: string; url: string; snippet: string | null };

export async function POST(request: Request) {
  if (!process.env.EXA_API_KEY) {
    return NextResponse.json(
      { error: "EXA_API_KEY is not configured." },
      { status: 500 },
    );
  }

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

  const body = (await request.json().catch(() => ({}))) as ResearchRequest;
  const spaceId = body.space_id?.trim();
  const query = body.query?.trim();

  if (!spaceId || !query) {
    return NextResponse.json(
      { error: "space_id and query are required." },
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

  let items: ExaItem[];
  try {
    const exa = new Exa(process.env.EXA_API_KEY);
    const search = await exa.search(query, {
      type: "auto",
      numResults: 5,
      contents: { text: { maxCharacters: 800 } },
    });
    items = search.results.map((item) => ({
      title: item.title ?? item.url,
      url: item.url,
      snippet:
        "text" in item && typeof item.text === "string"
          ? item.text.trim().slice(0, 600)
          : null,
    }));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Exa search failed: ${error.message}`
            : "Exa search failed.",
      },
      { status: 502 },
    );
  }

  if (items.length === 0) {
    return NextResponse.json({ inserted: 0, results: [] });
  }

  const whyByUrl = await generateWhyItMatters(query, items);

  const rows = items.map((item) => ({
    space_id: spaceId,
    query,
    title: item.title,
    url: item.url,
    source: hostnameOf(item.url),
    snippet: item.snippet,
    why_it_matters: whyByUrl.get(item.url) ?? null,
  }));

  const { data: inserted, error } = await supabase
    .from("external_research_results")
    .insert(rows)
    .select(
      "id, query, title, url, source, snippet, why_it_matters, created_at",
    );

  if (error) {
    return NextResponse.json(
      { error: "Could not save research results." },
      { status: 500 },
    );
  }

  return NextResponse.json({ inserted: inserted?.length ?? 0, results: inserted });
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Generates a one-line "why it matters" per result. Best-effort: returns an
 * empty map on any failure so research still saves with null reasons.
 */
async function generateWhyItMatters(
  query: string,
  items: ExaItem[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (!process.env.OPENAI_API_KEY) {
    return result;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You help a company compare its internal policies against public sources. " +
            "For each search result, write one concise sentence on why it matters for the user's query. " +
            "Use the exact url values provided. Respond only with JSON matching the schema.",
        },
        {
          role: "user",
          content: `Query: ${query}\nResults:\n${JSON.stringify(
            items.map((item) => ({
              url: item.url,
              title: item.title,
              snippet: item.snippet,
            })),
            null,
            2,
          )}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "why_it_matters",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    url: { type: "string" },
                    why_it_matters: { type: "string" },
                  },
                  required: ["url", "why_it_matters"],
                },
              },
            },
            required: ["items"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as {
      items: { url: string; why_it_matters: string }[];
    };
    for (const item of parsed.items ?? []) {
      result.set(item.url, item.why_it_matters);
    }
  } catch {
    // Graceful: research saves without reasons.
  }

  return result;
}
