# Ingest Workflow

Use this workflow when adding a new source to the wiki.

## Inputs

- Source path under `wiki/raw/`.
- Optional focus from James.

## Procedure

1. Read `wiki/index.md`, then `wiki/ROUTING.md`, then `wiki/CLAIMS.md`.
2. Read the raw source.
3. Produce a short source summary with citations to the raw path.
4. Discuss key takeaways or emphasis with James when the source is substantial, ambiguous, or likely to touch multiple pages.
5. Extract entities, concepts, decisions, contradictions, and atomic claims.
6. Check existing promoted pages before creating new candidates or updating existing pages.
7. Update existing promoted pages directly only when the source impact is clear, cited, and low-risk; otherwise create candidates.
8. Create candidate pages in `wiki/candidates/` using page frontmatter from `Templates.md`.
9. Add important claims to `wiki/CLAIMS.md` **only through `gate.py`** — never hand-edit claim rows. For each claim, build the typed-slot JSON and run `python3 .claude/skills/wiki-update/gate.py --wiki wiki check <candidate.json>`, then obey the verdict (`--apply` on ADMIT). This is the same gated procedure as the `wiki-update` skill's `SessionUpdate.md` §7a; follow it rather than writing rows by hand. The gate assigns IDs, enforces the 12-column schema and column rules, and bounds the budget. Candidate claims must point to `wiki/candidates/...` until promotion.
10. Update `wiki/index.md`: promoted-page sections for promoted pages only, and the candidate review queue for candidates.
11. Update `wiki/ROUTING.md` with candidate routes only when the route is clearly durable, and mark those routes as candidate/non-authoritative.
12. Append an ingest entry to `wiki/log.md`.

## Candidate Naming

Use lowercase slug filenames:

- `wiki/candidates/source-<slug>.md`
- `wiki/candidates/entity-<slug>.md`
- `wiki/candidates/concept-<slug>.md`
- `wiki/candidates/analysis-<slug>.md`

## Contradictions

When a source contradicts existing claims:

- Do not delete the older claim.
- Add or update both claims in `CLAIMS.md`.
- Mark the relationship in notes: `contradicts C-XXXX` or `supersedes C-XXXX`.
- Create a candidate analysis page if the contradiction matters.

## Verification

Confirm:

- Source remains in `wiki/raw/`.
- Candidate pages include frontmatter, sources, and confidence.
- `CLAIMS.md` entries cite exact source paths.
- Candidate claims and routes point to `wiki/candidates/...` until promotion.
- `index.md` lists candidates in the candidate review queue without treating them as promoted pages.
- `log.md` has an ingest entry.
