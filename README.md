# Capsa

Clean and processed data, for smarter agents.

Capsa is a document health platform for company knowledge. It connects to a team's source documents, extracts operational claims with OpenAI, detects contradictions, quarantines risky drafts, and gives allowed agents access to healthy documents only.

## Links

- [Live demo](https://capsa-mvp.vercel.app/)
- [Presentation](https://canva.link/pot0ey5yi6f5ioi)

## Why Capsa Exists

Company knowledge gets stale long before anyone notices. Old policies stay in Drive, drafts look official, and AI agents can turn the wrong document into an automated customer answer.

Capsa keeps bad documents from becoming bad decisions.

## Product Demo

The completed demo follows a support refund-policy conflict:

- The approved support policy says enterprise refunds are allowed within `14 days`.
- A lower-authority draft says enterprise refunds are allowed within `30 days`.
- Capsa detects the contradiction, explains the risk, and auto-quarantines the draft.
- An allowed agent answers from healthy documents only.

Required safe answer:

> No. The approved support policy limits enterprise refunds to 14 days. The 30-day draft was quarantined and was not used.

## What It Does

- Google sign-in with Supabase Auth.
- Spaces for organizing monitored knowledge, including the `Support` Space.
- Google Drive import for Google Docs and PDFs.
- Document explorer with health states: healthy, conflict, needs review, and quarantined.
- OpenAI-powered claim extraction, contradiction detection, conflict explanation, and agent-safe answer generation.
- Authority-aware quarantine rules that block lower-authority drafts when high-severity conflicts are found.
- External Research tab powered by Exa for public policy and market context.
- Allowed-agent connections with one-time API credentials.
- Agent search that retrieves healthy documents only and logs every query.

## Core Workflow

1. Sign in with Google.
2. Open the `Support` Space.
3. Import support documents from Google Drive.
4. Run an OpenAI scan.
5. Review the extracted claims and refund-policy conflict.
6. Quarantine the lower-authority draft.
7. Run optional Exa external research.
8. Create an allowed agent.
9. Ask the agent whether an enterprise customer can get a refund after 21 days.

## Product Principles

- Healthy documents are the only source for agent answers.
- Quarantined documents are never used in retrieval or answer generation.
- OpenAI output is structured and auditable through source evidence.
- Exa research informs context, but does not automatically quarantine documents.
- Raw agent API keys are shown once; only hashes are stored.

## Stack

- Next.js
- Supabase Auth and Postgres
- Google Drive API
- OpenAI
- Exa
- Vercel

The production app lives in [`codebase`](./codebase).

## Run Locally

```bash
cd codebase
pnpm install
pnpm dev
```

Create `codebase/.env` from `codebase/.env.example` and fill in the required local credentials. Do not commit real secrets.

Useful checks:

```bash
cd codebase
pnpm lint
pnpm build
```

## Key Routes

- `/` - product landing page
- `/sign-in` - Google sign-in
- `/app` - Spaces dashboard
- `/app/spaces/:spaceId` - document health workspace
- `/app/spaces/:spaceId/research` - Exa external research
- `/app/spaces/:spaceId/agents` - allowed-agent setup and test panel

Important APIs:

- `POST /api/sources/google-drive/import`
- `POST /api/scans/openai`
- `POST /api/research/exa`
- `POST /api/agents`
- `POST /api/agents/search`

## Repository

- [`codebase`](./codebase) - Next.js application
- [`codebase/supabase/migrations`](./codebase/supabase/migrations) - Supabase schema
- [`PRD.md`](./PRD.md) - product requirements
- [`TECH_SPEC.md`](./TECH_SPEC.md) - implementation specification
- [`submission`](./submission) - hackathon submission assets
