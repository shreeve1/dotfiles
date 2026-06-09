---
name: dev-plan
description: Create a structured implementation plan, technical approach, phased roadmap, or task breakdown for a feature, fix, refactor, or enhancement before writing code. USE WHEN user wants implementation plan, tech approach, phased roadmap, or pre-build task breakdown.
---

# Create Implementation Plan

Create a detailed implementation plan based on the user's requirements. Analyze the request, think through the implementation approach, and save a comprehensive specification document to `plans/<name-of-plan>.md` that can be used as a blueprint for actual development work.

> **MANDATORY — DO NOT SKIP PHASE 9.** Every invocation of `/dev-plan` runs the pi reviewer audit loop (up to `MAX_ROUNDS=3` rounds, exit early on zero Critical). The loop is **not** optional. If you draft a plan and stop without running Phase 9, you have not completed this skill. There is no flag to disable the loop and no flag to swap the reviewer — pi is the only reviewer backend. Reach Phase 9 every time.

## Variables

- `USER_PROMPT` — user's planning request
- `PLAN_OUTPUT_DIRECTORY` — `plans/`
- `SOURCE_DIRECTORIES` — `artifacts/specs/`, `artifacts/brainstorming/`
- `TEST_DIR` — `tests/`
- `REVIEWER` — fixed to `pi`. No flag to change.
- `MAX_ROUNDS` — default `3`; override with `--rounds N` where `N >= 1`
- `REVIEWER_MODEL` — optional model override passed to pi with `--reviewer-model <m>`

## Invocation

