---
description: Resume work from a previously saved session
agent: build
---

Resume work from a previously saved session. $ARGUMENTS

## Phase 1 — Find Session

Compute the project key from the current directory and look in `~/.opencode/sessions/<PROJECT_KEY>`.

If the user provided a label or ID, match it against `meta.json` labels. Otherwise find the most recent session directory.

If no sessions found, report "No saved sessions found for this project" and stop.

## Phase 2 — Load Session Files

Read from the session directory:
- `meta.json` — session_id, label, saved_at, project_path, summary, last_user_message
- `todos.json` — task array with status and content
- `highwatermark.json` — tasks_summary, context_summary, last_user_message

Fall back to `context_summary` from highwatermark if `summary` is missing from meta.

## Phase 3 — Present Summary

```
Resuming Session

  Session ID: <id>
  Label:      <label>
  Saved:      <saved_at>
  Summary:    <summary>
  Last action: <last_user_message>

Task Status
  Completed:   <n>
  In Progress: <n>
  Pending:     <n>
```

List tasks grouped by status: In Progress, Pending, Completed.

## Phase 4 — Interview for Next Steps

If there are in-progress tasks, ask how to proceed (continue them, focus on pending, or something new).
If all completed, ask what to work on next.
If only pending remain, ask how to prioritize.

Then ask: "Is there anything new I should know about? (requirement changes, blockers, new context)"

## Phase 5 — Hydrate Todos

Use todowrite to restore active tasks from `todos.json`. Restore `pending` and `in_progress` tasks as `pending`. Do not restore completed tasks.

## Phase 6 — Confirm and Begin

Summarize the plan and get confirmation before starting work.
