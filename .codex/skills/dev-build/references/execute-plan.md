# ExecutePlan Workflow


## Contents

- [Variables](#variables)
- [Phase 1 — Discover the Plan](#phase-1-discover-the-plan)
- [Phase 2 — Establish the Execution Workspace](#phase-2-establish-the-execution-workspace)
  - [Baseline verification](#baseline-verification)
- [Phase 3 — Load Plan Progress](#phase-3-load-plan-progress)
- [Phase 4 — Build the Wave Schedule](#phase-4-build-the-wave-schedule)
  - [Scheduling rules](#scheduling-rules)
- [Phase 5 — Prepare Execution Context](#phase-5-prepare-execution-context)
- [Phase 6 — Execute the Wave](#phase-6-execute-the-wave)
  - [Parallel execution](#parallel-execution)
  - [Sequential execution](#sequential-execution)
- [Phase 7 — Evaluate Wave Results and Mark Progress](#phase-7-evaluate-wave-results-and-mark-progress)
  - [Mark progress in the plan file (REQUIRED)](#mark-progress-in-the-plan-file-required)
- [Phase 8 — Verify Before Claiming Success](#phase-8-verify-before-claiming-success)
- [Phase 9 — Continue Wave-by-Wave](#phase-9-continue-wave-by-wave)
- [Phase 10 — Decide the Next Workflow Handoff](#phase-10-decide-the-next-workflow-handoff)
- [Report](#report)
  - [Success report](#success-report)
  - [Partial or failed report](#partial-or-failed-report)
- [Execution Notes](#execution-notes)

Full 10-phase workflow for wave-based parallel plan execution.
## Variables

- `PATH_TO_PLAN` — Path to a specific plan file, if provided
- `PLAN_DIRECTORIES` — `artifacts/plans/`

---

## Phase 1 — Discover the Plan

If the user provided a specific plan path, use it as `PATH_TO_PLAN`.

If no plan path was provided:

1. Use `shell` to find recent plan files under `artifacts/plans/`
2. If one clear candidate exists, confirm it with `ask the user`
3. If several likely candidates exist, present the most relevant 1-3 options with `ask the user`
4. If no plan is found, ask the user to provide a path

Once confirmed, use `read` to inspect the selected plan for context.

---

## Phase 2 — Establish the Execution Workspace

**SKIP branch creation.** Codex should not create feature branches unless the user asks. Work in the current workspace.

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

Use `read` on the plan file to gather:
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

Execute each task in the wave. Use subagents only when the user explicitly asked for delegated or parallel agent work and the current session supports it.

Use parallel execution only when the wave contains truly independent tasks. Otherwise, use a single task or run tasks sequentially.

### Parallel execution

For independent tasks, if delegation is explicitly requested and available, use subagents in parallel. **Inline the full task description and relevant context into each builder prompt** — do not just tell the builder to "read the plan." The orchestrator already has this context; passing it directly saves tokens and prevents builders from misidentifying their task.

If delegation is not explicitly requested or is unavailable, execute the same wave locally while preserving the dependency and verification rules.

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
1. read the full plan at the path above for context, architecture, and Relevant Files
2. Implement ONLY the task groups assigned to you
3. Do not implement task groups outside your assignment
4. Use update task progress to mark your task as completed when finished
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

- Modify `- [ ]` to `- [x]` in the plan markdown file for each completed task
- Parse the plan markdown to determine which tasks become ready after dependencies complete

---

## Phase 7.5 — Claude Wave-End Audit (default ON)

After a wave's tasks are marked complete and BEFORE moving to the next wave, run a focused `claude -p` audit on the diff this wave produced. The audit catches bugs, missed edge cases, and pattern violations introduced by the wave's work — at the natural boundary where issues are still cheap to fix.

This phase reuses the bare-mode probe + non-bare fallback contract documented in `~/.codex/skills/dev-review/references/deep-review.md` Phase 4. Don't reinvent the shell-out — reuse it.

**Skip this phase entirely when:**
- `AUDIT_MODE=off` (user passed `--no-audit`).
- The completed wave contains zero code-changing tasks (only doc/config edits with no executable surface). Determine this by inspecting `git diff` for the wave's file scope: if all changed files match `*.md|*.txt|*.rst` or are pure additions to ignored paths, skip.
- Claude is unavailable: `which claude` returns nothing, or both bounded auth probes (bare and non-bare per `dev-review` Step 12) fail. Log `audit_skipped: claude_unavailable` to the wave's audit entry and continue.

### 7.5.1 — Capture the wave's diff

Compute the diff for files this wave touched. The simplest reliable method:

```bash
git diff <wave_start_ref>..HEAD -- <files_touched_by_wave>
```

If the build is on a fresh branch with `<wave_start_ref>` recorded at Phase 5, use that. Otherwise compare against the previous wave's HEAD. Save the diff to `/tmp/build_wave_<N>_diff.patch` for Claude to read.

### 7.5.2 — Auth probe (run once before first wave audit)

Reuse `dev-review/references/deep-review.md` Phase 4 Step 12 verbatim. Persist the resolved `CLAUDE_MODE_ARGS` in the build state YAML so subsequent wave audits don't re-probe.

If both probes fail, treat as unavailable per the skip clause above.

### 7.5.3 — Invoke Claude (quick check, fresh invocation per wave)

Each wave's audit is independent — no cross-wave session continuity needed. Use a fresh `claude -p` invocation per wave with the diff piped via the prompt file:

```bash
timeout 180s claude $CLAUDE_MODE_ARGS -p \
  --model opus \
  --effort medium \
  --no-session-persistence \
  --output-format text \
  --permission-mode dontAsk \
  --tools "" < /tmp/build_wave_<N>_audit_prompt.txt \
  > /tmp/build_wave_<N>_audit_out.txt 2>&1
```

Note `--effort medium` (not `high`) — wave audits are scoped to a focused diff and don't need the deeper reasoning the plan-time loop uses. Faster and cheaper.

If Claude needs to read additional repo files beyond what the prompt contains (rare for diff audits), enable read-only tools as a second attempt — same escalation path as `dev-review` Step 14:

```bash
timeout 180s claude $CLAUDE_MODE_ARGS -p \
  --model opus \
  --effort medium \
  --no-session-persistence \
  --output-format text \
  --permission-mode dontAsk \
  --tools "Read,Grep,Glob,Bash(git status *),Bash(git diff *)" \
  --disallowedTools "Edit,Write,MultiEdit,NotebookEdit,Bash(git reset *),Bash(git checkout *),Bash(rm *)" \
  --add-dir "$PWD" < /tmp/build_wave_<N>_audit_prompt.txt
```

### 7.5.4 — Claude prompt template (quick check)

This prompt is intentionally narrow — diff-only review, no codebase-wide tangents:

```
Review the diff at /tmp/build_wave_<N>_diff.patch as a quick sanity check.
The diff implements these plan tasks:
  <list of [N.M] task IDs from the wave with their one-line task description>

Look ONLY at this diff for: real bugs, missed edge cases that the plan called
out, broken patterns vs the rest of the file, obvious test gaps for the
changed code paths. Do NOT make codebase-wide architectural recommendations.
Do NOT suggest improvements that aren't bugs. Be terse.

Output every finding with a severity tag in this exact format:

[CRITICAL] <one-line summary>
  Detail: <evidence — cite file:line>
  Suggested fix: <concrete recommendation>

[WARNING] <one-line summary>
  Detail: ...
  Suggested fix: ...

[NOTE] <one-line summary>
  Detail: ...

Severity definitions:
  CRITICAL = bug that will produce wrong behavior or crash
  WARNING  = significant gap or pattern violation, should fix soon
  NOTE     = minor concern, optional

If the diff is clean, output exactly: "[NOTE] No findings — diff looks correct."
After all findings, on a final line, print exactly: "END_OF_FINDINGS"
```

### 7.5.5 — Parse findings and append to state

Extract findings from the output. Append to `artifacts/plans/<slug>/state.yml` under a new `build_audits:` section keyed by wave number:

```yaml
build_audits:
  - wave: 1
    started: "2026-04-29T16:00:00Z"
    files_audited: ["src/foo.py", "tests/test_foo.py"]
    claude_mode_args: "--bare"      # set once in 7.5.2, reused by all waves
    findings:
      critical: ["[CRITICAL] <verbatim>"]
      warning: ["[WARNING] <verbatim>"]
      note: ["[NOTE] <verbatim>"]
    counts: { critical: 0, warning: 1, note: 0 }
    outcome: passed | auto_fixed | escalated_to_user | audit_skipped
    retry_attempts: 0  # incremented by 7.5.6 auto-fix path
```

### 7.5.6 — Handle findings (auto-fix-and-retry)

Per audit-mode:

| Severity | `critical-only` (default) | `all` | `off` |
|----------|--------------------------|-------|-------|
| Critical | Auto-fix-and-retry | Auto-fix-and-retry | n/a — phase skipped |
| Warning  | Logged silently | Surfaced in build output, build continues | n/a |
| Note     | Logged silently | Logged silently | n/a |

**Auto-fix-and-retry contract for Critical findings:**

1. **Read** each Critical finding's Detail and Suggested fix.
2. **Patch** the affected files. Constrain edits to ONLY files cited in the finding's `Detail` line — no opportunistic refactors.
3. **Re-run the wave's relevant validation:** the test commands or validation commands that cover the changed code. Use the plan's `## Validation Commands` filtered to this wave's scope, or the affected `tests/` files via the project's test runner.
4. **If validation passes:** mark the audit entry's `outcome: auto_fixed`, increment `retry_attempts`, append a `fix_summary` field describing what changed, and proceed to Phase 8.
5. **If validation fails OR if `retry_attempts >= 1` already (one retry max):** escalate. Mark `outcome: escalated_to_user`. Halt the build. Present findings + attempted fixes via `ask the user` with options:
   - "I'll fix it manually — pause build" (build halts, user resolves, user re-invokes `$dev-build` to resume from this wave)
   - "Override and continue" (mark `outcome: overridden`, proceed to Phase 8)
   - "Abort build" (mark plan as failed, exit)

**Hard limit: one auto-fix attempt per wave.** No infinite loops. Second Critical → user always.

### 7.5.7 — Surface findings to build output

Independent of severity handling, emit a one-line summary to the build's progress output so the user sees audit activity:

```
Wave <N> audit: 0 critical / 1 warning / 0 note (outcome: passed)
```

For `--audit-mode=all`, expand Warnings into a brief per-finding line under that summary.

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
6. **Mark progress in the plan file** — modify checkboxes. This is required every loop iteration, not just at the end.
7. **Run wave-end Claude audit** (Phase 7.5) — auto-fix-and-retry on Critical, log otherwise. Skip if `--no-audit` or zero code-changing tasks in the wave.
8. Verify as appropriate (Phase 8)

Stop when:
- All implementation tasks are complete
- A wave fails
- The plan state becomes inconsistent
- The user interrupts or changes direction

---

## Phase 10 — Decide the Next Workflow Handoff

After implementation tasks are complete and the relevant build-side verification has succeeded, ask the user what they want to do next.

Use `ask the user` with a focused `select` prompt. The default options should be:
- `Run tests with $dev-test` (recommended when tests haven't been run)
- `Merge and clean up`
- `Keep working on this branch`

Decision rules:
- If testing has not yet been run at the level implied by the plan, recommend `Run tests with $dev-test`
- If the user explicitly asked for build-only work and verification is already sufficient, offer merge more neutrally
- If validation or verification failed, do not offer merge as the recommended path

If the user chooses testing:
- Clearly report the plan path that `$dev-test` should use
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
- Plan files live at `artifacts/plans/{slug}/plan.md` — there is no requirement for a file named `plan.md`
