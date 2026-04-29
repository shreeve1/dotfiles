---
name: dev-build
description: Execute a written implementation plan or shard with dependency-aware wave scheduling, an automatic claude -p audit at each wave boundary (auto-fix-and-retry on Critical findings, default ON), progress updates in the plan file, targeted verification, and a handoff to testing. Use when the user asks to build, implement a plan, execute plan, run the plan, start coding from a plan, carry out plan, or continue a partially completed plan.
---

# Dev Build

Execute a plan as the source of truth. Prefer safe serialization over risky parallelism.

After each wave's tasks complete, a quick `claude -p` audit reviews the wave's diff for bugs, missed edge cases, and pattern violations. Critical findings trigger one auto-fix-and-retry attempt before escalating to the user; Warning/Note findings are logged. Default ON; opt out with `--no-audit` for trivial work or when Claude isn't available.

## Invocation

| Form | Behavior |
|------|----------|
| `$dev-build <plan>` | Default — wave-end claude -p audit on, critical-only auto-fix-and-retry |
| `$dev-build <plan> --audit-mode=all` | Surface Warnings inline in build output (still auto-fix only on Critical) |
| `$dev-build <plan> --no-audit` | Skip wave-end audits entirely; build runs without cross-model review |

## Workflow

1. Locate the plan from the provided path or recent plan files under `artifacts/plans/`.
2. Run baseline verification from the plan when available.
3. Parse tasks, dependencies, sequencing notes, and validation commands.
4. Build dependency-aware waves from ready tasks.
5. Execute each wave, update completed checkboxes in the plan, run the wave-end claude -p audit (Phase 7.5), and verify before continuing.
6. Stop on blockers, conflicting edits, failing verification, persistent Critical audit findings, or inconsistent plan state.

Read `references/execute-plan.md` for the full wave execution workflow, the wave-end audit (Phase 7.5) including the bare-mode probe + non-bare fallback contract reused from `dev-review/references/deep-review.md`, the severity-tagged finding format, the auto-fix-and-retry contract, and report formats.

## Codex Delegation Rule

Use subagents for wave execution only when the user explicitly asks for delegated or parallel agent work and the session permits it. Otherwise execute tasks locally in dependency order.

## Constraints

- Do not use this for quick one-off edits that do not have a written plan.
- Do not mark tasks complete until the result is reviewed.
- Do not claim success without verification evidence.
- Do not parallelize tasks likely to touch the same files or coupled code paths.
- Do not skip the wave-end audit unless `--no-audit` was explicitly passed or Claude is genuinely unavailable.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.

- Plan: `artifacts/plans/<slug>/plan.md`
- Plan state (extended with `build_audits:` after each wave): `artifacts/plans/<slug>/state.yml`

## Output

Report waves executed, tasks completed, audit outcomes per wave (passed / auto_fixed / escalated / skipped), verification evidence, files modified, and recommended next step, usually `$dev-test`.
