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
  issues/                 # runnable tickets only (the loop scans this directory)
    001-slug.md
    002-slug.md
  archive/                # done / cancelled tickets moved here by /kanban archive
  specs/                  # one spec (PRD) per file: <slug>.md — written by /to-spec
  maps/                   # wayfinder maps: <effort>/map.md + its decision tickets
  progress.md             # Inter-iteration notes — continuity across context windows
  run-report.md           # written by a board-mode run (run-report-<key>.md for a spec run)
```

`issues/` holds **only** tickets in the schema below. Anything else (specs, wayfinder decision tickets, notes) lives in its own directory so the loop and `gralph` never mistake it for work.

## Issue Format

Each issue file uses YAML frontmatter + markdown body:

```markdown
---
id: 1
title: Short descriptive title
status: pending
labels: [ready-for-agent]
blocked_by: []
parent: null
spec: null
priority: 0
files: []
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

## Verification

`one repo-correct command that proves the ticket is done`

## Notes

Any additional context.
```

The frontmatter ends at the closing `---` **or the first blank line**, whichever comes first — keep it contiguous, with no blank lines inside it.

`## Verification` holds exactly **one** command in single backticks (`gralph` takes the ticket's verification from that line and rejects zero or several). Chain steps inside the one command with `&&`. Omit the section only when the ticket genuinely has no runnable check.

### Required fields

Every issue MUST have: `id`, `title`, `status`, `blocked_by`, `created`. Every issue that is not `done` or `cancelled` MUST also have `labels` carrying exactly one triage state label (see below).

### Field reference

| Field | Required | Values | Description |
|-------|----------|--------|-------------|
| `id` | yes | integer | Unique across `issues/` **and** `archive/`. Never reused: a reused id would match another ticket's commits (`(#N)`). Next id = highest id in either directory + 1. |
| `title` | yes | string | Short descriptive name |
| `status` | yes | see below | Current lifecycle state |
| `labels` | yes unless `done`/`cancelled` | string list | Triage roles. Exactly **one** state label: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Other labels (`bug`, `enhancement`, …) are allowed and ignored by the loop. |
| `blocked_by` | yes | integer array | IDs that must be `done` first |
| `parent` | no | integer or null | Parent epic issue. Children block parent completion. |
| `spec` | no | slug or null | The spec this ticket belongs to; matches `.kanban/specs/<slug>.md`. Lets `tralph --spec <slug>` work one spec's tickets. |
| `files` | no | path-prefix list | Advisory write set for the parallel scheduler (e.g. `[src/auth/, tests/auth/]`). Wrong scope costs parallelism, never correctness. Frontmatter only — never in the body. |
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

`status: todo` and `status: open` are read as `pending` (some generators emit them); write `pending`.

### status vs labels (two independent axes)

- **`status`** is the **execution lifecycle**. The loop owns it: `pending → in-progress → review → done / blocked`.
- **`labels`** carry the **triage role** from the `triage` skill. A human (or `/triage`) owns them. They answer "may an agent work this?", not "how far along is it?".

**A ticket is eligible for the loop only when ALL hold:**

1. `status: pending`
2. its `labels` contain exactly one state label and it is `ready-for-agent` (override the string with `RALPH_READY_LABEL`)
3. every `blocked_by` id is resolved (see "Resolving blockers")
4. if it is a parent, all children are `done`

