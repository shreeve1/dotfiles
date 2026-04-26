---
name: dev-review
description: Perform a code, architecture, configuration, plan, or current-session review focused on bugs, risks, regressions, missing tests, stack-specific best practices, and concrete file/line findings. Use when the user asks for review, code review, deep review, audit code, PR review, review file, review directory, review a plan, architecture review, technical risk review, best practices review, Codex second opinion, Claude second opinion, or cross-model review.
---

# Dev Review

Review first; edit only after the user asks for changes. Cross-model by default.

## Workflow

1. Resolve the review target: file, directory, diff, plan, topic, or session context.
2. Read the target and enough surrounding code to understand behavior and conventions.
3. Detect stack, framework, test setup, and local patterns.
4. Select the most relevant review dimensions.
5. Run Codex's own analysis pass.
6. **Run an independent Claude Code review pass by default** (see Codex Adaptation below).
7. Present findings side-by-side: Codex findings, Claude findings, overlap, disagreement.
8. Lead with findings ordered by severity, grounded in file and line references.
9. Include open questions, then a brief summary only after findings.

Read `references/deep-review.md` for the expanded review workflow and the exact Claude shell-out contract.

## Codex Adaptation

- **Claude Code is the default cross-check channel.** After Codex's own analysis, this workflow shells out to the `claude` CLI for an independent review pass. Findings from both models are surfaced side-by-side so the user sees overlap, unique findings per model, and disagreements. See `references/deep-review.md` Phase 4 for the exact prompt contract and tool whitelist.
- **Skip the Claude pass only when:** (a) `claude` CLI not installed, (b) auth probe fails, or (c) the user explicitly says "codex-only review" / "skip claude" / "no second opinion".
- Do not run `codex review` from inside Codex unless the user explicitly names a Codex CLI review.
- Follow Codex review style: findings first, bugs and regressions over broad commentary, concise summary last.
- If no issues are found, say so clearly and mention remaining test gaps or residual risk.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.

## Output

Return actionable findings with severity and exact references. Avoid cosmetic feedback unless it affects maintainability, correctness, security, performance, or user-visible behavior.
