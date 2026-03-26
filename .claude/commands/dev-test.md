---
name: dev-test
description: Use when testing an implementation after /dev-build completes. Triggers on 'run tests', 'test this', 'verify the plan', 'check acceptance criteria', 'validate implementation', or when user wants to validate against Testing Promise. Integrates with /test-Playwright and /test-CDT for browser testing.
argument-hint: "[path-to-plan] [--browser=none|playwright|cdt|both]"
model: opus
---

# Test

Read the plan at `PATH_TO_PLAN`, extract its testing requirements, then deploy a test-writing agent that writes and runs tests iteratively until the Testing Promise is satisfied.

Optionally run browser tests via `/test-Playwright` and/or `/test-CDT` after code tests complete.

## Variables

PATH_TO_PLAN: $ARGUMENTS (first positional argument or parsed from flags) — Optional, auto-discovers if omitted.
BROWSER_MODE: Parsed from `--browser` flag (none|playwright|cdt|both), defaults to "none"
TEST_DIR: `tests/`
PLAN_DIRECTORIES: `specs/`, `artifacts/plans/`

## Pre-flight Check

Before starting, verify the plan's build and test state:

1. If no `PATH_TO_PLAN` provided, use Plan Discovery Protocol first (see Phase 0)
2. Read the plan file at `PATH_TO_PLAN`
3. Check the `## Progress` section for current state

**If `Build:` is `pending`:**
```
⚠️ Build Not Complete

The plan shows Build: pending. Tests should run AFTER /dev-build.
- Run `/dev-build <PATH_TO_PLAN>` first to implement the plan
- Or proceed anyway if you know what you're doing
```
Use `AskUserQuestion` with options: "Proceed with testing" / "Cancel, run /dev-build first"

**If `Test:` is already `complete`:**
```
ℹ️ Tests Already Run

The plan shows Test: complete with <N>/<M> tests passing.
- Re-run all tests to verify current state?
```
Use `AskUserQuestion` with options: "Yes, re-run all tests" / "No, cancel"

## Checklist

You MUST complete these items in order:
1. **Parse arguments** — extract PATH_TO_PLAN and BROWSER_MODE from arguments
2. **Analyze plan** — read PATH_TO_PLAN and extract Testing Promise, Acceptance Criteria, and relevant files
3. **Auto-detect browser needs** — if BROWSER_MODE not specified, analyze plan for web components/UI flows
4. **Prepare infrastructure** — ensure TEST_DIR exists with unit/, integration/, and e2e/ subdirectories
5. **Write tests** — create comprehensive tests covering all acceptance criteria
6. **Run and iterate** — execute tests, analyze failures, fix and re-run until passing
7. **Verify promise** — confirm the Testing Promise from the plan is satisfied
8. **Browser tests (conditional)** — run `/test-Playwright` and/or `/test-CDT` based on BROWSER_MODE
9. **Report results** — provide unified test summary with pass/fail breakdown by type

## Instructions

### Argument Parsing

Parse `$ARGUMENTS` to extract:
- **PATH_TO_PLAN**: First positional argument, or empty if only flags provided
- **BROWSER_MODE**: From `--browser=VALUE` flag (none|playwright|cdt|both), defaults to "none"

Example invocations:
- `/dev-test specs/my-plan.md` → PATH_TO_PLAN="specs/my-plan.md", BROWSER_MODE="none"
- `/dev-test specs/my-plan.md --browser=playwright` → PATH_TO_PLAN="specs/my-plan.md", BROWSER_MODE="playwright"
- `/dev-test --browser=both` → PATH_TO_PLAN="", BROWSER_MODE="both"

### Plan Analysis

- If no `PATH_TO_PLAN` is provided, use the Plan Discovery Protocol:
  1. List all `.md` files in both `PLAN_DIRECTORIES` (`specs/` and `artifacts/plans/`), sorted by modification date (most recent first)
  2. Take the most recent file
  3. Use `AskUserQuestion` to confirm: "Found plan: <filename>. Is this the correct plan?"
     - Options: "Yes, use this plan" / "No, let me specify"
  4. If user says no, ask them to provide the path
  5. Read the confirmed plan file and use it as PATH_TO_PLAN for all subsequent steps
