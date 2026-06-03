---
name: dev-review-claude
description: Independent code review using a fresh interactive Claude Code session as the reviewer. USE WHEN user says "dev-review-claude", "/skill:dev-review-claude", "independent Claude review", or wants a Claude-powered second-opinion review of a plan, build (uncommitted diff), file/directory path, or proposal. Accepts optional `--claude` / `--opus` / `--sonnet` model flags and a target argument (`plan`, `build`, `proposal`, or a path).
---

# Dev Review Claude (Interactive Claude Code via tmux)

Independent review using a fresh interactive Claude Code session as the reviewer. The primary agent extracts the review target from conversation context, gathers surrounding codebase context, writes a structured brief, and sends it to a separate Claude Code process running in a private tmux session.

The reviewer runs with bypass permissions and normal tool access so read/search/shell work does not stall on prompts. The reviewer is instructed to stay read-only; the primary agent verifies the working tree after the review and surfaces any unexpected modifications before applying agreed changes.

This skill is the single source of truth for `dev-review-claude`. The `/skill:dev-review-claude` invocation and the Development pack's Review sub-skill both route here.

## Variables

TARGET: $1 — (Optional) One of:
- `plan` — most recent plan file on disk
- `build` — uncommitted git changes
- `proposal` (aliases: `idea`, `context`) — an inline proposal/approach/snippet from the current conversation, even if nothing has been written to disk yet
- An explicit file or directory path
- Omitted — extract the review target from conversation context (file paths, plans, diffs, OR inline proposals). Default behaviour: review the current plan/context for gaps.

REVIEWER_MODEL_ARGS: Optional reviewer model selector array from the raw arguments:
- `--claude` or `--opus` — set to `("--model" "opus")`
- `--sonnet` — set to `("--model" "sonnet")`
- Omitted — use an empty array and preserve the current default reviewer model behaviour
- Multiple model flags present — ask the user to choose one before running the reviewer

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Extract review target** — identify what to review from conversation context or argument (file, plan, build diff, OR inline proposal)
2. **Verify target with user** — confirm scope before sending to the reviewer
3. **Gather surrounding context** — read related files, conventions, plans
4. **Build review brief** — assemble structured context document
5. **Run Claude Code review** — execute interactive `claude` in a fresh tmux session with the bounded review brief pasted into the session
6. **Present and discuss findings** — parse reviewer output, discuss interactively
7. **Apply agreed changes** — implement only what the user agrees on

## Instructions

- **Context assembly is the critical step.** The value of this skill is in what context the reviewer receives. Be thorough — read related files, conventions, the plan (if any), tests, configs.
- **Don't pre-review.** Your job is to gather, not filter. Pass raw context and let the reviewer form independent opinions.
- **Reviewer runs in a fresh Claude Code session.** Use an interactive `claude` process inside a private tmux session. Do not use non-interactive print mode. Run with bypass permissions and default tool access so read/search/shell inspection does not stall on prompts. The reviewer is instructed to be read-only — applying changes happens back in the primary session.
- **Present reviewer findings faithfully.** Don't soften or reinterpret. Show what the reviewer actually said, then add your own assessment separately.
- **Flag disagreements.** Where the primary agent and the reviewer disagree — that's where the interesting discussion lives.

## Workflow

### Phase 1: Extract and Verify

