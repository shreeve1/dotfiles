# Setup Workflow

Use this workflow to initialize an LLM Wiki in the current project.

Initial setup is for future AI sessions, not James. Run end-to-end with defaults from `SKILL.md`. Do not interview unless an ambiguity blocks progress (existing unrelated `wiki/`, dotfiles install repo as target, or James proactively supplied overrides in the invoking prompt).

## 1. Notify

Send a short progress note: `Running the Setup workflow in llm-wiki-setup to initialize the project wiki.`

## 2. Inspect

Before editing, read:

- Existing `CLAUDE.md` if present.
- Existing `AGENTS.md` if present.
- Existing `wiki/` if present.
- Project README or equivalent top-level docs if present.

Determine the project root before creating files. If the current project root is this skill's install repository, or contains `.claude/skills/llm-wiki-setup/`, stop and ask James to confirm that the dotfiles repo is the intended target before creating `wiki/`.

Confirm the companion gate is present: `.claude/skills/wiki-update/gate.py` must exist. It is the only sanctioned path into `CLAIMS.md` and backs migrate, verify, and consolidation. If it is missing, stop and report that the `wiki-update` skill must be installed before the wiki can be operated — do not silently fall back to hand-editing claim rows.

Detect existing wiki state before writing:

- If `wiki/` exists and contains all four of `index.md`, `log.md`, `ROUTING.md`, and `CLAIMS.md`, treat setup as a re-run and silently update only missing directories/files. Do not ask.
- If `wiki/` exists but lacks all four core files and contains content that looks unrelated (non-template Markdown, non-wiki subdirs), warn and ask whether to reuse `wiki/`, choose another root, or abort.
- If only some core files exist and the rest of `wiki/` matches the template structure, treat it as a partial initialization: create only missing files and append a recovery/setup entry to `wiki/log.md`.

Do not overwrite existing wiki files. If a file exists, update it surgically or ask before replacing.

### Migrate an existing CLAIMS.md to the current schema

On a re-run or partial recovery, check whether the existing `wiki/CLAIMS.md` header is the 12-column `gate.py` schema (`| ID | Kind | Claim | Source | Page | Confidence | Status | Created | Hits | Superseded | Impact | Notes |`). A wiki created before the schema was widened (e.g. a hand-curated 7-column table) will break the `wiki-update` skill's claim gate.

If the header is narrower, migrate it in place by running the companion skill's gate:

```sh
python3 .claude/skills/wiki-update/gate.py --wiki wiki migrate
```

This is idempotent and reuses `gate.py`'s own parser/serializer: every existing row is preserved, missing columns are added with safe defaults (`Hits=0`, blank `Kind`/`Impact`/`Created`), and an already-canonical file is left byte-identical. It widens `CLAIMS.md` and, if present, `CLAIMS-cold.md`. Note the migration in the setup log entry. After migrating, the blank `Kind`/`Impact` fields on legacy rows are filled opportunistically by later gated `wiki-update` writes; do not bulk-edit them during setup.

When setup is a re-run or partial recovery against a wiki that already holds promoted pages or claims, run the outdated-source check from `Workflows/Lint.md` (the Content Drift Check, default staleness scope) over the existing content. Report findings in the final report; do not auto-rewrite drifted claims or pages. A fresh init over an empty wiki skips this check.

### Migrate an existing wiki to OKF conformance

A wiki created before OKF adoption uses `[[wikilinks]]`, a single table-format global `index.md`, no per-directory indexes, `## [YYYY-MM-DD] type | Title` log headings, and page frontmatter without a guaranteed `type`. On a re-run or partial recovery, detect and migrate it to OKF v0.1. Skip this entirely for a fresh init (nothing to migrate) and skip any dimension already conformant.

Detect non-conformance with cheap probes over the existing wiki:

- `grep -rl '\[\[' wiki --include='*.md' | grep -v '^wiki/raw/'` — pages still using wikilinks (exclude `wiki/raw/`, which is immutable and never migrated).
- Root `wiki/index.md` uses `| Page | Summary |` table headers instead of `* [Title](/path.md) - desc` bullets, or lacks `okf_version`.
- Concept directories (`sources/`, `entities/`, `concepts/`, `analyses/`, `candidates/`) missing their own `index.md`.
- `wiki/log.md` headings match `## [YYYY-MM-DD]` instead of `## YYYY-MM-DD`.
- Promoted/candidate pages whose frontmatter has no `type`, or governance sidecars (`CLAIMS.md`, `ROUTING.md`, `README.md`, `eval/README.md`) without a `type`.

