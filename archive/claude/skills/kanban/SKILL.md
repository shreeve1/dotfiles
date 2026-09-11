---
disable-model-invocation: true
name: kanban
description: Manage a local markdown-based kanban board. Use when user wants to view issues, check board status, create issues manually, move issues between statuses, or initialize a new kanban board.
---

# Local Kanban

A project-local kanban board stored in `.kanban/` at the project root. Issues are markdown files with YAML frontmatter. Progress notes persist across context windows.

## Directory Structure

```
.kanban/
  issues/
    001-slug.md
    002-slug.md
  archive/              # Completed issues moved here by /kanban archive
  progress.md           # Inter-iteration notes — continuity across context windows
```

## Issue Format

Each issue file uses YAML frontmatter + markdown body:

```markdown
---
id: 1
title: Short descriptive title
status: pending
blocked_by: []
parent: null
priority: 0
created: 2026-04-26
updated: 2026-04-26
actor: human
previous_status: null
---

## What to build

Concise description of this vertical slice.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Notes

Any additional context.
```

### Required fields

Every issue MUST have: `id`, `title`, `status`, `blocked_by`, `created`

### Field reference

| Field | Required | Values | Description |
|-------|----------|--------|-------------|
| `id` | yes | integer | Unique, sequential, no gaps within active board |
| `title` | yes | string | Short descriptive name |
| `status` | yes | see below | Current lifecycle state |
| `blocked_by` | yes | integer array | IDs that must be `done` first |
| `parent` | no | integer or null | Parent epic issue. Children block parent completion. |
| `priority` | no | integer (lower = higher priority) | Breaks ties among ready issues. Default 0. |
| `created` | yes | YYYY-MM-DD | Creation date |
| `updated` | auto | YYYY-MM-DD | Last status change date |
| `actor` | auto | `human`, `ralph`, `script` | Who last changed the status |
| `previous_status` | auto | status or null | Previous status for rollback |

### Status values and transitions

```
pending ──→ in-progress ──→ review ──→ done
  │              │              │
  │              └──→ blocked ←─┘
  │                     │
  └──────→ cancelled    └──→ pending (reopened)
```

| Status | Meaning | Who sets it |
|--------|---------|-------------|
| `pending` | Ready to pick up (if dependencies met) | human, script |
| `in-progress` | Currently being worked on | ralph, human |
| `review` | Implementation done, awaiting review | ralph, human |
| `done` | All acceptance criteria verified | reviewer, human |
| `blocked` | Stuck. Blocker section explains why | ralph, human |
| `cancelled` | No longer needed, not to be implemented | human only |

### blocked_by vs blocked (critical distinction)

- **`blocked_by: [1, 3]`** — dependency blockers. Computed from the DAG. Issue can't start until IDs 1 and 3 are `done`.
- **`status: blocked`** — runtime blocker. Something went wrong during implementation. Must have a `## Blocker` section explaining why.

These are independent. An issue can have `blocked_by: []` (no dependencies) and `status: blocked` (hit a runtime problem).

### Parent semantics

- If issue A has `parent: 5`, then issue 5 is blocked by A (and all its siblings).
- Parent issues cannot be `done` until all children are `done`.
- Parent CAN be `pending` while children are `blocked` — the parent just waits.
- `next` includes parents only when all children are `done`.

### Priority and ordering

`next` picks the highest-priority (lowest number) issue among those that are ready. Ties broken by ID (lowest first = dependency order). If no priority is set, all issues are priority 0.

### Definition of done

An issue is `done` when:
1. All acceptance criteria checkboxes are checked
2. Tests/lint/typecheck pass (if applicable)
3. Changes are committed to git (if the project uses git)
4. The implementer has verified the behavior matches the slice description

## Commands

The user's message determines which command to run:

### `init`

Create `.kanban/` in the current project root. Idempotent.

```bash
mkdir -p .kanban/issues .kanban/archive
```

Create `.kanban/progress.md` if it doesn't exist:
```markdown
# Progress Log

Notes from each Ralph loop iteration. Read this at the start of a new session to understand what happened before.
```

### `validate`

