# CreatePlan Workflow

Create a detailed implementation plan via an iterative Claude-plan ↔ Codex-audit loop. Claude drafts, Codex critiques against the codebase with severity-tagged findings, Claude revises. Loop runs up to 3 rounds, exiting earlier when no critical findings remain or the plan converges.

The canonical output is `plans/<feature>.md` — same format as before so downstream `/dev-shard`, `/dev-build`, `/dev-test` work unchanged. A sibling `plans/.<feature>.state.yml` carries verbatim Codex findings, severity tallies, and exit reason for later AI review.

## Variables

- `USER_PROMPT` — user's planning request
- `PLAN_OUTPUT_DIRECTORY` — `plans/`
- `SOURCE_DIRECTORIES` — search in priority order: `plans/` > `specs/` > `artifacts/plans/` > `artifacts/specs/`
- `TEST_DIR` — `tests/`
- `MAX_ROUNDS` — default 3, override with `--rounds N`
- `LOOP_ENABLED` — default true, set false with `--no-loop`
- `RESUME` — default false, set true with `--resume`

## Flag Parsing

Parse flags from the invocation before anything else:

| Flag | Effect |
|------|--------|
| `--rounds N` | Override max rounds (integer, default 3) |
| `--no-loop` | Skip the Codex audit loop entirely; produce single-pass plan |
| `--resume` | Resume from existing state YAML if one exists |

Strip flags from `USER_PROMPT` before processing.

## Pre-flight

Ensure `plans/` directory exists. If not, create it:
```bash
mkdir -p plans/
```

## Workflow Overview

1. **Parse Requirements** — analyze USER_PROMPT and flags
2. **Discover Source Document** — Source Document Discovery if USER_PROMPT is free text
3. **Vague Prompt Check** — if prompt is thin AND no source was found in step 2, ask clarifying questions
4. **Resume Detection** — check for existing state YAML
5. **Understand Codebase** — explore existing patterns
6. **Draft Initial Plan (Round 0)** — Claude writes first plan to disk
7. **Codex Audit Loop** — up to MAX_ROUNDS iterations of Codex critique + Claude revision
8. **Validate** — verify plan completeness
9. **Report** — present completed plan summary

If `--no-loop`, skip step 7 and go straight from step 6 to step 8.

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

1. List all `.md` files in `plans/`, `specs/`, `artifacts/plans/`, and `artifacts/specs/` sorted by modification date (most recent first)
2. If source documents exist, use `AskUserQuestion`: "Found source document: <filename>. Use this as the source for planning and traceability?"
   - Options: "Yes, use this document" / "No, just use my prompt" / "No, let me specify a different file"
3. If user confirms, read the source file and use it alongside USER_PROMPT for requirement tag scanning

## Phase 3: Vague Prompt Check

Only fires if Phase 2 did NOT find/accept a source document. A short prompt that points at an existing PRD (e.g. "plan the latest PRD") is fine on its own — Phase 2 has already loaded the rich context.

