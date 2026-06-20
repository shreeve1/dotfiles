# Run Workflow

**Mode 2 — Run Tests**

Use for fast execution of existing tests.
## Variables

- `MANIFEST_PATH` — `.pi/test-manifest.json`
- `TEST_DIR` — `tests/`

---

## Phase R1 — Find Test Command

If `MANIFEST_PATH` exists, read it for the preferred run command. Otherwise infer from project structure:

```bash
cat package.json 2>/dev/null | grep -A5 '"scripts"'
find . -name "pytest.ini" -o -name "jest.config*" -o -name "vitest.config*" 2>/dev/null | head -5
```

---

## Phase R2 — Run Tests

```bash
<test command>
```

If any tests fail, proceed to Failure Analysis (Phase F).

---

## Phase R3 — Report

```
Testing Complete

Mode: Run
Command: <command>
Tests: <passed>/<total> passed
Status: PASSED | FAILED

Failures:
- <summary or "none">
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
