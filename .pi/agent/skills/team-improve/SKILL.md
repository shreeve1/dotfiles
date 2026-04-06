---
name: team-improve
description: Run one improvement cycle for an agent team. Reads the team's program.md, benchmarks the current harness, diagnoses weaknesses, makes one targeted change, re-benchmarks, and keeps or rolls back. Designed for autonomous hill-climbing loops. Use when asked to "improve a team", "optimize agents", "run team benchmarks", "hill-climb on team quality", or "start the improvement loop".
---

# Team Improvement Cycle

Run one experiment cycle for an agent team: benchmark → diagnose → change → re-benchmark → keep or rollback. Each invocation performs ONE experiment. Chain invocations in a loop for autonomous hill-climbing.

---

## Phase 1 — Identify the Team

If a team name was provided, use it. Otherwise check which teams have `program.md` files:

```bash
ls ~/.pi/agent/agents/teams/*/program.md 2>/dev/null
```

If multiple teams exist and none was specified, check `experiments/results.tsv` across teams to find the most recently active. If still ambiguous, pick the one with the lowest current score (most room to improve).

Resolve paths:
- **Team directory:** `~/.pi/agent/agents/teams/<team>/`
- **Program:** `<team-dir>/program.md`
- **Benchmarks:** `<team-dir>/benchmarks/`
- **Experiments:** `<team-dir>/experiments/`
- **Results:** `<team-dir>/experiments/results.tsv`
- **Snapshots:** `<team-dir>/experiments/snapshots/`

Read `program.md` fully. It is your directive — it defines the edit surface, improvement axes, and constraints for this team. Follow it.

### Path Resolution

The program.md contains an `agent_dir:` field with a path like `~/.pi/agent/agents/full`. Resolve `~` to the user's home directory. This is where the team's agent `.md` definition files live.

Verifier files reference targets like `dispatcher.md (from teams/1-full/)` or `planner.md (from agents/full/)`. Resolve these as:
- `(from teams/<team>/)` → `<team-dir>/<filename>`
- `(from agents/<subdir>/)` → `<agent-dir>/<filename>` (using the agent_dir from program.md)

---

## Phase 2 — Baseline Snapshot

Check if `experiments/snapshots/baseline/` exists.

### First Run (no baseline)

1. Create the snapshot structure:
   ```bash
   mkdir -p <team-dir>/experiments/snapshots/baseline/agents
   mkdir -p <team-dir>/experiments/snapshots/baseline/team-config
   ```

2. Copy the entire edit surface (listed in program.md) into the baseline:
   - Agent definition `.md` files → `baseline/agents/`
   - Team config files (dispatcher.md, context.md, etc.) → `baseline/team-config/`
   ```bash
   cp <agent-dir>/*.md <team-dir>/experiments/snapshots/baseline/agents/
   cp <team-dir>/dispatcher.md <team-dir>/context.md <team-dir>/experiments/snapshots/baseline/team-config/
   # Also copy expertise files if they exist
   cp -r <team-dir>/expertise/ <team-dir>/experiments/snapshots/baseline/expertise/ 2>/dev/null
   # Copy learning config if it exists
   mkdir -p <team-dir>/experiments/snapshots/baseline/agent-skills/
   cp <team-dir>/agent-skills/mental-model.md <team-dir>/experiments/snapshots/baseline/agent-skills/ 2>/dev/null
   ```

3. Initialize results.tsv:
   ```
   timestamp	experiment_id	avg_score	benchmark_scores	status	description
   ```

4. Run benchmarks (Phase 3) and record the result as `baseline` in results.tsv.

### Subsequent Runs (baseline exists)

Read the last few entries from `experiments/results.tsv` to understand:
- Current aggregate score
- Recent experiment descriptions (what has already been tried)
- Recent keep/discard pattern (are we stuck?)

Proceed to Phase 3.

---

## Phase 3 — Run Benchmarks

