---
name: pi-dev-test
description: Use when the user wants to verify an implementation against a plan — run its validation commands, confirm acceptance criteria, and add missing tests when the plan calls for them.
---

# Dev Test

Use this skill to verify an implementation against a written plan. Read the plan, run its validation commands, confirm acceptance criteria, and add only the tests the plan requires. Do not use this skill for exploratory QA, ad-hoc test runs without a plan, or root-cause debugging — hand those off to `dev-investigate` or direct user discussion.

---

## Variables

- `PATH_TO_PLAN` - path to a plan file (required; if absent, discover one)
- `BROWSER_MODE` - from `--browser=none|headless|headed`, default `none`
- `TEST_DIR` - `tests/`
- `PLAN_DIRECTORIES` - `artifacts/plans/`, `artifacts/specs/`

---

## Workflow Overview

Plan-Driven verification only. Run phases in sequence:

1. Discover and read the plan
2. Decide what must be verified
3. Write or expand tests only where the plan requires it
4. Run verification
5. Report plan verification

Workspace policy:
- Tests always run in the current working directory and current checkout
- If on a feature branch, run tests there

Do not make implementation changes by default. If tests expose product bugs, report them clearly and only fix implementation if the user asked for a repair-oriented testing loop.

---

## Phase 1 - Discover and Read the Plan

Before selecting commands, use `bash` to determine the execution workspace: current branch and git top-level path.

If `PATH_TO_PLAN` is provided, use it.

If not:
1. Use `bash` to find recent markdown files in `artifacts/plans/` and `artifacts/specs/` (search recursively so sharded plans and epic mini-PRDs are discovered)
2. If one clear candidate exists, confirm it with `ask_user`
3. If multiple likely candidates exist, present the most relevant options with `ask_user`
4. If no plan can be found, ask the user for a path; do not continue without one

Use `read` to inspect the selected plan.

Extract:
- task description and objective
- acceptance criteria
- testing strategy
- validation commands
- relevant files
- implementation tasks and any `[N.M]` task IDs
- `[T.N.M]` test task IDs from any `## Tests` section
- `#req-*` tags if present
- traceability information if present

---

## Phase 2 - Decide What Must Be Verified

Identify what kinds of tests are appropriate for this plan:
- **Unit tests** for functions, utilities, transformations, isolated modules
- **Integration tests** for component interaction, endpoints, services, persistence, and workflows across boundaries
- **E2E or browser tests** for user-facing flows, pages, or interactive browser behavior

If browser testing is likely relevant and `BROWSER_MODE` is `none`, ask the user whether browser verification should be included.

Decide verification coverage by mapping each acceptance criterion to:
- an existing test, or
- a plan validation command, or
- a test task in `## Tests` that still needs to be written

---

## Phase 3 - Write or Expand Tests

Prefer existing test coverage and validation commands before adding new tests.

Write or expand tests only when the plan explicitly calls for them (`## Tests` section or testing strategy) or when an acceptance criterion has no existing coverage.

Use `subagent` with `worker` when helpful for focused test-writing work. A typical prompt should instruct the subagent to:
- read the plan
- write tests for the specified criteria
- stay within the required scope
- report files created or modified
- report blockers clearly

If the plan uses traceability, include comments or naming conventions that link tests to plan task IDs (`[N.M]`) or requirement tags (`#req-*`).

Do not weaken assertions or mark tests skipped just to force a passing result.

Do not modify implementation unless the user explicitly asked for a fix-oriented loop.

---

## Phase 4 - Run Verification

Use `bash` to run:
- plan validation commands from `## Validation Commands`
- test commands appropriate to the project
- browser/E2E tests if included

Run these commands from the current working directory so test results match the code under review.

Prefer targeted commands first, then broader verification if needed.

Capture:
- pass/fail counts
- failing files or suites
- command outputs
- whether each acceptance criterion is satisfied, partially satisfied, or not yet satisfied

As tests for `[T.N.M]` task IDs pass, flip the corresponding checkbox in the plan's `## Tests` section using `edit`.

---

## Phase 5 - Report Plan Verification

Summarize:
- which criteria were verified by passing tests
- which criteria remain unverified or failing
- what test files were added or updated
- whether validation commands passed
- whether browser verification was included
- which `[T.N.M]` test checkboxes were flipped in the plan

Only mark plan completion or test completion when supported by actual results.

---

# Failure Analysis

Use this when tests fail and the user wants deeper insight.

## Phase F1 - Categorize Failures

Group failures into patterns such as:
- assertion mismatch
- import/module breakage
- async timing or timeout issues
- mock mismatch
- environment/setup failures
- browser or E2E instability
- likely intentional behavior changes requiring test updates

Use `bash` to capture relevant failing output and `read` to inspect affected test files when needed.

## Phase F2 - Analyze Root Cause

Use direct investigation first. If helpful, use `subagent` with `worker` to produce a structured failure summary.

Distinguish between:
- test bug
- implementation bug
- environment/setup problem
- outdated expectation after intended behavior change

## Phase F3 - Report Fix Direction

Provide:
- failure category
- likely cause
- recommended next fix
- priority

Do not silently repair implementation unless the user requested that explicitly.

If failures point to a persistent root-cause bug rather than a simple test fix, recommend handing off to `dev-investigate`.

---

# Browser Testing

Include browser testing only when:
- the project has user-facing web flows
- the plan requires browser-visible verification
- the user requested browser coverage
- `BROWSER_MODE` is `headless` or `headed`

When browser testing is used:
- prefer existing project browser test setup if one exists
- otherwise use a minimal, explicit Puppeteer-based approach if appropriate
- verify application readiness before testing instead of relying on fixed sleeps where possible
- clean up any temporary processes you start

If browser setup is heavy or project-specific, keep the test scope narrow and focused on the acceptance criteria.

---

# Unified Report

After testing work completes, output a concise unified report:

```text
✅ Plan Verification Complete

Plan: <path>
Branch: <branch or "none">
Browser Mode: <none | headless | headed>

Results:
- Commands run: <summary>
- Test Files: <passed>/<total> passed
- Tests: <passed>/<total> passed
- Status: <PASSED | PARTIAL | FAILED>

Acceptance Criteria:
- Satisfied: <list or count>
- Partial: <list or count>
- Not yet satisfied: <list or count>

Failures:
- <summary or "none">

Tests added/updated:
- <file>
- <file>

Plan Checkboxes Flipped:
- [T.N.M] <short description>

Recommended Next Steps:
1. <highest priority next step>
2. <next step>
```

---

# Execution Notes

- Plan-driven verification only; no ad-hoc test runs without a plan
- Prefer existing project conventions over introducing new test structure
- Prefer reporting over automatic implementation repair
- Do not weaken assertions to force passing tests
- Do not claim success without actual command output or verification evidence
- Use `worker` for delegated test-writing or analysis tasks
- Hand persistent root-cause failures off to `dev-investigate`
