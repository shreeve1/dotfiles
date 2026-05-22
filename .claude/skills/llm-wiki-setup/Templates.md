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
- Lint: check broken links, orphan pages, stale claims, duplicates, missing concept pages, data gaps, and contradictions.
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

```markdown
# Claims Registry

| ID | Claim | Source | Page | Confidence | Status | Notes |
|----|-------|--------|------|------------|--------|-------|
| C-0001 | Example claim. | `wiki/raw/example.md` | `wiki/concepts/example.md` | medium | active | Created during setup. |
```

Claim IDs use the next available zero-padded integer in `C-0001` format. Before adding claims, scan existing `C-####` IDs in `CLAIMS.md`, find the maximum, and increment by one for each new claim.

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

## AGENTS.md Section

Adapt heading levels to the target project's existing `AGENTS.md` structure. The `##` and `###` headings below are defaults, not mandatory depths.

```markdown
## LLM Wiki

This project uses `wiki/` as an LLM-maintained knowledge base.

### Directories

- `wiki/raw/`: immutable source material; read but do not rewrite.
- `wiki/raw/sessions/`: curated session captures created by `/wiki-update` when conversation evidence needs citation.
- `wiki/candidates/`: generated pages awaiting review or promotion.
- `wiki/sources/`: promoted source summaries.
- `wiki/entities/`: promoted entity pages.
- `wiki/concepts/`: promoted concept pages.
- `wiki/analyses/`: promoted query outputs and syntheses.
- `wiki/raw/assets/`: source attachments clipped with raw material.
- `wiki/assets/`: generated or wiki-native images and attachments.

### Required Files

- Read `wiki/index.md` first when answering wiki-backed questions.
- Use `wiki/ROUTING.md` after `wiki/index.md` to narrow large searches.
- Append every ingest, query, lint, and promotion to `wiki/log.md`.
- Track important factual claims in `wiki/CLAIMS.md`.

### Wiki-First Project Search

For any project-specific question, investigation, design task, bug hunt, or code search that requires looking up project context, check the wiki first.

1. Read `wiki/index.md` before searching broadly.
2. Use `wiki/ROUTING.md` to identify relevant promoted pages, candidates, and claim entries.
3. Read relevant wiki pages and `wiki/CLAIMS.md` entries before using general repository search.
4. If the wiki does not contain enough information, search the codebase, docs, or external sources as needed.
5. When non-wiki search reveals durable project knowledge, propose ingesting the source into `wiki/raw/`, creating or updating a page in `wiki/candidates/`, or promoting an existing candidate after James approves.
6. If external or codebase search was needed to answer a wiki-backed question, mention the wiki gap and proposed ingest or promotion path in the final answer.

### Session Update Workflow

Use `/wiki-update` during or after meaningful sessions to capture durable decisions, verified facts, root causes, follow-ups, and reusable context. Create curated raw session captures under `wiki/raw/sessions/` when conversation evidence is needed. Do not archive full transcripts, secrets, private material, or raw pasted user content without explicit approval. New or risky session-derived knowledge goes through `wiki/candidates/` and must update `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, and `wiki/log.md`.

### Ingest Workflow

1. Read the new source from `wiki/raw/`.
2. Summarize the source with citations to the raw path.
3. Discuss key takeaways or emphasis with James when the source is substantial, ambiguous, or likely to touch multiple pages.
4. Extract entities, concepts, contradictions, and atomic claims.
5. Create new pages in `wiki/candidates/` unless the edit is low-risk maintenance.
6. Update `wiki/index.md` candidate queue, `wiki/ROUTING.md`, and `wiki/CLAIMS.md` with cited candidate entries.
7. Append an entry to `wiki/log.md`.

### Query Workflow

1. Read `wiki/index.md` to identify relevant promoted pages and candidates.
2. Use `wiki/ROUTING.md` to narrow branches when the index is too broad.
3. Read only the relevant promoted pages and claim entries.
4. Answer with citations to wiki pages or raw sources.
5. If the answer produces durable synthesis, offer to save it as `wiki/candidates/<slug>.md`.

### Promotion Workflow

1. Review the candidate page for citations, confidence, and duplicates.
2. Move it to `sources/`, `entities/`, `concepts/`, or `analyses/`.
3. Set `status: promoted` and update timestamps.
4. Update `index.md`, `ROUTING.md`, `CLAIMS.md`, and `log.md`.

### Discard Workflow

When a candidate is rejected, remove its candidate index row, candidate-only routes, and candidate claim page references before deleting the candidate file. Append a discard entry to `wiki/log.md`.

### Lint Workflow

Check broken wikilinks, orphan pages, duplicate concepts, uncited claims, stale claims, contradictions, missing concept pages, data gaps, stale candidate references, and missing index/routing entries. Report findings before making broad changes.
```
