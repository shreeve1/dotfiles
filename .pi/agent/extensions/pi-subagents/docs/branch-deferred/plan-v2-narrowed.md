# REVISED Implementation Plan: NARROWED v1 `branch` step-kind

**Status: PLAN ONLY — no code. Supersedes `e8230b42/plan.md` (rejected by review).**
**User decision: OPTION B (narrowed branch).** Architecture direction (flatten-both-arms + runtime gate) is
inherited and CONFIRMED; recursion into the driver loops stays OFF THE TABLE.

All paths relative to `.pi/agent/extensions/pi-subagents/`. Every line number below was re-read this session.

---

## §0 — What the narrowing buys (why this plan is tractable and the last one wasn't)

| Review blocker (prior plan) | Status under Option B |
|---|---|
| #3 runtime output-scope leak via live `outputs` map | **ELIMINATED** — arms declare no outputs, so arm steps never write `outputs`. |
| #7 append-step scope surface (`subagent-executor.ts:1253-1269`) | **ELIMINATED** — branch rejected at the append ingress. |
| A gate carries no condition | **MUST STILL FIX** → §1 compiled representation. |
| B foreground can't read the gate | **MUST STILL FIX** → §1 + §4. |
| D `"skipped"` status not additive | **MUST STILL FIX** → §5 (reuse `"completed"` + marker). |
| E progress-init consumed by not-taken arm | **MUST STILL FIX** → §6. |
| F shared fns necessary-not-sufficient | **MUST STILL FIX** → §7 per-driver table. |

