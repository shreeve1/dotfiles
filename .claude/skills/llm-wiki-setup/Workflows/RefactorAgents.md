# Refactor CLAUDE.md / AGENTS.md Workflow

Use this workflow to add project-local LLM Wiki operating rules to the project's agent-instruction files (`CLAUDE.md` and/or `AGENTS.md`) while preserving existing instructions.

## Target Files

Apply this workflow to each of the following that exists at the project root:

- `CLAUDE.md`
- `AGENTS.md`

If both exist, update both and keep the LLM Wiki section wording consistent between them. If neither exists, create `CLAUDE.md`. Do not create `AGENTS.md` when `CLAUDE.md` exists or was just created — OpenCode reads `CLAUDE.md` via the dotfiles `instructions[]` config.

## Rules

- Read the target file before editing it.
- If the target file does not exist and is the chosen default, create it with a concise project agent guide and the LLM Wiki section from `Templates.md`.
- If the target file exists, preserve every existing rule unless James explicitly approves removal.
- Prefer a light reorganization over a rewrite.
- Do not duplicate existing sections.
- Keep the LLM Wiki section operational, not philosophical.

## Procedure

Run these steps once per target file (`CLAUDE.md`, `AGENTS.md`):

1. Identify existing sections and project-specific rules.
2. Determine whether a `LLM Wiki` section already exists.
3. If absent, insert the section after project overview/editing conventions if present; otherwise append it near the end.
4. If present, update it to include directories, required files, wiki-first project search, session update, ingest, query, promotion, and lint workflows.
5. Preserve local style: heading levels, tone, and path formatting. Remap the template's `##` and `###` heading depths to fit the surrounding file's hierarchy instead of pasting them verbatim when that would break structure.
6. Verify no existing non-wiki instruction was removed.
7. If both files were updated, diff the resulting LLM Wiki sections and reconcile any wording drift.

## Required Content

Each updated file (`CLAUDE.md` and/or `AGENTS.md`) must mention:

- `wiki/raw/` is immutable.
- `wiki/candidates/` is the review gate.
- Read `wiki/index.md` before wiki-backed answers, then use `wiki/ROUTING.md` to narrow broad searches.
- Include a `Wiki-First Project Search` rule: for project-specific questions, investigations, design tasks, bug hunts, or code searches that require project context, check the wiki before broad repository search.
- When codebase, docs, or external search reveals durable knowledge missing from the wiki, mention the wiki gap and propose an ingest, candidate update, or promotion path.
- Append operations to `wiki/log.md`.
- Track factual claims in `wiki/CLAIMS.md`.
- Use `/wiki-update` to capture durable session decisions, verified facts, and follow-ups into the wiki.
- Include a `Maintenance Trigger` rule framed as a mandatory end-of-session check, not advisory: before reporting any task complete, decide whether it hit a trigger (durable decisions, terminology/architecture/contract changes, superseding facts); if yes, run `/wiki-update` before reporting done; if no, state one line confirming the wiki check ran and nothing qualified. Routine or already-documented work does not trigger a pass, and superseded claims are marked `superseded` with a pointer, never deleted.
- Offer to save durable query outputs as candidate pages.
- Include the lint workflow and candidate cleanup rules.

## Verification

Use a diff review before claiming completion. Confirm:

- Existing rules remain present.
- The LLM Wiki section exists once.
- Paths match the project wiki layout.
