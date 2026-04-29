# CreatePlan Workflow


## Contents

- [Variables](#variables)
- [Flag Parsing](#flag-parsing)
- [Pre-flight](#pre-flight)
- [Workflow Overview](#workflow-overview)
- [Phase 1: Parse Requirements](#phase-1-parse-requirements)
- [Phase 2: Vague Prompt Check](#phase-2-vague-prompt-check)
- [Phase 3: Source Document Discovery](#phase-3-source-document-discovery)
- [Phase 4: Resume Detection](#phase-4-resume-detection)
- [Phase 5: Understand Codebase](#phase-5-understand-codebase)
- [Phase 6: Draft Initial Plan (Round 0)](#phase-6-draft-initial-plan-round-0)
- [Phase 7: Claude Audit Loop](#phase-7-claude-audit-loop)
- [Phase 8: Validate](#phase-8-validate)
- [Phase 9: Report](#phase-9-report)
- [Instructions](#instructions)
  - [Tag Propagation](#tag-propagation)
- [Plan Format](#plan-format)
- [State YAML Schema](#state-yaml-schema)
- [Report](#report)

Create a detailed implementation plan via an iterative Codex ↔ Claude audit loop. Codex drafts, `claude -p` critiques against the codebase with severity-tagged findings, Codex revises. Loop runs up to 3 rounds, exiting earlier when no critical findings remain or the plan converges.

The canonical output is `artifacts/plans/<slug>/plan.md` — same format as prior `$dev-plan` so downstream `$dev-shard`, `$dev-build`, `$dev-test` work unchanged. A sibling `artifacts/plans/<slug>/state.yml` carries verbatim Claude findings, severity tallies, and exit reason for later AI review.

## Variables

- `USER_PROMPT` — user's planning request
- `PLAN_OUTPUT_DIRECTORY` — `artifacts/plans/<slug>/`
- `SOURCE_DIRECTORIES` — `artifacts/specs/` (PRDs) and `artifacts/plans/` (existing plans), recursive
- `TEST_DIR` — `tests/`
- `MAX_ROUNDS` — default 3, override with `--rounds N`
- `LOOP_ENABLED` — default true, set false with `--no-loop`
- `RESUME` — default false, set true with `--resume`

## Flag Parsing

Parse flags from the invocation before anything else:

| Flag | Effect |
|------|--------|
| `--rounds N` | Override max rounds (integer, default 3) |
| `--no-loop` | Skip the Claude audit loop entirely; produce single-pass plan |
| `--resume` | Resume from existing state YAML if one exists |

Strip flags from `USER_PROMPT` before processing.

## Pre-flight

Derive `SLUG` first (kebab-case feature name from the request or source PRD frontmatter), then ensure the canonical plan directory exists:
```bash
mkdir -p "artifacts/plans/${SLUG}"
```

## Workflow Overview

Work through these 9 phases in order:

1. **Parse Requirements** — analyze USER_PROMPT and flags
2. **Discover Source Document** — Source Document Discovery if USER_PROMPT is free text
3. **Vague Prompt Check** — if prompt is thin AND no source was found in step 2, ask clarifying questions
4. **Resume Detection** — check for existing state YAML
5. **Understand Codebase** — explore existing patterns
6. **Draft Initial Plan (Round 0)** — Codex writes first plan to disk
7. **Claude Audit Loop** — up to MAX_ROUNDS iterations of Claude critique + Codex revision
8. **Validate** — verify plan completeness
9. **Report** — present completed plan summary

If `--no-loop`, skip Phase 7 and go straight from Phase 6 to Phase 8.

---

## Phase 1: Parse Requirements

Analyze USER_PROMPT to understand:
- Core problem or desired outcome
- Task type (feature|fix|refactor|enhancement|chore)
- Complexity (simple|medium|complex)
- Constraints or requirements

## Phase 2: Source Document Discovery

If USER_PROMPT is a file path, read that file directly as the source document.

If USER_PROMPT is free text (not a path), check for a source document using the standardized directory search order:

1. List plan and PRD files under `artifacts/plans/` and `artifacts/specs/` (recursive) sorted by modification date (most recent first)
2. If source documents exist, ask the user: "Found source document: <filename>. Use this as the source for planning and traceability?"
   - Options: "Yes, use this document" / "No, just use my prompt" / "No, let me specify a different file"
3. If user confirms, read the source file and use it alongside USER_PROMPT for requirement tag scanning

## Phase 3: Vague Prompt Check

Only fires if Phase 2 did NOT find/accept a source document. A short prompt that points at an existing PRD (e.g. "plan the latest PRD") is fine on its own — Phase 2 has already loaded the rich context.

If USER_PROMPT is thin (under ~20 words AND Phase 2 produced no source document), ask the user 2-3 clarifying questions before drafting. Topics to probe:
- Scope boundaries (what's in / out)
- Constraints (existing systems to integrate with, technologies to use/avoid)
- Success criteria (what does "done" look like)

If USER_PROMPT is substantive (>20 words) OR Phase 2 attached a source document, skip this phase.

## Phase 4: Resume Detection

After deriving SLUG, check whether `artifacts/plans/<slug>/state.yml` already exists.

If state YAML exists, validate it before trusting it:

1. **Parse YAML.** If parsing fails, treat as malformed (see fallback below).
2. **Check required fields.** `plan_file`, `prompt`, `max_rounds`, `current_round`, `status`, `rounds` (list, may be empty). If any required field is missing or wrong type, treat as malformed.
3. **Cross-check `current_round` vs `rounds[]`.** `current_round` must equal `max(rounds[].round)` when `rounds` is non-empty (or 0 when empty). If they disagree, treat as inconsistent.

If validation passes:
- If `status: running` and `--resume` flag was passed: resume from `current_round + 1`
- If state exists but `--resume` flag was NOT passed: ask the user:
  - "Existing loop state found for this feature (round N/M, status: <status>). Resume or restart?"
  - Options: "Resume from round N+1" / "Restart from scratch (overwrites state)" / "Cancel"
- Act on user choice

If validation FAILS (malformed YAML, missing fields, inconsistent counters) — likely caused by an interrupted mid-write or hand-edit — ask the user:
- "State YAML at `artifacts/plans/<slug>/state.yml` is unreadable or inconsistent (reason: <one-line>). What now?"
- Options: "Restart from scratch (overwrites state)" / "Cancel and let me inspect the file" / "Show me the file then ask again"

Never silently proceed on bad state.

If no state exists, proceed normally (round 0 = initial draft).

## Phase 5: Understand Codebase

Explore the codebase directly with `read` and `search` to understand:
- Existing patterns and architecture
- Relevant files for the task
- Dependencies and integrations
- Test structure and patterns

Do not use subagents for this phase.

## Phase 6: Draft Initial Plan (Round 0)

Think deeply (think carefully) about the best approach. Document architecture decisions, edge cases, error handling, scalability concerns, and trade-offs.

Structure the implementation into logical phases (Foundation, Core Implementation, Integration & Polish — adapt to task complexity).

Write the plan to `artifacts/plans/<slug>/plan.md` following the **Plan Format** section below exactly. The format must be preserved across all rounds — downstream tools depend on `[N.M]` task IDs and `[T.N.M]` test IDs.

If `--no-loop` is set, skip directly to Phase 8 (Validate).

Otherwise, initialize the state YAML at `artifacts/plans/<slug>/state.yml`:

```yaml
plan_file: artifacts/plans/<slug>/plan.md
prompt: "<original USER_PROMPT>"
max_rounds: <MAX_ROUNDS>
current_round: 0
status: running
exit_reason: null
claude_mode_args: null   # set after auth probe in Phase 7
rounds: []
```

## Phase 7: Claude Audit Loop

Run rounds 1 through MAX_ROUNDS. Each round invokes `claude -p` to adversarially audit the plan against the codebase, parses severity-tagged findings, and lets Codex revise.

### 7.1: Check Claude availability

```bash
CLAUDE_BIN=$(which claude 2>/dev/null || echo "")
[ -z "$CLAUDE_BIN" ] && echo "NOT_FOUND" || echo "FOUND: $CLAUDE_BIN"
```

If `NOT_FOUND`: handle per Phase 7.2.

### 7.2: Handle Claude unavailable

If `claude` CLI is not installed, or both auth probes fail (Step 7.3), or every audit invocation fails/times out:
- Set `status: claude_unavailable` in state YAML
- Set `exit_reason: "claude CLI missing or unauthenticated — plan delivered without audit loop"`
- Skip remaining rounds, proceed to Phase 8
- Note inline in the report: "Claude CLI not available for second opinion — install with `npm install -g @anthropic-ai/claude-code` or check auth"

### 7.3: Auth probe (run once before round 1)

Use the same bounded probe pattern that `$dev-review` uses (see `~/.codex/skills/dev-review/references/deep-review.md` Phase 4 Step 12). Prefer `--bare`; fall back to non-bare for OAuth/keychain users.

```bash
CLAUDE_AUTH_PROBE="Reply with CLAUDE_AUTH_OK only."
CLAUDE_MODE_ARGS="--bare"

if timeout 45s claude --bare -p \
  --no-session-persistence \
  --output-format text \
  --tools "" \
  --permission-mode dontAsk \
  "$CLAUDE_AUTH_PROBE" < /dev/null; then
  CLAUDE_MODE_ARGS="--bare"
elif timeout 90s claude -p \
  --no-session-persistence \
  --output-format text \
  --tools "" \
  --permission-mode dontAsk \
  "$CLAUDE_AUTH_PROBE" < /dev/null; then
  CLAUDE_MODE_ARGS=""
else
  echo "CLAUDE_NOT_READY"
fi
```

Persist the resolved `CLAUDE_MODE_ARGS` to `claude_mode_args` in state YAML so subsequent rounds reuse the same mode.

If both probes fail, treat as unavailable per Step 7.2.

If a probe times out, kill the spawned process before retrying or skipping. Do not leave a hanging `claude` session running. `Not logged in · Please run /login` after a bare probe usually means OAuth/keychain auth and the non-bare fallback should succeed.

### 7.4: Build the Claude context packet (per round)

Pass Claude enough context to review independently without rediscovering the entire conversation. Keep it compact and explicit. The packet structure mirrors the contract in `dev-review/references/deep-review.md` Step 13:

- Review intent: "Adversarially audit this implementation plan for execution risk."
- Plan content: full text of `artifacts/plans/<slug>/plan.md`.
- Source PRD content (if one exists).
- Detected stack/framework/test setup.
- Repository state: `git status --short`, `git diff --stat HEAD` if applicable.
- Selected file contents needed to verify claims in the plan (paths the plan references).
- For round 2+: the **prior round's findings verbatim**, labeled "Prior round findings — verify which were addressed and which Codex only reworded."
- Severity rubric (see Step 7.5).
- Constraints: review only, do not modify files; focus on bugs, regressions, security, data integrity, performance, missing tests, infeasible approaches.

Redact secrets, credentials, tokens, DSNs, API keys, cookies, and unrelated private data before constructing the packet. If the packet is too large, summarize low-risk boilerplate; keep the exact functions, config blocks, and tests that the plan touches.

### 7.5: Run Claude audit (round N)

Use non-interactive print mode, disable tools by default, pass the context packet on stdin via heredoc or process file. Always wrap in `timeout`. Reuse `CLAUDE_MODE_ARGS` from the auth probe.

```bash
timeout 180s claude $CLAUDE_MODE_ARGS -p \
  --model opus \
  --effort high \
  --no-session-persistence \
  --output-format text \
  --permission-mode dontAsk \
  --tools "" < "$CLAUDE_PROMPT_FILE"
```

If the audit needs Claude to read additional repo files beyond what the packet contains, a second attempt can enable read-only tools — same pattern as `dev-review/references/deep-review.md` Step 14:

```bash
timeout 180s claude $CLAUDE_MODE_ARGS -p \
  --model opus \
  --effort high \
  --no-session-persistence \
  --output-format text \
  --permission-mode dontAsk \
  --tools "Read,Grep,Glob,Bash(git status *),Bash(git diff *),Bash(git rev-parse *)" \
  --disallowedTools "Edit,Write,MultiEdit,NotebookEdit,Bash(git reset *),Bash(git checkout *),Bash(rm *)" \
  --add-dir "$PWD" < "$CLAUDE_PROMPT_FILE"
```

Prefer the no-tools first attempt — it's faster, cheaper, and removes a class of risks. Only escalate to read-only tools when the no-tools pass returns "I cannot verify X without reading file Y" or similar.

**Prompt template (round 1):**

```text
You are adversarially reviewing an implementation plan that Codex just drafted.
Goal: catch execution risk before any code is written.

Review only. Do not edit files.

Plan content:
<verbatim contents of artifacts/plans/<slug>/plan.md>

Source PRD (if any):
<verbatim PRD or "none">

Detected stack/framework:
<stack summary>

Repository state:
<git status --short and git diff --stat HEAD output>

Files the plan references:
<paths and relevant excerpts>

Look for: missing edge cases, infeasible approaches, second/third-order
consequences, conflicts with existing patterns, missing dependencies,
hidden assumptions, misunderstood requirements, gaps in test strategy.

Output every finding with a severity tag in this exact format:

[CRITICAL] <one-line summary>
  Detail: <evidence and reasoning>
  Suggested fix: <concrete recommendation>

[WARNING] <one-line summary>
  Detail: <evidence and reasoning>
  Suggested fix: <concrete recommendation>

[NOTE] <one-line summary>
  Detail: <evidence and reasoning>

Severity definitions:
  CRITICAL = will cause execution failure or wrong behavior
  WARNING  = significant risk or gap, but plan can proceed with mitigation
  NOTE     = minor concern, worth considering, not blocking

If the plan is genuinely solid, return findings only at NOTE level or below.
Do not invent problems. Do not be sycophantic. Be precise.
```

**Prompt template (rounds 2+):**

```text
You previously reviewed this plan in round <N-1> and identified these findings:

<verbatim findings from previous round>

The plan has been revised. Re-read the plan below and:

1. For each previous CRITICAL/WARNING: did Codex actually address it, or
   just reword? If addressed, say so. If not, re-flag at original severity.
2. Identify any NEW issues introduced by the revision.

Plan content (revised):
<verbatim contents of artifacts/plans/<slug>/plan.md>

Files the plan references:
<paths and relevant excerpts>

Use the same [CRITICAL]/[WARNING]/[NOTE] severity format. Be especially
skeptical of findings that look "addressed" but actually aren't.
```

### 7.6: Parse findings

Extract findings from Claude output by severity tag. Capture verbatim text. Compute counts: `critical_count`, `warning_count`, `note_count`.

### 7.7: Append round to state

Set `current_round: <N>` at the top of this step (where `<N>` is the round number that just ran, starting from 1). Then append the round entry:

```yaml
current_round: <N>          # bumped at the start of this step, before append
rounds:
  - round: <N>
    started: "<ISO timestamp>"
    findings:
      critical:
        - "[CRITICAL] <verbatim text>"
      warning:
        - "[WARNING] <verbatim text>"
      note:
        - "[NOTE] <verbatim text>"
    counts: { critical: N, warning: N, note: N }
    plan_diff_pct: <will be filled after revision>
    revision_summary: <will be filled after revision>
```

By the time we reach 7.8 / 7.10 / 7.11, `current_round` always reflects the round whose findings were just parsed. This eliminates the off-by-one risk in the hard-stop check.

### 7.8: Check exit criteria

If `round > 1` AND `critical_count == 0` AND every Warning from prior rounds is either resolved (no longer appearing) or was explicitly dismissed by Codex in the previous revision with reasoning recorded:
- Set `status: converged`
- Set `exit_reason: "No critical findings, prior warnings addressed"`
- Exit loop, proceed to Phase 8

(For round 1, never exit — Codex needs at least one revision pass before exit.)

### 7.9: Codex revises plan

Read the findings. Revise `artifacts/plans/<slug>/plan.md`:

- Address each `[CRITICAL]` finding by changing the plan
- Address each `[WARNING]` finding by either changing the plan OR adding a Decision/Note explaining why the warning is acceptable
- Consider `[NOTE]` findings; address only if cheap

The plan format must remain identical (section structure, `[N.M]` IDs, `[T.N.M]` test IDs).

Compute `plan_diff_pct` (lines changed / total lines × 100) between pre-revision and post-revision plan. Update the round entry in state YAML with the diff and a one-paragraph `revision_summary`.

### 7.10: Diff-convergence safety exit

Diff convergence is a **safety net**, not a clean pass. It only fires when the audit is also clean:

- `round > 1` AND
- `plan_diff_pct < 5` AND
- `critical_count == 0` AND
- every Warning from prior rounds is resolved or explicitly dismissed (same condition as 7.8)

If all four hold:
- Set `status: converged`
- Set `exit_reason: "Plan converged — diff <5% between rounds, no critical findings"`
- Exit loop, proceed to Phase 8

If `plan_diff_pct < 5` BUT `critical_count > 0` (Codex couldn't make Claude's revisions actually move the plan): this is a **stuck loop**, not convergence.
- Set `status: failed_stuck`
- Set `exit_reason: "Plan stuck — diff <5% but <N> critical findings remain unaddressed across rounds"`
- Exit loop, proceed to Phase 8 with the plan flagged for human review

### 7.11: Hard stop

`current_round` carries the round number that just ran (set in 7.7 when the round entry is appended). After 7.10 has been evaluated, check:

If `current_round >= MAX_ROUNDS`:
- Set `status: hard_stopped`
- Set `exit_reason: "Reached MAX_ROUNDS=<N> hard cap"`
- Exit loop, proceed to Phase 8

Otherwise loop back to 7.4 to start round `current_round + 1`. (No separate increment step — `current_round` is set at the top of each round in 7.7.)

## Phase 8: Validate

**Structural validation** (cheap, mechanical):
- All required Plan Format sections present
- Tasks have stable `[N.M]` ID prefixes
- Tests have stable `[T.N.M]` ID prefixes
- Traceability map correctly links `#req-*` tags to task IDs (if PRD source had tags)
- No missing dependencies between tasks

**Local feasibility preflights** (deterministic, do not rely on the audit loop alone):
- **Validation Commands:** for each command in the `## Validation Commands` section, parse out file paths and tool names. Verify referenced files exist on disk. Verify tools are present (`which <tool>`). Anything missing → flag at Critical.
- **Edit-target existence:** for each path the plan claims to modify (under `## Relevant Files` and inline in tasks), verify the file exists OR is explicitly listed under `### New Files`. A claimed-to-modify file that doesn't exist and isn't a new file → Critical.
- **Test paths:** if the plan references `tests/unit/`, `tests/integration/`, or `tests/e2e/`, verify those directories exist or are listed as new. Missing test infrastructure → Warning.
- **Prerequisite tools:** if the plan adds dependencies via `uv add`, `pnpm add`, etc., verify the package manager is installed. Missing → Critical.

These checks are deterministic and run independently of the audit loop — they catch concrete file/tool reality even when Claude's review missed them. If the loop ran with `claude_unavailable` status, these preflights are the primary safety net.

If any check fails, log the failures in the state YAML's `phase_8_findings` block and surface them in the Phase 9 report. Critical-level preflight failures should be flagged for human review in the same way as `failed_stuck` from the loop.

## Phase 9: Report

Present the completed plan summary with loop outcome:

```
Implementation Plan Created

  File: artifacts/plans/<slug>/plan.md
  State: artifacts/plans/<slug>/state.yml
  Topic: <brief description>

  Loop Outcome:
  - Rounds run: <N>/<MAX_ROUNDS>
  - Exit reason: <exit_reason>
  - Final findings: <critical> critical / <warning> warning / <note> note

  Key Components:
  - <main component 1>
  - <main component 2>

  Next Steps:
  Run $dev-shard if plan is large, otherwise $dev-build to implement.
```

---

## Instructions

- **IMPORTANT**: If no USER_PROMPT is provided, stop and ask the user to provide it.
- Determine task type (chore|feature|refactor|fix|enhancement) and complexity (simple|medium|complex).
- Think deeply (think carefully) about the best approach.
- Follow the Plan Format below exactly — every round must produce a plan in this shape.
- Generate descriptive, kebab-case `SLUG` from the plan's main topic.

### Tag Propagation

If a source document (PRD, brainstorming output) is found via Source Document Discovery:
1. Scan it for `#req-[id]` patterns (e.g., `#req-user-login`, `#req-data-export`)
2. When generating the `## Step by Step Tasks` section, give each task item a **stable inline ID prefix** `[N.M]` and append the relevant `#req-[id]` tag
3. Format: `- [ ] [1.1] Implement login form #req-user-login`
4. The `[N.M]` prefix serves as a stable anchor for Test to match against when flipping checkboxes
5. Add a `## Traceability Map` section at the end showing `#req-[id]` -> task IDs

If no `#req-[id]` tags exist, skip tag propagation (graceful degradation).

---

## Plan Format

Follow this format exactly. **The format must not change between rounds — downstream parsers depend on it.**

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
IMPORTANT: Execute every step in order when running manually. Build will parallelize independent groups automatically.

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

**Optional parallelism annotations** (append to any `### N.` header when Build's heuristics would be wrong):
- `[parallel-safe]` — explicitly safe to run concurrently with other groups in the same phase, even if files overlap
- `[sequential]` — must run alone in its own wave regardless of other signals

Examples:
### 3. Build API Layer [parallel-safe]
### 5. Run Database Migration [sequential]

If no annotations are present, Build infers parallelism from phase boundaries, dependency language, and file overlap.

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
<clear, single statement of what testing must accomplish - this becomes the completion criteria for Test>
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

---

## State YAML Schema

`artifacts/plans/<slug>/state.yml` — the loop's working memory and AI-reviewable audit trail.

```yaml
plan_file: artifacts/plans/<slug>/plan.md
prompt: "<original USER_PROMPT>"
max_rounds: 3
current_round: 2
status: running          # running | converged | hard_stopped | cancelled | claude_unavailable | failed
exit_reason: null        # filled when status != running
claude_mode_args: "--bare"  # resolved by auth probe in Phase 7.3, reused across rounds
started: "2026-04-29T16:00:00Z"
updated: "2026-04-29T16:12:00Z"

rounds:
  - round: 1
    started: "2026-04-29T16:01:00Z"
    findings:
      critical:
        - "[CRITICAL] <verbatim text>"
      warning:
        - "[WARNING] <verbatim text>"
      note:
        - "[NOTE] <verbatim text>"
    counts: { critical: 2, warning: 5, note: 3 }
    plan_diff_pct: 47.0
    revision_summary: "<one-paragraph description of changes Codex made>"

  - round: 2
    started: "2026-04-29T16:08:00Z"
    findings: { ... }
    counts: { critical: 0, warning: 2, note: 4 }
    plan_diff_pct: 12.3
    revision_summary: "..."
```

The findings sections must hold **verbatim Claude output text** so that an AI reviewing this state YAML later can fully reconstruct the audit trail without needing a separate audit markdown.

---

## Report

After the loop completes, present the report defined in Phase 9.
