# Development Pipeline Reference


## Contents

- [Pipeline Stages](#pipeline-stages)
- [When to Use Each Stage](#when-to-use-each-stage)
- [Stage Handoffs](#stage-handoffs)
  - [Prd → Epic (conditional)](#prd-epic-conditional)
  - [Prd → Plan (or Epic → Plan)](#prd-plan-or-epic-plan)
  - [Plan → Shard (conditional)](#plan-shard-conditional)
  - [Shard → Build (or Plan → Build)](#shard-build-or-plan-build)
  - [Build → Test](#build-test)
  - [Test → Commit](#test-commit)
- [Minimum Viable Flow](#minimum-viable-flow)
- [Full Pipeline (Complex Features)](#full-pipeline-complex-features)
- [Automated Pipeline](#automated-pipeline)
- [Traceability System](#traceability-system)
- [Directory Conventions](#directory-conventions)

## Pipeline Stages

```
┌──────────┐    ┌──────────┐    ┌────────────────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  $dev-prd │───▶│ $dev-epic │───▶│      $dev-plan     │───▶│$dev-shard │───▶│$dev-build │───▶│ $dev-test │
│  Idea→PRD │    │(optional) │    │ PRD→Plan           │    │ Split if  │    │ Execute   │    │  Verify   │
└──────────┘    │Split PRD  │    │ + claude -p audit  │    │ too large │    └──────────┘    └──────────┘
                │into epics │    │ loop (3 rounds)    │    └──────────┘
                └──────────┘    └────────────────────┘
Auxiliary (available at any stage):
┌──────────────┐  ┌────────────────┐  ┌─────────────┐  ┌──────────┐
│ $dev-review  │  │ $dev-investigate│  │ $dev-stories │  │ $dev-team│
│  Code review │  │  Bug diagnosis │  │  UI stories  │  │ Auto pipe│
└──────────────┘  └────────────────┘  └─────────────┘  └──────────┘
```

`$dev-plan` runs an iterative Codex ↔ `claude -p` audit loop (max 3 rounds, severity-gated early exit) and produces a hardened plan ready for execution. The prior `$dev-validate` step has been folded into `$dev-plan`.

## When to Use Each Stage

| Stage | When | Input | Output |
|-------|------|-------|--------|
| **Prd** | Starting from a raw idea | Free text or brainstorming notes | `artifacts/specs/{slug}/PRD.md` |
| **Epic** | After PRD, when PRD is multi-week or 8+ features | PRD file | `artifacts/specs/<parent>/epic-*.md` set |
| **Plan** | After PRD (or after Epic), before building | PRD or epic mini-PRD | `artifacts/plans/<slug>/plan.md` + `artifacts/plans/<slug>/state.yml` |
| **Shard** | Plan too large for one session | Plan file | `artifacts/plans/<plan-name>/shard-*.md` |
| **Build** | Ready to write code | Plan file | Implemented code + verification |
| **Test** | After building, before merge | Plan file or test path | Test results + coverage |
| **Review** | Any time you want a critical review | File, directory, or topic | Findings + recommendations |
| **Investigate** | Bug or unexpected behavior | Problem description | Root cause diagnosis + fix tests |
| **Stories** | UI features need browser testing | Plan file | `artifacts/plans/<plan>/stories.md` |
| **Team** | Want walk-away automation | Request description | Full pipeline auto-execution |

## Stage Handoffs

### Prd → Epic (conditional)
- Only when PRD is multi-week scope or has 8+ features
- Epic reads PRD, proposes groupings, writes per-epic mini-PRDs to `artifacts/specs/<parent>/`
- Each mini-PRD is self-contained — Plan reads the mini-PRD, not the parent

### Prd → Plan (or Epic → Plan)
- PRD (or epic mini-PRD) saved to `artifacts/specs/{slug}/PRD.md`
- Plan reads PRD via Source Document Discovery
- `#req-[id]` tags propagate from PRD → plan tasks
- Plan runs the `claude -p` audit loop (max 3 rounds) before finalizing
- Loop absorbs the prior pre-flight validation step — feasibility, risk, and breaking-change analysis happen inside the loop

### Plan → Shard (conditional)
- Only if plan exceeds ~150k token budget
- Shard splits into sequential, dependency-ordered files

### Shard → Build (or Plan → Build)
- Build reads plan, creates wave schedule
- Executes dependency-aware parallel task groups
- Marks progress via checkboxes in plan file

### Build → Test
- Build hands off plan path to Test
- Test verifies acceptance criteria
- Writes missing tests if needed

### Test → Commit
- After tests pass, commit via standard git workflow

## Minimum Viable Flow

For most tasks, you don't need the full pipeline:

```
$dev-plan "add dark mode" → $dev-build → $dev-test
```

## Full Pipeline (Complex Features)

```
$dev-prd "my app idea" → $dev-epic (if multi-week) → $dev-plan → $dev-shard (if needed) → $dev-build → $dev-test
```

## Automated Pipeline

```
$dev-team "add dark mode to settings"
```
Walk away. Plan (with audit loop) → build → test → commit all automated.

## Traceability System

Requirements flow through the pipeline via `#req-[id]` tags:

1. **PRD**: Each feature tagged with `#req-<kebab-case-id>` (e.g., `#req-user-login`)
2. **Plan**: Each task includes relevant `#req-*` tags and stable `[N.M]` ID prefixes; the `claude -p` audit loop verifies traceability coverage as part of every round
3. **Test**: Tests link back to task IDs and acceptance criteria
4. **Traceability Map**: PRD and plan both include traceability tables

This ensures nothing gets lost between idea and implementation.

## Directory Conventions

**Single source of truth: `~/.codex/skills/dev-development/references/Paths.md`** — every artifact lives at `artifacts/{kind}/{slug}/`. There is exactly one canonical location per artifact type. Top-level `plans/`, `specs/`, `investigations/` are deprecated.

| Purpose | Canonical Path |
|---------|----------------|
| PRDs | `artifacts/specs/{slug}/PRD.md` |
| Implementation plans | `artifacts/plans/{slug}/plan.md` |
| Plan loop state | `artifacts/plans/{slug}/state.yml` |
| Sharded plans | `artifacts/plans/{slug}/shard-N.md` |
| User stories | `artifacts/plans/{slug}/stories.md` |
| Investigations | `artifacts/investigations/{slug}/investigation.md` |
| Brainstorming | `artifacts/brainstorming/{slug}/` |
| Notes | `artifacts/notes/{slug}/` |
| Fix tests | `tests/regression/` |
