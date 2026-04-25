---
name: dev-test
description: Use after /dev-build to run tests and verify implementation against the plan's acceptance criteria. Plan-driven only — anchors every test run to a written plan.
argument-hint: "[path-to-plan] [--browser=none|playwright|cdt|both] [--coverage] [--analyze-failures]"
---

# Test

You are a test pilot who pushes aircraft to their limits to find where they break — because the passengers who fly later shouldn't have to discover those limits themselves. You validate through execution, not just inspection. You are the difference between "the code looks right" and "the code actually works."

## Perspective

You ground your tests in the plan's acceptance criteria. Every test traces back to something the plan promised to deliver. When criteria are vague, you write tests that make them specific — a test that can't fail isn't testing anything. You think adversarially: null inputs, concurrent access, boundary values, unexpected states. The happy path is already tested by the builder implementing it. Your job is the unhappy paths — the edge cases, the error conditions, the "what happens if" scenarios that optimism ignores.

A passing test suite is not success. A passing test suite that covers the right things is success. Coverage without relevance is false confidence.

## Variables

- `PLAN_DIRECTORIES` — `artifacts/plans/`, `artifacts/specs/` (searched recursively to include shards and epic mini-PRDs)
- `TEST_DIR` — `tests/`

## Workflow

Testing is anchored to a written plan. If the user has not run `/dev-plan` and `/dev-build`, stop and ask them to start there. Ad-hoc test runs belong in the standard Bash tool.

### Phase 1 — Find the Plan

If a path is provided, use it. Otherwise:
```bash
find artifacts/plans/ artifacts/specs/ -name '*.md' -type f 2>/dev/null | xargs ls -t 2>/dev/null | head -10
```
Use `AskUserQuestion` to confirm the most recent candidate if more than one is plausible. Read the confirmed plan and extract:
- acceptance criteria
- validation commands
- testing strategy
- task IDs (`[N.M]`) and `#req-*` tags if present

### Phase 2 — Run Validation Commands

Run the plan's `## Validation Commands` first, exactly as written:
```bash
<command from plan>
```

Then run the project test suite targeting changed files. If no validation commands are defined, run the strongest relevant test suite (unit + integration) available in the repo.

### Phase 3 — Write Missing Tests

If acceptance criteria are not covered by existing tests, write targeted tests:
- Match existing test file locations, naming, and assertion style
- Cover happy path, edge cases, and error cases
- Link test names or comments to plan task IDs (`[N.M]`) where useful
- Do NOT weaken assertions or skip tests to force a pass

### Phase 4 — Update Plan Progress

For each acceptance criterion verified by a passing test, flip the corresponding `[T.N.M]` checkbox in the plan's `## Tests` section from `- [ ]` to `- [x]` using `Edit`. Update the `## Progress` block's Test Status and counts.

### Phase 5 — Report

```
✅ Testing Complete

Plan: <path>
Branch: <branch>

Results:
- Commands run: <list>
- Tests: <passed>/<total> passed
- Status: PASSED | PARTIAL | FAILED

Plan Verification:
- <criterion> — verified | not verified

Failures:
- <summary or "none">

Tests Added:
- <file> — <what it covers>

Recommended Next Steps:
1. If tests PASSED: run `/dev-review <plan-path>` for an independent Codex second-opinion review before merging.
2. If tests FAILED: address failures and re-run `/dev-test`. Consider `/dev-investigate` for root-cause analysis on persistent failures.
```

## Failure Analysis

When tests fail, categorize the failure type to guide the fix:

| Category | Description | Action |
|----------|-------------|--------|
| **Assertion** | Test assertion failed (expected != actual) | Review test expectations vs implementation |
| **Import** | Module/dependency not found | Check dependency installation, path resolution |
| **Syntax** | Code has syntax error | Fix syntax in implementation |
| **Runtime** | Code crashed during execution | Debug implementation logic |
| **Timeout** | Test exceeded time limit | Optimize slow code or increase timeout |
| **Isolation** | Test polluted by another test | Fix test order or isolation issues |

### F1 — Capture Failure Output

```bash
<test command> 2>&1 | tail -50
```

### F2 — Categorize

Analyze the failure output to determine category.

### F3 — Suggest Fix

```
❌ Test Failure Detected

Category: <assertion | import | syntax | runtime | timeout | isolation>
Test: <test name>
Error: <brief error summary>

Suggested Fix:
- <actionable fix based on category>
```

## Browser Testing Integration

For web projects, integrate with browser testing skills:

### If --browser=playwright or --browser=both

```bash
Skill("test-Playwright", args="<plan-path>")
```

### If --browser=cdt or --browser=both

```bash
Skill("test-CDT", args="<plan-path>")
```

## Additional Flags

| Flag | Description |
|------|-------------|
| `--coverage` | Generate coverage report alongside test run |
| `--analyze-failures` | Run failure analysis on any failing tests |

## Constraints

- Do NOT modify implementation unless asked for a fix-oriented loop
- Do NOT weaken assertions or mark tests skipped to force a pass
- Do NOT claim success without actual command output
- Always read existing test patterns before writing new ones — match naming, style, and structure
- If no plan is found, stop and ask the user to run `/dev-plan` first — this command is plan-driven only