| Form | Behavior |
|------|----------|
| `/dev-plan <prompt>` | Draft, then run up to `MAX_ROUNDS=3` pi-audit rounds, exit early when a round produces zero Critical (remaining Warning/Note are addressed during that round's revision pass) |
| `/dev-plan <prompt> --rounds N` | Override max rounds; `N` must be `>= 1` |
| `/dev-plan <prompt> --reviewer-model <m>` | Pass a model override to pi |

There is no `--no-loop`, no `--reviewer`, no `--rounds 0`. The audit loop is enforced.

## Pre-flight

Ensure `plans/` directory exists. If not, create it:
```bash
mkdir -p plans/
```

## Flag Parsing

Parse flags from the invocation before anything else, then strip them from `USER_PROMPT`:

| Flag | Effect |
|------|--------|
| `--rounds N` | Set `MAX_ROUNDS` to integer `N >= 1` (default 3). Reject `N <= 0` |
| `--reviewer-model <m>` | Set `REVIEWER_MODEL` passthrough for pi |

Any other flag (`--loop`, `--no-loop`, `--reviewer`, `--rounds 0`) — reject with a one-line explanation that the loop and reviewer are enforced. Do not silently accept and skip.

## Workflow Overview

Work through these phases in order:

1. **Parse Requirements** — analyze USER_PROMPT to understand core problem and desired outcome
2. **Discover Source Document** — run Source Document Discovery if USER_PROMPT is free text
3. **Understand Codebase** — explore existing patterns, architecture, and relevant files directly
4. **Design Solution** — develop technical approach with architecture decisions and implementation strategy
5. **Plan phases** — structure the implementation into logical phases
6. **Document Plan** — write comprehensive markdown document following Plan Format
7. **Generate filename** — create descriptive kebab-case filename
8. **Save plan file** — write complete plan to PLAN_OUTPUT_DIRECTORY/<filename>.md
9. **Reviewer Audit Loop** — MANDATORY: pi audits the plan, you revise, repeat up to `MAX_ROUNDS`, exit early on zero Critical
10. **Validate** — verify plan completeness and coherence
11. **Report** — present completed plan summary (with loop outcome if the loop ran)

## Phase Details

### Phase 1: Parse Requirements

Analyze the USER_PROMPT to understand:
- What is the core problem or desired outcome?
- What type of task is this (feature|fix|refactor|enhancement|chore)?
- What is the complexity level (simple|medium|complex)?
- What constraints or requirements exist?

Ask clarifying questions if intent is not clear.

### Phase 2: Source Document Discovery

If USER_PROMPT is a file path, read that file directly as the source document.
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

Use `Read` and `Grep` tools to gather context. Do not use subagents for this phase.

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
- **Phase 1: Foundation** — any foundational work needed
- **Phase 2: Core Implementation** — the main implementation work
- **Phase 3: Integration & Polish** — integration, testing, and final touches

For simple tasks, phases may be combined. For complex tasks, add more phases as needed.

### Phase 6: Document Plan

Follow the Plan Format below to create a comprehensive implementation plan with all required sections.

### Phase 7: Generate Filename

Create a descriptive kebab-case filename based on the plan's main topic, e.g.:
- `feature-auth-jwt.md`
- `fix-session-timeout.md`
- `refactor-api-client.md`

### Phase 8: Save Plan File

Write the complete plan to `plans/<filename>.md`. Ensure:
- Plan is detailed enough that another developer could follow it
- Code examples or pseudo-code included where appropriate
- All edge cases and error handling addressed

### Phase 9: Reviewer Audit Loop (MANDATORY — runs every invocation)

This phase is **not optional**. Every `/dev-plan` invocation reaches Phase 9. The only way Phase 9 can end without running at least one full audit round is if the pi backend is genuinely unavailable (binary missing or all rounds fail) — see 9.8. "User did not pass a flag" is not a valid skip reason.

The Phase 8 draft is **round 0**. Run rounds 1..`MAX_ROUNDS`: pi audits the on-disk plan against the codebase and emits severity-tagged findings; you revise the plan; repeat. Exit as soon as a round produces zero Critical findings — the converging round's revision still addresses any remaining Warnings and cheap Notes inline before exit (no extra re-audit round).

Each round re-reads the revised plan from `plans/<feature>.md`, so **rounds are stateless** — no reviewer session continuity is needed. Reuse the reviewer *engine* inline (the mechanics below). Do **not** invoke the `/dev-review-pi` or `/dev-review-claude` skills — their interactive scope-verify / present / discuss steps would stall an automated loop.

Set `REPO_ROOT` once: `REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)`.

#### 9.0 Initialize state

Write `plans/.<feature>.state.yml` (schema in **State YAML Schema** below) with `current_round: 0`, `status: running`, `reviewer: pi`, empty `rounds: []`.

#### 9.1 Build the round prompt

Write the prompt to a temp file (`PROMPT_FILE=$(mktemp /tmp/devplan-prompt-XXXXXX.md)`).

**Round 1 (Challenge):**
```
Adversarially review the implementation plan at plans/<feature>.md for execution
risk. You have full read access to this repository — verify file paths, patterns,
dependencies, and feasibility against the actual code. Look for: missing edge
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
files — review only. After all findings, on a final line print exactly:
END_OF_FINDINGS
```

**Rounds 2+ (Re-review):** same format, but open with: `The plan at plans/<feature>.md was revised after a prior audit. Re-read it end-to-end and re-review against the codebase. For each prior issue, verify the revision genuinely addresses it rather than rewording it; then flag any NEW issues the revision introduced.` End with the same `END_OF_FINDINGS` sentinel instruction.

#### 9.2 Run the reviewer (pi)

`pi --print` gives clean, parseable stdout and does not stall on permission prompts. **Detach it with `setsid`, write the PID to a file, then poll the output file across separate Bash calls** — do not wrap in a blocking `timeout 600s` (a single blocking call can SIGKILL a slow review mid-thought and gives no live observability).

> Canonical backgrounded-`pi --print` reviewer engine. `/dev-review-pi` step 5a uses the same pattern — keep the two in sync if either changes.

**Launch (one synchronous Bash call — do NOT also set `run_in_background: true`):**

```bash
OUTPUT_FILE=$(mktemp /tmp/devplan-review-XXXXXX.txt)
PID_FILE=$(mktemp /tmp/devplan-review-pid-XXXXXX.txt)
PI_MODEL_ARGS=( --model "${REVIEWER_MODEL:-openai-codex/gpt-5.5}" )

# setsid puts pi in its own session/process group (PPID=1 after detach);
# < /dev/null protects against stdin/tty contention; shell & returns immediately.
(
  cd "$REPO_ROOT"
  setsid pi --print "${PI_MODEL_ARGS[@]}" \
    --append-system-prompt "You are an independent plan auditor. Review only; do not modify files." \
    "@$PROMPT_FILE" \
    > "$OUTPUT_FILE" 2>&1 < /dev/null &
  echo $! > "$PID_FILE"
)

# Sanity check: if pi is dead within 1s and wrote nothing, the launch failed
# (bad args, missing API key, etc.). Without this, downstream polls spin
# against an empty output file for the full budget while the harness reports
# the launcher as "completed".
sleep 1
PID=$(cat "$PID_FILE")
if ! kill -0 "$PID" 2>/dev/null && [ ! -s "$OUTPUT_FILE" ]; then
  echo "pi launch failed: process exited within 1s and produced no output" >&2
  cat "$OUTPUT_FILE" >&2 2>/dev/null
  exit 1
fi
echo "pi launched pid=$PID"
```

**Do NOT pass `run_in_background: true` on this Bash call.** The shell-level `setsid ... &` is the backgrounding mechanism; the launcher returns in ~1s. Combining the two with the old `... &; disown` pattern caused the harness to report `completed` while pi vanished — see `/tmp/handoff-mf7MKL.md` for the failure mode.

**Poll in separate Bash calls** — each call its own short invocation so the review stays observable. Stop when `$OUTPUT_FILE` contains `END_OF_FINDINGS` or `kill -0 $PID` fails. Surface a one-line progress note each poll. Do not block on a fixed long sleep.

#### 9.3 Parse findings

From `$OUTPUT_FILE`, extract findings by severity tag (`[CRITICAL]`/`[WARNING]`/`[NOTE]`), capturing verbatim text. Compute `critical_count`, `warning_count`, `note_count`. The `END_OF_FINDINGS` sentinel marks clean end-of-output; if it's missing, the output was truncated — record that and treat as a reviewer failure (9.8).

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

The revision in 9.5 already addressed remaining Warnings (by fix or by Note) and any cheap Notes. **No re-audit round is run** — exit immediately so the loop stops as soon as the reviewer reports no critical issues. If you intentionally dismissed a Warning without changing the plan, record the reasoning in `revision_summary`.

#### 9.7 Hard stop / loop back

If `current_round >= MAX_ROUNDS`: `status: hard_stopped`, `exit_reason: "Reached MAX_ROUNDS=<N>"` → exit loop, go to Validate. Otherwise loop back to 9.1 for the next round.

#### 9.8 Reviewer unavailable / failure

Detect before round 1 and on any round failure:
- **pi binary missing** (`which pi` empty), or **pi exits non-zero**, or **no sentinel / empty output / poll budget exhausted**.

In any of these: set `status: reviewer_unavailable`, record `exit_reason` with the cause, **keep the plan as-is**, and proceed to Validate. Do NOT fail the whole skill — an unaudited plan is still useful. Surface the failure in the Phase 11 report. (Phase 10 validation is the deterministic safety net when the loop couldn't run.)

### Phase 10: Validate

**Structural checks:**
- All required sections present
- Tasks are actionable and have stable [N.M] ID prefixes
- Traceability map correctly links #req-* tags to task IDs
- No missing dependencies between tasks
- Testing strategy is clear and complete

**Deterministic preflights** (mechanical, run independently of the audit loop — these catch concrete file/tool reality even when the reviewer missed it, and are the *primary* safety net when Phase 9 ran with `status: reviewer_unavailable`):
- **Validation Commands:** for each command in the plan's `## Validation Commands` section, parse out file paths and tool names. Verify referenced files exist on disk and tools are present (`which <tool>`). Anything missing → **Critical**.
- **Edit-target existence:** for each path the plan claims to modify (under `## Relevant Files` and inline in tasks), verify the file exists OR is explicitly listed under `### New Files`. A claimed-to-modify file that doesn't exist and isn't a new file → **Critical**.
- **Test paths:** if the plan references `tests/unit/`, `tests/integration/`, or `tests/e2e/`, verify those directories exist or are listed as new. Missing test infrastructure → **Warning**.
- **Prerequisite tools:** if the plan adds dependencies via `uv add`, `pnpm add`, etc., verify the package manager is installed. Missing → **Critical**.

If any preflight fails, surface the failures in the Phase 11 report. Treat Critical-level preflight failures as blocking — flag them for human review the same way as an unresolved loop. Record preflight failures under a `phase_10_findings` block in the state YAML (the loop always runs, so the state file always exists).

### Phase 11: Report

Present the completed plan summary and remind user to run `/dev-build` when ready. Always include the loop outcome — the loop runs every invocation. See the Report section below.

## Instructions

- **IMPORTANT**: If no USER_PROMPT is provided, stop and ask the user to provide it.
- Determine task type (chore|feature|refactor|fix|enhancement) and complexity (simple|medium|complex)
- Think deeply (ultrathink) about the best approach
- Follow the Plan Format below exactly
- Generate descriptive, kebab-case filename

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

Next Steps:
Run `/dev-build plans/<filename>.md` when ready to implement.
```

Always append the Loop Outcome block (the audit loop always runs):

```
Audit Loop (reviewer: pi)
- Rounds run: <N>/<MAX_ROUNDS>
- Exit reason: <converged | hard_stopped | reviewer_unavailable — detail>
- Final findings: <critical> critical / <warning> warning / <note> note
- State: plans/.<filename>.state.yml
```

If `status: reviewer_unavailable`, say so plainly — the plan is unaudited and Phase 10 validation was the only safety net.

## State YAML Schema

`plans/.<feature>.state.yml` — the loop's working memory and audit trail. Findings are stored **verbatim** so the trail can be reconstructed later.

```yaml
plan_file: plans/<feature>.md
prompt: "<original USER_PROMPT, flags stripped>"
reviewer: pi              # always pi
reviewer_model: null      # set when --reviewer-model given
max_rounds: 3
current_round: 2
status: running           # running | converged | hard_stopped | reviewer_unavailable
exit_reason: null         # filled when status != running
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
