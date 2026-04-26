---
name: pi-dev-investigate
description: Use when debugging unclear bugs, unexpected behavior, missing root causes, or when you need to find where a symptom originates in code before proposing a fix. Stops at diagnosis — saves findings to artifacts/investigations/{slug}/investigation.md for handoff to a fix agent.
---

# Dev Investigate

> **Canonical paths (MANDATORY):** Read `~/.pi/agent/skills/PATHS.md` before any file output. All artifact paths in this skill resolve through that reference. Deviation is a bug — surface it instead of working around it.

Use this skill to diagnose a problem before proposing or implementing a fix. It fits cases where the symptom is real but the cause is unclear, the relevant code path is unknown, or a quick search would likely produce guesses instead of evidence. Do not use it when the root cause is already known and the task is straightforward implementation.

**Stop at Diagnosis.** This skill diagnoses only. No code edits unless the user explicitly asks for a fix. Findings are saved to `artifacts/investigations/${SLUG}/investigation.md` for handoff.

---

## Variables

- `PROBLEM_INPUT` — the user's bug report, error message, or symptom description
- `SLUG` — short kebab-case issue name (e.g. `login-500-odd-hours`); falls back to a `YYYYMMDD-HHMMSS` timestamp if no human-readable name is available
- `OUTPUT_DIR` — `artifacts/investigations/${SLUG}/`
- `INVESTIGATION_FILE` — `artifacts/investigations/${SLUG}/investigation.md`

---

## Phase 1 — Understand the Problem

Extract the current facts from the user's report and any provided logs, traces, screenshots, or code.

Capture:
- **Observed behavior** — what is actually happening?
- **Expected behavior** — what should happen instead?
- **Context** — where does this occur? Which environment, feature, or workflow?
- **Evidence** — errors, logs, stack traces, failing outputs, timings, regressions
- **Unknowns** — what key facts are still missing?

Write a brief 1–3 sentence summary of your current understanding. Be explicit about assumptions so they can be tested rather than silently carried.

---

## Phase 2 — Resolve Ambiguity

If important facts are unclear, use `ask_user` to clarify only the details that affect investigation direction. Good questions:
- "To confirm: you're seeing [X] when you expect [Y], correct?"
- "Is this happening in production, locally, or both?"
- "When did this start? Tied to a specific deploy or change?"
- "Do you have an error message, stack trace, or failing example?"
- "What have you already tried?"

If the report is concrete enough, do not block on questions. Proceed with stated assumptions.

---

## Phase 3 — Derive Slug and Set Up Output Directory

Derive `SLUG`:
- If the issue has an obvious short name, use it: `login-500-odd-hours`, `cron-stalls-after-deploy`, `webhook-double-fire`.
- If not obvious, fall back to timestamp: `bash -c 'date -u +"%Y%m%d-%H%M%S"'`.

Confirm the slug with `ask_user` if it's non-obvious.

```sh
mkdir -p "artifacts/investigations/${SLUG}"
```

---

## Phase 4 — Form Hypotheses

List 2–5 candidate root-cause hypotheses, ordered by likelihood given the evidence. For each:
- **Hypothesis** — what might be wrong
- **Why plausible** — what evidence supports it
- **How to falsify** — concrete check (read this file, run this command, examine this log)

If you only have one hypothesis, consider whether you've actually looked or just latched onto the first explanation. Force at least one alternative.

---

## Phase 5 — Investigate

Work through hypotheses in order. For each:

1. **Read the relevant code path.** Use `read` and `bash` (with `rg`/`grep`) to trace the actual execution.
2. **Check the data.** If the bug involves state (DB rows, cache values, env vars, feature flags), inspect the actual values, not what you assume they are.
3. **Reproduce or observe.** If the bug is reproducible, run the failing path with `bash`. If not, inspect logs/traces for prior occurrences.
4. **Falsify or confirm.** Mark each hypothesis confirmed, falsified, or inconclusive.

**Iron law: no fixes without root cause.** If a hypothesis is "confirmed but I'm not sure why" — keep digging. Surface-level pattern matches that don't explain the *why* are not root causes.

If new evidence reshapes the problem, loop back to Phase 1 and update the summary.

---

## Phase 6 — Confirm Root Cause

A root cause is confirmed when:
- The mechanism is explained (not just correlated).
- The fix path is clear (even if you won't implement it).
- The "why now" is explained (what changed, why this hadn't happened before, or why it's been hiding).

If you can't satisfy all three, the investigation is inconclusive — say so explicitly.

---

## Phase 7 — Write Investigation File

Use `write` to save findings to `INVESTIGATION_FILE` in this format:

```md
---
slug: <slug>
timestamp: <ISO 8601>
status: <confirmed | inconclusive>
issue_summary: "<single line>"
root_cause_location: "<file:line>"
root_cause_what: "<single line>"
---

# Investigation: <issue summary>

## Observed Behavior
<what's happening>

## Expected Behavior
<what should happen>

## Context
<where, when, environment>

## Evidence
- <log line, trace, repro step>
- <log line, trace, repro step>

## Hypotheses Considered

| # | Hypothesis | Outcome | Notes |
|---|------------|---------|-------|
| 1 | <hypothesis> | confirmed / falsified / inconclusive | <why> |
| 2 | <hypothesis> | falsified | <why> |

## Root Cause

**Location:** `<file>:<line>` (or specific subsystem if not file-localized)

**What:** <one sentence summary>

**Why:** <2-5 sentence explanation of the mechanism — how the broken state arises, why now>

## Recommended Fix Direction

<NOT a fix implementation — a direction for the fix agent>

- <approach 1 + tradeoff>
- <approach 2 + tradeoff>

## Regression Tests

If reproducible, draft 1–2 test cases (in `tests/regression/`) that would catch this bug returning. Save the test scaffolding (skipped tests with TODO bodies) so the fix agent can fill them in.

## Open Questions
<anything still unresolved>
```

---

## Phase 8 — Report

```text
🔍 Investigation Saved

Slug:        <slug>
File:        artifacts/investigations/<slug>/investigation.md
Status:      <confirmed | inconclusive>
Root cause:  <one-line summary>
Location:    <file:line>

Next step:
  Hand off to a fix agent / pi-dev-plan with this investigation as input.
  Regression test scaffolding saved at tests/regression/<slug>.spec.ts (if applicable).
```

---

## Notes

- **Diagnosis only.** Do not edit production code in this skill, even if the fix is one line. The hand-off boundary is sacred — it forces an explicit fix decision rather than silent surgery.
- **One root cause per investigation file.** If the symptom has multiple independent causes, write multiple investigation files (different slugs).
- **Inconclusive is a valid outcome.** Better to write `status: inconclusive` and explain what's still unknown than to write a confident-sounding wrong root cause.
