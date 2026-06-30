---
name: dev-plan
description: Create a structured implementation plan before writing code. USE WHEN user wants an implementation plan, pre-build task breakdown, or roadmap for a feature, fix, refactor, or enhancement.
---

# Create Implementation Plan

Analyze the user's requirements, develop the implementation approach, and save a comprehensive specification to `plans/<name-of-plan>.md` as a blueprint for development.

> Phase 9 runs the pi audit loop every invocation. No flag disables it; no flag swaps the reviewer — pi is the only backend.

## Variables

- `USER_PROMPT` — user's planning request (flags stripped)
- `PLAN_OUTPUT_DIRECTORY` — `plans/`
- `SOURCE_DIRECTORIES` — `artifacts/specs/`, `artifacts/brainstorming/`
- `TEST_DIR` — `tests/`
- `MAX_ROUNDS` — audit-loop round cap; default 2 (see **Flag Parsing**)
- `REVIEWER_MODEL` — optional pi model override (see **Flag Parsing**)

## Invocation

| Form | Behavior |
|------|----------|
| `/dev-plan <prompt>` | Draft, preflight, then run the Phase 9 audit loop (up to `MAX_ROUNDS`), exit early on zero Critical |
| `/dev-plan <prompt> <flags>` | Flags parsed per **Flag Parsing**; the loop still runs |

## Pre-flight

Ensure `plans/` exists:
```bash
mkdir -p plans/
```

## Flag Parsing

Parse flags from the invocation first, then strip them from `USER_PROMPT`:

| Flag | Effect |
|------|--------|
| `--rounds N` | Set `MAX_ROUNDS` to integer `N >= 1` (default 2). Reject `N <= 0`. |
| `--reviewer-model <m>` | Set `REVIEWER_MODEL` passthrough for pi. |

Any other flag (`--no-loop`, `--reviewer`, `--loop`, `--rounds 0`, …) — reject with a one-line message: the pi audit loop is enforced (no disable, no swap). Do not silently accept and skip.

## Workflow Overview

Work through these phases in order:

1. **Parse Requirements** — analyze USER_PROMPT to understand core problem and desired outcome
2. **Discover Source Document** — run Source Document Discovery if USER_PROMPT is free text
3. **Understand Codebase** — explore existing patterns, architecture, and relevant files directly
4. **Design Solution** — develop technical approach with architecture decisions and implementation strategy
5. **Plan phases** — structure the implementation into logical phases
6. **Document Plan** — write comprehensive markdown document following Plan Format
7. **Generate filename** — create descriptive kebab-case filename
8. **Save plan file & preflight** — write plan to PLAN_OUTPUT_DIRECTORY/<filename>.md, then run deterministic preflights (8.1) and fix Criticals before the audit loop
9. **Reviewer Audit Loop** — pi audits the plan, you revise, repeat up to `MAX_ROUNDS`, exit early on zero Critical
10. **Validate** — verify plan completeness and coherence
11. **Report** — present completed plan summary (with loop outcome)
12. **Route Next Step** — size the build and recommend either `/dev-build` or `/to-issues`

## Phase Details

### Phase 1: Parse Requirements

Analyze the USER_PROMPT:
- Core problem or desired outcome?
- Task type (feature|fix|refactor|enhancement|chore)?
- Complexity (simple|medium|complex)?
- Constraints or requirements?

### Phase 2: Source Document Discovery

If USER_PROMPT is a file path, read it directly as the source document.
If USER_PROMPT is free text (not a path), check for a source document:
1. List all `.md` files in both `artifacts/specs/` and `artifacts/brainstorming/` sorted by modification date (most recent first)
2. If source documents exist, use `AskUserQuestion`: "Found source document: <filename>. Use this as the source for planning and traceability?"
   - Options: "Yes, use this document" / "No, just use my prompt" / "No, let me specify a different file"
3. If user confirms, read the source file and use it alongside USER_PROMPT for requirement tag scanning

### Phase 3: Understand Codebase

Explore the codebase directly to understand:
- Existing patterns and architecture
- Relevant files for the task
- Dependencies and integrations
- Test structure and patterns

