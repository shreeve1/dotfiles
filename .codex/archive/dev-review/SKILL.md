---
name: dev-review
description: Perform a code, architecture, configuration, plan, proposed-solution, or current-session review focused on bugs, risks, regressions, missing tests, stack-specific best practices, and concrete findings. Use when the user asks for review, code review, deep review, audit code, PR review, review file, review directory, review a plan, review a proposal, review the current context, architecture review, technical risk review, best practices review, Codex second opinion, Claude second opinion, or cross-model review.
---

# Dev Review

Review first; edit only after the user asks for changes. Every review must attempt a Claude Code cross-check unless the user explicitly opts out or Claude is unavailable. No PRD, implementation plan, or code diff is required; the target can be a path, diff, plan, pasted proposal, specific solution, topic, or current conversation context.

## Workflow

1. Resolve the review target: file, directory, diff, plan, proposed solution, topic, or session context.
2. Read the target and enough surrounding code or conversation context to understand behavior, intent, and constraints.
3. Detect stack, framework, test setup, and local patterns.
4. Select the most relevant review dimensions.
5. Run Codex's own analysis pass.
6. **Run an independent Claude Code review pass for every review target** (see Codex Adaptation below).
7. Present findings side-by-side: Codex findings, Claude findings, overlap, disagreement.
8. Lead with findings ordered by severity, grounded in exact file:line references when available, or exact section/claim references for non-file targets.
9. Include open questions, then a brief summary only after findings.

Read `references/deep-review.md` for the expanded review workflow and the exact Claude shell-out contract.

## Codex Adaptation

- **Claude Code is a mandatory cross-check attempt for every review.** After Codex's own analysis, this workflow shells out to the `claude` CLI for an independent review pass against the same target/context packet. Findings from both models are surfaced side-by-side so the user sees overlap, unique findings per model, and disagreements. See `references/deep-review.md` Phase 4 for the exact bounded Claude CLI contract, including the bare-mode probe and OAuth/keychain fallback.
- **Do not skip the Claude attempt silently.** Skip the Claude pass only when: (a) `claude` CLI not installed, (b) both bounded auth probes fail or time out, (c) the bounded review command fails or times out in the selected mode, or (d) the user explicitly says "codex-only review" / "skip claude" / "no second opinion". Report the skipped status and reason in the review output.
- Do not run `codex review` from inside Codex unless the user explicitly names a Codex CLI review.
- Follow Codex review style: findings first, bugs and regressions over broad commentary, concise summary last.
- If no issues are found, say so clearly and mention remaining test gaps or residual risk.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.

## Output

Return actionable findings with severity and exact references. Use exact file:line references when available, or exact section/claim references for non-file targets. Avoid cosmetic feedback unless it affects maintainability, correctness, security, performance, or user-visible behavior.
