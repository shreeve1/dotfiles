---
name: tdd
description: Implement features using TDD RED/GREEN cycle - write failing tests first, then minimal code to pass
argument-hint: [path-to-plan]
model: opus
---

# TDD (Test-Driven Development)

Implement features using strict Test-Driven Development (RED/GREEN cycle). Write failing tests FIRST based on acceptance criteria (RED), then write minimal code to make them pass (GREEN). Use for backend business logic, APIs, services, algorithms, and data validation where correctness is critical.

## Variables

PATH_TO_PLAN: $ARGUMENTS
TEST_DIR: `tests/`
IMPLEMENTATION_TYPE: `tdd`

## Checklist

You MUST create a task for each of these items and complete them in order:
1. **Validate inputs** — confirm PATH_TO_PLAN exists, ask user if missing
2. **Analyze plan** — extract acceptance criteria, relevant files, implementation steps
3. **Detect project conventions** — identify test framework, directory structure, naming patterns
4. **Identify TDD-suitable components** — determine what should use TDD (skip UI/visual)
5. **RED phase** — write failing tests based on acceptance criteria
6. **Verify RED state** — run tests and confirm they all fail for the right reasons
7. **GREEN phase** — implement minimal code to pass each test
8. **Verify GREEN state** — run full test suite and confirm all tests pass
9. **Final verification** — run complete test suite one last time
10. **Report completion** — summarize results and suggest /cc-refactor next

## Instructions

### When to Use This Command

**Use TDD for:**
- Backend business logic (APIs, services, algorithms)
- Data transformations and validation
- Authentication/authorization logic
- Critical calculation functions
- Any code where correctness is paramount

**NOT for (use /dev-build instead):**
- UI components (React/Vue/Svelte)
- CSS/styling and layout
- HTML templates
- Database migrations
- Exploratory prototypes

### Step 1: Validate Inputs

- If no PATH_TO_PLAN provided, use AskUserQuestion to ask for it
- Read the plan file at PATH_TO_PLAN
- If file doesn't exist, report error and ask for correct path
- Initialize TodoWrite checklist with all steps

### Step 2: Analyze the Plan

Read the plan file and extract:
- **Task Description** - What is being built
- **Objective** - The goal
- **Acceptance Criteria** - These become your tests
- **Relevant Files** - Existing files to modify/reference
- **Step by Step Tasks** - Implementation roadmap
- **Testing Strategy** - Any testing guidance
- **Tech Stack** - Languages, frameworks, libraries

Read each relevant file to understand codebase structure and patterns.

### Step 3: Detect Project Conventions

Before writing code, analyze the project to determine:
- **Test framework**: pytest, vitest, jest, mocha, go test, etc.
- **Test directory structure**: tests/, __tests__/, spec/, etc.
- **Test naming conventions**: test_*.py, *.test.ts, *_test.go, etc.
- **Import patterns**: How modules are imported
- **Assertion style**: assert, expect, should, etc.

Use Glob and Grep to find existing test files and match their patterns exactly.

If no test framework detected, install the appropriate one for the project's language.

### Step 4: Identify TDD-Suitable Components

Categorize each component from the plan:

**Use TDD for:**
- Business logic functions/methods
- API endpoint handlers
- Data validation/transformation
- Auth/authorization logic
- Calculations and algorithms
- Service classes
- Database query builders (not migrations)
- Middleware and interceptors
- Utility functions

**Skip TDD for:**
- React/Vue/Svelte components (visual)
- CSS/styling
- HTML templates
- Database migrations (structural)
- Static config files
- Build scripts

If plan is entirely UI/visual, inform user:
"This plan consists entirely of UI/visual components. TDD is not the right approach here. Consider using /dev-build instead."
Then stop execution.

If mixed, identify which parts use TDD and note others for /dev-build.

### Step 5: RED Phase - Write Failing Tests

For each TDD-suitable component:

1. **Start with simplest behavior** from acceptance criteria
2. **Write one test at a time** describing expected behavior
3. **Each test is specific and focused** - one behavior per test
4. **Name tests descriptively**:
   - Good: `test_user_with_expired_token_receives_401_response`
   - Bad: `test_auth`

5. **Include test categories**:
   - Happy path: Normal expected inputs
   - Edge cases: Boundary values, empty inputs
   - Error handling: Invalid inputs, missing data
   - State transitions: Before/after behavior

