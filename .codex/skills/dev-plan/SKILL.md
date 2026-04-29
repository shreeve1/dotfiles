---
name: dev-plan
description: Create a structured implementation plan via an iterative Codex-plan ↔ Claude-audit loop (max 3 rounds, severity-gated early exit). Replaces the prior plan + validate two-step. Produces phased task breakdown, technical approach, stable task IDs, acceptance criteria, testing strategy, validation commands, and traceability from a PRD, requirements document, or user prompt. Use when the user asks for an implementation plan, tech approach, task breakdown, phased roadmap, plan a feature, plan a fix, plan a refactor, validate a plan, preflight a plan, check feasibility, or assess plan risk.
---

# Dev Plan

Create an implementation plan that can be executed by `$dev-build` and verified by `$dev-test`. Codex drafts the plan, then `claude -p` adversarially audits it against the codebase with severity-tagged findings, and Codex revises. Loop runs up to 3 rounds, exiting earlier when no critical findings remain or the plan converges.

This skill absorbs the previous `$dev-validate` step — Claude's codebase-aware critique covers feasibility, risk, and breaking-change analysis as part of every round. Use `--no-loop` to skip the audit and produce a single-pass plan for trivial work.

## Invocation

| Form | Behavior |
|------|----------|
| `$dev-plan <prompt>` | Default — drafts plan, runs up to 3 Claude audit rounds, exits early when no critical findings remain |
| `$dev-plan <prompt> --rounds N` | Override max rounds (e.g. `--rounds 5` for high-stakes plans, `--rounds 1` for quick check) |
| `$dev-plan <prompt> --no-loop` | Bypass the loop entirely; single-pass plan only — for trivial bug fixes where 3 rounds is overkill |
| `$dev-plan <prompt> --resume` | Pick up an interrupted loop from saved state YAML |

## Workflow

1. Parse the user request, flags, and source documents.
2. If the prompt is thin and no source document exists, ask for clarification.
3. Inspect the codebase directly for existing patterns, architecture, affected files, and tests.
4. Draft the plan to `artifacts/plans/<slug>/plan.md`.
5. If the loop is enabled, run the Codex ↔ Claude audit loop (up to 3 rounds, severity-gated early exit).
6. Persist round-by-round state to `artifacts/plans/<slug>/state.yml` with verbatim Claude findings.

Read `references/create-plan.md` for the required plan format, the full loop workflow, the `claude -p` shell-out contract (bare-mode probe with non-bare fallback, timeout wrapper, tools disabled, redaction), the severity taxonomy, exit criteria, and state YAML schema.

## Plan Requirements

- Use stable checkbox task IDs like `[1.1]`.
- Preserve `#req-*` tags from source PRDs when present.
- Include concrete validation commands that are likely to work in the current repo.
- Include testing strategy proportional to risk.
- Avoid speculative architecture or extra features not requested.
- Plan markdown format must remain identical across loop rounds — downstream `$dev-build`, `$dev-shard`, and `$dev-test` depend on the structure.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.

- Canonical plan: `artifacts/plans/<slug>/plan.md` (format unchanged from prior `$dev-plan`)
- Loop state: `artifacts/plans/<slug>/state.yml` (machine state + verbatim Claude findings, AI-reviewable audit trail)

## Output

Report the plan path, state path, loop outcome (rounds run, exit reason, final findings counts), key components, and next step, usually `$dev-shard` or `$dev-build`.