Use `Read` and `Grep` to gather context. Do not use subagents for this phase.

### Phase 4: Design Solution

Think deeply (ultrathink) about the best approach:
- Architecture decisions
- Implementation strategy
- Edge cases and error handling
- Scalability concerns
- Trade-offs and alternatives considered

Document the reasoning behind key decisions.

### Phase 5: Plan Phases

Structure the implementation into logical phases:
- **Phase 1: Foundation** — foundational work needed
- **Phase 2: Core Implementation** — the main implementation work
- **Phase 3: Integration & Polish** — integration, testing, final touches

For simple tasks, phases may be combined. For complex tasks, add more phases as needed.

### Phase 6: Document Plan

Follow the **Plan Format** below to create a comprehensive implementation plan with all required sections.

### Phase 7: Generate Filename

Create a descriptive kebab-case filename based on the plan's main topic, e.g. `feature-auth-jwt.md`, `fix-session-timeout.md`, `refactor-api-client.md`.

### Phase 8: Save Plan File & Deterministic Preflight

Write the complete plan to `plans/<filename>.md`. **Completion criterion:** every `[N.M]` task names a file it modifies or creates, and every entry under `## Relevant Files` is touched by at least one task. Code examples or pseudo-code are included where appropriate.

#### 8.1 Deterministic preflight (runs before the audit loop)

These mechanical checks run in seconds and catch concrete file/tool reality. Running them BEFORE the audit loop (and fixing their Criticals inline) means pi never burns a round re-discovering a missing file or tool — round 1 starts from a mechanically-clean plan and the loop is tightened onto judgment calls. They double as the sole safety net when the reviewer is unavailable (9.8).

- **Validation Commands:** for each command in the plan's `## Validation Commands` section, parse out file paths and tool names. Verify referenced files exist on disk and tools are present (`which <tool>`). Anything missing → **Critical**.
- **Edit-target existence:** for each path the plan claims to modify (under `## Relevant Files` and inline in tasks), verify the file exists OR is explicitly listed under `### New Files`. A claimed-to-modify file that doesn't exist and isn't a new file → **Critical**.
- **Test paths:** if the plan references `tests/unit/`, `tests/integration/`, or `tests/e2e/`, verify those directories exist or are listed as new. Missing test infrastructure → **Warning**.
- **Prerequisite tools:** if the plan adds dependencies via `uv add`, `pnpm add`, etc., verify the package manager is installed. Missing → **Critical**.

**Fix Critical preflights before round 1** — do not just record them. Resolve each inline: a missing claimed-to-modify file → add it under `### New Files` or correct the path; a missing tool in a Validation Command → adjust the command; a missing package manager → add the install step. Record every finding (fixed or not) under a `phase_8_findings` block in `plans/.<feature>.state.yml`, which 8.1 creates now (9.0 extends it with the loop fields). Any rare unresolved Critical → surface in the Phase 11 report as blocking.

### Phase 9: Reviewer Audit Loop

Round 0 = the Phase 8 draft (after 8.1 preflight fixes). Run rounds 1..`MAX_ROUNDS`: pi audits the on-disk plan against the codebase and emits severity-tagged findings; you revise; repeat. Exit as soon as a round produces zero Critical — its revision still addresses remaining Warnings and cheap Notes inline (no extra re-audit round).

Each round re-reads the revised plan from `plans/<feature>.md`, so **rounds are stateless** — no reviewer session continuity is needed. Reuse the reviewer engine inline (9.2). Do NOT invoke `/dev-review-pi` or `/dev-review-claude` — their interactive scope-verify / present / discuss steps would stall an automated loop.

> **AUTO-REVISE — no gate between rounds.** Parsing findings (9.3) is not a stopping point. Do not present findings to the user, summarize them in chat, or wait for approval before revising. The moment findings are parsed, apply 9.5 and continue automatically. The only user-facing output of Phase 9 is the Phase 11 Loop Outcome block, emitted after the loop has exited. If you find yourself writing "here are the findings" mid-loop, you have violated this rule — revise instead and keep going.

Set `REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)`.

#### 9.0 Initialize state

