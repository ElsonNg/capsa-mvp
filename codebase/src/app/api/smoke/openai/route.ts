import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const { prompt } = (await request.json().catch(() => ({}))) as {
    prompt?: string;
  };

  if (!prompt?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Prompt is required." },
      { status: 400 },
    );
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt,
    });

    return NextResponse.json({
      ok: true,
      response: {
        model: response.model,
        text: response.output_text,
        id: response.id,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "OpenAI smoke test failed.",
      },
      { status: 500 },
    );
  }
}
