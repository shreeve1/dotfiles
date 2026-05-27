# Development Pipeline Reference

## Pipeline Stages

```
┌──────────┐    ┌──────────┐    ┌──────────────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  /dev-prd │───▶│ /dev-epic │───▶│    /dev-plan     │───▶│/dev-shard │───▶│/dev-build │───▶│ /dev-test │
│  Idea→PRD │    │(optional) │    │ PRD→Plan         │    │ Split if  │    │ Execute   │    │  Verify   │
└──────────┘    │Split PRD  │    │ + Codex audit    │    │ too large │    └──────────┘    └──────────┘
                │into epics │    │ loop (3 rounds)  │    └──────────┘
                └──────────┘    └──────────────────┘
Auxiliary (available at any stage):
┌──────────────────────────┐  ┌──────────────────┐  ┌──────────────┐  ┌───────────┐
│ /skill:dev-review-claude │  │ /dev-investigate │  │ /dev-stories │  │ /dev-team │
│       Code review        │  │  Bug diagnosis   │  │  UI stories  │  │ Auto pipe │
└──────────────────────────┘  └──────────────────┘  └──────────────┘  └───────────┘
```

## When to Use Each Stage

| Stage | When | Input | Output |
|-------|------|-------|--------|
| **Prd** | Starting from a raw idea | Free text or brainstorming notes | `artifacts/specs/prd-<name>-<date>.md` |
| **Epic** | After PRD, when PRD is multi-week or 8+ features | PRD file | `artifacts/specs/<parent>/epic-*.md` set |
| **Plan** | After PRD (or after Epic), before building | PRD or epic mini-PRD | `plans/<feature>.md` + `plans/.<feature>.state.yml` |
| **Shard** | Plan too large for one session | Plan file | `specs/<plan-name>/shard-*.md` |
| **Build** | Ready to write code | Plan file | Implemented code + verification |
| **Test** | After building, before merge | Plan file or test path | Test results + coverage |
| **Review** | Any time you want a critical review | File, directory, or topic | Findings + recommendations via `/skill:dev-review-claude` |
| **Investigate** | Bug or unexpected behavior | Problem description | Root cause diagnosis + fix tests |
| **Stories** | UI features need browser testing | Plan file | `specs/<plan>-stories.md` |
| **Team** | Want walk-away automation | Request description | Full pipeline auto-execution |

## Stage Handoffs

### Prd → Epic (conditional)
- Only when PRD is multi-week scope or has 8+ features
- Epic reads PRD, proposes groupings, writes per-epic mini-PRDs to `artifacts/specs/<parent>/`
- Each mini-PRD is self-contained — Plan reads the mini-PRD, not the parent

### Prd → Plan (or Epic → Plan)
- PRD (or epic mini-PRD) saved to `artifacts/specs/`
- Plan reads PRD via Source Document Discovery
- `#req-[id]` tags propagate from PRD → plan tasks
- Plan runs the Codex audit loop (max 3 rounds) before finalizing
- Loop absorbs the prior pre-flight validation step — feasibility, risk, and breaking-change analysis happen inside the loop

### Plan → Shard (conditional)
- Only if plan exceeds ~150k token budget
- Shard splits into sequential, dependency-ordered files

### Plan → Build (or Shard → Build)
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
/dev-plan "add dark mode" → /dev-build → /dev-test
```

## Full Pipeline (Complex Features)

```
/dev-prd "my app idea" → /dev-epic (if multi-week) → /dev-plan → /dev-shard (if needed) → /dev-build → /dev-test
```

## Automated Pipeline

```
/dev-team "add dark mode to settings"
```
Walk away. Plan (with audit loop) → build → test → commit all automated.

## Traceability System

Requirements flow through the pipeline via `#req-[id]` tags:

1. **PRD**: Each feature tagged with `#req-<kebab-case-id>` (e.g., `#req-user-login`)
2. **Plan**: Each task includes relevant `#req-*` tags and stable `[N.M]` ID prefixes; the Codex audit loop verifies traceability coverage as part of every round
3. **Test**: Tests link back to task IDs and acceptance criteria
4. **Traceability Map**: PRD and plan both include traceability tables

This ensures nothing gets lost between idea and implementation.

## Directory Conventions

| Purpose | Primary | Fallbacks |
|---------|---------|-----------|
| Implementation plans | `plans/` | `specs/`, `artifacts/plans/` |
| Plan loop state | `plans/.<feature>.state.yml` | — |
| PRDs | `artifacts/specs/` | — |
| Brainstorming | `artifacts/brainstorming/` | — |
| Investigations | `investigations/` | — |
| Fix tests | `tests/regression/` | — |
| User stories | `specs/` | — |
| Sharded plans | `specs/<plan-name>/` | — |
