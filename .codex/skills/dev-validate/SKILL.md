---
name: dev-validate
description: Validate an implementation plan against the current codebase before execution, including feasibility, baseline command provenance, breaking changes, database safety, component impact, dependency graph, test coverage, infrastructure safety, and traceability. Use when the user asks to validate a plan, preflight a plan, check feasibility, assess risk, review whether a plan is safe to build, or find breaking changes before implementation.
---

# Dev Validate

Validate a written plan before execution. This is analysis and plan improvement, not implementation.

## Workflow

1. Select and parse the plan.
2. Confirm intent only when the plan goal or target behavior is ambiguous.
3. Run a direct feasibility preflight against the current repo.
4. Check validation commands for referenced files that do not exist.
5. Select only relevant validation categories.
6. Synthesize risks and update the plan only if issues are found.

Read `references/validate-plan.md` for the full workflow. Read `references/validation-types.md` during validation category selection.

## Constraints

- Do not execute implementation tasks.
- Do not modify the plan when validation is clean.
- Stop and recommend replanning when the plan is not feasible as written.
- Preserve existing checkbox state when rewriting risky plan steps.
- Use subagents only when the user explicitly asks for delegated or parallel validation and the session permits it.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.

## Output

Report feasibility, validations run and skipped, baseline provenance, critical issues, warnings, and whether the plan was modified.
