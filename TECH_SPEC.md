# Capsa Technical Spec

Last updated: 27 June 2026

## Purpose

Build a real hackathon MVP for Capsa: document health monitoring for company knowledge.

Capsa must prove one complete path: connect Google Drive, import support documents, use OpenAI to detect a refund-policy contradiction, auto-quarantine the bad draft, and let an allowed agent answer only from healthy documents.

Primary demo:

- Approved policy says enterprise refunds are allowed within `14 days`.
- Draft policy says enterprise refunds are allowed within `30 days`.
- Capsa flags the contradiction, explains it, quarantines the draft, and answers the 21-day refund question using the approved policy only.

## Architecture

- App: Next.js.
- Auth/database: Supabase.
- Login: Supabase Auth with Google provider.
- Source connector: Google Drive only.
- Internal document intelligence: OpenAI.
- External research: Exa.
- Hosting: Vercel or equivalent public app host.

Runtime flow:

1. User signs in with Google.
2. User imports Google Docs and PDFs from Drive into the `Support` Space.
3. Supabase stores documents, chunks, claims, conflicts, quarantine events, Exa results, and agent connections.
4. OpenAI extracts claims, detects contradictions, explains conflicts, and writes safe agent answers.
5. Exa powers a separate External Research tab for public policy evidence.
6. Allowed agents call an API-key protected endpoint that searches healthy documents only.

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `EXA_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Defaults:

- `OPENAI_MODEL=gpt-4.1-mini`
- Google OAuth scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.readonly`

## Data Model

Use Supabase Postgres. Store timestamps as `created_at` unless noted.

| Table | Required fields |
| --- | --- |
| `profiles` | `id`, `email`, `full_name` |
| `spaces` | `id`, `owner_id`, `name`, `purpose`, `health_status` |
| `sources` | `id`, `space_id`, `type`, `name`, `status`, `last_sync_at` |
| `documents` | `id`, `space_id`, `source_id`, `google_file_id`, `title`, `mime_type`, `source_url`, `modified_at`, `health_status`, `authority_level`, `quarantine_reason` |
| `document_chunks` | `id`, `document_id`, `chunk_index`, `content` |
| `claims` | `id`, `document_id`, `subject`, `predicate`, `value`, `unit`, `scope`, `evidence_text` |
| `conflicts` | `id`, `space_id`, `primary_document_id`, `conflicting_document_id`, `title`, `severity`, `status`, `explanation`, `recommended_action` |
| `quarantine_events` | `id`, `space_id`, `document_id`, `conflict_id`, `reason`, `actor` |
| `external_research_results` | `id`, `space_id`, `query`, `title`, `url`, `source`, `snippet`, `why_it_matters` |
| `agent_connections` | `id`, `space_id`, `agent_name`, `purpose`, `api_key_hash`, `access_level`, `visibility_rule`, `status` |
| `agent_query_logs` | `id`, `agent_connection_id`, `space_id`, `question`, `answer`, `source_document_ids`, `blocked_document_ids` |

Required enum values:

- `sources.type`: `google_drive`
- `sources.status`: `connected | syncing | failed`
- `documents.health_status`: `healthy | conflict | needs_review | quarantined`
- `documents.authority_level`: `approved_policy | current_document | draft | archived`
- `spaces.health_status`: `healthy | degraded | needs_review`
- `conflicts.severity`: `low | medium | high`
- `conflicts.status`: `open | quarantined | resolved`
- `quarantine_events.actor`: `capsa_auto | user`
- `agent_connections.access_level`: `read_only`
- `agent_connections.visibility_rule`: `healthy_documents_only`
- `agent_connections.status`: `active | revoked`

Required seed:

- Space: `Support`
- Documents: `Enterprise Refund Policy - Approved`, `Enterprise Refund Policy - Draft`

## Core Flows

Sign in:

1. User signs in with Google through Supabase Auth.
2. App creates or updates `profiles`.
3. App opens the `Support` Space.

Google Drive import:

1. User clicks `Add Source`.
2. User selects Google Drive files.
3. App imports Google Docs as plain text and PDFs as extracted text.
4. App stores document metadata and chunks in Supabase.
5. Imported documents start as `healthy`, unless marked as `draft` or `archived`.

OpenAI scan:

1. User clicks `Run OpenAI scan`.
2. App sends document chunks to OpenAI.
3. OpenAI returns structured claims.
4. App stores claims.
5. App compares related claims in the same Space.
6. App creates a high-severity conflict for `14 days` vs `30 days`.
7. App auto-quarantines the lower-authority draft.
8. App logs the quarantine event.

External research:

1. User opens `External Research`.
2. User enters a policy question.
3. App calls Exa.
4. App stores and displays result title, URL, snippet, and why it matters.
5. Exa does not decide quarantine in v1.

Allowed agent:

1. User creates an allowed agent for the `Support` Space.
2. App creates an API key and stores only the hash.
3. UI shows the raw API key once with endpoint and JSON snippet.
4. Agent calls `POST /api/agents/search`.
5. Endpoint searches healthy documents only.
6. OpenAI generates an answer from allowed documents.
7. App logs the query, sources used, and blocked documents.

