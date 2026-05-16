# {{SYSTEM_NAME}}

Autonomous experiment loop. You (the loop driver) hill-climb on a numeric
`passed` score by mutating the system, running probes, and keeping or
discarding the change.

Your job is not to solve any individual probe. Your job is to improve the
**system under test** so it performs better across the whole probe suite.

## Directive

{{ONE_PARAGRAPH_DIRECTIVE}}

System under test: see `adapter.yaml`.
Probes (experiments) live under the path declared in `adapter.yaml` `probe.dir`.
Scoring: see `verifier.pass_threshold` in `adapter.yaml`.

{{OPTIONAL_MODEL_OR_RUNTIME_CONSTRAINT}}

## Setup

Before starting a new experiment:

1. Read `README.md`, this file, `adapter.yaml`, and a representative sample of
   probes.
2. Read the SUT files listed under `sut.paths` in `adapter.yaml`.
3. Verify required CLIs are on `PATH` (`yq` v4+, `git`, plus any adapter-specific
   tools — for Temporal: `temporal` and `jq`).
4. Verify all commands in `adapter.yaml` (`apply_cmd`, `runner.cmd`,
   `snapshot.capture_cmd`, `snapshot.restore_cmd`) run cleanly on a no-op input.
5. Initialize `results.tsv` if missing.

The first run must always be the unmodified baseline. Establish the baseline
before trying any ideas.

## What You Can Modify

Anything matched by `mutator.edit_surface` in `adapter.yaml`, EXCEPT anything
matched by `mutator.fixed`. **`adapter.yaml` itself is always off-limits** and
must appear in `mutator.fixed`.

## What You Must Not Modify

`mutator.fixed` paths are off-limits. The adapter contract itself
(`adapter.yaml`) is off-limits unless the human explicitly asks.

## Goal

Maximize `passed` (probes scoring ≥ `verifier.pass_threshold`).

- more passed wins
- if passed is equal, simpler wins

## Simplicity Criterion

All else being equal, simpler is better. If a change achieves the same `passed`
result with a simpler SUT, you must keep it.

## How to Run

Probes are invoked via `runner.cmd` in `adapter.yaml`. The full loop is driven
by the autoagent skill's `RunLoop` workflow.

The loop driver substitutes `{probe}` in `runner.cmd` with each probe directory
and sets `AUTOAGENT_SCORE_FILE` + `AUTOAGENT_PROBE_DIR` in the environment.
`verify.sh` writes the score to `$AUTOAGENT_SCORE_FILE`.

## Logging Results

Every probe run appends to `results.tsv` (tab-separated):

```text
timestamp	commit	mutation_id	score_avg	passed	probe_scores	cost	status	description
```

`status ∈ {baseline, keep, discard, crash, rollback}`. `probe_scores` is a
compact-JSON object (one cell, no whitespace). The same commit may appear
multiple times (variance reruns are allowed). See `RunLoop.md` for the
canonical `mutation_id` formula.

## Experiment Loop

1. Acquire `.autoagent/loop.lock` to prevent concurrent drivers.
2. Check current branch + commit. Ensure clean working tree.
3. Read latest `run.log` and recent probe-level scores in `results.tsv`.
4. Diagnose failures: group by root cause across probes.
5. Choose ONE general SUT improvement (not probe-specific).
6. If SUT is live (`sut.live: true`), capture a snapshot first. ABORT if capture
   produces an empty file.
7. Apply the mutation: edit files in `mutator.edit_surface` (NEVER `mutator.fixed`).
   Run `mutator.apply_cmd` if set.
8. Commit the mutation (mutation ONLY; ledger row is NOT committed here).
9. Run all probes via `runner.cmd` (with substitutions/env wired by the driver).
10. Decide keep / discard:
    - If `passed` improved → keep: append `results.tsv` row, then commit the
      ledger row separately.
    - If `passed` unchanged AND SUT is simpler → keep (same as above).
    - Otherwise → discard, in this order:
      1. For live SUTs: restore snapshot via `snapshot.restore_cmd`, validate
         with one previously-passing probe. Abort to human if validation fails.
      2. Run `mutator.rollback_cmd` (defaults to `git reset --hard HEAD~1`
         because the ledger has NOT been committed yet — see `RunLoop.md` 8b).
      3. Append discard row to `results.tsv` and commit it.

## Keep / Discard Rules

- `passed` improved → keep.
- `passed` unchanged + simpler → keep.
- Otherwise → discard.

Discarded runs still teach. Read the per-probe diff:

- which probes became newly passing
- which regressed
- which failures revealed missing capabilities
- which verifier mismatches exposed weak assumptions

## Failure Analysis

Group failures into one of (universal taxonomy — see
`References/FailureModes.md`):

- misunderstanding inputs
- missing capability
- weak information gathering
- bad execution strategy
- missing verification
- environment / dependency
- silent failure (claims success, side effects wrong)

Prefer changes that fix a class of failures.

## Overfitting Rule

> "If this exact probe disappeared, would this change still be worthwhile?"

If no, it's overfitting. Do not encode probe-specific knowledge into the SUT.

## Live-System Safety

If `sut.live: true`:

- Capture a snapshot BEFORE every mutation. Empty/failed capture → ABORT.
- On discard, restore the snapshot (not just `git reset` — the live system
  may have already accepted the mutation).
- Validate restoration by re-running one previously-passing probe before
  continuing.
- Never run the loop against production without `AUTOAGENT_PROD=1` set in the
  calling shell.
- **Note on workflow state:** schedule-style live state (Temporal schedules,
  cron tables) is fully snapshot-restorable. In-flight workflow executions are
  NOT — they cannot be rewound. Drain the namespace before iterating on
  workflow code, or restrict `edit_surface` to `schedules/**`.

## NEVER STOP

Once the loop begins, do NOT stop to ask whether to continue.

Iterate until ONE of:
- the human interrupts,
- the cost budget is exhausted,
- `passed` has not improved for `loop.plateau_iterations` iterations.

**For live SUTs (`sut.live: true`) only**, NEVER STOP yields to one rule: every
`loop.human_checkpoint_every` iterations, the loop prompts the human and
waits for confirmation. NEVER STOP applies BETWEEN checkpoints, not ACROSS
them. For non-live SUTs, NEVER STOP is absolute and there are no checkpoint
prompts.
