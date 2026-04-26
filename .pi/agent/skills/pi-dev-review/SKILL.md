---
name: pi-dev-review
description: Independent code review using Codex CLI — PI gathers context, Codex reviews, results discussed interactively before applying changes. Use after pi-dev-build or pi-dev-test to get a second opinion on a plan, a build diff, or a specific file/directory.
---

# Dev Review (Codex-Powered)

Independent review using Codex CLI as the reviewer. PI extracts the review target from conversation context, gathers surrounding codebase context, and sends a structured brief to Codex. Codex provides a fresh perspective — different model, different blind spots. Results are discussed interactively before any changes are applied.

---

## Variables

- `TARGET` — (Optional) Explicit path or the literal strings `plan` / `build`. If omitted, extract the review target from conversation context.

---

## Checklist

Use `todo_write` to create a task for each of these items and complete them in order:

1. **Extract review target** — identify what to review from conversation context or the `TARGET` argument
2. **Verify target with user** — confirm scope before sending to Codex
3. **Gather surrounding context** — read related files, conventions, plans
4. **Build review brief** — assemble a structured context document
5. **Run Codex review** — execute codex with read-only sandbox
6. **Present findings** — parse Codex output, organize by severity
7. **Interactive discussion** — converge with user on which findings to address
8. **Apply agreed changes** — implement only what the user agrees on

---

## Instructions

- **Context assembly is the critical step.** The value of this skill is in what context Codex receives. Be thorough — read related files, conventions, the plan (if any), tests, configs.
- **Don't pre-review.** Your job is to gather, not filter. Pass raw context and let Codex form independent opinions.
- **Read-only Codex.** Plan and file reviews use `-s read-only` sandbox. Build reviews use `codex exec review` which manages its own sandbox — Codex reviews; PI applies changes later with user approval.
- **Present Codex findings faithfully.** Don't soften or reinterpret. Show what Codex actually said, then add your own assessment separately.
- **Flag disagreements.** Where PI and Codex disagree — that's where the interesting discussion lives.
- **Model choice.** This skill does NOT specify a `-m <model>` flag, so Codex uses its configured default (typically set in `~/.codex/config.toml`). If the user wants a specific reviewer model, they should set it in their Codex config.

---

## Workflow

### Phase 1: Extract and Verify

1. **Extract Review Target**

   Scan the conversation context for:
   - File paths that were discussed, modified, or created
   - Plan content (from `pi-dev-plan` or plan files under `artifacts/plans/`)
   - Build output or git diffs
   - Any explicit `TARGET` argument

   If `TARGET` is provided:
   - `plan` — find the most recent plan file. Use `bash` to list markdown files recursively in `artifacts/plans/` and `artifacts/specs/` so shards and epic mini-PRDs (e.g., `artifacts/specs/<parent>/epic-*.md`) are included. Ask via `ask_user` if ambiguous.
   - `build` — use uncommitted git changes
   - File path — use `read` on that file
   - Directory — use `find` to scan and select key files

   If no `TARGET` and nothing clear in context: use `ask_user` (type: input) to ask what to review.

2. **Verify Scope with User**

   Before sending to Codex, present what you'll review using `ask_user` (type: select):

   ```yaml
   ask_user:
     type: select
     question: |
       I'll send the following to Codex for review:

       Target: <description of what's being reviewed>
       Context files: <list of related files you'll include>
       Review focus: <plan compliance | correctness | completeness | all of the above>

       Does this look right?
     options:
       - "Yes, proceed"
       - "Let me adjust the scope"
       - "Cancel"
   ```

   If the user selects "Let me adjust the scope", capture the adjustment via `ask_user` (type: input) and re-confirm.

### Phase 2: Gather and Build Brief

