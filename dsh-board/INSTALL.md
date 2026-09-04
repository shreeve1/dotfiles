# Installing the board automation on another machine

What is reproducible today, what is not, and the order to do it in.

## Status

| # | Item | State |
|---|---|---|
| 1 | Board plugin (`dsh-build-board` fork) | **BLOCKED — no reachable remote** |
| 2 | `HANDLERS.md` tracked, live path symlinked | done |
| 3 | Prompts free of machine-local paths | done |
| 4 | `dsh-cron` pinned to `v0.12.1` | done |
| 5 | `unfusedSessionPrefixes` pinned in profile config | done |
| 6 | Six ticks config-declared, generated from one source | done |
| 7 | `delivery` notification wiring | not started |

Item 1 blocks a second machine outright: the fork's only remote is
`/tmp/dsh-kanban-base`, a temp dir, and there is no other copy. Decide publish
vs. vendor, then this file's step 2 becomes real.

## Steps

1. `git clone <dotfiles> ~/dotfiles && cd ~/dotfiles && bash install.sh`
2. Install the board plugin — **needs item 1 settled**:
   `dsh plugin --profile web add <fork-spec>`, then restart.
3. Install dsh-cron (pinned), then restart. One plugin per restart.
4. Open the repo in dsh once so it registers a workspace — `render-preamble.sh`
   resolves the machine-local workspace UUID from the live registry, and fails
   loudly if there is none.
5. Seed the board dir: `mkdir -p ~/.dsh-boards/<project>/log` and write a
   `budget.json` (`windowDate`, `maxTicksPerNight`, `maxTeamsPerCard`,
   `teamsByCard: {}`). Never let a tick invent one.
6. Link handlers: `ln -sfn ~/dotfiles/dsh-board/HANDLERS.md \
   ~/.dsh-boards/<project>/HANDLERS.md`
7. Generate and install the jobs: `dsh-board/render-jobs.sh --install`,
   then restart. They arrive **disabled**.
8. Enable ONE stage, watch one tick end to end, then enable the rest.

## Things that will bite

- **Never hand-copy a prompt.** Six copies of a 20KB preamble drift into six
  different contracts. `render-jobs.sh` exists so that cannot happen; rerun it
  after any `preamble.md` edit.
- **`cwd` is mandatory on every job.** Without it dsh-cron falls back to
  `process.cwd()`, which is unregistered, and the board silently becomes an
  invented `~/.dsh-boards/<user>/board.json` while every tool result reads like
  a successful write to the real board.
- **Budget writes go through `budget-update.sh`.** It is the only race-safe
  path (flock + atomic replace). A tick that writes the file directly can erase
  a human's `parked` flag — measured, and it happened.
- **Config-declared, not manual.** Manual jobs kept firing after `cron_disable`
  and could only be stopped by deletion, which is blunt enough to take unrelated
  jobs with it.
