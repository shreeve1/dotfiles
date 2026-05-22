---
name: development
description: Software development pipeline — PRD, epic decomposition, planning, validation, sharding, parallel build, testing, code review, bug investigation, Playwright stories, team pipeline. USE WHEN create PRD, epic, decompose PRD, implementation plan, validate plan, shard plan, build, execute plan, run tests, code review, investigate bug, user stories, Playwright, dev team, development pipeline, write code, software project.
---

# Development

Complete software development pipeline: idea → PRD → plan → validate → build → test → commit.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| PRD, product requirements, idea to spec, create PRD | `Prd/PRD.md` |
| Epic, decompose PRD, multi-epic, split PRD, PRD too large, epic decomposition | `Epic/EPIC.md` |
| Implementation plan, tech approach, task breakdown, phased roadmap, validate plan, pre-flight check, feasibility, risk analysis | `Plan/PLAN.md` |
| Shard, token budget, split plan, context window, plan too large | `Shard/SHARD.md` |
| Build, execute plan, implement, start coding, wave execution | `Build/BUILD.md` |
| Test, run tests, coverage, test plan, acceptance criteria | `Test/TEST.md` |
| Review, code review, audit code, deep review, PR review | `Review/REVIEW.md` |
| Investigate, bug, root cause, debug, diagnose, where is the bug | `Investigate/INVESTIGATE.md` |
| User stories, Playwright stories, UI flows, browser stories | `Stories/STORIES.md` |
| Dev team, automated pipeline, full team build, hands-off build | `Team/TEAM.md` |

## Pipeline Flow

**Full pipeline:** `/dev-prd` → `/dev-epic` (optional) → `/dev-plan` → `/dev-shard` → `/dev-build` → `/dev-test`

`/dev-plan` runs an iterative Claude ↔ Codex audit loop (max 3 rounds, severity-gated early exit) and produces a hardened plan ready for execution. The prior `/dev-validate` step has been folded into `/dev-plan`.

**Minimum viable flow:** `/dev-plan` → `/dev-build` → `/dev-test`

**Auxiliary commands** (available at any stage):
`/dev-review` · `/dev-investigate` · `/dev-stories` · `/dev-team`

**Full pipeline documentation:** `PipelineReference.md`

## Examples

**Example 1: Full pipeline from idea**
```
User: "I want to build a recipe management app"
→ Invokes Prd sub-skill for 5-phase interview
→ Saves PRD to artifacts/specs/
→ User runs /dev-plan → /dev-build → /dev-test
```

**Example 2: Quick build from existing plan**
```
User: "Build the plan in plans/add-dark-mode.md"
→ Invokes Build sub-skill for wave-based execution
→ Executes tasks with dependency-aware parallelism
→ Hands off to Test for verification
```

**Example 3: Debug a bug**
```
User: "Login returns 500 on odd hours"
→ Invokes Investigate sub-skill
→ 6-phase systematic investigation (stops at diagnosis)
→ Saves findings + fix tests for handoff to a fix agent
```

## Directory Conventions

Plans are discovered from multiple directories in priority order:
- `plans/` (primary output location)
- `specs/`
- `artifacts/plans/`
- `artifacts/specs/`

PRDs output to: `artifacts/specs/`
Investigations output to: `investigations/`
Stories output to: `specs/`
