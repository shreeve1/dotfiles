# `branch` step-kind — DEFERRED

Status: **designed, reviewed twice, deliberately not built.** This directory
preserves the design + review findings so a future dedicated session does not
re-derive them.

## What branch is

A conditional chain step (branch-on-aggregate): evaluate a predicate over a
prior step's structured output, then run one of two sub-sequences.

```json
{
  "branch": { "on": "reviews", "path": "/items", "count": { "gt": 2 } },
  "then": [ /* escalate steps */ ],
  "else": [ /* auto-fix steps */ ]
}
```

Condition = exactly one of `count: {gt|gte|lt|lte|eq: N}` (array length at
`path`), `equals: <scalar>`, or `in: [<scalar>...]`. `on` names a prior
top-level output; `path` is a JSON Pointer into its structured value.

## Why it's the "expensive tier" (and filter/join/sort weren't)

`expand.filter` / `expand.join` / `expand.sort` ride the **opaque `expand`
seam**: `expand` is passed through every dispatch surface untouched
(`async-execution.ts` literally does `expand: s.expand`), and the dynamic-fanout
core is a single shared implementation both foreground and background call. So
those three needed only: type + schema + runtime allow-list + one apply-seam +
tests. No dispatch changes.

`branch` is a **new step kind** — it must be recognized and executed by BOTH
driver loops (foreground `for`-loop in `chain-execution.ts`, background
`while`-loop in `subagent-runner.ts`), which are implemented independently. That
is the divergence risk the whole "close the chain-vs-workflow gaps" effort was
worried about.

## Decision: narrowed to Option B, then deferred

Two design rounds, two independent reviews (see `plan-v1-full.md`,
`plan-v2-narrowed.md` and the review findings summarized below).

**Option B narrowing** (what plan v2 specifies) makes branch tractable by
DESIGNING OUT the hardest holes:

- Arms declare **no named outputs** (reject any arm step with `as` or
  `collect.as`). Arms are pure side-effecting steps. This makes the runtime
  output-scope leak structurally impossible.
- **No branch in append-step** (rejected at that ingress).
- **No nested branch.**

Even narrowed, review #2 returned **NO-GO** for the reasons below. The user
chose to **bank the four shipped gaps and defer branch** rather than push
through a large, risky change to vendored upstream dispatch code.

## The blockers a future session MUST solve (from review #2)

These are why branch is a major change, not a filter-style increment:

1. **Process boundary (the big one).** The background runner executes in a
   SEPARATE spawned `pi` process; its config is serialized as JSON
   (`subagent-runner.ts` `SubagentRunConfig`, `async-execution.ts` spawn config).
   A shared in-memory `conditions: Map` + shared `armTaken()` CANNOT cross that
   boundary. The condition must be serialized into each flattened arm step's
   gate as plain JSON. Every "shared evaluator keeps FG/BG identical" argument
   assumed a single process and is wrong for the background path.

2. **Dispatch index pre-allocation.** Both drivers pre-allocate structures keyed
   by step/flat index (`templates[stepIndex]`, `parallelGroups`,
   `dynamicGroupStatuses`, flat status steps, session-file slots via
   `nextFlatStep()`). Recursion / mid-array splicing corrupts these. The agreed
   direction is **compile the chain once into a flattened step list + per-step
   gates** (both arms flattened up front, untaken arm steps skipped at runtime),
   NOT recursion. But the compile must happen BEFORE graph construction +
   agent-scan in both drivers (in BG, `graphChain` is built at
   `async-execution.ts:~679`, before validation — the compile insertion point in
   plan v2 was off).

3. **Skipped-step accounting.** A new `"skipped"` status value is NOT additive
   (breaks done/total counts, TUI glyphs, graph normalization, job-tracker
   completion). Use `status:"completed"` + a `skipped?: true` marker instead. AND
   a skipped N-task parallel step needs N synthetic done-results (foreground
   render keys per flat index), not one — an off-by-N in plan v2.

4. **Dynamic arms are impossible under Option B** (a dynamic step requires
   `collect.as`, which rule 18 rejects) — so explicitly reject dynamic arm steps;
   don't try to gate them.

5. **Partial/mixed shape validation.** `then`/`else` are opaque
   `Type.Unsafe({})` arrays in the TypeBox schema, so deep validation is
   hand-written. Must reject partial branches (`{branch}` only, `{then}` only),
   branch fields mixed with `agent`/`parallel`/`expand`, and non-object arm
   elements — at every ingress (initial chain FG+BG, `parseJsonChain`).

## If you build it later

- Foreground-only branch (reject backgrounded branch chains) sidesteps blocker #1
  entirely and is the smallest viable path — consider it if async branch isn't
  needed ("Option C" from the session).
- Otherwise: serialize the condition into each gate; compile-before-graph in both
  drivers; per-child skipped results; `completed`+`skipped:true`; reject dynamic
  arms + partial/mixed shapes; add translator/config + skip-accounting unit tests
  (no process spawning needed for those seams); and split commits so no
  intermediate commit exposes a runtime-broken branch schema.

## Shipped this line of work (for context)

- `salvage` (`23564e8`), `expand.filter` (`481dcfe`), `expand.join` (`10b56db`),
  `expand.sort`/`expand.top` (`d9a8330`), FG/BG dispatch-parity characterization
  test (`b700d9b`). `loop-until` was dropped by user decision; `branch` deferred
  here.
