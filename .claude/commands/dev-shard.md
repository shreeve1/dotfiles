---
name: dev-shard
description: Analyze plan token budget and split into ordered shards if needed
argument-hint: [plan-file]
model: opus
---

# Dev Shard

Analyze an implementation plan to estimate whether it can be executed within a single ~150k token build session. If the plan exceeds the budget, split it into an ordered chain of self-contained shards that can be built sequentially.

## Variables

PLAN_FILE: $1 — (Optional) Path to the plan file. If omitted, shows interactive list of recent plans.
PLAN_DIRECTORY: `specs/`
TOKEN_BUDGET: `150000`
SHARD_OVERHEAD: `20000`

## Instructions

- **ANALYSIS ONLY**: Do NOT build, write code, or deploy agents. Your output is either an estimation report OR a set of shard plan files.
- If no `PLAN_FILE` is provided, list recent `.md` files in `PLAN_DIRECTORY` and ask the user to select one using `AskUserQuestion`.
- Read the plan file thoroughly before estimating.
- Use the token estimation heuristic defined below to produce a best-effort estimate.
- The estimate does not need to be exact — err on the side of overestimating (it is better to shard unnecessarily than to hit context limits mid-build).
- When sharding, never split a task from its unresolved dependencies.
- Each shard must be a complete, standalone plan that `/dev-build` or `/build_w_team` can execute without any external context beyond the shard file itself.

## Token Estimation Heuristic

Estimate the total tokens a build session would consume by summing these components:

### 1. Plan Ingestion
The build agent reads the entire plan at the start.
```
plan_tokens = plan_file_size_in_bytes / 4
```

### 2. Referenced File Reads
The build agent reads files listed in the `## Relevant Files` section to understand the codebase.
```
For each file in Relevant Files:
  if file exists on disk:
    file_tokens = file_size_in_bytes / 4
  else (file to be created):
    file_tokens = 2000  # estimate for new file context
referenced_file_tokens = sum of all file_tokens
```
Use the `Bash` tool with `wc -c` or `stat` to get actual file sizes.

### 3. Per-Task Execution Cost
Each task in `## Step by Step Tasks` consumes tokens for reasoning, file reads, code generation, and output.

Classify each task by counting its action items (bullet points under the task header, excluding metadata lines like Task ID, Depends On, etc.):

| Classification | Action Items | Keywords (any match) | Token Cost |
|---------------|-------------|---------------------|------------|
| Simple | 1-2 | update, rename, add, remove, config, delete, move, copy | 8,000 |
| Medium | 3-4 | implement, create, integrate, refactor, extend, connect, hook | 20,000 |
| Complex | 5+ | architect, design, migrate, rewrite, system, overhaul, rebuild | 35,000 |

**Classification rules:**
1. First check action item count
2. If borderline (e.g., 2 items but complex keywords), upgrade one level
3. Validation/testing tasks are always **Simple** unless they involve writing new test suites (then **Medium**)

```
task_tokens = sum of each task's classified cost
```

### 4. Validation Commands
Each command in `## Validation Commands` requires execution and output processing.
```
validation_tokens = number_of_commands * 3000
```

### 5. Orchestration Overhead
Fixed cost for task management, team coordination, and agent reasoning between tasks.
```
orchestration_tokens = 10000
```

### 6. Context Accumulation Tax
As the conversation progresses, the context window fills with previous messages. Apply a 15% multiplier.
```
subtotal = plan_tokens + referenced_file_tokens + task_tokens + validation_tokens + orchestration_tokens
total_estimated_tokens = subtotal * 1.15
```

## Sharding Algorithm

When `total_estimated_tokens > TOKEN_BUDGET`, split the plan into shards:

1. **Parse Tasks**: Extract all tasks from `## Step by Step Tasks` with their Task IDs, dependencies (`Depends On`), and estimated token costs (from classification above).

2. **Build Dependency Graph**: Create a directed graph where edges point from dependency to dependent task.

3. **Topological Sort**: Order tasks so that no task appears before its dependencies. Preserve the original plan order as a tiebreaker.

