---
name: workflowz-review
description: "Review completed code changes for requirement completeness and regressions using an evidence-backed Workflowz panel with adversarial finding verification. Use whenever the user asks to review completed work, check whether an implementation is complete, validate a change against its plan, run an adversarial code review, or assess a PR/diff before accepting it."
---

# Workflowz review panel

Use this skill after implementation to decide whether the requested change is complete. Review is report-only: it must never edit code, add tests, or broaden the change. The goal is high-signal evidence, not a long list of speculative concerns.

## Establish the review contract

1. Treat decisions unambiguously settled earlier in the current conversation as requirements automatically.
2. If an accepted `/workflowz-plan` output exists, use it as the implementation checklist. Later explicit conversation decisions override it.
3. Separate requirements from open assumptions. Do not invent requirements from the implementation.
4. Run a `scout` agent to identify the completed change, changed files, necessary callers/contracts, existing targeted checks, and relevant smoke path. Review this surface; do not turn the invocation into a whole-repository audit.
5. Write the compact review brief to `local://workflowz-review-context.md`. Include requirements, plan checklist when present, changed surface, known assumptions, and validation commands or scenarios.

## Review in parallel
Run these three independent `reviewer` agents concurrently in `eval` using `parallel()` and `agent()`:

- **Requirement completeness:** trace every requirement and planned step to implemented behavior, or identify a gap.
- **Integration and regression:** inspect necessary callers, contracts, state/error paths, compatibility, and targeted test coverage.
- **Simplicity and scope:** identify needless complexity, leftover obsolete paths created by this change, and behavior that drifted beyond the request.

Add a security or performance reviewer only when the changed surface makes that dimension material. Give each reviewer the same review-brief URI. Require structured findings with requirement/expected behavior, file and symbol evidence, impact, reproduction or validation check, and narrow correction direction.

## Validate behavior

Run existing, narrow checks that exercise the changed contract, plus a practical smoke scenario when available. Do not run a full suite by default. Do not create tests. If a required check cannot run, record the reason as unverified coverage rather than treating it as a clean result.

## Adversarial finding gate
1. Every candidate finding receives one fresh, independent `reviewer` agent prompted to disprove it.
2. A verifier must read the relevant files and assess whether the claimed requirement, evidence, and reproduction actually support the finding.
3. Keep a finding only when it survives with direct evidence and a plausible violated behavior or unmet requirement. Otherwise report it as refuted, not confirmed.
4. Run a second independent `deep-reviewer` agent for security, data-loss, production-safety, or other high-impact findings.
5. The main agent deduplicates surviving findings and owns the final verdict. It must not promote a panel claim merely because several agents repeated it.

## Report

Return this exact shape:

```markdown
# Review verdict

## Scope reviewed
- <requirements, plan reference if used, changed surface>

## Confirmed findings
- <requirement or expected behavior>: <evidence; impact; reproduction/check; narrow correction direction>

## No confirmed findings
- <requirements or surfaces reviewed without surviving findings>

## Unverified coverage
- <check or behavior not verified>: <reason>

## Refuted findings
- <candidate finding>: <why the adversarial check rejected it>

## Validation performed
- <targeted command or smoke scenario>: <observed result>
```

Use these outcome meanings precisely:

- **Confirmed findings:** evidence-backed defects or unmet requirements.
- **No confirmed findings:** no issue survived review and adversarial verification; this is not proof of perfection.
- **Unverified coverage:** an important behavior or check could not be inspected or executed.

Do not expose raw reviewer output unless requested. Do not apply any correction. The user decides whether confirmed findings should be fixed.

## Panel size

Default to three reviewers and one adversarial verifier per finding. Add a second verifier only for high-impact findings. More identical reviewers increase wording variance more than confidence.