List all benchmark directories:
```bash
ls -d <team-dir>/benchmarks/*/
```

For each benchmark:

### 3a. Load the benchmark

Read `instruction.md` — the scenario or task to evaluate.
Read `verifier.md` — the scoring rubric, target agent, and required elements.

### 3b. Load the target agent

The verifier specifies which agent definition to test (e.g., `target: dispatcher.md`). Read that file to get the agent's full system prompt and instructions.

Also read supporting team context if the verifier says to (e.g., `context: [dispatcher.md, context.md]`).

### 3c. Simulate the agent's response

This is the core evaluation step. Given the agent's full system prompt and the benchmark instruction, produce the response this agent would realistically generate.

**Critical rule: Be honest, not optimistic.** If the agent's instructions are vague on a point, the simulation must reflect that vagueness — don't produce an idealized response the instructions couldn't actually yield. If the instructions miss a constraint, the simulated response must miss it too. The value of this benchmark is in exposing gaps, not in proving the harness works.

Write out the simulated response (it doesn't need to be long — capture the key decisions, structure, and content the agent would produce).

### 3d. Score against the rubric

For each criterion in the verifier:
1. Score 0–5 using the rubric's scale descriptions
2. Write a one-sentence justification
3. Apply the criterion's weight (default weight = 1)

### Scoring Formula

1. **Weighted criterion average:** `sum(criterion_score × weight) / sum(weights)` → produces a 0.0–5.0 base score
2. **Required Elements:** Deduct 0.25 points per missing required element
3. **Anti-Patterns:** Deduct 0.25 points per anti-pattern present
4. **Floor:** Final benchmark score cannot go below 0.0

Example: 3 criteria scored [4, 3, 5] with weights [3, 2, 1] → base = (12+6+5)/6 = 3.83. Missing 2 required elements → 3.83 - 0.50 = 3.33. One anti-pattern → 3.33 - 0.25 = 3.08. Final: **3.08**

### 3e. Record

After all benchmarks, compute the aggregate average across all benchmarks.

Write a structured summary to `experiments/latest.md` (overwritten each cycle — always shows most recent state):
```markdown
# Benchmark Scores — <timestamp>

| Benchmark | Score | Key Issues |
|-----------|-------|------------|
| <name> | <score> | <1-line summary> |
| ... | ... | ... |

**Aggregate: <avg_score>**
```

---

## Phase 4 — Diagnose

If this is the baseline run, analyze initial scores and proceed to Phase 5.

If this is a subsequent run, compare current scores to the previous entry in results.tsv.

Analyze:
1. **Lowest-scoring benchmarks** — which harness components scored worst?
2. **Score patterns** — are the same benchmarks consistently low across experiments?
3. **Root cause categories:**
   - Missing information in agent instructions
   - Vague or ambiguous guidance
   - Missing constraints or guardrails
   - Wrong or suboptimal tool assignments
   - Weak dispatch routing rules
   - Missing expertise or domain knowledge
   - Conflicting instructions across files
   - Context not flowing between agents (missing shared context)
4. **What's already been tried** — read recent results.tsv entries to avoid repeating failed experiments

Group failures by root cause. Choose ONE improvement target — the one likely to lift the broadest set of benchmarks, not just one.

Consult the program.md's **Improvement Axes** section for high-value areas the team owner wants explored.

---

## Phase 5 — Improve

### 5a. Snapshot before changing

```bash
EXPERIMENT_ID=$(date +%Y%m%d-%H%M%S)
mkdir -p <team-dir>/experiments/snapshots/$EXPERIMENT_ID/agents
mkdir -p <team-dir>/experiments/snapshots/$EXPERIMENT_ID/team-config
mkdir -p <team-dir>/experiments/snapshots/$EXPERIMENT_ID/agent-skills
```

Copy the same files as the baseline snapshot into this directory — agent definitions, team config, expertise, and agent-skills/mental-model.md. This is the rollback point.

### 5b. Make ONE targeted change

Apply the improvement identified in Phase 4. This is one conceptual change that may touch multiple files.

**Types of changes:**
- Improve an agent's system prompt (clearer instructions, better constraints, sharper guardrails)
- Add or refine dispatch routing rules in dispatcher.md
- Strengthen shared context in context.md
- Add missing domain knowledge to expertise files
- Adjust tool assignments in agent frontmatter
- Add context compression or scratch pad guidance
- Improve artifact handoff instructions
- Sharpen anti-patterns or failure mode awareness

**Hard rules:**
- ONE conceptual change per experiment (even if it touches 3 files)
- NEVER modify files in `benchmarks/` — that's overfitting
- NEVER modify `program.md` — that's your instructions
- NEVER modify files outside this team's edit surface
- NEVER add benchmark-specific keywords or hacks
- Apply the overfitting test: *"If this exact benchmark disappeared, would this still be a worthwhile harness improvement?"* If no, don't do it.

### 5c. Re-run benchmarks

Repeat Phase 3 with the modified agent definitions.

---

## Phase 6 — Keep or Rollback

Compare the new aggregate score to the pre-change score.

### Keep if:
- Aggregate score improved (any amount)
- Aggregate score unchanged AND the change makes the harness simpler (fewer words, clearer structure)
- No individual benchmark regressed by more than 1.0 point

### Rollback if:
- Aggregate score decreased
- Any individual benchmark regressed by more than 1.0 point, even if aggregate improved

**If rolling back:**
```bash
# Restore from pre-change snapshot
cp <team-dir>/experiments/snapshots/$EXPERIMENT_ID/agents/*.md <agent-dir>/
cp <team-dir>/experiments/snapshots/$EXPERIMENT_ID/team-config/* <team-dir>/
cp -r <team-dir>/experiments/snapshots/$EXPERIMENT_ID/expertise/ <team-dir>/expertise/ 2>/dev/null
cp <team-dir>/experiments/snapshots/$EXPERIMENT_ID/agent-skills/mental-model.md <team-dir>/agent-skills/ 2>/dev/null
```

**Also remove any NEW files** the meta-agent created that didn't exist in the snapshot:
```bash
# Check for agent .md files not in snapshot and remove them
for f in <agent-dir>/*.md; do
  [ ! -f "<team-dir>/experiments/snapshots/$EXPERIMENT_ID/agents/$(basename $f)" ] && rm "$f"
done
```

---

## Phase 7 — Log Results

Append one line to `experiments/results.tsv`:
```
<timestamp>	<experiment_id>	<avg_score>	<benchmark1:score,benchmark2:score,...>	<keep|discard|baseline>	<brief description of what was changed>
```

Overwrite `experiments/latest.md` with the current benchmark scores (from Phase 3e) PLUS the experiment summary:
```markdown
# Experiment: <experiment_id>

**Status:** keep | discard
**Change:** <what was modified and why>
**Score:** <before> → <after> (delta: <+/- change>)

## Per-Benchmark Comparison
| Benchmark | Before | After | Delta |
|-----------|--------|-------|-------|
| <name> | <score> | <score> | <+/- change> |

## Analysis
<Why did this help/hurt? What did this reveal?>

## Next Improvement Ideas
<Based on current scores, what should the next iteration try?>
```

---

## Phase 8 — Exit

Exit cleanly. Output a brief status line:
```
[team-improve] <team>: experiment <id> — <keep|discard> — <before> → <after> — "<description>"
```

The loop script handles repetition. Do NOT continue to another experiment in the same session.

---

## Constraints

- One experiment per invocation — no multi-experiment sessions
- Honest simulation — if instructions are weak, the simulation must reflect that
- Overfitting test on every change
- Never modify benchmarks, program.md, or other teams' files
- Always snapshot before modifying anything
- Always log to results.tsv, even for discards — discards are learning signal
