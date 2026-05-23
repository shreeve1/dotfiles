# LLM Wiki Architecture

## Purpose

An LLM Wiki compiles raw project knowledge into a persistent, interlinked Markdown knowledge base. It shifts repeated query-time retrieval into accumulated ingest-time synthesis.

## Directory Contract

`index.md` and `log.md` are the core Karpathy-style navigation files. `ROUTING.md`, `CLAIMS.md`, and `candidates/` are this skill's default implementation extensions for larger or higher-rigor projects.

```text
wiki/
├── index.md
├── log.md
├── ROUTING.md
├── CLAIMS.md
├── README.md
├── raw/
├── candidates/
├── sources/
├── entities/
├── concepts/
├── analyses/
└── assets/
```

## Layer Responsibilities

Raw sources:

- Live under `wiki/raw/`.
- Are immutable after ingest unless James explicitly says otherwise.
- Preserve original filenames when possible.
- Are the source of truth for citations.
- May contain large or binary files; setup must ask whether raw sources are committed, ignored, or stored externally before adding raw-source `.gitignore` rules.

Wiki pages:

- Are LLM-maintained Markdown artifacts.
- Use wikilinks such as `[[Concept Name]]` where useful.
- Include YAML frontmatter from `Templates.md`.
- Cite raw sources or existing wiki pages for factual claims.

Schema and operating rules:

- Live in project `CLAUDE.md` under an `LLM Wiki` section; mirror into `AGENTS.md` only if that file already exists.
- Define ingest, query, lint, and promotion workflows for future agents.
- Must be kept short enough to remain useful in every session.

## Core Files

`wiki/index.md` is the content catalog. It lists every promoted page with a one-line summary, page type, status, and source count. It also includes a candidate review queue so unpromoted pages remain discoverable without treating them as authoritative.

`wiki/log.md` is append-only. Every ingest, query, lint, and promotion appends a dated entry.

`wiki/ROUTING.md` is a skill extension that maps topic branches to likely pages. It helps agents narrow search after consulting the index.

`wiki/CLAIMS.md` is a skill extension that tracks important atomic claims with citations, confidence, status, and supersession notes.

`wiki/candidates/` is a skill extension that holds new or risky pages before promotion. Candidates are discoverable in the index but excluded from authoritative answers unless explicitly referenced.

## Write Policy

Use the candidate review gate by default:

- New entity, concept, source summary, and analysis pages start in `wiki/candidates/`.
- Low-risk maintenance edits to `index.md`, `log.md`, `ROUTING.md`, and `CLAIMS.md` can happen during setup and ingest.
- During ingest, `index.md` must list candidate pages in a candidate review queue, not in promoted-page sections.
- Candidate routes and claim entries must clearly point to `wiki/candidates/...` until promotion.
- Promotion moves a candidate page to its final directory, updates `index.md`, updates `ROUTING.md`, and logs the promotion.
- Discarding a candidate removes its candidate index row, candidate routes, and candidate claim references, then logs the discard.
- If a page contradicts existing wiki knowledge, keep both claims, cite both sources, and mark the contradiction in `CLAIMS.md`.

## Provenance Rules

- Every non-obvious factual claim needs a citation.
- Claim IDs use the next available zero-padded integer in `C-0001` format by scanning existing `CLAIMS.md` rows and incrementing the maximum ID.
- Prefer citations to `wiki/raw/...` paths for source-derived facts.
- Use existing wiki pages only for synthesized or previously promoted knowledge.
- Record confidence as `high`, `medium`, or `low`.
- Never erase superseded claims; mark them `superseded` with a pointer to the newer claim.

## Optional Tooling

At small scale, `index.md` and `ROUTING.md` are enough. At larger scale, suggest but do not install:

- `qmd` for local Markdown BM25/vector search.
- A simple ripgrep-based search script.
- Obsidian for browsing graph links.
- An MCP server only after the wiki contract stabilizes.
