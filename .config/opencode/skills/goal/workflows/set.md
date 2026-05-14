# Workflow: set

Interview the user to produce a complete `GOAL.md` contract, then write it to `.opencode/state/goals/<name>/`.

## 1. Pick a name

Ask the user for a short slug for the goal (e.g. `expo-migration`, `eval-pass-rate`, `legacy-cleanup`). Validate it's lowercase-kebab-case. If the user doesn't propose one, suggest one based on the objective.

```bash
GOAL_NAME=<slug>
GOAL_DIR=.opencode/state/goals/$GOAL_NAME
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

## 3. Write the contract

Read [../templates/GOAL.md](../templates/GOAL.md), fill in the answers, write to `$GOAL_DIR/GOAL.md`. Set:
- `Status: active`
- `Created:` and `Last updated:` to today

Also initialize an empty progress log:

Read [../templates/PROGRESS.md](../templates/PROGRESS.md), substitute `<goal name>`, write to `$GOAL_DIR/PROGRESS.md`.

## 4. Ensure state dir is gitignored

```bash
if [ -f .gitignore ]; then
  grep -q '^\.opencode/state/' .gitignore || echo '.opencode/state/' >> .gitignore
else
  echo '.opencode/state/' > .gitignore
fi
```

## 5. Confirm and offer to start

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
