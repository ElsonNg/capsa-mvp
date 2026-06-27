# Capsa PRD

Last updated: 27 June 2026

## Product

Capsa is document health monitoring for company knowledge.

Tagline: Clean and processed data, for smarter agents

One-liner: Capsa keeps company knowledge up to date, trusted, and ready for AI.

## Executive Summary

Companies are preparing internal knowledge for AI, but their documents are often stale, duplicated, and contradictory. That problem already slows down humans. AI agents make it riskier because they can turn a bad document into an automated wrong answer.
Capsa monitors document health across company knowledge Spaces. It scans connected sources, extracts atomic claims, detects contradictions, explains why a document is risky, and quarantines degraded documents before humans or agents rely on them.

The hackathon demo should prove one clear workflow: a support or operations policy conflict is detected, explained, quarantined, and excluded from an allowed agent answer.

## Problem

Organizations have document debt:

- Policies change, but old versions remain in Drive, SharePoint, Notion, or wikis.
- Support macros drift from approved policy.
- Operations docs contradict newer procedures.
- Marketing claims may conflict with public rules or platform policies.
- Teams trust whichever document they find first.

Traditional knowledge bases store documents, but they do not continuously judge whether those documents are safe to trust. Better search and better RAG ranking still operate over a polluted corpus. Capsa works earlier: it monitors the source knowledge before it becomes agent ground truth.

## Target Users

- Support leaders who need agents to answer from approved policies.
- Operations teams that own internal procedures and customer-impacting workflows.
- AI platform teams deploying internal agents.
- Compliance, HR, IT, and security teams that need visibility into stale or conflicting policy docs.
- Business owners who want cleaner company knowledge before adopting AI.

## Core Product Promise

Capsa keeps bad documents from becoming bad decisions.

For teams, Capsa is a document health dashboard. For AI agents, Capsa is the safe knowledge source they are allowed to read from.

## Key Concepts

### Spaces

Spaces are curated pools of company knowledge. A Space can represent Support, Operations, Marketing, Engineering, or a quarantined document area.

Healthy documents remain visible in the Space. Risky documents are marked as conflict, needs review, or quarantined.

### Document Health

Each document has a health state:

- Healthy: safe to use.
- Conflict: contradicts another relevant claim.
- Needs review: suspicious, but not safe to quarantine automatically.
- Quarantined: blocked from normal use and hidden from allowed agents.
- Archived: retained for history but not part of active ground truth.

### Claims

Capsa extracts small operational claims from documents, such as refund windows, escalation deadlines, approval limits, or policy requirements.

### External Policy Scan

For domains like Support or Marketing, Capsa can use Exa to find relevant public policies, public help-center pages, regulations, or platform rules. OpenAI then compares those external references against internal documents.

## Demo Scope

The demo should focus on one crisp before-and-after:

1. Open the Spaces overview.
2. Open Support or Operations Space.
3. Add a source such as Google Drive or SharePoint.
4. Show documents in the Document Explorer.
5. Run an AI scan.
6. Show OpenAI extracting claims and detecting a contradiction.
7. Optionally show Exa external policy evidence.
8. Quarantine the risky document.
9. Share the Space with an allowed agent.
10. Ask the agent a question.
11. Show that the agent answers from healthy documents only.

## Sponsor Technology

### OpenAI

OpenAI should be central to the product:

- Extract atomic claims from internal documents.
- Classify contradictions and stale policy drift.
- Explain why a document was flagged in plain English.
- Generate an agent-safe answer using only healthy documents.

### Exa

Exa should be used as an external evidence source:

- Search public policies and country/domain-specific rules.
- Find relevant public help-center pages or platform policies.
- Provide citation cards that Capsa can compare with internal documents.

### Codex

Codex is part of the build story:

- Solo builder velocity.
- Rapid UI iteration.
- Fast PRD, technical spec, and implementation loops.

## Judging Alignment

### Proof of Work - Functionality: 25%

The app must show a real demonstrable flow:

- scan documents
- detect a conflict
- explain the issue
- quarantine the risky document
- produce an agent-safe answer that excludes the quarantined document

### Problem Fit and Market Value: 25%

Document debt is a real business problem. Teams already struggle with stale policies, duplicated docs, and inconsistent internal knowledge. AI agents increase the urgency because stale documents become automated wrong answers.

Initial buyers are teams deploying support, operations, compliance, or internal productivity agents.

### Design, Craft and Taste: 20%

The UI should feel like a real operational dashboard:

- clear Spaces overview
- readable Document Explorer
- explanation-first conflict review
- simple status language
- tasteful quarantine and agent-access flow

Avoid jargon in the main UI. Use terms like healthy documents, conflict, quarantine, allowed agents, and source evidence.

### Innovation and Sponsor Technology: 30%

The product should not feel like generic CRUD or a normal document dashboard. The fresh idea is combining:

- OpenAI claim reasoning
- Exa external policy evidence
- Spaces as safe knowledge pools
- quarantine before agent retrieval

## In Scope

- Spaces overview.
- Support or Operations Space.
- Document Explorer.
- Add Source flow.
- OpenAI-powered scan.
- Optional Exa external policy scan.
- Conflict explanation panel.
- Quarantine action.
- Allowed Agent connection.
- Agent-safe answer panel.
- Local or Supabase-backed persistence, depending on time.
- Live website, public repo, demo video, pitch deck, social post.

## Out of Scope

- Full enterprise Google Drive crawling.
- Production Microsoft Graph or SharePoint auth if it slows the demo.
- Workato integration.
- Production MCP server.
- Multi-org admin.
- Fine-grained permissions.
- Background sync.
- Full PDF/Doc parsing pipeline.
- Perfect general contradiction detection.

## Acceptance Criteria

- The live app opens from a public URL.
- The demo can be completed in under two minutes.
- A user can see Spaces, documents, health states, and an allowed agent flow.
- A scan produces a visible conflict explanation.
- A risky document can be quarantined.
- The allowed agent answer excludes quarantined documents.
- The pitch clearly explains OpenAI and Exa usage.

## Final Demo Message

Capsa keeps company knowledge up to date, trusted, and ready for AI.

Capsa keeps bad documents from becoming bad decisions.
