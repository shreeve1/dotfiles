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

Machine list as recorded on 2026-09-25:

| Label | Target (SSH alias) | Session | Enabled |
| --- | --- | --- | --- |
| `aidev · default` | `aidev` | `default` | yes |
| `n8n` | `itan8n` | `default` | yes |

`~/.config/herdr/config.toml` leaves `[remote] manage_ssh_config` at its default
(true), which lets herdr add `ServerAliveInterval` fallbacks to `~/.ssh/config`;
this machine currently has no herdr-managed entries there.
## herdr web ui on aidev (browser/phone client)

Installed 2026-10-16: the [herdr-web-ui](https://github.com/devswha/herdr-web-ui)
plugin on **aidev only**, which serves aidev's own herdr plus the machines in
aidev's `herdr machine list` (omarchy, itan8n) as Remote PCs over SSH. Nothing
for it lives in this repo; all of it is machine-local on aidev.

- **URL:** `https://100.95.230.15:7443` (NetBird). The self-signed cert is the one
  dsh uses (`~/.dsh/dsh-tls.{crt,key}`, SAN `IP:100.95.230.15`).
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
