---
name: dev-plan
description: Create a structured implementation plan with technical approach, phased tasks, stable task IDs, acceptance criteria, testing strategy, validation commands, and traceability from a PRD, requirements document, or user prompt. Use when the user asks for an implementation plan, tech approach, task breakdown, phased roadmap, plan a feature, plan a fix, plan a refactor, or create a development plan.
---

# Dev Plan

Create an implementation plan that can be executed by `$dev-build` and verified by `$dev-test`.

## Workflow

1. Parse the user request or source document.
2. Discover relevant source documents under `artifacts/plans/` and `artifacts/specs/`.
3. Inspect the codebase directly for existing patterns, architecture, affected files, and tests.
4. Design the simplest viable implementation approach.
5. Write a plan to `artifacts/plans/<kebab-case-topic>/plan.md`.

Read `references/create-plan.md` for the required plan format, task ID rules, traceability mapping, validation command guidance, and report format.

## Plan Requirements

- Use stable checkbox task IDs like `[1.1]`.
- Preserve `#req-*` tags from source PRDs when present.
- Include concrete validation commands that are likely to work in the current repo.
- Include testing strategy proportional to risk.
- Avoid speculative architecture or extra features not requested.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.

## Output

Report the plan path, topic, key components, and next step, usually `$dev-validate` or `$dev-build`.
