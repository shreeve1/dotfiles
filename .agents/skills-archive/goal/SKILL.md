---
disable-model-invocation: true
name: goal
description: Set a durable objective the agent works toward across many turns, with a verifiable stopping condition, validation command, and checkpoint-based progress log.
---

# Goal — Durable Objective Loop

Run a long-running goal: one objective, one stopping condition, validated by a concrete command, with a checkpoint-based progress log. The agent keeps working across turns until the stopping condition is met, the agent is blocked, or the user pauses.

State lives under `.claude/state/goals/<name>/`:
- `GOAL.md` — the contract (objective, stopping condition, out-of-scope, validation command, status)
- `PROGRESS.md` — checkpoint log (append-only)

Do not use this for short tasks, exploratory back-and-forth, or work without a verifiable end state. For an autonomous task-list executor with fresh sessions, use `ralph-loop` instead — `goal` is for one durable contract the agent reasons about, `ralph-loop` is for a pre-defined task list.

---

## Lifecycle

The skill has five operations. Detect which one from the user's request, then run the matching workflow:

| User says... | Operation | Workflow file |
|---|---|---|
| "set a goal", "follow a goal", "start goal" | **set** | [workflows/set.md](workflows/set.md) |
| "work on the goal", "continue working", or goal is active | **work** | [workflows/work.md](workflows/work.md) |
| "goal status", "where are we", "show goal" | **status** | [workflows/status.md](workflows/status.md) |
| "verify the goal", "is the goal done", "check if done" | **verify** | [workflows/verify.md](workflows/verify.md) |
| "pause goal" | **pause** | inline (this file) |
| "resume goal", "unpause" | **resume** | inline (flip to active) + **work** |
| "clear goal", "abandon goal", "delete goal" | **clear** | inline (this file) |
| "archive goal" | **archive** | inline (this file) |

Routing is disjoint: "resume" runs the resume operation *then* the work workflow. "continue" / "work on the goal" runs work directly without status changes. **verify** can be invoked on demand by the user, but is also auto-invoked by **work** before any transition to `Status: done` (see §Independent verification below).

If a goal already exists and the user gives a request that fits the active goal's scope, run **work**. Otherwise ask whether to use the active goal or set a new one.

---

## Set up the loop (the contract)

A good goal is bigger than one prompt but smaller than an open-ended backlog. Before any work starts, the contract MUST define:

1. **Objective** — one sentence, concrete end state
2. **Stopping condition** — what verifiable signal proves "done" (e.g. `npm test` green, eval score ≥ 0.85, all screens match reference)
3. **Validation command(s)** — exact shell command(s) that produce the signal
4. **Validation is read-only** (`yes` | `no`) — whether the validation command can be re-run safely. Required `yes` for the independent verifier to be used; `no` disables verify and requires explicit user confirmation for `Status: done`.
5. **Inputs to read first** — files, docs, issues, logs, plans the agent must read before acting
6. **Out of scope** — what the agent must NOT change
7. **Checkpoint strategy** — how to break the work into verifiable milestones

If any of these is missing or vague, the workflow tightens the goal rather than starting work.

### Sanity check (mandatory)

The **set** workflow MUST run the sanity check in [workflows/set.md](workflows/set.md) §3 before writing any contract. The check has hard gates (objective is concrete, stopping condition is machine-verifiable, validation command is runnable, scope and out-of-scope are explicit) and soft checks (ambiguous nouns like "clean"/"better"/"good", validation cost, termination risk, rollback plan). For each failure, the agent MUST ask a clarifying question and re-audit — it cannot silently fill defaults. The user must explicitly approve the audit before the contract is written.

The same audit runs whenever a goal is **revised** mid-run (if `work` discovers the checkpoint strategy needs significant change, re-audit the affected sections).

See [templates/GOAL.md](templates/GOAL.md) for the contract template and [templates/PROGRESS.md](templates/PROGRESS.md) for the log template.

---

## Work autonomously

Once the contract is set, the **work** workflow runs the loop:

1. Read `GOAL.md` and `PROGRESS.md` to ground state.
2. Pick the next checkpoint (or define one if none).
3. Read required inputs.
4. Make scoped changes.
5. Run the validation command.
6. Append a compact entry to `PROGRESS.md` (checkpoint name, what was verified, what remains, blocked?).
7. Decide:
   - **Stopping condition appears met** → invoke **verify** ([workflows/verify.md](workflows/verify.md)). Handle the verifier's exit code first (non-zero → retry once, then `Status: blocked`), then validate the verdict file (fresh `goal_hash` matching current `GOAL.md`, `timestamp` newer than last attempt), then append the VERIFY entry to `PROGRESS.md` **before** updating `Status:`. Only a `done` verdict that passes shape validation may set `Status: done`. If `not-done`, continue with a remediation checkpoint (with a 2-consecutive-`not-done` convergence cap). If `unclear`, set `Status: blocked`.
   - **Blocked, needs human input** → mark status `blocked`, surface the question, stop.
   - **More work, not blocked** → continue to next checkpoint.

The agent should keep going on its own. It surfaces a status to the user only at checkpoints, when blocked, or when done.

---

## Independent verification

The agent running the loop is the same instance judging whether the stopping condition is met — self-grading. To break that loop, `goal` spawns a **fresh Claude Code session** as an independent verifier before any transition to `Status: done`.

