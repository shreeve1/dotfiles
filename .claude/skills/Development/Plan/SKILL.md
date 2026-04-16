---
name: Plan
description: Create a structured implementation plan with phased task breakdown, technical approach, and acceptance criteria from a PRD, requirements description, or user prompt. USE WHEN implementation plan, tech approach, task breakdown, phased roadmap, plan a feature, plan a fix, plan a refactor, create plan, development plan.
---

# Plan Sub-Skill

Creates detailed, actionable implementation plans from requirements, PRDs, or user prompts. Plans are the bridge between ideas and code.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Development/Plan/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

**You MUST send this notification BEFORE doing anything else when this skill is invoked.**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the Plan workflow in the Development skill to create an implementation plan"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **Plan** workflow in the **Development** skill to create an implementation plan...
   ```

## Model Recommendation

**Recommended model:** `opus` — Planning benefits from deep reasoning for architecture decisions, dependency analysis, and edge case identification.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| Create new implementation plan | `Workflows/CreatePlan.md` |

## Pipeline Position

**Comes before:** Validate (the validate skill checks the plan for risks)
**Comes after:** Prd (the plan reads the PRD via Source Document Discovery)
**Output:** `plans/<feature>.md`

## Directory Search Order

Plans and source documents are discovered in this priority order:
1. `plans/` (primary output location)
2. `specs/`
3. `artifacts/plans/`
4. `artifacts/specs/`

## Context Files

This sub-skill does not require separate context files. The workflow contains the plan format inline.

## Examples

**Example 1: From PRD**
```
User: "Create a plan from the recipe app PRD"
→ Discovers artifacts/specs/prd-recipe-app-2026-04-15.md
→ Scans for #req-[id] tags for traceability
→ 10-phase workflow produces plans/feature-recipe-app.md
→ Includes Traceability Map linking #req-* tags to task IDs
```

**Example 2: From free text**
```
User: "Add dark mode to the settings page"
→ No source document found, uses prompt directly
→ Analyzes codebase for existing patterns
→ Outputs plans/feature-dark-mode.md
```

**Example 3: Complex multi-phase**
```
User: "Plan the migration from REST to GraphQL"
→ Explores codebase for all API endpoints
→ Designs phased migration strategy (foundation → core → integration)
→ Includes Testing Strategy and Validation Commands
```
