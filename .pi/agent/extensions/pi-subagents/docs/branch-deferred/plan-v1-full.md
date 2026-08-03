# Implementation Plan: `branch` step-kind (branch-on-aggregate)

**Status: PLAN ONLY — no code written. Requires review + one user decision (§0) before implementation.**

---

## §0 — BLOCKING PUSHBACK: "EXECUTION = RECURSE" fights the codebase

The confirmed design says *"execute that sub-sequence through the SAME step loop the driver already uses."*
I read both drivers. **True recursion (or mid-array splicing) is architecturally hostile here.** Evidence:

### Finding 1 — the foreground loop body is not extractable at reasonable risk
`runs/foreground/chain-execution.ts:669` `for (let stepIndex = 0; stepIndex < chainSteps.length; stepIndex++)`.
The body is ~600 lines of fully inline code (parallel branch `:674`, dynamic branch, sequential `else` `:1094`–`:1332`).
It closes over ~40 mutable/immutable locals: `prev`, `globalTaskIndex`, `progressCreated`, `outputs`, `results`,
`allProgress`, `allArtifactPaths`, `dynamicChildren`, `dynamicGroupStatuses`, `templates`, `tuiBehaviorOverrides`,
`chainDir`, `globalSemaphore`, `deadlineAt`, `foregroundControl`, `intercomEvents`, `availableModels`, `modelScope`,
`artifactConfig`, `signal`, plus ~15 `params.*` and the `makeDetailsInput` closure. Extracting `executeSteps()`
means threading all of it through a state bag — a large mechanical refactor of the exact file we must not destabilize.
That is the "dispatch-unification refactor" the parent session **explicitly dropped** as unjustified.

### Finding 2 — both drivers depend on EAGER, INDEX-KEYED pre-allocation
Branch arms are not known until runtime, but the runtime is built around knowing all steps up front:

| Pre-computed artifact | Location | Keyed by |
|---|---|---|
| `templates` (`ResolvedTemplates`) | `settings.ts:261-281`, consumed `chain-execution.ts:671` `templates[stepIndex]` | stepIndex |
| `chainAgents` | `chain-execution.ts:525-531` | stepIndex |
| `totalSteps` (`const`) | `chain-execution.ts:532` | count |
| `dynamicGroupStatuses` | `chain-execution.ts:521` | stepIndex |
| `flatSteps` / `initialFlatStepCount` | `subagent-runner.ts:1620-1621` | flat order |
| `initialStatusSteps` placeholders | `subagent-runner.ts:1623-1687` | flatIndex |
| `parallelGroups` `{start,count,stepIndex}` | `subagent-runner.ts:1622, 1628, 1652` | flatIndex + stepIndex |
| `mutatingFailureStates`, `pendingToolResults` | parallel arrays sized to flat count (`:1960-1961`) | flatIndex |
| session files / transcript paths via `nextFlatStep()` | `async-execution.ts` (`:1048` dynamic pre-allocates `maxItems`) | flat order |

**Mid-array splicing corrupts every `stepIndex`-keyed map for all subsequent steps** (notably `parallelGroups` and
`dynamicGroupStatuses`). Appending at the end (`appendRunnerStepsToStatus`, `chain-append.ts:253-282`, which only
pushes to the tail) preserves indices but **violates branch ordering** — arm steps must run *before* the following
top-level steps.

### Finding 3 — the codebase's own precedent is "grow the flat list", and only at the tail
`subagent-runner.ts:1938-1961` `consumePendingAppendRequests()` does `steps.push(...appendedSteps)` +
`appendRunnerStepsToStatus(...)` mid-`while`. So dynamic growth is established — **but tail-only**, which branch cannot use.

### RECOMMENDED ALTERNATIVE — "pre-expand both arms, gate at runtime" (Option C)

Translate **both** `then` and `else` arms into the normal flat step list up front (so every eager invariant above
still holds), and attach a **gate** to each arm step. At runtime each driver asks one shared question before
executing a step: *was my arm taken?* If not → mark `skipped`, advance, continue.

```
BranchGate = { branchId: string; arm: "then" | "else" }
```
- Condition evaluated **once per branchId** (memoized in a `Map<string, boolean>`), by the **shared**
  `evaluateBranchCondition(...)`. FG and BG cannot diverge: identical inputs, identical function, identical memo rule.
