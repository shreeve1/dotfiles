---
name: Prd
description: Transform a raw idea into a structured, AI-agent-actionable Product Requirements Document through a guided 5-phase interview process. USE WHEN create PRD, product requirements, idea to spec, brainstorm to requirements, define features, write user stories, capture product vision.
---

# Prd Sub-Skill

Transforms raw ideas into structured, buildable PRDs optimized for AI coding agents.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Development/Prd/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## Model Recommendation

**Recommended model:** `opus` — PRD creation benefits from deep reasoning for competitive analysis, user research synthesis, and architectural decisions.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| Create new PRD from idea | `Workflows/CreatePrd.md` |
| Resume existing PRD draft | `Workflows/CreatePrd.md` (auto-resumes from draft state) |

## Pipeline Position

**Comes before:** Plan (the plan reads the PRD via Source Document Discovery)
**Comes after:** Brainstorming (optional — brainstorming notes can feed into PRD)
**Output:** `artifacts/specs/prd-<name>-<date>.md`

## Context Files

| File | Purpose | When to Load |
|---|---|---|
| `PrdFormat.md` | Output format template for the final PRD document | During Phase 5 before generating the PRD |

## Examples

**Example 1: From raw idea**
```
User: "I want to build a recipe management app"
→ Loads Workflows/CreatePrd.md
→ 5-phase interview (Idea Capture → Problem Deep-Dive → Features → Architecture → Validation)
→ Saves PRD to artifacts/specs/prd-recipe-app-2026-04-15.md
```

**Example 2: From brainstorming notes**
```
User: "Turn my notes in artifacts/brainstorming/ into a PRD"
→ Discovers source document, uses as starting context
→ Interview focuses on refining and structuring existing ideas
→ Outputs traceable PRD with #req-[id] tags
```

**Example 3: Resume interrupted session**
```
User: "Continue my PRD" (with existing .prd-draft.json < 24 hours old)
→ Loads draft state, resumes from phase_completed + 1
→ Preserves all prior decisions and context
```
