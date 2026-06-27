import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { hashApiKey } from "@/lib/agents/keys";

export const runtime = "nodejs";

type SearchRequest = { api_key?: string; question?: string };

type DocRow = { id: string; title: string; health_status: string };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SearchRequest;
  const apiKey = body.api_key?.trim();
  const question = body.question?.trim();

  if (!apiKey || !question) {
    return NextResponse.json(
      { error: "api_key and question are required." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server is not configured for agent search." },
      { status: 500 },
    );
  }

  // Authenticate by API key hash — no user session is involved.
  const { data: connection } = await supabase
    .from("agent_connections")
    .select("id, space_id, status")
    .eq("api_key_hash", hashApiKey(apiKey))
    .maybeSingle();

  if (!connection || connection.status !== "active") {
    return NextResponse.json(
      { error: "Invalid or revoked API key." },
      { status: 401 },
    );
  }

  const { data: docData } = await supabase
    .from("documents")
    .select("id, title, health_status")
    .eq("space_id", connection.space_id);
  const documents = (docData ?? []) as DocRow[];

  const healthy = documents.filter((doc) => doc.health_status === "healthy");
  const blocked = documents.filter((doc) => doc.health_status !== "healthy");

  // Only healthy documents are ever read. Quarantined content is never fetched.
  const healthyIds = healthy.map((doc) => doc.id);
  let contextByDoc = new Map<string, string>();
  if (healthyIds.length > 0) {
    const { data: chunkData } = await supabase
      .from("document_chunks")
      .select("document_id, chunk_index, content")
      .in("document_id", healthyIds)
      .order("chunk_index", { ascending: true });

    contextByDoc = buildContext((chunkData ?? []) as ChunkRow[]);
  }

  const answer = await generateAnswer(question, healthy, contextByDoc);

  // Always log the query.
  await supabase.from("agent_query_logs").insert({
    agent_connection_id: connection.id,
    space_id: connection.space_id,
    question,
    answer,
    source_document_ids: healthyIds,
    blocked_document_ids: blocked.map((doc) => doc.id),
  });

  return NextResponse.json({
    answer,
    sources: healthy.map((doc) => ({ id: doc.id, title: doc.title })),
    blocked: blocked.map((doc) => ({ id: doc.id, title: doc.title })),
  });
}

type ChunkRow = { document_id: string; content: string };

function buildContext(chunks: ChunkRow[]): Map<string, string> {
  const byDoc = new Map<string, string>();
  for (const chunk of chunks) {
    byDoc.set(
      chunk.document_id,
      (byDoc.get(chunk.document_id) ?? "") + chunk.content + "\n",
    );
  }
  return byDoc;
}

const SYSTEM_PROMPT = `You are a support assistant that answers strictly from the company's APPROVED, healthy documents provided below.
Rules:
- Use only the provided documents. Do not use outside knowledge or guess.
- If the documents do not contain the answer, say you don't have an approved source for it.
- Quarantined or unapproved drafts have been excluded and must not be used. When relevant, you may note that an unapproved draft was excluded.
- Be concise and direct.`;

async function generateAnswer(
  question: string,
  healthy: DocRow[],
  contextByDoc: Map<string, string>,
): Promise<string> {
  if (healthy.length === 0) {
    return "I don't have any approved documents to answer that question.";
  }

  if (!process.env.OPENAI_API_KEY) {
    return "The answering service is not configured.";
  }

  const context = healthy
    .map((doc) => {
      const text = (contextByDoc.get(doc.id) ?? "").slice(0, 6000);
      return `Document: ${doc.title}\n${text}`;
    })
    .join("\n\n---\n\n");

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Approved documents:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });
    return response.output_text.trim() || "I couldn't produce an answer.";
  } catch {
    return "The answering service is temporarily unavailable.";
  }
}
