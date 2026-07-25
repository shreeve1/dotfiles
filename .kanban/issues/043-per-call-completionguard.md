---
id: 043
title: Add per-call completionGuard override
status: pending
blocked_by: []
parent: null
priority: 0
created: 2026-07-25
---

## What to build

`completionGuard` is only settable per-agent in frontmatter; callers cannot flip it per invocation. Add `completionGuard?: boolean` across the tool schema, chain step types, runner step types, and execution paths. Apply precedence `call > agent > default` at the runner resolution site. Export a `resolveCompletionGuard(call?, agent?): boolean` helper.

## Acceptance criteria

- [ ] `SubagentParams`, `TaskItem`, `ChainItem`, `ParallelTaskSchema`, `DynamicParallelTemplateSchema` carry `completionGuard?: boolean`
- [ ] `SequentialStep`, `ParallelTaskItem`, `DynamicParallelStep`, `DynamicParallelTemplate` carry `completionGuard?: boolean`
- [ ] `DYNAMIC_PARALLEL_KEYS` in `dynamic-fanout.ts` includes `completionGuard`
- [ ] `ParallelStepGroup`, `DynamicRunnerGroup` carry `completionGuard?: boolean`
- [ ] `RunSyncOptions` carries `completionGuard?: boolean`
- [ ] `resolveCompletionGuard(call?, agent?)` exported from `completion-guard.ts`
- [ ] `async-execution.ts` threads `completionGuard` through `buildAsyncRunnerSteps` and `executeAsyncSingle`
- [ ] `subagent-executor.ts` validates and threads `completionGuard` into chain/parallel/single/dynamic paths
- [ ] `execution.ts` and `subagent-runner.ts` use resolved value instead of raw `agent.completionGuard !== false`
- [ ] `test/unit/completion-guard-precedence.test.ts` passes: undefined→agent fallback, call=true overrides agent=false, default=true

## Verification

`node --experimental-strip-types --test test/unit/completion-guard-precedence.test.ts`

## Blocked by

None — can start immediately