- No recursion. No splicing. No index invalidation. No 600-line extraction.
- Both drivers change by ~15 lines: a guard at the top of the loop body.

**Honest costs / deviations (user must accept):**
1. Not literally a "new step kind executed by recursion" — it is a **gate on ordinary steps**. Arms are flattened
   into the top-level step list at translate time.
2. Session files/transcript paths are pre-allocated for the **not-taken** arm (wasted, harmless, invisible).
3. Status/graph shows not-taken steps as `skipped` (arguably better UX — you see what was skipped).
4. Nested branches remain rejected in v1 (unchanged).
5. `then`/`else` arm steps are still validated with **strict output scoping** (§E) — unchanged from the design.

**Decision required:** approve Option C, or direct me to Option A (splice + repair all index maps — materially
riskier) or Option B (inline mini-driver per loop — duplicates dispatch semantics, the exact FG/BG divergence risk
the parent flagged). **Everything below assumes Option C.**

---

## §A — Ordered edit list

### (i) Types + guards

1. **`src/shared/settings.ts`** after `DynamicParallelStep` (ends `:168`), before `ParallelStep` (`:170`):
   add `BranchCountComparator`, `BranchConditionSpec`, `BranchStep`.
   ```ts
   export interface BranchCountSpec { gt?: number; gte?: number; lt?: number; lte?: number; eq?: number }
   export interface BranchSpec {
     on: string;            // prior output name
     path: string;          // JSON Pointer ("" = whole structured value)
     count?: BranchCountSpec;
     equals?: string | number | boolean;
     in?: Array<string | number | boolean>;
   }
   export interface BranchStep {
     branch: BranchSpec;
     then: ChainStep[];
     else?: ChainStep[];
     phase?: string;
     label?: string;
   }
   ```
2. **`src/shared/settings.ts:174`** extend the union:
   `export type ChainStep = SequentialStep | ParallelStep | DynamicParallelStep | BranchStep;`
   *Why this is the risky line:* `isParallelStep` (`:180`) tests `"parallel" in step`; `isDynamicParallelStep`
   (`:184`) tests `"expand" in step`. A `BranchStep` has neither, so **every existing `else`-falls-through-to-
   sequential site now receives a possible BranchStep**. Audit list in §B.
3. **`src/shared/settings.ts`** after `:186`: `export function isBranchStep(step: ChainStep): step is BranchStep`
   → `"branch" in step && "then" in step`.
4. **`src/runs/shared/parallel-utils.ts`** — **no new union member.** Instead add the gate to the three runner
   shapes: `branchGate?: BranchGate` on `RunnerSubagentStep` (`:1-48`), `ParallelStepGroup` (`:50-56`),
   `DynamicRunnerGroup` (`:58-72`); export `interface BranchGate { branchId: string; arm: "then" | "else" }`.
   `flattenSteps` (`:84-95`) needs **no change** (gates ride on existing shapes).
5. **`src/shared/settings.ts:255-281`** `resolveChainTemplates`: add an `isBranchStep` case returning `""`
   (branch itself is never a task). Arms are flattened *before* this is called (§vi), so in practice a BranchStep
   should not survive to here — return `""` defensively rather than falling into the `SequentialStep` cast at `:277`.

### (ii) Schema + validation + chain-outputs

6. **`src/extension/schemas.ts`** before `ChainItem` (`:186`): `BranchConditionSchema` (`on`, `path`, optional
   `count`/`equals`/`in`, `additionalProperties:false`).