Because arms contribute nothing to `ChainOutputMap`, the entire "arm-local output plumbing" axis disappears:
`outputNamesForStep` needs no arm recursion, no `available`-set copying for writes, no cross-arm duplicate-`as`
analysis (the prior plan's accepted-limitation #7 is now *impossible*, not merely tolerated).

---

## §1 — THE COMPILED BRANCH REPRESENTATION (heart of the plan)

### Types (new file `src/runs/shared/branch.ts`)

```ts
export interface BranchGate { branchId: string; arm: "then" | "else" }

export interface CompiledChain {
  steps: ChainStep[];                       // flattened: branches replaced by their arm steps, in order
  gates: (BranchGate | undefined)[];        // parallel to steps; undefined = unconditional top-level step
  conditions: Map<string, BranchSpec>;      // branchId -> the condition to evaluate
}
```

**Why a parallel `gates[]` array + a `conditions` table, not a field on the step:**
1. `ChainStep` objects are user-supplied and flow into `resolveChainTemplates`, `chainAgents`, the workflow graph,
   and TypeBox-validated tool args. Mutating them to carry a gate would leak a synthetic field into the
   `additionalProperties:false` shapes and into `assertOnlyKeys` runtime allow-lists (`dynamic-fanout.ts:45-51`)
   — the exact reachability trap that bit this project twice. `gates[]` keeps user objects pristine.
2. Storing the condition ONCE per `branchId` in `conditions` (rather than copying `BranchSpec` onto every arm
   step) makes "evaluate once per branch, memoized" the natural implementation and guarantees both drivers
   evaluate byte-identical input.

### Producer — one function, both drivers

```ts
export function compileChain(steps: ChainStep[]): CompiledChain
```
Walk top-level `steps`. For each index `i`:
- not a branch → push step, push `undefined` gate.
- `isBranchStep(step)` → `branchId = \`b${i}\``; record `conditions.set(branchId, step.branch)`;
  push every `step.then[k]` with gate `{branchId, arm:"then"}`, then every `step.else?.[k]` with
  `{branchId, arm:"else"}`.

Properties: pure, no I/O, deterministic, stable ids, `steps.length === gates.length`. A chain with no branches
returns `{steps: <same order>, gates: [all undefined], conditions: empty}` — **byte-identical behavior to today**,
which is the no-regression guarantee.

### Consumer — the shared gate decision

```ts
export function armTaken(gate: BranchGate, compiled: CompiledChain,
                         outputs: ChainOutputMap, memo: Map<string, boolean>): boolean
```
Looks up `conditions.get(gate.branchId)`, evaluates `evaluateBranchCondition` **once** (memoized in `memo`),
returns `gate.arm === "then" ? verdict : !verdict`. Both drivers call exactly this — neither contains branch
semantics of its own. This plus `compileChain` are the two FG/BG parity anchors.

### How each driver consumes it

**Foreground** (`chain-execution.ts`) — must consume the *flattened* list because every eager artifact is built
from `chainSteps`. Resolves review must-fix B. Ordering is the delicate part (§4).

**Background** (`async-execution.ts` `buildAsyncRunnerSteps`) — flatten BEFORE `graphChain`/agent-scan/translation,
then attach `branchGate` to each produced runner step/group (gates ride existing runner shapes; `RunnerStep` union
gets **no new member**). Resolves must-fix C (§6).

---

## §2 — Ordered edit list

### (i) Types + guards + compiled rep

1. `src/shared/settings.ts` — after `DynamicParallelStep` (ends `:168`), before `ParallelStep` (`:170`): add
   `BranchCountSpec`, `BranchSpec`, `BranchStep { branch; then: ChainStep[]; else?: ChainStep[]; phase?; label? }`.
2. `src/shared/settings.ts:181` — extend union: `... | BranchStep`.
3. `src/shared/settings.ts` — after `isDynamicParallelStep` (`:189-191`): add
   `isBranchStep(step): step is BranchStep` → `"branch" in step && "then" in step`.
   Safe against existing guards: `isParallelStep` (`:185`) needs `"parallel"`, `isDynamicParallelStep` (`:189`)
   needs `"expand"`+`"collect"`+`"parallel"` — a BranchStep has none.
4. `src/shared/settings.ts:196-205` `getStepAgents` — add `if (isBranchStep(step)) return []` before the
   `[step.agent]` fallback at `:204`. (Defensive: after compilation no BranchStep should reach it.)
5. `src/shared/settings.ts:258-283` `resolveChainTemplates` — add `if (isBranchStep(step)) return ""` before the
   `SequentialStep` cast at `:279`. Defensive only; compilation runs first.
6. `src/runs/shared/parallel-utils.ts` — add `branchGate?: BranchGate` to `RunnerSubagentStep` (ends `:48`),
   `ParallelStepGroup` (`:50-56`), `DynamicRunnerGroup` (`:58-72`). **No `RunnerStep` union change**;
   `flattenSteps` (`:84-95`) unchanged. Import `BranchGate` type from `branch.ts`.

### (ii) Schema + friendly validation + chain-outputs + narrowing rejections

7. `src/extension/schemas.ts` — before `ChainItem` (`:186`): `BranchConditionSchema` = Object({ on: String,
   path: String, count: Optional(Object({gt,gte,lt,lte,eq: Optional(Integer)}, additionalProperties:false)),
   equals: Optional(Union([String,Number,Boolean])), in: Optional(Array(Union([String,Number,Boolean]))) },
   additionalProperties:false).
8. `src/extension/schemas.ts` inside `ChainItem` (`:186-223`): add `branch: Optional(BranchConditionSchema)`,
   `then: Optional(Array(Type.Unsafe({}), {minItems:1}))`, `else: Optional(Array(Type.Unsafe({})))`.
   `then`/`else` MUST be opaque `Type.Unsafe({})` — `ChainItem` is a flattened object (comment `:185`) and a
   self-referential array is not expressible; deep arm validation therefore lives in the handwritten validators
   (must-fix G). `CHAIN_STEP_KEYS` (`chain-validation.ts:37`) auto-derives from `ChainItem`, so no manual
   allow-list edit — same auto-derivation filter/join/sort relied on.
9. `src/extension/chain-validation.ts` — import `BranchConditionSchema`; add
   `export const BRANCH_KEYS = allowedKeysOf(BranchConditionSchema)`. Refactor the body of the existing
   `chain.forEach` (`:117-159`) into a local `validateStep(step, stepPath)` and call it for top-level steps;
   add a branch block that (a) checks `branch` object keys via `checkNoExtraKeys`, (b) **enforces the narrowing**:
   for each arm step reject `as` present, reject `collect.as` present, reject nested `branch`, (c) recurses
   `validateStep` into each arm so arm steps get the same friendly per-shape messages.
10. `src/runs/shared/chain-outputs.ts` —
    - `:16-21` `outputNamesForStep`: `if (isBranchStep(step)) return []` before the `:19` cast. **Trivially
      correct under Option B** (arms have no outputs by construction).
    - `:23-27` `taskTemplatesForStep`: `if (isBranchStep(step)) return []` (arm templates validated in the branch
      block with a correct `available` set instead).
    - `:41-87` main loop: insert the branch case (§3) before the `hasDynamicFanoutFields` check (`:44`).
    - `:1` extend import with `isBranchStep`.

### (iii) `src/runs/shared/branch.ts` (new)

11. Exports: `BranchGate`, `CompiledChain`, `BranchConditionError`, `validateBranchStepShape`,
    `evaluateBranchCondition`, `compileChain`, `armTaken`.
    Reuses exported `assertJsonPointer` (`dynamic-fanout.ts:66`) + `resolveJsonPointer` (`:106`).
    New file (not appended to `dynamic-fanout.ts`, now 400+ lines and a different concern).

### (iv) Foreground

12. `chain-execution.ts` — compile immediately AFTER `validateChainOutputBindings` (`:557-568`) and BEFORE
    `chainAgents` (`:526`). **Ordering problem (must-fix B):** `chainAgents`/`totalSteps` are currently built at
    `:526-532`, i.e. *before* validation at `:558`. Fix: move the `compileChain` call to right after validation,
    then rebuild `chainAgents`/`totalSteps`/`templates` from `compiled.steps`. Concretely — introduce
    `const compiled = compileChain(chainSteps)` after `:568`, and change `:526` `chainSteps.map(...)`,
    `:532` `totalSteps`, `:571` `hasParallelSteps`, `:572` `resolveChainTemplates(...)`, and the
    `makeDetailsInput` `chainSteps` field (`:540`) to read `compiled.steps`.
    **Constraint:** `makeDetailsInput` is referenced by the validation catch block at `:560-566`, which runs
    BEFORE compilation. Keep `chainAgents`/`totalSteps` initialized from raw `chainSteps` as today (so the
    early-error path still renders), then REASSIGN them from `compiled.steps` after compilation — i.e. change
    `const chainAgents`/`const totalSteps` to `let`, or compute the raw values into the same `let` bindings.
    This is the single subtlest edit in the plan; call it out in review.
13. `chain-execution.ts:571` `hasParallelSteps` — computed from `compiled.steps`, so a parallel step inside a
    taken arm is correctly seen. Also add `|| chainSteps.some(isBranchStep)` so a branch chain never reaches the
    clarify UI's `chainSteps as SequentialStep[]` cast (`:580`). (Open decision §9.3.)
14. `chain-execution.ts:666-668` — add `const branchMemo = new Map<string, boolean>()` beside `prev`/
    `globalTaskIndex`/`progressCreated`.
15. `chain-execution.ts:670-672` — loop over `compiled.steps`; at the top of the body (before `isParallelStep`
    at `:674`) insert the gate guard: read `compiled.gates[stepIndex]`; if present and `!armTaken(...)`, push a
    synthetic skipped result (§5), advance `globalTaskIndex` by the step's flat width (1 for sequential,
    `step.parallel.length` for parallel, 0 for dynamic — mirroring `flattenSteps` `parallel-utils.ts:84-95`),
    and `continue` **without touching `prev`** (§7).
