---
description: Independent code review using OpenCode CLI — primary agent gathers context, a separate OpenCode session reviews, results discussed interactively before applying changes
agent: build
---

# Review (OpenCode-Powered)

Independent review using a fresh OpenCode session as the reviewer. The primary agent extracts the review target from conversation context, gathers surrounding codebase context, and sends a structured brief to a separate `opencode run` invocation. The reviewer session runs with `--dangerously-skip-permissions` so it has fully open access to read the project. Results are discussed interactively before any changes are applied.

$ARGUMENTS

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
2. **Verify target with user** — confirm scope before sending to the reviewer
3. **Gather surrounding context** — read related files, conventions, plans
4. **Build review brief** — assemble structured context document
5. **Run OpenCode review** — execute `opencode run` in a fresh session with open permissions
6. **Present and discuss findings** — parse reviewer output, discuss interactively
7. **Apply agreed changes** — implement only what the user agrees on

## Instructions

- **Context assembly is the critical step.** The value of this skill is in what context the reviewer receives. Be thorough — read related files, conventions, the plan (if any), tests, configs.
- **Don't pre-review.** Your job is to gather, not filter. Pass raw context and let the reviewer form independent opinions.
- **Reviewer runs with open permissions.** The reviewer session uses `--dangerously-skip-permissions`. This avoids permission prompts during context expansion and matches the user's global `"*": "allow"` posture. The reviewer is instructed to read-only — applying changes happens back in the primary session.
- **Present reviewer findings faithfully.** Don't soften or reinterpret. Show what the reviewer actually said, then add your own assessment separately.
- **Flag disagreements.** Where the primary agent and the reviewer disagree — that's where the interesting discussion lives.

## Workflow

### Phase 1: Extract and Verify

1. **Extract Review Target**

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
   I'll send the following to a fresh OpenCode session for review:

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
   - Project conventions (AGENTS.md, CLAUDE.md, linting configs, tsconfig, etc.)
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
   - If the proposal is purely abstract (no target codebase): skip "related code" and let the reviewer review on first principles. Note this explicitly in the brief.

   **Keep context focused.** Include summaries for large files, full content for small ones. Target a brief under ~8K lines total. If the brief exceeds this, summarize older/larger files and focus on the most relevant excerpts. The reviewer can read additional files on disk via `--dir` pointing to the project root.

4. **Build Review Brief**

   Assemble a structured brief. This is what the reviewer receives.

   Structure:

   ```markdown
   # Review Brief

   ## Review Type
   [Plan Review | Build Review | Code Review | Proposal Review]

   ## Project Context
   - Stack: [languages, frameworks, key deps]
   - Conventions: [naming patterns, project rules, AGENTS.md highlights]
   - Working directory: [project root path]

   ## What's Being Reviewed

   [The actual content — plan document, git diff, or file contents]

   ## Related Code

   [For each related file: path, role, key excerpts]

   ## Review Instructions

   You are an independent reviewer running in a fresh OpenCode session. You have read-only intent — DO NOT modify any files. The primary agent will apply any agreed changes later.

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

### Phase 3: Run OpenCode Reviewer

5. **Execute OpenCode Review**

   **Determine project root:**
   ```bash
   git rev-parse --show-toplevel 2>/dev/null
   ```
   - If the target IS inside a git repo: use the repo root as project directory.
   - If the target is NOT inside a git repo: use its parent directory. Only `plan` and `file` reviews work outside repos — **reject `build` reviews for non-git targets** and fall back to file review instead.
   - The project root should be derived from the review target's location, not `pwd`.

   **Write the review brief to a temp file:**
   ```bash
   REVIEW_FILE=$(mktemp /tmp/opencode-review-XXXXXX.md)
   OUTPUT_FILE=$(mktemp /tmp/opencode-review-output-XXXXXX.txt)
   # Write the brief content to $REVIEW_FILE using the Write tool
   ```

   **Run the reviewer in a fresh OpenCode session with fully open permissions:**
   ```bash
   opencode run \
     --dangerously-skip-permissions \
     --dir <project_dir> \
     --format default \
     -f "$REVIEW_FILE" \
     "Read the attached review brief and produce findings in the exact format specified inside the brief. You are read-only — do not modify any files." \
     > "$OUTPUT_FILE" 2>&1
   ```

   Notes:
   - `--dangerously-skip-permissions` is intentional: it auto-approves permissions that are not explicitly denied. This matches James's global `"*": "allow"` posture and eliminates the permission prompts that previously blocked Codex-based reviews.
   - `--dir` sets the working directory so the reviewer can read related files in the project.
   - `-f "$REVIEW_FILE"` attaches the brief as a file. The positional message is a short instruction telling the reviewer to read the attachment and follow the embedded format spec.
   - `--format default` produces human-readable output. Use `--format json` if you want raw JSON events for stricter parsing.
   - The session is fresh by default — do **not** pass `--continue` or `--session`. The whole point is an independent perspective.

   **For build reviews:** include `git status`, `git diff`, and `git diff --staged` output inline in the brief itself (the reviewer session is fresh and has no implicit access to your shell state — but it CAN run git commands inside `--dir` if needed).

   **Capture output reliably:**
   - Redirect stdout+stderr to `$OUTPUT_FILE`
   - Set a **180-second timeout** on the Bash tool call to avoid hanging on complex reviews
   - After execution, read the output file: `cat "$OUTPUT_FILE"`
   - Parse the review message for `[Critical|Warning|Note]:` patterns to extract structured findings

   **Clean up both temp files after parsing:** `rm -f "$REVIEW_FILE" "$OUTPUT_FILE"`

   **Error handling:**
   - If `opencode` is not on PATH: report it and suggest the user check their OpenCode install
   - If `opencode run` errors: show the error, offer retry or primary-agent-only fallback
   - If the reviewer output is empty: note the issue, offer primary-agent-only fallback
   - If the reviewer attempts to modify files despite the read-only instruction: surface that in the report (it shouldn't happen, but flag if it does)

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
Review Complete (OpenCode-Powered)

Target: <what was reviewed>
Type: <Plan | Build | File | Proposal>
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

- **opencode not on PATH:** Report error, ask the user to verify their OpenCode install
- **Target not found:** Ask user to clarify what to review
- **Reviewer returns error:** Show error, offer retry or primary-agent-only fallback
- **Reviewer output empty/trivial:** Note issue, offer primary-agent-only fallback
- **No issues found:** Clean review — acknowledge the code is solid as-is