- Read the plan file completely and extract these sections:
  - **Testing Promise** - The completion criteria for the testing agent
  - **Acceptance Criteria** - What the implementation must satisfy
  - **Validation Commands** - Commands that verify correctness
  - **Relevant Files** - Files that were built/modified
  - **Step by Step Tasks** - What was implemented (extract all `- [ ] [N.M] <task> #req-[id]` items)
  - **Traceability Map** - If present, the mapping of `#req-[id]` tags to task IDs
- Parse the `## Step by Step Tasks` section to extract all task items with `[N.M]` inline ID prefixes and associated `#req-[id]` tags. Build a mapping of task IDs to their checkbox state and requirement tags.
- If the plan has no `## Testing Promise` section, derive one from the Acceptance Criteria: synthesize a single clear statement like "All unit, integration, and E2E tests in tests/ pass with zero failures".

### Browser Testing Auto-Detection

If BROWSER_MODE is "none" (not explicitly specified), analyze the plan for web/UI content:

**Check for browser-relevant content:**
- Pages, components, or UI elements mentioned
- User flows or interactions
- Frontend frameworks (React, Vue, Angular, etc.)
- API endpoints that serve HTML
- Acceptance criteria mentioning visual verification

**If web content detected:**
Use AskUserQuestion to suggest browser testing:
- "This plan appears to involve web components. Would you like to run browser tests?"
- Options: "Skip browser tests", "Playwright only", "CDT only", "Both Playwright and CDT"
- Default to "Both" if acceptance criteria explicitly mention UI verification

**If no web content detected:**
Proceed with code-level tests only.

## Workflow

### Phase 0: Parse Arguments

1. Extract PATH_TO_PLAN and BROWSER_MODE from `$ARGUMENTS`
2. If PATH_TO_PLAN is empty, use Plan Discovery Protocol to auto-find plan in both `PLAN_DIRECTORIES`
3. If BROWSER_MODE not specified, set to "none" (will auto-detect later)

### Phase 1: Analyze the Plan

1. Read `PATH_TO_PLAN` and extract all testing-relevant sections listed above
2. Identify what was built: endpoints, components, services, utilities, pages
3. Determine which test types apply:
   - **Unit tests**: For functions, utilities, services, data transformations
   - **Integration tests**: For API endpoints, database operations, service interactions
   - **E2E tests**: For ANY web-facing component, page, or user flow
4. Note the Testing Promise verbatim - this becomes the completion criteria for the test agent
5. **Auto-detect browser needs** (if BROWSER_MODE is "none"):
   - Check for: pages, components, user flows, frontend frameworks, UI verification in criteria
   - If web content found: use AskUserQuestion to suggest browser testing options
   - Update BROWSER_MODE based on user selection

### Phase 2: Prepare Test Infrastructure

1. Ensure `tests/` directory exists at project root with appropriate subdirectories:
   - `tests/unit/` for unit tests
   - `tests/integration/` for integration tests
   - `tests/e2e/` for Playwright E2E tests
2. Detect the project's language/framework (check package.json, pyproject.toml, Cargo.toml, go.mod, etc.)
3. Install test runner dependencies if missing (unit/integration only):
   - **JavaScript/TypeScript**: Ensure vitest or jest is available
   - **Python**: Ensure pytest is available
   - **Other**: Use the framework-appropriate test runner
4. **Playwright**: Do NOT install Playwright via CLI. Playwright is available as an MCP plugin (`plugin_playwright_playwright/*`). Use the MCP Playwright tools exclusively for all browser automation, E2E testing, and browser interaction. No `npx playwright install`, `playwright install`, `@playwright/test`, or `pytest-playwright` needed.

**Note on E2E tests**: The test agent should focus on unit and integration tests. E2E browser testing is handled by Phase 4 (Browser Tests) via `/test-Playwright` and/or `/test-CDT` skills, not by the test-writing agent directly.

### Phase 3: Write and Run Tests

Use direct task orchestration to write and run tests iteratively until the Testing Promise is satisfied.

1. **Create the testing task:**

```typescript
TaskCreate({
  subject: "Write and run comprehensive tests for the implementation",
  description: "Write tests covering all acceptance criteria from the plan. See plan at PATH_TO_PLAN for details.",
  activeForm: "Writing and running tests"
})
```

