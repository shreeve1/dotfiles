# Investigate Workflow

Systematic 6-phase investigation loop: understand -> resolve ambiguity -> locate -> verify -> confirm -> stop at diagnosis.

## Key Principle

**Stop at Diagnosis** — This skill diagnoses only. No code edits unless user explicitly asks for a fix. Findings are saved to `investigations/` for handoff to a fix agent.

## Variables

PROBLEM: `$*` — Initial problem description or question

---

## Phase 1: UNDERSTAND

Parse and interpret the problem description.

**Questions to answer:**
- What is the observed behavior?
- What is the expected behavior?
- What is the context/environment?
- Are there error messages or logs?
- What have you already tried?

**Output:** Write a brief summary of your current understanding of the problem.

---

## Phase 2: RESOLVE AMBIGUITY

**CRITICAL:** Do NOT skip this phase. Ambiguity here creates waste downstream.

Use `AskUserQuestion` to confirm understanding and resolve ambiguity:

```
Questions to ask (pick relevant ones):
- "To confirm: you're seeing [X] when you expect [Y]?"
- "Is this happening in [context] or [other context]?"
- "When did this start happening — was it working before?"
- "Are there any error messages or stack traces?"
- "What have you already tried?"
- "Does this reproduce consistently or intermittently?"
```

**If understanding is incorrect or incomplete:**
- Update your summary
- Ask follow-up questions
- Loop back to Phase 1 until confident

**If ambiguity cannot be resolved:**
- Note the ambiguity explicitly
- Proceed with assumptions stated clearly
- Validate assumptions in Phase 4

---

## Phase 3: LOCATE

Delegate targeted search to the explorer agent.

**Use Task tool with subagent_type: "explorer":**

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

**If deeper investigation needed after explorer returns:**
- Read suspect files to understand flow
- Trace the path from user action to problem

**Document findings:**
- File paths and line numbers
- Relevant code sections
- How data/control flows

---

## Phase 4: VERIFY LOCATION

**Do NOT assume the suspected location is correct.** Explicitly verify.

Before concluding, confirm the suspected code actually matches the symptom:

**Verification questions:**
- Is this where the symptom originates, or just a symptom of a deeper issue?
- Does this code path match the user's context (environment, inputs, config)?
- Can you trace from here to the observed behavior?
- Are the assumptions stated in Phase 2 confirmed by this code?

**If verification fails:**
- The suspected location does not explain the symptom
- Loop back to Phase 1 with new context
- Try a different code path

**If verification succeeds:**
- Document which assumptions were confirmed
- Proceed to Phase 5

---

## Phase 5: CONFIRM ROOT CAUSE

**Problem is found** only when you can answer ALL three:

| Question | Must answer |
|----------|-------------|
| WHERE? | Exact file:line of the defect |
| WHAT? | Specific issue (off-by-one, null check missing, wrong operator, etc.) |
| WHY? | Causal chain from defect -> symptom |

**Validation checklist before confirming:**

- [ ] WHERE identified — specific file:line, not a region or function name
- [ ] WHAT clearly describes the defect
- [ ] WHY explains how this defect produces the observed symptom
- [ ] Evidence citations support all three answers
- [ ] User confirms the finding makes sense (not necessarily agrees with fix direction)

**If validation fails:**
- Missing any of WHERE/WHAT/WHY -> continue investigating
- Evidence insufficient -> gather more
- User confused -> clarify before confirming

**Not Found** if:
- Multiple possible causes exist
- Cannot trace to root cause
- Missing any of WHERE/WHAT/WHY

If not found -> refine understanding based on what you learned, loop back to Phase 1.

---

## Phase 6: STOP AT DIAGNOSIS

**Diagnosis is complete.** Save findings and stop.

Do NOT:
- Write fix code
- Refactor the suspected location
- Add comments suggesting changes
- Create TODO items in code

If user wants a fix, they will invoke a fix agent with the investigation file as context.

---

## Output Format

```markdown
## Investigation Complete

### Problem Summary
<1-2 sentence description of the problem>

### Root Cause
**Where:** `<file_path>:<line_number>`
**What:** <description of the issue>
**Why:** <explanation of how this causes the symptom>

### Assumptions Confirmed
- <assumption 1 from Phase 2>
- <assumption 2>

### Evidence
- <finding 1 with file:line reference>
- <finding 2 with file:line reference>
- <finding 3 if applicable>

### Code Context
```
<relevant code snippet showing the issue>
```

---
Investigation iterations: <N>
Explorer agent calls: <N>
```

