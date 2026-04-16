# Development Pipeline Reference

## Pipeline Stages

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  /dev-prd │───▶│ /dev-plan │───▶│/dev-validate│──▶│/dev-shard │───▶│/dev-build │───▶│ /dev-test │
│  Idea→PRD │    │ PRD→Plan  │    │ Plan check │   │ Split if  │    │ Execute   │    │  Verify   │
└──────────┘    └──────────┘    └───────────┘    │ too large │    └──────────┘    └──────────┘
                                                   └──────────┘
Auxiliary (available at any stage):
┌──────────────┐  ┌────────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────────────────┐
│ /dev-review  │  │ /dev-investigate│  │ /dev-stories │  │ /dev-team│  │ /dev-tool_check│  │/dev-create-special-agent│
│  Code review │  │  Bug diagnosis │  │  UI stories  │  │ Auto pipe│  │  Tool audit   │  │   Domain experts      │
└──────────────┘  └────────────────┘  └─────────────┘  └──────────┘  └──────────────┘  └─────────────────────┘
```

## When to Use Each Stage

| Stage | When | Input | Output |
|-------|------|-------|--------|
| **Prd** | Starting from a raw idea | Free text or brainstorming notes | `artifacts/specs/prd-<name>-<date>.md` |
| **Plan** | After PRD, before building | PRD or requirements description | `plans/<feature>.md` |
| **Validate** | After plan, before building | Plan file | Updated plan with risk analysis |
| **Shard** | Plan too large for one session | Plan file | `specs/<plan-name>/shard-*.md` |
| **Build** | Ready to write code | Plan file | Implemented code + verification |
| **Test** | After building, before merge | Plan file or test path | Test results + coverage |
| **Review** | Any time you want a critical review | File, directory, or topic | Findings + recommendations |
| **Investigate** | Bug or unexpected behavior | Problem description | Root cause diagnosis + fix tests |
| **Stories** | UI features need browser testing | Plan file | `specs/<plan>-stories.md` |
| **Team** | Want walk-away automation | Request description | Full pipeline auto-execution |
| **ToolCheck** | Before building, check readiness | Plan file | Tool gap analysis + recommendations |
| **CreateSpecialAgent** | Plan needs domain experts | Plan file | Specialized agent definitions |

## Stage Handoffs

### Prd → Plan
- PRD saved to `artifacts/specs/`
- Plan reads PRD via Source Document Discovery
- `#req-[id]` tags propagate from PRD → plan tasks

### Plan → Validate
- Plan saved to `plans/`
- Validate reads plan, runs feasibility + risk analysis
- Updates plan in-place if issues found

### Validate → Shard (conditional)
- Only if plan exceeds ~150k token budget
- Shard splits into sequential, dependency-ordered files

### Shard → Build (or Validate → Build)
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
/dev-prd "my app idea" → /dev-plan → /dev-validate → /dev-shard (if needed) → /dev-build → /dev-test
```

## Automated Pipeline

```
/dev-team "add dark mode to settings"
```
Walk away. Plan → validate → build → test → commit all automated.

## Traceability System

Requirements flow through the pipeline via `#req-[id]` tags:

1. **PRD**: Each feature tagged with `#req-<kebab-case-id>` (e.g., `#req-user-login`)
2. **Plan**: Each task includes relevant `#req-*` tags and stable `[N.M]` ID prefixes
3. **Validate**: Traceability validation confirms all `#req-*` tags are covered
4. **Test**: Tests link back to task IDs and acceptance criteria
5. **Traceability Map**: PRD and plan both include traceability tables

This ensures nothing gets lost between idea and implementation.

## Directory Conventions

| Purpose | Primary | Fallbacks |
|---------|---------|-----------|
| Implementation plans | `plans/` | `specs/`, `artifacts/plans/` |
| PRDs | `artifacts/specs/` | — |
| Brainstorming | `artifacts/brainstorming/` | — |
| Investigations | `investigations/` | — |
| Fix tests | `tests/regression/` | — |
| User stories | `specs/` | — |
| Sharded plans | `specs/<plan-name>/` | — |
