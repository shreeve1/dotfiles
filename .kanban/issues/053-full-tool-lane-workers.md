---
id: 053
title: Full-tool lane workers via pluggable --agent-cmd (ADR 0010)
status: done
blocked_by: [052]
parent: null
created: 2026-09-10
updated: 2026-09-12
actor: ralph

## What to build

In board mode, each lane runs a **full-tool Ralph worker** instead of
gralph's sandboxed code-writer. The agent command is pluggable
(`--agent-cmd`, like ralph-loop.sh's flag) with a headless default; the
worker follows the Ralph protocol inside its lane worktree: implements,
runs the ticket's `## Verification` itself, commits, spawns its own
fresh-session reviewer, emits the `RALPH_RESULT` sentinel.

Coordinator changes: stop committing on the worker's behalf; instead assert
the lane is clean after the worker and parse the sentinel from the worker
log into the sidecar. Retire the blind 3-iteration retry (a failed worker
becomes a bounce/blocked outcome on the board, per ADR 0010). Workers never
write `.kanban` or the manifest — the coordinator owns board writes. This
explicitly overrides the Ralph protocol's board-writing steps in board
mode: the worker SKIPS the status frontmatter flips (in-progress/review/
done) and does NOT touch `.kanban/progress.md`; the coordinator flips
status from the sentinel. The worker's progress note goes to a lane-local
file (e.g. `.ralph-progress.md` in the lane worktree, committed with the
work); landing (#054) folds it into the shared `.kanban/progress.md`.

## Acceptance criteria

- [x] One real board ticket is implemented end-to-end in its lane worktree
      by the worker (worker's own commit present on the lane branch)
- [x] Coordinator records the sentinel + lane state in the sidecar without
      creating the commit itself
- [x] A worker FAIL/BLOCKED sentinel marks the ticket blocked on the board
      and does not retry blindly
- [x] `--agent-cmd` overrides the default worker command
- [x] Worker leaves ticket frontmatter and `.kanban/progress.md` untouched;
      its progress note is lane-local and committed on the lane branch
- [x] Two independent ready tickets run in the SAME wave in two live lanes
      concurrently (`--jobs 2`), both land their own commits

## Verification

`bash tests/tralph-lane-worker.test.sh` and `bash tests/gralph-parallel.test.sh`

## Implementation Notes

Three bugs fixed in the pre-existing board-mode implementation:

1. `fold_child_result` `failed)` case: `sentinel` variable was unbound under
   `set -u`, aborting the `write_manifest` call. Fixed by reading `.sentinel`
   from the sidecar and adding `sentinel:$sentinel` to the child manifest record.
2. `refresh_frontier_kanban` did not propagate landed children to their
   dependents. The coordinator called `update_board_ticket_status` to flip the
   disk file to `done`, but this violated "worker leaves ticket untouched". Fixed
   by removing the disk flip and instead overlaying manifest-landed children as
   CLOSED in the refresher, then re-classifying dependents against the updated set.
3. The `--arg sentinel "$sentinel"` dead-code in both failed fold paths is now
   live and correct; `update_board_ticket_status` call site removed (function
   itself left for follow-up cleanup per review note).
