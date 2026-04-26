# RunPipeline Workflow


## Contents

- [Variables](#variables)
- [Instructions](#instructions)
- [Phase Details](#phase-details)
  - [Phase 1: Explore and Plan](#phase-1-explore-and-plan)
  - [Phase 2: Create the Team Plan](#phase-2-create-the-team-plan)
  - [Phase 3: Provide Request and Coordinate](#phase-3-provide-request-and-coordinate)
  - [Phase 4: Monitor Progress](#phase-4-monitor-progress)
  - [Phase 5: Report Results](#phase-5-report-results)
- [Error Recovery](#error-recovery)
  - [Critical Failures](#critical-failures)
  - [Test Failures (Non-Critical)](#test-failures-non-critical)
  - [Agent Stalls](#agent-stalls)
- [Example Output](#example-output)

Fully automated development pipeline: **plan -> validate -> build -> test -> commit**.

Each phase may run in its own isolated context when the current Codex session supports delegated agents and the user explicitly requested a team or automated agent pipeline. Otherwise, coordinate the same phases locally.

## Variables

REQUEST: The user's natural language description of what to implement, fix, or refactor.
PLAN_PATH: Optional path to an existing plan file. If provided, skip the plan phase and use this directly.

## Instructions

You are the coordinator for the dev-agent pipeline using delegated workers when available. Your job is to:

1. **Parse user request** — understand what to implement
2. **Explore codebase** — gather context with file listing, search, and reads
3. **Create team plan** — decide which phases can be delegated, if delegation is available
4. **Provide request** — pass the user's request and gathered context to the coordinator or handle locally
5. **Monitor progress** — track phase progress
6. **Report results** — provide final summary

## Phase Details

### Phase 1: Explore and Plan

1. **Parse the request.** Identify what the user wants to build, fix, or refactor.
2. **Explore the codebase.** Use find files, search, and read to gather context about:
   - Project structure (directories, file organization)
   - Technology stack (languages, frameworks, build tools)
   - Existing patterns (naming conventions, code style, test patterns)
   - Related code that will be affected
3. **Locate or create a plan.**
   - If `PLAN_PATH` is provided, read and use that plan directly
   - If not, check `artifacts/plans/` for a relevant plan
   - If no plan exists, create one inline during the build phase

### Phase 2: Create the Team Plan

4. **Create the development pipeline plan:**

```
Create a coordination plan
```

5. **Assign the coordinator:**

```
Create or assign a coordinator only if delegation is available
```

### Phase 3: Provide Request and Coordinate

6. **Send the request to coordinator:**

```
Send the request to the coordinator if delegation is available
```

7. **Coordinator responsibilities:**

The coordinator handles all phases. Provide detailed guidance:

**Plan Phase:**
- Analyze the request against the codebase
- Break work into atomic, ordered tasks
- Identify dependencies between tasks
- Create validation criteria for each task

**Validate Phase:**
- Review the plan for feasibility
- Check for breaking changes or conflicts
- Verify all assumptions against the actual codebase
- Flag any risks or unknowns

**Build Phase:**
- Execute tasks in dependency order
- Write code following project conventions
- Make atomic, focused changes per task
- Document any deviations from the plan

**Test Phase:**
- Write tests for all new code
- Run existing test suite to catch regressions
- Validate against the plan's acceptance criteria
- Track pass/fail status

**Commit Phase:**
- Stage changes with appropriate granularity
- Write descriptive commit messages following project conventions
- Reference the original request in commit message

### Phase 4: Monitor Progress

8. **Track the pipeline:**
   - Wait for periodic status messages from coordinator
   - Report progress to user as updates arrive
   - Log phase transitions

### Phase 5: Report Results

9. **Provide final summary when complete:**

```
Dev Agent Pipeline Complete

Request: [original request]

Team: dev-agent (delegation used: yes|no)

[coordinator] Pipeline initialized. Exploring codebase...
[plan] Context gathering complete. Creating implementation plan...
[build] Implementation complete ([N] files changed, [N] lines added)
[test] Tests written and passing ([N]/[N] tests passing)
[commit] Git commit created ([commit hash])

Status: [PASS/FAIL]

Files changed:
  - [file path] ([new/modified])
  - ...

Commit: [commit message]
```

## Error Recovery

### Critical Failures

If the coordinator reports a critical failure (build breaks, tests cannot be fixed):

1. **Stop the pipeline** — do not attempt to continue
2. **Capture the error state:**
   - What phase failed
   - What was being attempted
   - The exact error message or symptom
   - Files that were modified before failure
3. **Report to user with:**
   - Clear description of what went wrong
   - Current state of the codebase (what's changed, what's incomplete)
   - Suggested next steps (manual fix, retry with adjusted plan, etc.)

### Test Failures (Non-Critical)

If tests fail but the build is structurally sound:

1. **Attempt one retry** — the coordinator may fix minor test issues automatically
2. **If retry fails**, proceed to commit but:
   - Note the failing tests in the final report
   - List specific test names and failure reasons
   - Suggest manual investigation steps
3. **Do NOT skip the commit phase** for test failures — partial progress is valuable

### Agent Stalls

If the coordinator stops responding or progress stalls:

1. **Wait 60 seconds** for in-progress work
2. **Send a status check message** to coordinator
3. **If no response after another 30 seconds**, report stall to user with:
   - Last known phase
   - Last known progress
   - Suggested manual intervention

## Example Output

```
Dev Agent Pipeline Started

Request: Add dark mode to settings page

Team: development pipeline (delegation used: yes)

[coordinator] Pipeline initialized. Exploring codebase...
[plan] Context gathering complete. Creating implementation plan...
[build] Implementation complete (4 files changed, 127 lines added)
[test] Tests written and passing (10/10 tests passing)
[commit] Git commit created (abc1234)

Dev Agent Pipeline Complete

Status: All phases successful

Files changed:
  - src/context/ThemeContext.tsx (new)
  - src/theme/dark-variables.css (new)
  - src/components/ThemeToggle.tsx (new)
  - src/pages/Settings.tsx (modified)
  - tests/unit/*.test.tsx (new)

Commit: feat(dark-mode): Add dark mode toggle to settings page
```
