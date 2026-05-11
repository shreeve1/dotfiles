---
name: flow
description: End-to-end alignment-to-implementation pipeline using grill-me, to-prd, to-issues, kanban, and ralph. Based on Matt Pocock's workshop workflow. Use when user wants to start a new feature, run the full flow, check pipeline status, or do AFK coding.
---

# /flow — Alignment to Implementation Pipeline

The complete pipeline from idea to working code. Based on Matt Pocock's workshop: align before you build, slice vertically, implement AFK, review with fresh eyes.

## Pipeline Visual

```
┌────────────┐   ┌────────────┐   ┌──────────────┐   ┌────────────┐   ┌──────────────┐   ┌──────────────┐
│  /grill-me  │──▶│  /to-prd   │──▶│  /to-issues  │──▶│  /kanban    │──▶│  /ralph      │──▶│  /review     │
│  Align      │   │  PRD       │   │  Slice       │   │  Board      │   │  Implement   │   │  Verify      │
│  (HITL)     │   │  (HITL)    │   │  (HITL)      │   │  (HITL)     │   │  (AFK)       │   │  (AFK/HITL)  │
└────────────┘   └────────────┘   └──────────────┘   └────────────┘   └──────────────┘   └──────────────┘
     Day shift         Day shift        Day shift        Day shift         Night shift        Either
```

Auxiliary (available at any stage):
```
┌────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│  /tdd          │  │  /codex review    │  │  /improve-codebase-  │  │  /design-an-     │
│  Red-green-    │  │  Independent 2nd  │  │  architecture        │  │  interface       │
│  refactor      │  │  opinion         │  │  Deep modules        │  │  Compare designs │
└────────────────┘  └──────────────────┘  └──────────────────────┘  └──────────────────┘
```

## Workflow Routing

Detect what the user needs and route to the right phase:

| Request Pattern | Route To |
|---|---|
| New idea, new feature, "I want to build", brainstorm | `/grill-me` |
| Create PRD, product requirements, spec | `/to-prd` |
| Break into issues, vertical slices, create tickets | `/to-issues` |
| Board status, kanban, show issues, what's next | `/kanban` |
| Implement, ralph, AFK, run loop, start building | `/ralph` |
| Full pipeline, "take this from idea to code" | Start from Phase 1 |
| Status, "where am I", "what's the state" | Detect phase below |

## Phase Detection

Read the project state to determine where the user is in the pipeline:

1. **No `.kanban/` exists** → Phase 0 (not started). Suggest `/grill-me`.
2. **`.kanban/` exists but `issues/` is empty** → Phase 3 ready. PRD exists, needs slicing. Suggest `/to-issues`.
3. **Issues exist, all `pending`** → Phase 5 ready. Board populated, ready for Ralph. Suggest `/ralph`.
4. **Issues exist, some `in-progress`** → Phase 5 active. Ralph is running or stalled. Suggest `/kanban board` or `/kanban stale`.
5. **Issues exist, some `review`** → Phase 6. Review needed. Suggest `/ralph --review`.
6. **All issues `done`** → Pipeline complete. Suggest `git push`, archive, or next feature.

## Process

### Phase 1: Align — `/grill-me`

Interview the user relentlessly until shared understanding is reached.

```
User: "I want to build a recipe app"
→ Invoke /grill-me
→ Agent asks 40-80 questions about the design
→ Leaves user with a shared mental model of the feature
```

**Output:** Shared design concept in conversation context. No files yet.

**Key rule:** Do NOT skip this. Specs-to-code without alignment is vibe coding in a suit. The grilling session IS the work.

### Phase 2: PRD — `/to-prd`

Synthesize the alignment session into a PRD.

```
User: "OK let's write the PRD"
→ Invoke /to-prd
→ Creates PRD with problem statement, user stories, implementation decisions
→ Submits as GitHub issue or saves locally
```

**Output:** PRD document (GitHub issue or local file).

**Key rule:** The PRD is a destination, not a bible. It captures the design concept from Phase 1. Don't optimize it endlessly.

### Phase 3: Slice — `/to-issues`

Break the PRD into vertical slices (tracer bullets).

```
User: "Break this into issues"
→ Invoke /to-issues
→ Creates thin end-to-end slices, not horizontal layers
→ Each slice cuts through ALL integration layers
→ Tags each as HITL or AFK
→ Sets up dependency DAG
```

**Output:** Issues in `.kanban/issues/` (local kanban).

**Key rules:**
- Many thin slices > few thick ones
- Each slice is demoable on its own
- Auth, billing, migrations, deletions = always HITL

### Phase 4: Board — `/kanban`

Review and manage the board.

```
User: "Show me the board"
→ Invoke /kanban board
→ Shows pending, in-progress, review, blocked, done
→ Shows DAG depth, AFK/HITL counts
→ Suggests next action
```

**Output:** Board state displayed to user.

### Phase 5: Implement — `/ralph`

Pick up AFK issues and implement one at a time.

**Interactive (within Claude Code):**
```
User: "/ralph"
→ Scans board for unblocked AFK issues
→ Implements one issue
→ Writes progress notes
→ Offers to continue or stop
```

