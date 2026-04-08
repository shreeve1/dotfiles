---
name: team-improve
description: Run one improvement cycle for an agent team or company. Reads the team's program.md, benchmarks the current harness, diagnoses weaknesses, makes one targeted change, re-benchmarks, and keeps or rolls back. Works with Pi teams, Claude Code teams, Paperclip companies, or any agent system. Use when asked to "improve a team", "optimize agents", "run team benchmarks", "hill-climb on team quality", or "start the improvement loop".
---

# Team Improvement Cycle

Run one experiment: benchmark -> diagnose -> change -> re-benchmark -> keep or rollback. Each invocation performs ONE experiment. Chain via the loop script for autonomous hill-climbing.

---

## Phase 1 -- Find the Team

**If a path was provided** (e.g., `/Users/james/.paperclip/instances/default` or `~/.pi/agent/agents/teams/2-infra-ops`), use it directly as the team root.

**If a name was provided**, search these locations in order:
```bash
ls ~/.claude/teams/<name>/program.md 2>/dev/null
ls ~/.pi/agent/agents/teams/<name>/program.md 2>/dev/null
# Also try: ~/.pi/agent/agents/teams/*<name>*/program.md
```

**If nothing was provided**, list all teams with program.md:
```bash
find ~/.claude/teams ~/.pi/agent/agents/teams -name "program.md" 2>/dev/null
```

Pick the one with the lowest recent score, or ask.

**Resolve the team root** (`<team-dir>`). Then read `<team-dir>/program.md` fully — it is your directive for this session.

---

## Phase 2 -- Read the Program

`program.md` contains everything you need to operate. Key fields to extract:

| Field | Purpose |
|---|---|
| `platform:` | `pi`, `claude-code`, `paperclip`, or `generic` |
| `runner:` | CLI command for the loop (`pi -p`, `claude -p`, etc.) |
| `agent_dir:` | Where agent `.md` files live (Pi/Claude Code) |
| `instructions_source:` | Source path for agent instructions (Paperclip) |
| `instructions_deployed:` | Deploy path pattern (Paperclip) |
| `apply_method:` | `file-edit`, `file-edit+deploy`, or `api-patch` |

If any field is missing, infer from context or platform conventions: Pi teams use `~/.pi/agent/agents/<slug>/` for agent_dir; Paperclip uses the project's `agent-instructions/` directory as instructions_source.

Paths:
- **Benchmarks:** `<team-dir>/benchmarks/`
- **Experiments:** `<team-dir>/experiments/`
- **Results:** `<team-dir>/experiments/results.tsv`
- **Snapshots:** `<team-dir>/experiments/snapshots/`

---

## Phase 3 -- Baseline Snapshot

Check if `<team-dir>/experiments/snapshots/baseline/` exists.

### First Run (no baseline)

1. Create snapshot structure:
   ```bash
   mkdir -p <team-dir>/experiments/snapshots/baseline/agents
   mkdir -p <team-dir>/experiments/snapshots/baseline/team-config
   ```

