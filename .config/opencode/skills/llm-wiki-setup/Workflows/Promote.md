# Promote Workflow

Use this workflow to move reviewed candidate pages into the promoted wiki.

## Inputs

- Candidate page path under `wiki/candidates/`.
- Target category: `sources`, `entities`, `concepts`, or `analyses`.

## Procedure

1. Read the candidate page.
2. Verify frontmatter includes title, type, status, created, updated, sources, confidence, and tags.
3. Verify factual claims are cited.
4. Check for duplicate promoted pages.
5. If duplicate or conflict exists, ask whether to merge, replace, or keep both.
6. Promote crash-safely:
   - Prefer `git mv` when the project is a git repository and both source and target are tracked or intended to be tracked.
   - Otherwise write or copy the candidate content to the target path first.
   - Set `status: promoted` and update timestamps in the target file.
   - Verify the target file exists and contains the expected promoted frontmatter.
   - Only after verification, remove the candidate file.
7. Update `wiki/index.md`.
8. Update `wiki/ROUTING.md`.
9. Update `wiki/CLAIMS.md` for claim page paths.
10. Append a promotion entry to `wiki/log.md`.

## Verification

Confirm:

- Candidate path no longer exists.
- Promoted page exists in the target directory.
- Promoted page was verified before the candidate was removed.
- Index row points to the promoted path.
- Routes include the promoted path where relevant.
- Claims point to the promoted page path.
