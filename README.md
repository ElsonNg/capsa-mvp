# Capsa

Clean and processed data, for smarter agents.

Capsa is document health monitoring for company knowledge. It keeps company documents up to date, trusted, and ready for AI by scanning connected sources, extracting operational claims, detecting contradictions, and quarantining risky documents before humans or agents rely on them.

## Product Promise

Capsa keeps bad documents from becoming bad decisions.

For teams, Capsa is a document health dashboard. For AI agents, Capsa is the safe knowledge source they are allowed to read from.

## Demo Scenario

The MVP is built around a support refund policy conflict:

- Approved policy: enterprise refunds are allowed within 14 days.
- Draft policy: enterprise refunds are allowed within 30 days.
- Capsa detects the contradiction, explains the risk, quarantines the lower-authority draft, and answers agent questions using only the approved 14-day policy.

Expected agent-safe answer:

> No. The approved support policy limits enterprise refunds to 14 days. The 30-day draft was quarantined and was not used.

## Core Workflow

1. Sign in with Google.
2. Open the `Support` Space.
3. Import Google Docs or PDFs from Google Drive.
4. Run an OpenAI scan.
5. Extract claims from imported documents.
6. Detect a contradiction between approved and draft policies.
7. Auto-quarantine the risky draft document.
8. Run optional Exa external research.
9. Create an allowed agent connection.
10. Ask the agent a question and show that quarantined documents are excluded.

## Key Concepts

- **Spaces**: Curated pools of company knowledge, such as Support, Operations, Marketing, or a quarantined document area.
- **Document health**: Documents can be `healthy`, `conflict`, `needs_review`, `quarantined`, or `archived`.
- **Claims**: Small operational facts extracted from documents, such as refund windows, escalation deadlines, approval limits, or policy requirements.
- **Conflicts**: Contradictions between claims in the same Space.
- **Quarantine**: A document state that blocks risky documents from normal use and from allowed-agent retrieval.
- **Allowed agents**: Read-only agent connections that can search healthy documents only.

## Planned Stack

- **App**: Next.js
- **Auth and database**: Supabase
- **Login**: Supabase Auth with Google provider
- **Source connector**: Google Drive
- **AI analysis**: OpenAI
- **External research**: Exa
- **Deployment**: Vercel or another public app host

This repository currently includes the product and technical specs plus a static prototype in `index.html`. The production app described in `TECH_SPEC.md` is intended to be implemented as a Next.js application.

## Environment Variables

Create a local `.env.local` when the Next.js app is added:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
EXA_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Google OAuth scopes:

```text
openid
email
profile
https://www.googleapis.com/auth/drive.readonly
```

## Planned API Routes

- `GET /api/auth/session`
- `POST /api/sources/google-drive/import`
- `POST /api/scans/openai`
- `POST /api/research/exa`
- `POST /api/conflicts/:id/quarantine`
- `POST /api/agents`
- `POST /api/agents/search`

The agent search endpoint must only retrieve documents where `health_status = healthy` and must never use quarantined documents in answer generation.

## Data Model Summary

The Supabase schema is expected to include:

- `profiles`
- `spaces`
- `sources`
- `documents`
- `document_chunks`
- `claims`
- `conflicts`
- `quarantine_events`
- `external_research_results`
- `agent_connections`
- `agent_query_logs`

See `TECH_SPEC.md` for field-level details.

## Running the Current Prototype

The current prototype is a static HTML file:

```bash
open index.html
```

If you prefer serving it locally:

```bash
python3 -m http.server 3000
```

Then open `http://localhost:3000`.

## Build Notes

- OpenAI is required for the core demo: claim extraction, contradiction detection, conflict explanation, and agent-safe answer generation.
- Exa is required for the separate External Research tab and pitch story.
- Google Drive V1 supports Google Docs and PDFs only.
- High-severity contradictions involving lower-authority drafts should auto-quarantine the draft.
- Ambiguous model output should mark documents as `needs_review`, not quarantine them automatically.

## References

- `PRD.md`: product positioning, demo scope, judging alignment, and acceptance criteria.
- `TECH_SPEC.md`: architecture, data model, API routes, and implementation rules.
