# Workflow: work

Execute the autonomous loop against an active goal.

## 1. Load state

```bash
ls .opencode/state/goals/
```

Determine which goal to work on:
- If exactly one goal with `status: active` → use it.
- If multiple active → ask the user which.
- If none active → tell the user and offer to **set** a new goal or **resume** a paused one.

Read `GOAL.md` and `PROGRESS.md` for the chosen goal. Ground every decision in those files.

## 2. Pick the next checkpoint

From `GOAL.md` checkpoint strategy and `PROGRESS.md` history:

- Find the lowest-numbered checkpoint not yet marked complete in PROGRESS.
- Count the total number of distinct checkpoints (C0 baseline + C1...Cn). If this count is at or above `Max checkpoints` in GOAL.md and the stopping condition is not met → **stop, set `Status: blocked`, surface to user** that the cap was reached and ask whether to raise the cap, redefine the strategy, or abandon.
- If checkpoint strategy is exhausted but the stopping condition is not met AND the cap is not reached, the agent may **propose** a new checkpoint inline. Adding a new checkpoint to GOAL.md is a goal revision and triggers the **mid-run re-audit** (see §4 below). Do not silently extend.
- If no checkpoints exist yet (besides C0 baseline), define checkpoint C1.

## 3. Read required inputs

Read every file listed under "Inputs to read first" in `GOAL.md` that you have not already read this session. Read them fully.

## 4. Make scoped changes

Implement the checkpoint. Constraints:
- Stay inside scope. Do not touch anything listed under "Out of scope".
- Make the smallest change that satisfies the checkpoint.
- **Any edit to `GOAL.md`** (splitting a checkpoint, adding a checkpoint, revising stopping condition, revising objective, changing out-of-scope) is a goal revision and triggers the **mid-run re-audit**: stop, surface the proposed change to the user with a `question` tool prompt, re-run the relevant parts of [set.md](set.md) §3 against the affected sections, and only edit GOAL.md after explicit user approval. Note the revision in `PROGRESS.md` with `Revision: <summary>` before continuing. Do not silently rewrite the contract.

## 5. Run validation

Run the validation command(s) from `GOAL.md` exactly as written, bounded by `Validation timeout` (default 5 min). Capture pass/fail/timeout and the relevant excerpt of output.

If the validation command itself is broken (won't run, depends on something unbuilt) OR exceeds the timeout, do not silently skip — append a `blocked` entry to PROGRESS and stop.

## 6. Append to PROGRESS.md

Append one block per **attempt** (not per checkpoint). Attempt numbering: count prior PROGRESS entries with the same checkpoint name. The first attempt is `Attempt: 1`.

```markdown
---

## <YYYY-MM-DD HH:MM> — Checkpoint: <Cn name> — Attempt: <N>

**Did:** <1-3 lines>
**Validation:** `<command>` → <pass | fail | partial | timeout | not-run>
**Verified:** <what the run proved>
**Remains:** <what's left toward stopping condition>
**Blocked?** <no | yes — reason>
**Next:** <next checkpoint or "stopping condition met">
```

Two special entry types use a different shape (see [../templates/PROGRESS.md](../templates/PROGRESS.md)):
- **C0: Baseline** — written once during `set` if the user opted in to a baseline run.
- **PAUSED** — written by the `pause` operation when the user pauses the goal.

## 7. Decide next action

Evaluate against the stopping condition in `GOAL.md`:

- **Stopping condition appears met** → DO NOT set `Status: done` directly. Run the **verify** workflow ([verify.md](verify.md)). The verifier spawns a fresh OpenCode session, re-runs validation independently, and returns a structured verdict in `<goal_dir>/.verify-last.json`. Handle the outcome in this order:
  1. **Check the script's exit code first.** If `scripts/verify.sh` exited non-zero (2/3/4), the verifier itself failed — DO NOT read any prior `.verify-last.json`. Append a `VERIFY` entry with `Verdict: verifier-failed` and the script's stderr. Retry **once** with a doubled `VERIFY_TIMEOUT_MIN`. If the retry also fails, set `Status: blocked` and surface to user.
  2. **Validate the verdict file.** If the script exited 0, read `.verify-last.json`. Require: `goal_hash` matches the current sha256 of `GOAL.md`, `timestamp` is newer than the most recent attempt entry in `PROGRESS.md`, and `verdict` is one of `done | not-done | unclear`. If any check fails, treat as `verifier-failed` per step 1.
  3. **Act on the verdict** (always: write the VERIFY entry to `PROGRESS.md` BEFORE changing `Status:` — preserve the audit trail if a crash interrupts the status update):
     - `done` → append VERIFY entry, then set `Status: done`, then stop and summarize for user with the verifier's reasoning.
     - `not-done` → append VERIFY entry, define a remediation checkpoint that addresses `missing_to_be_done` (this is a goal revision → triggers mid-run re-audit per §4). Continue the loop. Convergence cap: if the same stopping condition has produced **two consecutive `not-done` verdicts** without intervening user approval, set `Status: blocked` and surface to user rather than looping a third time.
     - `unclear` → append VERIFY entry, set `Status: blocked`, surface verifier reasoning to user.
- **Blocked** → set `Status: blocked`. Stop. Surface the specific question or missing input the user needs to provide.
- **Validation failed but recoverable** → continue: another attempt on the same checkpoint, or define a remediation checkpoint. Each retry produces a new PROGRESS entry with `Attempt: N+1`. Count attempts by reading PROGRESS for entries with the same checkpoint name. When the attempt count for a checkpoint reaches `Max attempts per checkpoint` (from GOAL.md, default 3), set `Status: blocked` and surface to the user.
- **Progress made, more to do** → continue to step 2 for the next checkpoint.

The loop is internal to this workflow. Keep going on your own. Only surface to the user at:
- stopping condition met
- blocked (any reason: max attempts hit, max checkpoints hit, validation broken, timeout, mid-run re-audit needed)
- every `Status cadence` checkpoints (from GOAL.md, default 3) — compact status update only

## 8. Compact checkpoint summary (when surfacing)

When you do surface to the user, give exactly:

```
Goal: <name> — <objective>
Checkpoint: <current Cn>
Verified: <one line>
Remains: <one line>
Blocked: <no | reason>
```

Nothing else unless the user asks.