Phase 8.1 already created `plans/.<feature>.state.yml` with the `phase_8_findings` block. Ensure it also carries the loop fields (schema in **State YAML Schema** below): `current_round: 0`, `status: running`, `reviewer: pi`, `max_rounds`, empty `rounds: []`. If 8.1 produced no findings and skipped the write, create the file now with an empty `phase_8_findings` block.

#### 9.1 Build the round prompt

Generate the completion sentinel once and reuse it across every bash call this round: `COMPLETION_SENTINEL="DEVPLAN_AUDIT_DONE_$(date +%s)_$RANDOM"`. Write the prompt to a temp file (`PROMPT_FILE=$(mktemp /tmp/devplan-prompt-XXXXXX.md)`), ending it with an instruction to print the sentinel on a final line. When writing the file, **substitute the literal sentinel value** for the `<COMPLETION_SENTINEL>` placeholder in the templates below — the reviewer must print the actual nonce token, and the poll greps for that same value. (Shell vars do not persist across separate bash calls; carry the literal value, as with `$PID_FILE`.)

**Round 1 (Challenge):**
```
Adversarially review the implementation plan at plans/<feature>.md for execution
risk. Focus your verification on the files listed under the plan's `## Relevant
Files` section first — verify their paths, patterns, dependencies, and
feasibility against the actual code there. Explore beyond that set ONLY when a
specific finding requires it; do not tour the whole repo. Look for: missing edge
cases, infeasible approaches, conflicts with existing patterns, missing
dependencies, hidden assumptions, misunderstood requirements, gaps in test
strategy, and duplication with existing files.

Output every finding with a severity tag in this exact format:

[CRITICAL] <one-line summary>
  Detail: <evidence and reasoning>
  Suggested fix: <concrete recommendation>
[WARNING] <one-line summary>
  Detail: <evidence and reasoning>
  Suggested fix: <concrete recommendation>
[NOTE] <one-line summary>
  Detail: <evidence and reasoning>

Severity: CRITICAL = will cause execution failure or wrong behavior;
WARNING = significant risk/gap, can proceed with mitigation; NOTE = minor.
Do not invent problems. Do not be sycophantic. Be precise. Do NOT modify any
files — review only. After all findings, print exactly this on a final line:
<COMPLETION_SENTINEL>
```

**Rounds 2+ (Diff-aware re-review):** same output format, but **diff-scoped** — do NOT re-read the whole plan or re-explore the whole repo (round 1 already covered untouched sections). Build the prompt from the prior round's verbatim findings and the `revision_summary` in the state YAML, so the re-review verifies fixes and scans only the revised sections:

```
The plan at plans/<feature>.md was revised after round <N-1>'s audit. Do NOT
re-read the whole plan or re-explore the whole repo — round 1 already covered
sections the revision left untouched. Do exactly two things:
1. For each prior finding below, verify the revision genuinely FIXES it (not
   rewording). If still unfixed, re-emit it at the same or higher severity.
2. Scan ONLY the revised sections for NEW issues the revision introduced.
Prior round findings (verbatim):
<paste round N-1 findings from the state YAML>
Revision summary: <paste revision_summary from the state YAML>

<same [CRITICAL]/[WARNING]/[NOTE] output format and severity key as round 1.
After all findings, print exactly this on a final line: <COMPLETION_SENTINEL>
```

Because rounds are stateless, the prior context rides inline in the prompt — no reviewer session continuity needed.

#### 9.2 Run the reviewer

Resolve the model args, then launch via the backgrounded-`pi --print` engine at `~/.claude/skills/_shared/pi-reviewer-engine.md`:

```bash
if [ -n "$REVIEWER_MODEL" ]; then
  PI_MODEL_ARGS=( --model "$REVIEWER_MODEL" )
else
  PI_MODEL_ARGS=()
fi
```

