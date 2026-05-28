---
name: dev-build
description: Execute an implementation plan with parallel wave-based execution. Use AFTER /dev-plan when ready to build. USE WHEN user says 'implement the plan', 'build this', 'execute the plan', 'start coding', or wants to begin implementation from a plan file. Runs validation and connects to /dev-test.
---

# Execute Implementation Plan

Use this skill when the user wants to carry out a written implementation plan, especially when the work includes dependencies, multiple task groups, or opportunities for safe parallel execution. Treat the plan system as the source of truth for task readiness and progress, and only parallelize work that is genuinely independent. Do not use this skill for quick one-off edits, simple fixes, or work that does not have a written plan.

---

## Variables

- `PATH_TO_PLAN` - path to a specific plan file, if provided
- `PLAN_DIRECTORIES` - `plans/`, `specs/`

---

## Workflow Overview

Work through these steps in order:

1. Discover and confirm the plan
2. Establish the execution workspace (skip branch creation — CC does not create feature branches)
3. Load plan state and task readiness
4. Build a safe wave schedule
5. Execute one wave at a time
6. Evaluate results and mark completed tasks in the plan file
7. Verify results before claiming success
8. Decide the next workflow handoff
9. Report the final build status

The goal is not maximum parallelism. The goal is safe, dependency-aware progress followed by an explicit decision about testing or merge.

---

## Phase 1 — Discover the Plan

If the user provided a specific plan path, use it as `PATH_TO_PLAN`.

If no plan path was provided:

1. Use `Bash` to find recent markdown files in `plans/` and `specs/`
2. If one clear candidate exists, confirm it with `AskUserQuestion`
3. If several likely candidates exist, present the most relevant 1-3 options with `AskUserQuestion`
4. If no plan is found, ask the user to provide a path

Once confirmed, use `Read` to inspect the selected plan for context.

---

## Phase 2 — Establish the Execution Workspace

**SKIP branch creation.** CC does not create feature branches. Work in the current workspace.

### Baseline verification

Before starting implementation:
- Prefer validation commands from the plan's `Validation Commands` section
- Before running each baseline command, verify referenced test/file paths exist in the current workspace
- If a referenced path is missing, report it clearly before declaring baseline failure

Baseline failure policy:
- if baseline verification fails before any implementation work starts, treat that as a pre-existing issue
- report the failing command and the relevant output concisely
- ask the user whether to stop and investigate, continue despite the dirty baseline, or switch back to planning/validation
- do not silently proceed past a failing baseline

Report the baseline status clearly before moving on.

---

## Phase 3 — Load Plan Progress

Parse the plan markdown directly for task structure and dependencies.

Use `Read` on the plan file to gather:
- human-readable task descriptions
- implementation notes
- validation commands
- context

---

## Phase 4 — Build the Wave Schedule

Create waves from the currently ready tasks, then rebuild the schedule after each wave completes.

### Scheduling rules

Apply these rules in priority order:

1. **Plan dependencies come first**
   Only schedule tasks whose dependencies have been marked complete in the plan markdown.

2. **Honor explicit sequencing**
   If the plan marks tasks as sequential, keep them out of parallel execution.

3. **Do not parallelize overlapping work**
   Tasks that modify the same files, the same subsystem, or tightly coupled code paths should not run in parallel. Put them in separate waves or assign them to one task.

4. **Prefer independence over throughput**
   Parallelize only tasks that are likely to succeed without stepping on each other.

5. **Keep waves understandable**
   A smaller safe wave is better than a large conflicted wave.

For each wave, write a brief summary like:

```text
Wave 1: [1.1], [1.2]
Reason: both tasks are ready and modify separate areas

Wave 2: [2.1]
Reason: depends on Wave 1 outputs and touches shared backend files
```

---

## Phase 5 — Prepare Execution Context

Before launching a wave:
- identify the task IDs in the wave
- gather each task's exact wording from the plan
- include relevant plan context for the assigned work
- include outputs or constraints from earlier completed waves if needed

---

## Phase 6 — Execute the Wave

Use `TaskCreate` for each task in the wave, then spawn builder agents in parallel.

Use parallel tasks only when the wave contains truly independent tasks. Otherwise, use a single task or run tasks sequentially.

### Parallel execution

For independent tasks, use `Task` tool with parallel tasks. **Inline the full task description and relevant context into each builder prompt** — do not just tell the builder to "read the plan." The orchestrator already has this context; passing it directly saves tokens and prevents builders from misidentifying their task.

