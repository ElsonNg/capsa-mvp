# Codex Guide for Capsa

This file guides Codex and other coding agents working in this repository.

## Project Context

Capsa is a hackathon MVP for document health monitoring for company knowledge.

The required demo path is:

1. Connect Google Drive.
2. Import support documents into the `Support` Space.
3. Use OpenAI to extract claims and detect a refund-policy contradiction.
4. Auto-quarantine the lower-authority draft.
5. Let an allowed agent answer only from healthy documents.

Primary demo facts:

- Approved policy: enterprise refunds are allowed within `14 days`.
- Draft policy: enterprise refunds are allowed within `30 days`.
- Required safe answer: "No. The approved support policy limits enterprise refunds to 14 days. The 30-day draft was quarantined and was not used."

Read `README.md`, `PRD.md`, and `TECH_SPEC.md` before making major product or architecture changes.

## Current Repo Shape

- `README.md`: product overview and build notes.
- `PRD.md`: product requirements and judging alignment.
- `TECH_SPEC.md`: architecture, data model, API routes, and demo script.
- `index.html`: static prototype.
- `codebase/`: intended app implementation area.
- `submission/`: intended hackathon submission assets.

The production app described in the spec should be implemented as a Next.js app, backed by Supabase, OpenAI, Exa, and Google Drive.

## Installed Tools and Dependencies

Assume the local environment has:

- `pnpm`
- `exajs` installed with pnpm
- Vercel CLI
- Supabase CLI

Prefer `pnpm` commands for Node dependency management.

Use the installed Exa JavaScript SDK rather than adding a duplicate Exa client dependency.

## Secrets and Environment Rules

Secrets are local only.

The user has placed OpenAI and Exa API keys in:

```text
codebase/.env
```

Never print, copy, commit, hard-code, or inline any secret value from `.env` files.

Do not read `.env` files unless absolutely necessary, and if you must inspect them, only check key names without showing values.

Use environment variables for all credentials:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `EXA_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Recommended OpenAI model default:

```text
OPENAI_MODEL=gpt-4.1-mini
```

Do not commit real `.env`, `.env.local`, Supabase service role keys, OpenAI keys, Exa keys, Google OAuth secrets, generated agent API keys, Vercel credentials, or Supabase local state.

If an example env file is needed, create `.env.example` with empty placeholder values only.

## Implementation Priorities

Optimize for the two-minute hackathon demo.

Build the smallest complete version of the required path before adding polish:

1. Google sign-in through Supabase Auth.
2. Seed or create the `Support` Space.
3. Import Google Docs and PDFs from Drive.
4. Store document metadata, chunks, claims, conflicts, quarantine events, Exa results, and agent connections in Supabase.
5. Run the OpenAI scan and store structured claims.
6. Detect `14 days` versus `30 days` as a high-severity conflict.
7. Auto-quarantine the lower-authority draft.
8. Show the conflict explanation and quarantine event in the UI.
9. Run Exa research in a separate External Research tab.
10. Create an allowed agent and return one-time credentials.
11. Answer agent questions from healthy documents only.

Avoid broad connector work that is out of scope for V1: SharePoint, Slack, Notion, Sheets, Slides, images, folder sync automation, billing, and advanced RBAC.

## Data Model Rules

Use Supabase Postgres tables from `TECH_SPEC.md`:

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

Required enums:

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

Authority order:

1. `approved_policy`
2. `current_document`
3. `draft`
4. `archived`

High-severity contradictions with a lower-authority draft should auto-quarantine the draft. Ambiguous model output should become `needs_review`, not automatic quarantine.

## API Contract Rules

Planned routes:

- `GET /api/auth/session`
- `POST /api/sources/google-drive/import`
- `POST /api/scans/openai`
- `POST /api/research/exa`
- `POST /api/conflicts/:id/quarantine`
- `POST /api/agents`
- `POST /api/agents/search`

Agent search rules are non-negotiable:

- Reject revoked or unknown API keys.
- Store only hashes of agent API keys.
- Show raw agent API keys once.
- Only retrieve documents where `health_status = healthy`.
- Never use quarantined documents in retrieval or answer generation.
- Log every query in `agent_query_logs`.

## OpenAI Usage

OpenAI is mandatory for:

- claim extraction,
- contradiction detection,
- plain-language conflict explanation,
- agent-safe answer generation.

Keep model output structured. Required claim shape:

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

## Exa Usage

Exa is mandatory for a separate External Research tab.

Use Exa for public policy or market context, not for automatic quarantine decisions in V1.

Store:

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

## UI Guidance

The app should feel like an operational dashboard, not a marketing landing page.

Prioritize:

- clear Spaces overview,
- readable Document Explorer,
- explanation-first conflict review,
- simple status language,
- tasteful quarantine and allowed-agent flow.

Use plain terms in the UI:

- healthy documents,
- conflict,
- needs review,
- quarantine,
- allowed agents,
- source evidence.

Avoid jargon in core demo screens.

## Verification

When implementing features, run the smallest relevant checks available.

Suggested checks once the Next.js app exists:

```bash
pnpm lint
pnpm test
pnpm build
```

For Supabase work, prefer local migrations and seed scripts. Keep generated local Supabase state out of git.

For Vercel deployment work, use environment variables configured in Vercel rather than committing secrets.

## Git Hygiene

This repository may not always be initialized as a Git repo locally. Still write files as if everything could be committed.

Before finalizing changes:

- ensure no secret values were added to tracked files,
- keep `.env` files ignored,
- keep changes focused on the requested work,
- do not delete user work,
- do not run destructive git commands unless explicitly asked.

