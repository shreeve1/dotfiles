---
name: dev-review-pi
description: Independent code review using Pi Coding Agent as the reviewer. USE WHEN user says "dev-review-pi", "/skill:dev-review-pi", "independent Pi review", or wants a Pi-powered second-opinion review of a plan, build (uncommitted diff), file/directory path, or proposal. Accepts optional `--model <pattern>`, `--provider <name>`, `--opus`, `--sonnet`, or `--claude` model flags and a target argument (`plan`, `build`, `proposal`, or a path).
---

# Dev Review Pi (Pi Coding Agent-Powered)

Independent review using a fresh Pi Coding Agent invocation as the reviewer. The primary agent extracts the review target from conversation context, gathers surrounding codebase context, writes a structured brief, and sends it to `pi --print`.

Pi runs with its normal default tools, extensions, skills, prompt templates, and context loading, as if launched directly by the user. The reviewer is instructed to stay review-only; the primary agent verifies the working tree after review and surfaces any unexpected modifications before applying agreed changes.

This skill is the single source of truth for `dev-review-pi`. Invoke it with `/skill:dev-review-pi`.

## Variables

TARGET: $1 — (Optional) One of:
- `plan` — most recent plan file on disk
- `build` — uncommitted git changes
- `proposal` (aliases: `idea`, `context`) — an inline proposal/approach/snippet from the current conversation, even if nothing has been written to disk yet
- An explicit file or directory path
- Omitted — extract the review target from conversation context (file paths, plans, diffs, OR inline proposals). Default behaviour: review the current plan/context for gaps.