6. **Organize by component**:
   - Unit tests: `tests/unit/`
   - Integration tests: `tests/integration/`

7. **Write tests that import from expected module paths** even though modules don't exist yet - imports will fail (correct for RED phase)

8. **DO NOT write any implementation code** - no stubs, empty classes, or placeholders

### Step 6: Verify RED State

1. Run test suite using project's test runner
2. Every new test MUST fail. Expected reasons:
   - ImportError/ModuleNotFoundError (module doesn't exist)
   - NameError (function/class not defined)
   - AssertionError (stubs exist but logic missing)
3. If any new test passes without implementation, fix or remove it
4. Record count of failing tests
5. Report RED state:
   - Number of tests written
   - All tests failing as expected

### Step 7: GREEN Phase - Minimal Implementation

For each failing test, simplest to most complex:

1. **Write absolute minimum code** to make that test pass:
   - Do NOT add features tests don't require
   - Do NOT optimize or refactor during this phase
   - Do NOT add error handling that's not tested
   - Hardcoding return values is acceptable (next test forces generalization)

2. **Run relevant test after each small change**:
   - If passes, move to next failing test
   - If fails, adjust implementation (not test, unless test has genuine bug)

3. **Iterate through all failing tests** until every test is GREEN

4. **If stuck** after 3 attempts on one test:
   - Re-read test to verify correctness
   - Check for typos, import paths, incorrect assumptions
   - Use AskUserQuestion to ask user for guidance

### Step 8: Verify GREEN State

1. Run ENTIRE test suite (not just new tests)
2. Confirm:
   - All new tests pass
   - All pre-existing tests still pass (no regressions)
   - No tests skipped or pending
3. If pre-existing tests broke, fix implementation for backward compatibility

### Step 9: Final Verification

1. Run complete test suite one final time
2. If project has coverage tool, run it and record results
3. Verify everything is GREEN

### Step 10: Report Completion

Provide final report in format below.

## Best Practices

- Never write implementation before its test exists and fails
- Each test should test exactly one behavior
- Test names should read as specifications
- Keep GREEN phase minimal - resist refactoring (that's what /cc-refactor is for)
- If acceptance criteria ambiguous, write test for most reasonable interpretation and note ambiguity
- Always run full test suite at end to catch regressions
- Use project's existing test patterns - don't introduce new frameworks
- Prefer pure functions and dependency injection for testability
- Mock external dependencies (databases, APIs, filesystems) in unit tests
- Use real dependencies in integration tests where practical

## Workflow Integration

This command integrates with your workflow:

**Before /tdd**:
- `/plan` to create the plan
- `/validate` to confirm plan against codebase

**Instead of /tdd**:
- `/dev-build` for UI-heavy or exploratory work

**After /tdd**:
- `/cc-refactor` to improve code structure with test safety net

**Typical flow:**
1. `/plan` "Add user authentication"
2. `/validate` artifacts/plans/user-authentication.md
3. `/cc-tdd` artifacts/plans/user-authentication.md (RED/GREEN)
4. `/cc-refactor` (improve structure)

## Report

After successful completion:

```
✅ TDD Implementation Complete (GREEN)

Plan: <PATH_TO_PLAN>
Approach: Test-Driven Development (RED -> GREEN)

RED Phase:
- <N> tests written covering acceptance criteria
- All tests initially failed ✓ (proper RED state)

GREEN Phase:
- Minimal implementation completed
- All <N> tests now passing ✓

Files Created:
- <file path> - <description>

Files Modified:
- <file path> - <description>

Test Summary:
- Unit tests: <count>
- Integration tests: <count>
- Total tests: <count>
- All passing: Yes ✓
- Coverage: <percentage>% (if available)
- Pre-existing tests: All still passing ✓ (no regressions)

Next Step:
Run /cc-refactor to improve code structure while keeping tests green.
```

If partially complete:

```
⚠️ TDD Implementation Partially Complete

Plan: <PATH_TO_PLAN>
Approach: Test-Driven Development (RED -> GREEN)

Completed:
- <N> tests written
- <M> tests passing

Stuck On:
- <test name> - <reason for failure>
- <description of attempts>

Files Created/Modified:
- <file path> - <description>

Action Required:
<Specific guidance needed from user>
```
