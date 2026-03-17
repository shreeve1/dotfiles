---
description: Load project context for a new session
subtask: true
---

Rapidly load project context at the start of a new session. Do not use this mid-session when context is already loaded.

## Phase 1 — Explore Codebase

Use a task agent to perform a full codebase scan and report:
- Project overview and purpose
- Tech stack (languages, frameworks, build tools)
- Directory structure and key entry points
- Config directives from CLAUDE.md, AGENTS.md, or .opencode/
- Documentation status
- Patterns detected

Run `git ls-files` as backup verification of project files.

## Phase 2 — Resume Context

Check if `artifacts/sessions/` exists.

If it does:
1. List `artifacts/sessions/*_todos.md` sorted by modification time (newest first)
2. Read the most recent `_todos.md` to understand what was worked on last
3. If no todos files, check for recent `.jsonl` transcripts — note existence but do NOT read them

Include any pending or in-progress tasks from the last session.

## Phase 3 — Scan Available Resources

Discover what's available without loading everything:

1. List contents of `artifacts/docs/`, `artifacts/web-search/`, and `scripts/` if they exist
2. Read index files only: `artifacts/docs/README.md` and `scripts/README.md`
3. Read up to 3-4 files with clearly descriptive names (e.g., architecture.md)
4. List `artifacts/web-search/*.md` filenames — note topics, do NOT read full files

## Report

```markdown
## Project Overview
<name, type, architecture>

## Tech Stack
<languages, frameworks, build tools>

## Key Directories
<entry points and key directories>

## Config Directives
<key rules from CLAUDE.md, AGENTS.md, .opencode/>

## Session Context
<prior session status, pending/in-progress tasks>

## Available Resources
<docs/ and scripts/ overview>

## Cached Research
<available web-search topics>
```
