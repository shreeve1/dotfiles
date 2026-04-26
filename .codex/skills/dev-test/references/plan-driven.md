# PlanDriven Workflow


## Contents

- [Variables](#variables)
- [Phase P1 — Find the Plan](#phase-p1-find-the-plan)
- [Phase P2 — Run Validation Commands](#phase-p2-run-validation-commands)
- [Phase P3 — Write Missing Tests](#phase-p3-write-missing-tests)
- [Phase P4 — Report](#phase-p4-report)
- [Failure Analysis (Phase F)](#failure-analysis-phase-f)
  - [Failure Categories](#failure-categories)
  - [Phase F1 — Capture Failure Output](#phase-f1-capture-failure-output)
  - [Phase F2 — Categorize](#phase-f2-categorize)
  - [Phase F3 — Suggest Fix](#phase-f3-suggest-fix)

**Mode 1 — Plan-Driven Testing**

Use when verification should be anchored to a written plan.
## Variables

- `PLAN_DIRECTORIES` — `plans/`, `specs/`, `artifacts/plans/`
- `MANIFEST_PATH` — `.pi/test-manifest.json`
- `TEST_DIR` — `tests/`

---

## Phase P1 — Find the Plan

If a path is provided, use it. Otherwise:

```bash
ls -t plans/ specs/ artifacts/plans/ 2>/dev/null
```

read the most recent plan and extract:
- Acceptance criteria
- Validation commands
- Testing strategy
- task IDs (`[N.M]`) and `#req-*` tags if present

---

## Phase P2 — Run Validation Commands

Run the plan's `## Validation Commands` first:

```bash
<command from plan>
```

Then run the project test suite targeting changed files.

If any tests fail, proceed to Failure Analysis (Phase F).

---

## Phase P3 — Write Missing Tests

If acceptance criteria are not covered by existing tests, write targeted tests:
- Match existing test file locations, naming, and assertion style
- Cover happy path, edge cases, and error cases
- Link test names or comments to plan task IDs where useful
- Do NOT weaken assertions or skip tests to force a pass

---

## Phase P4 — Report

```
Testing Complete

Mode: Plan-Driven
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
1. <next step>
```

---

## Failure Analysis (Phase F)

When tests fail during this workflow, apply failure analysis:

### Failure Categories

| Category | Description | Action |
|----------|-------------|--------|
| **Assertion** | Test assertion failed (expected != actual) | Review test expectations vs implementation |
| **Import** | Module/dependency not found | Check dependency installation, path resolution |
| **Syntax** | Code has syntax error | Fix syntax in implementation |
| **Runtime** | Code crashed during execution | Debug implementation logic |
| **Timeout** | Test exceeded time limit | Optimize slow code or increase timeout |
| **Isolation** | Test polluted by another test | Fix test order or isolation issues |

### Phase F1 — Capture Failure Output

```bash
<test command> 2>&1 | tail -50
```

### Phase F2 — Categorize

Analyze the failure output to determine category.

### Phase F3 — Suggest Fix

```
Test Failure Detected

Category: <assertion | import | syntax | runtime | timeout | isolation>
Test: <test name>
Error: <brief error summary>

Suggested Fix:
- <actionable fix based on category>
```
