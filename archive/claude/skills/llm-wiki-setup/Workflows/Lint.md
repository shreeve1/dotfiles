# Lint Workflow

Use this workflow to health-check the wiki.

## Checks

- Missing core files: `README.md`, `index.md`, `log.md`, `ROUTING.md`, `CLAIMS.md`.
- Broken markdown links and path links (OKF tolerates a link to a not-yet-written page — flag as a suggestion, not an error).
- OKF conformance: pages using `[[wikilinks]]` (`grep -rl '\[\[' wiki --include='*.md' | grep -v '^wiki/raw/'` — `wiki/raw/` is immutable, never migrated); non-reserved `.md` files missing a `type` frontmatter field; concept directories missing their own `index.md`; root `index.md` missing `okf_version` or still in table format; `log.md` not using `## YYYY-MM-DD` headings; governance sidecars (`CLAIMS.md`/`ROUTING.md`/`README.md`/`eval/README.md`, plus `CLAIMS-cold.md` when it exists) missing a `type`. These are OKF-migration findings — propose the Setup OKF-migration step.
- Promoted pages missing from their directory `index.md`.
- Indexed pages that no longer exist.
- Orphan promoted pages with no route or inbound links.
- Candidate pages older than the project threshold.
- Candidate index rows, routes, or claim references whose candidate files no longer exist.
- Claims without citations.
- Claims whose source paths no longer exist.
- Claim content drift: claims whose cited source path still exists but whose current content no longer supports the claim (renamed symbol, changed behavior, edited raw source, moved code).
- Page frontmatter `sources:` paths that exist but whose content diverges from the page's summary.
- Duplicate entity or concept pages.
- Important concepts mentioned across pages but lacking their own page.
- Missing cross-references between related promoted pages.
- Data gaps that suggest a useful web search or new source request.
- Contradictions without notes in `CLAIMS.md`.
- Stale pages where newer sources likely supersede older summaries.

## Content Drift Check

Structural checks confirm a cited path still exists. The drift check confirms the cited path still *says what the claim says*. It is heavier (it reads sources), so scope it:

1. Default scope: claims and pages whose `updated` date is older than the project staleness threshold, or all when James asks for a full audit. Accept an optional path/glob filter from James to limit the sweep.
2. For each in-scope `CLAIMS.md` row and each page `sources:` entry whose path exists, read the cited source (raw file, code path, or wiki page).
3. Compare the cited content against the claim text or page summary. Flag divergence when a referenced symbol was renamed or removed, behavior changed, the raw source was edited, or the cited line/section no longer contains the supporting evidence.
4. Never auto-rewrite a drifted claim. Follow the provenance rule: keep the old claim, mark it `superseded` (or `active` with a drift note) and propose a replacement claim or a candidate analysis page citing current evidence.
5. Report each drift finding with: claim ID or page, cited path, what the claim asserts, what the source now shows, and proposed action.

## Claim Gate Audit

Run the companion gate's own audit, which checks `CLAIMS.md` for budget and schema violations the structural checks above do not cover (over-budget hot file, malformed rows, a claim that reached the file without passing the write gate):

```sh
python3 ~/.claude/skills/wiki-update/gate.py --wiki wiki audit
```

Report any problems it prints (non-zero exit, or `maintenance_due: true`). A non-zero exit is a `critical` finding. `maintenance_due` is a `warning` — recommend the `wiki-update` §7b hot/cold split and gated consolidation. If `gate.py` is missing, report that as a `critical` finding (the wiki cannot enforce its claim schema without it).

## Procedure

1. Inspect wiki files and report structural findings first.
2. Run the Claim Gate Audit and the Content Drift Check within scope.
3. Categorize findings as `critical`, `warning`, or `suggestion`.
4. Ask before broad rewrites, mass link changes, or any claim supersession.
5. Apply small deterministic fixes when safe: missing log entry, missing index row, stale candidate reference, obvious broken relative path. Drift fixes are never auto-applied.
6. Append a lint entry to `wiki/log.md`.

## Output

Report:

- Findings with file paths.
- Content drift findings: claim ID or page, cited path, asserted vs. current, proposed action.
- Safe fixes applied.
- Fixes requiring approval.
- Suggested next source or promotion action.
