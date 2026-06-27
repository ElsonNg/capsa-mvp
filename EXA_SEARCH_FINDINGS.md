# Exa Search Findings for Capsa

## Purpose

Capsa should use Exa as an external compliance research layer.

The goal is not to decide whether a company is legally compliant. The goal is to find relevant laws, standards, frameworks, and regulator guidance that can be compared against internal documents.

Capsa should present the output as:

> This document may need review because it appears inconsistent with external compliance evidence.

## Core Product Idea

Exa finds external evidence. OpenAI compares that evidence against internal document claims. Capsa then marks internal documents as healthy, conflict, needs review, or quarantined.

For legal or compliance topics, Capsa should usually mark documents as `needs_review` rather than automatically quarantining them, unless there is a clear internal contradiction between documents of different authority levels.

## What Exa Should Research

| Research area | What Exa should search for | Product use case | Example query |
| --- | --- | --- | --- |
| GDPR privacy obligations | Lawful basis, consent, data minimization, retention, deletion, access requests | Check privacy policies, support SOPs, marketing data docs | `GDPR data retention consent data subject rights official guidance` |
| Singapore PDPA | Consent, notification, purpose limitation, retention, transfer, protection obligations | Useful for Singapore-based privacy and customer data workflows | `Singapore PDPA consent purpose limitation retention transfer obligation` |
| ISO 27001 | Access control, incident response, risk assessment, asset management, supplier security | Check security, engineering, and operations docs | `ISO 27001 access control incident response risk assessment controls` |
| SOC 2 | Security, availability, confidentiality, processing integrity, privacy controls | Check audit readiness docs and internal control documents | `SOC 2 trust services criteria access review logging backup controls` |
| ISO 42001 | AI governance, AI risk management, human oversight, transparency, accountability | Check AI agent policies and model governance docs | `ISO 42001 AI management system risk governance human oversight` |
| NIST AI RMF | AI risk governance, measurement, monitoring, safety practices | Compare AI policies against public AI governance guidance | `NIST AI Risk Management Framework govern map measure manage` |
| Data retention | Customer, employee, support, security log, and billing retention expectations | Detect vague or risky claims like "retain forever" | `data retention policy GDPR PDPA customer support records` |
| Cross-border data transfer | Transfer restrictions, safeguards, subprocessors, vendor obligations | Check vendor, support, legal, and operations docs | `GDPR PDPA cross border data transfer obligations processor` |
| Marketing consent | Email marketing consent, unsubscribe rules, cookies, tracking, advertising claims | Check Marketing Space documents | `email marketing consent unsubscribe GDPR PDPA CAN-SPAM official` |
| Support compliance | Refunds, cancellations, consumer rights, complaint handling, customer data access | Check Support Space documents | `consumer refund cancellation policy SaaS 14 days 30 days regulation` |
| Security incident response | Breach notification timelines, escalation rules, evidence retention | Check Engineering and Security runbooks | `data breach notification timeline GDPR PDPA incident response official` |
| Vendor management | DPAs, vendor reviews, subprocessors, security questionnaires | Check Operations and Legal documents | `vendor data processor agreement GDPR PDPA security review obligations` |
| Employee data privacy | HR records, monitoring, employee access, retention, payroll data | Check HR and Operations documents | `employee personal data retention monitoring privacy GDPR PDPA` |
| Billing and finance policies | Refunds, chargebacks, cancellation, invoices, tax records | Check Finance and Support documents | `SaaS refund cancellation billing policy consumer protection regulation` |
| Accessibility compliance | WCAG, ADA-style accessibility, digital service requirements | Check Product and Engineering requirements docs | `WCAG accessibility requirements digital product compliance official` |

## Recommended Compliance Packs

| Compliance pack | Include | Best Capsa Spaces |
| --- | --- | --- |
| Privacy Pack | GDPR, PDPA, CCPA, consent, deletion, retention, data subject rights | Legal, Support, Marketing, Product |
| Security Pack | ISO 27001, SOC 2, incident response, access control, vendor risk | Engineering, Security, Operations |
| AI Governance Pack | ISO 42001, NIST AI RMF, human review, agent data access rules | AI, Engineering, Product |
| Support Compliance Pack | Refunds, cancellations, consumer rights, complaint handling | Support, Operations |
| Marketing Compliance Pack | Consent, claims substantiation, advertising, email, cookies, unsubscribe | Marketing, Legal |
| Operations Pack | Vendor management, procurement, business continuity, audit evidence | Operations, Finance, Legal |

