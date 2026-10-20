# Session Capture: Grill-drift checks — gap review fixes

- Date: 2026-10-20
- Purpose: an independent four-lens review (gpt-6.1-sol, gpt-6-luna, minimax-m3.1-flash, glm-5.3) returned REJECT on the first drift-check build; James asked to fix all findings.
- Scope: what changed in the design and why; the gotchas that made the first version wrong.

## Durable Facts

- The first version's "undo reviewer edits" step compared `git status --porcelain` lines before and after, so a pre-dirty path whose status changed (from "space M" to `MM`) or any path another session edited was reverted. Replaced by a tool allowlist (`--tools read,grep,find,ls`) with context on stdin. — Evidence: reproduced in a scratch repo; `.agents/skills/ralph/ralph-drift-check.sh`
- pi takes piped stdin as a prefix to the first prompt in print mode, so large context (a diff) can go on stdin instead of argv (ARG_MAX 2 MB, one argument far less). — Evidence: pi docs `cli.md:36`; live probe returned `STDIN_OK`
- Removing a drift-blocked lane's branch and telling the user to `--replan` broke mixed runs: `--replan` discards the landed lane's manifest state, its branch still exists, and it fails `branch_exists`. Replaced by a ready-for-human repair ticket and landing the passing lanes. — Evidence: reproduced with two lanes; `tests/gralph-drift.test.sh` case 2
- A board lane worktree holds only what was committed at plan time, so the drift check must read the ticket and spec from the live board (absolute paths, `--spec-file`). — Evidence: `bin/gralph` run_board_child_pipeline; test case 4
- The tralph-shepherd DEFAULT rule hands back any Blocker naming file:line fixes; a drift Blocker does, so the shepherd now RAISEs any Blocker starting "Drift check — needs the user". — Evidence: `.agents/skills/tralph-shepherd/SKILL.md`
- Sequential drift range is now the parent of the ticket's first `(#ID)` commit to HEAD (same base the worker review uses), so resumed tickets are fully checked. — Evidence: `ralph-loop.sh` ticket_drift_base

## Decisions

- Fix all findings. Immediate safety fix (read-only tools, no revert) first; repair-ticket path for drift-blocked lanes; document the check as local-board-only rather than wiring GitHub mode. — Evidence: James "lets fix all" after the three recommendations

## Evidence

- Commits 9acc92f8, 39bf917e, c30a53b6, b702a9bd, fdc5bd9f
- `tests/run-all.sh` 30 passed, 0 failed

## Exclusions

- Reviewer outputs under /tmp/gapreview are not captured (scratch).

## Open Questions And Follow-Ups

- Live tests pending: James will test /to-spec on aidev and tralph on omarchy.
- In a shared tree the sequential range can include another session's commit; findings citing untouched files are false positives for the user.