4. **Greedy Bin Packing**: Walk tasks in topological order. For each task:
   - Calculate: `shard_cost = SHARD_OVERHEAD + plan_boilerplate_tokens + sum_of_task_costs_in_current_shard + this_task_cost`
   - Also add a proportional share of `referenced_file_tokens` — only count files that are relevant to tasks in this shard
   - If `shard_cost <= TOKEN_BUDGET * 0.85` (130k effective budget with safety margin): add task to current shard
   - If it would exceed the budget: start a new shard with this task
   - **Dependency rule**: If a task depends on another task in the *current* shard, it MUST stay in the current shard (or both move to the next shard if they don't fit)

5. **Generate Shards**: For each shard, produce a complete plan file (see Shard Format below).

## Shard Format

Each shard follows the same structure as `/plan_w_team` output with these additions:

### Shard 1 (and all shards)
```md
# Plan: <original plan name> — Shard <N> of <Total>

## Shard Info
- **Shard**: <N> of <Total>
- **Estimated Tokens**: <estimated tokens for this shard>
- **Tasks in This Shard**: <task IDs>
- **Run Command**: `/dev-build specs/<plan-name>/shard-<N>.md`
<if N > 1:>
- **Previous Shard**: `specs/<plan-name>/shard-<N-1>.md`
- **Prerequisite**: Shard <N-1> must be completed first
</if>
<if N < Total:>
- **Next Shard**: `specs/<plan-name>/shard-<N+1>.md`
</if>

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

## Shard Output Structure

When sharding, create:

```
specs/<plan-name>/
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
/dev-build specs/<plan-name>/shard-1.md
# Wait for completion, then:
/dev-build specs/<plan-name>/shard-2.md
# Continue until all shards complete
\`\`\`

## Original Plan
See [original-plan.md](original-plan.md) for the full unsharded plan.
```

## Workflow

### Phase 1: Load & Parse Plan

1. **Locate Plan**
   - If `PLAN_FILE` is provided: verify it exists, read it
   - If not provided: list all `.md` files in `PLAN_DIRECTORY` sorted by modification time (newest first)
   - Present list to user with `AskUserQuestion` showing filename and first line (title)
   - Wait for selection before proceeding

2. **Parse Plan Structure**
   - Extract all sections from the plan
   - Identify and list all files in `## Relevant Files`
   - Parse all tasks from `## Step by Step Tasks` with their metadata (Task ID, Depends On, action items)
   - Count validation commands in `## Validation Commands`
   - Extract team members from `## Team Orchestration`
   - Extract acceptance criteria

### Phase 2: Estimate Tokens

3. **Measure File Sizes**
   - Get the plan file's byte size
   - For each file in `## Relevant Files`:
     - If file path is absolute and exists: get actual size with `wc -c`
     - If file doesn't exist (new file): use 2,000 token estimate
   - Run file size checks in parallel where possible

4. **Classify Tasks**
   - For each task, count action items (bullet points that are not metadata)
   - Check for complexity keywords in both the task name and action items
   - Assign Simple (8k) / Medium (20k) / Complex (35k) classification
   - Log classification reasoning for each task

5. **Calculate Total**
   - Sum all components using the heuristic formula
   - Apply 15% context accumulation tax
   - Record the breakdown for reporting

6. **Report Estimation**
   - Display a breakdown table showing each component's contribution
   - Show the total vs. the TOKEN_BUDGET
   - State the verdict: "Fits in single session" or "Exceeds budget — sharding required"

### Phase 3: Decision

7. **If Total <= TOKEN_BUDGET**: Report success and stop. Output the breakdown and a message confirming the plan can be built in a single session.

8. **If Total > TOKEN_BUDGET**: Proceed to Phase 4.

### Phase 4: Shard (Conditional)

9. **Build Dependency Graph**
   - Parse `Depends On` for each task
   - Construct directed acyclic graph
   - Verify no circular dependencies (warn if found)

10. **Topological Sort & Bin Pack**
    - Sort tasks respecting dependencies
    - Walk in order, packing into shards using greedy algorithm
    - Track which files are relevant to each shard's tasks
    - Log shard assignments

11. **Generate Shard Plans**
    - For each shard, construct a complete plan document following the Shard Format
    - Include `## Shard Context` for shards 2+
    - Prune Team Members to only those needed per shard
    - Scope Acceptance Criteria and Validation Commands to shard's tasks

12. **Create Output Directory**
    - Extract plan name from the original filename (strip `.md`)
    - Create `specs/<plan-name>/` directory
    - Write `README.md` index
    - Write each `shard-N.md` file
    - Copy original plan as `original-plan.md`

### Phase 5: Report

13. **Report Results**

## Report

### Report Format A: Fits in Single Session

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
/dev-build <path to plan>
```

### Report Format B: Sharded

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
  specs/<plan-name>/
  ├── README.md            (index)
  ├── shard-1.md           ~<tokens> tokens — <task summary>
  ├── shard-2.md           ~<tokens> tokens — <task summary>
  ├── ...
  └── original-plan.md     (reference)

Execution Order:
  1. /dev-build specs/<plan-name>/shard-1.md
  2. /dev-build specs/<plan-name>/shard-2.md
  ...
  N. /dev-build specs/<plan-name>/shard-N.md

Run shards sequentially. Each must complete before the next.
```

## Error Handling

- If no plans exist in `PLAN_DIRECTORY`: inform user and suggest running `/plan_w_team` first
- If plan file doesn't exist: report error and re-prompt for selection
- If plan has no `## Step by Step Tasks` section: warn that estimation will be rough (skip task classification, use plan-size-only estimate)
- If plan has no `## Relevant Files` section: skip file size measurement, note in report
- If circular dependencies detected: warn user, proceed with best-effort ordering
- If a single task exceeds the shard budget: warn user that the task itself may cause context issues, place it alone in a shard
