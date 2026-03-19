---
description: Load project context for a new session
subtask: true
---

Quickly load project context at the start of a new session. Do not use this mid-session when context is already loaded.

## Phase 1 — Git Context

Run these commands in parallel:

1. `git log --oneline -15` — recent commit history
2. `git branch -a --sort=-committerdate | head -10` — active branches
3. `git diff --stat HEAD~5 2>/dev/null` — recent file changes
4. `git status --short` — uncommitted work

If opencode-git-memory is active, the plugin will have already injected conversation notes from prior sessions. If the agent has `git_notes_read` available, mention it can retrieve full transcripts.

## Phase 2 — Light Project Scan

Read these files if they exist (skip missing ones, do not search):

1. `AGENTS.md` or `.opencode/AGENTS.md` — project directives
2. `package.json`, `Cargo.toml`, `go.mod`, or `pyproject.toml` — tech stack and dependencies
3. Top-level directory listing only (`ls`) — do NOT recurse

Do NOT launch a full codebase scan or task agent. Keep it fast.

## Phase 3 — Resume Prior Work

Check if `artifacts/sessions/` exists. If it does:

1. List `artifacts/sessions/*_todos.md` sorted by modification time (newest first)
2. Read only the most recent `_todos.md` for pending/in-progress tasks
3. Do NOT read transcripts or other session files

## Report

```markdown
## Recent Activity
<last 5-10 commits, current branch, uncommitted changes>

## Project
<name, tech stack from manifest, key directories from ls>

## Directives
<key rules from AGENTS.md if present>

## Pending Work
<in-progress or pending tasks from last session, or "none">
```
