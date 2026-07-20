---
name: goal-objective
description: >
  Turn a rough intent into a well-formed goal prompt for the `goal` skill.
  Reads what the user actually wants, drafts a candidate objective + stopping
  condition + validation command, and asks one or two clarifying questions only
  when intent is genuinely unclear. Produces a ready-to-use goal contract draft
  and hands off to `goal` (set). Use when the user says "help me define a goal",
  "help me set up a goal", "draft a goal", "I want a goal for...", "what's a good
  goal for this", or invokes /goal-objective. Companion front-end to `goal`.
---

# goal-objective — draft a goal from intent

Help the user shape a vague intent into a concrete, verifiable goal contract,
then hand it to the `goal` skill to formally set. This skill does the *thinking*
about what the goal should be; `goal` does the state management and the
autonomous loop.

Do not create goal state yourself. Do not write `.claude/state/goals/`. Your
output is a drafted contract the user approves, then you invoke `goal` (set).

---

## When to use this vs `goal` directly

- Use **goal-objective** when the user has an intent but not a crisp objective /
  stopping condition yet ("I want to clean up the auth module", "make the tests
  reliable", "help me define a goal for X"). This skill infers and drafts.
- Use **goal** (set) directly when the user already knows the exact objective,
  stopping condition, and validation command.

If invoked and the intent is already crisp, skip straight to §4 handoff.

---

## Procedure

### 1. Understand the intent

Read the user's request and the current repo context. Infer:
- What end state they actually want (the destination, not the activities).
- What would prove it's reached (a signal, ideally machine-checkable).
- What command could produce that signal.

Do lightweight investigation if it sharpens the draft (e.g. check what test
runner the repo uses, whether a suite exists). Delegate broad exploration to a
subagent rather than reading widely inline. Keep it cheap — this is drafting,
not the work itself.

### 2. Ask only what you can't infer

Ask **at most two** clarifying questions, and only when the answer materially
changes the contract. Ask in plain chat text (no question tool). Prefer
proposing a default and letting the user correct it over asking open-ended.

Good reasons to ask:
- The objective could mean two genuinely different end states.
- No verifiable stopping condition is inferable and you can't propose a credible one.
- You can't find a validation command and the user hasn't named one.

Bad reasons to ask (infer or propose a default instead):
- Slug/name (propose one — validate it against `^[a-z0-9]+(-[a-z0-9]+)*$`, the slug
  regex `set` enforces, so the handoff isn't reopened for a rename).
- Checkpoint breakdown (draft it; the user edits).
- Scope details you can reasonably assume from the request.

If intent is already clear, ask nothing.

### 3. Draft the contract

Produce a candidate contract inline for the user to react to. Mirror the fields
the `goal` skill's `set` expects (see `../goal/templates/GOAL.md`):

```
Goal draft — <proposed-slug>

Objective:                <one concrete sentence — the end state>
Stopping condition:       <verifiable signal that proves done>
Validation command:       <exact shell command that produces the signal>
Validation is read-only:  <yes | no — is the validation safe to re-run?>
Inputs to read first:     <files/docs to read first>
Out of scope:             <what must NOT change>
Checkpoint strategy:      <C1..Cn, each with its own pass/fail signal>
Notes / Constraints:      <rollback/parity, anything to remember>
```

Hold the draft to the same bar `goal`'s `set` audit enforces, so handoff is
clean:
- Objective is one concrete end state, not a list of activities.
- Stopping condition is machine-verifiable, not a judgment call.
- Validation command is runnable and read-only / idempotent (the verifier
  re-runs it). If it's not read-only, flag it — `goal` skips the verify step and
  makes `Status: done` require explicit user confirmation instead.
- Scope and out-of-scope are explicit.
- Scan the objective/stopping condition for load-bearing vague words ("clean",
  "better", "robust", "fix", "improve") and replace them with something
  measurable before presenting.

If you genuinely cannot make the stopping condition verifiable, say so plainly
and present the best proxy you can — don't paper over it.

### 4. Confirm and hand off

Show the draft. Ask the user to approve or edit. Once approved, hand off:

> Ready. Invoking the `goal` skill to set this up.

Then invoke the **goal** skill's **set** operation, passing the approved draft
so its interview is pre-filled — `set` still runs its own precheck and audit and
writes the state. Do not duplicate that here; your job was to get the draft to a
state where those steps sail through. Expect `set` to still handle, on its own:
- its active-goal precheck (if another goal is already active, `set` asks whether
  to pause/archive it or allow parallel goals);
- the optional baseline run (whether to run the validation command once now to
  record a starting point);
- the final hard-gate/soft-check audit and PROCEED confirmation.

These prompts come from `set`, not from a gap in the draft — don't pre-answer
them here.

---

## Output discipline

- Lead with the draft, not preamble.
- One or two questions maximum, and only when necessary.
- Never write goal state — that's `goal`'s job.
- If the user's intent doesn't warrant a durable goal (short task, exploratory
  back-and-forth, no verifiable end state), say so and suggest just doing the
  task instead of setting a goal.
