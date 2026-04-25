# Discovery Workflow


## Contents

- [Variables](#variables)
- [Phase D1 — Detect Setup](#phase-d1-detect-setup)
- [Phase D2 — Save Manifest](#phase-d2-save-manifest)
- [Phase D3 — Report](#phase-d3-report)
- [Failure Analysis (Phase F)](#failure-analysis-phase-f)
  - [Failure Categories](#failure-categories)
  - [Phase F1 — Capture Failure Output](#phase-f1-capture-failure-output)
  - [Phase F2 — Categorize](#phase-f2-categorize)
  - [Phase F3 — Suggest Fix](#phase-f3-suggest-fix)

**Mode 4 — Test Discovery**

Use when the project's test setup is unclear.
## Variables

- `MANIFEST_PATH` — `.pi/test-manifest.json`
- `TEST_DIR` — `tests/`

---

## Phase D1 — Detect Setup

```bash
find . -name "jest.config*" -o -name "vitest.config*" -o -name "pytest.ini" -o -name "*.test.*" 2>/dev/null | head -20
```

Identify: language, framework, test runner, directory structure.

Check for:
- Test configuration files (jest.config, vitest.config, pytest.ini, etc.)
- Test file patterns (*.test.*, *.spec.*, test_*.py, etc.)
- Package manager scripts related to testing
- CI configuration that reveals test commands
- Coverage tooling

---

## Phase D2 — Save Manifest

Create or update `.pi/test-manifest.json`:

```json
{
  "framework": "<jest | vitest | pytest | ...>",
  "runCommand": "<exact test command>",
  "testDirs": ["tests/", "src/"],
  "lastRun": "<iso timestamp>",
  "gaps": ["<module with no tests>"]
}
```

---

## Phase D3 — Report

```
Discovery Complete

Mode: Discovery
Framework: <framework>
Run Command: <command>
Manifest: .pi/test-manifest.json <created | updated>

Gaps Found:
- <module>

Next Steps:
1. <recommended action>
```

---

## Failure Analysis (Phase F)

If a test run was attempted during discovery and failures occurred, apply failure analysis:

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
