---
description: Run a medium-depth codebase scan for session priming
subtask: true
---

Run a medium-depth scan at the start of a new session to understand what the project does, how it is structured, and what to work on next. Do not use this mid-session when context is already loaded.

## Phase 1 — Git Context

Run these commands in parallel:

1. `git log --oneline -15` — recent commit history
2. `git branch -a --sort=-committerdate | head -12` — active branches
3. `git diff --stat HEAD~8 2>/dev/null` — recent file changes
4. `git status --short` — uncommitted work

If opencode-git-memory is active, the plugin will have already injected conversation notes from prior sessions. If the agent has `git_notes_read` available, mention it can retrieve full transcripts.

## Phase 2 — Medium Project Scan

Use a sub-agent to run the scan first, then validate key findings locally.

1. Launch the `explore` sub-agent with **medium** thoroughness to map:
   - project purpose and likely user value
   - major directories/modules and ownership boundaries
   - runtime/build/test toolchain
   - entry points and main execution paths
   - notable risks, unknowns, and missing context
2. Ask the sub-agent to return concise evidence with file paths (manifests, entry files, key docs/tests).
3. Validate critical findings by reading the cited files directly before final reporting.
4. If the `explore` sub-agent is unavailable, perform the same scan manually using Read/Glob/Grep.

Then perform a targeted scan to infer project purpose, architecture, and workflows:

1. List top-level directories and key subdirectories (`src`, `app`, `cmd`, `internal`, `lib`, `services`, `packages`, `tests`, `docs`, `scripts`) if present.
2. Read project directives if present: `AGENTS.md` or `.opencode/AGENTS.md`.
3. Read all relevant manifest/build files that exist: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, `Gemfile`, `composer.json`, `Makefile`, `Taskfile.yml`.
4. Identify likely entry points and app wiring (for example `main.*`, `index.*`, `server.*`, framework bootstrap files, CLI entry files).
5. Sample representative source files from core areas (2-3 files per major area, max ~12 files total) to understand domain, architecture, and coding patterns.
6. Review tests and docs to infer intended behavior, critical flows, and quality expectations.

Avoid exhaustive deep dives. This is a medium in-depth scan: enough detail to explain what the project is about, but still fast enough to run at session start.

## Phase 3 — Resume Prior Work

Check if `artifacts/sessions/` exists. If it does:

1. List `artifacts/sessions/*_todos.md` sorted by modification time (newest first)
2. Read only the most recent `_todos.md` for pending/in-progress tasks
3. Do NOT read transcripts or other session files

## Report

```markdown
## Recent Activity
<last 5-10 commits, current branch, uncommitted changes>

## What This Project Is
<2-4 sentences describing purpose, users, and primary capabilities>

## Architecture Snapshot
<runtime/platforms, major modules, entry points, and data/control flow at a high level>

## Tech Stack
<languages, frameworks, package/build tools, test tools>

## Key Areas
<major directories/components and what each owns>

## Developer Workflows
<how to run, test, lint, build, and any migration/setup steps found>

## Directives
<key rules from AGENTS.md if present>

## Pending Work
<in-progress or pending tasks from last session, or "none">

## Open Questions / Risks
<missing context, ambiguous architecture points, or likely investigation follow-ups>
```
