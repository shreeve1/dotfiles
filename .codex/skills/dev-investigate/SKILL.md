---
name: dev-investigate
description: Diagnose bugs, regressions, errors, unexpected behavior, performance problems, or failing tests through a systematic root-cause investigation that stops at diagnosis and produces handoff artifacts. Use when the user asks to investigate, debug, diagnose, find root cause, trace an issue, locate a defect, explain an error, or determine where a bug is coming from.
---

# Dev Investigate

Find the root cause. Do not fix code unless the user explicitly changes the task to implementation.

## Workflow

1. Understand the observed and expected behavior.
2. Resolve ambiguity with concise questions when needed.
3. Locate likely code paths with targeted search.
4. Verify the suspected location explains the symptom.
5. Confirm root cause only when `WHERE`, `WHAT`, and `WHY` are all answered.
6. Save findings under `investigations/` and write targeted regression tests when feasible.

Read `references/investigate.md` for the full six-phase investigation loop, investigation file format, and fix-test guidance.

## Constraints

- Do not write fix code.
- Do not refactor suspected locations.
- Do not claim root cause from correlation alone.
- Cite file and line evidence.
- If multiple plausible causes remain, keep investigating or state the uncertainty.

## Output

Report problem summary, root cause location, cause chain, confirmed assumptions, evidence, saved investigation path, and any fix tests created.
