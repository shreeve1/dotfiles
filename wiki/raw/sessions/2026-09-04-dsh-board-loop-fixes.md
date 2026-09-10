# Session Capture: dsh-board pipeline loop fixes + full autonomy

- Date: 2026-09-04
- Purpose: Diagnosed and fixed two structural bugs in the unattended dsh-board
  build pipeline while shepherding card k881 from Blocked to Archive, and made
  the board fully autonomous through Merge.
- Scope: dsh-board stage-handler mechanics (Decompose gate, Build task shape,
  Merge auto-merge), the agent_teams captain/scheduler lifecycle that drives
  those stages, cron-tick staggering vs provider rate limits, and how the board
  handler "code" is actually agent-followed prose. Card k881's own content is
  incidental and not captured.

## Durable Facts

- The dsh-board stage "handlers" and "allowlisted actions" are NOT code: each
  tick is a `kind: agent` cron job whose rendered prompt points at HANDLERS.md;
  the tick agent reads the prose and runs the git commands itself. There is no
  executor that interprets action names. — Evidence: `dsh-board/preamble.md`,
  `dsh-board/render-jobs.sh`, grep for action names finds only `.md` hits.
- Two board doc-loading mechanisms with DIFFERENT deploy semantics: `HANDLERS.md`
  is read live via the `~/.dsh-boards/dotfiles/HANDLERS.md` symlink (edits take
  effect on the next tick, no restart); `preamble.md` is rendered into FROZEN
  copies baked into the six cron prompts by `render-jobs.sh --install` and only
  takes effect after a dsh restart (profile config loads at boot). — Evidence:
  `dsh-board/INSTALL.md:82-84`, `dsh-board/render-jobs.sh`.
- agent_teams: a team is permanently bound to its creating captain session
  (`findTeamByCaptain` matches `team.captainSessionId`, set once at creation).
  No adopt/re-attach/takeover API exists; `agent_teams_resume` only resumes a
  halted team from within the SAME captain session. — Evidence:
  `~/.dsh/profiles/web/node_modules/@nanmicoder/dsh-agent-teams/lib/state.js`,
  `lib/index.js`.
- agent_teams scheduler is event-driven and per-process: it advances a member
  to its next ready task on an "idle edge" only while the captain's process is
  alive (`deliverToMember(ctx, captain, ...)`). When a short-lived Build/Review
  tick exits after dispatch, the scheduler tears down and a now-ready dependent
  task is never claimed. — Evidence: `lib/scheduler.js`, `lib/members.js`.
- `git merge --ff-only` fails safe across every risk case (tested in throwaway
  repos): diverged branch → exit 128, main unchanged; a dirty tracked file the
  ff would overwrite → exit 1, local edit preserved, main unchanged;
  already-merged → exit 0 "Already up to date" (idempotent); an unrelated dirty
  file → ff succeeds and the file is preserved. — Evidence: session test runs.
- `cron_disable` writes a persisted conversational OVERRIDE
  (`enabledSource: override`) that survives a dsh restart; it does not change the
  config file's `enabled` flag. So a disabled tick stays disabled across restart
  and must be re-enabled with `cron_enable`. — Evidence: `cron_list` before/after
  the 23:41 restart showing Build/Decompose still `enabled:false override`.
- All six board ticks originally shared `*/15 * * * *`, firing simultaneously and
  bursting the LLM provider into a MiniMax 429 "Token Plan rate limit" even with
  quota left. Staggering each stage 2 min apart (spec :00, decompose :02, …
  merge :10) cleared the 429. — Evidence: `dsh-board/render-jobs.sh` stage_cron
  offsets; journal 429 entries before, clean ticks after.
- `smart_restart` on this host can take minutes and its notice arrives late; the
  canary path stalled twice (canary passed, systemd unit never swapped,
  NRestarts stayed 0, orphaned canary left on its own port); a no-canary retry
  eventually landed. A lingering canary binds only its own ephemeral port, never
  production 3080, so it is safe to kill. — Evidence: session restart sequence,
  `systemctl --user show dsh-web.service`, `ss -tlnp`.

## Decisions

- Decompose gate: replace the blanket `git-status-clean` (whole-tree) check with
  a scoped `spec-committed` check (`git status --porcelain -- <specPath>`).
  Rationale: a worktree branches off HEAD, so unrelated dirtiness can neither
  enter nor corrupt the lane; only the card's own spec must be in HEAD. —
  Evidence: `dsh-board/HANDLERS.md` Decompose step 1, commit a0a4399d.
- Build stage: create ONE composite task listing all breakdown steps in order
  for one engineer to drive in a single turn, NOT a chain of dependent tasks.
  Rationale: dependent tasks strand when the captain tick dies (see scheduler
  fact). A genuine stall then means the spec is too big for one Build turn →
  Decompose splits into smaller CARDS, never dependent tasks. — Evidence:
  `dsh-board/HANDLERS.md` Build step 3, commit ab963f22.
- Merge stage: the board now runs `git merge --ff-only` itself (no human gate),
  strictly fast-forward only. A diverged lane bounces to Build; git's own
  --ff-only/dirty-tree refusals mean the board can never make a merge commit,
  force, or overwrite uncommitted work; post-merge `check.sh` failure → Blocked
  for a human. Added `git-merge-ff` as the single WRITE action in the preamble
  allowlist. — Evidence: `dsh-board/HANDLERS.md` Merge stage, `dsh-board/preamble.md`,
  `CLAUDE.md`, commit 136ad06d. James explicitly chose full autonomy over the
  prepare-and-confirm middle option.

## Evidence

- `dsh-board/HANDLERS.md` — the three stage-contract changes (Decompose gate,
  Build composite task, Merge auto-ff-merge); live via symlink.
- `dsh-board/preamble.md` — allowlist including `spec-committed` and the
  write-action `git-merge-ff`; frozen into prompts, needs restart.
- `dsh-board/render-jobs.sh` — renders the six cron prompts; `--install` writes
  them to `~/.dsh/profiles/web/cordis.patch.yml`; holds the per-stage `stage_cron`
  stagger offsets and the MiniMax provider pin.
- `dsh-board/INSTALL.md` — documents "regenerate after any preamble.md change"
  and the frozen-copy failure mode.
- `~/.dsh/profiles/web/node_modules/@nanmicoder/dsh-agent-teams/lib/{state,scheduler,members}.js`
  — captain-binding and per-process scheduler behavior.

## Exclusions

- No secrets/tokens/TLS material captured (the board's cordis config references
  cert/token paths only; values excluded).
- Card k881's product content (reproducible dsh install spec) not captured — it
  is the incidental vehicle, not the durable board knowledge.
- Routine tick-by-tick progress polling and one unexplained transient Verify
  false-negative (seq-71, did not reproduce) noted but not promoted as fact.

## Open Questions And Follow-Ups

- The composite-task Build fix and auto-ff-merge Merge fix are deployed but have
  NOT yet been exercised end-to-end by an actual autonomous board run on a new
  card; k881 was hand-driven by the captain. Watch the next real card.
- k881's passing review logged 4 non-blocking robustness notes (unpinned
  `@deepseek-ai/dsh` version in install-dsh.sh; hardcoded IP in capture.sh;
  patches/ not re-copied on capture; python3 dep for token parse) — optional
  follow-up card.
- Why `smart_restart`'s canary path stalls twice before a no-canary retry lands
  is unexplained; worth investigating if it recurs.
