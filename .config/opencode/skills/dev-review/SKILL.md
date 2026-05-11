---
name: dev-review
description: Independent code review using Codex CLI — Claude gathers context, Codex reviews, results discussed interactively before applying changes
argument-hint: [file, directory, plan, build, proposal, or omit to review what's in context]
model: opus
---

# Review (Codex-Powered)

Independent review using Codex CLI as the reviewer. Claude extracts the review target from conversation context, gathers surrounding codebase context, and sends a structured brief to Codex. Codex provides a fresh perspective — different model, different blind spots. Results are discussed interactively before any changes are applied.

## Variables

TARGET: $1 — (Optional) One of:
- `plan` — most recent plan file on disk
- `build` — uncommitted git changes
- `proposal` (aliases: `idea`, `context`) — an inline proposal/approach/snippet from the current conversation, even if nothing has been written to disk yet
- An explicit file or directory path
- Omitted — extract the review target from conversation context (file paths, plans, diffs, OR inline proposals)

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Extract review target** — identify what to review from conversation context or argument (file, plan, build diff, OR inline proposal)
2. **Verify target with user** — confirm scope before sending to Codex
3. **Gather surrounding context** — read related files, conventions, plans
4. **Build review brief** — assemble structured context document
5. **Run Codex review** — execute Codex with the selected review permission mode
6. **Present and discuss findings** — parse Codex output, discuss interactively
7. **Apply agreed changes** — implement only what the user agrees on

## Instructions

- **Context assembly is the critical step.** The value of this skill is in what context Codex receives. Be thorough — read related files, conventions, the plan (if any), tests, configs.
- **Don't pre-review.** Your job is to gather, not filter. Pass raw context and let Codex form independent opinions.
- **Codex permissions.** Prefer reliable prompt delivery over strict read-only sandboxing. Use `-s danger-full-access` for plan, file, proposal, and build reviews by default unless the user explicitly asks for read-only. If bubblewrap/read-only restrictions interfere with prompt delivery or file access, retry with `--dangerously-bypass-approvals-and-sandbox`. **Do not use `codex exec review --uncommitted` for this workflow:** Codex CLI 0.125.0 rejects `--uncommitted` when combined with stdin or prompt content, so the assembled review brief cannot be delivered reliably. For build reviews, put `git status`, `git diff`, `git diff --staged`, and untracked-file summaries inside the brief and run normal `codex exec` with `-C <project_dir>`. Codex reviews; Claude applies changes later with user approval.
- **Present Codex findings faithfully.** Don't soften or reinterpret. Show what Codex actually said, then add your own assessment separately.
- **Flag disagreements.** Where Claude and Codex disagree — that's where the interesting discussion lives.

## Workflow

### Phase 1: Extract and Verify

1. **Extract Review Target**

   Scan the conversation context for:
   - File paths that were discussed, modified, or created
   - Plan content (from `/dev-plan` or plan files)
   - Build output or git diffs
   - **Inline proposals** — code snippets, design approaches, architectural sketches, or solutions you (Claude) proposed in chat that the user wants double-checked, even if not yet written to disk
   - Any explicit TARGET argument

   If TARGET argument is provided:
   - `plan` — find the most recent plan file (search `plans/`, `specs/`, then `artifacts/plans/` — matching dev-plan, dev-build, dev-test conventions; ask if ambiguous)
   - `build` — use uncommitted git changes
   - `proposal` (aliases: `idea`, `context`) — review an inline proposal from the current conversation. Extract the most recent concrete suggestion (snippet, approach, design) from your chat history. If multiple candidates exist, ask the user to pick. The proposal is the *content under review* — not a file on disk.
   - File path — read that file
   - Directory — scan and select key files

   If no TARGET and nothing clear in context: ask the user what to review. When inline proposals AND on-disk artifacts both exist in context, list both and let the user choose.

2. **Verify Scope with User**

   Before sending to Codex, present what you'll review using `AskUserQuestion`:

   ```
   I'll send the following to Codex for review:

   Target: [description of what's being reviewed]
   Context files: [list of related files you'll include]
   Review focus: [plan compliance / correctness / completeness / all of the above]

   Does this look right? Should I add or remove anything?
   ```

   Wait for user confirmation. Adjust scope based on feedback.

### Phase 2: Gather and Build Brief

3. **Gather Surrounding Context**

   Based on the review target, read:

   **Always:**
   - Project conventions (CLAUDE.md, linting configs, tsconfig, etc.)
   - Stack detection — languages, frameworks, key dependencies

   **For plan reviews:**
   - All files referenced in the plan
   - PRD or requirements documents if available
   - Existing code that the plan will modify or interact with

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
   - If the proposal is purely abstract (no target codebase): skip "related code" and let Codex review on first principles. Note this explicitly in the brief.

   **Keep context focused.** Include summaries for large files, full content for small ones. Target a brief under ~8K lines total. If the brief exceeds this, summarize older/larger files and focus on the most relevant excerpts. Codex can read additional files on disk with `-C` pointing to the project root.

4. **Build Review Brief**

   Assemble a structured brief. This is what Codex receives.

   Structure:

   ```markdown
   # Review Brief

   ## Review Type
   [Plan Review | Build Review | Code Review | Proposal Review]

   ## Project Context
   - Stack: [languages, frameworks, key deps]
   - Conventions: [naming patterns, project rules, CLAUDE.md highlights]
   - Working directory: [project root path]

   ## What's Being Reviewed

   [The actual content — plan document, git diff, or file contents]

   ## Related Code

   [For each related file: path, role, key excerpts]

   ## Review Instructions

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

### Phase 3: Run Codex

5. **Execute Codex Review**

   **Choose Codex permission mode:**
   - Default for this workflow: permissive review mode. James has explicitly approved all-permissions/YOLO mode for Codex review handoffs when read-only bubblewrap causes failures.
   - Use read-only only when the user explicitly requests it for that review: `-s read-only`.
   - Use permissive sandbox for normal plan/file/proposal reviews: `-s danger-full-access`.
   - Use YOLO/no-sandbox retry when read-only or bubblewrap fails: `--dangerously-bypass-approvals-and-sandbox`.
   - Keep the safety boundary at the review workflow: Codex may inspect and report, but Claude applies only user-approved changes afterward.

   **Determine project root:**
   ```bash
   git rev-parse --show-toplevel 2>/dev/null
   ```
   - If the target IS inside a git repo: use the repo root as project directory.
   - If the target is NOT inside a git repo: use its parent directory. Only `plan` and `file` reviews work outside repos — **reject `build` reviews for non-git targets** and fall back to file review instead. Add `--skip-git-repo-check` to `codex exec` commands when running outside a git repo.
   - The project root should be derived from the review target's location, not `pwd`.

   **Write the review brief to a temp file** (avoids shell escaping and ARG_MAX issues):
   ```bash
   REVIEW_FILE=$(mktemp /tmp/codex-review-XXXXXX.md)
   OUTPUT_FILE=$(mktemp /tmp/codex-review-output-XXXXXX.txt)
   # Write the brief content to $REVIEW_FILE using the Write tool
   ```

   **For build reviews with uncommitted changes** (must be inside a git repo):
   Do not use `codex exec review --uncommitted` here. In Codex CLI 0.125.0, `review --uncommitted` cannot accept stdin (`-`) or prompt text, which means it cannot receive the context brief this workflow depends on. Instead, include the uncommitted-change context in the brief and use normal `codex exec`:
   ```bash
   codex exec -s danger-full-access -C <project_dir> --json -o "$OUTPUT_FILE" --skip-git-repo-check - < "$REVIEW_FILE"
   ```
   If this hits bubblewrap/sandbox restrictions, retry with the approved YOLO review mode:
   ```bash
   codex exec --dangerously-bypass-approvals-and-sandbox -C <project_dir> --json -o "$OUTPUT_FILE" --skip-git-repo-check - < "$REVIEW_FILE"
   ```
   The brief must contain the build-review payload: `git status --short`, `git diff`, `git diff --staged`, relevant untracked file contents or summaries, validation output, and plan context when available. This preserves prompt delivery and avoids stale or generic no-context review output.

   **For plan reviews, file reviews, and proposal reviews:**
   ```bash
   codex exec -s danger-full-access -C <project_dir> --json -o "$OUTPUT_FILE" --skip-git-repo-check - < "$REVIEW_FILE"
   ```
   If this still hits bubblewrap/sandbox restrictions, retry with the approved YOLO review mode:
   ```bash
   codex exec --dangerously-bypass-approvals-and-sandbox -C <project_dir> --json -o "$OUTPUT_FILE" --skip-git-repo-check - < "$REVIEW_FILE"
   ```
   For pure-abstract proposal reviews (no codebase to anchor to): use `<project_dir>` = `pwd` and always include `--skip-git-repo-check`.

   **Capture output reliably:**
   - Use `--json` to get structured JSONL event stream
   - Use `-o "$OUTPUT_FILE"` (unique temp file) to write the final review message — avoids stale results from prior runs
   - Set a **120-second timeout** on the Bash tool call to avoid hanging on complex reviews
   - After execution, read the output file: `cat "$OUTPUT_FILE"`
   - Parse the review message for `[Critical|Warning|Note]:` patterns to extract structured findings

   **Clean up both temp files after parsing:** `rm -f "$REVIEW_FILE" "$OUTPUT_FILE"`

   **Error handling:**
   - If codex is not installed: suggest `npm install -g @openai/codex`
   - If codex errors: show the error, offer retry or Claude-only fallback
   - If codex output is empty: note the issue, offer Claude-only fallback

### Phase 4: Present and Discuss

6. **Present Findings**

   Parse Codex output and present organized by severity:

   **Critical findings** (will cause problems):
   - Quote Codex's finding
   - Your assessment: agree / disagree / nuance
   - Suggested resolution

   **Warnings** (may cause issues):
   - Same format

   **Notes** (worth considering):
   - Same format

   **Claude-Codex Disagreements:**
   - Where you disagree with Codex, flag it explicitly
   - Explain your reasoning
   - Let the user decide

   Use `AskUserQuestion` to discuss:
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

   After discussion, Claude applies the changes the user agreed to:
   - Make precise, surgical modifications
   - Show a summary diff of what changed
   - Do NOT apply anything the user didn't explicitly agree to

   If the user prefers no changes: close the review as discussion-only.

## Report

After the review is complete, provide:

```
Review Complete (Codex-Powered)

Target: <what was reviewed>
Type: <Plan | Build | File | Proposal>
Stack: <detected languages/frameworks>
Context files: <N files gathered>

Codex Findings:
- Critical: <N>
- Warning: <N>
- Note: <N>

Key Findings:
- <most important finding 1>
- <most important finding 2>
- <most important finding 3>

Claude-Codex Disagreements: <N>

Outcome: <"Changes applied" | "Recommendations discussed" | "No issues found">
```

## Error Handling

- **Codex not installed:** Report error, suggest `npm install -g @openai/codex`
- **Target not found:** Ask user to clarify what to review
- **Codex returns error:** Show error, offer retry or Claude-only fallback
- **Codex output empty/trivial:** Note issue, offer Claude-only fallback
- **No issues found:** Clean review — acknowledge the code is solid as-is
