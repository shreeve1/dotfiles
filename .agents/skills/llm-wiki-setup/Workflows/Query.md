# Query Workflow

Use this workflow when answering questions from the project wiki.

## Procedure

1. Read the root `wiki/index.md` to identify relevant directories and candidate context, then follow the per-directory `index.md` files to specific pages.
2. Use `wiki/ROUTING.md` to narrow branches when the index is too broad.
3. Read only relevant promoted pages and `wiki/CLAIMS.md` entries.
4. Answer from promoted wiki knowledge first.
5. If promoted pages are insufficient, inspect the relevant `wiki/raw/` sources directly (they are readable and immutable) and cite them; say what the wiki still lacks rather than asking permission to look.
6. Cite wiki pages or raw sources for factual statements.
7. If the answer creates durable synthesis, save it via the Save-Back Pattern below — do not offer or wait for approval.

## Answer Rules

- Distinguish promoted knowledge from candidates.
- Do not treat candidate pages as authoritative unless James explicitly asks.
- Candidate rows in `wiki/index.md` are discoverability aids, not promoted knowledge.
- Say `I don't know from the current wiki` when evidence is insufficient.
- Prefer concise answers with paths for follow-up reading.

## Save-Back Pattern

When saving a durable answer:

1. Create `wiki/candidates/analysis-<slug>.md` (OKF-conformant: `type` frontmatter, bundle-relative markdown links, `# Citations` section).
2. Include sources and confidence in frontmatter.
3. Auto-promote the analysis page via `Workflows/Promote.md` so the saved answer lands as a promoted, indexed page rather than a parked candidate.
4. Add or update claims in `wiki/CLAIMS.md` **only through `gate.py`**, and only after promotion — `gate.py` has no repath/update operation, so write claim `page` fields against the final `wiki/analyses/<slug>.md` promoted path, never a `wiki/candidates/...` path. Resolve `WIKI_GATE` through `wiki-update/resolve-gate.py` as specified in the skill contract, build typed-slot JSON, and run `python3 "$WIKI_GATE" --wiki wiki check <candidate.json>`, obeying the verdict (`--apply` on ADMIT). Same gated procedure as `wiki-update`'s `SessionUpdate.md` §7a.
5. Append a query entry to `wiki/log.md`.
