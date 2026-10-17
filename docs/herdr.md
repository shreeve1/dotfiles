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

## How the three machines connect (recorded 2026-10-16)

Every machine runs its own `herdr server` (aidev's since 2026-09-21, itan8n's
since 2026-09-22, both herdr-managed, not systemd), holding that machine's
workspaces and pi agents. A herdr client on any machine reaches the other two
through its saved machines: herdr runs `ssh -T <alias> … herdr
remote-client-bridge` with its own ControlMaster socket, `BatchMode=yes` and
`StrictHostKeyChecking=yes`, so each alias needs working key auth and a known
host key. The user usually reaches a machine's herdr over mosh
(`exec herdr --session default`).

The live machine lists differ per machine; the repo seed is only omarchy's:

| Machine | herdr | Saved machines (label → alias) |
| --- | --- | --- |
| omarchy | 0.9.5 | `aidev` → `aidev`, `n8n` → `itan8n` |
| aidev | 0.9.5 | `omarchy laptop` → `omarchy`, `n8n` → `itan8n` |
| itan8n | 0.9.5 | `aidev · default` → `aidev`, `omarchy laptop` → `omarchy`; stale `n8n` self-entry disabled |

All sessions are `default`. Agents are pi panes; pi reports state and session to
herdr through `~/.pi/agent/extensions/herdr-agent-state.ts` (synced, so present
on all three).

`~/.config/herdr/config.toml` leaves `[remote] manage_ssh_config` at its default
(true), which lets herdr add `ServerAliveInterval` fallbacks to `~/.ssh/config`;
this machine currently has no herdr-managed entries there.

## Herdr Projects on all three machines

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
| Exploration/scouting and routine changes | `pi/cliproxy/minimax-m3` | `worker.agent` default |
| Difficult debugging or substantial implementation | `pi/cliproxy/claude-sonnet-5-5` | Coordinator sets the task's worker |
| Implementation review | `pi/cliproxy/gpt-6-luna` | `reviewer.agent` default |
| Planning when warranted | `pi/cliproxy/claude-sonnet-5-5` | `plan.agent` default; coordinator enables planning per task |

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

The coordinator itself remains `pi` on pi's own default model; effort levels are
unchanged. Settings apply when the relevant agent next starts, not mid-run. No
coordinators or tasks were started or restarted to apply this policy. Per-host
settings backups are under
`~/.local/state/herdr/upgrades/projects-model-policy-<UTC timestamp>/`. Pulling
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
