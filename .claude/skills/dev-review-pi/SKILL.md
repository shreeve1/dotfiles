---
disable-model-invocation: true
name: dev-review-pi
description: Independent code review using Pi Coding Agent as the reviewer. USE WHEN user says "dev-review-pi", "/skill:dev-review-pi", "independent Pi review", or wants a Pi-powered second-opinion review of a plan, build (uncommitted diff), file/directory path, or proposal. Default reviewer model: `cliproxy/claude-opus-4-8`. Accepts optional `--model <pattern>`, `--provider <name>`, `--opus`, `--sonnet`, or `--claude` model flags and a target argument (`plan`, `build`, `proposal`, or a path).
---

# Dev Review Pi (Pi Coding Agent-Powered)

Independent review using a fresh Pi Coding Agent invocation as the reviewer. The primary agent extracts the review target from conversation context, gathers surrounding codebase context, writes a structured brief, and sends it to `pi --print`.

Pi runs with its normal default tools, extensions, skills, prompt templates, and context loading, as if launched directly by the user. The reviewer is instructed to stay review-only; the primary agent verifies the working tree after review, then applies the reviewer's findings autonomously — no human-in-the-loop gate. Drift and primary-agent disagreements are recorded in the report, not used as pause points.

This skill is the single source of truth for `dev-review-pi`. Invoke it with `/skill:dev-review-pi`.

## Variables