The verifier:
- Runs in a clean context with `claude -p --no-session-persistence` — no prior conversation, no checkpoint-level rationalizations.
- Receives `GOAL.md` (trusted) plus the tail of `PROGRESS.md` (UNTRUSTED — labeled and framed as data, not instructions, to defend against prompt injection from a misbehaving work agent).
- Re-runs the validation command itself (does not trust the work agent's report). The validation command MUST be read-only / idempotent for the verifier to be used.
- Returns a structured verdict: `done`, `not-done`, or `unclear`, with reasoning, evidence, validation rerun result, and `injection_flags`.
- Binds the verdict to a specific `GOAL.md` state via `goal_hash` so stale verdicts can't be reused.

Trigger script: `scripts/verify.sh <goal_dir>` writes the verdict to `<goal_dir>/.verify-last.json` (deleting any prior verdict first to prevent reuse). The full protocol — exit-code handling, verdict shape validation, write-order discipline (log VERIFY entry before status update), failure modes, and convergence caps — lives in [workflows/verify.md](workflows/verify.md).

**Done-gate enforcement (the work agent MUST follow):**

0. If `GOAL.md` has `Validation is read-only: no`, the verifier is disabled (see [workflows/set.md](workflows/set.md) §3a): do NOT run `verify.sh`. Instead require explicit user confirmation of the stopping condition, log a `user-confirmed` VERIFY entry, then set `Status: done`. Skip steps 1–5.
1. Run `scripts/verify.sh "$GOAL_DIR"`. Check exit code.
2. If exit != 0 → retry once with doubled timeout; if still fails, log `verifier-failed`, set `Status: blocked`.
3. If exit == 0 → read `.verify-last.json`. Require ALL of: `verdict == "done"`, `goal_hash` matches current sha256 of `GOAL.md`, `timestamp` newer than last `PROGRESS.md` attempt entry, `validation_rerun.exit_code == 0`, `injection_flags` empty.
4. If any check fails → do NOT set `Status: done`. Treat as `verifier-failed` or downgraded verdict per verify.md.
5. If all pass → append VERIFY entry to `PROGRESS.md` **first**, then set `Status: done`.

This gate is instruction-following on the agent's part, not mechanically enforced by code. The `verify.sh` script does what it can: deletes stale verdicts, validates shape, downgrades unsafe `done` claims to `unclear`. The remaining trust is in the work agent honoring the protocol above.

---

## Pause

1. Edit `GOAL.md` and set `Status: paused`. Set `Last updated:` to today.
2. Append a **pause entry** to `PROGRESS.md` so a later agent instance (or future you) can resume safely. Capture:
   - Current checkpoint name
   - Last validation result (pass | fail | not-run)
   - Short summary of uncommitted/in-flight changes (run `git status --short` and `git diff --stat`, summarize in 3-5 lines)
   - Blocker reason, if any
   - Resume instructions: "Next: <next checkpoint> — run `<validation cmd>` to verify state, then continue."
3. Acknowledge to the user. Do not continue work.

## Resume

1. Verify the goal exists and is currently `paused` or `blocked`. If `done` or `abandoned`, ask the user before reactivating.
2. Edit `GOAL.md`: set `Status: active`, set `Last updated:` to today.
3. Read the most recent pause entry in `PROGRESS.md` for resume instructions.
4. Run the **work** workflow.

---

## Clear

Clear permanently deletes a goal's state. Confirm with the user (this is destructive).

```bash
# Validation guards — DO NOT SKIP
GOAL_NAME="<slug>"
[ -z "$GOAL_NAME" ] && { echo "ERROR: GOAL_NAME empty, aborting"; exit 1; }
# Allow only lowercase-kebab-case slug: a-z, 0-9, -; no leading/trailing/double dashes; no slashes or dots.
echo "$GOAL_NAME" | grep -Eq '^[a-z0-9]+(-[a-z0-9]+)*$' || { echo "ERROR: invalid slug '$GOAL_NAME'"; exit 1; }

GOAL_DIR=".claude/state/goals/$GOAL_NAME"
# Resolve and confirm the directory is a direct child of the goals root.
PARENT="$(cd .claude/state/goals 2>/dev/null && pwd)"
RESOLVED="$(cd "$GOAL_DIR" 2>/dev/null && pwd)"
[ -z "$PARENT" ] || [ -z "$RESOLVED" ] && { echo "ERROR: cannot resolve paths"; exit 1; }
[ "$(dirname "$RESOLVED")" = "$PARENT" ] || { echo "ERROR: $GOAL_DIR is not a direct child of $PARENT"; exit 1; }

echo "About to delete: $RESOLVED"
# Only after the user explicitly confirms:
rm -rf -- "$RESOLVED"
```

If only one goal exists and `<name>` was not specified, list goals first and require the user to type the slug.

## Archive

Archive preserves goal state for reference instead of deleting. Use this for completed or abandoned goals you want to keep.

```bash
GOAL_NAME="<slug>"
# Same slug validation as clear (above).
mkdir -p .claude/state/goals/_archive
mv -- ".claude/state/goals/$GOAL_NAME" ".claude/state/goals/_archive/$GOAL_NAME"
```

Archived goals are excluded from `status` and from active-goal counts. They are not loaded by **work**.

---

## Locating the active goal

```bash
ls .claude/state/goals/ 2>/dev/null | grep -v '^_archive$'
```

If multiple goals exist, the active one is whichever has `Status: active` in its `GOAL.md`. **By default, only one goal may be active at a time.** The `set` workflow precheck (set.md §1) blocks creating a new active goal if one already exists — the user must pause, finish, abandon the existing one, or explicitly opt in to parallel active goals.

If multiple are already active (from before this rule, or via opt-in), ask the user which to work on.

---

## Output discipline

- Progress reports name: **current checkpoint**, **what was verified**, **what remains**, **blocked?**.
- Avoid vague status. If the agent cannot answer those four questions, tighten the goal rather than adding ad-hoc instructions.
- Compact log entries — one block per **checkpoint attempt** (not per checkpoint), with attempt numbering. Multiple attempts at the same checkpoint produce multiple PROGRESS entries with `Attempt: N`.