7. **`src/extension/schemas.ts`** inside `ChainItem` (`:186-210`): add
   `branch: Type.Optional(BranchConditionSchema)`, `then: Type.Optional(Type.Array(Type.Unsafe({}), {minItems:1}))`,
   `else: Type.Optional(Type.Array(Type.Unsafe({})))`.
   **Note:** `ChainItem` is a *flattened* object (comment `:185`: "so chain steps do not need an object-shape
   anyOf/oneOf union"), `additionalProperties:false` at `:178`/end. `then`/`else` must be `Type.Unsafe({})`
   (opaque) — a self-referential `Type.Array(ChainItem)` is not expressible here and TypeBox recursion would
   change the tool schema shape. Deep validation of arms is therefore done by `chain-validation.ts` + `chain-outputs.ts`, **not** TypeBox. Flag: this is consistent with how `parallel` is handled (`:204-208` uses `Type.Unsafe` anyOf).
8. **`src/extension/chain-validation.ts`**:
   - `:26-31` import `BranchConditionSchema`; add `export const BRANCH_KEYS = allowedKeysOf(BranchConditionSchema)`.
   - `:113` inside `chain.forEach`: add a branch block — validate `step.branch` object keys, then **recurse the
     same per-step walk into `then` and `else`** (extract the existing per-step body into a local
     `validateStep(step, path)` so arms reuse it verbatim; reject a nested `branch` inside an arm).
   - `CHAIN_STEP_KEYS` (`:37`) auto-derives from `ChainItem`, so `branch`/`then`/`else` become allowed automatically
     once (7) lands — **no manual list edit** (same auto-derivation the salvage/filter commits relied on).
9. **`src/runs/shared/chain-outputs.ts`**:
   - `:16-21` `outputNamesForStep`: add `if (isBranchStep(step)) return []` — **branch contributes no top-level
     names** (strict scoping). Must come *before* the `SequentialStep` cast at `:19`.
   - `:23-27` `taskTemplatesForStep`: add `if (isBranchStep(step)) return []` — arm templates are validated
     separately in the recursive pass (`:72-83` must not see them with outer `available`).
   - `:41-87` main loop: insert a branch case (details in §E) — checks `branch.on` availability, validates the
     shape, recurses into arms with a **copy** of `available`, rejects nested branch.
   - `:1` extend the import to include `isBranchStep`, `type BranchStep`.

### (iii) Condition evaluator (shared — the FG/BG parity anchor)

10. **New file `src/runs/shared/branch.ts`**. Exports `BranchConditionError extends Error`,
    `validateBranchStepShape(step, stepIndex)`, `evaluateBranchCondition(branch, outputs): boolean`.
    Reuse `resolveJsonPointer` + `assertJsonPointer` from `./dynamic-fanout.ts` (already exported, `:106`/`:66`).
    Rationale for a new file over appending to `dynamic-fanout.ts`: branch is not fanout; `dynamic-fanout.ts` is
    already 400+ lines and owns a different concern.

### (iv) Foreground execution

11. **`chain-execution.ts:525-531`** `chainAgents`: add an `isBranchStep` case → `` `branch:${step.branch.on}` ``
    (only reachable if a branch survives flattening; see §vi ordering).
12. **`chain-execution.ts:669`** top of loop body, before `isParallelStep` (`:674`): add the **gate guard**:
    ```
    const gate = branchGateOf(step);            // reads step.branchGate
    if (gate && !armTaken(gate)) { /* record skipped, globalTaskIndex += flatCountOf(step), continue */ }
    ```
    `armTaken` memoizes via `evaluateBranchCondition` against the live `outputs` map.
13. **`chain-execution.ts`** `let branchDecisions = new Map<string, boolean>()` next to `prev`/`globalTaskIndex`
    (`:666-668`).
14. **`chain-execution.ts:1094`** the sequential `else`: add an explicit
    `if (isBranchStep(step)) { /* unreachable after flattening */ continue; }` guard **before** the
    `seqStep.agent` lookup at `:1090-1096`, so a stray BranchStep produces a clean skip rather than
    `Unknown agent: undefined`.

### (v) Background execution

15. **`subagent-runner.ts:2606-2614`** after `const step = steps[stepIndex]!`: the same gate guard as (12) —
    mark the pre-allocated `statusPayload.steps[flatIndex...]` entries `skipped`, advance `flatIndex` by the
    step's flat width, `writeStatusPayload()`, `continue`. Placement **after** `consumePendingAppendRequests()`
    (`:2611`) and after the interrupt/timeout break (`:2610`) so stop/timeout still win.
16. **`subagent-runner.ts`** `const branchDecisions = new Map<string, boolean>()` near `flatIndex`/`stepCursor` (`:2606-2607`).
17. **`src/shared/types.ts`** `RunnerStatusStep.status` union: add `"skipped"` (verify current members before
    editing; consumers in `tui/render.ts` treat unknown status as not-done, so this is additive).

### (vi) Async translator

18. **`async-execution.ts:756+`** `buildAsyncRunnerSteps`: **flatten branches before the existing map.** Add a
    pre-pass `flattenBranches(chainSteps): { steps: ChainStep[]; gates: (BranchGate|undefined)[] }` that walks
    top-level steps and, for each `BranchStep`, emits `then` steps (gate `{branchId, arm:"then"}`) followed by
    `else` steps (gate `{branchId, arm:"else"}`); `branchId` = `` `b${topLevelIndex}` ``. Then the existing
    per-step translation runs unchanged over the flattened list, attaching `branchGate` to each produced runner
    step/group. This keeps `nextFlatStep()` eager allocation valid because the flattened list is final.
19. **`chain-execution.ts`** must apply the **same** `flattenBranches` to `chainSteps` **before**
    `resolveChainTemplates` (`:572`) and before `chainAgents`/`totalSteps` (`:525-532`) — so FG and BG consume an
    identically flattened list. Put `flattenBranches` in `src/runs/shared/branch.ts` (§iii) so there is exactly
    **one** flattening implementation shared by both paths. **This is the second FG/BG parity anchor.**
    Ordering caveat: `:525-532` currently run *before* `:572`; the flatten must happen before both, i.e. right
    after the `validateChainOutputBindings` call site (`~:555-568`).

### (vii) Tests — `test/unit/branch-step.test.ts` (new)

Plus one addition to the existing `test/unit/dispatch-parity.test.ts` (§F).

---

## §B — Recursion strategy + FG/BG consistency (the central risk)

**Strategy: none — recursion is replaced by translate-time flattening + runtime gating (§0 Option C).**

Two shared anchors make FG/BG divergence structurally impossible:
1. **`flattenBranches`** (single impl, `branch.ts`) — both drivers execute the *same* flattened step list with the
   *same* gates and the same `branchId` derivation.
2. **`evaluateBranchCondition`** (single impl, `branch.ts`) — both drivers evaluate the *same* predicate against
   their `ChainOutputMap`, memoized per `branchId`. Neither driver contains any branch semantics of its own; each
   contains only "skip if gate says my arm lost".

**State each driver threads:** only `branchDecisions: Map<string, boolean>` (memo) + the existing `outputs` map.
Nothing else. No state bag, no extraction.

**Audit — sites that switch on step kind and now must tolerate/handle BranchStep:**

| Site | Current behavior | Required |
|---|---|---|
| `settings.ts:180/184` guards | `"parallel"`/`"expand"` tests | fine (branch has neither) |
| `settings.ts:264-281` `resolveChainTemplates` | casts to SequentialStep at `:277` | add branch case → `""` (edit 5) |
| `chain-execution.ts:525-531` `chainAgents` | casts at `:530` | add branch case (edit 11) |
| `chain-execution.ts:571` `hasParallelSteps` | `.some(isParallel\|\|isDynamic)` | fine (branch is neither; arms are flattened first, so an arm's parallel step IS seen) |
| `chain-execution.ts:579-600` clarify path | casts `chainSteps as SequentialStep[]` | flattening happens earlier (edit 19); clarify is gated on `!hasParallelSteps` — a branch containing parallel arms disables clarify naturally. **Residual: a branch with only sequential arms would reach the clarify UI with gates present.** Simplest correct fix: add `|| chainSteps.some(isBranchStep)` to the `hasParallelSteps` guard at `:571` → branches never clarify. Note in §G. |
| `chain-execution.ts:1094` sequential else | `Unknown agent: undefined` | defensive skip (edit 14) |
| `chain-outputs.ts:16-27` | casts at `:19`/`:26` | branch cases (edit 9) |
| `workflow-graph.ts:79-81+` | `isParallelStep`/else | receives flattened list → no branch node needed (§G) |
| `chain-append.ts:238-251` `appendWorkflowNode` | parallel/dynamic/else | unchanged (gates ride existing shapes) |
| `parallel-utils.ts:84-95` `flattenSteps` | parallel/dynamic/else | unchanged |
| `chain-serializer.ts` (`parseStepBody`/`serializeChain`) | line-based `.chain.md` keys | **out of scope**: `branch` is JSON-chain / tool-call only in v1 (like `expand`/`collect`, which `serializeChain` also omits). Note in §G. |

---

## §C — Validation rules (every throw)

`validateBranchStepShape(step, stepIndex)` in `branch.ts`, prefix `Branch chain step ${stepIndex+1}`:

1. `branch` must be a plain object → `... branch must be an object.`
2. unknown key in `branch` → `... branch does not support field '<k>'.` (allowed: `on`, `path`, `count`, `equals`, `in`)
3. `on` missing/not a string/not `/^[A-Za-z_][A-Za-z0-9_]*$/` → `... has invalid branch.on '<v>'.` (reuse `isSafeOutputName`)
4. `path` missing/not a string → `... requires string branch.path.`
5. `path` not a valid JSON Pointer → via `assertJsonPointer` (`""` allowed = whole value)
6. condition count ≠ 1 among `count`/`equals`/`in` → `... branch requires exactly one of count, equals, or in.`
7. `count` not a plain object → `... branch.count must be an object.`
8. unknown key in `count` → `... branch.count does not support field '<k>'.`
9. comparators in `count` ≠ 1 → `... branch.count requires exactly one of gt, gte, lt, lte, eq.`
10. comparator value not an integer → `... branch.count.<cmp> must be an integer.` (negatives allowed; harmless)
11. `equals` not string/number/boolean → `... branch.equals must be a scalar.`
12. `in` not an array, or empty → `... branch.in must be a non-empty array.`
13. `in` contains a non-scalar → `... branch.in must contain only scalars.`
14. `then` missing / not an array / empty → `... requires a non-empty then array.`
15. `else` present but not an array → `... branch.else must be an array.` (**empty `else: []` allowed** — see §G)
16. any arm step is itself a branch → `... does not support nested branch steps.`
17. arm steps validated recursively by the existing machinery (`chain-validation.ts` walk + `chain-outputs.ts`
    dependency pass + `validateDynamicStepShape` for dynamic arm steps).

`chain-validation.ts` (friendly, pre-TypeBox) mirrors 1–2 and 14–16 with the allowed-key/example format used at
`:70-80`, so the model gets an actionable message.

---

## §D — `evaluateBranchCondition(branch, outputs): boolean` semantics

```
entry = outputs[branch.on]
1. !entry                     -> throw BranchConditionError("Branch references unknown output '<on>'.")
2. entry.structured === undefined -> throw ("Branch requires structured output '<on>'.")
3. value = resolveJsonPointer(entry.structured, branch.path, "Branch path")
   - pointer miss throws DynamicFanoutError. For count -> propagate as BranchConditionError.
     For equals/in -> CATCH and return false (forgiving, matches filter, `dynamic-fanout.ts:133-139`).
4. count:
   - !Array.isArray(value) -> throw ("Branch count requires an array at '<path>'.")
   - n = value.length; compare gt/gte/lt/lte/eq -> boolean
5. equals: return isScalar(value) && value === branch.equals   (strict ===, no coercion)
6. in:     return isScalar(value) && branch.in.some(v => v === value)
7. non-scalar value for equals/in -> false (no throw)
```
Throws only: unknown output, missing structured, count-path-miss, count-non-array. Everything else in the
equals/in family degrades to `false`. Deliberate asymmetry: `count` is a structural assertion (a typo'd path is a
bug worth surfacing); `equals`/`in` mirror `filter`'s forgiving model.

---

## §E — chain-outputs strict-scoping algorithm

Inside `validateChainOutputBindingsWithContext` (`:41-87`), before the `hasDynamicFanoutFields` check (`:44`):

```
if (isBranchStep(step)) {
  validateBranchStepShape(step, displayStepIndex - 1)        // -> rethrow as ChainOutputValidationError
  if (!available.has(step.branch.on))
    throw ChainOutputValidationError(
      `Branch chain step ${displayStepIndex} references unknown output '${step.branch.on}'. ` +
      `Named outputs are only available after producing step/group completes.`)
  for (const arm of [step.then, step.else ?? []]) {
    if (arm.some(isBranchStep))
      throw ChainOutputValidationError(`Branch chain step ${displayStepIndex} does not support nested branch steps.`)
    validateChainOutputBindingsWithContext(arm, dynamicFanoutConfig, {
      priorOutputNames: available,          // COPY: arm sees outer outputs...
      startStepIndex: displayStepIndex - 1, // ...for readable error numbering
    })
  }
  continue;   // <-- branch adds NOTHING to `available` or `seen`
}
```
Why this is exactly strict scoping:
- `priorOutputNames: available` gives each arm read access to all outer outputs produced so far.
- The recursive call builds its **own** `available`/`seen` sets (`:38-40`), so an arm step's `as` is visible to
  **later steps in the same arm** (inner-reference OK) and dies with the call (no leak outward).
- `continue` before `:63-86` means `outputNamesForStep(branch)`/`taskTemplatesForStep(branch)` never contribute —
  reinforced by the `[]` returns in edit 9.
- **Known limitation (accepted):** duplicate `as` names *across* the two arms, or between an arm and a later
  top-level step, are not detected, because each arm validates in isolation and nothing is added to outer `seen`.
  At runtime only one arm executes, so a cross-arm duplicate is harmless; an arm-vs-later-top-level duplicate would
  let the arm's value linger in the live `outputs` map and be overwritten later. Note in §G.

---

## §F — Test plan (`test/unit/branch-step.test.ts`)

**1. `evaluateBranchCondition` truth table**
- count: `gt/gte/lt/lte/eq` × (below, equal, above) on a 3-element array — 15 assertions
- count on empty array (`length 0`) with each comparator
- `path: ""` (whole structured value is the array)
- equals: match / no-match / missing path → false / non-scalar (object, array) → false / type-strict (`"2"` vs `2`) → false
- in: match / no-match / missing → false / non-scalar → false
- throws: unknown output; `structured === undefined`; count on non-array; count on missing path
- nested pointer (`/report/failures`) resolves correctly

**2. `validateBranchStepShape` / `validateChainInput`** — one assertion per §C rule (17 throws), plus accepts:
minimal `then`-only branch; branch with `else`; each condition form; `path: ""`. Rejects: nested branch;
unknown field in `branch`; two conditions at once; two `count` comparators; empty `then`; non-array `else`;
non-integer comparator; non-scalar `in` member.

**3. `chain-outputs` strict scoping**
- producer → branch on that output: **accepted**
- branch as step 1 (no producer): **rejected** (unknown output)
- arm step references an outer output: **accepted**
- arm step 2 references arm step 1's `as`: **accepted** (inner reference)
- top-level step *after* the branch references an arm's `as`: **rejected** ← the core strict-scoping assertion
- nested branch inside `then`: **rejected**; inside `else`: **rejected**
- dynamic step inside an arm with a bad `expand`: **rejected** (recursive `validateDynamicStepShape`)

**4. `flattenBranches`** (the FG/BG parity anchor — test it directly)
- condition-true branch flattens to `[...then, ...else]` with correct gates and stable `branchId`
- no `else` → only `then` steps emitted
- gates: every `then` step gets `arm:"then"`, every `else` step `arm:"else"`, same `branchId`
- steps before/after the branch are emitted unchanged, in order
- **FG and BG parity:** assert `flattenBranches` output is referentially identical for the FG and BG call sites by
  calling it once and deep-equalling — plus a `dispatch-parity.test.ts` addition asserting that a gated step's
  skip decision (`evaluateBranchCondition` + memo) is a pure function of `(branch, outputs)`, i.e. both drivers
  must reach the same verdict. **Add to `test/unit/dispatch-parity.test.ts`** alongside the existing invariants.

**5. End-to-end — deliberately NOT via process spawning.** Consistent with the parent session's finding that full
dispatch e2e needs real `pi` children: drive the **seams**, not the drivers.
- `buildAsyncRunnerSteps`-level (or `flattenBranches`-level) assertion that a branch chain produces the expected
  flat runner-step list with gates → this *is* the BG shape contract.
- `evaluateBranchCondition` + memo map → the skip verdict for each gate.
- Composition test: given `outputs` where the condition is true, assert the set of steps whose gate passes equals
  exactly the `then` steps; flip the condition and assert it equals exactly the `else` steps; with no `else` and a
  false condition assert the passing set is empty (no-op).
This covers "condition true runs then / false runs else / absent else + false = no-op" at the semantic layer
without spawning. Genuine driver-level execution (progress files, status.json writes) stays uncovered — stated
plainly in §G.

**Expected count:** ~70-80 assertions across ~25-30 `test()` blocks. Existing 143 must stay green.

---

## §G — Open decisions / risks for sign-off

1. **§0 Option C vs recursion/splicing — the one blocking decision.**
2. **`else: []`** — allowed (treated as absent). Alternative: reject as a likely mistake. Recommend allow.
3. **`{previous}` / `prev` threading into the first arm step.** Under flattening, an arm step's `{previous}` resolves
   to whatever ran immediately before it in the flattened list — i.e. the step before the branch (correct/expected).
   But for a **false** condition with steps skipped, `prev` is simply *not updated* by skipped steps, so the step
   after the branch sees the pre-branch `prev`. Recommend this (skips are transparent to `prev`). **Confirm.**
4. **Acceptance / worktrees inside an arm.** Untouched — an arm step carries its own `acceptance`; a `worktree: true`
   parallel step inside an arm creates worktrees only if executed (gate runs before the `createWorktrees` call at
   `chain-execution.ts:687`). Verify during implementation that the gate precedes worktree creation.
5. **Graph rendering.** Under flattening there is no branch node; arm steps appear as ordinary nodes, not-taken ones
   `skipped`. No `workflow-graph.ts` change. Cosmetic improvement (a real branch node with children) deferred —
   same deferral precedent as the `/agents describe` omission for filter.
6. **`.chain.md` support deferred** — `branch` is JSON-chain/tool-call only in v1 (`chain-serializer.ts` untouched).
7. **Cross-arm duplicate `as` not detected** (§E limitation). Harmless at runtime; documented.
8. **`RunnerStatusStep.status: "skipped"`** is a new status value; TUI consumers must not treat it as failure.
   Verify `tui/render.ts` (`:666-690` counts `running`/`completed` explicitly, so `skipped` is neither done nor
   failed — acceptable, though a skipped step will make a chain look permanently "incomplete" in the
   `done/total` header). Consider counting skipped as done for display. **Flag for review.**
9. **No driver-level execution test** (§F.5) — the branch gate guards themselves (edits 12, 15) are the only
   code paths not directly asserted. Mitigated by their triviality (~15 lines each, both delegating to shared fns).
10. **`hasParallelSteps` / clarify interaction** (§B) — recommend adding `|| chainSteps.some(isBranchStep)` at
    `:571` so branch chains skip the clarify UI rather than reaching a `SequentialStep[]` cast. **Confirm.**

---

## §H — Verification commands

```bash
cd /home/james/dotfiles/.pi/agent/extensions/pi-subagents

# full unit suite (143 existing + new; expect all pass)
node --experimental-strip-types --test test/unit/*.test.ts

# new file alone
node --experimental-strip-types --test test/unit/branch-step.test.ts

# parity invariant still holds
node --experimental-strip-types --test test/unit/dispatch-parity.test.ts

# churn / hygiene (biome formatter is disabled for this dir via biome.json — diffs must be semantic only)
cd /home/james/dotfiles
git diff --stat HEAD
git diff --check
```
Plus `lsp_diagnostics` (severity=error) on every edited file: `settings.ts`, `parallel-utils.ts`, `schemas.ts`,
`chain-validation.ts`, `chain-outputs.ts`, `branch.ts`, `chain-execution.ts`, `subagent-runner.ts`,
`async-execution.ts`, `types.ts`, `branch-step.test.ts`.

**Expected diff size:** ~200-260 semantic src lines + ~350-450 test lines. If any single file's diff exceeds a few
hundred lines, stop — that signals either the formatter trap or scope creep into the dropped unification refactor.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Delivered a plan-only document (no implementation code) at .pi-subagents/artifacts/outputs/e8230b42/plan.md covering all requested deliverables A-H, grounded in real file:line references read from the repo. Scope held to the confirmed branch design; explicitly declined to widen into the dropped dispatch-unification refactor and flagged .chain.md serializer + graph-node work as deferred."
    }
  ],
  "changedFiles": [
    ".pi-subagents/artifacts/outputs/e8230b42/plan.md"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "Read/Grep over src/shared/settings.ts, runs/shared/parallel-utils.ts, runs/foreground/chain-execution.ts, runs/background/subagent-runner.ts, runs/background/async-execution.ts, runs/background/chain-append.ts, runs/shared/chain-outputs.ts, extension/schemas.ts, extension/chain-validation.ts, runs/shared/workflow-graph.ts, tui/render.ts",
      "result": "passed",
      "summary": "Mapped the ChainStep/RunnerStep unions, both driver loops, the async translator, the eager index-keyed pre-allocation sites, and every step-kind switch site."
    }
  ],
  "validationOutput": [
    "Key architectural findings: (1) foreground loop body chain-execution.ts:669 is ~600 inline lines closing over ~40 locals -> extraction == the dropped unification refactor; (2) both drivers depend on eager index-keyed pre-allocation (templates[stepIndex] settings.ts:261-281; chainAgents/totalSteps :525-532; dynamicGroupStatuses :521; initialStatusSteps/parallelGroups subagent-runner.ts:1620-1687; nextFlatStep session-file allocation in async-execution.ts) so mid-array splicing corrupts stepIndex-keyed maps; (3) the codebase's own dynamic-growth precedent, consumePendingAppendRequests subagent-runner.ts:1938-1961 + appendRunnerStepsToStatus chain-append.ts:253-282, appends TAIL-ONLY and therefore cannot express branch ordering. Conclusion: recommended 'pre-expand both arms + runtime gate' (Option C) instead of recursion, with flattenBranches and evaluateBranchCondition as the two shared FG/BG parity anchors.",
    "Also confirmed CHAIN_STEP_KEYS in chain-validation.ts:37 auto-derives from ChainItem, so no manual allow-list edit is needed for branch/then/else -- but ChainItem is a FLATTENED object (schemas.ts:185-210) so then/else must be Type.Unsafe opaque arrays and arm depth-validation must live in chain-validation.ts + chain-outputs.ts, not TypeBox."
  ],
  "residualRisks": [
    "BLOCKING: the confirmed design says 'EXECUTION = RECURSE'; the plan recommends translate-time flattening + runtime gating instead. This is a real deviation from the approved design and needs explicit user sign-off (plan section 0) before any code.",
    "Adding BranchStep to the ChainStep union means every existing 'else falls through to SequentialStep' site can now receive a BranchStep; the plan audits 12 such sites but a missed one would surface as 'Unknown agent: undefined' at runtime.",
    "New RunnerStatusStep status 'skipped' affects TUI done/total accounting (tui/render.ts:666-690) -- a skipped step may make a chain look permanently incomplete unless skipped is counted as done.",
    "Strict scoping cannot detect duplicate 'as' names across the two arms or between an arm and a later top-level step (each arm validates in isolation); harmless at runtime but undetected.",
    "No driver-level execution test: the two ~15-line gate guards in chain-execution.ts and subagent-runner.ts are the only new code paths not directly asserted, because real dispatch e2e needs process spawning (consistent with the parent session's earlier finding).",
    "Line numbers will shift as edits land; the implementer must re-verify each file:line before editing."
  ],
  "noStagedFiles": true,
  "diffSummary": "Single new untracked artifact file (the plan). No repository source files created, modified, or staged.",
  "reviewFindings": [
    "no blockers in the artifact itself; the plan's own section 0 raises one blocking DESIGN decision (recursion vs flattening+gating) that must be resolved by the user before implementation begins"
  ],
  "manualNotes": "The single most important takeaway: the approved 'recurse into the same step loop' execution strategy fights two hard architectural facts -- a 600-line inline foreground loop body, and pervasive eager index-keyed pre-allocation in both drivers plus the async translator. Mid-array splicing breaks stepIndex-keyed maps (parallelGroups, dynamicGroupStatuses); tail-append (the codebase's only dynamic-growth precedent) cannot express branch ordering. Option C (flatten both arms at translate time, gate at runtime via a shared memoized evaluateBranchCondition) preserves every existing invariant, needs ~15 lines per driver, and makes FG/BG divergence structurally impossible via two shared anchors (flattenBranches + evaluateBranchCondition). Recommend approving Option C before implementation. Secondary items needing a yes/no: empty 'else: []' allowed; skips leave 'prev' untouched; add '|| some(isBranchStep)' to the hasParallelSteps clarify guard at chain-execution.ts:571."
}
```
