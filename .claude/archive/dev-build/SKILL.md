---
disable-model-invocation: true
name: dev-build
description: Execute an implementation plan with parallel wave-based execution. Use AFTER /dev-plan when ready to build. USE WHEN user says 'implement the plan', 'build this', 'execute the plan', 'start coding', or wants to begin implementation from a plan file. Runs validation and connects to /dev-test.
---

# Execute Implementation Plan

Use this skill when the user wants to carry out a written implementation plan, especially when the work includes dependencies, multiple task groups, or opportunities for safe parallel execution. Treat the plan system as the source of truth for task readiness and progress, and only parallelize work that is genuinely independent. Do not use this skill for quick one-off edits, simple fixes, or work that does not have a written plan.

---

## Variables

- `PATH_TO_PLAN` - path to a specific plan file, if provided
- `PLAN_DIRECTORIES` - `plans/`, `specs/`
- `AUDIT_MODE` - `critical-only` (default) | `all`. Override with `--audit-mode=<value>`
- `REVIEWER_MODEL` - optional model override passed to pi with `--reviewer-model <m>`

---

> **MANDATORY — DO NOT SKIP PHASE 7.5.** Every code-changing wave ends with a pi reviewer audit. The audit is **not** user-suppressible — there is no flag to disable it and no flag to swap the reviewer. pi is the only reviewer backend. Involuntary skips (pi binary missing, doc-only diff, zero diff, reviewer timeout/failure) are logged as `audit_skipped` with a `skip_reason`; a *voluntary* skip on a code-changing wave is a skill-completion failure.

## Invocation

| Form | Behavior |
|------|----------|
| `/dev-build <plan>` | Wave-end pi audit on every code-changing wave; critical-only auto-fix-and-retry |
| `/dev-build <plan> --audit-mode=critical-only` | Explicit form of the default; only Critical findings act, Warning/Note logged silently |
| `/dev-build <plan> --audit-mode=all` | Surface Warnings inline in build output (still auto-fix only on Critical) |
| `/dev-build <plan> --reviewer-model <m>` | Pass a model override to pi |

## Flag Parsing

Parse flags from the invocation before Phase 1:

| Flag | Effect |
|------|--------|
| `--audit-mode=critical-only` | Default. Audit fires after every code-changing wave; only Critical findings trigger auto-fix-and-retry, Warning/Note logged silently |
| `--audit-mode=all` | Audit fires; Warnings also surface in build output (Critical still triggers auto-fix-and-retry) |
| `--reviewer-model <m>` | Set `REVIEWER_MODEL` passthrough for pi |

Any other flag — reject with a one-line explanation and do not silently accept and skip. (The wave-end pi audit is enforced — see the banner above.)

---

## Workflow Overview

Work through these steps in order:

1. Discover and confirm the plan
2. Establish the execution workspace (skip branch creation — CC does not create feature branches)
3. Load plan state and task readiness
4. Build a safe wave schedule
5. Execute one wave at a time
6. Evaluate wave results (stage, but do not yet mark, completed tasks)
7. Run the wave-end reviewer audit, then mark completed tasks once the audit gate resolves
8. Verify results before claiming success
9. Decide the next workflow handoff
10. Report the final build status

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

### Pre-wave snapshot (required for every code-changing wave)

Capture a tree-ish reference for the working tree's state BEFORE the wave runs. This is required so Phase 7.5.1 can produce a diff that includes uncommitted AND untracked changes (which `<ref>..HEAD` comparisons silently miss) — and it must never mutate the user's real git index.

Mechanics: READ `dev-build/git-snapshot.md` (throwaway-index snapshot) for the exact capture + diff commands — do not re-derive them. Set `REPO_ROOT` once: `REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)`, then capture `PRE_WAVE_SNAPSHOT`. Record it for Phase 7.5.1.

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

### Stage progress (do NOT flip checkboxes yet — audit runs first)

Phase 7 evaluates the wave but does **not** modify the plan markdown. The wave-end audit (Phase 7.5) runs first; if it halts, downstream tools must NOT see those tasks as complete. The checkbox flip is deferred to Phase 7.5.6 (after the audit gate resolves).