16. `chain-execution.ts:1094` sequential `else` — add `if (isBranchStep(step)) continue;` before the
    `seqStep.agent` lookup (`:1090-1096`), so a stray BranchStep can never produce `Unknown agent: undefined`.

### (v) Background driver

17. `subagent-runner.ts:2606-2607` — add `const branchMemo = new Map<string, boolean>()` beside `flatIndex`/
    `stepCursor`.
18. `subagent-runner.ts:2613-2615` — after `const step = steps[stepIndex]!`, insert the gate guard reading
    `step.branchGate`. Placement is AFTER the interrupt/timeout break (`:2610`) and AFTER
    `consumePendingAppendRequests()` (`:2611`) so stop/timeout/append still win. On skip: mark the pre-allocated
    `statusPayload.steps[flatIndex … +width]` entries per §5, advance `flatIndex` by width, `writeStatusPayload()`,
    `continue` — leaving `previousOutput` untouched (§7).

### (vi) Async translator — flatten ordering + progress-init

19. `async-execution.ts` — compile BEFORE `graphChain` (`:679`), the graph snapshot (`:715-719`), and the
    agent-scan (`:721-732`). The agent-scan's `else` casts to `SequentialStep` and reads `.agent` (`:726`), so a
    raw BranchStep reaching it yields `Unknown agent: undefined` — exactly must-fix C. Insertion point: after the
    `validateChainOutputBindings` block (`:704-714`), before `:715`. Then `graphChain` (`:679`, and its reuse at
    `:1150` `eventChain`) and the per-step translation loop all consume `compiled.steps`.
20. **Progress-init fix (must-fix E)** — see §6. The translator mutates `progressInstructionCreated` while
    building EVERY step (`:734`, `:833-834`, `:983-990`, `:1042-1045`), so a not-taken arm would consume
    "first progress agent" and precreate progress artifacts at *translate* time, before any condition is known.

### (vii) Append-step rejection (narrowing constraint 2)

21. `src/runs/foreground/subagent-executor.ts:1262-1269` — before the
    `validateChainOutputBindingsWithContext(input.params.chain, ...)` call, reject any submitted step where
    `isBranchStep(step)` with: `Cannot append step to run '<id>': branch steps are not supported in append-step.`
    Rationale: append-step's whole contract is tail-append (`chain-append.ts:253-282`), and a branch's arms would
    need gates + a condition evaluated against a *live* run's outputs — precisely the surface Option B removes.
22. Also reject in `chain-validation.ts`'s friendly walk? **No** — `validateChainInput` is shared by the initial
    chain (legitimate) and cannot distinguish ingress. Rejection belongs at the append ingress only (21).

### (viii) Tests

23. New `test/unit/branch-step.test.ts`; plus additions to `test/unit/dispatch-parity.test.ts` (§7).

---

## §3 — chain-outputs branch case (must-fix G, dependency walk)

Inside `validateChainOutputBindingsWithContext` (`:41-87`), before `hasDynamicFanoutFields` (`:44`):

