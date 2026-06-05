---
title: RPIV Pipeline Driver And Companion Skills
type: analysis
status: promoted
created: 2026-06-04
updated: 2026-06-04
promoted: 2026-06-04
sources:
  - wiki/raw/sessions/2026-06-04-rpiv-pipeline-skills.md
  - bin/rralph
  - .claude/skills/rpiv-monitor/SKILL.md
  - .claude/skills/gap-sweep/SKILL.md
  - .claude/skills/rpiv-merge/SKILL.md
confidence: high
tags:
  - rpiv
  - pipeline
  - skills
  - automation
  - pi
  - git
---

# RPIV Pipeline Driver And Companion Skills

## Summary

`rralph` (`bin/rralph`, symlinked to `~/.local/bin`) is a bash driver that
runs the RPIV skill chain unattended. Each step executes in a fresh interactive
engine TUI (pi by default, Claude opt-in) on the default tmux server, driven by
send-keys plus a nonce done-marker. Steps hand off through on-disk artifacts in
`.rpiv/artifacts/<type>/`, never shared context. Three companion skills support
the lifecycle: `rpiv-monitor` (diagnose a running run, read-only),
`gap-sweep` (autonomous between-step gap fixes), and `rpiv-merge` (land the
finished branch).

## Pipeline Shape

- Order: discover (by hand) → research → design → plan → implement → validate →
  code-review → commit. The driver starts after discover and picks up the newest
  FRD from `.rpiv/artifacts/discover/`.
- Engine: default `pi`; `--engine claude` / `RPIV_ENGINE` selects Claude.
- Branch: each run is a fresh `${RPIV_BRANCH_PREFIX:-rpiv}/<TS>` branch created
  with `git checkout -b` — a branch in the repo's own working directory, not a
  git worktree. (Users may call it a "worktree"; it is a branch.)
- Logs: `.rpiv/run/<TS>/` (git-ignored, per-repo, local), written live (~5s) for
  observability.

## Operating Philosophy

No quality gates between steps; auto-accept all mid-run prompts; commit always;
never push; fresh branch always. Alignment happens at discover; testing
post-pipeline is the real checkpoint. `gap-sweep` is consistent with this: it
fixes-and-continues rather than gating.

## Companion Skills

- **rpiv-monitor** — read-only diagnosis of a running pipeline. Hard rule: never
  attach or send-keys to the live pane (corrupts paste/marker detection); inspect
  only with `capture-pane`. Find the live socket from the driver's session list,
  not `ls -t` (a stale socket file sorts first by mtime).
- **gap-sweep** — runs after FRD/research/design/plan and after implement. A
  fresh AI session sweeps the just-produced artifact for critical gaps, fixes
  them in place, and continues. Autonomous, no gate, never asks. Not a human
  review.
- **rpiv-merge** — interactive landing step. Enumerates `rpiv/<TS>` branches,
  picks one, reviews the diff, tests, then merges. Confirms before merge, never
  pushes unless asked, guards against a dirty tree before checkout, marks
  already-merged branches, and derives the merge base from
  `.rpiv/run/<TS>/.base` (falling back to `origin/HEAD`, then
  `init.defaultBranch`).

## Cross-Engine Handoff

Because handoff is file-based, a discover session run in interactive Claude can
feed a pi-driven `rralph` pipeline: the producing engine is irrelevant as long
as it is the same repo/cwd and pi is onboarded (logged in, directory trusted)
there.

## Base-Ref Persistence

The driver writes the kickoff fork point to `.rpiv/run/<TS>/.base` so the merge
step targets the exact base instead of guessing `main`. This only helps runs
created after the change; older `rpiv/<TS>` branches rely on `rpiv-merge`
deriving the base and asking the user to confirm.

## Caveats

- `gap-sweep` was committed but not yet exercised by a live pipeline run as of
  this capture (the observed run used the pre-gap-sweep driver).
