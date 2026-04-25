---
name: dev-review
description: Perform a code, architecture, configuration, plan, or current-session review focused on bugs, risks, regressions, missing tests, stack-specific best practices, and concrete file/line findings. Use when the user asks for review, code review, deep review, audit code, PR review, review file, review directory, review a plan, architecture review, technical risk review, best practices review, Codex second opinion, Claude second opinion, or cross-model review.
---

# Dev Review

Review first; edit only after the user asks for changes.

## Workflow

1. Resolve the review target: file, directory, diff, topic, or session context.
2. Read the target and enough surrounding code to understand behavior and conventions.
3. Detect stack, framework, test setup, and local patterns.
4. Select the most relevant review dimensions.
5. Lead with findings ordered by severity, grounded in file and line references.
6. Include open questions, then a brief summary only after findings.

Read `references/deep-review.md` for the expanded review workflow and optional independent Claude second-opinion process.

## Codex Adaptation

- Do not run `codex review` from inside Codex unless the user explicitly asks for an external CLI second opinion.
- If the user asks for a Claude second opinion or cross-model review, pass Claude a compact context packet: target, review scope, relevant plan/session summary, git diff or file list, and Codex findings.
- Follow Codex review style: findings first, bugs and regressions over broad commentary, concise summary last.
- If no issues are found, say so clearly and mention remaining test gaps or residual risk.

## Output

Return actionable findings with severity and exact references. Avoid cosmetic feedback unless it affects maintainability, correctness, security, performance, or user-visible behavior.