Create the engine's output/pid temp files, then assemble the caller params:
```bash
OUTPUT_FILE=$(mktemp /tmp/devplan-review-XXXXXX.txt)
PID_FILE=$(mktemp /tmp/devplan-review-pid-XXXXXX.txt)
PROJECT_ROOT="$REPO_ROOT"
```
Caller params for the engine: `$PROJECT_ROOT`, `$PROMPT_FILE` and `$COMPLETION_SENTINEL` from 9.1, `$OUTPUT_FILE` / `$PID_FILE` above, and `PI_MODEL_ARGS`. The engine launches with `--exclude-tools "Agent,get_subagent_result,steer_subagent"` and the review-only system prompt, runs the 1s launch-failure sanity check, and is polled in separate Bash calls. This is a plan-file audit — the reviewer is review-only by instruction, so drift detection is not required.

Poll per the engine until `$COMPLETION_SENTINEL` appears in `$OUTPUT_FILE` or the PID exits. Surface a one-line progress note each poll.

#### 9.3 Parse findings

From `$OUTPUT_FILE`, extract findings by severity tag (`[CRITICAL]`/`[WARNING]`/`[NOTE]`), capturing verbatim text. Compute `critical_count`, `warning_count`, `note_count`. The `$COMPLETION_SENTINEL` marks clean end-of-output; if it's missing, the output was truncated — record that and treat as a reviewer failure (9.8).

Proceed **directly** to 9.4 then 9.5 — do not pause to report findings (AUTO-REVISE).

#### 9.4 Append round to state

Bump `current_round: <N>`, then append the round entry (verbatim findings + counts) per the schema. `current_round` now reflects the round whose findings were just parsed.

#### 9.5 Revise plan

Read the findings. Revise `plans/<feature>.md`:
- Address each `[CRITICAL]` by changing the plan.
- Address each `[WARNING]` by changing the plan OR adding a Note explaining why it's acceptable.
- Address `[NOTE]` only if cheap.

**Preserve the Plan Format exactly** — section structure, `[N.M]` task IDs, `[T.N.M]` test IDs (downstream `/dev-build` and `/dev-test` depend on them). Record a one-line `revision_summary` in the round entry.

#### 9.6 Check exit criteria

After the revision pass, if `critical_count == 0` for the round just parsed:
- `status: converged`, `exit_reason: "Zero critical findings; warnings and notes addressed inline"` → exit loop, go to Validate.

The revision in 9.5 already addressed remaining Warnings (by fix or by Note) and any cheap Notes. **No re-audit round** — exit immediately. If you intentionally dismissed a Warning without changing the plan, record the reasoning in `revision_summary`.

#### 9.7 Hard stop / loop back

If `current_round >= MAX_ROUNDS`: `status: hard_stopped`, `exit_reason: "Reached MAX_ROUNDS=<N>"` → exit loop, go to Validate. Otherwise loop back to 9.1.

#### 9.8 Reviewer unavailable / failure

Detect before round 1 and on any round failure: pi binary missing (`which pi` empty), pi exits non-zero, or no sentinel / empty output / poll budget exhausted. Per the engine's **Reviewer failure modes**, set `status: reviewer_unavailable`, record `exit_reason` with the cause, **keep the plan as-is**, and proceed to Validate. Do NOT fail the whole skill — an unaudited plan is still useful. Surface the failure in the Phase 11 report. (Phase 8.1's deterministic preflight is the safety net when the loop couldn't run.)

### Phase 10: Validate

**Structural checks:**
- All required sections present
- Tasks are actionable and have stable [N.M] ID prefixes
- Traceability map correctly links #req-* tags to task IDs
- No missing dependencies between tasks
- Testing strategy is clear and complete

The deterministic preflights (Validation Commands, edit-target existence, test paths, prerequisite tools) already ran in **Phase 8.1** and their Criticals were fixed before round 1 — see `phase_8_findings` in the state YAML. This phase is the post-loop coherence pass; it does not repeat them. If Phase 9 ran with `status: reviewer_unavailable`, surface any unresolved `phase_8_findings` Criticals in the Phase 11 report as blocking.

### Phase 11: Report

Present the completed plan summary and the routing recommendation from Phase 12. Always include the loop outcome. See the **Report** section below.

### Phase 12: Route Next Step

Size the build from the saved plan, then recommend exactly **one** next skill — `/dev-build` or `/to-issues`. This is a recommendation only; do not invoke the skill.

