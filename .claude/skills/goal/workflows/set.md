# Workflow: set

Interview the user to produce a complete `GOAL.md` contract, then write it to `.opencode/state/goals/<name>/`.

## 1. Precheck and pick a name

### 1a. Block multiple active goals (default policy)

Before creating a new goal, list any existing active goals:

```bash
mkdir -p .opencode/state/goals
for d in .opencode/state/goals/*/; do
  [ -d "$d" ] || continue
  [ "$(basename "$d")" = "_archive" ] && continue
  status=$(grep -m1 '^\*\*Status:\*\*' "$d/GOAL.md" 2>/dev/null | sed 's/.*Status:\*\* //;s/ .*//')
  [ "$status" = "active" ] && echo "$(basename "$d")"
done
```

If any active goal exists, ask the user one question with these options:
1. Pause the existing goal and create this new one (recommended)
2. Abandon the existing goal (move to archive)
3. Allow parallel active goals (advanced — both will need explicit selection in `work`)
4. Cancel — work on the existing goal instead

Do not proceed until the user picks one.

### 1b. Pick a name

Ask the user for a short slug for the goal (e.g. `expo-migration`, `eval-pass-rate`, `legacy-cleanup`). Validate against this regex: `^[a-z0-9]+(-[a-z0-9]+)*$`. If the user doesn't propose one, suggest one based on the objective.

```bash
GOAL_NAME="<slug>"
# Validate slug
echo "$GOAL_NAME" | grep -Eq '^[a-z0-9]+(-[a-z0-9]+)*$' || { echo "invalid slug"; exit 1; }
GOAL_DIR=".opencode/state/goals/$GOAL_NAME"
mkdir -p "$GOAL_DIR"
```

If `$GOAL_DIR/GOAL.md` already exists, ask whether to overwrite or pick a new name.

## 2. Interview

Ask one question at a time (use the `question` tool). Skip anything the user already provided.

1. **Objective** — "What's the end state in one concrete sentence?"
2. **Stopping condition** — "What verifiable signal proves it's done?"
3. **Validation command** — "What exact shell command produces that signal?"
4. **Inputs to read first** — "Which files/docs/issues should I read before acting?"
5. **Out of scope** — "What must I NOT change?"
6. **Checkpoint strategy** — "How does this naturally break into milestones?" (offer a draft if the user is unsure)
7. **Notes/constraints** — "Anything else I need to remember across turns?"

Keep it tight. If the user is vague on stopping condition or validation, push back — that's the contract and the run is worse without it.

## 3. Sanity check (REQUIRED — do not skip)

Before writing the contract, audit every answer against the checklist below. For each item that fails, ask a clarifying question (one at a time, via the `question` tool). Do not proceed to step 4 until every item passes or the user has explicitly accepted the risk.

### 3a. Hard gates (must pass or block)

The goal CANNOT be written until each of these is true. If any fails, ask a clarifying question and re-audit.

- [ ] **Objective is one concrete end state**, not a list of activities. ("Migrate package X to Y" passes. "Improve the codebase" fails. "Work on auth" fails.)
- [ ] **Stopping condition is verifiable by a machine**, not by judgment. ("All tests in `tests/migration/` pass" passes. "It feels good" fails. "Code is clean" fails.)
- [ ] **Validation command exists and is runnable as written**. Try it:
  ```bash
  # Dry-check the command parses and the entrypoint exists.
  # Do NOT execute long-running validations here — just verify the binary/script resolves.
  command -v <first token of validation cmd> >/dev/null 2>&1 && echo OK || echo MISSING
  # If the command references a file (script, config), confirm it exists.
  ```
  If MISSING or the referenced file does not exist, ask the user how to actually validate.
- [ ] **Validation command is read-only / idempotent.** The verifier re-runs this command in a fresh session — a mutating command (starts services, writes to a DB, updates snapshots, modifies caches, sends external requests, deletes files) would corrupt state on every verify cycle. Ask the user explicitly via the `question` tool: "Is the validation command read-only and safe to run multiple times back-to-back?" Options: `yes (verify enabled)` / `no — uses snapshot/state updates (verify disabled)` / `unsure — let me describe what it does`. Record the answer in `GOAL.md` as `Validation is read-only: yes|no`. If `no`: the verify workflow is skipped for this goal, and `Status: done` will require explicit user confirmation instead of a verifier verdict — note this prominently under "Notes / Constraints".
- [ ] **Stopping condition is reachable from the current repo state — baseline check.** Ask the user: "Should I run the validation command now to record a baseline?" If yes, run it with a bounded timeout (default 5 min — confirm with user if longer). Record the result as `C0: Baseline` in PROGRESS.md before any work starts. Three outcomes:
  - Baseline **passes** → flag it: the goal may already be done. Ask user to confirm there is still work to do (e.g. "the suite passes but we're adding new tests as part of the goal").
  - Baseline **fails** → confirm with user that "make it pass" is the goal.
  - Baseline **skipped** (user declined or validation is too expensive) → require an explicit acknowledgment that reachability is not verified; note this under "Notes / Constraints".
