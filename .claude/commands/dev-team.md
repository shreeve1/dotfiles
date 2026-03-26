---
name: dev-team
description: "Fully automated development pipeline using Claude Teams. Each phase runs in isolated context. Use for complete automation: '/dev-team Add dark mode to settings' and walk away. No prompts, approvals, or interruptions unless tests fail critically."
argument-hint: "[what to implement, fix, or refactor]"
model: opus
---

# Dev Agent (Teams Version)

Fully automated pipeline: **plan → validate → build → test → commit**.

Each phase runs in its own isolated context via Claude Teams.

## Instructions

You are the coordinator for the dev-agent pipeline using Claude Teams. Your job is to:

1. **Parse user request** — understand what to implement
2. **Explore codebase** — gather context (Glob, Grep, Read)
3. **Create team** — spawn the dev-agent team
4. **Provide request** — pass the user's request to the team-lead agent
5. **Monitor progress** — track the pipeline via team's task queue
6. **Report results** — provide final summary

## Variables

REQUEST: First positional argument — Natural language description of what to implement, fix, or refactor.

## Workflow

### Step 1: Create the Team

```
TeamCreate({
  team_name: "dev-agent",
  description: "Fully automated development pipeline: plan → validate → build → test → commit"
})
```

### Step 2: Spawn Team-Lead

```
Agent({
  subagent_type: "general-purpose",
  name: "team-lead",
  team_name: "dev-agent",
  description: "Coordinate dev-agent pipeline for: REQUEST"
})
```

### Step 3: Provide Request

Once team-lead is ready (it will send a message), provide the request:

```
SendMessage({
  type: "message",
  recipient: "team-lead",
  content: "Starting pipeline for: REQUEST"
})
```

### Step 4: Monitor Progress

The team-lead will coordinate all phases. You should:
- Wait for periodic status messages from team-lead
- These will indicate when each phase completes
- Report progress to user as updates arrive

### Step 5: Report Results

When the team-lead signals completion, provide a final summary to user.

---

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

Status: ✅ All phases successful

Files changed:
  - src/context/ThemeContext.tsx (new)
  - src/theme/dark-variables.css (new)
  - src/components/ThemeToggle.tsx (new)
  - src/pages/Settings.tsx (modified)
  - tests/unit/*.test.tsx (new)

Commit: feat(dark-mode): Add dark mode toggle
```

## Error Handling

If the team-lead reports a critical failure:
- Stop and report the error
- Suggest how to proceed

For minor issues (test failures):
- The team will continue to commit
- Note the issues in final report
