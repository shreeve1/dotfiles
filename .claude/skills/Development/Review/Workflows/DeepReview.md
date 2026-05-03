# DeepReview Workflow

Perform a deep, critical review of whatever the user references — code files, configurations, directories, documentation, or the current session context. Analyze for best practice adherence, technical risks, and improvement opportunities. Adapt your analysis dimensions to what's actually being reviewed. Engage in interactive discussion about findings before optionally applying changes.

## Variables

TARGET: $1 — (Optional) Path to a file, directory, or topic to review. If omitted, review the current session context (what's been discussed, decided, and implemented so far).

## Checklist

You MUST create a task for each of these items and complete them in order:
1. **Identify review target** — resolve the input to concrete files or session context
2. **Deep read and comprehension** — thoroughly read the target AND surrounding codebase context
3. **Detect stack and context** — identify languages, frameworks, patterns, and conventions in use
4. **Select analysis dimensions** — choose relevant review dimensions based on what's being reviewed
5. **Run multi-dimensional analysis** — analyze each selected dimension with specific, grounded findings
6. **Present findings interactively** — share analysis per dimension and discuss with the user
7. **Independent second opinion** — resolve reviewer (codex / claude -p / both) from request, check binary + auth, run the chosen reviewer(s), present output verbatim, cross-model comparison
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
   - If `TARGET` is a directory: scan its structure, then intelligently select key files to review (entry points, exports, configs, core logic modules). Skip generated files, lock files, and boilerplate. Present your selection to the user with `AskUserQuestion` for confirmation.
   - If `TARGET` is a topic or concept: gather relevant files from the conversation context and codebase
   - If no `TARGET` provided: review the current session context — what's been discussed, decided, and implemented so far
   - If `TARGET` doesn't resolve to anything: ask the user to clarify

2. **Deep Comprehension Pass**
   - Read all target files thoroughly
   - Identify related files that provide context (imports, shared utilities, tests, configs)
   - Read enough surrounding code to understand patterns, conventions, and architecture
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

   Use `AskUserQuestion` after presenting each major dimension to check:
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

## Phase 4: Independent Second Opinion

After presenting Claude's findings and before offering to apply changes, run an independent review for a second opinion from another AI system. Two engines are available: **Codex CLI** (OpenAI) and **Claude Code one-shot** (`claude -p`, a fresh isolated session). Selection is request-driven.

11. **Resolve reviewer from invoking request**

Inspect the user's invoking request (the prompt that triggered this review) and set `_REVIEWER`:

| Phrase the user used | `_REVIEWER` |
|---|---|
| "claude review", "review with claude", "claude -p", "claude second opinion" | `claude` |
| "codex review", "review with codex", "codex second opinion" | `codex` |
| "both reviews", "second opinions", "all reviewers", "claude and codex" | `both` |
| Just "review" / no engine specified | `codex` (default — preserves prior behavior) |

State the resolved reviewer to the user before continuing:
> "Running second opinion via **<reviewer>** (resolved from request)."

If `_REVIEWER` is `both`, run the Codex branch (steps 12a–13a) AND the Claude branch (steps 12b–13b), then merge their outputs in step 14.

---

### Branch A — Codex Second Opinion (when `_REVIEWER` is `codex` or `both`)

12a. **Check Codex availability**

```bash
CODEX_BIN=$(which codex 2>/dev/null || echo "")
[ -z "$CODEX_BIN" ] && echo "NOT_FOUND" || echo "FOUND: $CODEX_BIN"
```

If `NOT_FOUND`: skip this branch. Do not fail the review — note inline:
> "Codex CLI not found — skipping codex branch. Install with: `npm install -g @openai/codex`"

If `FOUND`: continue.

**Auth probe:**

```bash
_AUTH_OK="yes"
if ! ([ -n "$CODEX_API_KEY" ] || [ -n "$OPENAI_API_KEY" ] || [ -f "${CODEX_HOME:-$HOME/.codex}/auth.json" ]); then
  _AUTH_OK="no"
fi
echo "CODEX_AUTH: $_AUTH_OK"
```

If `CODEX_AUTH: no`: skip this branch and note inline:
> "Codex auth not found — skipping codex branch. Run `codex login` or set `$OPENAI_API_KEY`."

13a. **Run Codex review**

Run against the current working tree diff. If no git diff exists (standalone file review), run Codex on the specific target file instead.

```bash
_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -n "$_REPO_ROOT" ]; then
  cd "$_REPO_ROOT"
  _DIFF_STAT=$(git diff HEAD --stat 2>/dev/null | tail -1)
  _BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || echo "main")
fi
```

If a diff exists, run review mode (5-minute timeout):

```bash
codex review "IMPORTANT: Do NOT read or execute any files under ~/.claude/, .claude/skills/, or agents/. Stay focused on repository code only." --base "$_BASE" -c 'model_reasoning_effort="high"' < /dev/null
```

If no diff (standalone file review), run consult mode with the target file content embedded.

---

### Branch B — Claude one-shot Second Opinion (when `_REVIEWER` is `claude` or `both`)

12b. **Check Claude availability**

```bash
CLAUDE_BIN=$(which claude 2>/dev/null || echo "")
[ -z "$CLAUDE_BIN" ] && echo "NOT_FOUND" || echo "FOUND: $CLAUDE_BIN"
```

If `NOT_FOUND`: skip this branch. Do not fail the review — note inline:
> "Claude CLI not found — skipping claude branch. Install with: `npm install -g @anthropic-ai/claude-code`"

If `FOUND`: continue.

**Auth probe:**

```bash
_CLAUDE_AUTH_OK="yes"
if ! ([ -n "$ANTHROPIC_API_KEY" ] || [ -f "$HOME/.claude/.credentials.json" ] || [ -f "$HOME/.config/claude/auth.json" ]); then
  _CLAUDE_AUTH_OK="no"
fi
echo "CLAUDE_AUTH: $_CLAUDE_AUTH_OK"
```

If `CLAUDE_AUTH: no`: skip this branch and note inline:
> "Claude auth not found — skipping claude branch. Run `claude` once to log in, or set `$ANTHROPIC_API_KEY`."

13b. **Run Claude one-shot review**

`claude -p` runs a fresh, isolated, non-interactive session — it does NOT see this parent session's context. We pipe the diff or file content via stdin and pass the review framing as the prompt argument. Use `--bare` to skip hook execution and CLAUDE.md auto-discovery so the reviewer judges only what we feed it.

```bash
_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -n "$_REPO_ROOT" ]; then
  cd "$_REPO_ROOT"
  _BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || echo "main")
  _HAS_DIFF=$(git diff "$_BASE"...HEAD --stat 2>/dev/null | tail -1)
fi

_REVIEW_PROMPT='You are an independent senior code reviewer providing a second opinion. The content piped via stdin is either a git diff or a file to review. Identify: (1) bugs, (2) security issues, (3) design / architecture concerns, (4) missing tests, (5) performance risks. Be specific with file:line references where the input includes them. Classify each finding as Critical / Warning / Note. Do NOT read files outside what is piped in.'

if [ -n "$_HAS_DIFF" ]; then
  git diff "$_BASE"...HEAD | claude -p --bare --permission-mode bypassPermissions --model opus --output-format text "$_REVIEW_PROMPT"
else
  cat "$TARGET" | claude -p --bare --permission-mode bypassPermissions --model opus --output-format text "$_REVIEW_PROMPT"
fi
```

If `claude -p` exits non-zero or times out (default 5 minutes), note the failure inline and continue to Phase 5 with whatever output was captured.

---

14. **Present reviewer output verbatim**

For each reviewer that ran, present its raw output under a labeled banner. Do not truncate or summarize.

If Codex ran:
```
CODEX SAYS (independent second opinion):
════════════════════════════════════════════════════════════
<full codex output — do not truncate or summarize>
════════════════════════════════════════════════════════════
```

If Claude one-shot ran:
```
CLAUDE -P SAYS (independent second opinion, fresh session):
════════════════════════════════════════════════════════════
<full claude -p output — do not truncate or summarize>
════════════════════════════════════════════════════════════
```

If `_REVIEWER` was `both`, present both banners back-to-back (Codex first, then Claude -p).

15. **Cross-model comparison**

After presenting reviewer output, synthesize findings. Adapt the section to which engines actually ran:

If only one external reviewer ran (`codex` or `claude`):
```
CROSS-MODEL ANALYSIS (Claude session vs <reviewer>):
  Both found:           [findings that overlap]
  Only <reviewer> found: [findings unique to the external reviewer — highest priority signal]
  Only Claude (session) found: [findings unique to this session's analysis]
  Agreement rate:       X% (N/M total unique findings overlap)
```

If `_REVIEWER` was `both`:
```
CROSS-MODEL ANALYSIS (Claude session vs Codex vs Claude -p):
  All three found:      [findings overlapping in all three]
  Codex + Claude -p:    [findings both external reviewers flagged but session missed]
  Only Codex found:     [unique to Codex]
  Only Claude -p found: [unique to Claude one-shot]
  Only this session:    [unique to the in-conversation Claude analysis]
  Agreement rate:       X% (N/M total unique findings overlap across all three)
```

Findings flagged by an external reviewer that this session missed are highest priority — a second independent system catching something is a strong signal.

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

Reviewer: <codex | claude -p | both | none>
Reviewer Gate: <PASS | FAIL (N critical) | SKIPPED (not installed) | SKIPPED (no auth)>
  (per-reviewer status when both ran: "codex: PASS | claude -p: FAIL (2 critical)")
Cross-model agreement: <X% — N/M findings overlap> (omit if no external reviewer ran)

Outcome: <"Changes applied" | "Recommendations discussed" | "Review document saved to <path>">
```

## Error Handling

- If target doesn't exist: report error and ask user to clarify
- If target is empty or trivial: note that there isn't enough substance to review meaningfully
- If no issues found: report clean review — acknowledge the code is solid and ready as-is