If USER_PROMPT is thin (under ~20 words AND Phase 2 produced no source document), invoke `AskUserQuestion` with 2-3 clarifying questions before drafting. Topics to probe:
- Scope boundaries (what's in / out)
- Constraints (existing systems to integrate with, technologies to use/avoid)
- Success criteria (what does "done" look like)

If USER_PROMPT is substantive (>20 words) OR Phase 2 attached a source document, skip this phase.

## Phase 4: Resume Detection

Generate the kebab-case feature name from USER_PROMPT (used for plan filename later). Check whether `plans/.<feature>.state.yml` already exists.

If state YAML exists, validate it before trusting it:

1. **Parse YAML.** If parsing fails, treat as malformed (see fallback below).
2. **Check required fields.** `plan_file`, `prompt`, `max_rounds`, `current_round`, `status`, `rounds` (list, may be empty). If any required field is missing or wrong type, treat as malformed.
3. **Cross-check `current_round` vs `rounds[]`.** `current_round` must equal `max(rounds[].round)` when `rounds` is non-empty (or 0 when empty). If they disagree, treat as inconsistent.

If validation passes:
- If `status: running` and `--resume` flag was passed: resume from `current_round + 1`
- If state exists but `--resume` flag was NOT passed: invoke `AskUserQuestion`:
  - "Existing loop state found for this feature (round N/M, status: <status>). Resume or restart?"
  - Options: "Resume from round N+1" / "Restart from scratch (overwrites state)" / "Cancel"
- Act on user choice

If validation FAILS (malformed YAML, missing fields, inconsistent counters) — likely caused by an interrupted mid-write or hand-edit — invoke `AskUserQuestion`:
- "State YAML at `plans/.<feature>.state.yml` is unreadable or inconsistent (reason: <one-line>). What now?"
- Options: "Restart from scratch (overwrites state)" / "Cancel and let me inspect the file" / "Show me the file then ask again"

Never silently proceed on bad state.

If no state exists, proceed normally (round 0 = initial draft).

## Phase 5: Understand Codebase

Explore the codebase directly with `Read` and `Grep` to understand:
- Existing patterns and architecture
- Relevant files for the task
- Dependencies and integrations
- Test structure and patterns

Do not use subagents for this phase.

## Phase 6: Draft Initial Plan (Round 0)

Think deeply (ultrathink) about the best approach. Document architecture decisions, edge cases, error handling, scalability concerns, and trade-offs.

Structure the implementation into logical phases (Foundation, Core Implementation, Integration & Polish — adapt to task complexity).

Write the plan to `plans/<feature>.md` following the **Plan Format** section below exactly. The format must be preserved across all rounds — downstream tools depend on `[N.M]` task IDs and `[T.N.M]` test IDs.

If `--no-loop` is set, skip directly to Phase 8 (Validate).

Otherwise, initialize the state YAML:

```yaml
plan_file: plans/<feature>.md
prompt: "<original USER_PROMPT>"
max_rounds: <MAX_ROUNDS>
current_round: 0
status: running
exit_reason: null
codex_session_id: null
rounds: []
```

Save to `plans/.<feature>.state.yml`.

## Phase 7: Codex Audit Loop

Run rounds 1 through MAX_ROUNDS. Each round:

### 7.1: Invoke Codex

Codex is invoked via the **`codex` CLI directly** (not the `/codex` skill wrapper, which is interactive and routes its own decisions). The CLI gives the loop deterministic prompts and clean session-id capture.

**Round 1 — Challenge mode (fresh session):**

Write the round 1 prompt to a temp file, then run from the repo root. **Pipe the prompt via stdin redirect** (`< file.txt`) rather than `"$(cat file.txt)"` arg expansion — see Note below.

```bash
cd <repo_root>
timeout 480 codex exec \
  --sandbox danger-full-access \
  -c model_reasoning_effort='"high"' \
  --skip-git-repo-check \
  < /tmp/codex_round1_prompt.txt \
  > /tmp/codex_round1_out.txt 2>&1
```

After completion, extract the session id from the output (line matching `session id: <uuid>`) and store it in the state YAML's `codex_session_id` field. This protects against `--last` ambiguity if multiple Codex sessions interleave.

**Rounds 2+ — Consult mode with session continuity:**

`codex exec resume` does NOT accept the `--sandbox` flag directly. Use the `-c` config override form, and pipe the prompt via stdin:

```bash
cd <repo_root>
timeout 480 codex exec resume <codex_session_id> \
  -c sandbox_mode='"danger-full-access"' \
  -c model_reasoning_effort='"high"' \
  < /tmp/codex_roundN_prompt.txt \
  > /tmp/codex_roundN_out.txt 2>&1
```

**Note on stdin redirect vs arg expansion:** Prompts containing em-dashes (`—`), smart quotes, or other non-ASCII characters can break shell quoting in `"$(cat ...)"` form, causing Codex to hang reading stdin until the timeout fires (`EXIT=124`). Stdin redirection bypasses the shell entirely and is robust to any prompt content. Always use `< file.txt`.

If the stored session id is unavailable, fall back to `codex exec resume --last`. With `--last`, the same `-c sandbox_mode` override applies — `--sandbox` as a flag is rejected.

**Codex prompt template (round 1, Challenge):**

```
Adversarially review this implementation plan for execution risk. Read the plan
file at plans/<feature>.md. You have full read access to the codebase — verify
file paths, patterns, dependencies, and feasibility against actual code in this
repository.

Look for: missing edge cases, infeasible approaches, second/third-order
consequences, conflicts with existing patterns, missing dependencies, hidden
assumptions, misunderstood requirements, gaps in test strategy. Be especially
critical of duplication or redundancy with existing files.

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
Do not invent problems. Do not be sycophantic. Be precise. After all findings,
on a final line, print exactly: "END_OF_FINDINGS"
```

The trailing `END_OF_FINDINGS` sentinel makes parsing robust against truncated output.

**Codex prompt template (round 2+, Consult):**

The resumed session already has prior context, so do NOT re-paste round-(N-1) findings — that wastes tokens and risks Codex confusing the new prompt with old data.

```
The plan at plans/<feature>.md has been revised in response to your round
<N-1> findings. Re-read the file end-to-end. For EACH finding you raised in
round <N-1>, evaluate whether the revision genuinely addresses it or merely
rewords it. Be especially skeptical of "addressed by removal" claims — verify
the removal is consistent across the whole plan.

Then identify any NEW issues introduced by the revision itself.

Use the same severity format ([CRITICAL]/[WARNING]/[NOTE]) and include a
Status line for each prior finding:
  Status: ADDRESSED | NOT_ADDRESSED | PARTIALLY_ADDRESSED — <reason>

After all findings, on a final line, print exactly: "END_OF_FINDINGS"
```

### 7.2: Handle Codex Unavailable

Three distinct failure modes to detect, in order:

1. **Codex CLI missing** — `which codex` returns nothing. State: `codex_unavailable`. Exit reason: `"Codex CLI missing — install with: npm install -g @openai/codex"`.
2. **Codex unauthenticated** — neither `$CODEX_API_KEY`, `$OPENAI_API_KEY`, nor `~/.codex/auth.json` is present. State: `codex_unavailable`. Exit reason: `"Codex unauthenticated — run codex login"`.
3. **Sandbox transport failure** — Codex itself returns a `[CRITICAL]` finding with text matching `bwrap.*loopback|RTM_NEWADDR|sandbox` AND no other findings, indicating its bundled bubblewrap can't set up sandboxing. The first round's output is the canary. **Recovery path:** retry the same round with `--sandbox danger-full-access` (round 1) or `-c sandbox_mode='"danger-full-access"'` (rounds 2+). Both bypass bwrap. If recovery succeeds, continue the loop normally and add a one-line note in the round entry: `recovery: "bypassed bwrap via danger-full-access sandbox mode"`. If recovery still fails, set `status: codex_sandbox_failed`, exit_reason includes the bwrap error text, and proceed to Phase 8.

In all three terminal cases (CLI missing, unauthed, sandbox unrecoverable), skip remaining rounds and proceed to Phase 8 with the plan as-is. Do NOT fail the whole workflow — the plan is still useful, just unaudited.

**Detection sketch (run before round 1):**

```bash
CODEX_BIN=$(which codex 2>/dev/null || echo "")
if [ -z "$CODEX_BIN" ]; then
  echo "STATUS=codex_unavailable REASON=missing"
elif ! ([ -n "$CODEX_API_KEY" ] || [ -n "$OPENAI_API_KEY" ] || [ -f "${CODEX_HOME:-$HOME/.codex}/auth.json" ]); then
  echo "STATUS=codex_unavailable REASON=unauthed"
else
  echo "STATUS=codex_ready"
fi
```

### 7.3: Parse Findings

Extract findings from Codex output by severity tag. Capture verbatim text. Compute counts: `critical_count`, `warning_count`, `note_count`.

### 7.4: Append Round to State

Set `current_round: <N>` at the top of this step (where `<N>` is the round number that just ran, starting from 1). Then append the round entry:

```yaml
current_round: <N>          # bumped at the start of this step, before append
rounds:
  - round: <N>
    codex_mode: challenge | consult
    findings:
      critical: <verbatim critical findings>
      warning: <verbatim warning findings>
      note: <verbatim note findings>
    counts: { critical: N, warning: N, note: N }
    plan_diff_pct: <will be filled after revision>
```

By the time we reach 7.5 / 7.7 / 7.8, `current_round` always reflects the round whose findings were just parsed. This eliminates the off-by-one risk in the hard-stop check.

### 7.5: Check Exit Criteria

If `round > 1` AND `critical_count == 0` AND every Warning from prior rounds is either resolved (no longer appearing) or was explicitly dismissed by Claude in the previous revision with reasoning recorded:
- Set `status: converged`
- Set `exit_reason: "No critical findings, prior warnings addressed"`
- Exit loop, proceed to Phase 8

(For round 1, never exit — Claude needs at least one revision pass before exit.)

### 7.6: Claude Revises Plan

Read the findings. Revise `plans/<feature>.md`:

- Address each `[CRITICAL]` finding by changing the plan
- Address each `[WARNING]` finding by either changing the plan OR adding a Decision/Note explaining why the warning is acceptable
- Consider `[NOTE]` findings; address only if cheap

The plan format must remain identical (section structure, `[N.M]` IDs, `[T.N.M]` test IDs).

Compute `plan_diff_pct` (lines changed / total lines × 100) between pre-revision and post-revision plan. Update the round entry in state YAML.

### 7.7: Diff-Convergence Safety Exit

Diff convergence is a **safety net**, not a clean pass. It only fires when the audit is also clean:

- `round > 1` AND
- `plan_diff_pct < 5` AND
- `critical_count == 0` AND
- every Warning from prior rounds is resolved or explicitly dismissed by Claude (same condition as 7.5)

If all four hold:
- Set `status: converged`
- Set `exit_reason: "Plan converged — diff <5% between rounds, no critical findings"`
- Exit loop, proceed to Phase 8

If `plan_diff_pct < 5` BUT `critical_count > 0` (Claude couldn't make Codex's revisions actually move the plan): this is a **stuck loop**, not convergence.
- Set `status: failed_stuck`
- Set `exit_reason: "Plan stuck — diff <5% but <N> critical findings remain unaddressed across rounds"`
- Exit loop, proceed to Phase 8 with the plan flagged for human review

### 7.8: Hard Stop

`current_round` carries the round number that just ran (set in 7.4 when the round entry is appended). After 7.7 has been evaluated, check:

If `current_round >= MAX_ROUNDS`:
- Set `status: hard_stopped`
- Set `exit_reason: "Reached MAX_ROUNDS=<N> hard cap"`
- Exit loop, proceed to Phase 7.9.

Otherwise loop back to 7.1 to start round `current_round + 1`. (No separate increment step — `current_round` is set at the top of each round in 7.4.)

### 7.9: Cleanup Codex Side-Effects

Codex sessions invoked from a repo with legacy project hooks (`SessionStart`, `UserPromptSubmit`, etc.) create stub PRD files under `artifacts/specs/<derived-from-prompt>/PRD.md` on every round. These are unrelated to the Plan workflow's outputs and accumulate noise.

After exiting the loop (whether via convergence, hard-stop, or codex_unavailable):

1. List `artifacts/specs/` for directories created within the loop's time window whose names match a slug derived from the round prompt (e.g. `adversarially-review-this-implementation-plan-fo`, `the-plan-at-plans-feature-*-md-ha`).
2. For each candidate, verify it contains only a single `PRD.md` whose body references the loop's plan filename — this prevents accidental deletion of legitimate PRD work.
3. Remove the verified candidates. Record the removed paths in the state YAML under `cleanup.removed_paths` for traceability.

If no candidates match, skip silently. If candidates match but verification fails (PRD references something else), leave them in place and log under `cleanup.skipped_paths`.

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

These checks are deterministic and run independently of the audit loop — they catch concrete file/tool reality even when Codex's review missed them. If the loop ran with `codex_unavailable` status, these preflights are the primary safety net.

If any check fails, log the failures in the state YAML's `phase_8_findings` block and surface them in the Phase 9 report. Critical-level preflight failures should be flagged for human review in the same way as `failed_stuck` from the loop.

## Phase 9: Report

Present the completed plan summary with loop outcome:

```
Implementation Plan Created

  File: plans/<feature>.md
  State: plans/.<feature>.state.yml
  Topic: <brief description>

  Loop Outcome:
  - Rounds run: <N>/<MAX_ROUNDS>
  - Exit reason: <exit_reason>
  - Final findings: <critical> critical / <warning> warning / <note> note

  Key Components:
  - <main component 1>
  - <main component 2>

  Next Steps:
  Run /dev-shard if plan is large, otherwise /dev-build to implement.
```

---

## Instructions

- **IMPORTANT**: If no USER_PROMPT is provided, stop and ask the user to provide it.
- Determine task type and complexity from USER_PROMPT.
- Think deeply (ultrathink) about the best approach.
- Follow the Plan Format below exactly — every round must produce a plan in this shape.
- Generate descriptive, kebab-case filename from the plan's main topic.

### Tag Propagation

If a source document (PRD, brainstorming output) is found via Source Document Discovery:
1. Scan it for `#req-[id]` patterns (e.g., `#req-user-login`, `#req-data-export`)
2. When generating the `## Step by Step Tasks` section, give each task item a **stable inline ID prefix** `[N.M]` and append the relevant `#req-[id]` tag
3. Format: `- [ ] [1.1] Implement login form #req-user-login`
4. The `[N.M]` prefix serves as a stable anchor for Test to match against when flipping checkboxes
5. Add a `## Traceability Map` section at the end showing `#req-[id]` -> Task IDs

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

`plans/.<feature>.state.yml` — the loop's working memory and AI-reviewable audit trail.

```yaml
plan_file: plans/<feature>.md
prompt: "<original USER_PROMPT>"
max_rounds: 3
current_round: 2
status: running          # running | converged | hard_stopped | failed_stuck | cancelled | codex_unavailable | codex_sandbox_failed | build_only | failed
exit_reason: null        # filled when status != running
codex_session_id: "<uuid captured from round 1 'session id:' line>"
started: "2026-04-29T15:00:00Z"
updated: "2026-04-29T15:12:00Z"
notes: []                # free-form pre-loop disambiguation context (e.g. "Phase 2 vague-prompt clarification chose option X")

rounds:
  - round: 1
    codex_mode: challenge
    started: "2026-04-29T15:01:00Z"
    findings:
      critical:
        - "[CRITICAL] <verbatim text>"
      warning:
        - "[WARNING] <verbatim text>"
      note:
        - "[NOTE] <verbatim text>"
    counts: { critical: 2, warning: 5, note: 3 }
    plan_diff_pct: 47.0
    revision_summary: "<one-paragraph description of changes Claude made>"
    recovery: null       # set to a short string when 7.2 sandbox-recovery fired (e.g. "bypassed bwrap via danger-full-access")

  - round: 2
    codex_mode: consult
    started: "2026-04-29T15:08:00Z"
    findings: { ... }
    counts: { critical: 0, warning: 2, note: 4 }
    plan_diff_pct: 12.3
    revision_summary: "..."
    recovery: null

cleanup:                 # populated by Phase 7.9 after loop exits
  removed_paths: []      # artifacts/specs/<slug> dirs deleted as Codex side-effects
  skipped_paths: []      # candidates that didn't pass verification — left in place

build_audits:            # populated by /dev-build's Phase 7.5 wave-end audits (one entry per audited wave)
  - wave: 1
    started: "2026-04-29T16:00:00Z"
    files_audited: ["src/foo.py", "tests/test_foo.py"]
    outcome: passed      # passed | auto_fixed | escalated_to_user | overridden | audit_skipped
    skip_reason: null    # set when outcome=audit_skipped: codex_unavailable | doc_only | zero_diff | codex_timeout | codex_failed | malformed_output
    error_excerpt: null  # set when skip_reason in {codex_failed, malformed_output, codex_timeout}: last ~50 lines of Codex output for debugging

    attempts:            # one entry per audit attempt — initial audit always present; second entry appears only when auto-fix-and-retry-and-re-audit fired
      - attempt: 1       # 1 = initial audit; 2 = post-fix re-audit
        kind: initial
        started: "2026-04-29T16:00:00Z"
        codex_exit: 0
        findings:
          critical: ["[CRITICAL] <verbatim with Affected files line>"]
          warning: ["[WARNING] <verbatim>"]
          note: ["[NOTE] <verbatim>"]
        counts: { critical: 1, warning: 1, note: 0 }
        # Only present on initial-attempt entries when outcome=auto_fixed:
        fix_summary: null
        files_edited: []          # union of Affected files across all Critical findings, edited in step 7.5.5.2
        validation_command: null  # what was run in step 7.5.5.3
        validation_passed: null   # bool

      - attempt: 2       # only appears when outcome=auto_fixed; reports the post-fix re-audit
        kind: post_fix_reaudit
        started: "2026-04-29T16:02:00Z"
        codex_exit: 0
        findings:
          critical: []
          warning: []
          note: ["[NOTE] No findings — diff looks correct."]
        counts: { critical: 0, warning: 0, note: 1 }
```

The findings sections must hold **verbatim Codex output text** so that an AI reviewing this state YAML later can fully reconstruct the audit trail without needing a separate audit markdown.

---

## Report

After the loop completes, present the report defined in Phase 9.
