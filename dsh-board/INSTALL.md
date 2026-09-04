# Installing the board automation on another machine

What is reproducible today, what is not, and the order to do it in.

## Status

| # | Item | State |
|---|---|---|
| 1 | Board plugin (`dsh-build-board` fork) | done — `shreeve1/dsh-build-board` |
| 2 | `HANDLERS.md` tracked, live path symlinked | done |
| 3 | Prompts free of machine-local paths | done |
| 4 | `dsh-cron` pinned to `v0.12.1` | done |
| 5 | `unfusedSessionPrefixes` pinned in profile config | done |
| 6 | Six ticks config-declared, generated from one source | done |
| 7 | `delivery` notification wiring | not started |

The fork is published at **https://github.com/shreeve1/dsh-build-board**
(public, MIT, forked from `alpacachen/dsh-kanban` v1.4.0 with attribution
intact). `origin` is `git@github-personal:shreeve1/dsh-build-board.git`;
`upstream` is the real base repo, so upstream fixes can be merged.

**Verified reproducible 2026-09-04** by cloning the published repo into a temp
dir and building it with nothing from this machine:
`pnpm install --frozen-lockfile`, `pnpm test` (64/64), `typecheck`,
`check:schema`, `check:pipeline`, `check:client-bundle`, `check:package` and
`node build.mjs` — all exit 0, and the freshly built `lib/client.js` is
byte-identical to the committed one.

Only item 7 (delivery notifications) is still open, and it is not a blocker.

## Steps

1. `git clone <dotfiles> ~/dotfiles && cd ~/dotfiles && bash install.sh`
2. Install the board plugin, then restart:
   `git clone https://github.com/shreeve1/dsh-build-board ~/src/dsh-build-board`
   `cd ~/src/dsh-build-board && pnpm install --frozen-lockfile`
   `dsh plugin --profile web add ~/src/dsh-build-board`
   Keep it OUT of scratch dirs: it was mounted from a `.bmad-output/brainstorming/`
   folder until 2026-09-04, one cleanup away from vanishing.
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

## Using it, once it ticks

The unit of work is a **spec**, not a ticket. Every run re-derives its own task
breakdown from the spec plus the current repo, which only works if the repo can
answer *"what is already done"* — hence the runnable `survey` and `acceptance`
commands on every item. Write specs with `/dsh-spec`
(`.claude/skills/dsh-spec/SKILL.md`); `docs/specs/k745-*.md` and
`docs/specs/k801-*.md` are two that passed every stage.

1. Have the conversation that settles the work, then run `/dsh-spec`. It writes
   `docs/specs/<card>-<slug>.md`, creates an **unclaimed** card in Spec, and
   sets `specPath` in a **separate** call. Both are required: Spec is a pure
   validator and blocks a card with no `specPath` on the first read, with no
   retry ladder.
2. Leave it alone. Ticks run every 15 min and move it one column per tick:
   Spec → Decompose → Build → Verify → Review → Merge.
3. **It stops at Merge and waits for you:** `git merge --ff-only auto/<card>`.
   No tick ever merges to main — that hand-off is the point.
4. The next Merge tick removes the worktree, deletes the branch, and archives.

A bounce moves the card back one column with a reason attached; the next tick
reads that reason as untrusted input and re-verifies it from disk rather than
trusting it. Blocked means a human is needed — nothing retries out of it.

To stop the board, set `parked: true` in `budget.json` via `budget-update.sh`.
Every tick reads it, writes nothing, and exits.

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
- **A member added to a team starts its turn before any task exists**, then
  reports "nothing assigned to me" and idles. Creating tasks first does not fix
  it — `create_task` rejects an unknown assignee, so the member must exist
  first. The only reliable unstick is an explicit captain→member
  `send_message`, needed after dispatch *and* after each task completes.
  6+ sightings.
- **Card comments hard-fail over 2000 *bytes*** — bytes, not characters, so an
  em-dash or arrow costs 3. The refusal arrives *after* the claim is taken.
  Split long write-ups pre-emptively.
- **Never `cp -r` a linked worktree.** Its `.git` is a *file* containing
  `gitdir: …`, so the copy still commits to the ORIGINAL repo. A "throwaway"
  copy made that way put a sabotage commit on a live lane; the Build tick caught
  it. Use `git worktree add --detach <path> <sha>` and
  `git worktree remove --force`.
- **Verify runs the gate in the working tree, not at HEAD.** A dirty lane can
  therefore go green while the committed artifact is broken — measured on k801,
  where the working copy was correct and HEAD's gate was inert. Confirm
  `git status --porcelain` is empty before trusting a stage's exit codes.
- **Never `git archive` to test a committed tree.** It strips `.git`, and the
  gate needs git to run, so the failure looks like a gate bug and is not.
