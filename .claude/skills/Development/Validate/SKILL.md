---
name: Validate
description: Validate an implementation plan against the current codebase before execution. Checks feasibility, breaking changes, database safety, component impact, dependency graph, test coverage, infrastructure safety, and traceability. USE WHEN validate plan, pre-flight check, feasibility analysis, risk analysis, check plan, safe to build, plan review, breaking changes.
---

# Validate Sub-Skill

Intelligently analyzes implementation plans before execution. Runs a feasibility preflight first, then only the validations that actually apply to the plan's changes. Saves 50-75% of tokens compared to running all checks every time.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Development/Validate/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

**You MUST send this notification BEFORE doing anything else when this skill is invoked.**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the Validate workflow in the Development skill to validate the implementation plan"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **Validate** workflow in the **Development** skill to validate the implementation plan...
   ```

## Model Recommendation

**Recommended model:** `opus` — Validation requires deep reasoning for feasibility analysis, cross-file dependency tracking, and risk assessment across the entire codebase.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| Validate a specific plan file | `Workflows/ValidatePlan.md` |
| Auto-discover and validate most recent plan | `Workflows/ValidatePlan.md` (Plan Discovery Protocol) |

## Pipeline Position

**Comes before:** Build (the build skill executes the validated plan)
**Comes after:** Plan (the plan skill creates the file that gets validated)
**Input:** Plan file from `plans/` or `specs/`
**Output:** Updated plan with Risk Analysis section (only if issues found), or clean validation report

## Directory Search Order

Plans are discovered in this priority order:
1. `plans/` (primary)
2. `specs/`

## Context Files

| File | Purpose | When to Load |
|---|---|---|
| `ValidationTypes.md` | Reference for the 7 conditional validation types and their triggers | During Phase 2 (Smart Analysis) to determine which validations to run |

## Examples

**Example 1: Validate specific plan**
```
User: "Validate plans/add-dark-mode.md"
→ Loads Workflows/ValidatePlan.md
→ Phase 1: Parses plan structure
→ Phase 1.5: Confirms understanding with user
→ Phase 1.6: Runs feasibility preflight
→ Phase 2: Determines required validations (e.g., breaking changes + component impact)
→ Phase 3: Runs targeted validations in parallel
→ Phase 4: Synthesizes results, rewrites risky steps if found
→ Phase 5: Updates plan or reports clean validation
```

**Example 2: Auto-discover latest plan**
```
User: "Validate the plan" (no file specified)
→ Discovers most recent plan from plans/ and specs/
→ Confirms with user which plan to validate
→ Runs full validation pipeline
```

**Example 3: Not-feasible plan handoff**
```
User: "Check if this plan works"
→ Feasibility preflight reveals missing prerequisites
→ Stops validation, reports blockers
→ Hands off to brainstorming for re-planning
```
