# Ingest Workflow

Use this workflow when adding a new source to the wiki.

## Inputs

- Source path under `wiki/raw/`.
- Optional focus from James.

## Procedure

1. Read `wiki/index.md`, then `wiki/ROUTING.md`, then `wiki/CLAIMS.md`.
2. Read the raw source.
3. Produce a short source summary with citations to the raw path.
4. When the source is substantial, ambiguous, or likely to touch multiple pages, decide emphasis and scope autonomously; record the judgment and any residual ambiguity in the ingest log entry rather than asking James.
5. Extract entities, concepts, decisions, contradictions, and atomic claims.
6. Check existing promoted pages before creating new candidates or updating existing pages.
7. Update existing promoted pages directly only when the source impact is clear, cited, and low-risk; otherwise create candidates.
8. Create candidate pages in `wiki/candidates/` using page frontmatter from `Templates.md`. Pages must be OKF-conformant: a `type` field in frontmatter, cross-links to other pages as bundle-relative markdown links (`[Name](/concepts/name.md)`, never `[[wikilinks]]`), and external sources under a `# Citations` section at the bottom.
9. Auto-promote every candidate created this ingest via `Workflows/Promote.md` — verification checks, duplicate resolution, crash-safe promotion, and index/route rewiring. Do not end the ingest with candidates parked for review.
10. Add important claims to `wiki/CLAIMS.md` **only through `gate.py`**, and only after promotion — `gate.py` has no repath/update operation, so a claim written against a `wiki/candidates/...` path can never be rewired without a forbidden hand edit or a prune-and-re-add. Resolve `WIKI_GATE` through `wiki-update/resolve-gate.py` as specified in the skill contract, then run `python3 "$WIKI_GATE" --wiki wiki check <candidate.json>` and obey the verdict (`--apply` on ADMIT). This is the same gated procedure as the `wiki-update` skill's `SessionUpdate.md` §7a. Claim `page` fields use the final `wiki/<dir>/<slug>.md` promoted path.
11. Update indexes: promoted pages go to their directory's `index.md` (OKF bullet listing) and out of the root candidate review queue (Promote.md step 8 already did this; verify). Keep the root index's directory enumeration current.
12. Update `wiki/ROUTING.md`: promote candidate routes to authoritative promoted paths where durable.
13. Append an ingest entry to `wiki/log.md`.

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
- Candidate pages include frontmatter (with `type`), sources, and confidence, and are OKF-conformant (bundle-relative markdown links, `# Citations` section).
- `CLAIMS.md` entries cite exact source paths, and every claim `page` field written this ingest points to the final `wiki/<dir>/<slug>.md` promoted path (never `wiki/candidates/...`).
- Routes point to promoted paths, not candidate paths.
- Promotion completed for every candidate created this ingest: no candidate file from this run remains under `wiki/candidates/`, and each promoted page is listed in its destination directory's `index.md`, not the root candidate queue.
- `log.md` has an ingest entry.