2. **Deploy a test-writing agent:**

```typescript
Task({
  description: "Write and run tests",
  prompt: `You are a test engineer. Your job is to write and run tests for the implementation described in the plan at PATH_TO_PLAN until ALL tests pass.

Read the plan and extract:
- What was built (from Task Description, Objective, and Step by Step Tasks sections)
- Files to test (from Relevant Files section)
- Acceptance Criteria to validate against
- Validation Commands to run
- Testing Promise (the completion criteria)
- Task IDs with [N.M] prefixes and #req-[id] tags from Step by Step Tasks

## Test Strategy

Write tests in the tests/ directory:
- tests/unit/ - Unit tests for individual functions and modules
- tests/integration/ - Integration tests for component interactions

## Plan Task Linking (IMPORTANT)

Each test MUST include a comment linking it to the plan task(s) it verifies, using the [N.M] ID prefix from the plan. Place the comment on the line immediately before the test function/block.

**JavaScript/TypeScript format:**
// Plan Task: [1.1] #req-user-login
it('should render login form', () => { ... });

**Python format:**
# Plan Task: [1.1] #req-user-login
def test_login_form_renders():
    ...

A single test MAY map to multiple task IDs by including multiple Plan Task comments on consecutive lines:
// Plan Task: [1.1] #req-user-login
// Plan Task: [1.2] #req-user-login
it('should handle full auth flow', () => { ... });

If a test covers a task that has no #req-[id] tag, just use the [N.M] prefix:
// Plan Task: [3.1]

## Rules

1. Write comprehensive tests covering ALL acceptance criteria
2. Run ALL tests after writing them
3. If tests fail, analyze the failures and fix either the tests or the implementation
4. Each iteration: write tests → run tests → read failures → fix → re-run
5. Do NOT mark tests as skipped or pending to fake passing
6. Do NOT weaken assertions to make tests pass artificially
7. If implementation has bugs, fix the implementation code

## Completion

When ALL unit and integration tests pass with zero failures, report the results with:
- Total test count and pass/fail breakdown by type (unit/integration)
- Which Plan Task IDs ([N.M]) are covered by passing tests
- Confirmation that the Testing Promise from the plan is satisfied

Iterate until complete.`,
  subagent_type: "general-purpose",
  model: "opus"
})
```

3. **The agent will:**
   - Read the plan to understand what was implemented
   - Write comprehensive tests covering all acceptance criteria
   - Run tests and analyze failures
   - Fix tests or implementation as needed
   - Iterate until all tests pass
   - Report when the Testing Promise is satisfied

4. **Monitor progress:**
   - Use `TaskList` to see task status
   - The agent will iteratively improve tests until completion
   - No manual intervention needed - the agent handles the full test cycle

### Phase 3.5: Update Plan Checkboxes (Test-is-Truth)

After the test-writing agent completes and reports results:

1. **Parse test files for Plan Task comments:**
   - Scan all test files in `tests/` for `Plan Task: [N.M]` comments
   - For each comment, extract the `[N.M]` task ID and optional `#req-[id]` tag
   - Correlate with test runner output to determine pass/fail per test

2. **Update checkboxes in the plan file:**
   - Read the current plan file at PATH_TO_PLAN
   - For each passing test that maps to a plan task:
     - Find the matching task line by its **`[N.M]` ID prefix** using pattern: `- \[[ x]\] \[\d+\.\d+\]`
     - Replace `- [ ] [N.M]` with `- [x] [N.M]`, preserving everything else on the line (description text, trailing `#req-` tags)
     - Only change the checkbox character between the brackets (space to `x`)
   - For failing tests: leave the checkbox as `[ ]`
   - For tasks with no corresponding test: leave as `[ ]`
   - Write the updated plan file

3. **Update Progress section:**
   - Find the `## Progress` section in the plan file
   - Update `Test:` from `pending` to `complete` (or `partial` if some tests failed)
   - Update `Tests:` count from `0/M` to `<passed>/M` (where M is total test count)
   - Update `Last Updated:` to current ISO timestamp with `by /dev-test`
   - Example: `2024-01-15T10:30:00Z by /dev-test`

