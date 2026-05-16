# Lint Workflow

Use this workflow to health-check the wiki.

## Checks

- Missing core files: `README.md`, `index.md`, `log.md`, `ROUTING.md`, `CLAIMS.md`.
- Broken wikilinks and path links.
- Promoted pages missing from `index.md`.
- Indexed pages that no longer exist.
- Orphan promoted pages with no route or inbound links.
- Candidate pages older than the project threshold.
- Candidate index rows, routes, or claim references whose candidate files no longer exist.
- Claims without citations.
- Claims whose source paths no longer exist.
- Duplicate entity or concept pages.
- Important concepts mentioned across pages but lacking their own page.
- Missing cross-references between related promoted pages.
- Data gaps that suggest a useful web search or new source request.
- Contradictions without notes in `CLAIMS.md`.
- Stale pages where newer sources likely supersede older summaries.

## Procedure

1. Inspect wiki files and report findings first.
2. Categorize findings as `critical`, `warning`, or `suggestion`.
3. Ask before broad rewrites or mass link changes.
4. Apply small deterministic fixes when safe: missing log entry, missing index row, stale candidate reference, obvious broken relative path.
5. Append a lint entry to `wiki/log.md`.

## Output

Report:

- Findings with file paths.
- Safe fixes applied.
- Fixes requiring approval.
- Suggested next source or promotion action.
