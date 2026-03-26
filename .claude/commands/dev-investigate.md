---
name: dev-investigate
description: Iterative problem investigation loop - understand, verify, locate until root cause found
argument-hint: [problem description]
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
  - Task
  - AskUserQuestion
  - Bash
  - Write
  - WebFetch
  - WebSearch
---

# Purpose

Systematically investigate a problem through an iterative loop that ensures understanding before proceeding. Uses the explorer agent for fast targeted searches.

Use when:
- You encounter a bug or unexpected behavior
- You need to find WHERE something is happening in code
- The root cause is unclear
- You want to avoid guessing and ensure thorough investigation

## Variables

PROBLEM: `$*` — The user's initial problem description or question

## Checklist
You MUST create a task for each of these items and complete them in order:
1. **Understand problem** — parse and interpret problem description, write brief summary of what you think problem is
2. **Verify understanding** — use AskUserQuestion to confirm understanding, ask clarifying questions, loop back if unclear
3. **Locate via explorer agent** — delegate to explorer agent for targeted search, document findings with file paths and code context
4. **Verify location** — confirm looking at right place, trace from code path to observed behavior
5. **Confirm root cause found** — verify can answer WHERE, WHAT, and WHY; loop back if not found
6. **Save investigation file** — write structured file to `artifacts/investigation/investigation-TIMESTAMP.md`
7. **Write fix tests** — detect test framework, write reproduction test (currently failing) + regression tests (currently passing) to `tests/regression/fix-TIMESTAMP.[ext]`, confirm red/green status, add `test_file` to investigation frontmatter

## Instructions

You are an investigative agent. Your goal is to find the root cause of a problem through a structured loop. **Never assume you understand** - always verify.

```
┌─────────────────────────────────────┐
│  1. UNDERSTAND                      │
│  Parse and interpret the problem    │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  2. VERIFY UNDERSTANDING            │
│  Ask clarifying questions           │
│  Loop back if unclear               │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  3. LOCATE (via explorer agent)     │
│  Delegate targeted search           │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  4. VERIFY LOCATION                 │
│  Confirm with user or evidence      │
│  Loop back if wrong area            │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  5. FOUND?                          │
│  If root cause identified → DONE    │
│  If not → refine and loop           │
└─────────────────────────────────────┘
```

### Step 1: UNDERSTAND

Parse the problem description:
- What is the observed behavior?
- What is the expected behavior?
- What is the context/environment?
- Are there error messages or logs?

Write a brief summary of what you think the problem is.

### Step 2: VERIFY UNDERSTANDING

**CRITICAL**: Do NOT skip this step. Use AskUserQuestion to confirm:

```
Questions to ask (pick relevant ones):
- "To confirm: you're seeing [X] when you expect [Y]?"
- "Is this happening in [context] or [other context]?"
- "When did this start happening?"
- "Are there any error messages?"
- "What have you already tried?"
```

If understanding is incorrect or incomplete:
- Update your understanding
- Ask follow-up questions
- **Loop back to Step 1** until confident

### Step 3: LOCATE (via Explorer Agent)

**Delegate to the explorer agent** for targeted search. Use Task tool with subagent_type: "explorer":

```
Use the explorer agent in targeted query mode to find:
<specific question about where the problem might be>

Keywords to search: <error messages, function names, related terms>
Expected file types: <relevant extensions if known>
```

The explorer agent will:
1. Search for keywords from error messages
2. Find relevant files using Glob/Grep
3. Report structured findings with file:line references

**If deeper investigation needed** after explorer returns:
- Read suspect files to understand flow
- Trace the path from user action to problem

Document what you find:
- File paths and line numbers
- Relevant code sections
- How data/control flows

### Step 4: VERIFY LOCATION

Before concluding, verify you're looking at the right place:

- Is this where the symptom originates?
- Does this code path match the user's context?
- Can you trace from here to the observed behavior?

If unsure, ask the user:
- "I found [X] in file:line. Does this look like the right area?"
- "The issue seems to be in [component]. Is that where you'd expect?"

### Step 5: FOUND?

**Problem Found** if you can answer:
- WHERE is it? (file:line)
- WHAT is wrong? (specific issue)
- WHY does it cause the symptom? (causal chain)

**Not Found** if:
- Multiple possible causes exist
- Can't trace to root cause
- Need more information

If not found:
- Refine understanding based on what you learned
- **Loop back to Step 1** with new context

## Output Format

When the investigation is complete, output:

```markdown
## Investigation Complete

### Problem Summary
<1-2 sentence description of the problem>

### Root Cause
**Where:** `<file_path>:<line_number>`
**What:** <description of the issue>
**Why:** <explanation of how this causes the symptom>

### Evidence
- <finding 1 with file:line reference>
- <finding 2 with file:line reference>
- <finding 3 if applicable>

### Code Context
```
<relevant code snippet showing the issue>
```

### Recommended Fix
<optional: brief suggestion for how to address>

---
Investigation iterations: <N>
Explorer agent calls: <N>
```

## Validation

Investigation is complete when:
- [ ] Root cause location identified (file:line)
- [ ] Causal chain can be explained
- [ ] User confirms the finding makes sense

## Save Investigation File

After the investigation is complete and validated, save the findings to a file for future reference and handoff.

