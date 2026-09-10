# LLM Wiki Templates

## README.md

```markdown
---
type: wiki-readme
title: Project LLM Wiki
---

# Project LLM Wiki

This directory is an LLM-maintained knowledge base for the project. The promoted
wiki is a conformant Open Knowledge Format (OKF) v0.1 bundle: markdown concept
files with YAML frontmatter, per-directory `index.md` files, bundle-relative
markdown links, and `# Citations` sections. Governance sidecars (`CLAIMS.md`,
`ROUTING.md`, this README) carry a descriptive `type` and are OKF-legal extras.

## Rules

- `raw/` is immutable source material.
- `candidates/` contains unpromoted generated pages.
- Promoted pages must be listed in the relevant directory `index.md`; candidates must appear only in the root candidate review queue.
- Concept pages link to each other with bundle-relative markdown links (`[Name](/concepts/name.md)`), not `[[wikilinks]]`.
- Important factual claims must be tracked in `CLAIMS.md`.
- All changes must be logged in `log.md`.

## Workflows

- Ingest: add source to `raw/`, summarize, discuss key takeaways when needed, extract claims, create candidates, update candidate index/routing/claims, and log.
- Session update: use `/wiki-update` to capture durable decisions, verified facts, and follow-ups from a session into raw session notes, candidates, claims, routing, index, and log.
- Query: read root `index.md`, optionally use `ROUTING.md` to narrow scope, then follow directory `index.md` files to relevant promoted pages; cite sources.
- Lint: check broken links, orphan pages, stale claims, claim content drift against cited sources, duplicates, missing concept pages, data gaps, and contradictions.
- Promote: move candidate to final location, update index/routing/claims/log.
- Discard: remove stale candidate index rows, candidate routes, and candidate claim references, then log the discard.
```

## index.md (root)

OKF §6 index format: bulleted `* [Title](/path.md) - one-line description` entries grouped under section headings. The root index carries the single permitted `okf_version` frontmatter key and enumerates the concept directories plus the candidate review queue. Descriptions SHOULD be copied from the linked page's `description` frontmatter.

```markdown
---
okf_version: "0.1"
---

# Wiki Index

## Sources

* [subdirectory](/sources/) - promoted source summaries

## Entities

* [subdirectory](/entities/) - promoted entity pages

## Concepts

* [subdirectory](/concepts/) - promoted concept pages

## Analyses

* [subdirectory](/analyses/) - promoted query outputs and syntheses

## Candidate Review Queue

Candidates are discoverability aids only; do not treat them as promoted knowledge.

* [candidate-title](/candidates/concept-slug.md) - one-line description (status: candidate, created: YYYY-MM-DD)
```

## index.md (per subdirectory)

Each concept-bearing directory has its own index (no frontmatter). It lists that directory's pages with descriptions from their frontmatter.

Use the containing directory's own prefix in each link path (a `sources/` index links `/sources/...`, a `concepts/` index links `/concepts/...`).

```markdown
# <Directory> Index

* [Page Title](/<dir>/page-slug.md) - one-line description from the page's `description` frontmatter
* [Another Page](/<dir>/another.md) - one-line description
```

## log.md

OKF §7 update-history format: ISO `## YYYY-MM-DD` date headings, newest first, each entry a bullet led by a bold action word. `log.md` is an OKF reserved file recognized by filename; like `index.md` it carries no frontmatter.

```markdown
# Wiki Log

## YYYY-MM-DD

* **Creation**: Established [Page Title](/concepts/page-slug.md). Actor: agent. Inputs: `wiki/raw/source.ext`. Notes: key decision or unresolved question.
* **Update**: Revised [Another Page](/concepts/another.md) after ingest. Actor: agent. Inputs: prompt summary.
```

The leading bold word (`**Creation**`, `**Update**`, `**Deprecation**`, etc.) is a convention. Keep actor / inputs / outputs / notes inline in the bullet prose.

## eval/README.md

```markdown
---
type: wiki-eval-readme
title: Wiki Eval Slice
---

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
---
type: routing-index
title: Wiki Routing
---

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

The `type: claims-registry` frontmatter block makes `CLAIMS.md` an OKF-legal sidecar (OKF §9 requires a `type` on every non-reserved `.md`). `gate.py` treats everything before the `| ID` header row as opaque preamble and round-trips it verbatim, so the frontmatter survives `migrate` and every gated write — do not remove it.

```markdown
---
type: claims-registry
title: Claims Registry
---

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

