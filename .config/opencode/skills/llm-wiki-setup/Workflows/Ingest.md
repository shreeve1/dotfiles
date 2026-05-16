# Ingest Workflow

Use this workflow when adding a new source to the wiki.

## Inputs

- Source path under `wiki/raw/`.
- Optional focus from James.

## Procedure

1. Read `wiki/ROUTING.md`, `wiki/index.md`, and `wiki/CLAIMS.md`.
2. Read the raw source.
3. Produce a short source summary with citations to the raw path.
4. Extract entities, concepts, decisions, contradictions, and atomic claims.
5. Check existing promoted pages before creating new candidates.
6. Create candidate pages in `wiki/candidates/` using page frontmatter from `Templates.md`.
7. Update `wiki/CLAIMS.md` with important claims and citation paths. Assign claim IDs by scanning existing `C-####` IDs and using the next available zero-padded integer.
8. Update `wiki/index.md` only for promoted pages; list candidates separately if useful.
9. Update `wiki/ROUTING.md` with candidate branches only when the route is clearly durable.
10. Append an ingest entry to `wiki/log.md`.

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
- `log.md` has an ingest entry.
