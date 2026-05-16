# Setup Workflow

Use this workflow to initialize an LLM Wiki in the current project.

## 1. Notify

Send a short progress note: `Running the Setup workflow in llm-wiki-setup to initialize the project wiki.`

## 2. Interview

Ask only for missing information. Defaults are:

- Wiki root: `wiki/`
- Raw sources: `wiki/raw/`
- Candidate review gate: enabled
- Claims: enabled via `wiki/CLAIMS.md`
- Routing: enabled via `wiki/ROUTING.md`
- Optional search tooling: document only
- `AGENTS.md`: preserve existing rules, refactor lightly, add LLM Wiki section

Required questions when not already answered:

- What is the wiki's project/domain purpose?
- What source types will be ingested first?
- Should generated wiki files be committed to git?
- Who approves candidate promotion?
- Does the project already require a citation style?

## 3. Inspect

Before editing, read:

- Existing `AGENTS.md` if present.
- Existing `wiki/` if present.
- Project README or equivalent top-level docs if present.

Determine the project root before creating files. If the current project root is this skill's install repository, or contains `.config/opencode/skills/llm-wiki-setup/`, stop and ask James to confirm that the dotfiles repo is the intended target before creating `wiki/`.

Detect existing wiki state before writing:

- If `wiki/` exists and contains `index.md`, `log.md`, `ROUTING.md`, and `CLAIMS.md`, treat setup as a re-run and update only missing directories/files after confirming the existing wiki should be maintained.
- If `wiki/` exists but lacks the LLM Wiki core files, warn that the path may be an unrelated wiki and ask whether to reuse `wiki/`, choose another root, or abort.
- If only some core files exist, treat it as a partial initialization: report missing pieces, create only missing files, and append a recovery/setup entry to `wiki/log.md`.

Do not overwrite existing wiki files. If a file exists, update it surgically or ask before replacing.

## 4. Create Structure

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

Customize the initial `ROUTING.md` branches to the project domain when there is enough context.

## 5. Configure Raw Source Git Policy

Ask how raw sources should be handled in git:

- Commit raw sources: leave `.gitignore` unchanged, but warn about large binaries.
- Ignore large/binary raw sources: add targeted patterns such as `wiki/raw/**/*.pdf`, `wiki/raw/**/*.mp4`, `wiki/raw/**/*.zip`, and `wiki/assets/**` only after confirming.
- External storage: add a `wiki/raw/README.md` pointer convention and ignore external-only raw files if approved.

Do not edit `.gitignore` without explicit confirmation of the raw-source policy.

## 6. Refactor AGENTS.md

Run `Workflows/RefactorAgents.md`.

## 7. Verify

Verify with exact probes:

- `wiki/` directory exists.
- All required subdirectories exist.
- All required core files exist.
- `AGENTS.md` contains an `LLM Wiki` section.
- `wiki/log.md` contains a setup entry.
- Existing unrelated `wiki/` content was not overwritten.

## 8. Report

Report changed files, unanswered choices, and next recommended ingest source.
