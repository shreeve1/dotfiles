---
title: tralph Labels, .kanban Board And Spec Trail
type: analysis
status: promoted
created: 2026-10-14
updated: 2026-10-20
promoted: 2026-10-14
sources:
  - wiki/raw/sessions/2026-10-14-tralph-labels-spec-trail.md
  - .agents/skills/kanban/board.sh
  - bin/gralph
  - .agents/skills/ralph/ralph-loop.sh
  - .zshrc
  - .gitignore
  - wiki/raw/sessions/2026-10-20-grill-drift-checks.md
  - docs/adr/0024-driver-side-drift-check.md
confidence: high
tags: [tralph, gralph, ralph, kanban, triage-labels, spec, board]
description: How the tralph loop decides what to run (one eligibility rule in board.sh, two drivers behind it), what the board mode does and does not enforce about specs, and the gotchas that cost time this session.
---

# tralph Labels, .kanban Board And Spec Trail

`tralph` runs tickets from `.kanban/` using Matt Pocock's triage labels. This page records the contracts and gotchas that are not obvious from reading one file. The schema itself lives in the `kanban` skill (`.agents/skills/kanban/SKILL.md`) and the rules in the header of `.agents/skills/kanban/board.sh`; they are not repeated here.

## Two axes, one rule

`status:` is the loop's lifecycle and `labels:` is the triage role. A ticket is runnable when it is `pending`, carries exactly one state label equal to `ready-for-agent`, every blocker is `done` (archive searched; cancelled or unknown fails closed), and, for a parent, all children are done. `board.sh` owns that rule and `ralph-loop.sh`, the supervisor, the shepherd and `gralph` all call it. There is no "no labels means ready" fallback.

## Two drivers behind one command

`tralph --jobs 1` (the default) runs `ralph-loop.sh`; `--jobs 2` or more runs `bin/gralph --board`. They share `board.sh` and little else. `ralph-loop.sh` writes no manifest and no run report, so anything added to one driver (a spec check, a completion reminder) must be added to the other or it silently does not exist on the default path. `gralph` also cannot call `board.sh eligible` directly, because its manifest needs a per-ticket reason, so it restates the blocker, archive and parent rules in jq. `tests/board-gralph-parity.test.sh` holds the two together; there is no shared code.

## What board mode does not enforce

In `gralph` the coordinator records a lane's `DONE` with hardcoded `reviewGate:"accepted"`, `reviewStatus:"approved"` and zero findings. It never spawns or reads a reviewer; acceptance is the worker's `RALPH_RESULT` sentinel plus a new commit. So telling a worker to read its spec and to have its reviewer check the diff against it reduces drift but does not prevent it.

**Update 2026-10-20 (ADR 0024, C-0172 supersedes C-0157):** the coordinator-side check was decided and built, narrowly. Both drivers now run `.agents/skills/ralph/ralph-drift-check.sh` after a DONE on a ticket with a `spec:`: one strong-model reviewer checks the diff against the spec and its grill ledger (`ledger:` frontmatter), and only `DRIFT_CHECK: DRIFT` blocks. In board mode a drifted lane is recorded failed (sentinel `blocked`, reason `drift`), its findings go to `.gralph/runs/<key>/.child-<N>-<run>-drift.txt`, and its branch is removed so `--replan` can retry it. Non-drift lanes are still recorded with the hardcoded `reviewGate:"accepted"`; general review stays in the worker. See [the session capture](/raw/sessions/2026-10-20-grill-drift-checks.md).

**Update 2026-10-20, after a gap review (C-0173 supersedes C-0172):** a drift-blocked board lane now keeps its branch, its ticket is parked `blocked`, and a `ready-for-human` repair ticket (`Drift check blocked ticket #N`) carries the findings; the lanes that passed still land and gralph exits 3. The `--replan` retry was dropped because it stuck when another lane had landed. The reviewer is read-only by tool allowlist and never reverts worktree files; `DRIFT_CHECK: ERROR` blocks; sequential mode checks the whole ticket from its first `(#ID)` commit, including `--review-loop`. See [the gap-fix capture](/raw/sessions/2026-10-20-grill-drift-checks-gap-fixes.md).

## Spec trail contracts

- A ticket's `spec: <slug>` points at `.kanban/specs/<slug>.md`. A slug is `[A-Za-z0-9][A-Za-z0-9_-]*` and not all digits: it is also the gralph run key, where a bare number is a numeric key and `0` is the whole board.
- A ticket naming a spec that is missing on disk, or whose slug breaks the rule, is refused rather than run without it (fail closed): `gralph` records `spec_missing` or `spec_invalid`; `ralph-loop.sh` sets the ticket `blocked` with a `## Blocker`. `board.sh spec-check <id>` answers `none`, `ok`, `missing` or `invalid`, and prints nothing and exits 2 for an id that is not a live ticket.
- `board.sh spec-done --spec S` is the single completeness rule behind every `/finish-spec` reminder (live and archived tickets, all `done`).

## Gotchas

- **New tests are silently skipped by `git add -A`.** `.gitignore` ignores `/tests/*` (except `*.py`) although 26 test files are tracked, so a new test needs `git add -f`. The `.gitignore` comment calls the directory "machine-local only", which is wrong for the tracked files.
- **A failed lane stays failed.** `recover_state` counts it as `failed_left`, so after fixing the cause a plain rerun does not retry it; only `--replan` does. An ordinary worker FAIL behaves the same way.
- **A test worker that always fails under `--continue-on-error` runs to `MAX_ITERATIONS` (1000).** One scenario took about 4.5 minutes until its worker failed once instead.

# Citations

- `wiki/raw/sessions/2026-10-14-tralph-labels-spec-trail.md` — curated capture with evidence per fact.
- `.agents/skills/kanban/board.sh`, `bin/gralph`, `.agents/skills/ralph/ralph-loop.sh`, `.zshrc`, `.gitignore` — the behaviours above, each read this session and checked by an independent verify (8 of 9 claims VERIFIED; the one FALSE was the `spec-check` unknown-id detail, corrected above).