## Priority Exa Searches for the MVP

| Priority | Query | Why it matters |
| --- | --- | --- |
| 1 | `GDPR data retention deletion consent official guidance` | Privacy and retention conflicts are common in internal docs. |
| 2 | `Singapore PDPA retention consent purpose limitation official` | Strong fit if the demo or company context includes Singapore. |
| 3 | `ISO 27001 access control incident response risk assessment controls` | Useful for Engineering, Security, and Operations Spaces. |
| 4 | `SOC 2 access review logging backup change management controls` | Useful for audit-readiness and operational control evidence. |
| 5 | `ISO 42001 AI governance human oversight risk management` | Directly relevant to Capsa because it prepares knowledge for AI agents. |

## Suggested Exa Result Shape

Store Exa results as structured compliance evidence, not as generic search snippets.

| Field | Purpose | Example |
| --- | --- | --- |
| `framework` | Law, standard, or framework name | `GDPR` |
| `jurisdiction` | Region or country | `EU` |
| `control_area` | Compliance topic | `Data retention` |
| `external_requirement` | Short summary of the external requirement | `Personal data should not be kept longer than necessary.` |
| `source_title` | Title of the source result | `GDPR Article 5` |
| `source_url` | URL of the external source | `https://gdpr-info.eu/art-5-gdpr/` |
| `source_authority` | Authority level of the source | `official_regulator`, `standards_body`, `industry_guidance`, `blog` |
| `matched_internal_claim` | Related claim from an internal document | `Support tickets are retained indefinitely.` |
| `matched_document_id` | Internal document connected to the finding | `document_id` |
| `risk_level` | Suggested review level | `low`, `medium`, `high`, `needs_review` |
| `why_it_matters` | Plain-language explanation for the user | `The internal policy may conflict with storage limitation expectations.` |

## How Capsa Should Use Exa Results

| Step | Product behavior |
| --- | --- |
| 1. User selects a Space | Example: Support, Marketing, Operations, Engineering. |
| 2. User runs External Research | Capsa suggests compliance-pack queries based on the Space. |
| 3. Exa returns external sources | Prefer official regulators, government pages, ISO pages, and standards bodies. |
| 4. OpenAI summarizes requirements | Convert external sources into concise obligations and control expectations. |
| 5. OpenAI compares with internal claims | Match requirements to extracted claims from internal documents. |
| 6. Capsa creates findings | Show potential gaps, contradictions, stale policies, or missing evidence. |
| 7. Capsa marks document health | Use `needs_review` for legal ambiguity; use `conflict` or `quarantined` only for clear internal contradictions. |

## Suggested UI Copy

Use careful language because legal compliance can be contextual.

| Avoid | Prefer |
| --- | --- |
| `This document violates GDPR.` | `This document may need review against GDPR retention guidance.` |
| `Non-compliant` | `Potential compliance gap` |
| `Illegal policy` | `Risky or outdated policy language` |
| `Automatically quarantined due to law` | `Needs review based on external compliance evidence` |

## Important Product Guardrails

- Exa should not make quarantine decisions by itself.
- External research should not override approved internal policy automatically.
- Legal and compliance findings should default to `needs_review`.
- Auto-quarantine should be reserved for clear internal contradictions, especially where a lower-authority draft conflicts with an approved policy.
- Every external finding should include a source URL.
- Prefer official or high-authority sources over generic blogs.
- Store jurisdiction, framework, and source authority with every research result.
- Show users which internal claim matched which external requirement.

## Best MVP Demo Angle

Use Exa to support the main Support refund-policy demo with an External Research tab.

Example flow:

1. User imports Support documents.
2. OpenAI detects the internal `14 days` vs `30 days` refund contradiction.
3. Capsa quarantines the lower-authority draft.
4. User opens External Research.
5. Exa researches refund, cancellation, privacy, or support-policy requirements.
6. Capsa shows external evidence cards.
7. The allowed agent still answers only from healthy internal documents.

This keeps the core demo simple while showing that Capsa can expand into broader compliance monitoring.