Builder prompt structure:

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

When finished, report using this format:
Status: complete | partial | blocked
Files changed:
- <path> - <what changed>
- <path> - <what changed>
Key decisions:
- <any non-obvious choice you made>
Blockers:
- <anything preventing completion, or "none">
```

### Sequential execution

If tasks are tightly coupled, overlapping, or too small to benefit from parallelism, execute them in one task or handle them directly.

---

## Phase 7 — Evaluate Wave Results and Mark Progress

After a wave completes:

1. Review each builder result
2. Confirm whether each assigned task was actually completed
3. Note files changed and any cross-task conflicts

If any task failed or produced conflicting work:
- stop before launching the next wave
- do not mark failed tasks complete
- report which tasks need resolution
- explain whether the issue is a code failure, merge/conflict problem, missing dependency, or unclear plan step

Only continue when the wave result is coherent.

### Mark progress in the plan file (REQUIRED)

**You MUST update the plan file for every completed task before moving on.** This is not optional.

- Use `Edit` to change `- [ ]` to `- [x]` in the plan markdown file for each completed task
- Parse the plan markdown to determine which tasks become ready after dependencies complete

---

## Phase 8 — Verify Before Claiming Success

Do not report success based only on task execution. Verify the work.

Use validation evidence from the plan where available:
- commands listed in `## Validation Commands`
- relevant test commands
- build, lint, or typecheck commands
- explicit manual validation steps if automation is unavailable

Prefer targeted verification that matches the completed tasks. For full-plan completion, run the strongest relevant validation available within reasonable scope.

If verification fails:
- report implementation as completed or partially completed only where supported
- clearly state that validation failed
- do not claim the build succeeded

If the plan does not define validation commands, say so explicitly and provide the best available verification you performed.

---

## Phase 9 — Continue Wave-by-Wave

Repeat:
1. Parse the plan markdown to determine next ready tasks
2. Build the next safe wave from ready tasks (Phase 4)
3. Prepare builder prompts with inlined task content (Phase 5)
4. Execute the wave (Phase 6)
5. Evaluate results using the structured builder reports (Phase 7)
6. **Mark progress in the plan file** — use `Edit` to update checkboxes. This is required every loop iteration, not just at the end.
7. Verify as appropriate (Phase 8)

Stop when:
- all implementation tasks are complete
- a wave fails
- the plan state becomes inconsistent
- the user interrupts or changes direction

---

## Phase 10 — Decide the Next Workflow Handoff

After implementation tasks are complete and the relevant build-side verification has succeeded, ask the user what they want to do next.

Use `AskUserQuestion` with a focused `select` prompt. The default options should be:
- `Run tests with /dev-test` (recommended when tests haven't been run)
- `Merge and clean up`
- `Keep working on this branch`

Decision rules:
- if testing has not yet been run at the level implied by the plan, recommend `Run tests with /dev-test`
- if the user explicitly asked for build-only work and verification is already sufficient, offer merge more neutrally
- if validation or verification failed, do not offer merge as the recommended path

If the user chooses testing:
- clearly report the plan path that `/dev-test` should use
- state that testing should happen before merge

If the user chooses merge:
- merge via normal git workflow (`git merge`, `git push`, branch cleanup)

If the user chooses to keep working:
- report that the current branch remains the workspace for further edits and testing

---

## Report

### Success report

When implementation and verification succeed, report:

```text
## Build Complete

Plan: <plan name>
File: <PATH_TO_PLAN>

Execution Summary:
- Waves executed: <N>
- Tasks completed: <M>
- Tasks failed: 0

Verification:
- <command/result>
- <command/result>

Next Step Decision:
- Selected: <run tests | merge | keep working>
- Recommendation: <brief reason>

Files Modified:
- <file path 1>
- <file path 2>

Status: Success
```

### Partial or failed report

If execution or verification fails, report:

```text
## Build Stopped

Plan: <plan name>
File: <PATH_TO_PLAN>

Stopped at:
- Wave: <N>
- Tasks: <task IDs>

Reason:
- <failure, blocker, or validation issue>

Completed So Far:
- <completed task IDs>

Next Steps:
- <what needs to be fixed, clarified, or rerun>

Status: Not complete
```

---

## Execution Notes

- Prefer safe serialization over risky parallelism
- Do not run tasks in parallel when they are likely to edit the same files
- Do not mark progress until results are reviewed
- Do not claim success without verification evidence
- Plan files can have any name in `plans/` or `specs/` — there is no requirement for a file named `plan.md`
