# PAI Token Reduction Implementation Plan

## Overview

Implement token reduction for the OpenCode/PAI harness without weakening Algorithm reliability, ISA/ISC discipline, verification evidence, or safety confirmations.

Core rule: shrink always-loaded context first, then compact user-facing output. Do not compress cognition, ISAs, criteria, evidence, code, commands, errors, or safety-critical confirmations.

## Goals

- Reduce always-loaded prompt/context tokens across normal OpenCode sessions.
- Keep mandatory Algorithm behavior intact: phase labels, fixed close block, ISA, ISCs, tier gates, verification evidence.
- Move rarely used catalogs and long examples to on-demand files.
- Add a compact output policy that shortens prose only where safe.
- Add measurement so future prompt bloat is visible.

## Non-Goals

- Do not implement caveman grammar globally.
- Do not change ISA schema or ISC rules in the first pass.
- Do not change router classification, permissions, or ISA sync as part of this plan.
- Do not remove safety confirmations or destructive-action warnings.
- Do not compress memory files or Algorithm doctrine source text automatically.

## Design Principles

- Safety and Algorithm schema outrank brevity.
- One source of truth per rule; pointers beat duplicate prose.
- Invariants stay loaded; catalogs move on demand.
- Compact output affects final/user prose, not artifacts or evidence.
- Every reduction has a verification probe.

## Phase 1: Measure Current Token Surface

### Tasks

- [x] [1.1] Create a token-budget inspection script under `scripts/pai/` that reports approximate token/word/line counts for always-loaded prompt files.
- [x] [1.2] Include at least `~/.config/opencode/AGENTS.md`, `~/.config/opencode/modes/*.md`, `~/.pai/PAI/AISTEERINGRULES.md`, and `~/.pai/PAI/USER/AISTEERINGRULES.md`.
- [x] [1.3] Add duplicate phrase/heading detection for obvious repeated doctrine across loaded files.
- [x] [1.4] Produce before metrics and store them under `artifacts/token-budget/`.
- [ ] [1.5] Enumerate active loaded surfaces from OpenCode config, including `instructions[]`, mode files, global `AGENTS.md`, and plugin/runtime prompt append surfaces.

### Acceptance Criteria

- [x] [A1.1] Running the script prints per-file and total counts.
- [x] [A1.2] Running the script identifies the largest loaded files by count.
- [x] [A1.3] Output includes repeated headings or repeated high-frequency rule phrases.
- [x] [A1.4] A before snapshot exists and can be compared later.
- [ ] [A1.5] A surface inventory explains why each always-loaded file is included or excluded from token counting.

### Tests

- [x] [T1.1] Run token-budget script and verify non-empty per-file rows.
- [x] [T1.2] Verify `AGENTS.md` appears in the report.
- [x] [T1.3] Verify output artifact exists under `artifacts/token-budget/`.
- [ ] [T1.4] Verify token-budget inventory against `.config/opencode/opencode.json` and active plugin prompt append behavior.

## Phase 2: Split On-Demand Catalogs From Invariants

### Tasks

- [x] [2.1] Extract the long subagent delegation matrix from `~/.config/opencode/AGENTS.md` into an on-demand reference file.
- [x] [2.2] Keep a short force-loaded delegation invariant in `AGENTS.md`: delegate when work exceeds quick local search; subagents need complete prompts; parallelize independent work.
- [x] [2.3] Replace the long matrix with a pointer to the reference file and the `Task` tool rule.
- [x] [2.4] Do not move safety, git, remote-system, identity, Algorithm, or verification rules.

### Acceptance Criteria

- [x] [A2.1] `AGENTS.md` still contains the core delegation rules.
- [x] [A2.2] The full agent catalog exists in the on-demand reference.
- [x] [A2.3] `AGENTS.md` no longer contains the full long table.
- [x] [A2.4] Safety and verification rules remain force-loaded.

### Tests