In this step:
- Track which task IDs the wave reported complete (in working memory or the state YAML).
- Parse the plan markdown to project which tasks WILL become ready once the audit gate passes — but don't flip them yet.

Checkbox flips are deferred to Phase 7.5.6 — they happen only after the audit gate resolves.

---

## Phase 7.5 — Wave-End Reviewer Audit (MANDATORY — runs after every code-changing wave)

After a wave's tasks complete and BEFORE moving to the next wave, run a pi audit on the diff this wave produced (this runs every code-changing wave — see skip conditions for the only exceptions). Do **not** invoke the `/dev-review-pi` skill — its interactive scope-verify / present / discuss steps would stall an automated build; run the shared engine inline (`.claude/skills/_shared/pi-reviewer-engine.md`).

Set `REPO_ROOT` once if not already set: `REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)`.

### State-file location

Audit results are appended to `plans/.<feature>.state.yml` under a `build_audits:` section. Derive `<feature>` from the plan path:

- If plan path matches `plans/<feature>.md` or `specs/<feature>.md` → `<feature>` is the basename without `.md`.
- If plan path matches `specs/<plan>/shard-<N>.md` (a shard) → use `<plan>` (the parent shard set's name) so all wave audits aggregate against one state file.

If `plans/.<feature>.state.yml` does not exist (Build invoked on a plan created without `--loop`, or a hand-written plan), create a minimal stub. `/dev-plan`'s loop schema has no `build_audits` block — add it alongside whatever exists without disturbing a `rounds:` block if present:

```yaml
plan_file: <plan_path>
status: build_only         # plan never ran the audit loop
build_audits: []
```

`build_only` is a dev-build-only sentinel that is NOT part of `/dev-plan`'s `status` enum (`running | converged | hard_stopped | reviewer_unavailable`). It only appears in stubs created here when no `/dev-plan` loop ever ran, so a cross-tool reader of the sidecar should treat it as "build created this file; no plan loop state exists."

If the file already exists with a `rounds:` block from `/dev-plan --loop`, append `build_audits:` as a new top-level key — do not modify `rounds:` or `status:`.

### Skip conditions

*Involuntary* skips are logged with a `skip_reason` and surfaced in the Phase 10 report:

- `reviewer_unavailable` — `which pi` is empty. Log once and continue subsequent waves with the same result (don't re-probe per wave). Surface prominently in the Phase 10 report so the user knows the safety net was down.
- `doc_only` / `zero_diff` — the wave produced no code-changing diff (Phase 7.5.1). Logged and skipped without invoking pi.
- `reviewer_timeout` / `reviewer_failed` / `malformed_output` — pi was invoked but did not complete usefully (Phase 7.5.4). Logged and the wave's checkbox flip proceeds without an audit gate.

"User didn't pass a flag" / "wave looked trivial" / "I already checked the diff" are NOT valid skip reasons. Run the audit unless one of the involuntary conditions above fires.

### 7.5.1 — Capture the wave's diff (working-tree, includes uncommitted+untracked)

Phase 5's `PRE_WAVE_SNAPSHOT` captured the workspace before the wave. Now capture `POST_WAVE_SNAPSHOT` and diff the two per the commands in `dev-build/git-snapshot.md` (READ it — do not re-derive the throwaway-index procedure) — this includes uncommitted edits AND untracked new files, which a `<ref>..HEAD` diff would silently drop.

`<files_touched_by_wave>` is the union of the `Files changed:` paths reported by this wave's builders (Phase 6). On the initial audit, write to `/tmp/build_wave_<N>_diff.patch`; on a post-fix re-audit (7.5.5 step 5), write to `/tmp/build_wave_<N>_reaudit_diff.patch` so the original is preserved.

**Empty-diff handling:** if the resulting patch is empty (zero bytes), the wave produced no actual changes. Two sub-cases:
- The wave's tasks are pure docs/config edits where every changed file matches `*.md|*.txt|*.rst|*.toml|*.cfg|*.ini` → record `outcome: audit_skipped, skip_reason: doc_only` and continue.
- The wave was code-changing per the plan but produced no diff → real anomaly (work was reverted, already present, or builders silently failed). Record `outcome: audit_skipped, skip_reason: zero_diff` AND halt the build with `AskUserQuestion` (since downstream waves may depend on the absent changes), with these options:
  - "Override — accept the wave as complete" → change `outcome` to `overridden` so 7.5.6 flips the checkboxes, then continue.
  - "Pause — I'll investigate" → leave `outcome: audit_skipped, skip_reason: zero_diff`, do NOT flip checkboxes (the wave stays incomplete and is re-scheduled when the user re-invokes `/dev-build`), and halt.

If the patch is non-empty, proceed to 7.5.2.

### 7.5.2 — Build the audit prompt

Generate the completion sentinel once and reuse it: `COMPLETION_SENTINEL="DEVBUILD_AUDIT_DONE_$(date +%s)_$RANDOM"` (a nonce — never a fixed word like `END_OF_FINDINGS`, which can false-match inside a finding's evidence block). Write the prompt to a temp file (`PROMPT_FILE=$(mktemp /tmp/devbuild-prompt-XXXXXX.md)`), with the sentinel value **interpolated** into its final line (not the bash variable). The audit is intentionally narrow — diff-only review, no codebase-wide tangents:

```
Review the diff at /tmp/build_wave_<N>_diff.patch as a quick sanity check.
You have full read access to this repository. The diff implements these plan tasks:
  <list of [N.M] task IDs from the wave with their one-line task description>

Look ONLY at this diff for: real bugs, missed edge cases the plan called out,
broken patterns vs the rest of the file, obvious test gaps for the changed code
paths. Do NOT make codebase-wide architectural recommendations. Do NOT suggest
improvements that aren't bugs. Do NOT modify any files — review only. Be terse.

Output every finding with a severity tag in this exact format:

[CRITICAL] <one-line summary>
  Detail: <evidence — cite file:line>
  Affected files: <comma-separated files that need editing to fix this — include adjacent tests/imports/fixtures/configs if they would also need to change, NOT just the file where the bug surfaces>
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
After all findings, on a final line print exactly: <COMPLETION_SENTINEL>
```

The `Affected files` line is required for Critical and Warning findings so 7.5.5's auto-fix can edit beyond just the file where the bug surfaces.

### 7.5.3 — Run the reviewer (fresh per wave)

Each wave's audit is independent — no session continuity across waves.

The launch + poll commands are inlined below (copy-paste them verbatim — weak models must not re-derive the `pi` flags). They mirror `.claude/skills/_shared/pi-reviewer-engine.md`, which stays the canonical source — if the engine changes, update this block to match. The engine exists to fix three failure modes (vanish-on-background, false-completion, subagent-swallow) that a naive `pi --print` invocation hits; do not simplify the `setsid` / PID-file / 1s-check / `--exclude-tools` mechanics away.

Set caller params (each wave fresh — no session continuity):

```bash
OUTPUT_FILE=$(mktemp /tmp/devbuild-review-XXXXXX.txt)
PID_FILE=$(mktemp /tmp/devbuild-pid-XXXXXX)
PI_MODEL_ARGS=( --model "${REVIEWER_MODEL:-openai-codex/gpt-5.5}" )
PROJECT_ROOT="$REPO_ROOT"
```

Launch (one synchronous Bash call — do NOT also set `run_in_background: true`; the shell-level `setsid ... &` is the backgrounding mechanism):

```bash
(
  cd "$PROJECT_ROOT"
  setsid pi --print \
    "${PI_MODEL_ARGS[@]}" \
    --exclude-tools "Agent,get_subagent_result,steer_subagent" \
    --append-system-prompt "You are an independent reviewer. Review only; do not modify files. Do all analysis yourself and emit every finding inline in your own final response, following the requested finding format exactly." \
    "@$PROMPT_FILE" \
    > "$OUTPUT_FILE" 2>&1 < /dev/null &
  echo $! > "$PID_FILE"
)

# Sanity check: if pi died within 1s and produced no output, the launch failed
# (bad args, missing API key, etc.). Without this, downstream polls spin against
# an empty output file for the full budget while the harness reports the
# launcher as "completed".
sleep 1
PID=$(cat "$PID_FILE")
if ! kill -0 "$PID" 2>/dev/null && [ ! -s "$OUTPUT_FILE" ]; then
  echo "pi launch failed: process exited within 1s and produced no output" >&2
  cat "$OUTPUT_FILE" >&2 2>/dev/null
  exit 1
fi
echo "pi launched pid=$PID"
```

Poll in separate short Bash calls (never one blocking call — a single call can't show progress and dies on a hard timeout) until `$COMPLETION_SENTINEL` appears in `$OUTPUT_FILE` or the PID exits. Surface a one-line progress note each poll:

```bash
PID=$(cat "$PID_FILE")
if grep -q "$COMPLETION_SENTINEL" "$OUTPUT_FILE" 2>/dev/null; then
  echo "done"        # sentinel present → findings region complete
elif kill -0 "$PID" 2>/dev/null; then
  echo "running"     # poll again after a short wait
else
  echo "exited"      # process gone; check $OUTPUT_FILE for the sentinel
fi
```

This is a code review — drift detection IS required (unlike `/dev-plan`'s plan-file audit, which skips it): READ the **Drift detection** section of `_shared/pi-reviewer-engine.md` and apply it — snapshot the pre-review tree before launch, restore any drifted path after. dev-build's PRE/POST throwaway-index snapshots (Phase 5 / 7.5.1) scope the *audit input diff* — a separate mechanism from drift detection, which guards against the reviewer editing the tree.

### 7.5.4 — Parse findings and handle reviewer failure modes

After 7.5.3 completes, classify the result. The `$COMPLETION_SENTINEL` marks clean end-of-output; if missing, the output was truncated.

| Condition | Action |
|-----------|--------|
| Reviewer exits 0 AND output ends with `$COMPLETION_SENTINEL` | Normal — parse findings by severity tag, capture verbatim text and `Affected files` lines. Proceed to 7.5.5. |
| Poll budget exhausted / no sentinel (process hung or slow) | `skip_reason: reviewer_timeout`. |
| Reviewer exits non-zero | `skip_reason: reviewer_failed`, capture the last ~50 lines of output as `error_excerpt`. |
| Exits 0 but output missing `$COMPLETION_SENTINEL` (truncated) | `skip_reason: malformed_output`. Capture what was parseable, log the rest as `error_excerpt`. |

For the three failure rows, the action depends on which audit failed:
- **Initial audit:** record `outcome: audit_skipped` with the `skip_reason` above and continue the build (the wave is still considered complete — see 7.5.6).
- **Post-fix re-audit (7.5.5 step 5):** the safety re-check could not complete, so do NOT treat it as a pass — **escalate to the user** per 7.5.5 step 6, recording the `skip_reason` for the trail.

Append the audit entry to `build_audits:` in the state YAML using the schema in **State YAML — `build_audits`** below. A reviewer failure on the *initial* audit must NOT fail the build.

### 7.5.5 — Handle findings (auto-fix-and-retry-and-re-audit)

Per audit-mode:

| Severity | `critical-only` (default) | `all` |
|----------|--------------------------|-------|
| Critical | Auto-fix → re-validate → re-audit | Auto-fix → re-validate → re-audit |
| Warning  | Logged silently | Surfaced in build output, build continues |
| Note     | Logged silently | Logged silently |

**Auto-fix-and-retry contract for Critical findings:**

1. **Read** each Critical finding's `Detail`, `Affected files`, and `Suggested fix`.
2. **Patch** via `Edit`. Edits are bounded to the union of every Critical finding's `Affected files` list. No opportunistic refactors of files outside that union.
3. **Re-run the wave's relevant validation:** test or validation commands covering the changed code. Prefer the plan's `## Validation Commands` filtered to this wave's file scope; otherwise targeted `pytest <changed_test_files>` or equivalent. Capture stdout/stderr.
4. **If validation FAILS:** escalate immediately (skip step 5). The fix didn't work.
5. **If validation passes:** **re-audit** the post-fix diff. Re-capture `POST_WAVE_SNAPSHOT` (now reflecting the fixes) via the throwaway-index procedure in `dev-build/git-snapshot.md`, diff it against the *original* `PRE_WAVE_SNAPSHOT`, and write the result to `/tmp/build_wave_<N>_reaudit_diff.patch` (preserving the original `..._diff.patch`). Then run 7.5.2 (prompt) + 7.5.3 (engine launch) on that re-audit diff. Do NOT re-enter step 5 after this re-audit (that is what bounds the loop to one attempt). Three outcomes:
   - Re-audit completes and returns NO Critical findings → success. Outcome `auto_fixed`. Append the second audit attempt to the wave's `attempts:` list. Proceed to 7.5.6.
   - Re-audit completes and returns Critical findings (recurring OR new) → escalate (step 6).
   - Re-audit could NOT complete (reviewer_timeout / reviewer_failed / malformed_output per 7.5.4) → the safety re-check is inconclusive, so do NOT treat it as a pass → escalate (step 6).
6. **Escalation path:** mark `outcome: escalated_to_user`. Halt the build. Present the original findings + attempted fixes + post-fix audit findings (or the re-audit failure reason) via `AskUserQuestion` with options:
   - "I'll fix it manually — pause build" (build halts, user resolves, user re-invokes `/dev-build` to resume from this wave)
   - "Override and continue" (mark `outcome: overridden`, proceed to 7.5.6)
   - "Abort build" (mark plan as failed, exit)

**Hard limit: one auto-fix attempt per wave.** The re-audit in step 5 never loops back into step 5, so there is exactly one fix attempt. A second Critical — or an inconclusive re-audit — at any stage → user always.

### 7.5.6 — Mark wave progress (checkbox flip)

Only flip plan checkboxes AFTER the audit gate has resolved cleanly. Flip when `outcome` is one of:
- `passed` — no Critical findings, no auto-fix needed
- `auto_fixed` — Critical findings auto-fixed AND post-fix re-audit was clean
- `audit_skipped` — audit didn't run (reviewer_unavailable, doc_only, reviewer_timeout, reviewer_failed, malformed_output); the wave's tasks are still considered complete by builder evaluation
- `overridden` — user explicitly chose override-and-continue at the escalation prompt

Do NOT flip when:
- `outcome: escalated_to_user` AND the user picked "I'll fix it manually" or "Abort build"
- `outcome: audit_skipped, skip_reason: zero_diff` (handled by the halt-and-ask in 7.5.1)

For each task ID the wave reported complete (tracked at Phase 7), use `Edit` to change `- [ ]` to `- [x]` in the plan markdown file. Then parse the plan to determine which tasks become ready next.

### 7.5.7 — Surface findings to build output

Emit a one-line summary to the build's progress output so the user sees audit activity:

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
3. Prepare builder prompts with inlined task content, and capture the pre-wave snapshot (Phase 5)
4. Execute the wave (Phase 6)
5. Evaluate results using the structured builder reports (Phase 7) — stage completed task IDs but do NOT flip checkboxes yet (audit gate runs first)
6. **Run the wave-end reviewer audit** (Phase 7.5) — capture the wave diff, audit it with pi, auto-fix-and-retry-and-re-audit on Critical, log otherwise. Skip only if the pi backend binary is missing
7. **Mark wave progress** (Phase 7.5.6) — flip plan checkboxes only AFTER the audit gate passes / auto_fixes / is skipped (reviewer unavailable) / overridden. Skip flipping if the audit escalated and the user chose manual fix or abort
8. Verify as appropriate (Phase 8)

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

Wave Audits (reviewer: pi):
- <N> audited / <K> passed / <J> auto_fixed / <S> skipped
- State: plans/.<feature>.state.yml
- (omit this block entirely only when reviewer was unavailable on every wave)

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

## State YAML — `build_audits`

Schema for the `build_audits:` block appended to `plans/.<feature>.state.yml`: see `dev-build/audit-state.md` (loaded when Phase 7.5 writes audit state). The when-to-create-the-stub decision, the `build_only` sentinel, and the append-don't-overwrite `rounds:` rule live inline in Phase 7.5 "State-file location"; the schema itself is disclosed. Findings are stored verbatim so the trail can be reconstructed later.

---

## Execution Notes

- Prefer safe serialization over risky parallelism
- Do not run tasks in parallel when they are likely to edit the same files
- Do not mark progress until results are reviewed
- Do not claim success without verification evidence
- Plan files can have any name in `plans/` or `specs/` — there is no requirement for a file named `plan.md`
