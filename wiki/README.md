# Project LLM Wiki

This directory is an LLM-maintained knowledge base for the dotfiles project.

## Scope

- Domain: PAI dotfiles, OpenCode configuration, PAI runtime, skills, agents, plugins, install behavior, and operational workflows.
- Initial source types: project docs and codebase notes.
- Generated Markdown wiki files are intended to be committed to git.
- Candidate promotion requires James approval.
- Citation style: inline path citations such as `wiki/raw/source.md` or `wiki/concepts/page.md`.

## Rules

- `raw/` is immutable source material; read it, cite it, and do not rewrite it after ingest.
- `candidates/` contains unpromoted generated pages.
- Promoted pages must be indexed in `index.md`; candidates must appear only in the candidate review queue.
- Important factual claims must be tracked in `CLAIMS.md`.
- Every ingest, query save, lint, and promotion must be logged in `log.md`.
- Raw-source git policy is source-specific: ask before adding large/binary raw files, ignoring raw paths, or moving raw sources to external storage.

## Workflows

- Ingest: add source to `raw/`, summarize it with citations, discuss key takeaways when needed, extract claims, create candidates, update the candidate index/routing/claims, and log.
- Query: read `index.md`, use `ROUTING.md` to narrow the search, read relevant promoted pages, and cite sources.
- Lint: check broken links, orphan pages, stale claims, duplicate concepts, contradictions, and candidate cleanup needs.
- Promote: with James approval, move a candidate to its final directory, update metadata, index, routing, claims, and log.
- Discard: remove stale candidate index rows, candidate routes, and candidate claim references, then log the discard.
