---
name: dev-build
description: Execute a written implementation plan or shard with dependency-aware wave scheduling, progress updates in the plan file, targeted verification, and a handoff to testing. Use when the user asks to build, implement a plan, execute plan, run the plan, start coding from a plan, carry out plan, or continue a partially completed plan.
---

# Dev Build

Execute a plan as the source of truth. Prefer safe serialization over risky parallelism.

## Workflow

1. Locate the plan from the provided path or recent plan files under `artifacts/plans/`.
2. Run baseline verification from the plan when available.
3. Parse tasks, dependencies, sequencing notes, and validation commands.
4. Build dependency-aware waves from ready tasks.
5. Execute each wave, update completed checkboxes in the plan, and verify before continuing.
6. Stop on blockers, conflicting edits, failing verification, or inconsistent plan state.

Read `references/execute-plan.md` for the full wave execution workflow and report formats.

## Codex Delegation Rule

Use subagents for wave execution only when the user explicitly asks for delegated or parallel agent work and the session permits it. Otherwise execute tasks locally in dependency order.

## Constraints

- Do not use this for quick one-off edits that do not have a written plan.
- Do not mark tasks complete until the result is reviewed.
- Do not claim success without verification evidence.
- Do not parallelize tasks likely to touch the same files or coupled code paths.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.

## Output

Report waves executed, tasks completed, verification evidence, files modified, and recommended next step, usually `$dev-test`.
