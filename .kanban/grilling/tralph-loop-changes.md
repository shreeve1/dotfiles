# Grill ledger — tralph loop changes and additions

Opened 2026-10-15. Topic: changes and additions to the tralph loop (user's own statement; specifics not yet given).

## System (what exists, fixed unless revisited)

- `tralph` is a zsh function in `.zshrc:330`; it parses `--jobs N`, `--spec SLUG`, `--replan` and dispatches to one of two drivers. (`.zshrc:337-462`)
- `--jobs 1` (default) → `.agents/skills/ralph/ralph-loop.sh` (2026 lines, sequential). `--jobs ≥2` → `bin/gralph --board .kanban` (2692 lines): plan with `--dry-run`, then execute. (`.zshrc:403-460`; `wc -l`)
- Default worker model is `cliproxy/deepseek-v4.1-flash` via `RALPH_MODEL`; board-mode default agent cmd is `pi --no-extensions --model $model --no-session -p`. (`.zshrc:428-429`, `.zshrc:462`)
- Ticket eligibility has one owner, `.agents/skills/kanban/board.sh`: pending + exactly one triage state label = `ready-for-agent` + blockers done (archive searched, unknown/cancelled fail closed) + children done. (`board.sh:1-30`; wiki analysis-session-tralph-labels-spec-trail)
- The two drivers share board.sh and little else; ralph-loop.sh writes no manifest and no run report, so a feature added to one driver must be added to the other. gralph restates the blocker rules in jq; `tests/board-gralph-parity.test.sh` keeps them aligned. (wiki analysis page, "Two drivers behind one command")
- Board mode does not run a reviewer: the lane DONE sidecar hardcodes `reviewGate:"accepted"`, `reviewStatus:"approved"`, zero findings. (`bin/gralph:422`) Coordinator-side review is recorded as an open decision. (wiki analysis page)
- A failed gralph lane stays failed across reruns; only `--replan` retries it. (wiki analysis page, Gotchas)
- Spec trail: ticket `spec: <slug>` → `.kanban/specs/<slug>.md`; missing/invalid spec fails closed in both drivers. (wiki analysis page; `board.sh:23-30`)
- Companion skills: `ralph`, `tralph-shepherd` (periodic owner, 538-line SKILL.md), `tralph-merge` (manual merge path). (`ls .agents/skills`)
- Relevant ADRs: 0005 planner stage, 0007 single worker per issue, 0008/0018 workers on omp→pi, 0009 landing queue, 0010 full-tool lane workers. (`ls docs/adr`)
- Glossary for parallel Ralph (Frontier, Wave, Lane, Landing, Semantic conflict, Integration branch, Scope) is in `CONTEXT.md` § "Parallel Ralph".
- No `docs/brainstorming/*/brainstorm-intent.md` exists. Two brainstorm dirs exist: `brainstorm-tralph-parallel-overhaul-2026-09-10/` (`brainstorm.html`, `.memlog.md`) and `brainstorm-dsh-interactive-learning-plugin-2026-09-04/` (`grounding.md`, `.memlog.md`, `SHAPED.md`, unrelated to tralph). The grill-with-docs intake reads only intent docs, never `.memlog.md`, so neither is loaded. (`ls -la docs/brainstorming/*/`, 2026-10-15)

### Review today

- Two different things are called "review": (a) the mandatory per-ticket fresh-session review, Ralph SKILL.md §4: read-only reviewer, `RALPH_REVIEW: PASS|PASS_WITH_NOTES|FAIL`, and FAIL → `status: blocked`, "Do NOT retry in this session" (no fix step). (`.agents/skills/ralph/SKILL.md:288-348`) (b) `tralph --review-loop`, an opt-in audit/unblock mode that works one blocked/review/in-progress/unreviewed-done ticket per run and may fix what it finds. (`SKILL.md:205-228`; `ralph-loop.sh:14,765`)
- ADR 0007: the review lives inside the worker. The driver stopped running its own planner and reviewer because they doubled cost; it keeps only a deterministic verification gate. (`docs/adr/0007-ralph-single-worker-per-issue.md`)
- The reviewer is pinned to `RALPH_MODEL` (DeepSeek), committed 2026-10-15 (a8c51e7b) because unpinned reviewers ran on pi's default claude-sonnet. (`git show a8c51e7b`)
- Board-mode workers are told to spawn their own fresh-session reviewer (gralph prompt step 4). The coordinator does not check it. (`bin/gralph:372`, `:422`)
- Workers run `pi --no-extensions` in both drivers (`ralph-loop.sh:800`, `:1183`; `.zshrc:429`). pi-subagents is an extension (`.pi/agent/extensions/pi-subagents`), so workers have no `subagent` tool.

### Candidate skills (as written)

- `independent-review`: Step 3 requires one `subagent` workflow call. It needs reviewers on a model family different from the caller's; for a DeepSeek caller ("Anything else") that is `cliproxy/claude-opus-5-5`, then `cliproxy/gpt-6.1-sol`. Lenses scale with diff size: 1 lens under 50 lines, up to 4 at 200+ lines. It is read-only and ends "Wait for the user's go-ahead" before fixing. (`.agents/skills/independent-review/SKILL.md:19-46,122`)
- `post-work-cleanup`: scope is the session's diff only; behaviour-preserving; ends by re-running tests/typecheck/lint, then commits. (`.agents/skills/post-work-cleanup/SKILL.md`)
- `improve-codebase-architecture`: `disable-model-invocation: true`. Scans hot spots across the repo (not one diff), writes an HTML report to $TMPDIR, `xdg-open`s it, asks the user "Which of these would you like to explore?", then grills. It produces proposals, not changes. (`SKILL.md:1-80`)
- CORRECTION 2026-10-15: `/codebase-design` does exist at `.agents/skills/codebase-design/` (SKILL.md, DEEPENING.md, DESIGN-IT-TWICE.md; mtime 2026-10-03). Both it and `improve-codebase-architecture/` are untracked in git (`git status --short`: `??`). b90fc09f moved codebase-design to `skills-archive/`, and 070f0fca deleted the archive, so on the other two machines neither skill exists. (`git show --stat b90fc09f`, `070f0fca`)
- `gralph finish <n>` runs finish-spec headless (GitHub parents only). An interactive tail step there would hit no user. (`bin/gralph:2132-2140`)
- The sequential driver re-runs `## Verification` after DONE (verification gate); board mode re-verifies at landing (ADR 0009). Both would catch a cleanup that breaks the ticket's check. (CONTEXT.md glossary)

- `cliproxy/claude-opus-5-5`, `cliproxy/gpt-6.1-sol` and `cliproxy/deepseek-v4.1-flash` are all listed by `pi --list-models` on omarchy (2026-10-15).

### Where an end-of-spec step could write output

- The sequential driver has no run directory. Its only file output is the log `$HOME/.cache/ralph-loop-$SESSION_NAME.log`. (`ralph-loop.sh:995`) When a spec completes it prints a note telling the user to run `/finish-spec $SPEC`; it does not run it. (`ralph-loop.sh:1939`)
- Board mode writes `.kanban/run-report.md`, or `.kanban/run-report-<slug>.md` for a spec run. (`bin/gralph:1580-1588`) That report tells the user to run `/finish-spec <slug>`. (`bin/gralph:1632`) `.gralph/` is gitignored; `.kanban/run-report*.md` is not. (`.gitignore:9-11`)
- `gralph finish <n>` launches finish-spec headless, but only for a numeric GitHub parent issue. It is not the local-board path. (`bin/gralph:30-33`, `:2132-2140`)
- So for local boards `/finish-spec` is always run by the user in an interactive session, never by either driver. Its only durable output is a `## Completion` section appended to `.kanban/specs/<slug>.md`, plus new `ready-for-agent` tickets for large gaps. (`.agents/skills/finish-spec/SKILL.md:24,30`)
- Consequence: an architecture step placed after `/finish-spec` runs with the user present, so improve-codebase-architecture works as written (HTML in $TMPDIR, `xdg-open`, the user picks a candidate). No run directory is needed. An unattended version would need a new output location; none exists in the sequential driver.

## Decisions

- D1 (Q4, user 2026-10-15: "q4 option a"): improve-codebase-architecture is NOT a per-ticket step. It becomes the last step of `/finish-spec`, run interactively after the spec is closed. Its scan is aimed at the files the spec touched (the skill's "user named a direction" branch). The skill runs as written: HTML in $TMPDIR, xdg-open, the user picks a candidate, grilling follows. Neither driver changes for this.
- D2 (Q1, user: "q1 option a"): independent-review replaces the review every ticket gets (Ralph SKILL.md §4), in both drivers. `--review-loop` is unchanged.
- D3 (Q2, user: "q2 option c"): the Gaps lens runs on a different family (`cliproxy/claude-opus-5-5`, fallback `cliproxy/gpt-6.1-sol`). Any other lens the diff size calls for runs on `RALPH_MODEL` (DeepSeek). Reviewers are plain `pi -p --model X` processes, not the `subagent` tool.
- D4 (Q3, user: "q3 agreed"): the worker rules on each finding (accept/reject plus a one-line reason), fixes the accepted ones and re-runs `## Verification`. There is at most one fix round. D6 amends the re-review trigger.
- D5 (user: "most times there isn't a need to block. I don't [want] every ticket to block just because the review ran"): blocking is the exception. Medium/low findings are fixed or logged and never block. Today's rule that a reviewer FAIL means blocked (SKILL.md §4) goes away.
- D6 (Q5, user: "q5 agreed"): any high-severity finding, accepted or rejected, triggers the one re-review. The re-reviewer checks the fixes and the worker's rejection reasons. The ticket blocks only if the re-reviewer upholds a high finding; the upheld findings go in `## Blocker`. No high finding means no re-review.

## Defaults (low-stakes, stated, not objected to)

- A reviewer that fails to run (quota/429 on both Gaps models) does not block. The lens falls back to DeepSeek and the ticket's progress note says the review was degraded.
- post-work-cleanup (user's item 2) runs inside the worker after the review fixes and before DONE. It is limited to the ticket's diff and is not re-reviewed. The driver verification gate (sequential) and landing re-verification (board) catch a cleanup that breaks the check.
- Board mode: "blocked" means the worker emits `RALPH_RESULT: BLOCKED`. The coordinator is unchanged (`bin/gralph:422` still records DONE as approved).
- Rejected findings and their reasons are written to the ticket so `/ticket-review` and `/finish-spec` can see them.
- Skip the architecture step when finish-spec runs headless via `gralph finish`.
- improve-codebase-architecture is `disable-model-invocation`, so finish-spec tells the agent to read its SKILL.md rather than calling the skill tool.
- Commit `codebase-design/` and `improve-codebase-architecture/` so all three machines have them.
- No ADR: every decision is cheap to reverse (prompt/skill text), and ADR 0007's "review lives in the worker" still holds.

## Status

Grill complete 2026-10-15. Next: `/to-spec` with this ledger.
