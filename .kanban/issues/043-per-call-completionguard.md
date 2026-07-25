---
id: 043
title: Add per-call completionGuard override
status: blocked
previous_status: review
blocked_by: []
parent: null
priority: 0
updated: 2026-07-25
actor: ralph-reviewer
created: 2026-07-25
---

## What to build

`completionGuard` is only settable per-agent in frontmatter; callers cannot flip it per invocation. Add `completionGuard?: boolean` across the tool schema, chain step types, runner step types, and execution paths. Apply precedence `call > agent > default` at the runner resolution site. Export a `resolveCompletionGuard(call?, agent?): boolean` helper.

## Acceptance criteria

- [x] `SubagentParams`, `TaskItem`, `ChainItem`, `ParallelTaskSchema`, `DynamicParallelTemplateSchema` carry `completionGuard?: boolean`
- [x] `SequentialStep`, `ParallelTaskItem`, `DynamicParallelStep`, `DynamicParallelTemplate` carry `completionGuard?: boolean`
- [x] `DYNAMIC_PARALLEL_KEYS` in `dynamic-fanout.ts` includes `completionGuard`
- [x] `ParallelStepGroup`, `DynamicRunnerGroup` carry `completionGuard?: boolean`
- [x] `RunSyncOptions` carries `completionGuard?: boolean`
- [x] `resolveCompletionGuard(call?, agent?)` exported from `completion-guard.ts`
- [x] `async-execution.ts` threads `completionGuard` through `buildAsyncRunnerSteps` and `executeAsyncSingle`
- [x] `subagent-executor.ts` validates and threads `completionGuard` into chain/parallel/single/dynamic paths
- [x] `execution.ts` and `subagent-runner.ts` use resolved value instead of raw `agent.completionGuard !== false`
- [x] `test/unit/completion-guard-precedence.test.ts` passes: undefined→agent fallback, call=true overrides agent=false, default=true

## Verification

`node --experimental-strip-types --test test/unit/completion-guard-precedence.test.ts`

## Blocked by

None — can start immediately

## Blocker

Mandatory fresh review (RALPH_REVIEW: FAIL) found:

1. **Foreground executeChain omits top-level completionGuard** — `subagent-executor.ts` ~3361-3414 dispatches to the chain path without forwarding `params.completionGuard` into the runChainPath call, so the top-level override never reaches `executeChain`.
2. **Foreground dynamic group ignores step.completionGuard** — `chain-execution.ts` ~1395 materializes the dynamic parallel step without honoring the original `DynamicParallelStep.completionGuard`; only the materialized per-task template (and the run-level default) reach the runner.
3. **Async top-level parallel reconstruction drops per-task completionGuard** — `subagent-executor.ts` ~3135-3154 and ~4107-4140 rebuild parallel task shapes from `params.tasks` / recovery descriptors without threading per-task `completionGuard`, so all parallel children collapse to the resolved single value.
4. **Async recovery persists agent setting rather than effective call override** — `async-execution.ts` ~1681-1683 writes `agentConfig.completionGuard` into the recovery descriptor instead of `resolveCompletionGuard(params.completionGuard, agentConfig.completionGuard)`, so resumed runs lose the original per-call override.

The existing `test/unit/completion-guard-precedence.test.ts` exercises only the `resolveCompletionGuard` helper precedence and does not cover any of these routing paths, which is why the unit pass did not surface them.

## Resolution

(Failed review — see Blocker section. Worker must fix all four routing gaps, add coverage for the missing paths, and resubmit for fresh review.)
