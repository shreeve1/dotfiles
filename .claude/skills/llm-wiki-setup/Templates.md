# LLM Wiki Templates

## README.md

```markdown
# Project LLM Wiki

This directory is an LLM-maintained knowledge base for the project.

## Rules

- `raw/` is immutable source material.
- `candidates/` contains unpromoted generated pages.
- Promoted pages must be indexed in `index.md`; candidates must appear only in the candidate review queue.
- Important factual claims must be tracked in `CLAIMS.md`.
- All changes must be logged in `log.md`.

## Workflows

- Ingest: add source to `raw/`, summarize, discuss key takeaways when needed, extract claims, create candidates, update candidate index/routing/claims, and log.
- Session update: use `/wiki-update` to capture durable decisions, verified facts, and follow-ups from a session into raw session notes, candidates, claims, routing, index, and log.
- Query: read `index.md`, optionally use `ROUTING.md` to narrow scope, then read relevant promoted pages; cite sources.
- Lint: check broken links, orphan pages, stale claims, claim content drift against cited sources, duplicates, missing concept pages, data gaps, and contradictions.
- Promote: move candidate to final location, update index/routing/claims/log.
- Discard: remove stale candidate index rows, candidate routes, and candidate claim references, then log the discard.
```

## index.md

```markdown
# Wiki Index

## Sources

| Page | Summary | Sources | Updated |
|------|---------|---------|---------|

## Entities

| Page | Summary | Sources | Updated |
|------|---------|---------|---------|

## Concepts

| Page | Summary | Sources | Updated |
|------|---------|---------|---------|

## Analyses

| Page | Summary | Sources | Updated |
|------|---------|---------|---------|

## Candidate Review Queue

Candidate rows are discoverability aids only; do not treat them as promoted knowledge.

| Candidate | Summary | Sources | Created | Status |
|-----------|---------|---------|---------|--------|
```

## log.md

```markdown
# Wiki Log

Append entries with this format:

## [YYYY-MM-DD] type | Title

- Actor: agent or human
- Inputs: paths or prompt summary
- Outputs: changed pages
- Notes: key decisions or unresolved questions
```

## eval/README.md

```markdown
# Wiki Eval Slice

This directory holds the regression slice that gates claim consolidation.
`gate.py consolidate` runs every case before and after a merge/prune and reverts
(or refuses) if the pass rate drops — this is what stops consolidation from
silently dropping a load-bearing claim. An empty `eval/` makes the gate refuse
to run, so add cases as high-value claims land.

## Format

One case per line in any `*.eval` file:

    <query text> ||| <token that must survive in CLAIMS.md>

- The left side is a query; the right side is a substring that must still appear
  in `CLAIMS.md` for the case to pass.
- Blank lines and lines starting with `#` are ignored.

Authored by `/wiki-update` when a high-confidence, load-bearing claim is admitted.
```

## ROUTING.md

```markdown
# Wiki Routing

Use this file after reading `index.md` when narrowing a wiki-backed question to likely branches.

## Project Overview

- Pages: 
- Keywords: 

## Architecture

- Pages: 
- Keywords: 

## Decisions

- Pages: 
- Keywords: 

## Research

- Pages: 
- Keywords: 
```

## CLAIMS.md

This 12-column schema is the contract enforced by the `wiki-update` skill's `gate.py`. Setup must emit exactly these columns, in this order, so the first gated claim write does not corrupt the table. A hand-curated narrower table (e.g. 7 columns) breaks `gate.py`.

```markdown
# Claims Registry

| ID | Kind | Claim | Source | Page | Confidence | Status | Created | Hits | Superseded | Impact | Notes |
|----|------|-------|--------|------|------------|--------|---------|------|------------|--------|-------|
| C-0001 | config-fact | Example claim. | `wiki/raw/example.md` | `wiki/concepts/example.md` | medium | active | YYYY-MM-DD | 0 |  | Without this, future sessions re-derive the fact from scratch. | Created during setup. |

Claim IDs use the next available zero-padded integer in `C-0001` format. Schema and bounding gates enforced by `gate.py`.
```

Column rules (`gate.py` rejects writes that violate them):

- `Kind`: one of `gotcha`, `decision`, `config-fact`, `runbook-step`.
- `Confidence`: one of `high`, `medium`, `low`.
- `Status`: `active`, `superseded`, or `cold`.
- `Created`: `YYYY-MM-DD`. `Hits`: integer (start `0`). `Superseded`: date or empty.
- `Impact`: required; state the counterfactual value (the failure it prevents or speedup it gives), not a restatement of the claim.
- No field may contain `|` (breaks the table row).

Before adding claims, scan existing `C-####` IDs in `CLAIMS.md` and `CLAIMS-cold.md`, find the maximum, and increment by one for each new claim. `CLAIMS-cold.md` (the demoted-claim archive) is created by `gate.py` on first demotion; setup does not need to create it.

## Page Frontmatter

```markdown
---
title: Page Title
type: source-summary | entity | concept | analysis | decision
status: candidate | promoted | superseded
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources:
  - wiki/raw/source.ext
confidence: high | medium | low
tags: []
---
```

## Agent Instructions Section

Adapt heading levels to the target project's existing `CLAUDE.md` or `AGENTS.md` structure. The `##` and `###` headings below are defaults, not mandatory depths.

Keep this section compact. The detailed ingest, query, promotion, lint, and discard procedures live in the `/llm-wiki-setup` and `/wiki-update` skills — do not inline them here; CLAUDE.md only needs the layout, the wiki-first rule, and the mandatory end-of-run check.

```markdown
## LLM Wiki

This project uses `wiki/` as an LLM-maintained knowledge base. Operate it with the `/llm-wiki-setup` skill (setup, ingest, query, promote, lint) and the `/wiki-update` skill (capture durable session knowledge). Those skills own the full procedures — follow them rather than reinventing the steps here.

### Layout

- `wiki/index.md` — read first for any wiki-backed question; `wiki/ROUTING.md` narrows broad searches.
- `wiki/raw/` — immutable source material (read, never rewrite); `wiki/raw/sessions/` holds `/wiki-update` captures.
- `wiki/candidates/` — review gate for generated pages before promotion.
- `wiki/sources/`, `wiki/entities/`, `wiki/concepts/`, `wiki/analyses/` — promoted pages.
- `wiki/CLAIMS.md` — tracked factual claims (12-column schema, gated by `/wiki-update`). `wiki/log.md` — append every ingest, query, lint, and promotion.

### Wiki-First Search

For any project-specific question, investigation, design task, bug hunt, or code search needing project context: read `wiki/index.md` (then `wiki/ROUTING.md`) and the relevant pages and `wiki/CLAIMS.md` entries before broad repository search. If non-wiki search reveals durable knowledge the wiki lacks, note the gap and propose an ingest, candidate, or promotion path in your answer.

### Mandatory End-of-Run Wiki Check

The wiki is a standing obligation, not opt-in. Before reporting ANY task complete:

1. Decide whether the task produced durable knowledge — a decision setting/reversing project direction, scope, or ownership; accepted or changed terminology; a new/changed architecture, process, or contract; or a verified fact, root cause, or fix that supersedes existing wiki knowledge.
2. If yes, run `/wiki-update` before reporting done (or, if a full pass is deferred, state the wiki gap and proposed ingest/candidate/promotion path in the final answer).
3. If no, state one line confirming the wiki check ran and nothing qualified.

Mark superseded knowledge `superseded` in `wiki/CLAIMS.md` with a pointer to the newer claim; never delete it to clean up history.
```