Compute these signals from the on-disk plan:
- **Task count** — total `[N.M]` items under `## Step by Step Tasks`
- **Step groups** — number of `### N.` task headers
- **Files touched** — entries under `## Relevant Files` (including `### New Files`)
- **Complexity** — the `simple|medium|complex` value from Phase 1

Decide with this rule (the build is "large" if **any** large signal holds):

| Signal | → `/dev-build` (small, one session) | → `/to-issues` (large, break up for Ralph) |
|--------|------------------------------------|--------------------------------------------|
| Task count | ≤ 12 | > 12 |
| Step groups | ≤ 4 | > 4 |
| Files touched | ≤ 10 | > 10 |
| Complexity | simple or medium | complex |

If the plan has independent vertical slices that could each ship and verify on their own (multiple unrelated features/endpoints/flows), prefer `/to-issues` even when counts are borderline — that is exactly what tracer-bullet slicing is for. If it is one cohesive change, prefer `/dev-build`.

Emit the recommendation in the Phase 11 report (one line, with the one or two signals that drove it). Recommend only one.

## Instructions

- **IMPORTANT**: If no USER_PROMPT is provided, stop and ask the user to provide it.
- Determine task type (chore|feature|refactor|fix|enhancement) and complexity (simple|medium|complex)
- Follow the Plan Format below exactly

### Tag Propagation

If a source document (PRD, brainstorming output) is found via Source Document Discovery:
1. Scan it for `#req-[id]` patterns (e.g., `#req-user-login`, `#req-data-export`)
2. When generating the `## Step by Step Tasks` section, give each task item a **stable inline ID prefix** `[N.M]` and append the relevant `#req-[id]` tag
3. Format: `- [ ] [1.1] Implement login form #req-user-login`
4. The `[N.M]` prefix serves as a stable anchor for `/dev-test` to match against when flipping checkboxes
5. Add a `## Traceability Map` section at the end showing `#req-[id]` -> Task IDs

If no `#req-[id]` tags exist, skip tag propagation (graceful degradation).

## Plan Format

Follow this format exactly:

```md
# Plan: <task name>

## Task Description
<describe the task in detail based on the prompt>

## Objective
<clearly state what will be accomplished when this plan is complete>

<if task_type is feature or complexity is medium/complex, include these sections:>
## Problem Statement
<clearly define the specific problem or opportunity this task addresses>

## Solution Approach
<describe the proposed solution approach and how it addresses the objective>
</if>

## Relevant Files
Use these files to complete the task:

<list files relevant to the task with bullet points explaining why. Include new files to be created under an h3 'New Files' section if needed>

<if complexity is medium/complex, include this section:>
## Implementation Phases
### Phase 1: Foundation
<describe any foundational work needed>

### Phase 2: Core Implementation
<describe the main implementation work>

### Phase 3: Integration & Polish
<describe integration, testing, and final touches>
</if>

## Step by Step Tasks
IMPORTANT: Execute every step in order when running manually. `/dev-build` will parallelize independent groups automatically.

<list step by step tasks as h3 headers with checkbox bullet points. Start with foundational changes then move to specific changes. Last step should validate the work>

Each task item uses a stable inline ID prefix `[N.M]` where N is the step number and M is the sub-task number. If `#req-[id]` tags were found in the source document, append the relevant tag to each task item.

### 1. <First Task Name>
- [ ] [1.1] <specific action> #req-<relevant-id>
- [ ] [1.2] <specific action> #req-<relevant-id>

### 2. <Second Task Name>
- [ ] [2.1] <specific action> #req-<relevant-id>
- [ ] [2.2] <specific action> #req-<relevant-id>

<continue with additional tasks as needed>

Note: If no #req-[id] tags exist in the source, omit the tag suffix but still use the [N.M] ID prefix and checkbox format.