---

## Save Investigation File

After diagnosis is confirmed, save findings to `investigations/` for handoff.

### Create the directory

```bash
mkdir -p investigations
```

### Generate timestamp

```bash
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
```

### Write `investigations/investigation-$TIMESTAMP.md`

```yaml
---
timestamp: <ISO 8601 timestamp>
issue_summary: "<single line, no newlines>"
root_cause_location: "<file:line>"
root_cause_what: "<single line>"
root_cause_why: "<single line>"
assumptions_confirmed:
  - "<assumption 1>"
  - "<assumption 2>"
repro_steps: "<pipe-delimited steps or empty>"
recommended_fix: "<brief suggestion or empty>"
test_file: "<path or null>"
iterations: <N>
explorer_calls: <N>
---

## Investigation Complete

### Problem Summary
<description>

### Root Cause
**Where:** file:line
**What:** description
**Why:** explanation

### Assumptions Confirmed
- list

### Evidence
- finding 1 (file:line)
- finding 2 (file:line)

### Code Context
```
<code>
```
```

---

## Write Fix Tests

After saving the investigation file, write targeted tests as the acceptance gate for a fix agent.

### Detect test framework

| File | Framework |
|------|-----------|
| `package.json` | jest/vitest (look in devDependencies) |
| `pyproject.toml` / `pytest.ini` | pytest |
| `Cargo.toml` | Rust built-in |
| `go.mod` | Go built-in |
| `Gemfile` | RSpec or minitest |

Default to `vitest` if `package.json` with tests dir exists but no test framework specified.

### Create the directory

```bash
mkdir -p tests/regression
```

### Write `tests/regression/fix-$TIMESTAMP.<ext>`

**Required content:**

**1. Reproduction test** — currently FAILS, will PASS after fix
- Directly exercises the buggy code path
- Uses root cause location and code context
- Proves the bug exists

**2. Regression tests** (1-3) — currently PASS, must continue to PASS after fix
- Test surrounding behavior in same module/function
- Ensure fix doesn't break adjacent functionality

**Example (TypeScript):**
```typescript
// Fix test: <ISSUE_SUMMARY>
// Root cause: <file:line>
// Generated by Investigate workflow

import { ... } from '<module>'

describe('Fix: <ISSUE_SUMMARY>', () => {

  // REPRODUCTION TEST — currently FAILS
  it('<describes correct post-fix behaviour>', () => {
    // Arrange: exact scenario triggering the bug
    // Act: call the code at ROOT_CAUSE_LOCATION
    // Assert: correct behavior (opposite of bug symptom)
  })

  // REGRESSION TESTS — currently PASS
  it('<related behavior 1>', () => { ... })
  it('<related behavior 2>', () => { ... })

})
```

### Untestable root causes

If automated reproduction is not feasible (timing-dependent, race conditions, environment-specific, visual/CSS, third-party API):
- Set `test_file` to `null` in frontmatter
- Add `### Why Tests Were Skipped` section in body
- Fix agent will skip test phase
- Note that Playwright user story execution can serve as verification gate

### Confirm red/green status

```bash
# vitest
npx vitest run tests/regression/fix-$TIMESTAMP.test.ts

# pytest
pytest tests/regression/fix_$TIMESTAMP.py -v

# rust
cargo test --test fix_$TIMESTAMP
```

**Required:**
1. Reproduction test FAILS (if passes, bug may be intermittent — note in investigation)
2. Regression tests PASS (if any fail, fix before handoff)

### Update frontmatter

Add actual `test_file` path to investigation frontmatter after tests are confirmed.

---

## Report

```
Investigation Complete

Problem: <brief description>
Root Cause: <file:line>
Iterations: <N>

Assumptions Confirmed:
- <assumption 1>
- <assumption 2>

Key Evidence:
- <file:line> — <finding>
- <file:line> — <finding>

Investigation saved: investigations/investigation-<TIMESTAMP>.md
Fix tests written: tests/regression/fix-<TIMESTAMP>.<ext>
  - Reproduction test: FAILING
  - Regression tests: PASSING (<N>)

Ready for handoff to fix agent.
```
