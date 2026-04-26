# AnalyzeAndShard Workflow


## Contents

- [Variables](#variables)
- [Constraints](#constraints)
- [Phase 1: Load & Parse Plan](#phase-1-load-parse-plan)
  - [Step 1 — Locate Plan](#step-1-locate-plan)
  - [Step 2 — Parse Plan Structure](#step-2-parse-plan-structure)
- [Phase 2: Estimate Tokens](#phase-2-estimate-tokens)
  - [Step 3 — Measure File Sizes](#step-3-measure-file-sizes)
  - [Step 4 — Classify Tasks](#step-4-classify-tasks)
  - [Step 5 — Calculate Total](#step-5-calculate-total)
  - [Step 6 — Report Estimation](#step-6-report-estimation)
- [Phase 3: Decision](#phase-3-decision)
  - [Step 7 — Verdict](#step-7-verdict)
- [Phase 4: Shard (Conditional)](#phase-4-shard-conditional)
  - [Step 8 — Build Dependency Graph](#step-8-build-dependency-graph)
  - [Step 9 — Topological Sort & Bin Pack](#step-9-topological-sort-bin-pack)
  - [Step 10 — Generate Shard Plans](#step-10-generate-shard-plans)
  - [Step 11 — Create Output Directory](#step-11-create-output-directory)
- [Phase 5: Report](#phase-5-report)
  - [Step 13 — Report Results](#step-13-report-results)
- [Shard Format](#shard-format)
  - [All Shards](#all-shards)
  - [Shards 2+ Only — Shard Context Section](#shards-2-only-shard-context-section)
  - [All Shards — Standard Sections (scoped to this shard)](#all-shards-standard-sections-scoped-to-this-shard)
- [Shard Output Structure](#shard-output-structure)
  - [README.md Format](#readmemd-format)
- Additional lower-level sections omitted from this TOC.

Full 5-phase workflow for token estimation and plan sharding.
## Variables

- `PLAN_FILE` — (Optional) Path to the plan file. If omitted, shows interactive list of recent plans.
- `PLAN_DIRECTORIES` — `artifacts/plans/`
- `TOKEN_BUDGET` — `150000`
- `SHARD_OVERHEAD` — `20000`

## Constraints

- **ANALYSIS ONLY**: Do NOT build, write code, or deploy agents. Your output is either an estimation report OR a set of shard plan files.
- If no `PLAN_FILE` is provided, list recent `.md` files in `PLAN_DIRECTORIES` and ask the user to select one using `ask the user`.
- read the plan file thoroughly before estimating.
- Use the token estimation heuristic defined in `TokenHeuristic.md` to produce a best-effort estimate.
- The estimate does not need to be exact — err on the side of overestimating (it is better to shard unnecessarily than to hit context limits mid-build).
- When sharding, never split a task from its unresolved dependencies.
- Each shard must be a complete, standalone plan that `$dev-build` can execute without any external context beyond the shard file itself.

---

## Phase 1: Load & Parse Plan

### Step 1 — Locate Plan

1. If `PLAN_FILE` is provided: verify it exists, read it
2. If not provided: list plan files under `artifacts/plans/` (recursive) sorted by modification time (newest first)
3. Present list to user with `ask the user` showing filename and first line (title)
4. Wait for selection before proceeding

### Step 2 — Parse Plan Structure

1. Extract all sections from the plan
2. Identify and list all files in `## Relevant Files`
3. Parse all tasks from `## Step by Step Tasks` with their metadata (task ID, Depends On, action items)
4. Count validation commands in `## Validation Commands`
5. Extract team members from `## Team Orchestration`
6. Extract acceptance criteria

---

## Phase 2: Estimate Tokens

### Step 3 — Measure File Sizes

1. Get the plan file's byte size
2. For each file in `## Relevant Files`:
   - If file path is absolute and exists: get actual size with `wc -c`
   - If file doesn't exist (new file): use 2,000 token estimate
3. Run file size checks in parallel where possible

### Step 4 — Classify Tasks

1. For each task, count action items (bullet points that are not metadata)
2. Check for complexity keywords in both the task name and action items
3. Assign Simple (8k) / Medium (20k) / Complex (35k) classification
4. Log classification reasoning for each task

### Step 5 — Calculate Total

1. Sum all components using the heuristic formula from `TokenHeuristic.md`
2. Apply 15% context accumulation tax
3. Record the breakdown for reporting

### Step 6 — Report Estimation

1. Display a breakdown table showing each component's contribution
2. Show the total vs. the `TOKEN_BUDGET`
3. State the verdict: "Fits in single session" or "Exceeds budget — sharding required"

---

## Phase 3: Decision

### Step 7 — Verdict

- **If Total <= TOKEN_BUDGET**: Report success and stop. Output the breakdown and a message confirming the plan can be built in a single session.
- **If Total > TOKEN_BUDGET**: Proceed to Phase 4.

---

## Phase 4: Shard (Conditional)

Only executed when the plan exceeds `TOKEN_BUDGET`.

### Step 8 — Build Dependency Graph

1. Parse `Depends On` for each task
2. Construct directed acyclic graph
3. Verify no circular dependencies (warn if found)

### Step 9 — Topological Sort & Bin Pack

1. Sort tasks respecting dependencies
2. Walk in order, packing into shards using greedy algorithm:
   - Calculate: `shard_cost = SHARD_OVERHEAD + plan_boilerplate_tokens + sum_of_task_costs_in_current_shard + this_task_cost`
   - Also add a proportional share of `referenced_file_tokens` — only count files that are relevant to tasks in this shard
   - If `shard_cost <= TOKEN_BUDGET * 0.85` (130k effective budget with safety margin): add task to current shard
   - If it would exceed the budget: start a new shard with this task
   - **Dependency rule**: If a task depends on another task in the *current* shard, it MUST stay in the current shard (or both move to the next shard if they don't fit)
3. Track which files are relevant to each shard's tasks
4. Log shard assignments

### Step 10 — Generate Shard Plans

For each shard, construct a complete plan document following the Shard Format (see below):
1. Include `## Shard Context` for shards 2+
2. Prune Team Members to only those needed per shard
3. Scope Acceptance Criteria and Validation Commands to shard's tasks

### Step 11 — Create Output Directory

1. Extract plan name from the original filename (strip `.md`)
2. Create `artifacts/plans/<plan-name>/` directory
3. Write `README.md` index
4. Write each `shard-N.md` file
5. Copy original plan as `original-plan.md`

---

## Phase 5: Report

### Step 13 — Report Results

#### Report Format A: Fits in Single Session

```
Dev Shard Analysis Complete

Plan: <path to plan>
Estimated Tokens: <total> / <TOKEN_BUDGET> (<percentage>%)
Verdict: Fits in single session

Breakdown:
  Plan ingestion:      <tokens> tokens
  Referenced files:    <tokens> tokens (<count> files)
  Task execution:      <tokens> tokens (<count> tasks: <simple>S/<medium>M/<complex>C)
  Validation commands: <tokens> tokens (<count> commands)
  Orchestration:       <tokens> tokens
  Subtotal:            <tokens> tokens
  Context tax (15%):   <tokens> tokens
  ─────────────────────────────
  Total:               <tokens> tokens

No sharding needed. Build with:
$dev-build <path to plan>
```

#### Report Format B: Sharded

```
Dev Shard Analysis Complete

Plan: <path to plan>
Estimated Tokens: <total> / <TOKEN_BUDGET> (<percentage>%)
Verdict: Exceeds budget — split into <N> shards

Breakdown:
  Plan ingestion:      <tokens> tokens
  Referenced files:    <tokens> tokens (<count> files)
  Task execution:      <tokens> tokens (<count> tasks: <simple>S/<medium>M/<complex>C)
  Validation commands: <tokens> tokens (<count> commands)
  Orchestration:       <tokens> tokens
  Subtotal:            <tokens> tokens
  Context tax (15%):   <tokens> tokens
  ─────────────────────────────
  Total:               <tokens> tokens

Shards Created:
  artifacts/plans/<plan-name>/
  ├── README.md            (index)
  ├── shard-1.md           ~<tokens> tokens — <task summary>
  ├── shard-2.md           ~<tokens> tokens — <task summary>
  ├── ...
  └── original-plan.md     (reference)

Execution Order:
  1. $dev-build artifacts/plans/<plan-name>/shard-1.md
  2. $dev-build artifacts/plans/<plan-name>/shard-2.md
  ...
  N. $dev-build artifacts/plans/<plan-name>/shard-N.md

Run shards sequentially. Each must complete before the next.
```

---

## Shard Format

Each shard follows the standard plan structure with these additions:

### All Shards

```md
# Plan: <original plan name> — Shard <N> of <Total>

## Shard Info
- **Shard**: <N> of <Total>
- **Estimated Tokens**: <estimated tokens for this shard>
- **Tasks in This Shard**: <task IDs>
- **Run Command**: `$dev-build artifacts/plans/<plan-name>/shard-<N>.md`
<if N > 1:>
- **Previous Shard**: `artifacts/plans/<plan-name>/shard-<N-1>.md`
- **Prerequisite**: Shard <N-1> must be completed first
</if>
<if N < Total:>
- **Next Shard**: `artifacts/plans/<plan-name>/shard-<N+1>.md`
</if>
```

### Shards 2+ Only — Shard Context Section

```md
<if N > 1:>
## Shard Context
This shard continues work started in previous shards. Before building, ensure the previous shards have been completed.

### Previous Shard Summary
<For each previous shard, list:>
- **Shard <M>**: <1-2 sentence summary of what it accomplished>
  - Files created: <list>
  - Files modified: <list>

### Prerequisites
The following must be true before starting this shard:
<list of concrete conditions — files that must exist, features that must work, etc.>
</if>
```

### All Shards — Standard Sections (scoped to this shard)

```md
## Task Description
<scoped to this shard's tasks>

## Objective
<scoped to this shard's tasks>

## Relevant Files
<only files relevant to this shard's tasks>

## Team Orchestration
<standard boilerplate, but Team Members pruned to only those assigned to tasks in this shard>

## Step by Step Tasks
<only tasks assigned to this shard, preserving original format>

## Acceptance Criteria
<scoped to this shard's tasks only>

## Testing Promise
<scoped to this shard>

## Validation Commands
<only commands relevant to this shard's work>

## Notes
<any shard-specific notes>
```

---

## Shard Output Structure

When sharding, create:

```
artifacts/plans/<plan-name>/
  README.md          — Index with shard overview, order, and sequential run instructions
  shard-1.md         — First shard plan
  shard-2.md         — Second shard plan (includes Shard Context)
  ...
  shard-N.md         — Final shard plan
  original-plan.md   — Full copy of the original plan for reference
```

### README.md Format

```md
# <Plan Name> — Sharded Plan

Original plan was estimated at **<total_tokens>** tokens, exceeding the **<TOKEN_BUDGET>** token single-session budget.
It has been split into **<N> ordered shards**.

## Execution Order

Run each shard sequentially. Each shard must complete before the next one starts.

| Shard | Estimated Tokens | Tasks | Description |
|-------|-----------------|-------|-------------|
| [Shard 1](shard-1.md) | <tokens> | <task IDs> | <1-line summary> |
| [Shard 2](shard-2.md) | <tokens> | <task IDs> | <1-line summary> |
| ... | ... | ... | ... |

## How to Run

Execute shards in order:
\`\`\`
$dev-build artifacts/plans/<plan-name>/shard-1.md
# Wait for completion, then:
$dev-build artifacts/plans/<plan-name>/shard-2.md
# Continue until all shards complete
\`\`\`

## Original Plan
See [original-plan.md](original-plan.md) for the full unsharded plan.
```

---

## Error Handling

- If no plans exist in `PLAN_DIRECTORIES`: inform user and suggest running `$dev-plan` first
- If plan file doesn't exist: report error and re-prompt for selection
- If plan has no `## Step by Step Tasks` section: warn that estimation will be rough (skip task classification, use plan-size-only estimate)
- If plan has no `## Relevant Files` section: skip file size measurement, note in report
- If circular dependencies detected: warn user, proceed with best-effort ordering
- If a single task exceeds the shard budget: warn user that the task itself may cause context issues, place it alone in a shard
