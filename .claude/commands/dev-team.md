---
name: dev-team
description: "Fully automated development pipeline using Claude Teams. Each phase runs in isolated context. Use for complete automation: '/dev-team Add dark mode to settings' and walk away. No prompts, approvals, or interruptions unless tests fail critically."
argument-hint: "[what to implement, fix, or refactor]"
model: opus
---

# Dev Agent (Teams Version)

Fully automated pipeline: **plan → shard? → validate → build → test → review → commit**.

Each phase runs in its own isolated context via Claude Teams.

**Prerequisite:** this command assumes a single-epic PRD (or no PRD, just a natural-language request). If your starting point is a multi-epic PRD, run `/dev-epic <prd-path>` first to decompose into mini-PRDs, then invoke `/dev-team` once per mini-PRD. `/dev-epic` is interactive (epic groupings + sequencing) and cannot be automated inside `/dev-team`.

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
  description: "Fully automated development pipeline: plan → shard? → validate → build → test → review → commit"
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

### Step 3: Provide Request and Pipeline Spec

Once team-lead is ready (it will send a message), provide the request AND the canonical pipeline spec so the team-lead knows exactly which phases to run, in what order, and what each writes to disk.

```
SendMessage({
  type: "message",
  recipient: "team-lead",
  content: "Starting pipeline for: REQUEST\n\n<PIPELINE_SPEC>"
})
```

The PIPELINE_SPEC content the team-lead must follow:

```
## Canonical Pipeline (8 steps)

Run phases in order. Conditional phases fire only when triggered.

1. /dev-plan <request>
   - Output: artifacts/plans/<name>.md
   - Includes feasibility preflight. If not feasible, stop and report.

2. /dev-shard <plan-path>  (CONDITIONAL — fires if estimated plan tokens > 150k)
   - Output: artifacts/plans/<plan>/shard-{1..N}.md + README.md + original-plan.md
   - If sharding fires, run phases 3–7 once per shard, in order. Each shard must fully complete before the next.

3. /dev-validate <plan-or-shard-path>
   - Mutates the plan in place, adding ## Risk Analysis if issues found.

4. /dev-build <plan-or-shard-path>
   - In fully-automated mode, auto-approve at the Phase 1.5 gate (approval is for interactive use).
   - Flips [ ] → [x] as tasks complete. Modifies source code.

5. /dev-test <plan-or-shard-path>
   - Runs ## Validation Commands and writes missing tests grounded in acceptance criteria.
   - If tests FAIL with persistent root-cause issues, pause and hand off to /dev-investigate.

6. /dev-review <plan-or-shard-path>
   - Independent Codex second-opinion. Report findings but do not block unless critical.

7. /commit
   - Final git commit.

Status contract:
- After each phase, send a status message to the coordinator in this shape:
  [<phase-agent>] <phase> complete | <one-line summary>
- If a phase fails critically, send:
  [<phase-agent>] <phase> FAILED | <reason> — stopping pipeline
- Do not skip phases. Do not reorder phases. Do not invent new phases.

Multi-epic input:
- This command assumes the REQUEST maps to a single-epic PRD or is a natural-language ask.
- If REQUEST references a multi-epic PRD (Scope: Multi-week/Ongoing or feature count > 8), STOP immediately and tell the user to run /dev-epic first, then invoke /dev-team per mini-PRD. /dev-epic is interactive and cannot be automated inside this flow.
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
[shard-agent] Plan fits single session (92k/150k tokens). No sharding needed.
[validate-agent] 2 warnings resolved in plan.
[build-agent] Implementation complete (4 files changed, 127 lines added)
[test-agent] Tests written and passing (10/10 tests passing)
[review-agent] Codex review: 0 critical, 1 note (acknowledged)
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
- For feasibility blockers from `/dev-plan`, recommend the user run `/brainstorm` to re-plan
- For multi-epic PRDs, recommend the user run `/dev-epic` first then re-invoke `/dev-team` per mini-PRD

For minor issues (non-critical test failures, review notes):
- The team will continue to commit
- Note the issues in final report
