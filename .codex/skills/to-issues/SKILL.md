---
name: to-issues
description: Break a plan, spec, or PRD into independently-grabbable local kanban issues using tracer-bullet vertical slices. Use when user wants to convert a plan into issues, create implementation tickets, or break down work into issues.
---

# To Issues

Break a plan into independently-grabbable issues using vertical slices, then publish them to the project-root `.kanban/` board for `$ralph` or a human to consume.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes an issue reference, URL, or path as an argument, fetch or read its full body and comments before drafting slices.

### 2. Explore the codebase

If you have not already explored the codebase, inspect enough files to understand the current state. Issue titles and descriptions should use the project's domain vocabulary and respect ADRs in the area being touched.

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through all required integration layers end-to-end, not a horizontal slice of one layer.

Slices may be `HITL` or `AFK`. HITL slices require human interaction, such as an architectural decision, safety review, or design review. AFK slices can be implemented and merged without human interaction. Prefer AFK where safe.

<HITL-safety-policy>
These task types are always HITL, never AFK:
- Authentication or authorization changes
- Billing or payment logic
- Destructive database migrations
- File deletions
- Security-sensitive code, keys, tokens, or secrets
- Major or minor dependency version upgrades
- Production configuration changes
</HITL-safety-policy>

This list intentionally matches `$ralph`'s HITL safety policy. If one list changes, update the other in the same change. `$ralph` is the final enforcement source and must still block unsafe AFK issues.

<vertical-slice-rules>
- Each slice delivers a narrow but complete path through the behavior under change
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over a few thick slices
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices, if any, must complete first
- **User stories covered**: which user stories this addresses, if the source material has them

Ask the user:

- Does the granularity feel right?
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?

Iterate until the user approves the breakdown.

### 5. Publish local kanban issues

Resolve the project root before reading or writing `.kanban/`:

```bash
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
KANBAN_DIR="$ROOT/.kanban"
ISSUES_DIR="$KANBAN_DIR/issues"
ARCHIVE_DIR="$KANBAN_DIR/archive"
PROGRESS_FILE="$KANBAN_DIR/progress.md"
```

Use these resolved variables for every board path. Do not create `.kanban/` relative to a nested current directory.

Initialize the local board idempotently:

```bash
mkdir -p "$ISSUES_DIR" "$ARCHIVE_DIR"
```

Create `"$PROGRESS_FILE"` if missing:

```bash
if [ ! -f "$PROGRESS_FILE" ]; then
  cat > "$PROGRESS_FILE" <<'EOF'
# Progress Log

Notes from each Ralph loop iteration. Read this at the start of a new session to understand what happened before.
EOF
fi
```

Create issues in dependency order so blocker IDs are known before dependent issue files are written.

### 6. Local issue format

Write each issue at `"$ISSUES_DIR"/{NNN}-{slug}.md`, where `NNN` is a zero-padded sequential ID and `slug` is a short kebab-case title slug.

Assign IDs by scanning both `"$ISSUES_DIR"/*.md` and `"$ARCHIVE_DIR"/*.md` for existing `id:` values, then using the next integer. This assumes a single local operator; if another `$to-issues` run is active, stop instead of racing ID assignment.

Each issue file must use this format:

```markdown
---
id: {integer}
title: {short descriptive title}
status: pending
type: {HITL|AFK}
blocked_by: [{integer ids}]
parent: {integer or null}
priority: 0
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
actor: codex
previous_status: null
claimed_at: null
review_started_at: null
---

## What to build

{Concise description of the end-to-end behavior for this vertical slice.}

## Acceptance criteria

- [ ] {criterion 1}
- [ ] {criterion 2}
- [ ] {criterion 3}

## Blocked by

{List blocker issue IDs, or "None - can start immediately".}

## Notes

{Optional context for the implementer. Omit this section if empty.}
```

### 7. Kanban contract

Use these exact status values:

- `pending`
- `in-progress`
- `review`
- `done`
- `blocked`
- `cancelled`

Do not invent additional statuses.

Use these timestamp conventions:

- `created` and `updated` are `YYYY-MM-DD` dates.
- `claimed_at` is `null` until `$ralph` claims the issue, then an ISO-8601 UTC timestamp such as `2026-05-01T18:30:00Z`.
- `review_started_at` is `null` until `$ralph` moves the issue to `review`, then an ISO-8601 UTC timestamp.
- `previous_status` is the prior status value on transitions; it is `null` only when the issue is created.

`blocked_by` is a dependency list, not a runtime failure status. Runtime blockers use `status: blocked` and must include a `## Blocker` section.

If an issue has `parent: N`, the parent issue is not eligible for `$ralph` until all direct and transitive children that reference it are `done`.

Lower priority numbers run first. Use `priority: 0` unless the source material gives a clear reason to override ordering.

Before handoff, validate the generated board:

- Every issue has the required frontmatter fields and canonical status/type values
- IDs are unique across `"$ISSUES_DIR"` and `"$ARCHIVE_DIR"`
- `blocked_by` IDs reference existing active or archived issues
- No issue blocks itself
- Dependency relationships have no cycles
- `parent` references point to existing active or archived issues
- HITL safety-policy slices are `type: HITL`

### 8. Handoff

After writing local issue files, report:

- Issue files created
- AFK and HITL counts
- Dependency order
- Any HITL safety-policy classifications

Then stop and tell the operator to commit or intentionally manage the `"$KANBAN_DIR"` changes before running `$ralph`. `$ralph` stops on dirty worktrees before implementation, so uncommitted issue files will intentionally block the AFK loop.

Recommended handoff:

```bash
git -C "$ROOT" add "$KANBAN_DIR"
git -C "$ROOT" commit -m "chore(kanban): add implementation issues"
```

Do not commit unrelated dirty files as part of this handoff.

Do not close or modify any parent issue from an external tracker.