4. **Build traceability status:**
   - Group task IDs by their `#req-[id]` tag
   - For each requirement tag, count how many associated tasks are now `[x]` vs `[ ]`
   - A requirement is "fully verified" when ALL its tasks are `[x]`
   - Tasks with no `#req-[id]` tag are listed under "Untagged Tasks"
   - Tasks with no corresponding test are noted as "untested"

### Phase 4: Browser Tests (Conditional)

Run browser testing skills based on BROWSER_MODE. Code test failures do NOT prevent browser tests from running.

**If BROWSER_MODE is "playwright" or "both":**
1. Call `Skill("test-Playwright", args=PATH_TO_PLAN)`
2. Capture the report output (passed/failed stories, acceptance criteria coverage)
3. Store results for unified report

**If BROWSER_MODE is "cdt" or "both":**
1. Call `Skill("test-CDT", args=PATH_TO_PLAN)`
2. Capture the report output (criteria results, console health, network health)
3. Store results for unified report

**Error Handling:**
- If code tests failed, still offer to run browser tests (implementation might work even if tests need adjustment)
- If browser tests fail, capture the failure details for the unified report
- Each phase's failure should not prevent subsequent phases from running

## Report

After all test phases complete, provide a unified report with the following format:

```
✅ Testing Complete

Plan: <path to plan>
Testing Promise: <the promise text>
Status: <PASSED | PARTIAL | FAILED>

─────────────────────────────────────────
Phase 1: Code Tests
─────────────────────────────────────────
Unit Tests: <count> passed, <count> failed
Integration Tests: <count> passed, <count> failed
Status: <PASSED | FAILED>

<if code tests failed:>
Failures:
- <test name>: <error summary>
</if>

<if BROWSER_MODE includes playwright:>
─────────────────────────────────────────
Phase 2: Browser Tests (Playwright)
─────────────────────────────────────────
Stories: <count> passed, <count> failed
Acceptance Criteria: <count> covered, <count> not covered
Status: <PASSED | PARTIAL | FAILED>

<if Playwright tests failed:>
Failed Stories:
- <story name>: <failure reason>
</if>
</if>

<if BROWSER_MODE includes cdt:>
─────────────────────────────────────────
Phase 3: Browser Tests (CDT)
─────────────────────────────────────────
Criteria Verified: <count> passed, <count> failed
Console: <CLEAN | <count> errors>
Network: <CLEAN | <count> failed requests>
Status: <PASSED | PARTIAL | FAILED>

<if CDT tests failed:>
Failed Criteria:
- <criterion>: <expected vs found>
</if>
</if>

─────────────────────────────────────────
Overall: <PASSED | PARTIAL | FAILED>
─────────────────────────────────────────

<if [N.M] task IDs exist in the plan:>
─────────────────────────────────────────
Plan Checkbox Updates
─────────────────────────────────────────
Tasks verified by passing tests: <count>
Tasks remaining (failing/untested): <count>
Plan file updated: <path>
</if>

<if #req-[id] tags exist in the plan:>
─────────────────────────────────────────
Traceability Status
─────────────────────────────────────────
- [x] #req-<id> (<N>/<M> tasks verified)
- [ ] #req-<id> (<N>/<M> tasks verified)
- Total: <N>/<M> requirements fully verified

Untested tasks: <list of [N.M] IDs with no corresponding test, or "None">
</if>

<if any failures:>
Next Steps:
- <actionable suggestion based on failure type>
</if>

<if all tests passed and no failures:>
Next Steps:
- All tests passing. Implementation verified against Testing Promise.
- Run `/commit` to create a commit with the implementation and tests.
</if>
```

**Status Logic:**
- **PASSED**: All executed phases passed with zero failures
- **PARTIAL**: Some phases passed, some failed (or mixed results within a phase)
- **FAILED**: Any critical failure that blocks overall functionality

**Next Steps Suggestions:**
- If code tests failed: "Fix failing unit/integration tests before proceeding"
- If Playwright failed: "Review UI implementation against acceptance criteria"
- If CDT failed: "Check console errors and network requests"
- If mixed failures: "Address code tests first, then re-run browser tests"
