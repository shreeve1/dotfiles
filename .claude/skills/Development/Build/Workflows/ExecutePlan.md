# ExecutePlan Workflow

Full 10-phase workflow for wave-based parallel plan execution.

**Voice notification:** Already sent by SKILL.md on invocation.

## Variables

- `PATH_TO_PLAN` — Path to a specific plan file, if provided
- `PLAN_DIRECTORIES` — `plans/`, `specs/`

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
- If baseline verification fails before any implementation work starts, treat that as a pre-existing issue
- Report the failing command and the relevant output concisely
- Ask the user whether to stop and investigate, continue despite the dirty baseline, or switch back to planning/validation
- Do not silently proceed past a failing baseline

Report the baseline status clearly before moving on.

---

## Phase 3 — Load Plan Progress

Parse the plan markdown directly for task structure and dependencies.

Use `Read` on the plan file to gather:
- Human-readable task descriptions
- Implementation notes
- Validation commands
- Context

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
- Identify the task IDs in the wave
- Gather each task's exact wording from the plan
- Include relevant plan context for the assigned work
- Include outputs or constraints from earlier completed waves if needed

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
- Stop before launching the next wave
- Do not mark failed tasks complete
- Report which tasks need resolution
- Explain whether the issue is a code failure, merge/conflict problem, missing dependency, or unclear plan step

Only continue when the wave result is coherent.

### Mark progress in the plan file (REQUIRED)

**You MUST update the plan file for every completed task before moving on.** This is not optional.

- Use `Edit` to change `- [ ]` to `- [x]` in the plan markdown file for each completed task
- Parse the plan markdown to determine which tasks become ready after dependencies complete

---

## Phase 8 — Verify Before Claiming Success

Do not report success based only on task execution. Verify the work.

Use validation evidence from the plan where available:
- Commands listed in `## Validation Commands`
- Relevant test commands
- Build, lint, or typecheck commands
- Explicit manual validation steps if automation is unavailable

Prefer targeted verification that matches the completed tasks. For full-plan completion, run the strongest relevant validation available within reasonable scope.

If verification fails:
- Report implementation as completed or partially completed only where supported
- Clearly state that validation failed
- Do not claim the build succeeded

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
- All implementation tasks are complete
- A wave fails
- The plan state becomes inconsistent
- The user interrupts or changes direction

---

## Phase 10 — Decide the Next Workflow Handoff

After implementation tasks are complete and the relevant build-side verification has succeeded, ask the user what they want to do next.

Use `AskUserQuestion` with a focused `select` prompt. The default options should be:
- `Run tests with /dev-test` (recommended when tests haven't been run)
- `Merge and clean up`
- `Keep working on this branch`

Decision rules:
- If testing has not yet been run at the level implied by the plan, recommend `Run tests with /dev-test`
- If the user explicitly asked for build-only work and verification is already sufficient, offer merge more neutrally
- If validation or verification failed, do not offer merge as the recommended path

If the user chooses testing:
- Clearly report the plan path that `/dev-test` should use
- State that testing should happen before merge

If the user chooses merge:
- Merge via normal git workflow (`git merge`, `git push`, branch cleanup)

If the user chooses to keep working:
- Report that the current branch remains the workspace for further edits and testing

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
