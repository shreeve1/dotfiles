---
name: dev-test
description: Run tests, discover a project's test setup, verify implementation against a plan's acceptance criteria, analyze coverage gaps, write missing tests, and diagnose test failures. Use when the user asks to test, run tests, verify a plan, analyze failures, inspect coverage, find missing tests, discover test setup, or perform plan-driven testing.
---

# Dev Test

Validate through actual execution when possible. Do not weaken assertions, skip tests, or modify implementation unless the user asks for a fix loop.

## Mode Selection

- Plan path or acceptance criteria provided: read `references/plan-driven.md`.
- "Run tests" or fast verification: read `references/run-tests.md`.
- Coverage, gaps, or missing tests: read `references/analyze-coverage.md`.
- Unclear test setup: read `references/discovery.md`.

## Constraints

- Run existing commands before claiming pass/fail.
- Read existing test patterns before writing new tests.
- Match naming, structure, fixtures, and assertion style.
- Report exact commands and summarized results.
- Do not modify implementation code unless the user explicitly asks.

## Output

Report mode, commands run, pass/fail status, failures, tests added, acceptance criteria verification, and recommended next steps.