**True AFK (from terminal):**
```bash
./ralph-loop.sh --limit 5          # Implement 5 issues
./ralph-loop.sh --dry-run          # Preview what would run
./ralph-loop.sh --review           # Review last completed issue
./ralph-loop.sh --validate         # Check board integrity
./ralph-loop.sh --stale            # Find stale locks
```

**Key rules:**
- ONLY ONE ISSUE per iteration
- Fresh context per issue (Memento approach)
- Stop at ~80k tokens or quality drop
- Progress notes carry architectural decisions between contexts

### Phase 6: Review — `/ralph --review` or `/codex review`

Review completed work with fresh eyes.

```
→ Invoke /ralph --review (Claude Code review)
→ OR invoke /codex review (independent second opinion from OpenAI)
→ Checks acceptance criteria, tests, scope creep
→ PASS → done. FAIL → blocked.
```

## Minimum Viable Flow

For small features:

```
/grill-me → /to-prd → /to-issues → /ralph
```

Skip kanban management — `/ralph` handles it automatically.

## Full Pipeline

For complex features:

```
/grill-me → /to-prd → /to-issues → /kanban validate → /kanban dag → /ralph → /ralph --review
```

## Day/Night Workflow

**Day shift (HITL):**
1. `/grill-me` — align on what to build
2. `/to-prd` — capture the design concept
3. `/to-issues` — slice into vertical tickets
4. `/kanban board` — review the board, check priorities
5. Go home

**Night shift (AFK):**
```bash
cd ~/my-project
~/.pai/PAI/Tools/ralph-loop.sh --limit 10
```

Next morning:
```bash
~/.pai/PAI/Tools/ralph-loop.sh --review    # review last issue
~/.pai/PAI/Tools/ralph-loop.sh --stale     # check for crashed runs
/kanban board                                  # see what got done
```

## Relationship to /Development

`/flow` and `/Development` are two pipelines for different modes:

| | `/Development` | `/flow` |
|---|---|---|
| **Style** | Plan-driven, phase-based | Alignment-driven, slice-based |
| **Planning** | `/dev-plan` (Codex audit loop) → `/dev-shard` | `/grill-me` → `/to-prd` → `/to-issues` |
| **Execution** | `/dev-build` (waves, within context) | `/ralph` (one issue, fresh context per) |
| **State** | Plan files in `artifacts/plans/` | Kanban board in `.kanban/` |
| **Best for** | Large features in one repo | AFK loops, multiple small slices |
| **Context mgmt** | Sharding (pre-emptive splits) | Memento (clear between issues) |

Both can coexist. Use `/Development` for complex in-session builds. Use `/flow` when you want to set up AFK work and walk away.

## Tool Reference

| Tool | Location | Purpose |
|------|----------|---------|
| `/grill-me` | `${PAI_DIR:-$HOME/.pai}/skills/grill-me/` | Alignment interview |
| `/to-prd` | `${PAI_DIR:-$HOME/.pai}/skills/to-prd/` | PRD creation |
| `/to-issues` | `${PAI_DIR:-$HOME/.pai}/skills/to-issues/` | Vertical slice breakdown |
| `/kanban` | `${PAI_DIR:-$HOME/.pai}/skills/kanban/` | Local board management |
| `/ralph` | `${PAI_DIR:-$HOME/.pai}/skills/ralph/` | AFK implementation loop (in Claude Code) |
| `ralph-loop.sh` | `~/.pai/PAI/Tools/ralph-loop.sh` | AFK implementation loop (bash, external) |
| `/tdd` | `${PAI_DIR:-$HOME/.pai}/skills/tdd/` | Test-driven development |
| `/codex review` | gstack skill | Independent OpenAI review |
| `/improve-codebase-architecture` | `${PAI_DIR:-$HOME/.pai}/skills/improve-codebase-architecture/` | Deep module analysis |
| `/design-an-interface` | `${PAI_DIR:-$HOME/.pai}/skills/design-an-interface/` | Compare interface designs |

## Directory Conventions

```
project/
  .kanban/
    issues/
      001-slug.md         # Vertical slice issues with YAML frontmatter
      002-slug.md
    archive/              # Completed issues
    progress.md           # Inter-iteration notes
```

## Design Principles

From Matt Pocock's workshop and production workflow:

1. **Alignment beats specs** — grill until shared understanding, then build
2. **Vertical slices over horizontal phases** — thin cuts through all layers
3. **Fresh context per issue** — clear beats compacting (Memento approach)
4. **Single-feature constraint** — one issue per iteration, no scope creep
5. **Implement-then-review** — separate reviewer catches what implementer missed
6. **Progress notes bridge contexts** — conventions, decisions, notes survive clearing
7. **HITL for decisions, AFK for implementation** — day shift vs night shift
8. **HITL safety policy** — auth, billing, migrations, deletions are never AFK
9. **UUID completion signals** — prevent prompt injection from issue content
10. **Dirty worktree check** — never start on uncommitted changes
