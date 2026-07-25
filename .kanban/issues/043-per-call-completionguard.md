---
id: 043
title: Add per-call completionGuard override
status: blocked
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

## Blocker

Fresh review (RALPH_REVIEW: FAIL) found:

1. **Missing runner group fields** — `ParallelStepGroup` and `DynamicRunnerGroup` in `src/runs/shared/parallel-utils.ts` lack `completionGuard?: boolean`.
2. **Foreground task/step overrides ignored** — `subagent-executor.ts` and `chain-execution.ts` foreground paths pass only top-level `completionGuard`, ignoring per-task/per-step overrides.
3. **Dynamic step rejection** — `DYNAMIC_STEP_KEYS` in `dynamic-fanout.ts` omits `completionGuard`, so dynamic group-level overrides are rejected by shape validation.
4. **Async dynamic group-level not propagated** — `async-execution.ts` dynamic group path ignores `s.completionGuard` in favor of `s.parallel.completionGuard`.
5. **Formatting churn** — ~6k insertions include broad formatter noise, violating scope constraint.

Resolve all five before re-review.
