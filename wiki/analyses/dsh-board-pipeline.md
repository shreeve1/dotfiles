---
title: dsh-board Pipeline — Stage Mechanics, the Captain-Death Loop, and Full Autonomy
type: analysis
status: archived
created: 2026-09-04
updated: 2026-09-23
promoted: 2026-09-04
sources:
  - wiki/raw/sessions/2026-09-04-dsh-board-loop-fixes.md
  - archive/dsh-board/HANDLERS.md
  - archive/dsh-board/preamble.md
  - archive/dsh-board/render-jobs.sh
  - archive/dsh-board/INSTALL.md
confidence: high
tags:
  - dsh-board
  - build-board
  - agent-teams
  - cron
  - merge
  - pipeline
---

# dsh-board Pipeline — Stage Mechanics, the Captain-Death Loop, and Full Autonomy

> ARCHIVED 2026-09-23: dsh-board and dsh-spec are no longer used. Code moved to `archive/dsh-board/`; cron jobs removed from the dsh profile. Kept for history only.

The dsh-board is an unattended build pipeline: six per-stage cron ticks walk a
spec card Spec → Decompose → Build → Verify → Review → Merge → Archive. This
page captures the non-obvious mechanics that took a full session to establish.

## The handlers are agent-prose, not code

The stage "handlers" and their "allowlisted actions" (`git-status-clean`,
`spec-committed`, `git-merge-ff`, …) are **not** an executor. Each tick is a
`kind: agent` cron job whose rendered prompt points at
[HANDLERS.md](/dsh-board/HANDLERS.md); the tick agent reads the prose and runs
the git commands itself. Grepping the codebase for an action name finds only
`.md` hits. Consequence: a stage-behavior fix is a **prose edit**, never code.

## Two doc-loading mechanisms with different deploy semantics

- `HANDLERS.md` is read **live** via the `~/.dsh-boards/dotfiles/HANDLERS.md`
  symlink — edits apply on the next tick, no restart.
- `preamble.md` is rendered into **frozen copies** baked into the six cron
  prompts by `render-jobs.sh --install`, and only takes effect after a **dsh
  restart** (profile config loads at boot).

So a `preamble.md`/allowlist change is silently un-deployed until you regenerate
the prompts AND restart, while a `HANDLERS.md` change is already live. This
split is the single easiest way to ship a half-deployed board.

## The captain-death loop (root cause of Build↔Decompose churn)

An agent_teams team is **permanently bound to its creating captain session**
(`findTeamByCaptain` matches `team.captainSessionId`, set once). There is no
adopt/re-attach API. The shared scheduler advances a member to its next ready
task on an "idle edge" **only while that captain's process is alive**
(`deliverToMember(ctx, captain, …)`).

A Build tick is a short-lived captain: it dispatches a team and exits. If
Decompose emitted a **dependency chain** (t1→t2→t3→t4) on one engineer, the
engineer finishes t1, the captain dies, the scheduler tears down, and t2 (now
ready) is never claimed. The reconciling tick sees "not all complete" +
un-resumable team → STALL → BOUNCE → the bounce wipes the lane → the next lap
redoes t1 and dies identically. **Infinite loop.**

### Fix: one composite task, not a chain

Build now creates a **single** composite task listing all breakdown steps in
order for one engineer to drive in one continuous turn — no cross-task
scheduling, so nothing can strand. A genuine stall now means the spec is too big
for one Build turn, and the correct response is Decompose splitting it into
smaller **cards**, never dependent tasks on one card. (Decompose's breakdown
comment is an ordered step list Build folds into the one task.)

The same captain-death risk technically applies to the Review stage (also a team
stage), but a review is a single reviewer / single task with no chain, so it
completes in one turn and only the terminal-status reconcile is cross-tick.

## Decompose gate: spec-committed, not whole-tree-clean

The Decompose gate was a blanket `git-status-clean` on the whole checkout, which
froze the pipeline on any unrelated dirty file. It is now a scoped
`spec-committed` check: `git status --porcelain -- <specPath>`. A worktree
branches off HEAD, so unrelated dirtiness can neither enter nor corrupt the lane;
only the card's own spec must be in HEAD. The board never touches the human's
uncommitted work.

## Merge: fully autonomous fast-forward

Merge no longer waits for a human. It runs `git merge --ff-only auto/<card-id>`
itself, strictly fast-forward only. The safety comes from git's own refusals,
verified across every case:

- Diverged branch (main advanced) → exit 128, main unchanged → BOUNCE to Build.
- A dirty tracked file the ff would overwrite → exit 1, local edit preserved,
  main unchanged → treated as a bounce.
- Already merged → exit 0 "Already up to date" (idempotent, safe rerun).
- Unrelated dirty file → ff succeeds, file preserved.

So the board can never create a merge commit, force, or clobber uncommitted work
on `main`. A post-merge `check.sh` failure (a regression the isolated lane hid)
Blocks for a human. `git-merge-ff` is the **single write action** in the
allowlist.

## Operational gotchas

- **Cron staggering vs rate limits.** All six ticks originally shared
  `*/15 * * * *`, firing together and bursting the provider into a MiniMax 429
  "Token Plan rate limit" even with quota left. `render-jobs.sh` staggers each
  stage 2 min apart (spec :00 … merge :10), which clears the 429.
- **cron_disable is a persisted override.** It writes `enabledSource: override`
  that **survives a restart** and does not change the config's `enabled` flag; a
  disabled tick stays disabled across restart and must be re-enabled with
  `cron_enable`.
- **smart_restart latency.** On this host it can take minutes and its notice
  arrives late; the canary path stalled twice (canary passed, unit never
  swapped, `NRestarts` stayed 0, orphaned canary left) before a no-canary retry
  landed. A lingering canary binds only its own ephemeral port, never production
  3080, so it is safe to kill.

## Open Questions

- The composite-task Build fix and auto-ff-merge Merge fix are deployed but not
  yet exercised end-to-end by an autonomous run on a fresh card (card k881 was
  hand-driven). Watch the next real card.
- Why `smart_restart`'s canary path stalls before a no-canary retry lands is
  unexplained.

# Citations

- `wiki/raw/sessions/2026-09-04-dsh-board-loop-fixes.md` — session capture with
  evidence paths and test runs.
- `dsh-board/HANDLERS.md` — stage contracts (Decompose gate, Build composite
  task, Merge auto-ff-merge). Commits a0a4399d, ab963f22, 136ad06d.
- `dsh-board/preamble.md` — allowlist including `spec-committed` and
  `git-merge-ff`.
- `dsh-board/render-jobs.sh` — cron prompt renderer, stagger offsets, provider
  pin.
- `dsh-board/INSTALL.md` — frozen-copy/regenerate rule.
