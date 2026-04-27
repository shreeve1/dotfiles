---
name: dev-review
description: Independent code review using Codex CLI — Claude gathers context, Codex reviews, results discussed interactively before applying changes
argument-hint: [file, directory, plan, or omit to review what's in context]
model: opus
---

# Review (Codex-Powered)

Independent review using Codex CLI as the reviewer. Claude extracts the review target from conversation context, gathers surrounding codebase context, and sends a structured brief to Codex. Codex provides a fresh perspective — different model, different blind spots. Results are discussed interactively before any changes are applied.

## Variables

TARGET: $1 — (Optional) Explicit path or `plan` / `build`. If omitted, extract the review target from conversation context.

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Extract review target** — identify what to review from conversation context or argument
2. **Verify target with user** — confirm scope before sending to Codex
3. **Gather surrounding context** — read related files, conventions, plans
4. **Build review brief** — assemble structured context document
5. **Run Codex review** — execute codex with read-only sandbox
6. **Present and discuss findings** — parse Codex output, discuss interactively
7. **Apply agreed changes** — implement only what the user agrees on

## Instructions

- **Context assembly is the critical step.** The value of this skill is in what context Codex receives. Be thorough — read related files, conventions, the plan (if any), tests, configs.
- **Don't pre-review.** Your job is to gather, not filter. Pass raw context and let Codex form independent opinions.
- **Read-only Codex.** Plan and file reviews use `-s read-only` sandbox. Build reviews use `codex exec review` which manages its own sandbox — Codex reviews; Claude applies changes later with user approval.
- **Present Codex findings faithfully.** Don't soften or reinterpret. Show what Codex actually said, then add your own assessment separately.
- **Flag disagreements.** Where Claude and Codex disagree — that's where the interesting discussion lives.

## Workflow

### Phase 1: Extract and Verify

1. **Extract Review Target**

   Scan the conversation context for:
   - File paths that were discussed, modified, or created
   - Plan content (from `/dev-plan` or plan files)
   - Build output or git diffs
   - Any explicit TARGET argument

   If TARGET argument is provided:
   - `plan` — find the most recent plan file (search `plans/`, `specs/`, then `artifacts/plans/` — matching dev-plan, dev-build, dev-test conventions; ask if ambiguous)
   - `build` — use uncommitted git changes
   - File path — read that file
   - Directory — scan and select key files

   If no TARGET and nothing clear in context: ask the user what to review.

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

   **Keep context focused.** Include summaries for large files, full content for small ones. Target a brief under ~8K lines total. If the brief exceeds this, summarize older/larger files and focus on the most relevant excerpts. Codex can read additional files on disk with `-C` pointing to the project root.

4. **Build Review Brief**

   Assemble a structured brief. This is what Codex receives.

   Structure:

   ```markdown
   # Review Brief

   ## Review Type
   [Plan Review | Build Review | Code Review]

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
   ```bash
   cd <project_dir> && codex exec review --uncommitted --json -o "$OUTPUT_FILE" - < "$REVIEW_FILE"
   ```
   Note: `codex exec review` does NOT support `-C`. Set the working directory via `cd` before running. It DOES support `--json`, `-o`, and `-`. The brief is piped via stdin to avoid ARG_MAX limits.

   **For plan reviews and file reviews:**
   ```bash
   codex exec -s read-only -C <project_dir> --json -o "$OUTPUT_FILE" --skip-git-repo-check - < "$REVIEW_FILE"
   ```

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
Type: <Plan | Build | File>
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
