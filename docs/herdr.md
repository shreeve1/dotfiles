# herdr

herdr is the terminal workspace manager for AI coding agents. This doc records
which parts of it this repo syncs, which parts stay machine-local, and how to
restore the remote machine list on a new system.

## Synced

| Repo source | Live target | Declared by | Mechanism |
| --- | --- | --- | --- |
| `home/herdr/config.toml` | `~/.config/herdr/config.toml` | `install.sh:205` | `link_path` (symlink) |
| `herdr/endpoints.json` | `~/.local/state/herdr/client/endpoints.json` | `install.sh:211` | `seed_path` (copy if absent) |

Both rows are outside the Linux-only Omarchy block, so Linux and macOS both get
them; `install.sh` creates `~/.config/herdr/` if absent and backs up any existing
file as `config.toml-bak-<UTCstamp>`. Validate the link after checkout:

```bash
herdr config check   # -> config: ok
```

The endpoints row is a **seed**, not a symlink, on purpose: herdr rewrites that
file whenever machines change, and a symlink would push those runtime writes
into the git tree and share one machine list across every host. The seed only
fills in a missing list — it never overwrites a live one.

## Machine-local (deliberately not tracked)

`~/.config/herdr/` is a real directory holding runtime state next to the synced
file, so only the file is linked — never the directory:

- `herdr.sock`, `herdr-client.sock` — sockets for the running server/client
- `herdr-server.log`, `herdr-client.log` — logs
- `session.json` — workspaces, panes, tab numbering; identities differ per machine
- `release-notes.json`, `.plugins.lock` — regenerated cache and runtime lock

`~/.local/state/herdr/` is XDG state and stays machine-local with it:

- `client/endpoints.json` — the saved remote machine list; seeded from
  `herdr/endpoints.json` on install, then owned and rewritten by herdr (see below)
- `client/endpoint-selection.json` — which endpoint was last selected on this machine
- `agent-detection/`, `client-shell/` — caches

## Restoring the remote machine list

`herdr/endpoints.json` is a backup of `client/endpoints.json`, seeded onto a new
machine by `install.sh`. It is a copy, never a symlink, because the live file is
XDG state that herdr rewrites on every machine change; the seed fills in a
missing list and leaves an existing one alone.

The list holds only `id`, `label`, `target` (an SSH alias), `session`, and
`enabled` — no credentials or keys. Auth keys are set up per machine by hand and
deliberately live outside this repo.

On a new system:

1. Prerequisite: the SSH aliases resolve and keys are in place (set up outside
   this repo). Confirm with `ssh -G aidev | head -3`, which prints the resolved
   host/user/hostname. A seeded list whose aliases do not resolve is useless.
2. Run `install.sh`; it seeds the list if `client/endpoints.json` is absent.
3. Verify with `herdr machine list --json` (authoritative: separates label,
   target, session, enabled) and compare against `herdr/endpoints.json`.

If the live list drifted since the last backup, refresh the backup by copying the
live file back into the repo:

```bash
cp ~/.local/state/herdr/client/endpoints.json ~/dotfiles/herdr/endpoints.json
```

To rebuild it from scratch instead — `--label` is required, `--remote-session`
only when you want a specific herdr session on the remote; `machine add` also
prepares the remote herdr server:

```bash
herdr machine add --label "aidev · default" --remote-session default aidev
herdr machine add --label "n8n" --remote-session default itan8n
```

## How the machines connect (updated 2026-10-21)