TARGET: $1 — (Optional) One of:
- `plan` — most recent plan file on disk
- `build` — uncommitted git changes
- `proposal` (aliases: `idea`, `context`) — an inline proposal/approach/snippet from the current conversation, even if nothing has been written to disk yet
- An explicit file or directory path
- Omitted — **review the last turn.** Default: take the most recent user+assistant exchange (the user's last message AND your reply as one pair) and review that pair as an inline proposal. Route it through the proposal-review path (Phase 2 "proposal reviews"). Only fall back to asking the user if there is no prior exchange in the conversation.

PI_MODEL_ARGS: Optional Pi model selector array from the raw arguments:
- `--model <pattern>` — pass through to Pi as `("--model" "<pattern>")`
- `--provider <name>` — pass through to Pi as `("--provider" "<name>")`
- `--claude` or `--opus` — set to `("--model" "opus")`
- `--sonnet` — set to `("--model" "sonnet")`
- Omitted — `("--model" "cliproxy/claude-opus-4-8")` (skill default)
- Multiple conflicting model flags present — ask the user to choose one before running the reviewer

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Extract review target** — identify what to review from conversation context or argument (file, plan, build diff, OR inline proposal)
2. **Gather surrounding context** — read related files, conventions, plans
3. **Build review brief** — assemble structured context document
4. **Run Pi review** — execute `pi --print` with the bounded review brief and normal Pi defaults
5. **Parse findings** — extract structured findings from reviewer output
6. **Apply findings** — implement all reviewer findings autonomously, then report
7. **Verify changes** — detect & run the project's test/lint command once, report pass/fail (does not block)

## Instructions

- **Context assembly is the critical step.** The value of this skill is in what context the reviewer receives. Be thorough — read related files, conventions, the plan (if any), tests, configs.
- **Don't pre-review.** Your job is to gather, not filter. Pass raw context and let the reviewer form independent opinions.
- **Reviewer runs as normal Pi.** Use `pi --print` with prompt content in a temp file referenced as `@$PROMPT_FILE`. Do not apply tool allowlists, context suppressions, extension suppressions, or permission restrictions. `--exclude-tools` is not available on Pi 0.73.1; keep normal tools/extensions and rely on the review-only prompt plus drift detection.
- **Review-only by instruction, not by permission.** Pi keeps normal default capabilities; the primary agent must compare working-tree status before and after the review.
- **Apply findings autonomously.** Parse the reviewer's findings and implement them directly. No confirm gate, no discussion round.
- **Record disagreements, don't gate on them.** Where the primary agent disagrees with a finding, apply it anyway (autonomous mode) and note the disagreement in the report so the user sees it after the fact.

## Workflow

### Phase 1: Extract

1. **Extract Review Target**

   First parse model selector flags from the raw arguments:
   - If `--model <pattern>` is present, set `PI_MODEL_ARGS` to `("--model" "<pattern>")`
   - If `--provider <name>` is present, append `("--provider" "<name>")`
   - If `--claude` or `--opus` is present, set `PI_MODEL_ARGS` to `("--model" "opus")`
   - If `--sonnet` is present, set `PI_MODEL_ARGS` to `("--model" "sonnet")`
   - If `--gpt` is present, explain that Pi supports many providers; ask the user for an explicit `--model <provider/model>` or `--provider <name> --model <pattern>`
   - If multiple conflicting model flags are present, ask the user which reviewer model to use and stop until they answer
   - If no model/provider flags are present, set `PI_MODEL_ARGS` to `("--model" "cliproxy/claude-opus-4-8")` (skill default)
   - Remove model/provider flags from the argument string before interpreting TARGET

   Scan the conversation context for:
   - File paths that were discussed, modified, or created
   - Plan content (from `/dev-plan` or plan files)
   - Build output or git diffs
   - **Inline proposals** — code snippets, design approaches, architectural sketches, or solutions you proposed in chat that the user wants double-checked, even if not yet written to disk
   - Any explicit TARGET argument

   If TARGET argument is provided:
   - `plan` — find the most recent plan file (search `plans/`, `specs/`, then `artifacts/plans/` — matching dev-plan, dev-build, dev-test conventions; ask if ambiguous)
   - `build` — use uncommitted git changes
   - `proposal` (aliases: `idea`, `context`) — review an inline proposal from the current conversation. Extract the most recent concrete suggestion (snippet, approach, design) from your chat history. If multiple candidates exist, ask the user to pick. The proposal is the *content under review* — not a file on disk.
   - File path — read that file
   - Directory — scan and select key files

   If no TARGET argument: **review the last turn.** Take the most recent user+assistant exchange — the user's last message AND your reply — as one pair, and treat that pair as an inline proposal (route through the proposal-review path). Do NOT ask the user what to review when a prior exchange exists. Only ask if the conversation has no prior exchange to review.

### Phase 2: Gather and Build Brief

2. **Gather Surrounding Context**

   Based on the review target, read:

   **Always:**
   - Project conventions (CLAUDE.md, AGENTS.md if present, linting configs, tsconfig, etc.)
   - Stack detection — languages, frameworks, key dependencies

   **For plan / context reviews (default):**
   - The plan file (or session context summary)
   - PRD or requirements documents if available
   - Existing code that the plan will modify or interact with
   - Conventions and constraints established earlier in the conversation

   **For build reviews:**
   - Run `git status` to capture all changes (tracked + untracked), then `git diff` and `git diff --staged` for details
   - **Preflight check:** if working tree is clean, report "nothing to review" and stop. Otherwise review all uncommitted changes as-is — autonomous mode reviews the whole diff, no "unrelated changes" filter.
   - The plan the build was based on (if available)
   - Test files for modified code
   - Files that import or depend on changed files

   **For file/directory reviews:**
   - Imports and dependencies of the target files
   - Test files for the target
   - Files that import the target

   **For proposal reviews (inline content):**
   - The proposal itself (pasted verbatim into the brief — be faithful, do not rewrite or "improve" it)
   - The problem the proposal is intended to solve (extracted from conversation)
   - Any constraints, requirements, or decisions established earlier in the conversation
   - Existing files the proposal would touch or interact with (if any are knowable)
   - If the proposal is purely abstract (no target codebase): skip "related code" and let the reviewer review on first principles. Note this explicitly in the brief.

   **Keep context focused.** Include summaries for large files, full content for small ones. Target a brief under ~8K lines total. If the brief exceeds this, summarize older/larger files and focus on the most relevant excerpts. Pi can inspect the repo with its normal tools, but the brief should still contain the review target and key context.

3. **Build Review Brief**

   Assemble a structured brief. This is what the reviewer receives.

   ```markdown
   # Review Brief

   ## Review Type
   [Plan/Context Review | Build Review | Code Review | Proposal Review]

   ## Project Context
   - Stack: [languages, frameworks, key deps]
   - Conventions: [naming patterns, project rules, CLAUDE.md highlights]
   - Working directory: [project root path]

   ## What's Being Reviewed

   [The actual content — plan document, git diff, file contents, or inline proposal]

   ## Related Code

   [For each related file: path, role, key excerpts]

   ## Review Instructions

   You are an independent reviewer running in a fresh Pi Coding Agent session with normal Pi capabilities. Review only — DO NOT modify any files. The primary agent will apply changes derived from your findings later.

   Analyze for:
   - Gaps and missing considerations
   - Technical risks (failure modes, edge cases, performance, security)
   - Completeness (error handling, test coverage, documentation)
   - Best practices for the detected stack
   - Architectural concerns or pattern violations
   - Assumptions that may not hold

   Format your response as a structured list. For each finding, use this exact format:
   - **[Critical|Warning|Note]:** <one-line summary> — <file:line reference if applicable>. <explanation and suggested resolution>

   This format is required for automated parsing. Do not use freeform paragraphs for findings.
   ```

### Phase 3: Run Pi Reviewer

Launch and poll the reviewer via the backgrounded-`pi --print` engine at `~/.claude/skills/_shared/pi-reviewer-engine.md` — the single source for the `setsid` detach, PID-file persistence, 1s launch-failure check, and the separate-call poll loop. This step wires the caller-specific params and drift detection; the engine owns the mechanics.

4. **Execute Pi Review**

   **Determine project root** (assign it to `$PROJECT_ROOT`, which the engine and every later step reference — shell vars don't persist across separate bash calls, so carry the literal):
   ```bash
   PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
   ```
   - If the target IS inside a git repo: use the repo root.
   - If the target is NOT inside a git repo: set `PROJECT_ROOT` to the target's parent directory. Only `plan`, `proposal`, and `file` reviews work outside repos — **reject `build` reviews for non-git targets** and fall back to file review instead.
   - Derive `$PROJECT_ROOT` from the review target's location, not `pwd`.

   **Write the review brief and prompt to temp files:**
   ```bash
   REVIEW_FILE=$(mktemp /tmp/pi-review-XXXXXX.md)
   PROMPT_FILE=$(mktemp /tmp/pi-review-prompt-XXXXXX.md)
   OUTPUT_FILE=$(mktemp /tmp/pi-review-output-XXXXXX.txt)
   PID_FILE=$(mktemp /tmp/pi-review-pid-XXXXXX.txt)
   BASE_STATUS_FILE=$(mktemp /tmp/pi-review-status-before-XXXXXX.txt)
   AFTER_STATUS_FILE=$(mktemp /tmp/pi-review-status-after-XXXXXX.txt)
   SNAP_DIR=$(mktemp -d /tmp/pi-review-snap-XXXXXX)
   DONE_NONCE="$(date +%s)_$RANDOM"
   COMPLETION_SENTINEL="PI_REVIEW_DONE_$DONE_NONCE"
   # Do NOT trap-rm these on EXIT: Pi runs backgrounded across separate tool
   # calls and reads $PROMPT_FILE / writes $OUTPUT_FILE asynchronously. An EXIT
   # trap would delete them mid-run. Clean up explicitly after parsing instead.
   # Write the brief content to $REVIEW_FILE using the Write tool.
   # Then wrap it in $PROMPT_FILE with submit instructions and the completion marker.
   ```

   **Build the Pi prompt file:**
   ```bash
   {
     printf 'Review the following brief. You may inspect the repository with normal Pi capabilities. Do not modify files. Format findings exactly as requested. When complete, print PI_REVIEW_DONE_ followed immediately by this nonce on its own line: %s\n\n' "$DONE_NONCE"
     cat "$REVIEW_FILE"
   } > "$PROMPT_FILE"
   ```

   **4a. Launch the reviewer:** snapshot the pre-review tree (for drift detection in the verify step below), then launch per the engine with `$PROJECT_ROOT`, `$PROMPT_FILE`, `$OUTPUT_FILE`, `$PID_FILE`, `$COMPLETION_SENTINEL`, and `PI_MODEL_ARGS`:
   ```bash
   git -C "$PROJECT_ROOT" status --short > "$BASE_STATUS_FILE" 2>/dev/null || true
   # Snapshot pre-review content of every changed tracked file so reviewer
   # drift can be reverted per-path without losing intentional pre-review edits.
   git -C "$PROJECT_ROOT" status --short | cut -c4- | while read -r p; do
     [ -f "$PROJECT_ROOT/$p" ] || continue
     mkdir -p "$SNAP_DIR/$(dirname "$p")"
     cp "$PROJECT_ROOT/$p" "$SNAP_DIR/$p"
   done
   ```
   The engine handles the `setsid` detach, PID-file persistence, and the 1s launch-failure sanity check. `PI_MODEL_ARGS` was resolved in Phase 1; when no flag is passed, defaults to `("--model" "cliproxy/claude-opus-4-8")`.

   **4b. Poll per the engine** in separate Bash calls until `$COMPLETION_SENTINEL` appears in `$OUTPUT_FILE` or the PID exits (soft cap 600s wall-clock — keep polling, never SIGKILL).

   **For build reviews:** include `git status`, `git diff`, and `git diff --staged` output inline in the brief itself. The reviewer may inspect files with normal Pi capabilities, but the diff remains the authoritative review target.

   **Capture output reliably:**
   - Redirect stdout+stderr to `$OUTPUT_FILE`; poll it across separate calls (step 4b).
   - Treat the run as complete when `$COMPLETION_SENTINEL` appears in `$OUTPUT_FILE`, or when the PID has exited. The sentinel bounds the findings region so preamble/thinking is easy to discard.
   - The soft cap (default 600s) only marks elapsed time — keep polling (autonomous mode does not prompt the user). It must not SIGKILL the review.
   - Once complete, read `$OUTPUT_FILE` and parse the review message for `[Critical|Warning|Note]:` patterns to extract structured findings.

   **Verify read-only behavior:**
   - After the reviewer completes, compare project status against the pre-review baseline:
     ```bash
     git -C "$PROJECT_ROOT" status --short > "$AFTER_STATUS_FILE" 2>/dev/null || true
     if ! cmp -s "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE"; then
       diff -u "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE" || true
       # DRIFT = unauthorized reviewer edits. Restore every path present in
       # AFTER but not BASE from the pre-review snapshot ($SNAP_DIR) so Phase 4
       # runs on a clean tree. (Paths already changed before review keep their
       # pre-review content; the reviewer's delta is dropped.) Caveat: paths
       # with spaces or mid-review renames need manual restoration.
     fi
     ```
   - This comparison is required even for build reviews, because the tree may already have intentional changes before review starts.
   - **Drift = unauthorized reviewer edits (review-only was violated).** Autonomous rule: restore every newly-drifted path from the pre-review snapshot before applying findings; record restored paths in the report. Never apply Phase 4 findings on a contaminated tree.

   **Clean up temp files after parsing:** because Pi runs backgrounded, there is no EXIT trap — remove the temp files explicitly only after findings are parsed and the read-only check is done:
   ```bash
   rm -rf "$SNAP_DIR"
   rm -f "$REVIEW_FILE" "$PROMPT_FILE" "$OUTPUT_FILE" "$PID_FILE" "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE"
   ```

   **Error handling:**
   - If `pi` is not on PATH: report it and ask the user to check their Pi install.
   - If Pi exits non-zero: show `$OUTPUT_FILE`, offer retry with another model/provider or primary-agent-only fallback.
   - If the reviewer output is empty: note the issue and offer primary-agent-only fallback.
   - If the reviewer modifies files despite the review-only instruction: surface that in the report.

### Phase 4: Apply Findings

5. **Apply Findings**

   Parse the reviewer output for `[Critical|Warning|Note]:` findings and implement them directly — no discussion round, no confirm gate.

   - For each finding, apply the suggested resolution with precise, surgical edits.
   - Apply every finding the reviewer emitted (autonomous mode). If the primary agent disagrees with a finding, apply it anyway and record the disagreement in the report — disagreements are logged, not gated on.
   - **Detect conflicting findings before applying.** If two findings target the same file/region with opposing directives (e.g. "add error handling to X" vs "simplify X by removing it"), skip BOTH, log them under Skipped in the report with the conflict reason. Do not thrash by applying both or last-write-wins.
   - **Handle unparseable output.** If the reviewer output is non-empty but yields zero `[Critical|Warning|Note]:` findings (freeform text, ignored format), re-prompt the reviewer once with a stricter format reminder. If still zero, fall back to primary-agent parse: read the raw output, extract the substantive issues yourself, apply those, and note the fallback in the report.
   - Show a summary diff of what changed.
   - If the reviewer output has no findings: close as a clean review (no changes needed).

### Phase 5: Verify

6. **Verify Applied Changes**

   After applying findings, run the project's own verify command once. Autonomous apply can break invariants; the report is the user's only signal, so test/lint failure belongs there. **Do not auto-fix, do not loop** — the run is a quality signal, not a blocker. Verify failures are reported; the user decides whether to roll back.

   **Detect the verify command** (first match wins, probed at `$PROJECT_ROOT`):
   ```bash
   VERIFY_CMD=""
   if [ -f "$PROJECT_ROOT/package.json" ] && grep -q '"test"' "$PROJECT_ROOT/package.json"; then
     VERIFY_CMD="npm test"
   elif [ -f "$PROJECT_ROOT/Makefile" ] && grep -qE '^test:' "$PROJECT_ROOT/Makefile"; then
     VERIFY_CMD="make test"
   elif [ -f "$PROJECT_ROOT/Cargo.toml" ]; then
     VERIFY_CMD="cargo test"
   elif [ -f "$PROJECT_ROOT/pyproject.toml" ] || [ -f "$PROJECT_ROOT/setup.py" ] || ls "$PROJECT_ROOT"/test_*.py "$PROJECT_ROOT"/*_test.py >/dev/null 2>&1; then
     VERIFY_CMD="pytest"
   elif [ -f "$PROJECT_ROOT/go.mod" ]; then
     VERIFY_CMD="go test ./..."
   fi
   ```

   **Run it (single synchronous call, 120s timeout — this is the final phase, no backgrounding):**
   ```bash
   VERIFY_LOG=$(mktemp /tmp/pi-review-verify-XXXXXX.txt)
   if [ -z "$VERIFY_CMD" ]; then
     echo "skipped: no detectible verify command" > "$VERIFY_LOG"
   else
     ( cd "$PROJECT_ROOT" && timeout 120 $VERIFY_CMD ) > "$VERIFY_LOG" 2>&1
     echo "exit=$?" >> "$VERIFY_LOG"
   fi
   # Read $VERIFY_LOG for the report's Verify line, then rm -f it.
   ```

   - Passed → `Verify: passed`.
   - Failed (non-zero exit) → `Verify: failed: <cmd> exit <N>` + one-sentence condensed failure from the log. `Outcome` stays `Changes applied` — verify does not block.
   - Skipped (no command detected) → `Verify: skipped: no detectible verify command`.
   - Timeout (exit 124) → `Verify: failed: <cmd> timed out after 120s`.
   - **Do not auto-fix.** A failing verify means the reviewer's suggestion was bad for this code; auto-fixing would compound. Report it and stop.

## Report

After the review is complete, provide:

```
Review Complete (Dev Review Pi)

Target: <what was reviewed>
Type: <Plan/Context | Build | File | Proposal>
Stack: <detected languages/frameworks>
Context files: <N files gathered>

Reviewer Findings:
- Critical: <N>
- Warning: <N>
- Note: <N>

Key Findings:
- <most important finding 1>
- <most important finding 2>
- <most important finding 3>

Applied Changes (one line per finding implemented — file:line + edit made):
- <file:line>: <finding> → <edit made>
- <file:line>: <finding> → <edit made>

Skipped (conflicting findings):
- <finding a> ↔ <finding b>: <conflict reason>

Disagreements with reviewer (applied anyway unless skipped — list each with reason):
- <finding>: <disagreement reason>

Reviewer drift: <"none" | "reverted: <paths>">

Verify: <"passed" | "failed: <cmd> exit <N>" | "failed: <cmd> timed out after 120s" | "skipped: no detectible verify command">

Outcome: <"Changes applied" | "No issues found">
```

## Error Handling

- **pi not on PATH:** Report error, ask the user to verify their Pi install.
- **Target not found:** Ask user to clarify what to review.
- **Reviewer returns error:** Show error, offer retry with another Pi model/provider or primary-agent-only fallback.
- **Reviewer output empty/trivial:** Note issue, offer primary-agent-only fallback.
- **Reviewer output malformed (present but unparseable):** Re-prompt once for strict format; if still unparseable, primary-agent parse + note fallback.
- **Reviewer modified files (drift):** Restore drifted paths from snapshot; record in report; do not apply findings on a contaminated tree.
- **Verify failed after apply:** Report the failure (cmd, exit, condensed log). Do not auto-fix or loop; the user decides whether to roll back.
- **No issues found:** Clean review — acknowledge the code is solid as-is.