- [x] [T2.1] Grep `AGENTS.md` for core delegation invariants.
- [x] [T2.2] Grep on-demand reference for representative agents like `forge`, `validator`, and `browser-qa`.
- [x] [T2.3] Re-run token-budget script and compare count reduction.

## Phase 3: Deduplicate Doctrine Across Loaded Files

### Tasks

- [x] [3.1] Compare `AGENTS.md`, mode files, Algorithm doctrine, and steering files for repeated mode-format and Algorithm rules.
- [x] [3.2] Keep canonical Algorithm rules in `~/.pai/PAI/Algorithm/v6.3.0.md` and minimal mode wrapper rules in `~/.config/opencode/modes/algorithm.md`.
- [x] [3.3] Replace duplicate prose in `AGENTS.md` with short source-of-truth pointers where safe.
- [x] [3.4] Preserve OpenCode-specific runtime facts that are not present elsewhere.

### Acceptance Criteria

- [x] [A3.1] Each removed rule has a source-of-truth location still loaded or explicitly referenced.
- [x] [A3.2] `AGENTS.md` still defines MINIMAL/NATIVE/ALGORITHM response formats or points to their active mode files.
- [x] [A3.3] Algorithm hard gates remain discoverable from loaded context.
- [x] [A3.4] Token-budget report shows lower duplicate phrase count.

### Tests

- [x] [T3.1] Grep for Algorithm hard gates in the canonical doctrine.
- [x] [T3.2] Grep `AGENTS.md` for source-of-truth pointers.
- [x] [T3.3] Run token-budget script before/after comparison.

## Phase 4: Add Compact Output Policy

### Tasks

- [x] [4.1] Add a single compact-output policy in the smallest active steering surface.
- [x] [4.2] Define modes: `compact`, `normal`, `expanded`.
- [x] [4.3] Define precedence: safety/Algorithm schema > exact strings > evidence > compact policy > user preference.
- [x] [4.4] Add auto-expand exceptions: destructive actions, security, infra, credentials, migrations, data loss, ambiguity, multi-step procedure clarity.
- [4.5] Default James sessions to compact only after Phase 1-3 reductions are verified.

### Acceptance Criteria

- [ ] [A4.1] Compact policy explicitly forbids compressing ISA, ISCs, evidence, code, commands, errors, file paths, and safety confirmations.
- [ ] [A4.2] Algorithm output format remains mandatory.
- [ ] [A4.3] Compact mode shortens prose inside allowed fields only.
- [ ] [A4.4] Invalid or absent verbosity setting falls back to `normal` or current behavior.

### Tests

- [T4.1] Ask for a compact Algorithm response and verify all seven phase labels remain.
- [T4.2] Ask for a destructive command and verify explicit confirmation language remains expanded.
- [T4.3] Ask for a code/error explanation and verify exact strings are preserved.
- [T4.4] Ask an ambiguous request and verify PAI asks a clear clarifying question.

## Phase 5: Optional Runtime Toggle

### Tasks

- [x] [5.1] Decide whether `PAI_VERBOSITY` is enough or whether a small OpenCode plugin/state file is needed.
- [x] [5.2] If needed, add a minimal plugin state file such as `~/.config/opencode/.pai-verbosity`.
- [DEFERRED] [5.3] Add prompt append reinforcement only when the active mode is non-default. Deferred until policy-only compactness proves insufficient; prompt append is out of scope for this first pass.
- [x] [5.4] Keep plugin behavior advisory; do not let it override Algorithm or safety rules.

### Acceptance Criteria

- [x] [A5.1] Verbosity mode is inspectable from a file or explicit environment variable.
- [DEFERRED] [A5.2] Toggle affects future responses only. Deferred with [5.3]; no runtime prompt-append toggle is shipped in this pass.
- [x] [A5.3] Missing/invalid toggle fails closed to `normal`.
- [x] [A5.4] No runtime file changes occur without tests.

