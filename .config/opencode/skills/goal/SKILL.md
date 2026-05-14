---
name: goal
description: Give the agent a durable objective to work toward across many turns with a verifiable stopping condition, validation loop, and progress log. Use when the user wants long-running autonomous work toward a clear end state - code migrations, large refactors, prototype completion, eval/prompt optimization, deployment retry loops, or says things like "follow a goal", "set a goal", "keep working until X", "don't stop until tests pass", "work autonomously on this", "long-running task".
---

# Goal — Durable Objective Loop

Run a long-running goal: one objective, one stopping condition, validated by a concrete command, with a checkpoint-based progress log. The agent keeps working across turns until the stopping condition is met, the agent is blocked, or the user pauses.

State lives under `.opencode/state/goals/<name>/`:
- `GOAL.md` — the contract (objective, stopping condition, out-of-scope, validation command, status)
- `PROGRESS.md` — checkpoint log (append-only)

Do not use this for short tasks, exploratory back-and-forth, or work without a verifiable end state. For an autonomous task-list executor with fresh sessions, use `ralph-loop` instead — `goal` is for one durable contract the agent reasons about, `ralph-loop` is for a pre-defined task list.

---

## Lifecycle

The skill has five operations. Detect which one from the user's request, then run the matching workflow:

| User says... | Operation | Workflow file |
|---|---|---|
| "set a goal", "follow a goal", "start goal" | **set** | [workflows/set.md](workflows/set.md) |
| "work on the goal", "continue", "resume goal", or goal is active | **work** | [workflows/work.md](workflows/work.md) |
| "goal status", "where are we", "show goal" | **status** | [workflows/status.md](workflows/status.md) |
| "pause goal", "resume goal" | **pause/resume** | inline (this file) |
| "clear goal", "abandon goal", "delete goal" | **clear** | inline (this file) |

If a goal already exists and the user gives a request that fits the active goal's scope, run **work**. Otherwise ask whether to use the active goal or set a new one.

---

## Set up the loop (the contract)

A good goal is bigger than one prompt but smaller than an open-ended backlog. Before any work starts, the contract MUST define:

1. **Objective** — one sentence, concrete end state
2. **Stopping condition** — what verifiable signal proves "done" (e.g. `npm test` green, eval score ≥ 0.85, all screens match reference)
3. **Validation command(s)** — exact shell command(s) that produce the signal
4. **Inputs to read first** — files, docs, issues, logs, plans the agent must read before acting
5. **Out of scope** — what the agent must NOT change
6. **Checkpoint strategy** — how to break the work into verifiable milestones

If any of these is missing or vague, the workflow tightens the goal rather than starting work.

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
   - **Stopping condition met** → mark `GOAL.md` status `done`, summarize, stop.
   - **Blocked, needs human input** → mark status `blocked`, surface the question, stop.
   - **More work, not blocked** → continue to next checkpoint.

The agent should keep going on its own. It surfaces a status to the user only at checkpoints, when blocked, or when done.

---

## Pause / Resume

**Pause** — edit `GOAL.md` and set `status: paused`. Acknowledge to the user. Do not continue work.

**Resume** — edit `GOAL.md` and set `status: active`. Run **work**.

---

## Clear

Confirm with the user (this is destructive). Then:

```bash
GOAL_NAME=<name>
rm -rf .opencode/state/goals/$GOAL_NAME
```

If only one goal exists and `<name>` was not specified, list goals first and confirm.

---

## Locating the active goal

```bash
ls .opencode/state/goals/ 2>/dev/null
```

If multiple goals exist, the active one is whichever has `status: active` in its `GOAL.md`. If multiple are active, ask the user which to work on.

---

## Output discipline

- Progress reports name: **current checkpoint**, **what was verified**, **what remains**, **blocked?**.
- Avoid vague status. If the agent cannot answer those four questions, tighten the goal rather than adding ad-hoc instructions.
- Compact log entries — one block per checkpoint, not a running narrative.