```
if (isBranchStep(step)) {
  validateBranchStepShape(step, displayStepIndex - 1)     // rethrow BranchConditionError as ChainOutputValidationError
  if (!available.has(step.branch.on))
    throw new ChainOutputValidationError(
      `Branch chain step ${displayStepIndex} references unknown output '${step.branch.on}'. ` +
      `Named outputs are only available after producing step/group completes.`)
  for (const arm of [step.then, step.else ?? []]) {
    validateChainOutputBindingsWithContext(arm, dynamicFanoutConfig, {
      priorOutputNames: available,           // arms READ outer outputs
      startStepIndex: displayStepIndex - 1,
    })
  }
  continue;                                  // contributes NOTHING to available/seen
}
```
- Arm steps may reference outer outputs (`{outputs.x}`, `expand.from.output`, `join[].output`) because
  `priorOutputNames: available` seeds the recursive call (`:38-40`).
- Arm steps declaring outputs are already rejected by `validateBranchStepShape` (§4 rules 17-18), so the
  recursive call's own `seen` set is vestigial — belt-and-braces, and it still validates arm *references* and
  arm dynamic shapes (`validateDynamicStepShape`) for free.
- `continue` before `:63-86` means branch adds no names and no templates. Combined with the `[]` returns in
  edit 10, arm outputs can never leak to later top-level steps — the leak is structurally impossible, not
  merely unvalidated.
- Nested branch is rejected by `validateBranchStepShape` before recursion.

**Ingress coverage:** initial chain reaches this via `chain-execution.ts:558` (FG) and
`async-execution.ts:706` (BG). Append path is rejected outright (edit 21). `parseJsonChain`
(`chain-serializer.ts:213`) also calls `validateChainOutputBindings`, so `.chain.md`/JSON-chain files get the
same validation — though `branch` is JSON-chain/tool-call only in v1 (`serializeChain` untouched; §9.5).

---

## §4 — `validateBranchStepShape` + narrowing rejections (every throw)

In `branch.ts`, prefix `Branch chain step ${stepIndex+1}`, throwing `BranchConditionError`:

1. `branch` not a plain object → `... branch must be an object.`
2. unknown key in `branch` → `... branch does not support field '<k>'.` (allowed: on, path, count, equals, in)
3. `on` missing / not a string / fails `isSafeOutputName` → `... has invalid branch.on '<v>'.`
4. `path` missing / not a string → `... requires string branch.path.`
5. `path` invalid JSON Pointer → via `assertJsonPointer` (`""` allowed = whole structured value)
6. count of present conditions among `count`/`equals`/`in` ≠ 1 → `... branch requires exactly one of count, equals, or in.`
7. `count` not a plain object → `... branch.count must be an object.`
8. unknown key in `count` → `... branch.count does not support field '<k>'.`
9. comparators present in `count` ≠ 1 → `... branch.count requires exactly one of gt, gte, lt, lte, eq.`
10. comparator value not an integer → `... branch.count.<cmp> must be an integer.`
11. `equals` not scalar → `... branch.equals must be a scalar.`
12. `in` not an array / empty → `... branch.in must be a non-empty array.`
13. `in` contains a non-scalar → `... branch.in must contain only scalars.`
14. `then` missing / not an array / empty → `... requires a non-empty then array.`
15. `else` present but not an array → `... branch.else must be an array.` (empty `else: []` allowed ≡ absent)
16. **nested branch** — any arm step with `isBranchStep` → `... does not support nested branch steps.`
17. **NARROWING: arm declares `as`** — any arm step (sequential, or any element of a `parallel` array) with a
    non-undefined `as` → `... branch arm steps cannot declare named outputs (found as: '<v>').`
18. **NARROWING: arm declares `collect.as`** — any arm step with `collect?.as` →
    `... branch arm steps cannot declare named outputs (found collect.as: '<v>').`

Rules 17-18 are what make the whole plan tractable — they must be enforced in BOTH
`validateBranchStepShape` (authoritative) and `chain-validation.ts`'s friendly walk (actionable message).

---

## §5 — Status marker decision (must-fix D) — CONCRETE

**Decision: do NOT add a `"skipped"` status value. Use `status: "completed"` + a separate `skipped?: true` marker.**

Evidence that `"skipped"` is not additive (all re-read this session):

| Consumer | Line | Behavior with an unknown status |
|---|---|---|
| `shared/status-format.ts` `aggregateStepStatus` | `:39-46` | `every(isCompletedStepStatus)` → job **never** reports `complete` |
| `async-job-tracker.ts` `completedSteps` | `:101` | counts only `complete`/`completed` → done-count too low forever |
| `tui/render.ts` parallel done-count | `:650` | `filter(=== "completed")` → header stuck below total |
| `tui/render.ts` chain done-count | `:686-700` | needs a result passing `isDoneResult` per flat index → chain permanently incomplete |
| `tui/render.ts` glyph/label | `:409`, `:418` | falls through to non-success glyph |
| `subagent-runner.ts` graph normalize | `:1764-1768` | unknown → `"pending"` → node stuck pending |