So a `pending` ticket labelled `needs-triage`, `needs-info`, `ready-for-human` or `wontfix` is **never** picked up, and neither is one with no state label or with two (`[ready-for-agent, needs-info]` is a conflict: fix it, don't guess). `in-progress` and `review` tickets are resumed regardless of label — they were already started — and `--review-loop` audits finished tickets regardless of label.

The label strings above are the defaults; `docs/agents/triage-labels.md` (written by `/setup-matt-pocock-skills`) records this repo's mapping for the skills.

`board.sh` (this directory) is the single implementation of these rules. `ralph-loop.sh`, `gralph`, the supervisor and the shepherd all call it — do not re-derive eligibility by grepping `status:`:

```bash
board.sh [--board .kanban] [--spec SLUG] eligible   # <id><TAB><path> of each workable ticket
board.sh next                                       # the first one, exit 1 if none
board.sh counts                                     # eligible, waiting_triage, waiting_human, wontfix, conflict, waiting_deps, active, blocked, done, ...
board.sh validate                                   # ERROR/WARN lines, exit 1 on any ERROR
```

### Resolving blockers

A `blocked_by` id is **resolved** only when that ticket is `status: done`, wherever it lives:

1. look in `issues/`;
2. else look in `archive/` (recursively — archived work is dated subdirectories);
3. a `cancelled` ticket does **not** resolve its dependents (a human decides whether to drop the edge or cancel the dependent);
4. an id found nowhere is **not** resolved (the dependent stays blocked and `validate` reports the dangling reference).

### blocked_by vs blocked (critical distinction)

- **`blocked_by: [1, 3]`** — dependency blockers. Computed from the DAG. Issue can't start until IDs 1 and 3 are `done`.
- **`status: blocked`** — runtime blocker. Something went wrong during implementation. Must have a `## Blocker` section explaining why.

These are independent. An issue can have `blocked_by: []` (no dependencies) and `status: blocked` (hit a runtime problem).

### Parent semantics

- If issue A has `parent: 5`, then issue 5 is blocked by A (and all its siblings).
- Parent issues cannot be `done` until all children are `done`.
- Parent CAN be `pending` while children are `blocked` — the parent just waits.
- `next` includes parents only when all children are `done`.
- A `cancelled` child never counts as done, so it holds its parent open: cancel or re-parent the parent, or move the child out.

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
mkdir -p .kanban/issues .kanban/archive .kanban/specs .kanban/maps
```

Create `.kanban/progress.md` if it doesn't exist:
```markdown
# Progress Log

Notes from each Ralph loop iteration. Read this at the start of a new session to understand what happened before.
```

### `validate`

Run `board.sh --board .kanban validate` and report its output. It checks:
- Frontmatter present; `id`, `title`, `status`, `blocked_by`, `created` present
- Status is a valid enum value
- Non-done, non-cancelled tickets carry exactly one triage state label (none, or two, is an ERROR)
- `blocked_by` IDs exist in `issues/` or `archive/`
- No self-dependencies, no dependency cycles
- IDs are unique across `issues/` and `archive/`
- Parent references exist and are numeric
- `spec:` has a matching `.kanban/specs/<slug>.md` (WARN only)

Do not modify files. Also check each ticket has a `## Verification` section with one backticked command (not checked by `board.sh`).

### `board` (default)

Show the current board state. Scan all `.kanban/issues/*.md` files, parse frontmatter, and display grouped by status. Mark a pending ticket that is not agent-ready with why (`needs-triage`, `needs-info`, `ready-for-human`, `wontfix`, `conflict`, or `waits on #N`); `board.sh counts` gives the totals:

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

Find the next issue to work on: `board.sh next` (add `--spec <slug>` to stay inside one spec). Rules (see "status vs labels"):
1. `status: pending` and labelled `ready-for-agent`
2. All `blocked_by` issues resolved
3. All children `done` (if this is a parent)
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

Interactively create a new issue. Ask for title, description, acceptance criteria, verification command, priority, optional spec, and blocked_by. Auto-assign the next available ID (highest id in `issues/` **and** `archive/`, plus 1). Validate that blocked_by IDs exist. Set `created` to today and `labels: [needs-triage]` — a ticket a human just typed in has not been triaged, so it is **not** runnable until `/triage` (or the user) moves it to `ready-for-agent`.

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

Move `done` issues (and `cancelled` ones, see below) to `.kanban/archive/<YYYY-MM-DD>/`. Archived issues stay queryable: a `blocked_by` reference to an archived **done** ticket is resolved by lookup, so **do not rewrite `blocked_by`** in active issues — the edge stays as history and still resolves.

- Never archive a ticket that an active ticket names as its `parent` while that parent is still open.
- Archive a `cancelled` ticket only if no active ticket lists it in `blocked_by` or as `parent`; otherwise leave it in `issues/` and tell the user which tickets it is holding up. (A cancelled blocker does not release its dependents, and archiving it would hide that.)
- Never reuse an archived ticket's id (see `id` above).

## Integration

- `/setup-matt-pocock-skills` scaffolds this layout and records it in `docs/agents/issue-tracker.md`
- `/to-spec` writes `specs/<slug>.md`; `/to-tickets` writes `issues/NNN-slug.md` in the schema above (with `spec: <slug>`)
- `/triage` moves a ticket between triage states by editing `labels:` — never `status:`
- `/ralph`, `tralph` and `gralph` read eligible tickets through `board.sh` and append to `progress.md`; `tralph --spec <slug>` works one spec
- Issues follow the same vertical-slice format as `/to-tickets`
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
- **Archive preserves dependencies** — an archived `done` ticket still resolves its dependents (by lookup); `cancelled` and unknown ids never do
- **Two axes** — `status` is execution (the loop's), `labels` is triage (a human's); eligibility needs both, computed in one place (`board.sh`)
- **Flat board, `spec:` field** — ids stay repo-unique so commit references `(#N)` identify exactly one ticket; a spec is a filter, not a folder
