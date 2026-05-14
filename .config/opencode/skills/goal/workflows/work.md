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
- If checkpoint strategy is exhausted but the stopping condition is not met, define the next checkpoint inline and add it to `GOAL.md` (with a note in PROGRESS).
- If no checkpoints exist yet, define checkpoint C1.

## 3. Read required inputs

Read every file listed under "Inputs to read first" in `GOAL.md` that you have not already read this session. Read them fully.

## 4. Make scoped changes

Implement the checkpoint. Constraints:
- Stay inside scope. Do not touch anything listed under "Out of scope".
- Make the smallest change that satisfies the checkpoint.
- If you discover the checkpoint needs to be split or revised, update `GOAL.md` before continuing, and note it in `PROGRESS.md`.

## 5. Run validation

Run the validation command(s) from `GOAL.md` exactly as written. Capture pass/fail and the relevant excerpt of output.

If the validation command itself is broken (won't run, depends on something unbuilt), do not silently skip — append a `blocked` entry to PROGRESS and stop.

## 6. Append to PROGRESS.md

Append one block following [../templates/PROGRESS.md](../templates/PROGRESS.md) format:

```markdown
---

## <YYYY-MM-DD HH:MM> — Checkpoint: <Cn name>

**Did:** <1-3 lines>
**Validation:** `<command>` → <pass | fail | partial>
**Verified:** <what the run proved>
**Remains:** <what's left toward stopping condition>
**Blocked?** <no | yes — reason>
**Next:** <next checkpoint or "stopping condition met">
```

## 7. Decide next action

Evaluate against the stopping condition in `GOAL.md`:

- **Stopping condition met** → set `GOAL.md` `Status: done` and `Last updated:` today. Stop. Summarize the run for the user.
- **Blocked** → set `Status: blocked`. Stop. Surface the specific question or missing input the user needs to provide.
- **Validation failed but recoverable** → continue: revise approach on the same checkpoint, or move to a remediation checkpoint. Do not bounce. Cap retries at 3 per checkpoint before treating as blocked.
- **Progress made, more to do** → continue to step 2 for the next checkpoint.

The loop is internal to this workflow. Keep going on your own. Only surface to the user at: stopping condition met, blocked, or every Nth checkpoint (default N=3) for a compact status update.

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
