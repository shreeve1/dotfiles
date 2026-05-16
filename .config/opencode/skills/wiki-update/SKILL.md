---
name: wiki-update
description: Update an existing LLM Wiki from the current session. USE WHEN update wiki from this session, capture session learnings, save decisions to wiki, ingest current conversation, update project memory, wiki update, session to wiki.
argument-hint: "What durable session knowledge should be captured?"
---

# Wiki Update

Companion skill for `llm-wiki-setup`. Use it during or after a session to extract durable project knowledge from the current conversation and update an existing project `wiki/` without dumping the whole transcript.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| update wiki from this session, capture session learnings, save decisions to wiki | `Workflows/SessionUpdate.md` |
| ingest current conversation, session to wiki, update project memory | `Workflows/SessionUpdate.md` |

## Defaults

- Wiki root: `wiki/`
- Raw session captures: `wiki/raw/sessions/YYYY-MM-DD-<slug>.md`
- Candidate review gate: enabled by default
- Claim provenance: required for important factual claims
- Full transcript capture: disabled unless James explicitly requests it
- Existing promoted page edits: allowed only for low-risk, cited maintenance
- Raw session capture collisions: never overwrite; append `-2`, `-3`, etc.

## Execution Rules

- Require an existing LLM Wiki. If core files are missing, stop and suggest `/llm-wiki-setup` first.
- Extract only durable knowledge: decisions, accepted terminology, architecture/process rules, source summaries, contradictions, follow-ups, and reusable context.
- Do not store secrets, credentials, private personal information, or raw pasted user content without explicit approval.
- Prefer citations to project files, diffs, issues, docs, or raw sources over conversation-only evidence.
- For conversation-only decisions, create a curated raw session capture under `wiki/raw/sessions/` and cite that raw capture.
- New pages and risky updates go through `wiki/candidates/` until promoted.
- Before creating candidates, reconcile against existing promoted pages, candidates, routes, and claims to avoid duplicates and record contradictions.
- Update `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, and `wiki/log.md` whenever wiki content changes.
- Mark session-derived claims with appropriate confidence; do not present them as stronger than the evidence supports.

## Context Files

- Session update workflow: `Workflows/SessionUpdate.md`

## Examples

```text
/wiki-update capture what we decided about the auth flow
```

Creates a curated session source, candidate analysis or concept updates, claim entries, index/routing updates, and a log entry.

```text
/wiki-update update the project wiki with durable learnings from this debugging session
```

Extracts root cause, verified fixes, commands/evidence, open follow-ups, and candidate wiki updates.
