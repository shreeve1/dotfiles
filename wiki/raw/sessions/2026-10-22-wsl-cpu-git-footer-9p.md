# Session Capture: WSL CPU storm from git polling over /mnt/c

- Date: 2026-10-22
- Purpose: Find why Task Manager showed WSL (Vmmem) at high CPU on wrk and terminal typing lagged, then remove the cause.
- Scope: root cause, evidence method, and the resulting itastack layout on wrk. Ticket and client content excluded.

## Durable Facts

- pi-cc-extensions' custom footer runs `git diff --numstat HEAD --` and `git status --porcelain --branch` in the session cwd every 10 s (`GIT_REFRESH_INTERVAL_MS = 10_000`) with a 2 s `execFile` timeout, in every pi session, idle ones included. Hiding the git chip does not stop the polling. — Evidence: `~/.pi/agent/npm/node_modules/pi-cc-extensions/extensions/feature/shell/footer.ts:48,249-260`, `.../git-stats.ts` (`readGitStats`).
- On a repo under `/mnt/c` (drvfs over 9p) those commands took 5-27 s (`git status`) and 4-5 s (`git diff --numstat`), so every poll hit the 2 s timeout and was killed after 2 s of 9p traffic. With 5 itastack sessions this kept the git commands running nearly continuously. — Evidence: `/usr/bin/time git status` in `/mnt/c/Users/james/Documents/itastack`; 6 s sampling of `pgrep -x git` parents.
- Signature: low user CPU (~3%) but high system CPU (14-38%), ~40-55k interrupts/s, ~100-130k context switches/s, ~33k CAL IPIs/s. ftrace showed workqueue items dominated by `p9_read_work`/`p9_write_work`/`p9_poll_workfn` (~65k per second) and IPIs sent from kworkers and git via `ttwu_queue_wakelist`. Per-process CPU does not show this; it lands in kernel threads. — Evidence: `vmstat`, `/proc/interrupts` deltas, `/sys/kernel/tracing` events `ipi/*` and `workqueue/workqueue_execute_start` (sudo works on wrk WSL; no perf/strace/bpftrace installed).
- After moving itastack agents to the WSL ext4 copy `~/Documents/itastack`: `git status` 0.01 s; CPU over 10 s user 3.1% / system 1.1% / idle 94.7%; CAL ~1.3k/s; no git processes on `/mnt/c`. — Evidence: post-move measurements.

## Decisions

- James chose: itastack agents on wrk work in `~/Documents/itastack` (same path as aidev/itan8n); a second Syncthing inside WSL (device `wrk-wsl`, user service, GUI 127.0.0.1:8385, listen 22001) syncs it with the Windows Syncthing so Obsidian keeps using `C:\\Users\\james\\Documents\\itastack`. `.git` and `/.claude/skills` are excluded from Syncthing; git lives only in the WSL copy. — Evidence: itastack `memory/workflows/workstation/windows-itastack-copies.md` (commit 43d70a9), both `.stignore` files.
- James chose to remove git from itastack entirely as a separate follow-up after the move. — Evidence: this session.
- `rea` MCP is disabled for itastack via project `.pi/mcp.json` `{"rea": {"enabled": false}}`. — Evidence: `/home/james/Documents/itastack/.pi/mcp.json`.

## Evidence

- `~/.pi/agent/npm/node_modules/pi-cc-extensions/extensions/feature/shell/footer.ts` — poll interval and trigger.
- `~/.pi/agent/npm/node_modules/pi-cc-extensions/extensions/feature/shell/git-stats.ts` — commands and 2 s timeout.

## Exclusions

- Ticket, client and research content visible in agent panes; Syncthing API keys and device IDs.

## Open Questions And Follow-Ups

- Remove git from itastack (AGENTS.md commit rule, startday `SD commit` in sd.py, personal-memory, halo-ticket-research, procedure-capture, skill-audit, .githooks, offload-aidev). Archive `.git` first.
- Any pi session started in a large repo on `/mnt/c` will recreate the storm while pi-cc-extensions' footer polls git; ask upstream for an off switch for footer git stats.
- Idle pi main threads still wake ~600-800 times/s each; not explained by the git poll and not investigated further.