### Create the directory

```bash
mkdir -p artifacts/investigation
```

### Generate timestamp

```bash
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
```

### Write `artifacts/investigation/investigation-$TIMESTAMP.md`

The file must have YAML frontmatter followed by the full investigation body:

```
---
timestamp: <ISO 8601 timestamp>
issue_summary: "<ISSUE_SUMMARY — single line, no newlines>"
root_cause_location: "<file:line>"
root_cause_what: "<what is wrong — single line>"
root_cause_why: "<why it causes the symptom — single line>"
target_url: "<http://... or empty string>"
repro_steps: "<numbered steps as single-line pipe-delimited string, or empty>"
recommended_fix: "<brief fix suggestion — single line>"
completion_promise: "FIX_COMPLETE"
test_file: "tests/regression/fix-<TIMESTAMP>.<ext>"
iterations: <N>
explorer_calls: <N>
---

## Investigation Complete

### Problem Summary
<1-2 sentence description>

### Root Cause
**Where:** `<file_path>:<line_number>`
**What:** <description>
**Why:** <explanation>

### Evidence
- <finding 1 with file:line>
- <finding 2 with file:line>

### Code Context
```
<relevant code snippet>
```

### Recommended Fix
<suggestion>

---
Investigation iterations: <N>
Explorer agent calls: <N>
```

Report the saved file path to the user so they can hand off to Ralph.

## Write Fix Tests

After saving the investigation file, write targeted tests that the fix loop will use as its acceptance gate.

### Detect test framework

Check the project root for:
- `package.json` → look for `jest`, `vitest`, `mocha` in `devDependencies`/`dependencies`; default to `vitest` if none found but a `tests/` directory exists
- `pyproject.toml` / `pytest.ini` / `setup.cfg` → pytest
- `Cargo.toml` → Rust built-in (`cargo test`)
- `go.mod` → Go built-in (`go test`)
- `Gemfile` → RSpec or minitest

Determine file extension accordingly (`.test.ts`, `.test.js`, `_test.py`, `_test.go`, etc.).

### Create the directory

```bash
mkdir -p tests/regression
```

### Write `tests/regression/fix-$TIMESTAMP.<ext>`

The file must contain exactly two types of tests:

**1. Reproduction test** — directly exercises the buggy code path. Uses the root cause location, code context, and repro steps from the investigation. Written so it currently **FAILS** (proves the bug exists) and will **PASS** after the fix.

**2. Regression tests** (1–3) — test surrounding behavior in the same module/function that should be unaffected by the fix. Written so they currently **PASS** and must continue to pass after the fix.

Example structure (JavaScript/TypeScript):
```typescript
// Fix test: <ISSUE_SUMMARY>
// Root cause: <ROOT_CAUSE_LOCATION>
// Generated by /dev-investigate

import { ... } from '<ROOT_CAUSE_LOCATION module>'

describe('Fix: <ISSUE_SUMMARY>', () => {

  // REPRODUCTION TEST — currently FAILS, must PASS after fix
  it('<describes the correct post-fix behaviour>', () => {
    // Arrange: set up the exact scenario that triggers the bug
    // Act: call the code at ROOT_CAUSE_LOCATION
    // Assert: the correct behaviour (opposite of the bug symptom)
  })

  // REGRESSION TESTS — currently PASS, must remain PASS after fix
  it('<related behaviour 1>', () => { ... })
  it('<related behaviour 2>', () => { ... })

})
```

### Untestable root causes

If the root cause cannot be reproduced via automated tests (e.g., timing-dependent, race conditions, environment-specific, visual/CSS layout issues, third-party API failures), skip test generation:
- Set `test_file` to `null` in the investigation file frontmatter
- Add a `### Why Tests Were Skipped` section in the investigation body documenting why automated reproduction isn't feasible
- The fix loop will skip the test phase when `test_file` is null
- If the issue involves a user-facing flow, note that `/test-CDT` or `/test-Playwright` user story execution can serve as the verification gate instead

### Confirm red/green status

Run the test file to verify:
1. The reproduction test **fails** (if it passes already, the bug may be intermittent — note this in the investigation file)
2. The regression tests **pass** (if any fail, fix them before handing off — do not leave broken regression tests)

```bash
# Example for vitest
npx vitest run tests/regression/fix-$TIMESTAMP.test.ts

# Example for pytest
pytest tests/regression/fix_$TIMESTAMP.py -v
```

### Update investigation file frontmatter

Update the `test_file` field in `artifacts/investigation/investigation-$TIMESTAMP.md` with the actual path:

```
test_file: "tests/regression/fix-<TIMESTAMP>.<ext>"
```

## Report

After completion, provide:

```
✅ Investigation Complete

Problem: <brief description>
Root Cause: <file:line>
Iterations: <N>

Key Findings:
- <finding 1>
- <finding 2>

To fix this, consider: <brief suggestion or "see recommended fix above">

Investigation saved: artifacts/investigation/investigation-<TIMESTAMP>.md
Fix tests written: tests/regression/fix-<TIMESTAMP>.<ext>
  - Reproduction test: FAILING (confirms bug exists)
  - Regression tests: PASSING (<N> tests)

The investigation file and tests are ready for handoff to a fix agent.
```
