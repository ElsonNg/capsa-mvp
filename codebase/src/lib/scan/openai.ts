import OpenAI from "openai";

export type ExtractedClaim = {
  subject: string;
  predicate: string;
  value: string;
  unit: string | null;
  scope: string | null;
  evidence_text: string;
};

export type DetectedConflict = {
  primary_document_id: string;
  conflicting_document_id: string;
  severity: "low" | "medium" | "high";
  title: string;
  explanation: string;
  recommended_action: string;
};

export type ScanInputDocument = {
  id: string;
  title: string;
  authority_level: string;
  text: string;
};

export type ScanResult = {
  documents: { document_id: string; claims: ExtractedClaim[] }[];
  conflicts: DetectedConflict[];
};

const MAX_DOC_CHARS = 8000;

const SCAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    documents: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          document_id: { type: "string" },
          claims: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                subject: { type: "string" },
                predicate: { type: "string" },
                value: { type: "string" },
                unit: { type: ["string", "null"] },
                scope: { type: ["string", "null"] },
                evidence_text: { type: "string" },
              },
              required: [
                "subject",
                "predicate",
                "value",
                "unit",
                "scope",
                "evidence_text",
              ],
            },
          },
        },
        required: ["document_id", "claims"],
      },
    },
    conflicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          primary_document_id: { type: "string" },
          conflicting_document_id: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          title: { type: "string" },
          explanation: { type: "string" },
          recommended_action: { type: "string" },
        },
        required: [
          "primary_document_id",
          "conflicting_document_id",
          "severity",
          "title",
          "explanation",
          "recommended_action",
        ],
      },
    },
  },
  required: ["documents", "conflicts"],
} as const;

const SYSTEM_INSTRUCTIONS = `You are Capsa, a document health analyst for company knowledge bases.
You receive a set of documents that belong to one workspace. Do two things:

1. For every document, extract its concrete, checkable factual claims. Each claim must have:
   - subject: what the claim is about (e.g. "enterprise refunds")
   - predicate: the relationship (e.g. "allowed within")
   - value: the asserted value (e.g. "14")
   - unit: the unit if any (e.g. "days"), otherwise null
   - scope: the audience or condition it applies to (e.g. "enterprise customers"), otherwise null
   - evidence_text: the exact sentence or phrase from the document that supports the claim

2. Detect contradictions: two documents making incompatible claims about the same subject and scope
   (for example one says enterprise refunds within 14 days and another says 30 days).
   For each contradiction:
   - primary_document_id: the MORE authoritative document
   - conflicting_document_id: the LESS authoritative document
   Authority order, most to least authoritative: approved_policy > current_document > draft > archived.
   - severity: "high" when it materially changes a policy or customer-facing decision, otherwise "medium" or "low".
   - title: a short label for the conflict (e.g. "Enterprise refund window mismatch")
   - explanation: plain language, one or two sentences a non-expert can understand.
   - recommended_action: the concrete next step (e.g. "Quarantine the draft and keep the approved 14-day policy").

Only report genuine contradictions. If there are none, return an empty conflicts array.
Use the exact document_id values provided. Respond only with JSON matching the schema.`;

/**
 * Runs a single structured OpenAI pass over the space's documents, returning
 * extracted claims per document and any detected contradictions.
 */
export async function runOpenAiScan(
  documents: ScanInputDocument[],
): Promise<ScanResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const payload = documents.map((doc) => ({
    document_id: doc.id,
    title: doc.title,
    authority_level: doc.authority_level,
    text: doc.text.slice(0, MAX_DOC_CHARS),
  }));

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      { role: "system", content: SYSTEM_INSTRUCTIONS },
      {
        role: "user",
        content: `Documents to analyze:\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "capsa_scan",
        strict: true,
        schema: SCAN_SCHEMA,
      },
    },
  });

  const parsed = JSON.parse(response.output_text) as ScanResult;

  return {
    documents: Array.isArray(parsed.documents) ? parsed.documents : [],
    conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
  };
}
