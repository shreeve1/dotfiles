---
name: workflowz-ship
description: "Autonomously plan, implement, and review a change end-to-end using the Workflowz panels. Use when the user wants the full plan then execute then review workflow run in one uninterrupted pass — 'ship it', 'do it start to finish', 'plan and build and review', 'end-to-end', 'full workflow' — rather than a plan-only or review-only run."
---

# Workflowz ship

Use this skill to take a change from plan to implemented-and-reviewed code in a single autonomous pass: **plan → execute → review**, looping on confirmed findings until the change is clean or a bound trips. Invoke this only when the user and the session already agree on the direction going in — there is no approval gate. For a plan you want to inspect before code changes, use `workflowz-plan`; for a review of work not planned here, use `workflowz-review`.

The panels reduce a single agent's blind spots; they do not substitute for repository evidence or the main agent's judgment.

## Autonomy contract

- Run all three phases without stopping for user approval between them.
- State flows by `local://` brief between phases; do not re-prompt the user to repeat settled decisions.
- The run always terminates (see *Loop and termination*). On exit, emit the final review verdict.

## Phase 1 — Plan

Run the `workflowz-plan` orchestration:

1. Capture decisions already settled in the conversation as requirements; separate them from open questions stated as assumptions.
2. Run a `scout` agent to gather the affected repository surface; write the evidence brief to `local://workflowz-plan-context.md`.
3. For non-trivial work, run three distinct `task` planners concurrently in `eval` with `parallel()` and `agent()` (minimality, integration, verification lenses), then two independent `reviewer` judges (correctness/completeness, simplicity/scope). Keep planners independent.
4. Synthesize one `Implementation plan` with the standard shape (Decision, Repository evidence, ordered Steps, Risks and assumptions, Verification, Rejected alternatives).
5. If the two judges disagree, prefer the smallest plan that satisfies explicit requirements and preserves established conventions; escalate to a `deep-reviewer` only when the disagreement is unresolved and material, or the decision is high-impact (security, data loss, irreversible change).

Do not fan out for a trivial one-file change with one obvious implementation — state the direct plan and proceed.

## Phase 2 — Execute

Implement the synthesized plan. This is the only phase that writes code.

1. Consume the plan's ordered **Steps**, **Repository evidence**, and `local://workflowz-plan-context.md`.
2. **Adaptive decomposition — default to a single executor.** The plan's Steps are ordered and usually form a dependency chain; one `task` agent implementing them in sequence preserves that order and hands review one coherent changed surface. Fan out to concurrent `task` agents (batched into one `parallel()` call) **only** when the plan surfaces genuinely independent slices — separate files, no shared contract. Read the plan's dependencies before fanning out.
3. Run the plan's own **Verification** items as implementation proceeds.
4. Record the changed surface (files, callers, contracts touched) for review.
5. If a step cannot be implemented, the Steps contradict each other, a build error is unresolvable, or a Verification item persistently fails, stop and treat it as an **execute failure** that triggers the re-plan loop (see *Loop and termination*). Do not paper over it or push a broken change into review.

## Phase 3 — Review

Run the `workflowz-review` orchestration on the changed surface:

1. Use the accepted plan from Phase 1 as the implementation checklist. Write the review brief to `local://workflowz-review-context.md`.
2. Run three independent `reviewer` agents concurrently in `eval` with `parallel()` and `agent()` (requirement completeness, integration/regression, simplicity/scope). Add a security or performance reviewer only when the changed surface makes it material.
3. Run existing narrow checks that exercise the changed contract plus a practical smoke scenario when available; do not run a full suite by default. Record any check that cannot run as unverified coverage.
4. **Adversarial finding gate:** every candidate finding gets one fresh independent `reviewer` prompted to disprove it; keep only findings that survive with direct evidence. Add a second `deep-reviewer` verifier for high-impact findings (security, data loss, production safety).
5. The main agent deduplicates surviving findings and owns the final verdict; do not promote a finding merely because several agents repeated it. Only findings that survive here feed the fix loop — a spuriously promoted finding wastes an execute cycle.

## Loop and termination

Two bounded loops run inside the pass — a **re-plan loop** around a blocked execute and a **fix loop** around review findings — so the run always terminates.

**Re-plan loop (execute blocked).** When Phase 2 hits an execute failure, treat the plan as suspect: feed the failure back into Phase 1 as new evidence, re-plan, and re-execute. Cap at **2** re-plans. If execute still cannot complete, **abort** without running review and emit a failure report naming the blocking step. Never run review against a change execute could not complete.

After a clean execute, act on the review verdict:

- **Success exit** — review returns **zero confirmed findings**. Stop; emit the clean verdict.
- **Fix loop** — one or more confirmed findings survive the adversarial gate and dedup. Feed them back into Phase 2 as a corrective execute pass (narrow fixes only, no scope broadening), then re-run Phase 3.
- **Give-up exit** — stop and emit the final verdict, with remaining findings flagged **"unresolved after N attempts,"** when **either** a hard cap of **3** execute→review cycles is reached, or a cycle makes **no progress** (confirmed-finding count does not decrease, or a finding recurs unchanged).

Distinguish the three terminal states in the output — **clean** (no confirmed findings), **unresolved after N attempts** (fix loop hit its bound), and **aborted** (execute blocked after the re-plan cap). Give-up and abort are not success.

## Output

Emit the final `workflowz-review` verdict shape (Scope reviewed, Confirmed findings, No confirmed findings, Unverified coverage, Refuted findings, Validation performed), preceded by a one-line run summary: phases run, re-plans used, execute decomposition (single or fan-out), and terminal state (clean, unresolved after N attempts, or aborted with the blocking step). Do not expose raw candidate plans or raw reviewer output unless requested.

## Panel size

Inherit the defaults: three planners and two judges for plan; three reviewers and one adversarial verifier per finding for review. Add a security or performance lens only when the change makes that dimension material. More identical agents add wording variance, not confidence.
