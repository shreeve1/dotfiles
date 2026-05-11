# `/flow` Pipeline — Reference README

> Alignment-to-implementation pipeline based on Matt Pocock's AI coding workshop. Vertical slices, AFK loops, fresh context per issue.

## Quick Reference

```
/flow              → Auto-detect phase and route
/grill-me          → Phase 1: Interview until shared understanding
/to-prd            → Phase 2: Synthesize alignment into PRD
/to-issues         → Phase 3: Break PRD into vertical slices
/kanban board      → Phase 4: View and manage the board
/ralph             → Phase 5: Implement AFK issues one at a time
/ralph --review    → Phase 6: Review last completed issue
```

## The Pipeline

```
/grill-me → /to-prd → /to-issues → /kanban → /ralph → /review
 (HITL)     (HITL)    (HITL)      (HITL)    (AFK)    (AFK/HITL)
 Day shift  Day shift Day shift   Day shift  Night    Either
```

## Day/Night Workflow

**Day:** `/grill-me` → `/to-prd` → `/to-issues` → review board → go home
**Night:** `~/.pai/PAI/Tools/ralph-loop.sh --limit 10`
**Morning:** `--review` → `--stale` → `/kanban board`

## Commands

### Inside Claude Code

| Command | What it does |
|---------|-------------|
| `/flow` | Auto-detect where you are and suggest next step |
| `/grill-me` | Relentless interview until shared understanding |
| `/to-prd` | Turn alignment into PRD with user stories |
| `/to-issues` | Break PRD into vertical slices (tracer bullets) |
| `/kanban init` | Create `.kanban/` in project root |
| `/kanban board` | Show all issues grouped by status |
| `/kanban next` | Show the next issue to work on |
| `/kanban dag` | Show dependency tree |
| `/kanban validate` | Check board integrity |
| `/kanban stale` | Find issues stuck in-progress |
| `/kanban move <id> <status>` | Update issue status |
| `/kanban show <id>` | Display full issue |
| `/ralph` | Start AFK loop (interactive, in Claude Code) |

### From terminal (true AFK)

```bash
~/.pai/PAI/Tools/ralph-loop.sh                # Run all unblocked AFK issues
~/.pai/PAI/Tools/ralph-loop.sh --limit 3      # Stop after 3 issues
~/.pai/PAI/Tools/ralph-loop.sh --dry-run       # Preview without running
~/.pai/PAI/Tools/ralph-loop.sh --review        # Review last completed issue
~/.pai/PAI/Tools/ralph-loop.sh --validate      # Validate board schema
~/.pai/PAI/Tools/ralph-loop.sh --stale         # Detect stale locks
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
type: AFK                # AFK (auto) | HITL (needs human)
blocked_by: []           # IDs that must be done first
parent: null             # Parent epic (children block parent)
priority: 0              # Lower = higher priority
created: 2026-04-26
updated: 2026-04-26      # Auto-updated on status change
actor: human             # human | ralph | script
previous_status: null    # For rollback
---
```

## HITL Safety Policy

These are ALWAYS human-in-the-loop, never AFK:
- Authentication or authorization changes
- Billing or payment logic
- Database migrations (destructive)
- File deletions
- Security-sensitive code (keys, tokens, secrets)
- Dependency version upgrades (major/minor)
- Production configuration changes

## Status Flow

```
pending ──→ in-progress ──→ review ──→ done
  │              │              │
  │              └──→ blocked ←─┘
  │                     │
  └──────→ cancelled    └──→ pending (reopened)
```

## Key Concepts

| Concept | What it means |
|---------|--------------|
| **Tracer bullet** | Thin vertical slice through ALL layers (schema → API → UI → tests) |
| **Smart zone** | Under ~100k tokens. Quality degrades above this. |
| **Memento approach** | Clear context between issues. Progress notes carry continuity. |
| **Implement-then-review** | Implementer and reviewer are separate passes, preferably separate contexts. |
| **Single-feature constraint** | One issue per iteration. No scope creep. |
| **Fresh context** | Each issue gets a clean context window. No compacting. |
| **progress.md** | Inter-iteration notes: what changed, decisions, conventions, notes for next. |

## `/flow` vs `/Development`

| | `/Development` | `/flow` |
|---|---|---|
| Planning | Phase-based plan docs | Alignment interview + vertical slices |
| Execution | Wave-based, within context | One issue, fresh context per |
| State tracking | Plan files | Local kanban board |
| Best for | Complex in-session builds | AFK loops, set up and walk away |
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

Based on Matt Pocock's "Software Engineering Fundamentals in the AI Age" workshop (https://youtu.be/-QFHIoCo-Ko) and his production workflow from `mattpocock/course-video-manager` (744 closed issues).
