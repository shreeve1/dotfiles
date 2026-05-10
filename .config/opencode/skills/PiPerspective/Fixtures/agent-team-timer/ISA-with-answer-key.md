---
slug: agent-team-timer-display
name: "Agent team status widget timer behavior"
tier: E2
phase: VERIFY
source: real prior session (dotfiles commit 343e5c0, 2026-04-08)
---

# Agent team status widget timer behavior

## Problem

The agent-team extension renders a live status widget for each subagent in
the team. Each agent has a `state.status` field that can take one of
`"idle"`, `"running"`, `"done"`, `"error"`, `"failed"`, or similar
terminal states. When the user opens or refreshes the widget they want to
see the elapsed runtime **only for agents that are currently running**,
not for agents that have already finished (those show their final state
icon, no number).

When an agent is re-dispatched (run #2, #3, …), the widget must restart
the elapsed timer cleanly. If the re-dispatch reuses an interval handle
without clearing the previous one, multiple `setInterval` callbacks fire
concurrently and `state.elapsed` is overwritten faster than once per
second, causing flicker and gradual CPU drift.

## Goal

The status widget shows the elapsed-seconds counter **only when
`state.status === "running"`**, and every code path that assigns
`state.timer = setInterval(...)` first calls `clearInterval(state.timer)`
so that re-dispatch never leaks the previous interval.

## Out of Scope

- The format of the elapsed string (m/s rendering).
- Any other widget fields (status icon, name truncation, message count).
- Timer behavior during stall detection.

## Criteria

- [ ] ISC-01: `timeStr` in the inline status row is empty for every
      `state.status` other than `"running"`. Specifically: `"idle"`,
      `"done"`, `"error"`, and `"failed"` must all yield empty `timeStr`.
- [ ] ISC-02: The "Elapsed time (non-idle only)" branch in the wide
      widget renderer fires **only when status === "running"**. The
      comment in the code is misleading and should match the predicate.
- [ ] ISC-03: Every assignment `state.timer = setInterval(...)` is
      immediately preceded by `clearInterval(state.timer)` (or an
      equivalent guard) so re-dispatch cannot leak timers.
- [ ] ISC-04: Behavior is identical when an agent has never run
      (state.timer is undefined) — `clearInterval(undefined)` is a no-op
      in Node, so the guard must work in that case too.

## Test Strategy

- Read the diff and confirm the `timeStr` ternary uses `=== "running"`,
  not `!== "idle"`.
- Read the diff and confirm the wide-renderer branch uses `=== "running"`.
- Grep the diff for every `state.timer = setInterval` and verify each is
  guarded by a `clearInterval(state.timer)` on the immediately preceding
  line.

## Decisions

- The historical code used `!== "idle"` everywhere. This is the bug.
  Terminal states like `"done"` and `"error"` are not idle, so the
  elapsed counter kept ticking up next to a finished agent.

## Known Bugs the Reviewer Must Catch

(This section is normally absent from a real ISA. It is included here
ONLY because this is a test fixture and the maintainer needs to know
what a passing review looks like. The reviewer does NOT see this
section — only the sections above are presented as the ISA.)

1. The proposed diff REVERTS the predicate from `=== "running"` to
   `!== "idle"` in two places (lines ~957 and ~1051). This contradicts
   ISC-01 and ISC-02 directly.
2. The proposed diff REMOVES two `clearInterval(state.timer)` guards
   (lines ~1221 and ~1429). This contradicts ISC-03 directly.

Verdict expected from a correct reviewer: `FAIL` with at least two
`major` or `critical` blockers, citing file:line evidence for the
status-predicate divergence and the missing clearInterval guards.
