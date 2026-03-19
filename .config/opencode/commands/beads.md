---
description: Manage beads issues — view status, create tasks, break down goals, triage, or get help
agent: build
---

Help the user manage their beads issue tracker. $ARGUMENTS

The user is a vibe coder who may not be familiar with all bd commands. Be helpful, explain what you're doing, and suggest next steps.

## Phase 1 — Check State

1. Run `bd ready --json` to see tasks with no open blockers
2. Run `bd list --json` to see all issues
3. Run `bd prime` to get the full context summary

If beads is not initialized (no `.beads/` directory), offer to run `bd init` and explain what it does.

## Phase 2 — Determine Intent

If `$ARGUMENTS` is provided, match it to one of these actions:

| Keyword/Pattern | Action |
|---|---|
| `status` or `overview` | Show a friendly summary of all issues |
| `create <description>` | Create one or more tasks from the description |
| `plan <goal>` | Break a goal into an epic with sub-tasks and dependencies |
| `triage` | Review open issues, suggest priorities and cleanup |
| `help` | Show a quick reference of common workflows |
| `init` | Run `bd init` in the current project |
| Anything else | Interpret as a goal and ask if they want to create tasks or plan |

If no arguments, ask the user what they'd like to do using AskUserQuestion with these options:
- **See status** — overview of current issues
- **Create a task** — add a new issue
- **Plan a feature** — break a goal into tasks
- **Triage issues** — review and clean up open issues
- **Help** — quick reference guide

## Phase 3 — Execute

### Status
1. Run `bd list --json` and `bd ready --json`
2. Present a clear summary grouped by status (ready, in_progress, blocked, closed)
3. Highlight anything that looks stale or stuck
4. Suggest what to work on next

### Create
1. Ask for a title and description if not provided
2. Ask about priority (P0=critical, P1=high, P2=medium, P3=low) — default to P2 if unsure
3. Run `bd create "<title>" -p <priority> -d "<description>"`
4. Show the created issue ID and explain how to reference it later

### Plan
1. Take the user's goal and break it into logical tasks
2. Present the proposed breakdown and ask for approval
3. Create the epic: `bd create "<goal>" -p <priority>`
4. Create sub-tasks as children of the epic using hierarchical IDs
5. Add dependency links with `bd dep add <child> <parent>` where tasks have ordering requirements
6. Run `bd ready` to show what's immediately actionable

### Triage
1. Run `bd list --json` to get all issues
2. Identify: stale issues (open too long), issues without priorities, duplicates, issues that could be closed
3. Present findings and recommendations
4. Ask before making any changes — execute approved changes one at a time
5. Show before/after summary

### Help
Show this quick reference:

```
Beads Quick Reference
=====================

Your agent automatically runs `bd prime` at session start,
so it always knows your current issues.

Common things you can ask your agent to do:
- "Create a task for fixing the login bug"
- "Break down the payment feature into tasks"  
- "What should I work on next?"
- "Close the auth task, it's done"
- "Show me all open issues"

The agent handles bd commands for you. You rarely
need to run them manually.

Manual commands (if you want them):
  bd ready              — what's ready to work on
  bd list               — all issues
  bd show <id>          — details on one issue
  bd create "Title" -p 1 — create a P1 task
  bd close <id> "Done"  — close an issue
  bd prime              — refresh agent context

Issue IDs look like: bd-a1b2
Sub-tasks look like:  bd-a1b2.1, bd-a1b2.1.1

Priorities: P0=critical, P1=high, P2=medium, P3=low
```

## Rules

- Always run `bd` commands, never fake output
- Explain what each command does when running it
- Ask before bulk operations (closing, reprioritizing)
- If `bd` is not found, tell the user to install it: `brew install beads`
- If no `.beads/` directory exists, offer to run `bd init`
- Default priority is P2 unless the user indicates urgency
- When creating epics, always set up dependency links between tasks that have ordering requirements