OKF requires exactly one field — `type` — and recommends `title`, `description`, `resource`, `tags`, `timestamp`. This skill adds `status`, `created`, `sources`, and `confidence` as OKF-legal extension keys (OKF consumers preserve unknown keys and must not reject documents for having them).

```markdown
---
type: source-summary | entity | concept | analysis | decision   # REQUIRED (OKF)
title: Page Title                                                # OKF recommended
description: One-line summary used by index generators.          # OKF recommended
resource: <canonical URI/path this page points at, optional>     # OKF recommended
timestamp: YYYY-MM-DDTHH:MM:SSZ                                   # OKF recommended (last change)
tags: []                                                         # OKF recommended
status: candidate | promoted | superseded                        # skill extension
created: YYYY-MM-DD                                              # skill extension
updated: YYYY-MM-DD                                              # skill extension
sources:                                                         # skill extension
  - wiki/raw/source.ext
confidence: high | medium | low                                  # skill extension
---
```

`type` values are free text (not registered centrally); pick descriptive, self-explanatory values. The five above are the skill's page categories; a page MAY use a more specific type (e.g. `runbook`, `api-endpoint`) when that better describes the concept. `resource` points at the live source of truth (a code path, DB table, API endpoint, URL) instead of copying it into the body, keeping the page thin. `timestamp` is the OKF last-change field; the extension `updated` may mirror it in date-only form.

## Agent Instructions Section

Adapt heading levels to the target project's existing `CLAUDE.md` or `AGENTS.md` structure. The `##` and `###` headings below are defaults, not mandatory depths.

Keep this section compact. The detailed ingest, query, promotion, lint, and discard procedures live in the `/llm-wiki-setup` and `/wiki-update` skills — do not inline them here; CLAUDE.md only needs the layout, the wiki-first rule, and the mandatory end-of-run check.

```markdown
## LLM Wiki

This project uses `wiki/` as an LLM-maintained knowledge base — a conformant Open Knowledge Format (OKF) v0.1 bundle. Operate it with the `/llm-wiki-setup` skill (setup, ingest, query, promote, lint) and the `/wiki-update` skill (capture durable session knowledge). Those skills own the full procedures — follow them rather than reinventing the steps here.

### Layout

- `wiki/index.md` — root OKF index; read first for any wiki-backed question; `wiki/ROUTING.md` narrows broad searches. Each subdirectory also has its own `index.md`.
- `wiki/raw/` — immutable source material (read, never rewrite); `wiki/raw/sessions/` holds `/wiki-update` captures.
- `wiki/candidates/` — review gate for generated pages before promotion.
- `wiki/sources/`, `wiki/entities/`, `wiki/concepts/`, `wiki/analyses/` — promoted OKF concept pages (`type` frontmatter required; link with bundle-relative markdown links like `[Name](/concepts/name.md)`, not `[[wikilinks]]`; external sources under a `# Citations` section).
- `wiki/CLAIMS.md` — tracked factual claims (12-column schema, gated by `/wiki-update`). `wiki/log.md` — append every ingest, query, lint, and promotion (OKF `## YYYY-MM-DD` format).

### Wiki-First Search

For any project-specific question, investigation, design task, bug hunt, or code search needing project context: read `wiki/index.md` (then `wiki/ROUTING.md`) and the relevant pages and `wiki/CLAIMS.md` entries before broad repository search. If non-wiki search reveals durable knowledge the wiki lacks, note the gap and propose an ingest, candidate, or promotion path in your answer.

### Mandatory End-of-Run Wiki Check

The wiki is a standing obligation, not opt-in. Before reporting ANY task complete:

1. Decide whether the task produced durable knowledge — a decision setting/reversing project direction, scope, or ownership; accepted or changed terminology; a new/changed architecture, process, or contract; or a verified fact, root cause, or fix that supersedes existing wiki knowledge.
2. If yes, run `/wiki-update` before reporting done (or, if a full pass is deferred, state the wiki gap and proposed ingest/candidate/promotion path in the final answer).
3. If no, state one line confirming the wiki check ran and nothing qualified.

Mark superseded knowledge `superseded` in `wiki/CLAIMS.md` with a pointer to the newer claim; never delete it to clean up history.
```
