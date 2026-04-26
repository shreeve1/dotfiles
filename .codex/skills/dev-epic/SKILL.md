---
name: dev-epic
description: Decompose a large or multi-epic PRD into self-contained per-epic mini-PRDs that can each be planned and built independently. Use when the user asks to split a PRD, decompose PRD, break requirements into epics, handle a PRD that is too large, or prepare per-epic planning inputs.
---

# Dev Epic

Split a large PRD into standalone mini-PRDs while preserving traceability and dependency order.

## Workflow

1. Locate and read the PRD from the provided path or `artifacts/specs/`.
2. Apply the scope gate: decompose only if the PRD is multi-week, has many `#req-*` tags, lists multiple epics/workstreams, or the user forces decomposition.
3. Propose epic groupings and confirm any ambiguous grouping with the user.
4. Preserve every `#req-*` tag exactly and assign each feature to one epic.
5. Write outputs under `artifacts/specs/<parent-prd-basename>/`.

Read `references/decompose-epics.md` for the full decomposition workflow and output formats.

## Constraints

- Do not split a tightly coupled feature across epics.
- Do not auto-run `$dev-plan`; report the generated mini-PRD paths for the user or next workflow.
- If decomposition is unnecessary, report the no-op clearly and recommend `$dev-plan <prd-path>`.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.
