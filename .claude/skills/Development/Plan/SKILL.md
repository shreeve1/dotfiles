---
name: Plan
description: Create a structured implementation plan via an iterative Claude-plan ↔ Codex-audit loop (max 3 rounds, severity-gated early exit). Replaces the prior plan + validate two-step. Produces phased task breakdown, technical approach, and acceptance criteria from a PRD, requirements description, or user prompt. USE WHEN implementation plan, tech approach, task breakdown, phased roadmap, plan a feature, plan a fix, plan a refactor, create plan, development plan, validate plan, pre-flight check, feasibility, risk analysis.
---

# Plan Sub-Skill

Creates detailed, actionable implementation plans through an iterative loop: Claude drafts the plan, Codex adversarially audits it against the codebase with severity-tagged findings, Claude revises. Loop runs up to 3 rounds, exiting early when no critical findings remain or the plan converges.

This sub-skill absorbs the previous `/dev-validate` step — Codex's codebase-aware critique covers feasibility and risk analysis as part of every round. Use `--no-loop` to skip the audit and produce a single-pass plan for trivial work.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Development/Plan/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## Model Recommendation

**Recommended model:** `opus` — Planning benefits from deep reasoning for architecture decisions, dependency analysis, and edge case identification.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| Create new implementation plan | `Workflows/CreatePlan.md` |

## Pipeline Position

**Comes before:** Shard (if plan exceeds token budget) or Build directly
**Comes after:** Prd (the plan reads the PRD via Source Document Discovery)
**Output:**
- `plans/<feature>.md` — canonical plan (format unchanged from prior `/dev-plan`)
- `plans/.<feature>.state.yml` — loop state with verbatim Codex findings, severity tallies, exit reason

## Directory Search Order

Plans and source documents are discovered in this priority order:
1. `plans/` (primary output location)
2. `specs/`
3. `artifacts/plans/`
4. `artifacts/specs/`

## Context Files

This sub-skill does not require separate context files. The workflow contains the plan format inline.

## Invocation

| Form | Behavior |
|------|----------|
| `/dev-plan <prompt>` | Default — drafts plan, runs up to 3 Codex audit rounds, exits early when no critical findings remain |
| `/dev-plan <prompt> --rounds N` | Override max rounds (e.g. `--rounds 5` for high-stakes plans, `--rounds 1` for quick check) |
| `/dev-plan <prompt> --no-loop` | Bypass loop entirely; single-pass plan only — for trivial bug fixes where 3 rounds is overkill |
| `/dev-plan <prompt> --resume` | Pick up an interrupted loop from saved state YAML |

## Examples

**Example 1: From PRD**
```
User: "Create a plan from the recipe app PRD"
→ Discovers artifacts/specs/prd-recipe-app-2026-04-15.md
→ Scans for #req-[id] tags for traceability
→ Drafts plan, then loops Codex Challenge (round 1) → Consult (rounds 2-3)
→ Produces plans/feature-recipe-app.md with Traceability Map
→ State YAML at plans/.feature-recipe-app.state.yml
```

**Example 2: Quick fix**
```
User: "/dev-plan fix the off-by-one in pagination --no-loop"
→ Single-pass plan, no Codex audit
→ Outputs plans/fix-pagination-off-by-one.md
```

**Example 3: High-stakes plan with extra audit rounds**
```
User: "/dev-plan migrate from REST to GraphQL --rounds 5"
→ Explores codebase for all API endpoints
→ Drafts phased migration plan
→ Loops up to 5 Codex audit rounds (exits early when no critical findings)
→ State YAML carries verbatim Codex findings for later AI review
```

**Example 4: Resume interrupted loop**
```
User: "/dev-plan migrate from REST to GraphQL --resume"
→ Detects existing plans/.migrate-from-rest-to-graphql.state.yml
→ Picks up from last completed round
→ Continues until exit criteria met
```