3. **Gather Surrounding Context**

   Based on the review target, read:

   **Always:**
   - Project conventions (CLAUDE.md, README.md, linting configs, tsconfig, etc.)
   - Stack detection — languages, frameworks, key dependencies

   **For plan reviews:**
   - All files referenced in the plan's `## Relevant Files`
   - PRD or requirements documents if available (parent `artifacts/specs/`)
   - Existing code that the plan will modify or interact with
   - Any `## Risk Analysis` section already added by `pi-dev-validate`

   **For build reviews:**
   - Use `bash` to run `git status` (tracked + untracked), then `git diff` and `git diff --staged`
   - **Preflight check:** if the working tree is clean, report "nothing to review" and stop. If there are changes unrelated to the plan, warn the user before proceeding.
   - The plan the build was based on (if available)
   - Test files for modified code
   - Files that import or depend on changed files

   **For file/directory reviews:**
   - Imports and dependencies of the target files (use `rg` for import/require search)
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
   - Stack: <languages, frameworks, key deps>
   - Conventions: <naming patterns, project rules, CLAUDE.md highlights>
   - Working directory: <project root path>

   ## What's Being Reviewed

   <the actual content — plan document, git diff, or file contents>

   ## Related Code

   <for each related file: path, role, key excerpts>

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

   **Determine project root** (via `bash`):

   ```bash
   git rev-parse --show-toplevel 2>/dev/null
   ```

   - If the target IS inside a git repo: use the repo root as project directory.
   - If the target is NOT inside a git repo: use its parent directory. Only `plan` and `file` reviews work outside repos — **reject `build` reviews for non-git targets** and fall back to file review instead. Add `--skip-git-repo-check` to `codex exec` commands when running outside a git repo.
   - The project root should be derived from the review target's location, not `pwd`.

   **Write the review brief to a temp file** (avoids shell escaping and ARG_MAX issues).

   Step A — use `bash` to generate the two file paths and capture them:

   ```bash
   TS=$(date +%s)
   echo "REVIEW_FILE=/tmp/codex-review-$TS.md"
   echo "OUTPUT_FILE=/tmp/codex-review-output-$TS.txt"
   ```

   Step B — use `write` with the concrete `REVIEW_FILE` path (from Step A output) to save the assembled brief. Do NOT try to pass `$REVIEW_FILE` to `write`; substitute the real path.

   Step C — reuse the same `REVIEW_FILE` and `OUTPUT_FILE` paths in the `bash` codex invocation below (either by exporting them in the same shell call, or by hard-coding the resolved values).

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
   - Use `--json` to get a structured JSONL event stream
   - Use `-o "$OUTPUT_FILE"` (unique temp file) to write the final review message — avoids stale results from prior runs
   - Set a **120-second timeout** on the `bash` call to avoid hanging on complex reviews
   - After execution, use `read` to inspect the output file
   - Parse the review message for `[Critical|Warning|Note]:` patterns to extract structured findings

   **Clean up both temp files after parsing:** `bash` — `rm -f "$REVIEW_FILE" "$OUTPUT_FILE"`

   **Error handling:**
   - If codex is not installed: suggest `npm install -g @openai/codex`
   - If codex errors: show the error, offer retry or PI-only fallback (review with PI alone, no Codex)
   - If codex output is empty: note the issue, offer PI-only fallback

### Phase 4: Present and Discuss

6. **Present Findings**

   Parse Codex output and present organized by severity:

   **Critical findings** (will cause problems):
   - Quote Codex's finding verbatim
   - Your assessment: agree / disagree / nuance
   - Suggested resolution

   **Warnings** (may cause issues):
   - Same format

   **Notes** (worth considering):
   - Same format

   **PI-Codex Disagreements:**
   - Where PI disagrees with Codex, flag it explicitly
   - Explain the reasoning
   - Let the user decide

   Use `ask_user` (type: select) to scope the action:

   ```yaml
   ask_user:
     type: select
     question: "How do you want to proceed with these findings?"
     options:
       - "Address all critical findings"
       - "Address specific findings (I'll tell you which)"
       - "Discuss a finding further before deciding"
       - "Dismiss all findings — review was informational"
   ```

   If the user selects "Address specific findings" or "Discuss a finding further", follow up with `ask_user` (type: input) to capture the list or the area to explore.

7. **Interactive Discussion**

   Based on user feedback:
   - Drop findings the user dismisses (with reason)
   - Deep-dive on areas the user wants to explore
   - Refine recommendations based on constraints revealed
   - Converge on agreed changes

### Phase 5: Apply Changes

8. **Apply Agreed Changes**

   After discussion, PI applies the changes the user agreed to:
   - Use `edit` for surgical modifications
   - Show a summary diff of what changed
   - Do NOT apply anything the user didn't explicitly agree to

   If the user prefers no changes: close the review as discussion-only.

   **Handoff:** If Codex surfaces a root-cause bug that is unrelated to the plan/diff being reviewed (e.g., a pre-existing defect, flaky behavior, or symptom needing deeper diagnosis), recommend `dev-investigate` rather than trying to fix it inside this review. Keep `pi-dev-review` focused on the review target.

---

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

PI-Codex Disagreements: <N>

Outcome: <"Changes applied" | "Recommendations discussed" | "No issues found">
```

---

## Error Handling

- **Codex not installed:** Report error, suggest `npm install -g @openai/codex`
- **Target not found:** Use `ask_user` to clarify what to review
- **Codex returns error:** Show error, offer retry or PI-only fallback
- **Codex output empty/trivial:** Note issue, offer PI-only fallback
- **No issues found:** Clean review — acknowledge the code is solid as-is

### PI-only fallback (what it means)

When Codex is unavailable, errors out, or returns empty output, fall back to reviewing with PI alone:

1. Read the same brief that would have gone to Codex (you already assembled it).
2. Produce findings yourself using the same `[Critical|Warning|Note]:` format required of Codex.
3. Prefix the report with a note: `⚠️ PI-only review — no independent second opinion from Codex.`
4. Proceed to Phase 4 (Present and Discuss) normally.

This fallback loses the cross-model independence that is the main value of this skill — flag the limitation to the user before continuing.

---

## Integration with the Pipeline

Primary placement — optional second-opinion pass after the build/test loop:

```
pi-dev-build ─► pi-dev-test ─► pi-dev-review  ◄── this skill
                                     │
                                     ▼
                       user-driven git commit
```

Standalone placement — review any plan, file, or directory at any time:

```
          ┌─► plan       (artifacts/plans/ or artifacts/specs/<parent>/epic-*.md)
user ─────┼─► file       (any path)            ─► pi-dev-review
          └─► directory  (scan + select files)
```

`pi-dev-review` sits after `pi-dev-test` as an optional independent second-opinion pass, and can also be invoked directly on plans, mini-PRDs (from `pi-dev-epic`), individual files, or directories at any time.
