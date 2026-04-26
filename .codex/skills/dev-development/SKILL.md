---
name: dev-development
description: Software development pipeline router for Codex covering PRD creation, epic decomposition, implementation planning, plan validation, plan sharding, plan execution, testing, code review, bug investigation, Playwright-style user stories, and end-to-end development pipeline work. Use when the user asks for a development pipeline, create PRD, decompose epic, implementation plan, validate plan, shard plan, build from plan, run tests, code review, investigate bug, user stories, or automated dev pipeline.
---

# Dev Development

Use this skill as the routing layer for the development workflow. Prefer the most specific `$dev-*` skill when the user request clearly maps to one stage.

## Routing

- Use `$dev-prd` for turning an idea or notes into a PRD.
- Use `$dev-epic` for splitting a large multi-epic PRD into self-contained mini-PRDs.
- Use `$dev-plan` for creating an implementation plan from a PRD, requirements file, or prompt.
- Use `$dev-validate` for preflight validation of an implementation plan against the current repo.
- Use `$dev-shard` for estimating whether a plan fits context and splitting it into buildable shards.
- Use `$dev-build` for executing a written plan or shard.
- Use `$dev-test` for running tests, discovering test setup, checking coverage, or verifying acceptance criteria.
- Use `$dev-review` for code review, architecture review, or technical risk review.
- Use `$dev-investigate` for root-cause diagnosis of bugs or unexpected behavior.
- Use `$dev-stories` for generating browser-testable UI stories from a plan.
- Use `$dev-team` only when the user explicitly wants an automated end-to-end pipeline.

## Pipeline

Full flow:

```text
$dev-prd -> $dev-epic optional -> $dev-plan -> $dev-validate -> $dev-shard optional -> $dev-build -> $dev-test
```

Minimum viable flow:

```text
$dev-plan -> $dev-build -> $dev-test
```

Review, investigation, stories, and team pipeline work are auxiliary and can be used at any stage.

## References

Read `references/pipeline-reference.md` when the user asks about the overall pipeline, directory conventions, or how the stages fit together.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.
