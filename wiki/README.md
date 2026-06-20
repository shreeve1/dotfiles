# Project LLM Wiki

This directory is an LLM-maintained knowledge base for the dotfiles project.

## Scope

- Domain: dotfiles, OpenCode configuration, skills, agents, install behavior, and operational workflows.
- Generated Markdown wiki files are intended to be committed to git.
- Candidate promotion requires James approval.
- Citation style: inline path citations such as `wiki/raw/source.md` or `wiki/concepts/page.md`.

## Rules

- `raw/` is immutable source material; read it, cite it, and do not rewrite it after ingest unless James explicitly approves cleanup.
- `candidates/` contains unpromoted generated pages.
- Promoted pages must be indexed in `index.md`; candidates must appear only in the candidate review queue.
- Important factual claims must be tracked in `CLAIMS.md`.
- Every ingest, query save, lint, promotion, discard, and cleanup must be logged in `log.md`.

## Workflows

- Ingest: add source to `raw/`, summarize it with citations, discuss key takeaways when needed, extract claims, create candidates, update the candidate index/routing/claims, and log.
- Query: read `index.md`, use `ROUTING.md` to narrow the search, read relevant promoted pages, and cite sources.
- Lint: check broken links, orphan pages, stale claims, duplicate concepts, contradictions, and candidate cleanup needs.
- Promote: with James approval, move a candidate to its final directory, update metadata, index, routing, claims, and log.
- Discard: remove stale candidate index rows, candidate routes, and candidate claim references, then log the discard.
