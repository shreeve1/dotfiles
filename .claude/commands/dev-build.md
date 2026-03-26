---
name: dev-build
description: Execute an implementation plan with parallel wave-based execution. Use AFTER /dev-plan when ready to build. Triggers on 'implement the plan', 'build this', 'execute the plan', 'start coding', or when user wants to begin implementation from a plan file. Runs validation and connects to /dev-test.
argument-hint: [path-to-plan]
model: opus
---

# Build

Follow the `Workflow` to implement the `PATH_TO_PLAN` then `Report` the completed work.

## Variables

PATH_TO_PLAN: $ARGUMENTS — (Optional) Path to specific plan file. If omitted, auto-discovers the most recent plan.
PLAN_DIRECTORIES: `specs/`, `artifacts/plans/`

## Checklist
You MUST create a task for each of these items and complete them in order:
1. **Discover plan** — locate plan file via argument or auto-discovery, confirm with user
2. **Analyze dependencies** — parse task groups and phases, build ordered wave plan
3. **Execute waves** — spawn parallel builder sub-agents per wave; collect summaries between waves
4. **Update plan file** — mark all checkboxes and Progress section after all waves complete successfully
5. **Report completion** — present the ## Report section of the completed plan

## Workflow

### Pre-flight Check

Before starting, verify the plan isn't already complete:
1. Read the plan file at `PATH_TO_PLAN`
2. Check the `## Progress` section
3. If `Build:` is already `complete`, stop and inform the user:
   ```
   ⚠️ Plan Already Built

   The plan at <PATH_TO_PLAN> shows Build: complete.
   - To re-run implementation, manually reset Progress section to `pending`
   - To run tests, use `/dev-test <PATH_TO_PLAN>`
   ```

### Plan Discovery
If `PATH_TO_PLAN` is provided, use it directly.
If no `PATH_TO_PLAN` is provided:
1. List all `.md` files in both `PLAN_DIRECTORIES` (`specs/` and `artifacts/plans/`), sorted by modification date (most recent first)
2. Take the most recent file
3. Use `AskUserQuestion` to confirm: "Found plan: <filename>. Is this the correct plan?"
   - Options: "Yes, use this plan" / "No, let me specify"
4. If user says no, ask them to provide the path
5. Read the confirmed plan file and use it as PATH_TO_PLAN for all subsequent steps

### Implementation

> **Note:** Plans include "Execute every step in order" for single-agent use. `/dev-build` overrides this with wave-based parallel execution where dependencies permit.

#### Step 1 — Parse plan structure

Read the full plan at `PATH_TO_PLAN`. Extract:
- `## Implementation Phases` (Phase 1 / 2 / 3), if present
- All `### N. Task Group Name` headers from `## Step by Step Tasks`, in document order
- `## Relevant Files` section
- Any `[parallel-safe]` or `[sequential]` annotations on task group headers

#### Step 2 — Build wave plan

Assign each task group to a numbered wave using these signals (priority order):

1. **Phase boundaries (strongest):** If `## Implementation Phases` exists, all task groups associated with Phase 1 run before Phase 2, Phase 2 before Phase 3. Within a phase, proceed to signals 2–5.

2. **Explicit annotations (override heuristics):**
   - `[parallel-safe]` on a header → group runs concurrently with all other `[parallel-safe]` groups in the same phase, even if they share files
   - `[sequential]` on a header → group runs alone in its own wave

3. **Dependency language:** Scan each group's header and bullet text for: *"after", "once", "requires", "depends on", "following"*, or explicit group number references (e.g., "using the module from step 2"). If group N references group M, place N in a later wave than M.

4. **File overlap:** Scan task group descriptions for explicit filenames or module names. If two groups share a named artifact and neither is `[parallel-safe]`, place them in **separate sequential waves** to avoid concurrent write conflicts.

5. **Default:** Groups with no signals are placed together in the same wave and run in parallel.

Log the wave plan before executing:
```
Wave Plan:
  Wave 1 (parallel): groups 1, 3
  Wave 2 (parallel): groups 2, 4
  Wave 3 (sequential): group 5
```

#### Step 3 — Execute waves

For each wave:

1. Use `TaskCreate` to create one task per task group in the wave.

2. **Spawn one `builder` sub-agent per task group in a single message** (so they launch in parallel). Each builder receives a self-contained prompt:

```
You are implementing part of a larger plan.

Plan file: <PATH_TO_PLAN>
Working directory: <absolute cwd>

Your assigned task groups: ### N. and ### M.
Your task IDs: [N.1], [N.2], [M.1], [M.2]

<if prior waves ran>
Prior waves built:
- <summary of files/modules created by prior waves>
</if>

Instructions:
1. Read the full plan at the path above for context, architecture, and Relevant Files
2. Implement ONLY the task groups assigned to you
3. Do not implement task groups outside your assignment
4. Use TaskUpdate to mark your task as completed when finished
5. Report all files created or modified
```

3. Wait for all builders in the wave to complete (monitor via `TaskList`).

4. **Collect wave summary:** from each builder's report, extract files changed. Compose a one-line-per-file summary for use by subsequent waves.

5. **Failure check:** If any builder fails or reports incomplete work:
   - Stop immediately — do not launch the next wave
   - Do NOT update plan file checkboxes or Progress section
   - Report: which wave failed, which task groups were involved, builder's error message
   - Suggest: `Fix the issue and re-run /dev-build PATH_TO_PLAN`
   - Halt

### Update Plan File (After Successful Implementation)

Run this section only after ALL waves complete successfully (every builder in every wave reported completion).

#### Run Validation Commands

Before marking complete, run the plan's `## Validation Commands`:
1. Read the `## Validation Commands` section from the plan
2. Execute each command in sequence
3. If any validation fails:
   - Stop and report the failure
   - Do NOT update checkboxes or Progress section
   - Suggest: `Fix the validation issue and re-run /dev-build PATH_TO_PLAN`
4. If all validations pass, proceed to update the plan file

#### Update Plan File

After ALL implementation tasks are complete successfully AND validation commands pass (all-or-nothing approach):

1. **Mark implementation checkboxes complete:**
   - Read the plan file at `PATH_TO_PLAN`
   - Find all checkboxes in the `## Step by Step Tasks` section with pattern: `- [ ] [N.M]`
   - Replace `- [ ]` with `- [x]` for ALL implementation tasks
   - Do NOT modify the `## Tests` section checkboxes (those are owned by `/dev-test`)

2. **Update Progress section:**
   - Find the `## Progress` section
   - Update `Build:` from `pending` to `complete`
   - Update `Implementation:` count from `0/N` to `N/N` (where N is total task count)
   - Update `Last Updated:` to current ISO timestamp with `by /dev-build`
   - Example: `2024-01-15T10:30:00Z by /dev-build`

3. **Write the updated plan file**

If implementation fails or is incomplete, do NOT update checkboxes or Progress section.

## Report

Present the `## Report` section of the plan, then add:

```
✅ Build Complete

Files Modified:
- <list of files created/modified by builders>

Validation: All validation commands passed.

Next Steps:
Run `/dev-test <PATH_TO_PLAN>` to validate against the Testing Promise.
```
