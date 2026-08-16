# 0004 — Concurrent subagents with disjoint file sets

**Status:** accepted (2026-08-16)

Multiple concurrent foreground subagents become possible: multiple scouts in
parallel, worker + reviewer pipeline overlap, multiple workers on disjoint
file sets in one working tree. The previous single-call-per-turn guard
blocked all three patterns; the new contract is "one writer per file set"
instead of "one writer per cwd."

## Context

pi-subagents' foreground execution path was wrapped in
`executeWithSingleDispatchGuard`, which set `state.subagentInProgress = true`
around each non-action foreground call and rejected a second concurrent
foreground call with:

> Rejected: a subagent call is already in progress. Issue exactly ONE
> subagent call per turn.

The guard short-circuited multi-scout fanout, the worker+reviewer pipeline
overlap, and multi-worker dispatch even though the underlying parallel
machinery (`tasks[]` up to 8, concurrency 4, opt-in worktrees) already
supported concurrency. Only the multi-call-per-turn foreground path was
blocked. State field
(`src/shared/types.ts:1004` `subagentInProgress?: boolean`), state init in
`src/extension/index.ts:219`, state init in `src/extension/fanout-child.ts:34`,
and the read in `hasActiveSubagentChildren`
(`src/runs/foreground/subagent-executor.ts:472`).

## Decision

1. **Delete the single-dispatch guard.** Export the inner `execute` directly
   (`src/runs/foreground/subagent-executor.ts` end of
   `createSubagentExecutor`, returning `return { execute };`). Remove
   `executeWithSingleDispatchGuard` entirely. The remaining work it
   performed was redundant: `execute` already calls
   `omitExecutionModeActionAlias` at its top, and `clarify` is handled
   inside the run paths.
2. **Drop the `subagentInProgress` state field.** Remove the optional
   `subagentInProgress?: boolean` from `SubagentState`, remove its two
   initializations, and remove its only read in
   `hasActiveSubagentChildren`.
3. **Writer contract changes from "one writer per cwd" to "one writer per
   file set."** Concurrent workers in one cwd MUST be handed disjoint file
   sets (the delegation `Files` field is the declaration). The parent
   attributes changed files to workers afterward via `git status
   --porcelain` + `git diff --stat HEAD` and stops on any overlap. Isolated
   worktrees remain opt-in; they are not required.
4. **Reviewer scope narrows.** Reviewers always review a completed diff,
   scoped to the target worker's declared file set; never review the whole
   tree while another worker is in flight.
5. **Multi-scout batching guidance.** Batch multiple scouts into one
   `tasks:[...]` call when they're known upfront. Separate concurrent
   scout calls are fine when discovered sequentially.

The change touches one file as production: the guard removal in
`subagent-executor.ts`. No parallel-max / concurrency / worktree knobs
change; no config knobs added.

## Consequences

- Multiple concurrent foreground subagents become possible: multi-scout
  fanout via `tasks:[...]` already worked; now multi-worker via the same
  shape is also permitted.
- The only unverifiable-at-design risk is TUI rendering of multiple
  concurrent foreground runs (two parallel scrolling subagent result
  panels). Verified by a manual smoke test (two scouts in one turn, both
  stream).
- Vendored deviation: pi-subagents is vendored at version 0.35.1 (the
  package CHANGELOG is the only version marker). Local change removes the
  single-dispatch foreground guard. A future upstream re-vendor must
  re-apply this change; tracked in `docs/pi-extensions.md`.
- A new unit test (`test/unit/dispatch-concurrent.test.ts`) pins the new
  contract: two concurrent foreground-style calls both reach the inner
  `execute` (neither returns the old rejection text) and
  `SubagentState.subagentInProgress` is undefined.

## Supersedes

- ADR 0002 "Role split" table — the `worker` row cell is now "one writer per
  file set (disjoint sets for concurrent workers)" and the closing
  "One writer per cwd. Parallel writers require isolated git worktrees."
  line carries the marker "Superseded by ADR 0004 (concurrent subagents
  with disjoint file sets)."
- ADR 0003 "Same working tree" bullet — the contract is now the same
  disjoint-file-set rule; worktrees remain available (opt-in) but are not
  required.
- Fusion guidance body
  (`.pi/agent/extensions/fusion/index.ts` `FUSION_GUIDANCE_BODY`) —
  worker / reviewer / closing-line bullets carry the new wording.
- `SUBAGENT_SAFETY_GUIDANCE`
  (`.pi/agent/extensions/pi-subagents/src/extension/tool-description.ts`)
  — the "keep one writer for the same cwd/worktree" bullet is replaced
  with the writer + reviewer rule.
- `.pi/agent/APPEND_SYSTEM.md` role-models bullet — `worker — one writer
  per file set (concurrent workers get disjoint file sets).`
- `CONTEXT.md` Fusion-roles bullet — same wording, glossary-style.

## Evidence

- Deleted wrapper:
  `src/runs/foreground/subagent-executor.ts` `executeWithSingleDispatchGuard`
  (previously returning `duplicateSubagentCallResult(requestParams)` when
  `deps.state.subagentInProgress === true`).
- Deleted helper: `duplicateSubagentCallResult`
  (`src/runs/foreground/subagent-executor.ts`); the rejection string was
  "Rejected: a subagent call is already in progress. Issue exactly ONE
  subagent call per turn."
- Deleted helper: `inferExecutionMode` (used only by
  `duplicateSubagentCallResult`).
- Removed state field: `SubagentState.subagentInProgress?: boolean`
  (`src/shared/types.ts` `SubagentState` definition).
- Removed initializations:
  `src/extension/index.ts` `subagentInProgress: false` and the matching
  line in `src/extension/fanout-child.ts`.
- Observed rejection (pre-change): a second non-action foreground call
  returned `{ content: [{ text: "Rejected: a subagent call is already in
  progress. Issue exactly ONE subagent call per turn." }], isError: true,
  details: { mode: <single|parallel|chain>, results: [] } }`.
- Test: `node --experimental-strip-types --test
  test/unit/dispatch-concurrent.test.ts` (also runs as part of
  `npm test`).