**Fields:**
- Background: `statusPayload.steps[flatIndex] = { ...placeholder, status: "completed", skipped: true }`.
  Add `skipped?: boolean` to the step shape in `src/shared/types.ts:868-875` (the `steps?: Array<{...}>` literal;
  `status` union at `:874` is **unchanged**).
- Foreground: push a synthetic `SingleResult`-shaped entry with `exitCode: 0` and `skipped: true`. `isDoneResult`
  (`render.ts:555-561`) returns true on `exitCode === 0`, so done-counts stay correct with **zero render.ts edits**.
  Add `skipped?: boolean` to `SingleResult` (`src/shared/types.ts`).

**Why counts stay correct:** every consumer above keys off `"completed"`/`exitCode === 0`, all of which hold.
`aggregateStepStatus` still reaches `complete`. Graph normalize maps `"completed"` → `"completed"`.
Nothing treats it as failed (no `error`, `exitCode: 0`).

**Rendering the marker:** optional and cheap — `render.ts:418` label could append `" (skipped)"` when
`skipped === true`. Recommend deferring even this (§9.4): zero render.ts edits = zero blast radius. The marker is
present in `status.json`/details for anyone who needs it.

---

## §6 — Progress-init fix (must-fix E) — CONCRETE

**The risk, precisely.** `buildAsyncRunnerSteps` translates ALL steps up front. `progressInstructionCreated`
(`async-execution.ts:734`) is a translate-time mutable latch:
- `:833-834` — `isFirstProgressAgent = behavior.progress && !progressPrecreated && !progressInstructionCreated`,
  then `if (behavior.progress) progressInstructionCreated = true`. The *first* progress-enabled step gets the
  "create the progress file" instruction.
- `:983-990` / `:1042-1045` — parallel/sequential paths additionally CALL `writeInitialProgressFile(...)` at
  translate time and set the latch.

Since both arms are flattened and translated, a **not-taken** arm step that has `progress: true` and sorts before
the taken arm would (a) consume `isFirstProgressAgent`, leaving the actually-executed step without the
create-the-file instruction, and (b) physically precreate a progress artifact for a step that never runs.

**Fix (translate-time, no runtime dependency):** compute progress-init over **gate-free steps only**, and treat
arm steps as never-first. Concretely: in the translation loop, when a step's gate is defined, pass
`progressPrecreated = true` and do NOT mutate `progressInstructionCreated`, and skip the
`writeInitialProgressFile` calls at `:986-989` / `:1043-1045`. Effect: arm steps never claim first-progress and
never precreate artifacts; the latch reflects only unconditional steps.

**Accepted consequence (state plainly):** if a branch arm is the ONLY progress-enabled step in a chain, no
progress file is precreated and its progress output is not surfaced. This is a deliberate v1 limitation — the
alternative (defer progress-init to runtime) means restructuring the translate-time latch, which is out of
scope for a narrowed v1. Document in §9.

---

## §7 — FG/BG parity (must-fix F) — per-driver skipped-step handling

Shared `compileChain` + `armTaken` + `evaluateBranchCondition` are **necessary not sufficient**. Each driver must
handle four things with identical *intent*:

| # | Concern | Foreground (`chain-execution.ts`) | Background (`subagent-runner.ts`) |
|---|---|---|---|
| a | index advancement | `globalTaskIndex += width` (1 / `parallel.length` / 0-for-dynamic) | `flatIndex += width` (same widths, mirroring `flattenSteps` `parallel-utils.ts:84-95`) |
| b | `prev` / `{previous}` | do NOT assign `prev` (`:1329` untouched) | do NOT assign `previousOutput` (`:3393` untouched) |
| c | results/status entry | push synthetic result `{exitCode:0, skipped:true}` (§5) | set `statusPayload.steps[flatIndex…]` `status:"completed", skipped:true` + `writeStatusPayload()` |
| d | status write | via `makeDetailsInput` on next render | explicit `writeStatusPayload()` before `continue` |

**Rule (b) is the semantic contract:** skips are transparent to `{previous}` — the step after a branch sees the
pre-branch output. Both drivers must implement it by *omission*, which is easy to get wrong by copy-paste.

**Width helper:** put `flatWidthOf(step)` in `branch.ts` (shared) so (a) cannot diverge. It must mirror
`flattenSteps` exactly: parallel group → `parallel.length`; dynamic group → `0`; sequential → `1`.

**dispatch-parity.test.ts additions:**
1. `armTaken` is a pure function of `(gate, conditions, outputs)` — same inputs → same verdict, asserted for both
   arms of a true and a false condition (this is the "both drivers must agree" invariant, testable without drivers).
2. `flatWidthOf` returns identical widths for sequential/parallel/dynamic shapes — pinning that (a) cannot drift
   between drivers.
