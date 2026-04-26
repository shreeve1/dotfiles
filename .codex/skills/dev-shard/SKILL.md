---
name: dev-shard
description: Estimate whether an implementation plan fits a single Codex session and split oversized plans into ordered, self-contained shard plans. Use when the user mentions token budget, context budget, split plan, shard plan, plan too large, context window, or preparing a large plan for staged execution.
---

# Dev Shard

Analyze plan size and split only when needed. This skill does not build or edit implementation code.

## Workflow

1. Locate and read the plan.
2. Use `references/token-heuristic.md` to estimate plan, referenced file, task, validation, and orchestration cost.
3. If the estimate fits the budget, report that no sharding is needed.
4. If the estimate exceeds the budget, split the plan into ordered shard files under `specs/<plan-name>/`.
5. Make every shard standalone enough for `$dev-build`.

Read `references/analyze-and-shard.md` for the full estimation and shard output formats.

## Constraints

- Do not implement code.
- Never split a task from unresolved dependencies.
- Err on overestimating.
- Run generated shards sequentially.

## Output

Report estimated tokens, verdict, shard paths if created, and the recommended `$dev-build` order.
