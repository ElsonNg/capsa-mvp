import Exa from "exa-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.EXA_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "EXA_API_KEY is not configured." },
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
    const exa = new Exa(process.env.EXA_API_KEY);
    const result = await exa.search(prompt, {
      type: "auto",
      numResults: 3,
      contents: {
        text: { maxCharacters: 800 },
      },
      outputSchema: {
        type: "text",
        description: "Give a concise answer using the search results.",
      },
    });

    return NextResponse.json({
      ok: true,
      response: {
        answer:
          typeof result.output?.content === "string"
            ? result.output.content
            : null,
        resolvedSearchType: result.resolvedSearchType,
        results: result.results.map((item) => ({
          title: item.title,
          url: item.url,
          text: "text" in item ? item.text : undefined,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Exa smoke test failed.",
      },
      { status: 500 },
    );
  }
}