### Tests

- [DEFERRED] [T5.1] Set compact and verify prompt reinforcement appears if plugin path is used. Deferred because plugin prompt reinforcement is explicitly out of scope for this pass.
- [x] [T5.2] Set invalid value and verify fallback.
- [ ] [T5.3] Verify Algorithm safety prompt still expands.

## Phase 6: Review Brief Templates

### Tasks

- [x] [6.1] Create reusable templates for Codex/Pi/Cato review briefs under an appropriate docs or templates directory.
- [x] [6.2] Replace ad-hoc long review prompts with template path plus task-specific deltas.
- [x] [6.3] Keep template content concise and source linked.

### Acceptance Criteria

- [ ] [A6.1] Existing review workflows can use a template without re-pasting boilerplate.
- [ ] [A6.2] Review prompts still include task-specific constraints and evidence.
- [ ] [A6.3] Templates do not duplicate full Algorithm doctrine.

### Tests

- [T6.1] Generate a Codex brief from template and confirm required sections exist.
- [T6.2] Run a dry consult prompt or read-only review using the template.

## Phase 7: Regression Harness

### Tasks

- [x] [7.1] Add a lightweight regression checklist or script for token-reduction changes.
- [x] [7.2] Include probes for Algorithm format, ISA completeness, safety expansion, exact string preservation, and token-budget reduction.
- [x] [7.3] Require this harness before claiming a token-reduction change is complete.
- [ ] [7.4] Add live-session verification for Algorithm labels, destructive confirmation expansion, ambiguity handling, and verbosity fallback.

### Acceptance Criteria

- [x] [A7.1] Regression harness lists every required probe.
- [x] [A7.2] Harness can be run manually without external services except OpenCode/Codex if explicitly needed.
- [x] [A7.3] Results can be stored under `artifacts/token-budget/`.
- [ ] [A7.4] Regression harness distinguishes static file probes from live OpenCode behavior probes.

### Tests

- [x] [T7.1] Run harness after Phases 1-4.
- [x] [T7.2] Verify no failures in Algorithm format or safety probes.
- [x] [T7.3] Verify token-budget reduction is measured, not assumed.
- [ ] [T7.4] Run a live OpenCode prompt/session check for compact output and safety expansion.

## Execution Order

1. Phase 1: Measurement first.
2. Phase 2: Move catalogs on-demand.
3. Phase 3: Deduplicate doctrine.
4. Phase 4: Add compact output policy.
5. Phase 7: Regression harness for safety gates.
6. Phase 5: Optional runtime toggle only if policy-only compactness is insufficient.
7. Phase 6: Review templates after core prompt bloat is reduced.

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Compact policy suppresses required Algorithm ceremony | Critical | Algorithm schema precedence and format regression probe |
| Moving catalogs hides needed delegation guidance | Warning | Keep invariants loaded, move only catalog details |
| Deduplication removes a safety rule | Critical | Source-of-truth map for every removed rule |
| Env var/state toggle desyncs from transcript | Warning | Prefer inspectable state file or explicit response note |
| Token savings are guessed | Warning | Token-budget script before/after snapshots |
| Caveman grammar creates ambiguity | Critical | Use compact technical prose, not caveman grammar, for Algorithm work |

## Rollback Plan

- Revert `AGENTS.md` catalog extraction if subagent routing degrades.
- Disable compact policy by setting mode to `normal` or removing the compact steering section.
- Keep all moved reference files intact so rollback is pointer restoration, not reconstruction.
- Compare token-budget snapshots before and after rollback.

## Definition Of Done

- Always-loaded context is measurably smaller.
- Core safety and Algorithm invariants remain force-loaded.
- Compact output policy exists with explicit exception list.
- Regression probes pass for Algorithm format, ISA evidence, safety expansion, exact string preservation, ambiguity handling, and token-budget reduction.
- No runtime behavior change is claimed without before/after evidence.
