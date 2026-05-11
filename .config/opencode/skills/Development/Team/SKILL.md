---
name: Team
description: Fully automated development pipeline using agent teams. Each phase runs in isolated context with plan, validate, build, test, and commit stages. USE WHEN dev team, automated pipeline, full team build, hands-off build, team pipeline, run pipeline end-to-end, automated dev pipeline.
---

# Team

Fully automated pipeline: **plan -> validate -> build -> test -> commit**.

Each phase runs in its own isolated context via agent teams, providing complete hands-off execution.

## Customization

**Before executing, check for user customizations at:**
`~/.pai/PAI/USER/SKILLCUSTOMIZATIONS/Development/Team/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## Model Recommendation

**Recommended model: opus** — This skill requires complex coordination of multiple agents across phases, making strategic decisions about task dependencies, and handling error recovery. Opus provides the strongest reasoning for multi-agent orchestration.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| Full automated pipeline (plan -> validate -> build -> test -> commit) | `Workflows/RunPipeline.md` |

## Pipeline Position

**Where this skill fits in the development pipeline:**

- **Before:** `/dev-plan` (plan must exist) or direct user request
- **After:** Commit is created, code is ready for review or deployment
- **Alternative to:** Running `/dev-build` + `/dev-test` + `/commit` manually

**Workflow chain:**
```
/dev-plan -> [Team/RunPipeline] -> commit created
```

## Context Files

| File | Content |
|------|---------|
| `../PipelineReference.md` | Full pipeline flow documentation and conventions |

## Examples

### Example 1: Feature from user request

```
User: "Team: Add dark mode to settings page"
-> Invokes RunPipeline workflow
-> Team explores codebase, plans, builds, tests, commits
-> Fully automated, no human intervention needed
```

### Example 2: Execute existing plan

```
User: "Run the team pipeline on plans/add-auth.md"
-> Invokes RunPipeline workflow with existing plan
-> Team validates plan, builds, tests, commits
-> Provides final summary with all changed files
```

### Example 3: Refactoring task

```
User: "Team: Refactor the database layer to use connection pooling"
-> Invokes RunPipeline workflow
-> Team explores existing code, plans refactor, executes, tests
-> Commits with descriptive message
```
