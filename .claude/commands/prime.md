---
name: prime
allowed-tools: Bash, Read, Glob, Task
description: Load context for a new agent session by analyzing codebase structure, documentation and README
---

# Prime

Quickly load project context by delegating exploration to the explorer agent, then gather session history and available resources.

## Checklist
You MUST create a task for each of these items and complete them in order:
1. **Delegate exploration** — use Task tool to spawn explorer agent for full codebase scan
2. **Verify git files** — run git ls-files as backup/verification
3. **Resume context** — check artifacts/sessions/, find most recent session, read todo summary
4. **Scan available resources** — list contents of artifacts/docs/ and scripts/, read index files only

## Execute

1. **Delegate exploration to the explorer agent** - Use Task tool with subagent_type: "explorer" and model: "haiku" to spawn the explorer agent for a full codebase scan:

```
Perform a full exploration of this codebase. Report back with:
- project_overview
- tech_stack
- structure
- claude_md directives
- documentation status
- patterns_detected
```

2. `git ls-files` (as backup/verification)

## Resume Context

Check if the project has an `artifacts/sessions/` directory. If it does:

1. **Find the most recent session** by listing `artifacts/sessions/*_todos.md` sorted by modification time (newest first)
2. **Read the most recent `_todos.md` file** to understand what was worked on last and any outstanding tasks
3. If no `_todos.md` files exist, check for the most recent `.jsonl` transcript file instead — note its existence but do NOT read it (too large)

This gives awareness of prior session context. If there are pending or in-progress tasks from the last session, mention them in the Report.

## Scan

Discover what's available in `artifacts/docs/`, `artifacts/web-search/`, and `scripts/` without loading everything:

1. **List contents** of `artifacts/docs/`, `artifacts/web-search/`, and `scripts/` directories (if they exist)
2. **Read index files only**: `artifacts/docs/README.md` and `scripts/README.md` (if they exist)
3. **Read any file names that clearly describe the project's purpose or architecture** (e.g. `artifacts/docs/architecture.md`, `artifacts/docs/getting-started.md`) — limit to 3-4 key files max
4. **Check web search cache**: List `artifacts/web-search/*.md` files (if they exist) and note available research topics from filenames — do NOT read full files, just note what research exists

Do NOT read every file in these directories. The goal is awareness of what's available, not full ingestion.

## Report

Synthesize the explorer agent's findings with session history into a concise summary:

```markdown
## Project Overview
<name, type, architecture from explorer>

## Tech Stack
<languages, frameworks, build tools>

## Key Directories
<entry points and key directories from explorer>

## CLAUDE.md Directives
<key rules if present>

## Session Context
<prior session status if artifacts/sessions exists>

## Available Resources
<docs/ and scripts/ overview>

## Cached Research
<list of available web-search research topics from artifacts/web-search/, if any>
```