## API Routes

| Route | Purpose |
| --- | --- |
| `GET /api/auth/session` | Return signed-in user and Supabase session. |
| `POST /api/sources/google-drive/import` | Import selected Google Docs/PDFs into a Space. |
| `POST /api/scans/openai` | Run claim extraction, conflict detection, and quarantine rules. |
| `POST /api/research/exa` | Run external research and store Exa results. |
| `POST /api/conflicts/:id/quarantine` | Manually quarantine the conflicting document. |
| `POST /api/agents` | Create an allowed agent and return one-time API credentials. |
| `POST /api/agents/search` | Answer an agent question using healthy documents only. |

Route contracts:

- `POST /api/sources/google-drive/import` request: `space_id`, `file_ids`.
- `POST /api/scans/openai` request: `space_id`; response: `claims_created`, `conflicts_created`, `documents_quarantined`.
- `POST /api/research/exa` request: `space_id`, `query`; response: `results`.
- `POST /api/agents` request: `space_id`, `agent_name`, `purpose`; response: `agent_connection`, `api_key`, `endpoint`.
- `POST /api/agents/search` headers: `Authorization: Bearer <agent_api_key>`; request: `space_id`, `question`; response: `answer`, `source_documents`, `blocked_documents`.

Agent endpoint rules:

- Reject revoked or unknown API keys.
- Only retrieve documents where `health_status = healthy`.
- Never use quarantined documents in retrieval or answer generation.
- Log every query in `agent_query_logs`.

## OpenAI Flow

OpenAI is mandatory for the core demo.

Use OpenAI for:

- extracting claims from imported documents,
- detecting contradictions between claims,
- writing plain-language conflict explanations,
- generating agent-safe answers.

Required claim shape:

- `subject`
- `predicate`
- `value`
- `unit`
- `scope`
- `evidence_text`

Required conflict shape:

- `conflict_detected`
- `severity`
- `explanation`
- `recommended_action`
- `primary_document_id`
- `conflicting_document_id`

Required demo answer:

> No. The approved support policy limits enterprise refunds to 14 days. The 30-day draft was quarantined and was not used.

## Exa Flow

Exa is mandatory, but separate from quarantine.

Use Exa for an `External Research` tab that finds public policy or market context. Store each result in `external_research_results`.

Required Exa result shape:

- `query`
- `title`
- `url`
- `source`
- `snippet`
- `why_it_matters`

Demo queries:

- `enterprise refund policy SaaS 14 days 30 days`
- `consumer refund policy Singapore online services`
- `marketing claims policy AI software`

## Google Drive Import

V1 supports:

- Google Docs.
- PDFs.

V1 does not support:

- Google Sheets.
- Slides.
- images.
- folder sync automation.
- SharePoint.
- Slack.
- Notion.

Import rules:

- Google Docs: export as plain text through Drive API.
- PDFs: download file bytes and extract text server-side.
- If PDF extraction fails, mark the document `needs_review` and show an import error.

## Document Health Rules

Authority order:

1. approved policy
2. current document
3. draft
4. archived

Refund demo rule:

- If an approved policy says `14 days` and a draft says `30 days` for the same enterprise refund window, create a high-severity conflict.
- Auto-quarantine the draft.
- Keep the approved policy healthy.

General rule:

- High-severity contradiction plus lower-authority draft means auto-quarantine.
- Ambiguous model output means `needs_review`, not quarantine.
- Quarantined documents are hidden from allowed-agent search.

## Agent Access

Allowed agents are read-only.

Each connection includes:

- agent name,
- purpose,
- Space,
- one-time API key,
- endpoint URL,
- read-only access,
- healthy-documents-only visibility,
- query logging.

Security rules:

- Store only API key hashes.
- Show raw API key once.
- Revoke by setting `agent_connections.status = revoked`.

## Demo Script

1. Sign in with Google.
2. Open `Support`.
3. Import `Enterprise Refund Policy - Approved` and `Enterprise Refund Policy - Draft` from Drive.
4. Run OpenAI scan.
5. Show extracted `14 days` and `30 days` claims.
6. Show conflict explanation.
7. Show auto-quarantine event for the draft.
8. Open External Research and run an Exa query.
9. Create an allowed agent.
10. Ask: `Can an enterprise customer get a refund after 21 days?`
11. Show the safe 14-day answer.
12. Show that the quarantined draft was blocked.

## Acceptance Criteria

- Google sign-in works through Supabase.
- Google Docs and PDFs import from Drive.
- Imported documents persist in Supabase.
- OpenAI scan extracts claims.
- Refund conflict is detected.
- Draft policy is auto-quarantined.
- Quarantine event is visible.
- Exa research runs and displays stored results.
- Allowed agent credentials are generated.
- `POST /api/agents/search` works with the agent API key.
- Agent answer uses healthy documents only.
- Quarantined documents are excluded.
- App is deployed to a public URL.

## Out Of Scope

- SharePoint, Slack, and Notion connectors.
- Google Sheets, Slides, image import, and folder sync.
- Multi-tenant org admin.
- Billing.
- Advanced RBAC.
- Full review workflow.
- Production audit exports.
- Full MCP server implementation.
