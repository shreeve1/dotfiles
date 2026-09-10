---
name: wiki-update
description: Update an existing LLM Wiki from the current session. USE WHEN update wiki from this session, capture session learnings, save decisions to wiki, ingest current conversation, update project memory, wiki update, session to wiki.
argument-hint: "What durable session knowledge should be captured?"
---

# Wiki Update

Companion skill for `llm-wiki-setup`. Use it during or after a session to extract durable project knowledge from the current conversation and update an existing project `wiki/` without dumping the whole transcript. The wiki is a conformant OKF v0.1 bundle: pages created here must carry `type` frontmatter, link with bundle-relative markdown links (`[Name](/concepts/name.md)`, not `[[wikilinks]]`), and cite external sources under a `# Citations` section; see `llm-wiki-setup/Templates.md`.

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
- Claim writes: gated by `gate.py` (deterministic). No claim enters `CLAIMS.md` except through an `ADMIT` verdict.
- Gate path: resolve `gate.py` as `~/.claude/skills/wiki-update/gate.py` (global install — the default) or `.claude/skills/wiki-update/gate.py` (if the project vendors the skill). Commands in `Workflows/SessionUpdate.md` use the global path.
- Claim budget: `BUDGET` active claims per hot file (default 40); over budget forces a demotion before any add.
- Hot/cold: `CLAIMS.md` is loaded by default; `CLAIMS-cold.md` is the searchable archive, not loaded.

## Execution Rules

- Require an existing LLM Wiki. If core files are missing, stop and suggest `/llm-wiki-setup` first.
- Extract only durable knowledge: decisions, accepted terminology, architecture/process rules, source summaries, contradictions, follow-ups, and reusable context.
- Do not store secrets, credentials, private personal information, or raw pasted user content without explicit approval.
- Prefer citations to project files, diffs, issues, docs, or raw sources over conversation-only evidence.
- For conversation-only decisions, create a curated raw session capture under `wiki/raw/sessions/` and cite that raw capture.
- New pages and risky updates go through `wiki/candidates/` until promoted.
- Before creating candidates, reconcile against existing promoted pages, candidates, routes, and claims to avoid duplicates and record contradictions.
- Update indexes (root `wiki/index.md` candidate queue for candidates; destination directory `index.md` for promoted-page edits), `wiki/ROUTING.md`, `wiki/CLAIMS.md`, and `wiki/log.md` whenever wiki content changes.
- Mark session-derived claims with appropriate confidence; do not present them as stronger than the evidence supports.
- Bounding is enforced by gates, not goodwill. Every claim write runs `gate.py check`; the run's Verification step runs `gate.py audit`. A write that bypassed the gate but violates budget or schema fails the audit and the run is not done. See `Workflows/SessionUpdate.md` §7a and §7b.
- `gate.py` enforces budget and schema — it does **not** check whether a claim is *true*. Before an important factual claim enters `CLAIMS.md` or a promoted page, ground it in its cited source and run an **independent verify (see `../_shared/verify-claims.md`)** on the batch of load-bearing claims, checked against the cited files/sources rather than conversation memory. A claim that comes back FALSE must be corrected or dropped before the write; UNSURE means re-read the source before promoting. This complements the gate: the gate keeps the wiki bounded, the verify keeps it correct.

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