**Optional parallelism annotations** (append to any `### N.` header when `/dev-build`'s heuristics would be wrong):
- `[parallel-safe]` — explicitly safe to run concurrently with other groups in the same phase, even if files overlap
- `[sequential]` — must run alone in its own wave regardless of other signals

Examples:
### 3. Build API Layer [parallel-safe]
### 5. Run Database Migration [sequential]

If no annotations are present, `/dev-build` infers parallelism from phase boundaries, dependency language, and file overlap.

<if task_type is feature or complexity is medium/complex, include this section:>
## Testing Strategy
<describe testing approach that will satisfy the Testing Promise, including:
- Unit tests for individual functions and modules in TEST_DIR/unit/
- Integration tests for API endpoints and service interactions in TEST_DIR/integration/
- E2E tests for web-facing features using Playwright MCP tools in TEST_DIR/e2e/
- Edge cases and error scenarios to cover
>
</if>

## Tests
<derive test tasks from Acceptance Criteria. Each test task uses [T.N.M] ID prefix where N is the test category and M is the sub-task>

### T.1. <Test Category>
- [ ] [T.1.1] <specific test case>
- [ ] [T.1.2] <specific test case>

<continue with additional test categories as needed>

## Progress
**Phase Status:**
- Build: `pending`
- Test: `pending`

**Task Counts:**
- Implementation: `0/<N>` tasks complete
- Tests: `0/<M>` tests passing

**Last Updated:** `---`

## Acceptance Criteria
<list specific, measurable criteria that must be met for the task to be considered complete>

## Testing Promise
<clear, single statement of what testing must accomplish - this becomes the completion criteria for /dev-test>
<example: "All unit tests in tests/unit/ and integration tests in tests/integration/ pass with zero failures">
<example: "E2E tests verify all user flows complete successfully with no console errors">

## Validation Commands
Execute these commands to validate the task is complete:

<list specific commands to validate the work. Be precise about what to run>
- Example: `uv run python -m py_compile apps/*.py` - Test to ensure the code compiles

<if #req-[id] tags were found in the source document, include this section:>
## Traceability Map

| Requirement | Tasks |
|-------------|-------|
| #req-<id> | [1.1], [1.2] |
| #req-<id> | [2.1] |

<Maps each #req-[id] tag to the task IDs that implement it. Omit this section entirely if no #req-[id] tags exist.>
</if>

## Notes
<optional additional context, considerations, or dependencies. If new libraries are needed, specify using `uv add`>
```

## Report

After creating and saving the implementation plan, provide a concise report:

```
✅ Implementation Plan Created

File: plans/<filename>.md
Topic: <brief description of what the plan covers>
Key Components:
- <main component 1>
- <main component 2>
- <main component 3>

Next Step (recommended):
<one of:>
Run `/dev-build plans/<filename>.md` when ready to implement. (small build — <driving signal>)
Run `/to-issues plans/<filename>.md` to break this into Ralph-grabbable issues. (large build — <driving signal>)
```

Always append the Loop Outcome block:

```
Audit Loop (reviewer: pi)
- Rounds run: <N>/<MAX_ROUNDS>
- Exit reason: <converged | hard_stopped | reviewer_unavailable — detail>
- Final findings: <critical> critical / <warning> warning / <note> note
- State: plans/.<filename>.state.yml
```

If `status: reviewer_unavailable`, say so plainly — the plan is unaudited; Phase 8.1's preflight and Phase 10's structural validation were the only safety nets.

## State YAML Schema

`plans/.<feature>.state.yml` — the loop's working memory and audit trail. Findings are stored **verbatim** so the trail can be reconstructed later.

```yaml
plan_file: plans/<feature>.md
prompt: "<original USER_PROMPT, flags stripped>"
reviewer: pi              # always pi
reviewer_model: null      # set when --reviewer-model given
max_rounds: 2
current_round: 2
status: running           # running | converged | hard_stopped | reviewer_unavailable
exit_reason: null         # filled when status != running
phase_8_findings:          # from Phase 8.1 preflight; empty if none
  critical: []
  warning: []
  note: []
rounds:
  - round: 1
    findings:
      critical: ["[CRITICAL] <verbatim>"]
      warning:  ["[WARNING] <verbatim>"]
      note:     ["[NOTE] <verbatim>"]
    counts: { critical: 2, warning: 5, note: 3 }
    revision_summary: "<one line of what Claude changed>"
  - round: 2
    findings: { critical: [], warning: ["[WARNING] <verbatim>"], note: [] }
    counts: { critical: 0, warning: 1, note: 2 }
    revision_summary: "..."
```