3. `compileChain` is deterministic: called twice on the same input → deep-equal `steps`/`gates`/`conditions`.

---

## §8 — `evaluateBranchCondition(branch, outputs): boolean` semantics + every throw

```
entry = outputs[branch.on]
1. !entry                          -> throw BranchConditionError(`Branch references unknown output '<on>'.`)
2. entry.structured === undefined  -> throw BranchConditionError(`Branch requires structured output '<on>'.`)
3. resolve value = resolveJsonPointer(entry.structured, branch.path, "Branch path")
     - count family: a pointer miss PROPAGATES as BranchConditionError
     - equals/in family: pointer miss is CAUGHT -> return false
4. count:
     !Array.isArray(value) -> throw BranchConditionError(`Branch count requires an array at '<path>'.`)
     n = value.length; apply the single comparator (gt|gte|lt|lte|eq) -> boolean
5. equals: return isScalar(value) && value === branch.equals        // strict, no coercion ("2" !== 2)
6. in:     return isScalar(value) && branch.in.some(v => v === value)
7. non-scalar value under equals/in -> false (no throw)
```
**Throws (exactly 4):** unknown output; missing structured; count pointer-miss; count non-array.
Everything else degrades to `false`.

**Deliberate asymmetry, stated:** `count` is a structural assertion (a typo'd path or wrong type is a bug worth
surfacing loudly); `equals`/`in` mirror `evaluateDynamicFilter`'s forgiving model (`dynamic-fanout.ts:133-144`)
where a missing path simply doesn't match. This is consistent with the filter precedent shipped in `481dcfe`.

---

## §9 — Open decisions / risks for sign-off

1. **Edit 12's initialization dance** — `chainAgents`/`totalSteps` are built at `:526-532` but validation (whose
   error path renders via `makeDetailsInput`) is at `:558`, and compilation must sit between them. Plan: keep raw
   initialization for the error path, then reassign from `compiled.steps` (`const`→`let`). This is the subtlest
   edit; a reviewer should check it specifically.
2. **`else: []`** allowed, treated as absent. (Alternative: reject as likely-mistake.) Recommend allow.
3. **Clarify guard** — recommend `hasParallelSteps || chainSteps.some(isBranchStep)` at `:571` so branch chains
   skip the clarify UI rather than hitting the `SequentialStep[]` cast at `:580`. Confirm.
4. **Skipped rendering** — recommend NO render.ts edit in v1 (marker lives in status/details only). Confirm.
5. **`.chain.md` deferred** — `branch` is JSON-chain/tool-call only; `chain-serializer.ts` untouched (same
   precedent as `expand`/`collect`, which `serializeChain` also omits).
6. **Workflow graph** — no branch node; arm steps appear as ordinary nodes (not-taken ones show completed+skipped).
   No `workflow-graph.ts` change. Cosmetic improvement deferred.
7. **Progress-init limitation** (§6) — a branch arm that is the only progress-enabled step gets no progress file.
8. **Wasted pre-allocation** — session files/transcript paths are allocated for the not-taken arm (harmless,
   invisible, same as the prior plan).
