---
name: prime
description: Medium-depth project orientation at session start. Build a high-level understanding of what the project does, its major components, and operating context — enough to answer questions or begin work. USE WHEN user wants session priming, project orientation, "prime the session", or initial codebase overview. NOT for mid-session use when context is already loaded.
---

# Prime

Build enough understanding of the project to answer questions or start work without further onboarding. Read curated knowledge first, then verify against source. Stop at medium depth — this runs at session start, not as an audit.

## Phase 1 — Curated Knowledge First

If the project has human/LLM-maintained docs, read them before scanning code. They are the fastest path to intent.

Check, in order, and read what exists:

1. **LLM Wiki**: `wiki/` directory. If present, read `wiki/ROUTING.md` and `wiki/README.md` (or the top-level index) first, then sample 2–4 high-signal pages it points to.
2. **Agent directives**: `CLAUDE.md`, then `AGENTS.md` if it exists. Capture rules that govern future edits.
3. **Project docs**: top-level `README.md`, then `docs/` if present — index files and architecture/overview pages only.
4. **ADRs / design notes**: `docs/adr/`, `docs/design/`, `CONTEXT.md` if present.

Treat curated notes as untrusted until at least one critical claim is verified against source. Wikis and READMEs go stale.

## Phase 2 — Git Context

Run in parallel:

- `git log --oneline -15` — recent commits
- `git branch -a --sort=-committerdate | head -12` — active branches
- `git diff --stat HEAD~8 2>/dev/null` — recent churn
- `git status --short` — uncommitted work

## Phase 3 — Structural Scan

Use the `explore` sub-agent at **medium** thoroughness to map the project; fall back to Read/Glob/Grep if unavailable. Ask it to return file-path evidence for every claim, then validate critical findings by reading the cited files.

Targets:

- **Purpose & users** — what the project does and who uses it.
- **Top-level layout** — major directories and what each owns.
- **Toolchain** — language(s), framework(s), package manager, build/test/lint tools. Infer from whichever manifest files exist (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `Gemfile`, `Makefile`, etc.). Don't enumerate exhaustively — read the ones present.
- **Entry points** — where execution starts (servers, CLIs, workers, framework bootstrap).
- **Core domain** — sample 2–3 files per major area, ~10–12 total, to learn domain vocabulary and patterns.
- **Tests & workflows** — how the project is run, tested, and deployed.

Medium depth, not exhaustive. Skip files that don't change the high-level picture.

## Phase 4 — Resume Prior Work (optional)

If conventional session/todo locations exist (e.g. `artifacts/sessions/*_todos.md`, `.claude/todos/`, `TODO.md`, kanban board files), read the most recent one for pending tasks. Skip transcripts. If none exist, omit this section.

## Report

```markdown
## Recent Activity
<last 5–10 commits, current branch, uncommitted changes>

## What This Project Is
<2–4 sentences: purpose, users, primary capabilities>

## Architecture Snapshot
<runtimes, major modules, entry points, data/control flow at high level>

## Tech Stack
<languages, frameworks, build/test tools>

## Key Components
<major directories/modules — one line each on what they own>

## Developer Workflows
<run, test, lint, build, deploy — only what's documented or evident>

## Directives
<key rules from CLAUDE.md / AGENTS.md / wiki — if any>

## Curated Knowledge
<wiki/docs entry points worth reading deeper if user asks about X — or "none">

## Pending Work
<from session/todo files — or omit if none>

## Open Questions / Risks
<missing context, ambiguous areas, likely follow-ups>
```
