# DeepReview Workflow


## Contents

- [Variables](#variables)
- [Checklist](#checklist)
- [Instructions](#instructions)
- [Phase 1: Locate and Understand](#phase-1-locate-and-understand)
- [Phase 2: Multi-Dimensional Analysis](#phase-2-multi-dimensional-analysis)
- [Phase 3: Interactive Discussion](#phase-3-interactive-discussion)
- [Phase 4: Claude Cross-Model Review (default)](#phase-4-claude-cross-model-review-default)
- [Phase 5: Apply Changes](#phase-5-apply-changes)
- [Report](#report)
- [Error Handling](#error-handling)

Perform a deep, critical review of whatever the user references — code files, configurations, directories, plans, documentation, or the current session context. Analyze for best practice adherence, technical risks, and improvement opportunities. Adapt your analysis dimensions to what's actually being reviewed. Engage in interactive discussion about findings before optionally applying changes.

## Variables

TARGET: $1 — (Optional) Path to a file, directory, plan, topic, or session context to review. If omitted, review the current session context (what's been discussed, decided, and implemented so far).

## Checklist

You MUST create a task for each of these items and complete them in order:
1. **Identify review target** — resolve the input to concrete files or session context
2. **Deep read and comprehension** — thoroughly read the target AND surrounding codebase context
3. **Detect stack and context** — identify languages, frameworks, patterns, and conventions in use
4. **Select analysis dimensions** — choose relevant review dimensions based on what's being reviewed
5. **Run multi-dimensional analysis** — analyze each selected dimension with specific, grounded findings
6. **Present findings interactively** — share analysis per dimension and discuss with the user
7. **Claude cross-model review (default)** — check `claude` binary + auth, pass Claude the target/context packet, present output, cross-model comparison. Skip only if not installed, auth fails, or user opts out.
8. **Offer to apply changes** — after discussion, offer to update reviewed files with agreed recommendations

## Instructions

- **REVIEW ONLY until invited to edit**: Your goal is to analyze and discuss, not execute or rewrite. Only modify files after interactive discussion and user agreement.
- **Be balanced**: Acknowledge strengths while calling out concerns. Constructive but honest. Don't sugarcoat real issues, but don't manufacture problems either.
- **Ground in the codebase**: Don't review in isolation. Cross-reference every claim against actual code — do referenced files exist? Are patterns consistent with the rest of the project? Are assumptions valid?
- **Think deeply**: Use extended thinking for each analysis dimension. This is not a surface-level scan — reason carefully about second-order effects, implicit assumptions, and non-obvious failure modes.
- **Be specific**: Reference exact files, line numbers, and code patterns. "This might have issues" is useless. "The `UserService` at `src/services/user.ts:47` uses synchronous DB calls which will block under concurrent load" is useful.
- **Stack-aware best practices**: Detect the language, framework, and ecosystem. Apply best practices specific to that stack (e.g., React component patterns, Go error handling idioms, Python packaging conventions) in addition to universal principles.

---

## Phase 1: Locate and Understand

1. **Resolve Review Target**
   - If `TARGET` is a file path: verify it exists and read it
   - If `TARGET` is a directory: scan its structure, then intelligently select key files to review (entry points, exports, configs, core logic modules). Skip generated files, lock files, and boilerplate. Present your selection to the user with `ask the user` for confirmation.
   - If `TARGET` is a plan: read the plan, map it to referenced files or expected implementation areas, and review feasibility, missing steps, risk, and test coverage
   - If `TARGET` is a topic or concept: gather relevant files from the conversation context and codebase
   - If no `TARGET` provided: review the current session context — what's been discussed, decided, and implemented so far
   - If `TARGET` doesn't resolve to anything: ask the user to clarify

2. **Deep Comprehension Pass**
   - read all target files thoroughly
   - Identify related files that provide context (imports, shared utilities, tests, configs)
   - read enough surrounding code to understand patterns, conventions, and architecture
   - Build a mental model of how the reviewed code fits into the broader system

3. **Detect Stack and Context**
   - Identify languages, frameworks, and libraries in use
   - Note project conventions (naming, file structure, patterns)
   - Check for linting configs, formatting rules, or style guides that indicate project standards
   - This detection informs which best practices to apply in Phase 2

---

## Phase 2: Multi-Dimensional Analysis

**Select dimensions dynamically** based on what's being reviewed. Not all dimensions apply to everything — pick the ones that are relevant.

Available dimensions (select 3-5 most relevant):

4. **Best Practices & Patterns**
   Apply when: reviewing code or configuration files

   - **Language idioms**: Is the code idiomatic for its language? (e.g., Pythonic patterns, Go conventions, Rust ownership patterns)
   - **Framework patterns**: Does it follow framework best practices? (e.g., React hooks rules, Express middleware patterns, Django conventions)
   - **Design principles**: SOLID, DRY, separation of concerns — but only flag real violations, not theoretical ones
   - **Code clarity**: Naming, structure, readability. Could someone new to the codebase understand this?
   - **Project consistency**: Does this match the conventions used elsewhere in the codebase?

5. **Technical Risk Analysis**
   Apply when: reviewing code, architecture, or infrastructure

   - **Failure modes**: What happens when things go wrong? Are error paths handled?
   - **Edge cases**: What inputs, states, or conditions aren't accounted for?
   - **Performance concerns**: N+1 queries, unbounded loops, memory leaks, blocking operations?
   - **Security implications**: New attack surfaces? Input validation gaps? Auth issues?
   - **Concurrency issues**: Race conditions, deadlocks, data corruption?
   - **Data integrity**: Can this lose, corrupt, or incorrectly transform data?

   Classify each risk:
   - **Critical**: Will definitely cause problems in production
   - **Warning**: May cause issues under certain conditions
   - **Note**: Worth considering but not blocking

6. **Completeness & Gaps**
   Apply when: reviewing features, implementations, or configurations

   - **Missing error handling**: Happy path only?
   - **Missing validations**: Input, schema, boundary checks?
   - **Missing tests**: Are tests proportional to change risk?
   - **Missing documentation**: API changes without docs? Config without examples?
   - **Cross-cutting concerns**: Logging, monitoring, accessibility, backwards compatibility?

7. **Structure & Organization**
   Apply when: reviewing directories, multi-file changes, or architecture

   - **File organization**: Are things where you'd expect to find them?
   - **Module boundaries**: Are responsibilities clearly separated?
   - **Dependency direction**: Do dependencies flow in a sensible direction?
   - **Cohesion**: Do related things live together? Are unrelated things separated?

8. **Alternative Approaches**
   Apply when: the current approach has significant issues or there's a clearly better way

   - **Simpler approach**: Can this be done with less complexity?
   - **Existing solutions**: Does the codebase or ecosystem already solve this?
   - **Better-suited patterns**: Would a different pattern work better here?

   For each alternative: what it is, why it might be better, what it would cost to switch.

---

## Phase 3: Interactive Discussion

9. **Present Findings**

   Present your analysis organized by the dimensions you selected. For each finding:
   - State the finding clearly with file:line references where applicable
   - Explain the reasoning — why is this a concern or improvement opportunity?
   - Suggest a concrete resolution

   Use `ask the user` after presenting each major dimension to check:
   - Does the user agree with the assessment?
   - Are there constraints or context you're not aware of?
   - Which findings does the user want to act on?

10. **Discuss and Refine**

    Based on user feedback:
    - Drop findings the user has good reasons to dismiss
    - Deepen analysis on areas the user wants to explore further
    - Refine recommendations based on constraints the user reveals
    - Converge on a set of agreed-upon changes

---

## Phase 4: Claude Cross-Model Review (default)

**Run this phase by default** as part of every Codex review. After Codex's own analysis pass, hand the same target + context to the `claude` CLI for an independent review, then present findings side-by-side.

Skip this phase only when:
- `claude` CLI not installed (Step 11 returns NOT_FOUND).
- Claude auth probe fails (Step 12 fails).
- The user explicitly says "codex-only review" / "skip claude" / "no second opinion" / "skip Phase 4".

A Codex session should not recursively run another Codex review by default; use Claude CLI for the independent pass. Only run `codex review` from inside Codex when the user explicitly names a Codex CLI review.

11. **Check Claude availability**

```bash
CLAUDE_BIN=$(which claude 2>/dev/null || echo "")
[ -z "$CLAUDE_BIN" ] && echo "NOT_FOUND" || echo "FOUND: $CLAUDE_BIN"
```

If `NOT_FOUND`: skip this phase and note inline:
> "Claude CLI not found — skipping second opinion."

12. **Run a lightweight auth probe**

Use a short non-interactive command before sending code or plan context:

```bash
claude -p --permission-mode dontAsk "Reply with CLAUDE_AUTH_OK only." < /dev/null
```

If the command fails, skip this phase and note inline:
> "Claude CLI is installed but not ready for non-interactive review — skipping second opinion."

13. **Build the Claude context packet**

Pass Claude enough context to review independently without forcing it to rediscover the entire conversation. Keep it compact and explicit:

- Review target: path, directory, diff, plan, topic, or session scope.
- User request and review intent.
- Detected stack/framework/test setup.
- Relevant plan or session summary, including decisions, assumptions, and open risks.
- Git status and diff summary. Include full diff when reviewing changes; include selected file contents when reviewing standalone files or plans.
- Codex findings so far, clearly labeled as prior findings Claude may challenge.
- Constraints: review only unless asked to edit; focus on bugs, regressions, security, data integrity, performance, and missing tests.

Do not include secrets, credentials, unrelated private conversation, or unrelated files. If the explicit target is inside `~/.codex`, allow Claude to read only the target paths and directly related files; otherwise tell Claude not to read or execute files under `~/.codex/`, `.codex/skills/`, `~/.claude/`, or `.claude/skills/`.

14. **Run Claude review**

Prefer non-interactive print mode and allow only read-oriented tools. Set `REVIEW_ROOT` to the repository root from `git rev-parse --show-toplevel`; if there is no repository, use the reviewed file's parent directory or the reviewed directory itself. Build `CLAUDE_REVIEW_PROMPT` from the prompt template below. If the prompt is long, pass it via stdin or a temporary prompt file instead of forcing it into one shell argument.

```bash
claude -p \
  --model opus \
  --effort high \
  --permission-mode dontAsk \
  --tools "Read,Grep,Glob,Bash(git status *),Bash(git diff *),Bash(git rev-parse *)" \
  --add-dir "$REVIEW_ROOT" \
  "$CLAUDE_REVIEW_PROMPT"
```

Prompt template:

```text
You are providing an independent second-opinion review for Codex.

Review only. Do not edit files.

Target:
<target>

User request:
<request>

Context and plan:
<compact session or plan summary>

Repository state:
<git status, diff stat, base branch if known>

Artifacts to inspect:
<paths and why they matter>

Scope restrictions:
<allowed paths and explicit directories Claude must not read or execute>

Codex findings so far:
<findings, or "none yet">

Please return:
1. Findings ordered by severity with exact file:line references.
2. Missing tests or validation gaps.
3. Any Codex findings you disagree with or would downgrade.
4. Any risks Codex missed.
```

15. **Present Claude output and compare**

Clearly separate:
- Findings from this Codex review.
- Findings from Claude's external review.
- Overlap, disagreement, and unique findings from each pass.

Use this shape when useful:

```text
CLAUDE SAYS (independent second opinion):
============================================================
<Claude output>
============================================================

CROSS-MODEL ANALYSIS:
  Both found:        <overlapping findings>
  Only Claude found: <unique Claude findings>
  Only Codex found:  <unique Codex findings>
  Disagreements:     <items one model disputes or downgrades>
```

---

## Phase 5: Apply Changes

16. **Offer to Apply Changes**

    After discussion, ask the user:
    - "Would you like me to apply the agreed recommendations to the reviewed files?"
    - Options: "Yes, apply changes" | "No, the discussion was sufficient" | "Save recommendations as a review document"

17. **Apply Updates** (if requested)

    If applying changes:
    - Make the agreed modifications directly to the reviewed files
    - Show a summary of what was changed

    If saving as review document:
    - Write to a sensible location relative to the reviewed files
    - Include all findings, discussion outcomes, and recommendations

---

## Report

After the review is complete, provide:

```
Review Complete

Target: <what was reviewed>
Stack: <detected languages/frameworks>

Dimensions Analyzed:
- <dimension 1>: <N findings>
- <dimension 2>: <N findings>
- ...

Key Findings:
- <most important finding 1>
- <most important finding 2>
- <most important finding 3>

Claude Cross-Model Review: <COMPLETED | FAIL (N critical/blocking findings) | SKIPPED (not installed) | SKIPPED (not ready) | SKIPPED (user opted out)>
Cross-model agreement: <X% — N/M findings overlap> (omit if Claude skipped)

Outcome: <"Changes applied" | "Recommendations discussed" | "Review document saved to <path>">
```

## Error Handling

- If target doesn't exist: report error and ask user to clarify
- If target is empty or trivial: note that there isn't enough substance to review meaningfully
- If no issues found: report clean review — acknowledge the code is solid and ready as-is