Check all issue files for schema compliance:
- Required fields present
- Status is a valid enum value
- `blocked_by` IDs reference existing issues
- No self-dependencies (`blocked_by` contains own ID)
- No dependency cycles (DAG is valid)
- IDs are unique
- Parent references exist (if set)

Report errors as a list. Do not modify files.

### `board` (default)

Show the current board state. Scan all `.kanban/issues/*.md` files, parse frontmatter, and display grouped by status:

```
## Pending (3)
  #1  Auth schema change            p:0
  #2  Auth API endpoint             p:0  blocked by #1
  #3  Dashboard design               p:1

## In Progress (1)
  #1  Auth schema change            p:0  (15 min)

## Review (1)
  #7  Add logging                   p:0

## Blocked (1)
  #6  Refresh token endpoint        p:0  blocked by #2
    Blocker: Waiting on auth API

## Done (2)
  #4  Project setup
  #5  Design pass

## Cancelled (1)
  #8  Old approach

## Stats
  Total: 8 | Pending: 3 | In Progress: 1 | Review: 1 | Blocked: 1 | Done: 2 | Cancelled: 1
  DAG depth: 3 (longest dependency chain)
```

### `stale`

Detect stale locks. Find issues with `status: in-progress` where the `updated` date is older than 30 minutes. Offer to reset them to `pending` so they can be picked up again.

### `show <id>`

Display the full issue file for the given ID. Find it by matching the `id:` field in frontmatter.

### `next`

Find the next issue to work on. Rules:
1. Must be `status: pending`
2. All `blocked_by` issues must have `status: done`
3. All children must be `done` (if this is a parent)
4. Sort by priority (lowest number first), then by ID (lowest first)

Display the issue and suggest running `/ralph` to implement it.

### `move <id> <status>`

Update the `status` field in the issue's frontmatter. Also update:
- `updated: <today's date>`
- `previous_status: <old status>`
- `actor: <who triggered this change>`

Valid targets: `pending`, `in-progress`, `review`, `done`, `blocked`, `cancelled`.

Refuse invalid transitions (e.g., `done` → `in-progress`). Only `blocked` → `pending` and `review` → `in-progress` are allowed as rollbacks.

### `create`

Interactively create a new issue. Ask for title, description, acceptance criteria, verification command, priority, and blocked_by. Auto-assign the next available ID. Validate that blocked_by IDs exist.

### `progress`

Show the `.kanban/progress.md` file — the inter-iteration log from Ralph loop runs. Limited to last 50 entries. Older entries are rotated to `.kanban/archive/progress-archive.md` automatically.

### `dag`

Display the dependency graph as a tree. Also validate for cycles and invalid references:

```
#4  Project setup [done]
  └── #1  Auth schema change [in-progress]
        └── #2  Auth API endpoint [pending]
              ├── #3  Dashboard [pending]
              └── #6  Refresh tokens [pending]

Errors: none
```

If cycles or invalid references are found, report them and refuse to proceed with `next` until fixed.

### `archive`

Move all `done` and `cancelled` issues to `.kanban/archive/`. Archived issues remain queryable for dependency resolution — `blocked_by` references to archived issues are treated as satisfied. Rewrite any `blocked_by` references in active issues to remove archived IDs (they're satisfied, so they don't need to be listed).

## Integration

- `/to-issues` writes here when `.kanban/` exists
- `/ralph` reads from here to find the next unblocked issue and appends to `progress.md`
- Issues follow the same vertical-slice format as `/to-issues`
- Progress notes provide continuity across context windows

## Design Decisions

- **Per-issue files** over single backlog.md — easier to parse, edit, and track in git
- **YAML frontmatter** — machine-readable by both skills and bash scripts (parsed with grep/sed in bash, not jq)
- **progress.md** — inter-iteration continuity, rotated to prevent unbounded growth
- **`blocked` status** — runtime blockers only. Dependency blockers computed from `blocked_by[]`.
- **DAG depth stat** — helps estimate how many context windows the project needs
- **Audit trail** — `updated`, `actor`, `previous_status` fields track who changed what and when
- **Priority field** — explicit ordering prevents nondeterministic issue selection
- **`validate` command** — catches schema issues before they break the loop
- **`stale` command** — recovers from crashed sessions that left issues in `in-progress`
- **Archive preserves dependencies** — archived issues are treated as `done` for resolution