- [ ] **Out of scope is explicit.** Empty/unspecified is not allowed. If the user truly has no constraints, confirm via an explicit `question` tool prompt with options "no out-of-scope constraints (proceed)" / "let me add some" — do not rely on matching a verbatim phrase from free text.
- [ ] **Inputs to read first is non-empty** OR the user has explicitly confirmed "no required reading" via a `question` tool prompt. Silent agreement is not acceptance.

### 3b. Soft checks (ask if ambiguous, accept user override)

Ask a clarifying question for each ambiguity. If the user explicitly accepts the risk, note it under "Notes / Constraints" in GOAL.md and proceed.

- [ ] **Scope size sanity.** Is this bigger than one prompt but smaller than an open-ended backlog? If the objective implies dozens of unrelated units of work, surface it: "This looks like multiple goals — should we split it?"
- [ ] **Checkpoints are independently verifiable.** Each checkpoint should have its own pass/fail signal. If a checkpoint is "refactor module X" with no validation, ask what proves that checkpoint is done.
- [ ] **Out of scope vs objective overlap.** Re-read both. If the objective requires touching something marked out of scope, flag the contradiction.
- [ ] **Validation cost.** If the validation command takes >5 min per run, surface it: "Validation runs in ~N min — confirm you want this as the per-checkpoint gate, or define a cheaper proxy."
- [ ] **Rollback / parity.** For migrations and refactors: is there a rollback plan or parity check? If the goal is "migrate from A to B" with no parity test, ask how regressions will be caught.
- [ ] **Termination risk.** Could this loop forever? Is there a worst-case stopping condition (e.g. "stop after N checkpoints with no improvement" for optimization goals)? If unclear, ask.
- [ ] **Ambiguous nouns and verbs.** Scan the objective and stopping condition for vague words: "clean", "better", "fast", "proper", "production-ready", "polished", "good", "fix", "improve", "optimize", "refactor", "modernize", "harden", "standardize", "consistent", "complete", "robust", "solid". For each one found that is load-bearing in the stopping condition, ask the user to replace it with something measurable (a number, a passing test, a binary artifact check).

### 3c. Audit report

After running the checklist, render a one-screen audit to the user before writing the contract:

```
Goal audit — <name>

HARD GATES
  ✓ Objective concrete
  ✓ Stopping condition verifiable
  ✓ Validation command runnable
  ✓ Reachable from current state (current: <pass|fail>)
  ✓ Out of scope explicit
  ✓ Inputs specified

SOFT CHECKS
  ✓ Scope sized correctly
  ⚠ Checkpoint C3 has no validation — user accepted (note added)
  ✓ No scope/out-of-scope conflict
  ✓ Validation cost acceptable
  ⚠ No rollback plan — user accepted (note added)
  ✓ No termination risk
  ✓ No ambiguous nouns

PROCEED? [y/n]
```

If the user says no, return to the interview and revise. If yes, continue to step 4.

## 4. Write the contract

Read [../templates/GOAL.md](../templates/GOAL.md), fill in the answers, write to `$GOAL_DIR/GOAL.md`. Set:
- `Status: active`
- `Created:` and `Last updated:` to today
- `Max checkpoints`, `Max attempts per checkpoint`, `Status cadence`, `Validation timeout` — fill from the interview or use the template defaults.
- `Validation is read-only:` — set to `yes` or `no` based on the §3a idempotence gate answer. Required field; do not leave blank.

Initialize the progress log. Read [../templates/PROGRESS.md](../templates/PROGRESS.md), substitute `<goal name>` in the title, write to `$GOAL_DIR/PROGRESS.md`. **The initialized file must contain only the title, the instruction line, and the HTML comment block with entry shapes — no real entries.** `status.md` distinguishes the comment block from real entries.

If the user opted in to the baseline run in §3a:
- Run the validation command with the configured timeout.
- Append a single real entry to PROGRESS.md:

```markdown
---

## <YYYY-MM-DD HH:MM> — Checkpoint: C0 Baseline — Attempt: 1

**Did:** Recorded baseline before any work.
**Validation:** `<command>` → <pass | fail | partial | timeout>
**Verified:** <one line on what the run actually showed>
**Remains:** <one line — what the goal requires beyond baseline>
**Blocked?** <no | yes — reason>
**Next:** C1
```

## 5. Ensure state dir is gitignored

```bash
if [ -f .gitignore ]; then
  grep -q '^\.opencode/state/' .gitignore || echo '.opencode/state/' >> .gitignore
else
  echo '.opencode/state/' > .gitignore
fi
```

## 6. Confirm and offer to start

Show the user the final `GOAL.md`. Ask whether to start working now (run **work** workflow) or stop here. Respect the answer.

## Output

```
Goal set: <name>
Contract: .opencode/state/goals/<name>/GOAL.md
Progress: .opencode/state/goals/<name>/PROGRESS.md
Stopping condition: <one-line>
Validation: <command>

Status: active
Next: work | pause | clear
```
