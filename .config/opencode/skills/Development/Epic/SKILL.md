---
name: Epic
description: Decompose a large multi-epic PRD into per-epic mini-PRDs that /dev-plan can consume independently. USE WHEN epic, decompose PRD, multi-epic PRD, split PRD, PRD too large, epic decomposition, PRD has multiple epics, break PRD into epics.
---

# Epic

Decompose a large, multi-feature PRD into a set of self-contained per-epic mini-PRDs. Each mini-PRD is a complete, stand-alone PRD that `/dev-plan` can consume without reading the parent. This is the PRD-layer counterpart to `Shard` (which operates on plans).

## Customization

**Before executing, check for user customizations at:**
`~/.pai/PAI/USER/SKILLCUSTOMIZATIONS/Development/Epic/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## Model Recommendation

**Recommended model:** Opus — Epic decomposition requires deep analysis of feature dependencies, grouping strategy, and traceability. Opus provides the strongest reasoning for this structural work.

## Workflow Routing

| Scenario | Route To |
|---|---|
| Decompose a multi-epic PRD into per-epic mini-PRDs | `Workflows/DecomposeEpics.md` |

## Pipeline Position

**Comes after:** `/dev-prd`
**Comes before:** `/dev-plan` (run `/dev-plan` on each generated mini-PRD)
**Optional:** Skip for single-epic or small-scope PRDs — run `/dev-plan` directly

```
/dev-prd → /dev-epic → /dev-plan (per epic) → /dev-shard → /dev-build → /dev-test
```

## Context Files

| File | Content |
|------|---------|
| `../PipelineReference.md` | Full pipeline flow documentation and conventions |

## Variables

- `PRD_FILE` — Path to the PRD file, if provided
- `PRD_DIRECTORY` — `artifacts/specs/`
- `FEATURE_THRESHOLD` — `8`
- `FORCE_FLAG` — pass `--force` to bypass the scope gate and decompose any PRD regardless of size

## Examples

**Example 1: Large multi-week PRD**
```
User: "/dev-epic artifacts/specs/prd-my-app-2026-04-25.md"
→ Reads PRD, scope gate triggers (Multi-week, 12 features)
→ Proposes 3 epic groupings via AskUserQuestion
→ User confirms groupings and sequence
→ Writes 3 mini-PRDs + README to artifacts/specs/prd-my-app-2026-04-25/
```

**Example 2: Small PRD — no decomposition needed**
```
User: "Run dev-epic on the auth PRD"
→ Reads PRD, scope gate does NOT trigger (single-epic, 4 features)
→ Reports no-op: "Run /dev-plan directly"
```

**Example 3: Force decomposition**
```
User: "/dev-epic artifacts/specs/prd-small.md --force"
→ Bypasses scope gate, proceeds with decomposition regardless
```

## Constraints

- Never split a feature across two epics — tightly coupled features must stay together
- Each mini-PRD must be fully self-contained so `/dev-plan` doesn't need the parent
- Preserve all `#req-[id]` traceability tags exactly
- Do not auto-run `/dev-plan` — the user runs each epic plan explicitly
