# Session Capture: Grill-drift checks (A, B, C)

- Date: 2026-10-20
- Purpose: James found that what tralph builds from a spec drifts from what was agreed in the grill, especially with the small default worker model. He chose three checks against the grill ledger.
- Scope: the decisions and the contracts the checks introduced. The plan file (`plans/grill-drift-checks.md`) is gitignored scratch; this capture and ADR 0024 are the durable record.

## Durable Facts

- A spec now names its grill ledger in a `ledger:` frontmatter line; `/to-spec` shows every ledger Decision/Default as honoured, MISSING or CONTRADICTED and waits for the user's approval before publishing. — Evidence: `.agents/skills/to-spec/SKILL.md` step 4
- Both drivers run `.agents/skills/ralph/ralph-drift-check.sh` after a worker's DONE on a ticket with a `spec:`. It ends with `DRIFT_CHECK: PASS|DRIFT|DEGRADED|SKIPPED`; only DRIFT blocks. — Evidence: `.agents/skills/ralph/ralph-drift-check.sh`, `ralph-loop.sh` `run_drift_gate()`, `bin/gralph` `run_board_child_pipeline()`
- In board mode a drift-blocked lane is recorded `outcome: failed`, sentinel `blocked`, reason `drift`; its findings and drifted commit sha go to `.gralph/runs/<key>/.child-<N>-<run>-drift.txt`, and the lane branch is removed so a rerun with `--replan` is not refused as `branch_exists`. — Evidence: `bin/gralph`, `tests/gralph-drift.test.sh`
- The board run report is not written when a lane fails (orchestrate_waves returns 1 before finish_board), so drift findings are surfaced on stderr, not in `.kanban/run-report*.md`. — Evidence: `bin/gralph` (orchestrate_waves return, main `|| exit 1`)
- `/finish-spec` step 4 walks the ledger against the merged code; the spec cannot close while a decision is contradicted. — Evidence: `.agents/skills/finish-spec/SKILL.md`

## Decisions

- Build all three checks (A in to-spec, C per ticket in both drivers, B in finish-spec). — Evidence: James in session: "A. and B. both sound good", then agreed to C.
- Accept one extra strong-model call per spec'd ticket, recorded as ADR 0024 partially superseding ADR 0007. — Evidence: James: "1. this is fine agree with the rest"; `docs/adr/0024-driver-side-drift-check.md`
- C blocks only on contradicting a recorded decision or building something Out of Scope; model `cliproxy/claude-opus-5-5` then `cliproxy/gpt-6.1-sol`; DEGRADED never blocks; no-spec tickets are SKIPPED. — Evidence: same session answer; ADR 0024
- Keep `RALPH_MODEL` on Flash; reconsider once the drift check's block log shows how often it drifts. — Evidence: plan "Out of scope"

## Evidence

- `docs/adr/0024-driver-side-drift-check.md` — rationale and consequences
- `tests/ralph-drift-check.test.sh`, `tests/ralph-loop-labels.test.sh` (case 8), `tests/gralph-drift.test.sh`, `tests/skills-text.test.sh` — behaviour pinned

## Exclusions

- No secrets or personal data were involved. The YouTube video that prompted the idea is not captured (one-off, lives under `youtube/`).

## Open Questions And Follow-Ups

- Sequential mode checks only the current worker turn's commits; a resumed ticket's earlier commits are not re-checked (`ponytail:` in `ralph-loop.sh`).
- No real end-to-end run yet: the plan's checkpoints (a throwaway spec with a planted contradiction in both modes) are still to do.
- Whether a worker-BLOCKED lane (not drift) also hits `branch_exists` on `--replan` was not checked.
