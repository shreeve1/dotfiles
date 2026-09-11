# Parallel Ralph — tralph × gralph merge plan

Confirmed 2026-09-10. Vocabulary: `CONTEXT.md` § "Parallel Ralph".
Decisions: ADR [0009](../adr/0009-parallel-ralph-landing-queue.md) (landing
queue), ADR [0010](../adr/0010-parallel-ralph-full-tool-workers.md)
(full-tool workers). Ready for `/to-tickets`.

## What it is

`tralph --jobs N`: read `.kanban/issues/*.md`, derive the dependency graph
from `blocked_by` (+ synthetic edges from overlapping `files:` scopes), run
the ready frontier in parallel git worktree lanes (one full-tool Ralph
worker per lane), land finished lanes bors-style onto an integration
branch, ff-only to main at run end. `--jobs 1` (default) preserves today's
sequential behavior. `bin/gralph` is the base codebase; its GitHub GraphQL
graph source stays working alongside the new kanban source.

## Settled decisions

| # | Decision | Evidence anchor |
|---|---|---|
| Q1 | Base = gralph (waves, worktrees, manifest/sidecar/lock recovery) | `bin/gralph:730,166,1356` |
| Q2 | Headless workers, pluggable `--agent-cmd`; tmux only for `--jobs 1` debugging | `bin/gralph:222-228`, ralph-loop `--agent-cmd` |
| Q3 | Bors landing queue: rebase → re-verify → ff-only, repair ticket on red | ADR 0009 |
| Q4 | Advisory `files:` scopes; overlaps serialize; wrong scope costs parallelism never correctness | CONTEXT.md § Scope |
| Q5 | Full-tool workers; lane = sandbox; coordinator keeps bookkeeping | ADR 0010 |
| Q6 | Run end: auto `--ff-only` integration→main; refusal drops marker for `tralph-merge` | `ralph-finalize.sh:73-83` pattern |
| Q7 | Graph source pluggable: `.kanban` frontmatter default, GitHub GraphQL kept | `bin/gralph:612` |
| Q8 | Shepherd v2 reads manifest/sidecars, not tmux panes; delegate-or-raise tree unchanged | shepherd SKILL.md review 2026-09-10 |

## Build order (each step lands green on its own)

1. **Kanban graph source.** New reader beside `refresh_frontier`
   (`bin/gralph:612`): parse `status`/`blocked_by`/`files:` frontmatter
   into the same manifest child shape. Verify: dry-run against a fixture
   board reproduces the expected frontier sequence.
2. **Worker adapter swap.** Replace the sandboxed `pi -p` child
   (`bin/gralph:222-228`) with a pluggable full-tool agent command running
   the Ralph skill inside the lane. Worker commits per Ralph §3;
   coordinator stops committing (`bin/gralph:280` removed) and instead
   asserts lane cleanliness + sentinel. Keep sidecar/sentinel parsing.
   Retire the blind 3-iteration retry (ADR 0010).
3. **Landing queue.** Replace `merge_one_child` batch accumulation
   (`bin/gralph:898-934`) with topo-ordered serial landings:
   rebase lane onto integration tip → re-run ticket `## Verification` →
   `--ff-only` land. Red → bounce lane + auto-create repair ticket,
   continue other lanes (ADR 0009).
4. **Scope-aware scheduling.** Intersecting `files:` scopes on frontier
   tickets synthesize a dependency edge at manifest build. Out-of-scope
   lane diff bounces at landing. Separate small change: `/to-tickets`
   gains an optional best-guess scopes pass.
5. **Run end.** `--ff-only` integration→main; refusal drops the
   `ralph-merge-needed` marker (consumed by `tralph-merge`). Write
   `run-report.md`: landed/bounced/blocked per ticket, revert SHAs.
6. **Identity fixes.** Run state project-scoped under
   `<repo>/.gralph/runs/` (already gralph's layout — kills the
   session-name log collision class found in the shepherd review).
   Per-lane logs append-only. All paths via the `.agents` lane.
7. **Shepherd v2.** Triage keys become manifest/sidecar reads (which lane,
   which iteration, why parked = coordinator PID liveness in
   `.coordinator-lock/owner.json`). Delegate-or-raise decision tree and
   one-retry-max rule carry over verbatim.

## Non-goals

- No AgentTeams lifecycle ownership (couples the run to a live dsh
  session); optionally spawnable inside a lane later.
- No speculative lanes (start dependent from unlanded blocker tip) in v1 —
  revisit once scopes prove reliable.
- No changes to the Ralph worker protocol itself (SKILL.md §1–§6 stand).

## Immediate fixes already landed (2026-09-10)

- tralph-shepherd: log/session collision guard (`Project:` header assert);
  `~/.claude` → `~/.agents` lane paths. Both lanes synced.
- CONTEXT.md: Parallel Ralph glossary.
