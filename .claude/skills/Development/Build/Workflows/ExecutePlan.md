# ExecutePlan Workflow

Full 10-phase workflow for wave-based parallel plan execution.

**Voice notification:** Already sent by SKILL.md on invocation.

## Variables

- `PATH_TO_PLAN` — Path to a specific plan file, if provided
- `PLAN_DIRECTORIES` — `plans/`, `specs/`
- `AUDIT_MODE` — `critical-only` (default) | `all` | `off`. Override with `--audit-mode=<value>`. Shorthand: `--no-audit` is equivalent to `--audit-mode=off`.

## Flag Parsing

Parse flags from the invocation before Phase 1:

| Flag | Effect |
|------|--------|
| `--no-audit` | Disable the wave-end Codex audit entirely (sets `AUDIT_MODE=off`) |
| `--audit-mode=critical-only` | Default. Audit fires after every code-changing wave; only Critical findings trigger auto-fix-and-retry, Warning/Note are logged silently |
| `--audit-mode=all` | Audit fires; Warnings also surface in build output (Critical still triggers auto-fix-and-retry) |
| `--audit-mode=off` | Skip audit entirely |

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

### Pre-wave snapshot (required when AUDIT_MODE != off)

Capture a tree-ish reference for the working tree's state BEFORE the wave runs. This is required so Phase 7.5.1 can produce a diff that includes uncommitted and untracked changes (which `<ref>..HEAD` comparisons silently miss). Skip this step only when `AUDIT_MODE=off`.

```bash
# Stage everything currently in the workspace (tracked + untracked) into the index,
# then create a tree-ish from the index. Reset the index back so the workspace
# returns to its prior staged/unstaged split — the working tree is unchanged.
git add -A
PRE_WAVE_SNAPSHOT=$(git write-tree)
git reset >/dev/null  # restore prior index state; working tree untouched
echo "Wave <N> pre-snapshot: $PRE_WAVE_SNAPSHOT"
```

Record `PRE_WAVE_SNAPSHOT` (the tree SHA) for use by Phase 7.5.1. The same mechanism captures `POST_WAVE_SNAPSHOT` after the wave completes.

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

### Stage progress (do NOT flip checkboxes yet)

Phase 7 evaluates the wave but does **not** modify the plan markdown. The wave-end audit (Phase 7.5) runs first; if it halts, downstream tools must NOT see those tasks as complete. Checkbox flipping is deferred to Phase 7.5.7 (after audit passes or the user explicitly overrides).

In this step:
- Track which task IDs the wave reported as completed (in working memory or state YAML).
- Parse the plan markdown to project which tasks WILL become ready after the audit gates pass — but don't actually flip them yet.

---

## Phase 7.5 — Codex Wave-End Audit (default ON)

After a wave's tasks are marked complete and BEFORE moving to the next wave, run a focused Codex audit on the diff this wave produced. The audit catches bugs, missed edge cases, and pattern violations introduced by the wave's work — at the natural boundary where issues are still cheap to fix.

### State-file location

Audit results are appended to `plans/.<feature>.state.yml` under a `build_audits:` section. Derive `<feature>` from the plan path:

- If plan path matches `plans/<feature>.md` or `specs/<feature>.md` → `<feature>` is the basename without `.md`.
- If plan path matches `specs/<plan>/shard-<N>.md` (a shard) → use `<plan>` (the parent shard set's name) so all wave audits aggregate against one state file.

If `plans/.<feature>.state.yml` does not exist (Build invoked on a plan created with `--no-loop`, or a hand-written plan with no Plan-loop state), create a minimal state stub:

```yaml
plan_file: <plan_path>
status: build_only         # plan never ran the audit loop
build_audits: []
```

Then proceed normally.

### Skip conditions

Skip this phase entirely (no Codex call, no state write) when:
- `AUDIT_MODE=off` (user passed `--no-audit`).
- Codex is unavailable per the detection logic in Plan's Phase 7.2 (CLI missing, unauthed). Log a single `outcome: audit_skipped` entry with `skip_reason: codex_unavailable` and continue subsequent waves with the same result (don't re-probe per wave).

