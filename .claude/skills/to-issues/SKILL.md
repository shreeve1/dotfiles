---
name: to-issues
description: Break a plan, spec, or PRD into independently-grabbable issues using tracer-bullet vertical slices, sized for end-to-end execution by the Ralph loop. Use when user wants to convert a plan into issues, create implementation tickets, or break down work into issues.
---

# To Issues

Break a plan into independently-grabbable issues using vertical slices (tracer bullets). Every issue must be fully buildable and verifiable by the Ralph loop start-to-finish — no human-in-the-loop gates, no "needs design decision" placeholders.

## Process

### 0a. Detect an active Ralph worktree

If the project is a git repo, check for a live Ralph batch worktree before choosing where to write:

```bash
git worktree list --porcelain | awk '/^worktree /{wt=$2} /^branch refs\/heads\/ralph\//{print wt}'
```

- **Ralph worktree found** (e.g. `~/symphony-ralph` on `ralph/run`): the running batch reads its own `.kanban/` — issues written to the base repo are invisible until the next batch. Target the worktree instead: run all remaining steps (board check, ID assignment, issue files) against the worktree's `.kanban/`, then commit the new files inside the worktree (`git -C <worktree> add .kanban && git -C <worktree> commit -m "chore(kanban): add issues mid-batch"`). The loop re-scans `.kanban/issues/` every iteration, and the supervisor relaunches an exited driver when pending work appears, so committed issues get picked up automatically.
- **No Ralph worktree**: proceed in the current repo as normal.
- Tell the user which board you are targeting either way.

### 0. Check board state and archive if complete

If `.kanban/` exists in the project root (or in the Ralph worktree selected in step 0a), check it before drafting anything new:

1. Read the frontmatter `status` of every file in `.kanban/issues/*.md` and skim `.kanban/progress.md`.
2. Report the board state to the user (done / in-progress / pending counts).
3. **If every issue is `status: done`**, archive the completed board:
   - Create `.kanban/archive/{YYYY-MM-DD}/` (today's date).
   - Move all issue files from `.kanban/issues/` into it, unmodified.
   - Move `.kanban/progress.md` into it as well.
   - Start a fresh `.kanban/progress.md` containing only the header:

     ```markdown
     # Ralph Progress Log

     This file tracks implementation notes across Ralph iterations.
     ```
4. If some issues are NOT done, do not archive. Tell the user what is still open and ask whether to proceed (new issues will be appended to the existing board).
5. If targeting an active Ralph worktree (step 0a), never archive — even a fully-done board belongs to the in-flight batch and is finalized by `ralph-finalize.sh`. Append only.

Issue IDs are never reset by archiving — numbering continues across archives (see step 5).

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a GitHub issue number or URL as an argument, fetch it with `gh issue view <number>` (with comments).

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

<ralph-buildability-rules>
Every slice MUST be buildable by Ralph end-to-end without human input:

- **No open questions** — all design decisions resolved in the slice description. If a decision is unresolved, resolve it in this conversation before writing the issue.
- **Explicit acceptance criteria** — every criterion must be objectively checkable (test passes, command exits 0, file contains string, endpoint returns shape).
- **Automated verification** — each slice names a concrete verification command (e.g., `npm test`, `pnpm typecheck`, `cargo test`, a script path). If the only way to verify is "look at it", convert that to a Playwright/screenshot/curl check.
- **Repo-correct runner** — verification must use the project's canonical test/build invocation, never a bare runner that resolves off `$PATH`. Before writing any `## Verification`, inspect the repo for the real entrypoint: a wrapper script (e.g. `scripts/pytest`, `bin/test`), a `Makefile` target, a `package.json`/`justfile`/`Taskfile` script, or an env wrapper (e.g. `sops-run.sh`, `uv run`, `poetry run`). Emit that exact invocation. A bare `pytest`/`jest`/`go test` that hits a system interpreter missing project deps will false-fail review and block the issue even when the code is correct.
- **Self-contained scope** — shared refactors needed by the slice live INSIDE the slice. Cross-cutting refactors get their own slice earlier in the dependency order.
- **No external blockers** — no "waiting on credentials", "waiting on design", "needs approval". If something requires external input, get it now or drop the slice.
- **Sensitive areas still build** — auth, migrations, deletions, secrets, and dependency bumps are NOT gated; they ship with extra acceptance criteria (rollback path, tests covering the dangerous edge, dry-run command) so Ralph can verify them objectively.
</ralph-buildability-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Blocked by**: which other slices (if any) must complete first
- **Verification**: the command or check that proves it works
- **User stories covered**: which user stories this addresses (if the source material has them)

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Is every slice independently verifiable by an automated check?

Iterate until the user approves the breakdown.

### 5. Create the issues

**Output target — check in this order:**
1. If step 0a found an active Ralph worktree → write issues into the worktree's `.kanban/issues/` and commit them there.
2. If `.kanban/` exists in the project root → write issues as local kanban files (see below). This is the default for Ralph.
3. Else if `gh` is available and the project has a GitHub remote → create GitHub issues with `gh issue create`
4. Otherwise → ask the user which format they prefer

Create issues in dependency order (blockers first) so you can reference real issue numbers in the "Blocked by" field.

#### Local kanban output

When writing to `.kanban/`, create files at `.kanban/issues/{NNN}-{slug}.md`:

```markdown
---
id: {NNN}
title: {title}
status: pending
blocked_by: [{ids}]
parent: {parent issue number or null}
priority: 0
created: {YYYY-MM-DD}
---

## What to build

{description}

## Acceptance criteria

- [ ] {criterion 1}
- [ ] {criterion 2}

## Verification

{exact command(s) Ralph will run to verify, e.g. `npm test && npm run typecheck`}

## Blocked by

{#issue-number or "None — can start immediately"}
```

Auto-assign IDs sequentially: scan `.kanban/issues/` AND `.kanban/archive/**/` for the highest existing ID, start from +1. Archived issues count — IDs are never reused after a board archive.

<issue-template>
## Parent

#<parent-issue-number> (if the source was a GitHub issue, otherwise omit this section)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Verification

Exact command(s) Ralph will run to verify: e.g. `npm test`, `cargo test`, `./scripts/smoke.sh`.

## Blocked by

- Blocked by #<issue-number> (if any)

Or "None - can start immediately" if no blockers.

</issue-template>

Do NOT close or modify any parent issue.

### 6. Mirror to Podium (conditional)

After writing local kanban issues, mirror them into Podium **only when the cwd
repo is a Podium binding**:

1. If `/home/james/symphony/bindings.yml` does not exist, skip this step
   silently (project is not Symphony-managed).
2. Otherwise check whether the cwd repo (its git toplevel) matches a
   `tracker: podium` binding's `repo_path` in that file. If none matches, skip
   silently.
3. If it matches, invoke the `podium-issues` skill to create one Podium Issue
   per newly-created kanban file (ascending id order, chronological dispatch).
   This invocation is auto-chained, so `podium-issues` proceeds without a
   re-confirm — the breakdown was already approved above.

Tell the user whether issues were mirrored to Podium and, if so, the
`k#NNN → podium #<id>` mapping. This step never runs for non-Symphony projects.