Migrate each non-conformant dimension. This edits generated wiki pages (never `wiki/raw/`, which stays immutable):

1. **Links:** rewrite `[[Concept Name]]` → bundle-relative markdown `[Concept Name](/<dir>/<slug>.md)`. Resolve each target to its actual promoted path via the per-directory `index.md` files (use the root `index.md` to find the relevant directory, then that directory's `index.md` for the exact path); if a wikilink target has no page, leave the display text and add it to the report as a broken/not-yet-written link (OKF tolerates broken links; do not invent a target). Preserve any alias syntax (`[[Name|Alias]]` → `[Alias](/path.md)`).
2. **Root index:** convert the table catalog to the OKF §6 bullet listing (`* [Title](/path.md) - description`), add `okf_version: "0.1"` frontmatter, and keep the candidate review queue as a bullet section.
3. **Per-directory indexes:** create a `<Dir> Index` in each concept directory listing its pages with descriptions pulled from each page's `description`/summary frontmatter.
4. **Log:** reformat headings to `## YYYY-MM-DD` and convert entries to bold-action-word bullets; preserve every existing entry's content. Append, never drop, history.
5. **Page frontmatter:** ensure every page has a `type` (map the existing page category, or infer a descriptive value); add `description`/`timestamp` where derivable. Preserve all existing extension keys (`status`, `created`, `updated`, `sources`, `confidence`, `tags`).
6. **Citations:** where a page lists external URLs inline or in a `sources:`-style trailer, gather them under a `# Citations` section at the bottom. Leave inline cross-page links in the body.
7. **Sidecars:** add the `type` frontmatter block to `CLAIMS.md` (`claims-registry`), `ROUTING.md` (`routing-index`), `README.md` (`wiki-readme`), `eval/README.md` (`wiki-eval-readme`) per `Templates.md`, and `CLAIMS-cold.md` (`claims-registry-cold`) if it already exists. The `CLAIMS.md`/`CLAIMS-cold.md` blocks are opaque preamble to `gate.py` and survive `migrate`/writes — verified safe. (`gate.py` now creates new cold files with `type` frontmatter automatically; only a pre-existing legacy cold file needs the block added.)

This link/index/frontmatter migration is content editing, not a `gate.py` operation; `gate.py migrate` only handles the `CLAIMS.md` column schema (above). Run both when recovering an old wiki: `gate.py migrate` for the claims table, this step for OKF shape. Log an OKF-migration entry in `wiki/log.md` recording which dimensions were converted. For a large wiki, migrate deterministic dimensions (indexes, log headings, sidecar frontmatter) automatically and report link rewrites that could not resolve a target rather than guessing.

## 3. Create Structure

Create missing directories:

```text
wiki/raw/
wiki/candidates/
wiki/sources/
wiki/entities/
wiki/concepts/
wiki/analyses/
wiki/assets/
wiki/eval/
```

Create missing files from `Templates.md`:

- `wiki/README.md`
- `wiki/index.md` (root OKF index — bullet listing, `okf_version: "0.1"` frontmatter)
- `wiki/log.md`
- `wiki/ROUTING.md`
- `wiki/CLAIMS.md`
- `wiki/eval/README.md`
- A per-directory `index.md` in each concept-bearing directory: `wiki/sources/index.md`, `wiki/entities/index.md`, `wiki/concepts/index.md`, `wiki/analyses/index.md`, `wiki/candidates/index.md` (OKF §6 progressive disclosure; use the per-subdirectory index template). These start with just the section heading and no page rows until pages are added.

This is a conformant OKF v0.1 bundle: every non-reserved `.md` carries a `type`, `index.md`/`log.md` are the reserved files, links are bundle-relative markdown, and citations sit under `# Citations`. See `Architecture.md` → OKF Conformance.

`wiki/eval/` holds the regression slice that gates claim consolidation. `gate.py consolidate` refuses to run with an empty `eval/` (it cannot verify a merge/prune kept load-bearing claims), so create the directory and a `README.md` documenting the format at setup time. Each `*.eval` file holds one case per line: `<query text> ||| <token that must survive in CLAIMS.md>`. Lines that are blank or start with `#` are ignored. Seed no cases at setup — the file documents the format; `wiki-update` authors cases as high-value claims land.

Customize the initial `ROUTING.md` branches to the project domain inferred from `README.md`, `CLAUDE.md`, `AGENTS.md`, or top-level docs. If nothing infers cleanly, leave the template branches as-is.

Append a setup entry to `wiki/log.md` using the `Templates.md` log format. Record created files, inferred domain, and whether this was a fresh setup, partial recovery, or re-run.

## 4. Apply Default Git Policy

Ensure the project has a `.gitignore` with a `# LLM Wiki` block ignoring common raw binaries. Skip silently if the project is not a git repo (no `.git/`).

- If `.gitignore` exists and lacks the block: append it.
- If `.gitignore` does not exist but `.git/` does: create `.gitignore` containing only the block.
- If neither exists: skip and note "not a git repo" in the setup log entry.

Block to write:

```text
# LLM Wiki
wiki/raw/**/*.pdf
wiki/raw/**/*.mp4
wiki/raw/**/*.mov
wiki/raw/**/*.zip
wiki/raw/**/*.tar
wiki/raw/**/*.gz
wiki/raw/**/*.bin
wiki/assets/**
```

Do not touch `.gitignore` further. Generated wiki files commit by default.

## 5. Refactor CLAUDE.md and AGENTS.md

Run `Workflows/RefactorAgents.md` against each of `CLAUDE.md` and `AGENTS.md` that exists at the project root. If neither exists, create `CLAUDE.md`. Do not create `AGENTS.md` when `CLAUDE.md` already exists or was just created — OpenCode reads `CLAUDE.md` via the dotfiles `instructions[]` config.

## 6. Verify

Verify with exact probes:

- `wiki/` directory exists.
- All required subdirectories exist, including `wiki/eval/` with a `README.md` documenting the `.eval` format.
- All required core files exist.
- `.claude/skills/wiki-update/gate.py` exists (the claim gate the wiki depends on).
- `wiki/CLAIMS.md` header is the 12-column `gate.py` schema (`| ID | Kind | Claim | Source | Page | Confidence | Status | Created | Hits | Superseded | Impact | Notes |`). A narrower hand-curated table will break the `wiki-update` skill's claim gate.
- OKF conformance: `wiki/index.md` uses the bullet listing with `okf_version: "0.1"`; each concept directory has its own `index.md`; `CLAIMS.md`/`ROUTING.md`/`README.md`/`eval/README.md` carry a `type` frontmatter block; no promoted page uses `[[wikilinks]]` (`grep -rl '\[\[' wiki --include='*.md' | grep -v '^wiki/raw/'` returns nothing among promoted/candidate pages); `wiki/log.md` uses `## YYYY-MM-DD` headings.
- Each of `CLAUDE.md` and `AGENTS.md` that exists contains an `LLM Wiki` section.
- `wiki/log.md` contains a setup entry (and an OKF-migration entry on a migration run).
- `.gitignore` contains the `# LLM Wiki` block, or the setup entry notes "not a git repo".
- Existing unrelated `wiki/` content was not overwritten.

## 7. Report

Report changed files plus a prioritized shortlist of 3-5 high-value ingest sources inferred from project docs (with source paths when known). Do not auto-ingest. Suggest the next step in natural language, e.g. `Next: ingest <path> into the wiki` — this matches the `ingest source` trigger row in `SKILL.md`.

On a re-run or partial recovery, also report outdated-source findings from the Content Drift Check (claim ID or page, cited path, asserted vs. current, proposed action). Do not apply drift fixes automatically.

On an OKF migration run, report which conformance dimensions were converted (links, root index, per-directory indexes, log format, page frontmatter, citations, sidecars) and list any wikilink targets that could not be resolved to a promoted page (left as not-yet-written links for manual follow-up).