1. **Extract Review Target**

   First parse model selector flags from the raw arguments:
   - If `--claude` or `--opus` is present, set `REVIEWER_MODEL_ARGS` to `("--model" "opus")`
   - If `--sonnet` is present, set `REVIEWER_MODEL_ARGS` to `("--model" "sonnet")`
   - If `--gpt` is present, explain that this Claude-first skill no longer routes through OpenCode; ask the user to choose `--opus` or `--sonnet`
   - If multiple model flags are present, ask the user which reviewer model to use and stop until they answer
   - Remove model flags from the argument string before interpreting TARGET

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
   I'll send the following to a fresh Claude Code session for review:

   Target: [description of what's being reviewed]
   Context files: [list of related files you'll include]
   Review focus: [gaps / plan compliance / correctness / completeness / all of the above]

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

   **Keep context focused.** Include summaries for large files, full content for small ones. Target a brief under ~8K lines total. If the brief exceeds this, summarize older/larger files and focus on the most relevant excerpts. If the reviewer needs more context, rebuild the brief with those files instead of enabling edit-capable tools.

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

   You are an independent reviewer running in a fresh Claude Code session. You have read-only intent — DO NOT modify any files. The primary agent will apply any agreed changes later.

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

### Phase 3: Run Claude Code Reviewer

> Canonical tmux reviewer engine. The planned `/dev-plan --loop` reuses this engine inline — keep the two in sync if either changes.

5. **Execute Claude Code Review**

   **Determine project root:**
   ```bash
   git rev-parse --show-toplevel 2>/dev/null
   ```
   - If the target IS inside a git repo: use the repo root as project directory.
   - If the target is NOT inside a git repo: use its parent directory. Only `plan`, `proposal`, and `file` reviews work outside repos — **reject `build` reviews for non-git targets** and fall back to file review instead.
   - The project root should be derived from the review target's location, not `pwd`.

   **Write the review brief and prompt to temp files:**
   ```bash
   REVIEW_FILE=$(mktemp /tmp/claude-review-XXXXXX.md)
   PROMPT_FILE=$(mktemp /tmp/claude-review-prompt-XXXXXX.md)
   OUTPUT_FILE=$(mktemp /tmp/claude-review-output-XXXXXX.txt)
   BASE_STATUS_FILE=$(mktemp /tmp/claude-review-status-before-XXXXXX.txt)
   AFTER_STATUS_FILE=$(mktemp /tmp/claude-review-status-after-XXXXXX.txt)
   DONE_NONCE="$(date +%s)_$RANDOM"
   DONE_MARKER="DEV_REVIEW_DONE_$DONE_NONCE"
   trap 'rm -f "$REVIEW_FILE" "$PROMPT_FILE" "$OUTPUT_FILE" "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE"' EXIT
   # Write the brief content to $REVIEW_FILE using the Write tool.
   # Then wrap it in $PROMPT_FILE with submit instructions and the completion marker.
   ```

   **Run the reviewer in a fresh interactive tmux session:**
   ```bash
   SOCKET_DIR="${CLAUDE_TMUX_SOCKET_DIR:-${TMPDIR:-/tmp}/claude-tmux-sockets}"
   mkdir -p "$SOCKET_DIR"
   SOCKET="$SOCKET_DIR/claude.sock"
   SESSION="dev-review-claude-$(date +%s)"

   git -C "$PROJECT_ROOT" status --short > "$BASE_STATUS_FILE" 2>/dev/null || true

   # Raise history-limit and create the session in ONE invocation so the pane inherits
   # the larger scrollback (avoids truncating long reviews). On a fresh socket the server
   # starts for this command chain; a separate `set-option -g` first would error (no
   # server yet) and a `set-option` after new-session won't resize the existing pane.
   tmux -S "$SOCKET" set-option -g history-limit 50000 \; new-session -d -s "$SESSION" -c "$PROJECT_ROOT" -n review
   tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- \
     "claude ${REVIEWER_MODEL_ARGS[*]} --permission-mode bypassPermissions --disallowedTools 'Edit,Write,MultiEdit,NotebookEdit' --append-system-prompt 'You are a read-only independent code review tool. Follow the requested finding format exactly. Do not modify files. Do not use local house style or wrapper behavior.'" Enter
   ```

   Immediately print monitor commands for the user:
   ```bash
   tmux -S "$SOCKET" attach -t "$SESSION"
   tmux -S "$SOCKET" capture-pane -p -J -t "$SESSION":0.0 -S -200
   ```

   **Wait for Claude Code to be ready before pasting:**
   - Poll `tmux capture-pane` until the Claude prompt/input UI is visible, or until a short timeout (default: 30 seconds).
   - If Claude does not become ready, capture the pane, print the attach command, and ask whether to continue waiting, attach manually, or abort.
   - Do not paste the review brief while the pane is still at a shell prompt or startup screen.

   **Send the brief without shell-quoting risk:**
   ```bash
   {
     printf 'Review the following brief. You may inspect the repository with tools, but you must not modify files. Format findings exactly as requested. When complete, print DEV_REVIEW_DONE_ followed immediately by this nonce on its own line: %s\n\n' "$DONE_NONCE"
     cat "$REVIEW_FILE"
   } > "$PROMPT_FILE"

   tmux -S "$SOCKET" load-buffer -b dev-review-claude "$PROMPT_FILE"
   tmux -S "$SOCKET" paste-buffer -b dev-review-claude -t "$SESSION":0.0
   tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 Enter
   ```

   Notes:
   - `--claude` and `--opus` map to `--model opus`; `--sonnet` maps to `--model sonnet`.
   - `--gpt` is intentionally unsupported in this Claude-first workflow.
   - If neither model flag is provided, use an empty `REVIEWER_MODEL_ARGS` array and preserve the current default reviewer model behaviour.
   - Do not pass print-mode flags; this workflow intentionally uses interactive Claude Code through tmux.
   - Do not pass `--tools ""`; this workflow intentionally allows default tools so repository reads/searches do not stall.
   - Disallow direct edit tools (`Edit`, `Write`, `MultiEdit`, `NotebookEdit`) while keeping read/search/shell tools available.
   - The reviewer has bypass permissions. Treat this as trusted local automation only. Bash can still modify files, so the primary agent must compare working-tree status before and after the review.

   **For build reviews:** include `git status`, `git diff`, and `git diff --staged` output inline in the brief itself. The reviewer may inspect files, but the diff remains the authoritative review target.

   **Capture output reliably:**
   - Poll the pane until the unique `$DONE_MARKER` appears, or until a timeout (default: 10 minutes). The pasted prompt includes only the nonce, not the full marker, so the full marker should appear only in the reviewer response.
   - On success, capture the pane to `$OUTPUT_FILE`:
     ```bash
     tmux -S "$SOCKET" capture-pane -p -J -t "$SESSION":0.0 -S - > "$OUTPUT_FILE"   # -S - captures full history (history-limit raised at session start)
     ```
   - If the timeout fires, capture the pane, leave the tmux session running, print the attach command, and ask whether to continue waiting, attach manually, or abort.
   - After successful capture, kill the tmux session unless the user asks to keep it:
     ```bash
     tmux -S "$SOCKET" kill-session -t "$SESSION"
     ```
   - Parse the review message for `[Critical|Warning|Note]:` patterns to extract structured findings.

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

   **Clean up temp files after parsing:** the `trap` above removes `$REVIEW_FILE`, `$PROMPT_FILE`, `$OUTPUT_FILE`, `$BASE_STATUS_FILE`, and `$AFTER_STATUS_FILE`. Do not trap-kill the tmux session, because timeout/debug flows may need the session left open.

   **Error handling:**
   - If `claude` is not on PATH: report it and ask the user to check their Claude Code install.
   - If `tmux` is not on PATH: report it and offer a manual reviewer handoff using the generated prompt file.
   - If the reviewer output is empty: note the issue, offer to re-open the tmux session or use primary-agent-only fallback.
   - If the reviewer attempts to modify files despite the read-only instruction: surface that in the report.

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
Review Complete (Dev Review Claude via tmux)

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

- **claude not on PATH:** Report error, ask the user to verify their Claude Code install
- **Target not found:** Ask user to clarify what to review
- **Reviewer returns error:** Show error, offer retry or primary-agent-only fallback
- **Reviewer output empty/trivial:** Note issue, offer primary-agent-only fallback
- **No issues found:** Clean review — acknowledge the code is solid as-is