9. **No driver-level execution test** — the two gate guards (edits 15, 18) are the only new paths not directly
   asserted, because real dispatch e2e needs process spawning (the parent session's confirmed finding). Mitigated
   by keeping each guard ~15 lines delegating to shared, tested functions.
10. **Line numbers will shift** as edits land; re-verify each `file:line` before editing.

---

## §10 — Test plan

**New `test/unit/branch-step.test.ts`**

1. `evaluateBranchCondition` truth table — count `gt/gte/lt/lte/eq` × (below/equal/above) on a 3-element array
   (15); count on empty array; `path: ""` (whole value is the array); nested pointer `/report/failures`;
   equals match/no-match/type-strict(`"2"` vs `2`)/missing→false/non-scalar→false; in match/no-match/missing→false;
   the 4 throws (unknown output, missing structured, count non-array, count pointer-miss). **~30 assertions.**
2. `validateBranchStepShape` — one per rule 1-18 (§4), incl. **arm-`as` reject**, **arm-`collect.as` reject**
   (both sequential and inside a `parallel` array), **nested-branch reject**; plus accepts: minimal then-only,
   with `else`, each condition form, `path: ""`, `else: []`. **~26 assertions.**
3. `validateChainInput` friendly walk — branch accepted; unknown key in `branch` rejected; arm with `as` rejected;
   arm with `collect.as` rejected; nested branch rejected; arm step's own bad shape reported with arm path. **~7.**
4. `compileChain` — no-branch chain is identity (gates all undefined) ← the no-regression assertion;
   then+else flattening order and gate assignment; no-`else` case; stable `branchId` across calls; determinism
   (deep-equal on repeat); `steps.length === gates.length`; steps before/after preserved in order. **~12.**
5. `armTaken` + memo — true condition → then-gates pass / else-gates fail; false → inverse; absent `else` +
   false → **no gate passes** (no-op branch); condition evaluated once per branchId (memo hit assertion via a
   counting spy on `outputs` access or by asserting `memo.size === 1` after N gates). **~8.**
6. `flatWidthOf` — sequential 1, parallel N, dynamic 0. **~3.**
7. `chain-outputs` — producer→branch accepted; branch as step 1 rejected (unknown output); arm referencing an
   outer output accepted; arm declaring `as` rejected; nested branch rejected; dynamic arm step with bad `expand`
   rejected; **top-level step after the branch referencing an arm name rejected** (unknown output — proves
   strict scoping); branch contributes no names (a later step may reuse a name freely). **~9.**
8. Append-step rejection — a branch submitted to the append path is rejected with the append-specific message. **~2.**

**`test/unit/dispatch-parity.test.ts`** — the 3 additions in §7. **~5 assertions.**

**Total: ~100 assertions across ~30-34 `test()` blocks.** Existing **143 must stay green**.

**No-spawn compliance:** every test drives pure exported seams (`compileChain`, `armTaken`,
`evaluateBranchCondition`, `flatWidthOf`, `validateBranchStepShape`, `validateChainInput`,
`validateChainOutputBindings`) — consistent with the session's finding that real dispatch e2e requires spawning
child `pi` processes. The gate guards themselves remain covered only indirectly (§9.9).

---

## §11 — Honest diff-size estimate

The review called 200-260 src lines implausible for the FULL branch. For the **narrowed** version:

| Area | Est. semantic src lines |
|---|---|
| (i) types + guards + `parallel-utils` gate fields | 35-45 |
| (ii) schema + friendly validation (incl. `validateStep` extraction + narrowing rejects) | 70-90 |
| (iii) `branch.ts` (validate + evaluate + compile + armTaken + flatWidthOf) | 130-170 |
| (iv) foreground (compile ordering + gate guard + defensive guards) | 45-60 |
| (v) background driver gate guard + status marker | 30-40 |
| (vi) async translator flatten ordering + progress-init fix | 30-45 |
| (vii) append rejection | 8-12 |
| **src total** | **~350-460** |
| tests (new file + parity additions) | ~450-550 |

**~350-460 semantic src lines + ~450-550 test lines** — roughly 1.7× the prior plan's estimate, and still the
largest change of this session by a wide margin (filter 41, join 83, sort 61 src lines in `dynamic-fanout.ts`).
The narrowing removed the *correctness holes*, not the *breadth*: branch still touches 9 source files across both
dispatch surfaces. If any single file's diff explodes into thousands of reflow lines, STOP — that's the biome
formatter trap (`biome.json` should prevent it).

**Recommended commit split** (do NOT land as one commit):
1. `branch.ts` + types + guards + schema + validation + narrowing rejections + all unit tests **except** driver
   gates (fully testable, zero dispatch risk).
2. Async translator flatten ordering + progress-init fix + BG gate guard + status marker.
3. Foreground compile ordering + gate guard.
Each independently reviewed. If (1) reveals the design is wrong, (2)/(3) were never written.

---

## §12 — Verification commands

```bash
cd /home/james/dotfiles/.pi/agent/extensions/pi-subagents
node --experimental-strip-types --test test/unit/*.test.ts          # 143 existing + new, all pass
node --experimental-strip-types --test test/unit/branch-step.test.ts
node --experimental-strip-types --test test/unit/dispatch-parity.test.ts
cd /home/james/dotfiles && git diff --stat HEAD && git diff --check   # semantic lines only
```
Plus `lsp_diagnostics` (severity=error) on: `settings.ts`, `parallel-utils.ts`, `schemas.ts`,
`chain-validation.ts`, `chain-outputs.ts`, `branch.ts`, `chain-execution.ts`, `subagent-runner.ts`,
`async-execution.ts`, `types.ts`, `subagent-executor.ts`, `branch-step.test.ts`.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Plan-only document (no implementation code) at .pi-subagents/artifacts/outputs/036ce63b/plan.md covering all 10 requested deliverables, scoped EXACTLY to the user's Option B narrowing. Every review must-fix (A-G) addressed explicitly with re-read file:line evidence. No source files touched; scope not widened (explicitly deferred .chain.md serializer, graph branch-node, and skipped-status rendering)."
    }
  ],
  "changedFiles": [
    ".pi-subagents/artifacts/outputs/036ce63b/plan.md"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "Read/Grep over settings.ts:150-295, chain-execution.ts:505-585, async-execution.ts:700-760, subagent-runner.ts:1740-1768+2594-2626, parallel-utils.ts:44-99, chain-outputs.ts, chain-validation.ts, schemas.ts, tui/render.ts:548-700, shared/status-format.ts:20-46, async-job-tracker.ts:92-108, shared/types.ts:860-890, subagent-executor.ts:1240-1280",
      "result": "passed",
      "summary": "Re-verified every seam the plan depends on, including all six status-consumer sites that make a new 'skipped' status non-additive."
    }
  ],
  "validationOutput": [
    "Must-fix D resolved with hard evidence: status-format.ts:39-46 aggregateStepStatus requires EVERY step to be complete/completed (a 'skipped' value => job never completes); async-job-tracker.ts:101 completedSteps counts only complete/completed; render.ts:650 and :686-700 count done only via 'completed' or isDoneResult; subagent-runner.ts:1764-1768 normalizes unknown status to 'pending'. Decision: reuse status 'completed' + a separate skipped:true marker => ZERO render.ts edits, all counts stay correct, nothing counts as failed (render.ts:555-561 isDoneResult returns true on exitCode===0).",
    "Must-fix B resolved: chain-execution.ts builds chainAgents/totalSteps at :526-532 BEFORE validateChainOutputBindings at :558 and resolveChainTemplates at :572. Compilation must sit after validation but its results must feed :526-532, so those bindings become 'let' and are reassigned from compiled.steps (flagged as the subtlest edit in the plan, open decision 9.1).",
    "Must-fix C resolved: async-execution.ts graphChain :679, graph snapshot :715-719, agent-scan :721-732 (whose else-branch casts to SequentialStep and reads .agent at :726 => raw BranchStep yields 'Unknown agent: undefined'). Flatten insertion point specified as after the validate block :704-714, before :715.",
    "Must-fix E resolved: progressInstructionCreated is a TRANSLATE-TIME latch (async-execution.ts:734, 833-834, 983-990, 1042-1045) that also physically calls writeInitialProgressFile, so a not-taken arm would consume first-progress-agent and precreate artifacts. Fix: gated steps pass progressPrecreated=true, never mutate the latch, and skip the writeInitialProgressFile calls; accepted limitation documented.",
    "Narrowing constraints 1-2 grounded: arm-output rejection rules (17-18) enforced in both validateBranchStepShape and the friendly walk; append rejection sited exactly at subagent-executor.ts:1262-1269 before validateChainOutputBindingsWithContext. Because arms declare no outputs, the prior plan's accepted cross-arm duplicate-'as' limitation becomes structurally impossible rather than merely tolerated."
  ],
  "residualRisks": [
    "Diff estimate is ~350-460 semantic src lines + ~450-550 test lines -- roughly 1.7x the prior (rejected) plan's estimate and by far the largest change of this session. The narrowing removed the correctness holes, not the breadth: 9 source files across both dispatch surfaces. The user should re-confirm appetite against this honest number.",
    "Edit 12 (foreground compile ordering, const->let reassignment of chainAgents/totalSteps around the validation error path) is the subtlest change in the plan and the most likely place to introduce a regression; called out for specific reviewer attention.",
    "The two gate guards (foreground and background) remain the only new code paths not directly asserted by tests, because real dispatch e2e requires spawning child pi processes. Mitigated by keeping each ~15 lines delegating to shared tested functions, plus the dispatch-parity additions that pin armTaken/flatWidthOf/compileChain purity.",
    "Progress-init limitation accepted: a branch arm that is the only progress-enabled step in a chain gets no precreated progress file.",
    "Adding BranchStep to the ChainStep union means existing 'else falls through to SequentialStep' sites can receive a BranchStep; the plan adds defensive guards at settings.ts getStepAgents/resolveChainTemplates, chain-execution.ts:1094, and relies on compilation running before all of them, but a missed site would surface as 'Unknown agent: undefined'.",
    "Line numbers will shift as edits land; re-verify before each edit."
  ],
  "noStagedFiles": true,
  "diffSummary": "Single new untracked artifact file (the revised plan). No repository source files created, modified, or staged.",
  "reviewFindings": [
    "no blockers in the artifact itself",
    "plan-internal: open decision 9.1 (foreground const->let initialization dance around the validation error path) needs explicit reviewer sign-off before implementation",
    "plan-internal: open decisions 9.2 (else:[] allowed), 9.3 (clarify guard), 9.4 (no render.ts edit for the skipped marker) need a yes/no from the user"
  ],
  "manualNotes": "Key structural insight the narrowing delivers: because arm steps cannot declare named outputs, branch contributes NOTHING to the ChainOutputMap, which turns the prior plan's hardest problem (runtime output-scope leak, review blocker #3) from 'accepted limitation' into 'structurally impossible'. That collapses the chain-outputs work to two [] returns plus a recursive read-only reference check. The two things the narrowing does NOT fix, and which dominate the remaining risk, are (a) the compiled-representation ordering in the foreground driver (must-fix B, open decision 9.1) and (b) the translate-time progress latch (must-fix E). Recommend the 3-commit split in section 11 so commit 1 (branch.ts + validation + all pure-seam tests, zero dispatch risk) can be reviewed and landed before any driver code is written -- if the design is wrong, commits 2-3 are never authored."
}
```
