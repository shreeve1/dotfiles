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
   this repo). Confirm with `ssh -G itan8n | head -3`, which prints the resolved
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
herdr machine add --label "n8n" --remote-session default itan8n
```

## Current migration topology (2026-10-31)

Wrk's Ubuntu WSL now hosts the production NetBird server/dashboard, CLIProxy,
Durable Pi, durable-bot, Hermes media, chat API, Mallory and the homelab alert
router/dispatcher. Windows still runs wrk's NetBird client. NetBird's public
hostname goes through NPMplus to wrk LAN `10.20.20.10`; integrated relay and
external STUN passed after James disabled the USB tether. Re-enabling it can
restore competing default routes; dual-WAN routing is not yet solved. Do not
change routes without approval. Details and recovery hazards are in
`memory/docs/workstation/wrk-wsl-port-exposure.md`.

Aidev was decommissioned on 2026-11-01 and is powered off; do not route to it.
Wrk's unattended pre-sign-in WSL startup and independent backup/restore are
unproven. The old migration plan lives in gitignored
`plans/2026-10-31-aidev-to-wrk-migration.md`; verify live state before changes.

## How the machines connect

Every Linux-side machine runs its own `herdr server` (itan8n's since
2026-09-22, herdr-managed, not systemd; the wrk desktop's
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
| wrk (WSL2) | 0.9.5 | `n8n` → `itan8n` (checked 2026-11-01) |
| itan8n | 0.9.5 | stale `aidev · default` → `aidev`; disabled `n8n` self-entry (checked 2026-11-01) |
| surftop | 0.9.5 (Windows) | `Desktop WSL` → `desktop-wsl`, `aidev · default` → `aidev`, `n8n` → `n8n` (snapshot 2026-10-21; surftop offline 2026-11-01) |

The `aidev` entries on itan8n and surftop point at the retired machine; remove
them with `herdr machine` on each machine when convenient.

All sessions are `default`. Agents are pi panes; pi reports state and session to
herdr through `~/.pi/agent/extensions/herdr-agent-state.ts` (synced, so present
on all Linux machines).

`~/.config/herdr/config.toml` leaves `[remote] manage_ssh_config` at its default
(true), which lets herdr add `ServerAliveInterval` fallbacks to `~/.ssh/config`;
this machine currently has no herdr-managed entries there.

## herdr web UI (wrk WSL)

Installed 2026-10-31: `devswha.ovis` serves wrk's existing WSL herdr on
`127.0.0.1:7317`; its token is in the mode-600 plugin env at
`~/.config/herdr/plugins/config/devswha.ovis/env`. Caddy's enabled user unit
`herdr-web-tls.service` proxies HTTPS on `100.95.235.60:7443` to loopback using
`~/.config/herdr-web-tls/Caddyfile` and a self-signed certificate for that IP.

URL: `https://100.95.235.60:7443` (type the `https://`; the TLS port drops plain
HTTP). This is the only herdr web UI. The earlier one on aidev and the ccgram
Telegram bridge were retired with aidev on 2026-11-01. Checked 2026-11-01: the
unit is active, Caddy listens on `100.95.235.60:7443`, the app on
`127.0.0.1:7317`, and the URL answers HTTP 200. LAN access and WSL startup
before Windows sign-in remain untested. No NPMplus or firewall changes were
needed for the mesh path.
