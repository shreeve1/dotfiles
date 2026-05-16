# LLM Wiki Templates

## README.md

```markdown
# Project LLM Wiki

This directory is an LLM-maintained knowledge base for the project.

## Rules

- `raw/` is immutable source material.
- `candidates/` contains unpromoted generated pages.
- Promoted pages must be indexed in `index.md`.
- Important factual claims must be tracked in `CLAIMS.md`.
- All changes must be logged in `log.md`.

## Workflows

- Ingest: add source to `raw/`, summarize, extract claims, create candidates, update routing and log.
- Query: read `ROUTING.md`, then `index.md`, then relevant pages; cite sources.
- Lint: check broken links, orphan pages, stale claims, duplicates, and contradictions.
- Promote: move candidate to final location, update index/routing/claims/log.
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

Use this file before reading `index.md` when answering questions.

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
- `wiki/candidates/`: generated pages awaiting review or promotion.
- `wiki/sources/`: promoted source summaries.
- `wiki/entities/`: promoted entity pages.
- `wiki/concepts/`: promoted concept pages.
- `wiki/analyses/`: promoted query outputs and syntheses.
- `wiki/assets/`: local images and attachments.

### Required Files

- Read `wiki/ROUTING.md` first when answering wiki-backed questions.
- Read `wiki/index.md` before reading individual pages.
- Append every ingest, query, lint, and promotion to `wiki/log.md`.
- Track important factual claims in `wiki/CLAIMS.md`.

### Ingest Workflow

1. Read the new source from `wiki/raw/`.
2. Summarize the source with citations to the raw path.
3. Extract entities, concepts, contradictions, and atomic claims.
4. Create new pages in `wiki/candidates/` unless the edit is low-risk maintenance.
5. Update `wiki/index.md`, `wiki/ROUTING.md`, and `wiki/CLAIMS.md` with cited entries.
6. Append an entry to `wiki/log.md`.

### Query Workflow

1. Read `wiki/ROUTING.md` to pick relevant branches.
2. Read `wiki/index.md` to identify pages.
3. Read only the relevant promoted pages and claim entries.
4. Answer with citations to wiki pages or raw sources.
5. If the answer produces durable synthesis, offer to save it as `wiki/candidates/<slug>.md`.

### Promotion Workflow

1. Review the candidate page for citations, confidence, and duplicates.
2. Move it to `sources/`, `entities/`, `concepts/`, or `analyses/`.
3. Set `status: promoted` and update timestamps.
4. Update `index.md`, `ROUTING.md`, `CLAIMS.md`, and `log.md`.

### Lint Workflow

Check broken wikilinks, orphan pages, duplicate concepts, uncited claims, stale claims, contradictions, and missing index/routing entries. Report findings before making broad changes.
```