2. Copy the edit surface into baseline (see program.md's Edit Surface section):
   - Agent instruction files -> `baseline/agents/` (for Paperclip: copy the entire agent dir, e.g., `ceo/` → `baseline/agents/ceo/` to preserve HEARTBEAT.md etc.)
   - Team config files -> `baseline/team-config/`
   - Expertise files -> `baseline/expertise/` (if present)

3. Initialize results.tsv header:
   ```
   timestamp	experiment_id	avg_score	benchmark_scores	status	description
   ```

4. Run benchmarks now (follow Phase 4 steps) and record the result as `baseline` in results.tsv.
   **These scores ARE your Phase 4 pre-change scores — do NOT re-run benchmarks in Phase 4.**
   Proceed directly to Phase 5 (Diagnose) using these scores.

### Subsequent Runs

Read the last 5 entries of `results.tsv` to understand trajectory and what's been tried.
Then proceed to Phase 4 (run pre-change benchmarks) as normal.

---

## Phase 4 -- Run Benchmarks

```bash
ls -d <team-dir>/benchmarks/*/
```

**If no benchmark directories exist:** Stop. Output an error: "No benchmarks found in `<team-dir>/benchmarks/`. Run `/team-program` to create them." Do not proceed.

For each benchmark directory:

### 4a. Load benchmark
- Read `instruction.md` — the scenario to evaluate
- Read `verifier.md` — the rubric, target agent, required context

### 4b. Load the target agent

The verifier's `Target Agent` field specifies which agent to evaluate. Resolve it:

**Pi / Claude Code:**
```
target: dispatcher.md (from agents/<slug>/)  ->  <agent_dir>/dispatcher.md
target: dispatcher.md (from teams/<team>/)   ->  <team-dir>/dispatcher.md
```

**Paperclip:**
```
target: ceo    ->  <instructions_source>/ceo/AGENTS.md
target: patrol ->  <instructions_source>/patrol/AGENTS.md
```
Some Paperclip agents have multiple instruction files (e.g., CEO has `AGENTS.md`, `HEARTBEAT.md`, `SOUL.md`, `TOOLS.md`). Load ALL files in the agent's instruction directory — the verifier's Context Files section will call out which ones matter most for this benchmark.

Also load any `Context Files` listed in the verifier.

### 4c. Simulate the agent's response

Given the agent's full instructions and the benchmark scenario, produce the response this agent would realistically generate.

**Critical: Be honest, not optimistic.** If instructions are vague, the simulation must reflect that vagueness. If a constraint is missing, the response must miss it too. Gaps in instructions = gaps in simulated behavior.

### 4d. Score against the rubric

For each criterion:
1. Score 0–5 using the scale descriptions in the verifier
2. One-sentence justification
3. Apply the criterion's weight (default = 1)

**Scoring formula:**
1. `sum(score × weight) / sum(weights)` → base score (0.0–5.0)
2. Deduct 0.25 per missing Required Element
3. Deduct 0.25 per Anti-Pattern present
4. Floor at 0.0

### 4e. Record

Write `<team-dir>/experiments/latest.md`:
```markdown
# Benchmark Scores -- <timestamp>

| Benchmark | Score | Key Issues |
|-----------|-------|------------|
| <name> | <score> | <1-line summary> |

**Aggregate: <avg_score>**
```

---

## Phase 5 -- Diagnose

Identify ONE improvement target likely to lift the broadest set of benchmarks.

Analyze:
1. **Lowest-scoring benchmarks** and why
2. **Root causes:**
   - Missing/vague agent instructions
   - Missing constraints or guardrails
   - Wrong tool assignments
   - Weak routing/dispatch rules
   - Missing domain knowledge
   - Context not flowing between agents
3. **What's been tried** — scan results.tsv to avoid repeating failed experiments

Consult program.md's **Improvement Axes** section for high-priority areas.

---

## Phase 6 -- Improve

### 6a. Snapshot before changing

```bash
EXPERIMENT_ID=$(date +%Y%m%d-%H%M%S)
mkdir -p <team-dir>/experiments/snapshots/$EXPERIMENT_ID/agents
mkdir -p <team-dir>/experiments/snapshots/$EXPERIMENT_ID/team-config
mkdir -p <team-dir>/experiments/snapshots/$EXPERIMENT_ID/expertise
```

Copy the same files as the baseline. This is the rollback point.

### 6b. Make ONE targeted change

One conceptual change, possibly touching multiple files. Types:
- Sharper agent instructions, constraints, guardrails
- Better dispatch routing rules
- Stronger shared context
- Added domain expertise
- Improved artifact handoff or context compression
- Anti-pattern awareness

**Hard rules:**
- ONE conceptual change per experiment
- NEVER modify `benchmarks/` — that's overfitting
- NEVER modify `program.md` — that's your instructions
- NEVER touch files outside this team's edit surface
- Overfitting test: *"Would this change still be worthwhile if this benchmark disappeared?"* If no, don't do it.

### 6c. Apply the change (platform-specific)

Follow the `apply_method` in program.md:

**`file-edit`** (Pi, Claude Code):
Edit the agent `.md` files in `agent_dir` directly. Edit team config files in `team-dir` directly.

**`file-edit+deploy`** (Paperclip):
1. Edit the source file(s) at `instructions_source/<agent-name>/` (may include AGENTS.md, HEARTBEAT.md, SOUL.md, TOOLS.md)
2. Find the agent's UUID in program.md's Edit Surface section — each agent is listed with its UUID
3. Copy ALL modified files to the deployed path:
   ```bash
   # For each modified file in the agent's instruction dir:
   cp <instructions_source>/<agent>/<file>.md \
      <instructions_deployed>/<agent-uuid>/instructions/<file>.md
   ```
   The agent picks up changes on its next run — no restart needed.

**`api-patch`** (if specified):
Use the platform's REST API to update agent config directly. Credentials in program.md.

### 6d. Re-run benchmarks

Repeat Phase 4 with the modified instructions.

---

## Phase 7 -- Keep or Rollback

Compare new aggregate to pre-change aggregate.

**Keep if:**
- Aggregate improved (any amount)
- Aggregate unchanged AND harness is simpler
- No individual benchmark regressed > 1.0 point

**Rollback if:**
- Aggregate decreased
- Any benchmark regressed > 1.0 point (even if aggregate improved)

**To rollback:**
```bash
# Restore agent files
cp <team-dir>/experiments/snapshots/$EXPERIMENT_ID/agents/* <agent_dir>/

# For Paperclip: also redeploy
cp <team-dir>/experiments/snapshots/$EXPERIMENT_ID/agents/<name>.md \
   <instructions_deployed>/<uuid>/instructions/AGENTS.md

# Restore team config
cp <team-dir>/experiments/snapshots/$EXPERIMENT_ID/team-config/* <team-dir>/

# Remove any new files not in the snapshot
for f in <agent_dir>/*.md; do
  [ ! -f "<team-dir>/experiments/snapshots/$EXPERIMENT_ID/agents/$(basename $f)" ] && rm "$f"
done
```

---

## Phase 8 -- Log Results

Append to `<team-dir>/experiments/results.tsv`:
```
<timestamp>	<experiment_id>	<avg_score>	<bench1:score,bench2:score,...>	<keep|discard|baseline>	<description>
```

Overwrite `<team-dir>/experiments/latest.md`:
```markdown
# Experiment: <experiment_id>

**Status:** keep | discard
**Change:** <what was modified and why>
**Score:** <before> -> <after> (delta: <+/->)

## Per-Benchmark Comparison
| Benchmark | Before | After | Delta |
|-----------|--------|-------|-------|

## Analysis
<Why did this help or hurt?>

## Next Improvement Ideas
<What should the next iteration try?>
```

---

## Phase 9 -- Exit

Output one status line:
```
[team-improve] <team>: <id> -- <keep|discard> -- <before> -> <after> -- "<description>"
```

Do NOT run another experiment. The loop script handles repetition.

---

## Constraints

- One experiment per invocation
- Honest simulation — weak instructions yield weak simulated responses
- Overfitting test on every change
- Never modify benchmarks or program.md
- Always snapshot before modifying
- Log all results, including discards — they are learning signal
