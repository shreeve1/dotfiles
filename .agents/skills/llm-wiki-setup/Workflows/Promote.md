# Promote Workflow

Use this workflow to verify candidate pages and auto-promote them into the promoted wiki. Promotion is autonomous: once the checks below pass, promote without asking James. Do not promote a candidate that fails a check — fix it and re-verify, or discard it per the discard procedure.

## Inputs

- Candidate page path under `wiki/candidates/`.
- Target category: `sources`, `entities`, `concepts`, or `analyses`.

## Procedure

1. Read the candidate page.
2. Verify frontmatter includes the OKF-required `type` plus title, status, created, updated, sources, confidence, and tags. Verify OKF conformance: bundle-relative markdown links (no `[[wikilinks]]`), external sources under a `# Citations` section.
3. Verify factual claims are cited.
4. Check for duplicate promoted pages.
5. If a duplicate or conflict exists, resolve it autonomously — default to merging into the existing page (Branch A below) and logging the decision in `wiki/log.md`; replace only when the candidate clearly supersedes the old page (write the candidate's content to the target path under the same verify-then-remove discipline as Branch A — never a blind move/copy over an existing file, and mark what was superseded in the log and `CLAIMS.md` per the provenance rules), and keep both only when they cover genuinely different facets (the second page then promotes fresh via Branch B at its own slug). Never ask; when the choice is genuinely ambiguous, default to merge, log the ambiguity, and let James redirect afterwards.
6. Promote by exactly one of two branches, chosen by whether the target page already exists:

   **Branch A — surgical merge (target page exists, from step 5).** Never move/copy over an existing target. Edit the existing promoted page in place:
   - Merge body content section by section; append genuinely new sections, fold refinements into matching sections, and deduplicate `# Citations` entries.
   - Update frontmatter on the target: union `sources` and `tags`, keep the earliest `created`, set `updated` to today, keep `status: promoted`, reconcile `confidence` to the lower of the two when they disagree.
   - Verify the target now contains every non-duplicate section and citation from the candidate before touching the candidate file.
   - Only after that verification, remove the candidate file. An overwrite, a failed write, or a missing merged section means the candidate stays in place; never delete it to clean up.
   - Steps 7-11 then run against the existing target path (usually no inbound `/candidates/` links exist yet for a merged candidate; check anyway).

   **Branch B — fresh promotion (no target page exists).** Move/copy is safe only here, and even here the candidate is never deleted before the target is verified. Do not use `git mv` — it removes the source before verification; a plain copy lets Git infer the rename at commit time:
   - Write or copy the candidate content to the target path first.
   - Set `status: promoted` and update timestamps in the target file.
   - Verify the target file exists and contains the expected promoted frontmatter.
   - Only after verification, delete the candidate file. If verification fails after the target was written, delete the unverified target copy first — it did not exist before this attempt and must not linger as an orphan promoted page — then leave the candidate in place, log the failure per the discard-section rule, and retry or stop. The candidate is never deleted before a verified target exists.
7. Rewire inbound links: any other page linking to the old `/candidates/<slug>.md` path must be updated to the promoted `/<dir>/<slug>.md` path. The promoted page's own outbound bundle-relative links stay valid unchanged.
8. Update indexes: remove the page from the root candidate review queue and add it to its destination directory's `index.md` (OKF bullet listing with the page's `description`).
9. Update `wiki/ROUTING.md`.
10. Verify `wiki/CLAIMS.md`: claims for this page must point at the promoted path. Claims written this run already carry the final path (workflows gate-write claims after promotion); a legacy claim still pointing at `wiki/candidates/...` is repaired only through the gate, never a hand edit. Proven recipe (rollouts on seven wikis): demote-and-re-add — `gate.py demote --force C-XXXX` archives the row to `CLAIMS-cold.md` (history preserved), then `gate.py check --apply` re-admits it with the corrected path. Do NOT use supersede for this: a `check` carrying `supersedes:` returns a SUPERSEDE verdict at exit 3, and `--apply` only writes on ADMIT, so it is not executable. Do NOT use plain `consolidate prune`: eval-pinned rows revert it. Prerequisite: a non-empty `wiki/eval/*.eval` slice — if the wiki has none, author load-bearing cases first, since repair verification and future consolidation both depend on it.
11. Append a promotion entry to `wiki/log.md` (OKF `## YYYY-MM-DD` / `**Update**` format).

## Discarding Candidates

When verification fails, do not discard and do not ask — leave the candidate file in place under `wiki/candidates/` with its index row, routes, and claim references intact, and append a failure entry to `wiki/log.md` naming the failed check. The candidate stays retryable; a later run fixes and promotes it. Discard happens only on an explicit rejection by James or the project owner:

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
