---
name: Build
description: Execute an implementation plan with parallel wave-based execution and an automatic Codex audit at each wave boundary (auto-fix-and-retry on Critical findings, default ON). USE WHEN build, execute plan, implement, start coding, wave execution, run the plan, build this, implement the plan, carry out plan, code the plan.
---

# Build

Execute an implementation plan using dependency-aware wave-based parallel execution. Treat the plan as the source of truth for task readiness and progress. Only parallelize work that is genuinely independent. The goal is not maximum parallelism — it is safe, dependency-aware progress followed by an explicit decision about testing or merge.

After each wave's tasks complete, a quick Codex audit reviews the wave's diff for bugs, missed edge cases, and pattern violations. Critical findings trigger one auto-fix-and-retry attempt before escalating to the user; Warning/Note findings are logged. Default ON; opt out with `--no-audit` for trivial work or when Codex isn't available.

## Invocation

| Form | Behavior |
|------|----------|
| `/dev-build <plan>` | Default — wave-end Codex audit on, critical-only auto-fix-and-retry |
| `/dev-build <plan> --audit-mode=critical-only` | Explicit form of the default; only Critical findings act, Warning/Note logged silently |
| `/dev-build <plan> --audit-mode=all` | Surface Warnings inline in build output (still auto-fix only on Critical) |
| `/dev-build <plan> --audit-mode=off` | Skip audit entirely (equivalent to `--no-audit`) |
| `/dev-build <plan> --no-audit` | Shorthand for `--audit-mode=off`; skip wave-end audits entirely |

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Development/Build/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

**You MUST send this notification BEFORE doing anything else when this skill is invoked.**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the Build skill to execute the implementation plan", "voice_id": "fTtv3eikoepIosk8dTZ5", "voice_enabled": true}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **Build** skill to execute the implementation plan...
   ```

**Full documentation:** `~/.claude/PAI/THENOTIFICATIONSYSTEM.md`

## Model Recommendation

**Recommended model:** Sonnet — build execution benefits from speed for wave-based parallel task spawning. Reserve Opus for complex architectural decisions within tasks.

## Workflow Routing

| Scenario | Route To |
|---|---|
| Execute a plan from start to finish | `Workflows/ExecutePlan.md` |
| Continue a partially-completed plan | `Workflows/ExecutePlan.md` (resumes from current progress) |
| Execute a single shard | `Workflows/ExecutePlan.md` (standard plan execution) |

This sub-skill has a single workflow covering all build scenarios.

## Pipeline Position

**Comes after:** `/dev-plan` (always) or `/dev-shard` (if plan was too large)
**Comes before:** `/dev-test`

```
/dev-plan → /dev-shard (if needed) → /dev-build → /dev-test
```

Minimum viable flow:
```
/dev-plan → /dev-build → /dev-test
```

## Context Files

No additional context files. The workflow is self-contained with the plan file as input.

## Variables

- `PATH_TO_PLAN` — Path to a specific plan file, if provided
- `PLAN_DIRECTORIES` — `plans/`, `specs/`

## Examples

**Example 1: Execute from plan path**
```
User: "Build the plan at plans/add-auth.md"
→ Loads plan, builds wave schedule from dependencies
→ Executes waves with parallel task spawning where safe
→ Marks progress in plan file, hands off to /dev-test
```

**Example 2: Interactive plan selection**
```
User: "Let's build"
→ Lists recent plans in plans/ and specs/
→ User selects plan
→ Baseline verification, then wave execution begins
```

**Example 3: Execute a shard**
```
User: "/dev-build specs/add-auth/shard-2.md"
→ Loads shard plan (includes Shard Context from shard-1)
→ Executes shard's tasks, verifies, reports completion
→ User runs /dev-build on shard-3 next
```

## Constraints

- Prefer safe serialization over risky parallelism
- Do not run tasks in parallel when they are likely to edit the same files
- Do not mark progress until results are reviewed
- Do not claim success without verification evidence
- Plan files can have any name in `plans/` or `specs/` — there is no requirement for a file named `plan.md`
- Do not use this skill for quick one-off edits, simple fixes, or work that does not have a written plan
