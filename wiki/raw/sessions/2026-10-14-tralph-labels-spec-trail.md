# Session Capture: tralph triage labels, .kanban default tracker, spec trail

- Date: 2026-10-14
- Purpose: make the `tralph` loop use Matt Pocock's triage labels, make `.kanban/` the default local tracker, and stop tickets drifting from the spec and grill they came from.
- Scope: contracts, decisions and gotchas that a later session could not cheaply rediscover. One-off ticket specifics (the Meeting Assistant tickets 061/062) are excluded.

## Durable Facts

- Eligibility for the loop is decided in one place, `board.sh`: `status: pending` AND exactly one triage state label equal to `ready-for-agent` AND every blocker `done` (issues/ then archive/ searched; cancelled or unknown blockers fail closed) AND, for a parent, all children done. `ralph-loop.sh`, the supervisor, the shepherd and `gralph` all call it. — Evidence: `.agents/skills/kanban/board.sh` (header comment), `tests/board-eligibility.test.sh`.
- `bin/gralph` cannot just call `board.sh eligible`: its manifest needs a per-ticket reason, so the blocker/archive/parent rules are restated in jq. The two are held together by `tests/board-gralph-parity.test.sh`, not by sharing code. — Evidence: `bin/gralph` (comment above `read_kanban_children`), `tests/board-gralph-parity.test.sh`.
- `tralph` runs two different drivers: `--jobs 1` (the default) runs `ralph-loop.sh`, `--jobs >=2` runs `bin/gralph --board`. `ralph-loop.sh` writes no manifest and no run report. A behaviour added to one driver does not exist in the other. — Evidence: `.zshrc` (tralph function, sequential-mode branch), `grep -c run-report ralph-loop.sh` = 0.
- In `gralph` board mode the coordinator records a lane's `DONE` as `reviewGate:"accepted", reviewStatus:"approved", reviewCriticalCount:0` with hardcoded values; it never spawns or reads a reviewer. Acceptance rests on the worker's `RALPH_RESULT` sentinel plus a new commit. — Evidence: `bin/gralph` (DONE branch of `run_board_child_pipeline`); confirmed by the independent verify run this session.
- A lane recorded `failed` stays failed on a plain rerun (`recover_state` counts it as `failed_left`); only `--replan` discards run state. An ordinary worker FAIL behaves identically. — Evidence: `bin/gralph` `recover_state`; reproduced with a stub worker run twice (the agent ran once).
- Spec trail: a ticket's `spec: <slug>` points at `.kanban/specs/<slug>.md`. A slug is `[A-Za-z0-9][A-Za-z0-9_-]*` and not all digits (it is also the gralph run key, where a bare number is a numeric key and 0 is the whole board). A ticket naming a spec whose file is missing or whose slug breaks the rule is refused (gralph: reason `spec_missing`/`spec_invalid`; ralph-loop: set to `blocked` with a `## Blocker`). — Evidence: `bin/gralph` `ticket_spec_file`, `ralph-loop.sh`, `board.sh spec-check`.
- `board.sh spec-done --spec S` is the one completeness rule (>=1 ticket, every ticket in issues/ and archive/ is `done`; an archived cancelled ticket makes it not done, matching `finish-spec`). All three places that remind the user to run `/finish-spec` call it. — Evidence: `.agents/skills/kanban/board.sh`, `bin/gralph` `spec_fully_landed`, `ralph-loop.sh`, `tralph-merge/SKILL.md`.
- `/tests/*` is gitignored (only `!/tests/*.py` is excepted), although 26 test files are tracked; `git add -A` silently skips a new test file and it needs `git add -f`. The `.gitignore` comment calls it "machine-local only". — Evidence: `.gitignore:212-213`, `git ls-files tests | wc -l`.
- A session id locates its transcript by file name: `find ~/.pi/agent/sessions -name '*<id>*.jsonl'`. `grep -rl <id>` also returns other transcripts that merely mention it, so `head -1` picked the wrong one. On the machine reached as `itan8n`, `hostname` prints `n8n`. — Evidence: `.agents/skills/kanban/SKILL.md` ("Session breadcrumb"), reproduced locally.

## Decisions

- Two axes: `status:` is the loop's lifecycle, `labels:` is the triage role. There is no "absent labels means ready" fallback. — Evidence: `.agents/skills/kanban/SKILL.md`.
- Flat board with a `spec:` frontmatter field, not a folder per spec, so ticket ids stay repo-unique and `(#N)` commit references name one ticket. — Evidence: `.agents/skills/kanban/SKILL.md` (design notes).
- Failing open on a missing spec is rejected: running a worker with no spec is the drift the change exists to prevent, so the lane is refused. — Evidence: commits `825f3512`, `b34dccae`.
- Surface, not auto-run, the composition check: a finished spec gets a `Spec complete` report section / a driver message naming `/finish-spec <slug>`. — Evidence: commits `803071b1`, `f2de213d`.
- Coordinator-side reviewer gate for board lanes (so the spec check is enforced, not instructed) was raised by an independent review and left to James as an open design decision. It is not decided.

## Evidence

- `.agents/skills/kanban/board.sh`, `bin/gralph`, `.agents/skills/ralph/ralph-loop.sh`, `.zshrc`, `.gitignore`.
- Commits `dd6444a7`..`b34dccae` on `main`.
- The design record and progress log live in `plans/tralph-labels-kanban-design.md`, which is gitignored scratch; this capture and the analysis page are the durable record.

## Exclusions

- Ticket 061/062 (Meeting Assistant) specifics, per-run test counts, and reviewer model names.
- No secrets, tokens or private data were seen or stored.

## Open Questions And Follow-Ups

- Whether to add a coordinator-side reviewer in `run_board_child_pipeline`, or a mechanical Out-of-Scope bounce. Undecided.
- Active-ticket resume in `ralph-loop.sh` skips the spec-check (only the pick-next path has it).
- `ralph-loop.service` does not pass `--spec`; BSD awk (Mac) is untested for `board.sh`.