PI_MODEL_ARGS: Optional Pi model selector array from the raw arguments:
- `--model <pattern>` — pass through to Pi as `("--model" "<pattern>")`
- `--provider <name>` — pass through to Pi as `("--provider" "<name>")`
- `--claude` or `--opus` — set to `("--model" "opus")`
- `--sonnet` — set to `("--model" "sonnet")`
- Omitted — empty array (use Pi's configured default model)
- Multiple conflicting model flags present — ask the user to choose one before running the reviewer

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Extract review target** — identify what to review from conversation context or argument (file, plan, build diff, OR inline proposal)
2. **Verify target with user** — confirm scope before sending to the reviewer
3. **Gather surrounding context** — read related files, conventions, plans
4. **Build review brief** — assemble structured context document
5. **Run Pi review** — execute `pi --print` with the bounded review brief and normal Pi defaults
6. **Present and discuss findings** — parse reviewer output, discuss interactively
7. **Apply agreed changes** — implement only what the user agrees on

## Instructions

- **Context assembly is the critical step.** The value of this skill is in what context the reviewer receives. Be thorough — read related files, conventions, the plan (if any), tests, configs.
- **Don't pre-review.** Your job is to gather, not filter. Pass raw context and let the reviewer form independent opinions.
- **Reviewer runs as normal Pi.** Use `pi --print` with prompt content in a temp file referenced as `@$PROMPT_FILE`. Do not apply tool allowlists, context suppressions, extension suppressions, or permission restrictions — with one narrow exception: the subagent-spawning tools (`Agent,get_subagent_result,steer_subagent`) are denied via `--exclude-tools`, because subagent output bypasses `pi --print` capture (see Phase 3 notes). Everything else stays at Pi defaults.
- **Review-only by instruction, not by permission.** Pi keeps normal default capabilities; the primary agent must compare working-tree status before and after the review.
- **Present reviewer findings faithfully.** Don't soften or reinterpret. Show what the reviewer actually said, then add your own assessment separately.
- **Flag disagreements.** Where the primary agent and the reviewer disagree — that's where the interesting discussion lives.

## Workflow

### Phase 1: Extract and Verify

1. **Extract Review Target**

   First parse model selector flags from the raw arguments:
   - If `--model <pattern>` is present, set `PI_MODEL_ARGS` to `("--model" "<pattern>")`
   - If `--provider <name>` is present, append `("--provider" "<name>")`
   - If `--claude` or `--opus` is present, set `PI_MODEL_ARGS` to `("--model" "opus")`
   - If `--sonnet` is present, set `PI_MODEL_ARGS` to `("--model" "sonnet")`
   - If `--gpt` is present, explain that Pi supports many providers; ask the user for an explicit `--model <provider/model>` or `--provider <name> --model <pattern>`
   - If multiple conflicting model flags are present, ask the user which reviewer model to use and stop until they answer
   - If no model/provider flags are present, set `PI_MODEL_ARGS` to an empty array (Pi uses its configured default)
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

   If no TARGET and nothing clear in context: ask the user what to review. When inline proposals AND on-disk artifacts both exist in context, list both and let the user choose.

2. **Verify Scope with User**

   Before sending to the reviewer, present what you'll review:

   ```
   I'll send the following to a fresh Pi Coding Agent session for review:

   Target: [description of what's being reviewed]
   Context files: [list of related files you'll include]
   Review focus: [gaps / plan compliance / correctness / completeness / all of the above]
   Pi model/provider: [default or chosen args]
   Pi execution: normal defaults (no tool allowlist or context suppression)

   Does this look right? Should I add or remove anything?
   ```

   Wait for user confirmation. Adjust scope based on feedback.

### Phase 2: Gather and Build Brief

3. **Gather Surrounding Context**

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
   - **Preflight check:** if working tree is clean, report "nothing to review" and stop. If there are changes unrelated to the plan, warn the user before proceeding.
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

4. **Build Review Brief**

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

   You are an independent reviewer running in a fresh Pi Coding Agent session with normal Pi capabilities. Review only — DO NOT modify any files. The primary agent will apply any agreed changes later.

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

> Canonical backgrounded-`pi --print` reviewer engine. `/dev-plan --loop` Phase 9.2 reuses this engine inline — keep the two in sync if either changes.

5. **Execute Pi Review**

   **Determine project root:**
   ```bash
   git rev-parse --show-toplevel 2>/dev/null
   ```
   - If the target IS inside a git repo: use the repo root as project directory.
   - If the target is NOT inside a git repo: use its parent directory. Only `plan`, `proposal`, and `file` reviews work outside repos — **reject `build` reviews for non-git targets** and fall back to file review instead.
   - The project root should be derived from the review target's location, not `pwd`.

   **Write the review brief and prompt to temp files:**
   ```bash
   REVIEW_FILE=$(mktemp /tmp/pi-review-XXXXXX.md)
   PROMPT_FILE=$(mktemp /tmp/pi-review-prompt-XXXXXX.md)
   OUTPUT_FILE=$(mktemp /tmp/pi-review-output-XXXXXX.txt)
   PID_FILE=$(mktemp /tmp/pi-review-pid-XXXXXX.txt)
   BASE_STATUS_FILE=$(mktemp /tmp/pi-review-status-before-XXXXXX.txt)
   AFTER_STATUS_FILE=$(mktemp /tmp/pi-review-status-after-XXXXXX.txt)
   DONE_NONCE="$(date +%s)_$RANDOM"
   DONE_MARKER="PI_REVIEW_DONE_$DONE_NONCE"
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

   **5a. Launch the reviewer detached (one synchronous Bash call — do NOT also set `run_in_background: true`):**

   `setsid` puts pi in its own session/process group (PPID becomes 1 immediately after detach), so SIGHUP on launcher exit and parent-pgid signals can't reach it. `< /dev/null` removes stdin/tty contention. The shell-level `&` lets the launcher return in ~1s; subsequent polls run in their own short Bash calls.

   ```bash
   git -C "$PROJECT_ROOT" status --short > "$BASE_STATUS_FILE" 2>/dev/null || true

   (
     cd "$PROJECT_ROOT"
     setsid pi --print \
       "${PI_MODEL_ARGS[@]}" \
       --exclude-tools "Agent,get_subagent_result,steer_subagent" \
       --append-system-prompt "You are an independent code review tool. Follow the requested finding format exactly. Do not modify files. Do all analysis yourself and emit every finding inline in your own final response." \
       "@$PROMPT_FILE" \
       > "$OUTPUT_FILE" 2>&1 < /dev/null &
     echo $! > "$PID_FILE"   # persist PID; separate Bash calls don't share shell vars
   )

   # Sanity check: if pi died within 1s and produced no output, the launch
   # failed (bad args, missing API key, etc.). Without this, downstream polls
   # spin against an empty output file for the full budget while the launcher
   # already reported "completed" exit 0.
   sleep 1
   PID=$(cat "$PID_FILE")
   if ! kill -0 "$PID" 2>/dev/null && [ ! -s "$OUTPUT_FILE" ]; then
     echo "pi launch failed: process exited within 1s and produced no output" >&2
     cat "$OUTPUT_FILE" >&2 2>/dev/null
     exit 1
   fi
   ```

   **Do NOT pass `run_in_background: true` on this Bash call.** The shell-level `setsid ... &` is the backgrounding mechanism; the launcher returns synchronously after the 1s sanity sleep. Combining both with the old `... &; disown` pattern caused the harness to report `completed` while pi vanished — see `/tmp/handoff-mf7MKL.md` for the failure mode.

   **5b. Poll for completion in *separate* Bash calls (do not block in one call):**
   Each poll is its own short Bash invocation so the review stays observable and
   never dies on a hard `timeout`. Completion = the `$DONE_MARKER` appears in
   `$OUTPUT_FILE`, or the PID has exited. On a soft cap (default 600s of
   wall-clock across polls), leave the process running and ask the user whether
   to keep waiting or abort — never SIGKILL here.
   ```bash
   PID=$(cat "$PID_FILE")
   if grep -q "$DONE_MARKER" "$OUTPUT_FILE" 2>/dev/null; then
     echo "done"
   elif kill -0 "$PID" 2>/dev/null; then
     echo "running"   # poll again after a short wait, or hand off if past the soft cap
   else
     echo "exited"    # process gone; capture $OUTPUT_FILE and check for the marker
   fi
   ```

   Notes:
   - `--model <pattern>` and `--provider <name>` pass through to Pi.
   - `--claude` and `--opus` map to `--model opus`; `--sonnet` maps to `--model sonnet`.
   - If neither model flag is provided, use an empty `PI_MODEL_ARGS` (Pi uses its configured default).
   - Explicit `--model <pattern>` or `--provider <name>` arguments override this default.
   - Do not pass `--tools`, `--no-context-files`, `--no-skills`, `--no-prompt-templates`, or `--no-extensions`; this skill intentionally runs Pi as it would run for the user.
   - **Exception — subagent delegation:** always pass `--exclude-tools "Agent,get_subagent_result,steer_subagent"`. If the `@tintinweb/pi-subagents` extension is installed, the reviewer model will delegate repo reading to an `Explore`/`Plan` subagent whose findings land in a separate notification channel (`.pi/output/agent-*.jsonl`) that `pi --print` does NOT capture — the parent's final stdout message is then just a content-free "incorporated the Explore result" ack and the review comes back empty. Excluding only the three subagent tools keeps file read/grep, web-tools, skills, and context intact, so the analysis stays in the parent agent → stdout. The denylist is harmless when the extension is absent (unmatched names are ignored).

   **For build reviews:** include `git status`, `git diff`, and `git diff --staged` output inline in the brief itself. The reviewer may inspect files with normal Pi capabilities, but the diff remains the authoritative review target.

   **Capture output reliably:**
   - Redirect stdout+stderr to `$OUTPUT_FILE`; poll it across separate calls (step 5b).
   - Treat the run as complete when `$DONE_MARKER` appears in `$OUTPUT_FILE`, or when the PID has exited. The marker bounds the findings region so preamble/thinking is easy to discard.
   - The soft cap (default 600s) only leaves the process running and prompts the user — it must not SIGKILL the review.
   - Once complete, read `$OUTPUT_FILE` and parse the review message for `[Critical|Warning|Note]:` patterns to extract structured findings.

   **Verify read-only behavior:**
   - After the reviewer completes, compare project status against the pre-review baseline:
     ```bash
     git -C "$PROJECT_ROOT" status --short > "$AFTER_STATUS_FILE" 2>/dev/null || true
     if ! cmp -s "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE"; then
       diff -u "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE" || true
       # Stop and ask the user before presenting findings or applying anything.
     fi
     ```
   - This comparison is required even for build reviews, because the tree may already have intentional changes before review starts.
   - If files changed unexpectedly, stop and surface the changed paths before presenting findings.
   - Do not apply or revert reviewer changes without explicit user confirmation.

   **Clean up temp files after parsing:** because Pi runs backgrounded, there is no EXIT trap — remove the temp files explicitly only after findings are parsed and the read-only check is done:
   ```bash
   rm -f "$REVIEW_FILE" "$PROMPT_FILE" "$OUTPUT_FILE" "$PID_FILE" "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE"
   ```

   **Error handling:**
   - If `pi` is not on PATH: report it and ask the user to check their Pi install.
   - If Pi exits non-zero: show `$OUTPUT_FILE`, offer retry with another model/provider or primary-agent-only fallback.
   - If the reviewer output is empty: note the issue and offer primary-agent-only fallback.
   - If the reviewer modifies files despite the review-only instruction: surface that in the report.

### Phase 4: Present and Discuss

6. **Present Findings**

   Parse reviewer output and present organized by severity:

   **Critical findings** (will cause problems):
   - Quote the reviewer's finding
   - Your assessment: agree / disagree / nuance
   - Suggested resolution

   **Warnings** (may cause issues):
   - Same format

   **Notes** (worth considering):
   - Same format

   **Reviewer Disagreements:**
   - Where you disagree with the reviewer, flag it explicitly
   - Explain your reasoning
   - Let the user decide

   Then ask the user:
   - "Which findings do you want to address?"
   - "Any findings you disagree with or want to explore further?"

7. **Interactive Discussion**

   Based on user feedback:
   - Drop findings the user dismisses (with reason)
   - Deep-dive on areas the user wants to explore
   - Refine recommendations based on constraints revealed
   - Converge on agreed changes

### Phase 5: Apply Changes

8. **Apply Agreed Changes**

   After discussion, the primary agent applies the changes the user agreed to:
   - Make precise, surgical modifications
   - Show a summary diff of what changed
   - Do NOT apply anything the user didn't explicitly agree to

   If the user prefers no changes: close the review as discussion-only.

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

Disagreements with reviewer: <N>

Outcome: <"Changes applied" | "Recommendations discussed" | "No issues found">
```

## Error Handling

- **pi not on PATH:** Report error, ask the user to verify their Pi install.
- **Target not found:** Ask user to clarify what to review.
- **Reviewer returns error:** Show error, offer retry with another Pi model/provider or primary-agent-only fallback.
- **Reviewer output empty/trivial:** Note issue, offer primary-agent-only fallback.
- **No issues found:** Clean review — acknowledge the code is solid as-is.
