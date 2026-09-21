# Promote Workflow

Use this workflow to move reviewed candidate pages into the promoted wiki.

## Inputs

- Candidate page path under `wiki/candidates/`.
- Target category: `sources`, `entities`, `concepts`, or `analyses`.

## Procedure

1. Read the candidate page.
2. Verify frontmatter includes the OKF-required `type` plus title, status, created, updated, sources, confidence, and tags. Verify OKF conformance: bundle-relative markdown links (no `[[wikilinks]]`), external sources under a `# Citations` section.
3. Verify factual claims are cited.
4. Check for duplicate promoted pages.
5. If duplicate or conflict exists, ask whether to merge, replace, or keep both.
6. Promote crash-safely:
   - Prefer `git mv` when the project is a git repository and both source and target are tracked or intended to be tracked.
   - Otherwise write or copy the candidate content to the target path first.
   - Set `status: promoted` and update timestamps in the target file.
   - Verify the target file exists and contains the expected promoted frontmatter.
   - Only after verification, remove the candidate file.
7. Rewire inbound links: any other page linking to the old `/candidates/<slug>.md` path must be updated to the promoted `/<dir>/<slug>.md` path. The promoted page's own outbound bundle-relative links stay valid unchanged.
8. Update indexes: remove the page from the root candidate review queue and add it to its destination directory's `index.md` (OKF bullet listing with the page's `description`).
9. Update `wiki/ROUTING.md`.
10. Update `wiki/CLAIMS.md` for claim page paths.
11. Append a promotion entry to `wiki/log.md` (OKF `## YYYY-MM-DD` / `**Update**` format).

## Discarding Candidates

When James or the project owner rejects a candidate instead of promoting it:

1. Read the candidate page and identify its candidate index row, candidate routes, and candidate claim references.
2. Remove every candidate-only `wiki/CLAIMS.md` entry that points to the rejected `wiki/candidates/...` path, or mark it inactive after clearing the removed candidate page path.
3. Remove candidate-only routes from `wiki/ROUTING.md`.
4. Remove the candidate row from the root `wiki/index.md` candidate review queue.
5. Remove the candidate file only after the cleanup is verified.
6. Append a discard entry to `wiki/log.md` with the reason when provided.

## Verification

Confirm:

- Candidate path no longer exists.
- Promoted page exists in the target directory.
- Promoted page was verified before the candidate was removed.
- The destination directory `index.md` lists the promoted page; the root candidate queue no longer does.
- No page still links to the old `/candidates/<slug>.md` path.
- Routes include the promoted path where relevant.
- Claims point to the promoted page path.

For discarded candidates, confirm no index row, route, or claim still points at the removed candidate path.
