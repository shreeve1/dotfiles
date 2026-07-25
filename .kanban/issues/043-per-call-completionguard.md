---
id: 043
title: Add per-call completionGuard override
status: done
previous_status: blocked
blocked_by: []
parent: null
priority: 0
updated: 2026-07-25
action_reviewed: 2026-07-25
actor: human
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

## Resolution

All four routing gaps fixed and routed through `resolveCompletionGuard`: foreground `executeChain` top-level forwarding, foreground dynamic-group step seam, async top-level parallel reconstruction, and async recovery descriptor round-trip. Independent review APPROVED at `2a346d6`. Focused suite `completion-guard-precedence.test.ts` 14/14 passed; full unit suite 21/21 passed.

## Reviewer Note

Plan acceptance criteria and Standards/Spec checked. Review found single-use, test-only exported seams masking the production paths; removed those exports, used direct assignments/conditional spreads at the real write sites, and updated `completion-guard-precedence.test.ts` to check production routing and precedence. Final validation: full unit glob 22/22, Fusion smoke pass, plan Node preflight `preflight OK`. No remaining gaps.