Every Linux-side machine runs its own `herdr server` (aidev's since 2026-09-21,
itan8n's since 2026-09-22, both herdr-managed, not systemd; the wrk desktop's
since 2026-10-21, a systemd user service inside Ubuntu-24.04 WSL2, reachable
at the host's NetBird IP on ssh port 2222), holding that machine's workspaces
and pi agents. A herdr client on any machine reaches the others through its
saved machines: herdr runs `ssh -T <alias> … herdr`
`remote-client-bridge` with its own ControlMaster socket, `BatchMode=yes` and
`StrictHostKeyChecking=yes`, so each alias needs working key auth and a known
host key. surftop (Surface thin client, ARM64) runs the native Windows herdr
client only. The user usually reaches a machine's herdr over mosh
(`exec herdr --session default`).

The live machine lists differ per machine; the repo seed is the baseline:

| Machine | herdr | Saved machines (label → alias) |
| --- | --- | --- |
| wrk (WSL2) | 0.9.5 | none yet (server role; entries seeded on demand) |
| aidev | 0.9.5 | `n8n` → `itan8n`, `wrk wsl` → `wsl-wrk` |
| itan8n | 0.9.5 | `aidev · default` → `aidev`; disabled `n8n` self-entry remains |
| surftop | 0.9.5 (Windows) | `Desktop WSL` → `desktop-wsl`, `aidev · default` → `aidev`, `n8n` → `n8n` |

All sessions are `default`. Agents are pi panes; pi reports state and session to
herdr through `~/.pi/agent/extensions/herdr-agent-state.ts` (synced, so present
on all Linux machines).

`~/.config/herdr/config.toml` leaves `[remote] manage_ssh_config` at its default
(true), which lets herdr add `ServerAliveInterval` fallbacks to `~/.ssh/config`;
this machine currently has no herdr-managed entries there.

## Herdr Projects (installed 2026-10-16; historical three-machine rollout)

Installed 2026-10-16: [Herdr Projects](https://github.com/eliasstravik/herdr-projects)
1.2.1, pinned to release commit `5cf84391d856a943043fa3feacc7a75763ebc22a`:

```sh
herdr plugin install eliasstravik/herdr-projects --ref 5cf84391d856a943043fa3feacc7a75763ebc22a --yes
```

The plugin is Herdr-managed, not vendored into dotfiles. Its launcher is
`~/.herdr-projects/data/bin/herdr-projects`, symlinked from
`~/.local/bin/herdr-projects`; tasks and settings stay machine-local under
`~/.herdr-projects/`. The optional key and sidebar blocks are enabled in the
shared `home/herdr/config.toml`: **Ctrl+S, then A** opens the work board, and the
sidebar includes task summary/progress rows. The plugin deliberately refuses to
rewrite symlinked configs, so its first-run setup prints "Could not change"
with blocks to paste. Both blocks were added to the shared source with user
approval; keep the symlink intact. After syncing future config edits, run
`herdr config check` and `herdr server reload-config` on each machine.

All roles use pi. `watcher.agent` is `none`, avoiding the default Claude/Haiku
watcher. Reviews remain enabled (`review.when=repos`) and `merge.by` is `you`
(approval required). The agents still run with the plugin's default full access;
a worktree and a review are not a sandbox.

Every machine owns its tasks and coordinators. `Alt+M` selects another machine;
in the all-machines view, `@aidev …` (or the displayed machine label) routes to
that machine's coordinator. `Enter` sends; `Tab` also starts agents on tasks the
message adds. This is explicit targeting, not automatic fleet load balancing.

Remote commands run through a noninteractive login shell, not `.zshrc`. Aidev's
machine-local `~/.zprofile` adds the existing user binary directories, including
`~/.local/bin` and `~/.npm-global/bin`, so both Projects and pi are found over SSH.
Check from each host:

```sh
herdr-projects machines
herdr-projects doctor
```

To update Herdr itself, use a shell outside Herdr. `herdr update --handoff` opts
into experimental live transfer; ordinary server stop/restart ends pane
processes. This rollout's backups and verification records are machine-local in
`~/.local/state/herdr/upgrades/20261016-projects-095/` (omarchy's external-SSH retry
also has a `-retry` directory). Verify both client and running server with
`herdr status --json`; replacing the binary alone does not upgrade the server.

### Model policy on all three machines

User-approved role defaults and standing coordinator policy are stored separately
on each machine in `~/.herdr-projects/settings/config.json`:

| Work | Exact agent selection | How selected |
| --- | --- | --- |
| Exploration/scouting and routine changes | `pi/cliproxy/minimax-m3.1-flash` | `worker.agent` default |
| Difficult debugging or substantial implementation | `pi/cliproxy/claude-sonnet-5-5` | Coordinator sets the task's worker |
| Implementation review | `pi/cliproxy/gpt-6-luna` | `reviewer.agent` default |
| Planning when warranted | `pi/cliproxy/claude-sonnet-5-5` | `plan.agent` default; coordinator enables planning per task |
| Coordinator chat | `pi/cliproxy/claude-sonnet-5-5` | `coordinator.agent`, independent of pi's global default |

`coordinator.instructions` contains the standing authorization to classify new
tasks and apply these exact choices before starting them, including tasks started
with `Tab`. Substantial implementation needing a plan uses task-scoped
`plan.approve=reviewer`; the global value remains `none`, so routine tasks do not
all get a planning step. Pure exploration/report requests use research-only tasks;
fixes do not become research-only merely because they need investigation first.

This is an agent-followed policy, not deterministic model routing, and it does not
force a separate scouting task for every request. Later explicit choices and
existing task/repo overrides are preserved. Inspect early delegations with
`herdr-projects show <id>` to confirm classification. Direct CLI task creation
inherits the worker default unless you supply an override; it bypasses coordinator
classification. All three catalogs list the approved models, but live inference
and classification were not exercised during setup.

The coordinator is explicitly pinned on all three machines with
`herdr-projects set coordinator.agent pi/cliproxy/claude-sonnet-5-5`; pi's global
default and all effort levels are unchanged. This default applies to the next
new coordinator, not an already-running chat. No coordinators or tasks were
started or restarted to apply these settings. Per-host settings backups are under
`~/.local/state/herdr/upgrades/projects-model-policy-<UTC timestamp>/` and
`projects-coordinator-sonnet-<UTC timestamp>/` in the same directory. Pulling
dotfiles alone does not provision these machine-local settings.

### Project directory and Offload guidance

The [fleet project directory](herdr-projects-directory.md) lists nine approved
projects by absolute path on each machine, with distinct `itastack-workspace`
and `itastack-app` lookup labels. These labels do not rename Projects repo keys
or existing tasks. Routing honors an explicit destination, otherwise the
board-selected machine or local execution machine; a missing checkout means ask,
not silently choose another host.

A separate marked block in `coordinator.instructions` points coordinators to
re-read the directory for each new task and defines the Offload boundary:
prep/sync use their skill gates, Projects owns ordinary board tasks, full
Offload dispatch is an explicitly requested alternative, and deployment requires
a separate request. The exact block is in the directory document.

Provisioning is machine-local: first sync and verify the document on all three,
then append that block through `herdr-projects set coordinator.instructions`
while preserving the existing instructions/model policy. Pulling dotfiles alone
does not apply it. Backups and before/after evidence live under
`~/.local/state/herdr/upgrades/projects-directory-<UTC timestamp>/`.
No task or coordinator restart is needed for saving the setting; this does not
prove that an already-running pi session has loaded the new guidance. No live
routing or Offload dispatch was exercised during this setup.

## herdr web ui on aidev (browser/phone client)

Installed 2026-10-16: the [herdr-web-ui](https://github.com/devswha/herdr-web-ui)
plugin on **aidev only**, which serves aidev's own herdr plus the machines in
aidev's `herdr machine list` (omarchy, itan8n) as Remote PCs over SSH. Nothing
for it lives in this repo; all of it is machine-local on aidev.

- **URL:** `https://100.95.230.15:7443` (NetBird). Type the `https://`: a bare
  `100.95.230.15:7443` makes the browser try plain HTTP, which the TLS port drops.
  The self-signed cert was made for dsh (retired) and still lives at
  `~/.dsh/dsh-tls.{crt,key}` (SAN `IP:100.95.230.15`, `CA:TRUE`). Keep those files
  or repoint the Caddyfile before removing `~/.dsh`.
- **TLS front:** user unit `~/.config/systemd/user/herdr-web-tls.service` runs
  Caddy (`~/.local/bin/caddy`, config `~/.config/herdr-web-tls/Caddyfile`) from
  `100.95.230.15:7443` to the app on `127.0.0.1:7317`. The app itself stays bound to
  loopback. It has to be a real HTTP proxy: a raw TLS tunnel (`socat`, tried first)
  sends no `X-Forwarded-Proto`, so the app's same-origin check rejects every
  browser POST, sign-in included, with `403 Use controls from this app`.
- **Auth:** `HERDR_WEB_TOKEN` is required for every client (loopback included), or
  pair a device in Settings → Phone & devices. The token lives in the plugin `env` file
  (`herdr plugin config-dir devswha.herdr-web-ui`, mode 600) along with
  `HERDR_WEB_TELEMETRY=0` and `HERDR_WEB_APP_NAME=aidev`.
- **Prerequisite:** Bun 1.4+ (`~/.bun/bin/bun upgrade`; `/usr/local/bin/bun` links to it).
- **Remote PCs:** omarchy and itan8n each need **Connect** in the UI once, which
  installs a loopback bridge there under `~/.config/herdr-web-ui`.
- Collie (the earlier phone UI) was unlinked and its `collie.service` removed.

## ccgram Telegram bridge on aidev and omarchy

Installed 2026-10-17: [ccgram](https://github.com/alexei-led/ccgram) 4.16.0, a
Telegram bot that maps each herdr pi agent to one Telegram topic. Messages typed
in a topic go into that agent's pane, like typing in the TUI; pi's replies come
back from its session file. Everything is machine-local; nothing for it lives in
this repo.

| Machine | Bot | Starts new topics in |
| --- | --- | --- |
| aidev | `@testywmLt2nDl0Qf2Q3bot` | `/home/james/testy-bot` |
| omarchy | `@itastackwmLt2nDl0Qf2Q3bot` | `/home/james/Documents/itastack` |

- **Install:** `uv tool install --python 3.14 ccgram` (uv fetches its own
  Python 3.14; aidev's system Python is 3.12). Binary: `~/.local/bin/ccgram`.
- **Config:** `~/.ccgram/.env` (mode 600): `TELEGRAM_BOT_TOKEN`, `ALLOWED_USERS`
  (numeric Telegram ID only; a username fails), `CCGRAM_MULTIPLEXER=herdr`,
  `CCGRAM_PROVIDER=pi`, `CCGRAM_INSTANCE_NAME`, `CCGRAM_HIDE_TOOL_CALLS=true`,
  `CCGRAM_AUTODELETE_DEAD_TOPICS=false`.
- **Service:** user unit `~/.config/systemd/user/ccgram.service` runs
  `ccgram run` with `Restart=always`. Its `WorkingDirectory` is where the
  folder picker for a new topic opens. The unit sets `PATH` so herdr, pi
  and ccgram are found. Linger is on for both machines. omarchy's bot answers
  only while the laptop is awake.
- **One bot per machine.** Telegram allows one poller per token, and a bot
  with a webhook cannot be polled at all. The first bot tried
  (`@testytechn8n_bot`) has a webhook (likely n8n) and was left alone.
- **Topics:** the bot needs Threaded Mode, which exists only in the BotFather
  Mini App (search BotFather, tap **Open** → bot → Bot Settings), not in the
  `/mybots` text menu. Check it with `getMe` → `has_topics_enabled`.
- **pi needs no ccgram hook.** herdr reports `herdr-agent-state.ts` as its pi
  integration (`herdr integration status`), and ccgram reads the session
  through herdr. Don't run `herdr integration install pi` over it. The
  doctor's "Claude hook missing" line is irrelevant.
- **Topic names** are `Pi ▸ <workspace> ▸ <tab> ▸ <pane>` from herdr labels;
  rename the herdr workspace/tab to change them (`herdr workspace rename`,
  `herdr tab rename`). Skipping the workspace step in `/new` creates a
  workspace named after the folder.
- **`ccgram status` always says `(unbound)` on herdr.** It reads only the
  legacy `thread_bindings` key in `~/.ccgram/state.json`; bindings live in
  `chat_thread_bindings`. Display bug in 4.16.0, not a broken binding.
- **Topics are kept when a session looks dead.** With the default
  auto-delete, ccgram deleted topics (and their history) whenever a herdr
  session briefly vanished or reappeared under a second target ID. On
  2026-10-17 one omarchy pi session got two IDs with the same session file,
  and its topics were deleted and recreated. Ended agents' topics now stay
  until deleted by hand or via `/sync`; the `/sessions` **Kill** button still
  deletes its topic.

### Delivery stall (upstream issue #302)

On aidev, replies stopped reaching Telegram at 03:43 on 2026-10-17 while input
still reached pi. Topic icons kept updating. The log showed `Delivery wedge
suspected: transcript growing, watermark frozen`. A restart did not clear it:
ccgram re-parsed and queued the backlog but sent nothing and logged no error.
Telegram accepted a direct `sendMessage` to the topic, so the stall was inside
ccgram. This matches the open upstream issue
[#302](https://github.com/alexei-led/ccgram/issues/302) (root cause unknown).

Recovery, from upstream [#245](https://github.com/alexei-led/ccgram/issues/245):
stop the service, back up `~/.ccgram/monitor_state.json`, set each stuck
session's `last_byte_offset` to its transcript's file size, start the service.
The skipped output never reaches Telegram but stays in the pane and session
file. Tool calls are now hidden on both machines to cut the traffic.