Record outcome `audit_skipped` with appropriate `skip_reason` (NOT a bare `audit_skipped` string in some other field) when a wave-specific condition prevents a meaningful audit; see 7.5.1 and 7.5.2.

### 7.5.1 — Capture the wave's diff (working-tree, includes uncommitted+untracked)

The Phase 5 `PRE_WAVE_SNAPSHOT` captured the workspace state before the wave. Now capture `POST_WAVE_SNAPSHOT` the same way and diff between the two — this includes uncommitted edits AND untracked new files, which a `<ref>..HEAD` diff would silently drop.

```bash
git add -A
POST_WAVE_SNAPSHOT=$(git write-tree)
git reset >/dev/null
git diff "$PRE_WAVE_SNAPSHOT" "$POST_WAVE_SNAPSHOT" -- <files_touched_by_wave> > /tmp/build_wave_<N>_diff.patch
```

If `<files_touched_by_wave>` is empty (the wave didn't declare a file scope), diff without the path filter:

```bash
git diff "$PRE_WAVE_SNAPSHOT" "$POST_WAVE_SNAPSHOT" > /tmp/build_wave_<N>_diff.patch
```

**Empty-diff handling:** if the resulting patch is empty (zero bytes), the wave produced no actual changes. Two sub-cases:
- The wave's tasks are pure docs/config edits where every changed file matches `*.md|*.txt|*.rst|*.toml|*.cfg|*.ini` per the snapshot → record `outcome: audit_skipped, skip_reason: doc_only` and continue.
- The wave was code-changing per the plan but produced no diff → this is a real anomaly (work was reverted, already present, or builders silently failed). Record `outcome: audit_skipped, skip_reason: zero_diff` AND halt the build with an `AskUserQuestion` asking whether to override and continue, since downstream waves may depend on the absent changes.

If the patch is non-empty, proceed to 7.5.2.

### 7.5.2 — Invoke Codex (quick check, fresh session per wave)

Each wave's audit is independent — no session continuity needed across waves. Use `codex exec` (not `resume`):

```bash
cd <repo_root>
timeout 300 codex exec \
  --sandbox danger-full-access \
  -c model_reasoning_effort='"high"' \
  --skip-git-repo-check \
  "$(cat /tmp/build_wave_<N>_audit_prompt.txt)" \
  > /tmp/build_wave_<N>_audit_out.txt 2>&1
EXIT=$?
```

Note: this invocation uses `--sandbox danger-full-access` from the start (Build's repos are trusted by definition, and Codex's vendored bwrap is unreliable). There is no separate "bwrap recovery" branch — if the audit still fails, treat it as a Codex failure per 7.5.4 below.

### 7.5.3 — Codex prompt template (quick check)

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
  Affected files: <comma-separated list of files that need editing to fix this — include adjacent tests/imports/fixtures/configs if they would also need to change, NOT just the file where the bug surfaces>
  Suggested fix: <concrete recommendation>

[WARNING] <one-line summary>
  Detail: ...
  Affected files: ...
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

The `Affected files` line is required for Critical and Warning findings so 7.5.5's auto-fix can edit beyond just the file where the bug "surfaces."

### 7.5.4 — Parse findings and handle Codex failure modes

After 7.5.2 completes, classify the result:

| Condition | Action |
|-----------|--------|
| `EXIT == 0` AND output ends with `END_OF_FINDINGS` | Normal — parse findings by severity tag, capture verbatim text and `Affected files` lines. Proceed to 7.5.5. |
| `EXIT == 124` (timeout) | Initial audit: record `outcome: audit_skipped, skip_reason: codex_timeout` and continue the build. Post-fix re-audit: escalate to user (the safety check could not complete). |
| `EXIT != 0` AND `EXIT != 124` | Treat as audit failure: `outcome: audit_skipped, skip_reason: codex_failed`, capture the last 50 lines of output as `error_excerpt`, continue the build. |
| `EXIT == 0` but output is missing `END_OF_FINDINGS` (truncated) | `outcome: audit_skipped, skip_reason: malformed_output`. Capture what was parseable, log the rest as `error_excerpt`, continue. |

Append the audit entry to `build_audits:` in the state YAML using the schema documented in `Plan/Workflows/CreatePlan.md`.

### 7.5.5 — Handle findings (auto-fix-and-retry-and-re-audit)

Per audit-mode:

| Severity | `critical-only` (default) | `all` | `off` |
|----------|--------------------------|-------|-------|
| Critical | Auto-fix → re-validate → re-audit | Auto-fix → re-validate → re-audit | n/a — phase skipped |
| Warning  | Logged silently | Surfaced in build output, build continues | n/a |
| Note     | Logged silently | Logged silently | n/a |

**Auto-fix-and-retry contract for Critical findings:**

1. **Read** each Critical finding's `Detail`, `Affected files`, and `Suggested fix`.
2. **Patch** via `Edit`. Edits are bounded to the union of every Critical finding's `Affected files` list. No opportunistic refactors of files outside that union.
3. **Re-run the wave's relevant validation:** test commands or validation commands that cover the changed code. Prefer the plan's `## Validation Commands` filtered to this wave's file scope; otherwise targeted `pytest <changed_test_files>` or equivalent. Capture stdout/stderr.
4. **If validation FAILS:** escalate immediately (skip step 5). The fix didn't work.
5. **If validation passes:** **re-audit** by running 7.5.1 + 7.5.2 + 7.5.3 once more on the post-fix diff. Compare results:
   - If post-fix audit returns NO Critical findings: success. Outcome `auto_fixed`. Append the second audit attempt to the wave's `attempts:` list (see schema). Proceed to Phase 8.
   - If post-fix audit returns Critical findings (original recurring OR new): escalate.
6. **Escalation path:** mark `outcome: escalated_to_user`. Halt the build. Present the original findings + attempted fixes + post-fix audit findings (if any) via `AskUserQuestion` with options:
   - "I'll fix it manually — pause build" (build halts, user resolves, user re-invokes `/dev-build` to resume from this wave)
   - "Override and continue" (mark `outcome: overridden`, proceed to Phase 8)
   - "Abort build" (mark plan as failed, exit)

**Hard limit: one auto-fix attempt per wave.** No infinite loops. Second Critical at any stage → user always.

### 7.5.6 — Mark wave progress (checkbox flip)

Only flip plan checkboxes AFTER the audit gate has resolved cleanly. Flip when `outcome` is one of:
- `passed` — no Critical findings, no auto-fix needed
- `auto_fixed` — Critical findings were auto-fixed AND post-fix re-audit was clean
- `audit_skipped` — audit didn't run (codex_unavailable, doc_only, etc.); the wave's tasks are still considered complete by builder evaluation
- `overridden` — user explicitly chose to override-and-continue at the escalation prompt

Do NOT flip when:
- `outcome: escalated_to_user` AND the user picked "I'll fix it manually" or "Abort build"
- `outcome: audit_skipped, skip_reason: zero_diff` (handled by the halt-and-ask in 7.5.1)

For each task ID the wave reported complete (tracked at Phase 7), use `Edit` to change `- [ ]` to `- [x]` in the plan markdown file. Then parse the plan to determine which tasks become ready next.

### 7.5.7 — Surface findings to build output

Independent of severity handling, emit a one-line summary to the build's progress output so the user sees audit activity:

```
Wave <N> audit: 0 critical / 1 warning / 0 note (outcome: passed)
```

For waves where auto-fix-and-retry-and-re-audit fired:

```
Wave <N> audit: 1 critical → auto-fixed → re-audited clean (outcome: auto_fixed)
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
5. Evaluate results using the structured builder reports (Phase 7) — but do NOT flip plan checkboxes yet.
6. **Run wave-end Codex audit** (Phase 7.5) — capture wave diff, audit it, auto-fix-and-retry-and-re-audit on Critical, log otherwise. Skip if `--no-audit` or Codex unavailable.
7. **Mark wave progress** (Phase 7.5.6) — flip plan checkboxes only AFTER audit passes/auto_fixes/overrides. Skip flipping if the audit escalated and the user chose manual fix or abort.
8. Verify as appropriate (Phase 8)

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
