# RunPipeline Workflow

Fully automated development pipeline: **plan -> validate -> build -> test -> commit**.

Each phase runs in its own isolated context via agent teams. The coordinator (you) manages the lifecycle.

## Variables

REQUEST: The user's natural language description of what to implement, fix, or refactor.
PLAN_PATH: Optional path to an existing plan file. If provided, skip the plan phase and use this directly.

## Instructions

You are the coordinator for the dev-agent pipeline using agent teams. Your job is to:

1. **Parse user request** — understand what to implement
2. **Explore codebase** — gather context (Glob, Grep, Read)
3. **Create team** — spawn the dev-agent team
4. **Provide request** — pass the user's request to the team-lead agent
5. **Monitor progress** — track the pipeline via team's task queue
6. **Report results** — provide final summary

## Phase Details

### Phase 1: Explore and Plan

1. **Parse the request.** Identify what the user wants to build, fix, or refactor.
2. **Explore the codebase.** Use Glob, Grep, and Read to gather context about:
   - Project structure (directories, file organization)
   - Technology stack (languages, frameworks, build tools)
   - Existing patterns (naming conventions, code style, test patterns)
   - Related code that will be affected
3. **Locate or create a plan.**
   - If `PLAN_PATH` is provided, read and use that plan directly
   - If not, check `plans/`, `specs/`, and `artifacts/plans/` for a relevant plan
   - If no plan exists, create one inline during the build phase

### Phase 2: Create the Team

4. **Create the dev-agent team:**

```
TeamCreate({
  team_name: "dev-agent",
  description: "Fully automated development pipeline: plan -> validate -> build -> test -> commit"
})
```

5. **Spawn the team-lead agent:**

```
Agent({
  subagent_type: "general",
  name: "team-lead",
  team_name: "dev-agent",
  description: "Coordinate dev-agent pipeline for: REQUEST"
})
```

### Phase 3: Provide Request and Coordinate

6. **Send the request to team-lead:**

```
SendMessage({
  type: "message",
  recipient: "team-lead",
  content: "Starting pipeline for: REQUEST. Here is the context gathered from codebase exploration: [key findings]. Follow the plan -> validate -> build -> test -> commit phases."
})
```

7. **Team-lead coordination responsibilities:**

The team-lead will coordinate all phases. Provide detailed guidance:

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
   - Wait for periodic status messages from team-lead
   - Report progress to user as updates arrive
   - Log phase transitions

### Phase 5: Report Results

9. **Provide final summary when complete:**

```
Dev Agent Pipeline Complete

Request: [original request]

Team: dev-agent ([N] agents spawned)

[team-lead] Pipeline initialized. Exploring codebase...
[plan-agent] Context gathering complete. Creating implementation plan...
[build-agent] Implementation complete ([N] files changed, [N] lines added)
[test-agent] Tests written and passing ([N]/[N] tests passing)
[commit-agent] Git commit created ([commit hash])

Status: [PASS/FAIL]

Files changed:
  - [file path] ([new/modified])
  - ...

Commit: [commit message]
```

## Error Recovery

### Critical Failures

If the team-lead reports a critical failure (build breaks, tests cannot be fixed):

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

1. **Attempt one retry** — the team may fix minor test issues automatically
2. **If retry fails**, proceed to commit but:
   - Note the failing tests in the final report
   - List specific test names and failure reasons
   - Suggest manual investigation steps
3. **Do NOT skip the commit phase** for test failures — partial progress is valuable

### Agent Stalls

If the team-lead stops responding or progress stalls:

1. **Wait 60 seconds** for in-progress work
2. **Send a status check message** to team-lead
3. **If no response after another 30 seconds**, report stall to user with:
   - Last known phase
   - Last known progress
   - Suggested manual intervention

## Example Output

```
Dev Agent Pipeline Started

Request: Add dark mode to settings page

Team: dev-agent (5 agents spawned)

[team-lead] Pipeline initialized. Exploring codebase...
[plan-agent] Context gathering complete. Creating implementation plan...
[build-agent] Implementation complete (4 files changed, 127 lines added)
[test-agent] Tests written and passing (10/10 tests passing)
[commit-agent] Git commit created (abc1234)

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
