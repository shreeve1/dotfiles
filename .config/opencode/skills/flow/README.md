# `/flow` Pipeline — Reference README

> Alignment-to-implementation pipeline based on Matt Pocock's AI coding workshop. Vertical slices, fresh-session execution per issue, fresh-session review per issue.

## Quick Reference

```
/flow              → Auto-detect phase and route
/grill-me          → Phase 1: Interview until shared understanding
/to-prd            → Phase 2: Synthesize alignment into PRD
/to-issues         → Phase 3: Break PRD into vertical slices (each with verification command)
/kanban board      → Phase 4: View and manage the board
/ralph             → Phase 5: Implement next issue + fresh-session review
/codex review      → Optional: independent second-opinion review
```

## The Pipeline

```
/grill-me → /to-prd → /to-issues → /kanban → /ralph (implement + review, fresh sessions)
```

## Workflow

1. `/grill-me` → align on what to build
2. `/to-prd` → write the PRD
3. `/to-issues` → slice into independently-buildable vertical tickets, each with a verification command
4. `/kanban board` → review the DAG
5. `/ralph` (repeatedly) or `ralph-loop.sh` → implement each issue in its own session, review each in its own session

## Commands

### Inside opencode

| Command | What it does |
|---------|-------------|
| `/flow` | Auto-detect where you are and suggest next step |
| `/grill-me` | Relentless interview until shared understanding |
| `/to-prd` | Turn alignment into PRD with user stories |
| `/to-issues` | Break PRD into vertical slices (tracer bullets) with verification commands |
| `/kanban init` | Create `.kanban/` in project root |
| `/kanban board` | Show all issues grouped by status |
| `/kanban next` | Show the next issue to work on |
| `/kanban dag` | Show dependency tree |
| `/kanban validate` | Check board integrity |
| `/kanban stale` | Find issues stuck in-progress |
| `/kanban move <id> <status>` | Update issue status |
| `/kanban show <id>` | Display full issue |
| `/ralph` | Implement the next issue in a fresh session, then review in a separate fresh session |

### From terminal (batched, fresh `opencode run` per issue and per review)

```bash
~/.pai/PAI/Tools/ralph-loop.sh                # Run all unblocked issues
~/.pai/PAI/Tools/ralph-loop.sh --limit 3      # Stop after 3 issues
~/.pai/PAI/Tools/ralph-loop.sh --dry-run      # Preview without running
~/.pai/PAI/Tools/ralph-loop.sh --review       # Review last completed issue
~/.pai/PAI/Tools/ralph-loop.sh --validate     # Validate board schema
~/.pai/PAI/Tools/ralph-loop.sh --stale        # Detect stale locks
```

## File Structure

```
project/
  .kanban/
    issues/
      001-auth-schema.md      # YAML frontmatter + markdown body
      002-auth-api.md         # Each issue is one vertical slice
    archive/                  # Completed issues (still queryable for deps)
    progress.md               # Inter-iteration continuity notes
```

## Issue Format

```yaml
---
id: 1
title: Auth schema change
status: pending          # pending | in-progress | review | done | blocked | cancelled
blocked_by: []           # IDs that must be done first
parent: null             # Parent epic (children block parent)
priority: 0              # Lower = higher priority
created: 2026-04-26
updated: 2026-04-26      # Auto-updated on status change
actor: human             # human | ralph | script
previous_status: null    # For rollback
---
```

Each issue body MUST include a `## Verification` section with a concrete command Ralph can run.

## Status Flow

```
pending ──→ in-progress ──→ review ──→ done
  │              │              │
  │              └──→ blocked ←─┘
  │                     │
  └──→ cancelled        └──→ pending (reopened)
```

## Key Concepts

| Concept | What it means |
|---------|--------------|
| **Tracer bullet** | Thin vertical slice through ALL layers (schema → API → UI → tests) |
| **Ralph-buildable** | Slice has a verification command and no human-gated steps |
| **Smart zone** | Under ~100k tokens. Fresh session per issue keeps every run in the smart zone. |
| **Memento approach** | Clear context between issues. Progress notes carry continuity. |
| **Implement-then-review** | Implementer and reviewer run in separate fresh sessions. |
| **Single-feature constraint** | One issue per `/ralph` invocation. No scope creep. |
| **Fresh context** | Each issue gets a clean context window. No compacting. |
| **progress.md** | Inter-iteration notes: what changed, decisions, conventions, notes for next. |

## `/flow` vs `/Development`

| | `/Development` | `/flow` |
|---|---|---|
| Planning | Phase-based plan docs | Alignment interview + vertical slices |
| Execution | Wave-based, within context | One issue, fresh context per |
| State tracking | Plan files | Local kanban board |
| Best for | Complex in-session builds | Many small slices with fresh-session execution |
| Context mgmt | Sharding (pre-emptive splits) | Memento (clear between issues) |

Both can coexist. Use whichever fits the task.

## Skill Locations

| Skill | Path |
|-------|------|
| flow | `${PAI_DIR:-$HOME/.pai}/skills/flow/SKILL.md` |
| kanban | `${PAI_DIR:-$HOME/.pai}/skills/kanban/SKILL.md` |
| ralph | `${PAI_DIR:-$HOME/.pai}/skills/ralph/SKILL.md` |
| grill-me | `${PAI_DIR:-$HOME/.pai}/skills/grill-me/SKILL.md` |
| to-prd | `${PAI_DIR:-$HOME/.pai}/skills/to-prd/SKILL.md` |
| to-issues | `${PAI_DIR:-$HOME/.pai}/skills/to-issues/SKILL.md` |
| ralph-loop.sh | `~/.pai/PAI/Tools/ralph-loop.sh` |
| tdd | `${PAI_DIR:-$HOME/.pai}/skills/tdd/SKILL.md` |
| improve-codebase-architecture | `${PAI_DIR:-$HOME/.pai}/skills/improve-codebase-architecture/SKILL.md` |
| design-an-interface | `${PAI_DIR:-$HOME/.pai}/skills/design-an-interface/SKILL.md` |

## Sources

Based on Matt Pocock's "Software Engineering Fundamentals in the AI Age" workshop (https://youtu.be/-QFHIoCo-Ko) and his production workflow from `mattpocock/course-video-manager` (744 closed issues). Adapted for fresh-session-per-issue execution.
