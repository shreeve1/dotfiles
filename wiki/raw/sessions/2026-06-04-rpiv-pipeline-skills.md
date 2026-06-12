# Session Capture: RPIV pipeline driver and companion skills

- Date: 2026-06-04
- Purpose: Capture the durable shape of the `rpiv-run` pipeline and the three companion skills (rpiv-monitor, gap-sweep, rpiv-merge) added/extended this session, plus the cross-engine handoff model.
- Scope: Architecture and operating rules for the RPIV automation in this dotfiles repo. Excludes the unrelated downstream app work (a cleon-ui-pi feature branch) that was merely the test subject.

## Durable Facts

- `rpiv-run` drives the RPIV skill chain unattended, one step per fresh interactive engine TUI on a private tmux socket, using send-keys + a nonce done-marker; step handoff is via on-disk artifacts in `.rpiv/artifacts/<type>/`, not shared context. — Evidence: `bin/rpiv-run` header comments (lines 1–22)
- Pipeline order is research → design → plan → implement → validate → code-review → commit; discover runs by hand first and the driver picks up the newest FRD. — Evidence: `bin/rpiv-run:52`, `bin/rpiv-run:112`
- Default engine is `pi`; `--engine claude` (or `RPIV_ENGINE`) opts into Claude as the coding agent. — Evidence: `bin/rpiv-run:31`, `bin/rpiv-run:55`
- Each run works on a fresh branch `${RPIV_BRANCH_PREFIX:-rpiv}/<TS>` created with `git checkout -b` — a branch in the repo's own working dir, NOT a git worktree. — Evidence: `bin/rpiv-run:116`, `bin/rpiv-run:175`
- A `gap-sweep` runs after FRD/research/design/plan and after implement: a fresh AI session sweeps the just-produced artifact for critical gaps, fixes them in place, and continues. It is auto-accept with no gate, consistent with the no-stops philosophy. — Evidence: `bin/rpiv-run:292-307`, `.claude/skills/gap-sweep/SKILL.md`
- `rpiv-monitor` diagnoses a running pipeline strictly read-only via `tmux capture-pane`; never attach/send-keys to the live pane (it corrupts the driver's paste/marker detection). The live socket is found from the driver's session list, not `ls -t` (a stale socket file sorts first by mtime). — Evidence: `.claude/skills/rpiv-monitor/SKILL.md`
- `rpiv-merge` is the post-pipeline landing step: enumerate `rpiv/<TS>` branches, pick one, review the diff, test, then merge — confirming before merge, never pushing unless asked, with a dirty-tree guard before any checkout. — Evidence: `.claude/skills/rpiv-merge/SKILL.md`
- The driver now persists the kickoff fork point to `.rpiv/run/<TS>/.base` so `rpiv-merge` can target the exact base instead of guessing `main`; older runs without `.base` fall back to `origin/HEAD` then `init.defaultBranch`. — Evidence: `bin/rpiv-run` (ORIG_REF write near line 130), `.claude/skills/rpiv-merge/SKILL.md` Phase 1
- Run logs live at `.rpiv/run/<TS>/` (git-ignored, per-repo, local); the live step log is written ~every 5s during a step for observability. — Evidence: `bin/rpiv-run` run_skill poll loop; commit `bfaafaa`

## Decisions

- A discover session run in interactive Claude can feed an `rpiv-run` pipeline using pi as the coding agent, because handoff is file-based (the FRD in `.rpiv/artifacts/discover/`); the producing engine is irrelevant as long as it is the same repo/cwd and pi is onboarded there. — Evidence: `bin/rpiv-run:112`, session reasoning
- `gap-sweep` is NOT a quality gate and NOT a human review: it is an autonomous fix-and-continue step (no asking, no blocking). — Evidence: `.claude/skills/gap-sweep/SKILL.md` hard rules
- `rpiv-merge` does treat the merge as a confirmation point and testing as the real checkpoint; it will not merge a red branch and will not push without an explicit request. — Evidence: `.claude/skills/rpiv-merge/SKILL.md` hard rules
- Skill frontmatter for these skills is name + description only (no `allowed-tools`), intentionally leaving all tools usable. — Evidence: `.claude/skills/gap-sweep/SKILL.md`, `.claude/skills/rpiv-merge/SKILL.md` frontmatter

## Evidence

- `bin/rpiv-run` — pipeline driver: engine selection, branch creation, gap-sweep wiring, `.base` persistence, live logs.
- `.claude/skills/rpiv-monitor/SKILL.md` — read-only diagnosis of a running pipeline.
- `.claude/skills/gap-sweep/SKILL.md` — autonomous critical-gap sweep between steps.
- `.claude/skills/rpiv-merge/SKILL.md` — interactive branch landing (diff/test/merge).
- Commits: `bfaafaa` (live logs + rpiv-monitor), `794a79c` (gap-sweep wiring + skill), `edcd3c5` (rpiv-merge skill + `.base`).

## Exclusions

- The cleon-ui-pi feature merged as the test subject (authenticated-Pi-models change, commit `f1fff92`) — downstream app work in a different repo, not durable dotfiles knowledge.
- pm2 restart of `cleon-ui-pi` — ephemeral operations.
- No secrets, credentials, or private data captured.

## Open Questions And Follow-Ups

- The `.base` persistence only helps future runs; pre-existing `rpiv/<TS>` branches still rely on `rpiv-merge` deriving the base and asking the user to confirm.
- The gap-sweep skills are committed but had not been exercised by a live pipeline run as of this session (the run observed used the pre-gap-sweep driver).
