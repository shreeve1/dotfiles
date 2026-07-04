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
4. If present, update it to the compact section: layout, wiki-first search, and the mandatory end-of-run wiki check, plus the pointer to the `/llm-wiki-setup` and `/wiki-update` skills. Do NOT inline the ingest, query, promotion, lint, or discard step-by-step procedures — those live in the skills. If a prior version inlined those full workflows, replace them with the compact section to reduce CLAUDE.md bloat (preserve any non-wiki rules untouched).
5. Preserve local style: heading levels, tone, and path formatting. Remap the template's `##` and `###` heading depths to fit the surrounding file's hierarchy instead of pasting them verbatim when that would break structure.
6. Verify no existing non-wiki instruction was removed.
7. If both files were updated, diff the resulting LLM Wiki sections and reconcile any wording drift.

## Required Content

Keep the injected section compact (use the compact `Agent Instructions Section` in `Templates.md` verbatim, adapting only heading depth). Each updated file (`CLAUDE.md` and/or `AGENTS.md`) must mention, and no more:

- A one-line pointer that the project uses `wiki/` and is operated via the `/llm-wiki-setup` and `/wiki-update` skills, which own the ingest/query/promotion/lint/discard procedures (do NOT inline those procedures).
- Layout essentials: `wiki/` is an OKF v0.1 bundle; `wiki/index.md` (root, read first) + per-directory `index.md` + `wiki/ROUTING.md` (narrow), `wiki/raw/` immutable, `wiki/candidates/` review gate, promoted dirs (OKF concept pages: `type` frontmatter, bundle-relative markdown links not `[[wikilinks]]`, `# Citations`), `wiki/CLAIMS.md` (gated claims), `wiki/log.md` (append operations).
- A `Wiki-First Search` rule: for project-specific questions, investigations, design tasks, bug hunts, or code searches needing project context, check the wiki before broad repository search; when non-wiki search reveals durable knowledge the wiki lacks, note the gap and propose an ingest/candidate/promotion path.
- A `Mandatory End-of-Run Wiki Check` framed as required, not advisory: before reporting any task complete, decide whether it produced durable knowledge (direction/scope/ownership decisions, terminology/architecture/contract changes, superseding facts); if yes, run `/wiki-update` before reporting done (or state the gap + proposed path if deferred); if no, state one line confirming the check ran and nothing qualified. Mark superseded claims `superseded` with a pointer, never delete.

### Directories

- `wiki/raw/` — immutable source material; read, never rewrite.
- `wiki/raw/sessions/` — curated session captures created by `/wiki-update` when conversation evidence needs citation.
- `wiki/candidates/` — transient holding for generated pages awaiting lint and auto-promotion.
- `wiki/sources/` — promoted source summaries.
- `wiki/entities/` — promoted entity pages (services, bindings, agents, projects).
- `wiki/concepts/` — promoted concept pages (dispatch loop, reconcile lifecycle, etc.).
- `wiki/analyses/` — promoted query outputs and syntheses.
- `wiki/raw/assets/` — source attachments clipped with raw material.
- `wiki/assets/` — generated or wiki-native images and attachments.

## Verification

Use a diff review before claiming completion. Confirm:

- Existing rules remain present.
- The LLM Wiki section exists once.
- Paths match the project wiki layout.
