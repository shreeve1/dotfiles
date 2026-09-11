# Analyze Workflow

**Mode 3 — Analyze Coverage**

Use when the goal is coverage insight rather than execution.

**Voice notification:** Already sent by SKILL.md on invocation.

## Variables

- `TEST_DIR` — `tests/`
- `MANIFEST_PATH` — `.pi/test-manifest.json`

---

## Phase A1 — Inspect Test Landscape

Map:
- Source directories and key modules
- Test directories and naming patterns
- Files with no corresponding tests
- Test runner and config

Use `Glob` and `Grep` to map source-to-test relationships. Check for:
- Every source file that has a matching test file
- Every source file that lacks a corresponding test
- Test files that may be stale (source file changed significantly since test was written)

---

## Phase A2 — Report Gaps

```
Analysis Complete

Mode: Analyze

Missing Tests (highest priority first):
- <module> — <why it matters>

Partial Coverage:
- <module> — <what's missing>

Stale Tests (may not match recent changes):
- <file>

Recommendations:
1. <highest value test to add>
2. <next>
```

---

## Failure Analysis (Phase F)

If the `--coverage` flag is set and a coverage tool is run, apply failure analysis to any test failures that occur:

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
