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

Detect existing wiki state before writing:

- If `wiki/` exists and contains all four of `index.md`, `log.md`, `ROUTING.md`, and `CLAIMS.md`, treat setup as a re-run and silently update only missing directories/files. Do not ask.
- If `wiki/` exists but lacks all four core files and contains content that looks unrelated (non-template Markdown, non-wiki subdirs), warn and ask whether to reuse `wiki/`, choose another root, or abort.
- If only some core files exist and the rest of `wiki/` matches the template structure, treat it as a partial initialization: create only missing files and append a recovery/setup entry to `wiki/log.md`.

Do not overwrite existing wiki files. If a file exists, update it surgically or ask before replacing.

When setup is a re-run or partial recovery against a wiki that already holds promoted pages or claims, run the outdated-source check from `Workflows/Lint.md` (the Content Drift Check, default staleness scope) over the existing content. Report findings in the final report; do not auto-rewrite drifted claims or pages. A fresh init over an empty wiki skips this check.

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
```

Create missing files from `Templates.md`:

- `wiki/README.md`
- `wiki/index.md`
- `wiki/log.md`
- `wiki/ROUTING.md`
- `wiki/CLAIMS.md`

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
- All required subdirectories exist.
- All required core files exist.
- Each of `CLAUDE.md` and `AGENTS.md` that exists contains an `LLM Wiki` section.
- `wiki/log.md` contains a setup entry.
- `.gitignore` contains the `# LLM Wiki` block, or the setup entry notes "not a git repo".
- Existing unrelated `wiki/` content was not overwritten.

## 7. Report

Report changed files plus a prioritized shortlist of 3-5 high-value ingest sources inferred from project docs (with source paths when known). Do not auto-ingest. Suggest the next step in natural language, e.g. `Next: ingest <path> into the wiki` — this matches the `ingest source` trigger row in `SKILL.md`.

On a re-run or partial recovery, also report outdated-source findings from the Content Drift Check (claim ID or page, cited path, asserted vs. current, proposed action). Do not apply drift fixes automatically.
