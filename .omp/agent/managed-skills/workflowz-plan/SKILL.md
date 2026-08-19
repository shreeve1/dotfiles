---
name: workflowz-plan
description: "Generate and synthesize evidence-backed competing implementation plans using a Workflowz subagent panel. Use whenever the user asks for multiple plans, alternative approaches, plan comparison, a planning panel, or wants the best parts of several implementation plans combined before code is changed."
---

# Workflowz plan panel

Use this skill to produce one executable plan from genuinely independent candidate plans. The panel reduces a single planner's blind spots; it does not substitute for repository evidence or for the main agent's judgment.

## Scope first

1. Treat decisions unambiguously settled earlier in the current conversation as requirements automatically. Capture them in the planning context; do not ask the user to repeat them.
2. Separate settled decisions from open questions. State open questions as assumptions rather than silently resolving them.
3. Restate the requested outcome and acceptance criteria.
4. Run a `scout` agent to gather the relevant repository surface before planning: affected files, existing conventions, exported contracts, call sites, tests, and externally imposed constraints.
5. Write a compact evidence brief to `local://workflowz-plan-context.md`. Include the settled decisions, requirements, repository facts, and material assumptions the planners need.
6. Do not fan out for a trivial one-file change with one obvious implementation. State the direct plan instead.

## Generate candidates

For non-trivial work, run three distinct `task` agents concurrently in `eval` with `parallel()` and `agent()`:
- **Minimality:** smallest safe change; reject speculative abstraction and unrelated cleanup.
- **Integration:** contracts, callers, migrations, state/data compatibility, and failure modes.
- **Verification:** observable acceptance checks, regression coverage, deployment or rollback concerns only when the request requires them.

Give every planner the same requirements and the context-brief URI. Require structured output with: approach, ordered steps, assumptions, risks, affected files/callers, and verification.

Keep planners independent. Do not give one candidate to another before the candidate wave finishes.

## Judge and synthesize
1. Run two independent `reviewer` agents in parallel after all candidate plans return:
   - correctness/completeness reviewer;
   - simplicity/scope-discipline reviewer.
2. Each reviewer must cite the supplied repository evidence, identify unsupported assumptions, rank candidates, and say which exact parts to keep or reject.
3. The main agent synthesizes the final plan. It may combine compatible pieces, but never merges duplicate work or adds work no candidate/evidence justifies.
4. If reviewers disagree, prefer the smallest plan that satisfies explicit requirements and preserves established conventions. Escalate to a `deep-reviewer` agent only when the disagreement remains unresolved and material, or when the decision carries high-impact risk (security, data loss, irreversible production change, or other impact the user must own).

## Output

Return this exact shape:

```markdown
# Implementation plan

## Decision
<chosen approach and why>

## Repository evidence
- <fact with file/symbol reference>

## Steps
1. <ordered concrete change>

## Risks and assumptions
- <only material items>

## Verification
- <specific observable check/test/smoke scenario>

## Rejected alternatives
- <candidate aspect>: <reason>
```

Do not implement code unless the user explicitly asks to proceed after receiving the plan. Do not present raw candidate plans unless requested; expose the synthesis and the rejected alternatives instead.

## Panel size

Default to three planners and two judges. Add a security or performance lens only when the requested change makes that dimension material. More agents without distinct evidence or perspectives add wording variance, not confidence.
