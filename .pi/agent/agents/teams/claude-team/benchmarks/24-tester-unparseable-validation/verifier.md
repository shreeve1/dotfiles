# Verifier: Tester Unparseable Validation Commands

## Target Agent
tester (from agents/tester.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Vague Command Recognition (weight: 3)
- 5: Explicitly identifies that "Run the tests", "Check that search works", and "Verify pagination" are not executable commands. Flags this as a plan quality issue and constructs real commands instead.
- 3: Recognizes the commands are vague and constructs alternatives, but doesn't flag it as a plan issue.
- 1: Attempts to run the literal text as commands, then recovers after failure.
- 0: Runs generic `npm test` without acknowledging the vague commands, or skips validation.

### Criterion 2: Command Inference (weight: 3)
- 5: Discovers Jest configuration, identifies test file locations, and constructs targeted commands like `npx jest --testPathPattern=search` or `npx jest tests/services/SearchService.test.ts tests/routes/search.test.ts`. Runs both backend test files.
- 3: Runs `npx jest` or `npm test` (discovers the framework) but doesn't target search-specific files.
- 1: Runs a single generic test command without discovering the test framework configuration.
- 0: Doesn't run any tests or runs non-existent commands.

### Criterion 3: Acceptance Criteria Mapping (weight: 2)
- 5: Maps each of the 5 acceptance criteria to specific test evidence. For each criterion, states Verified (with evidence), Partial (what's missing), or Unverified (no coverage). Identifies that criterion 4 (case-insensitive) and criterion 2 (pagination with 20/page) need specific test assertions.
- 3: Maps some criteria to test output but doesn't cover all 5 explicitly.
- 1: Reports test pass/fail counts without mapping to criteria.
- 0: No criteria mapping.

### Criterion 4: Gap Identification (weight: 2)
- 5: Identifies that (a) no frontend component tests exist for SearchBar.tsx, (b) validation commands were inadequate for proper verification, and (c) recommends specific tests to add for uncovered criteria. Reports overall status as Partial due to gaps.
- 3: Notes missing frontend tests but doesn't connect to specific acceptance criteria gaps.
- 1: Reports all tests pass without noting coverage gaps.
- 0: Claims full verification without identifying any gaps.

## Required Elements
- [ ] Flags validation commands as non-executable / vague
- [ ] Discovers Jest configuration and constructs real test commands
- [ ] Targets search-related test files specifically (not just `npm test`)
- [ ] Reports per-criterion Verified/Partial/Unverified status for all 5 criteria
- [ ] Identifies missing frontend component tests as a coverage gap
- [ ] Overall status is Partial or Unverified (not PASSED) due to gaps

## Anti-Patterns
- Runs "Run the tests" as a literal shell command
- Reports PASSED without running any actual commands
- Runs only `npm test` without targeting search-specific files
- Claims all criteria verified when frontend tests don't exist
- Doesn't map test results back to acceptance criteria
