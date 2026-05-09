---
name: Shard
description: Analyze plan token budget and split into ordered shards if the plan exceeds a single build session. USE WHEN shard, token budget, split plan, context window limit, plan too large, estimate tokens, shard plan, break up plan.
---

# Shard

Analyze an implementation plan to estimate whether it can be executed within a single ~150k token build session. If the plan exceeds the budget, split it into an ordered chain of self-contained shards that can be built sequentially.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Development/Shard/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## Model Recommendation

**Recommended model:** Opus — token estimation requires careful analysis of plan structure, file sizes, and dependency graphs. The sharding algorithm involves multi-step reasoning that benefits from higher capability.

## Workflow Routing

| Scenario | Route To |
|---|---|
| Estimate token budget for a plan | `Workflows/AnalyzeAndShard.md` |
| Split an oversized plan into shards | `Workflows/AnalyzeAndShard.md` (same workflow, enters sharding phase when budget exceeded) |

This sub-skill has a single workflow that covers both estimation and sharding.

## Pipeline Position

**Comes after:** `/dev-plan`
**Comes before:** `/dev-build`

```
/dev-plan → /dev-shard → /dev-build
```

Shard is only needed when a plan is suspected to exceed a single build session. If the plan fits within budget, the workflow reports success and the plan proceeds directly to Build.

## Context Files

| File | Purpose |
|------|---------|
| `TokenHeuristic.md` | Token estimation formula reference with classification tables and calculation rules |

## Variables

- `PLAN_FILE` — (Optional) Path to the plan file. If omitted, shows interactive list of recent plans.
- `PLAN_DIRECTORIES` — `plans/`, `specs/`
- `TOKEN_BUDGET` — `150000`
- `SHARD_OVERHEAD` — `20000`

## Examples

**Example 1: Direct path**
```
User: "Shard the plan at plans/add-auth.md"
→ Loads plan, estimates tokens, either reports budget fit or creates shard directory
→ Output: specs/add-auth/shard-1.md, shard-2.md, README.md
```

**Example 2: Interactive selection**
```
User: "Is this plan going to fit in one session?"
→ Lists recent plans in plans/ and specs/
→ User selects plan
→ Estimates and reports token breakdown
→ If over budget: creates shards automatically
```

**Example 3: Fits in one session**
```
User: "/dev-shard specs/add-dark-mode.md"
→ Estimates total at 95k tokens (under 150k budget)
→ Reports: "Fits in single session"
→ No files created, user proceeds to /dev-build directly
```

## Constraints

- **ANALYSIS ONLY**: Do NOT build, write code, or deploy agents. Output is either an estimation report OR a set of shard plan files.
- Never split a task from its unresolved dependencies.
- Each shard must be a complete, standalone plan that `/dev-build` can execute without external context beyond the shard file itself.
- Err on the side of overestimating (shard unnecessarily rather than hit context limits mid-build).
