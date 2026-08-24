# DeepSeek Harness (dsh) — homelab deployment on `aidev`

Reference for the self-hosted DeepSeek Harness web UI running on `aidev`
(`10.20.20.16`), reachable over the netbird tailnet at
`https://100.95.230.15:3080`. Written after the initial install so future-me can
diagnose it without re-deriving everything. Versions at time of writing:
`@deepseek-ai/dsh` **0.1.1-rc.2**, `dsh-full-remote` plugin **0.3.7**.

## TL;DR — how to reach it

- **URL:** `https://100.95.230.15:3080` (netbird) — also bound only to that IP.
- **Cert:** self-signed (SAN `IP:100.95.230.15`); the browser warns once, click
  through. Accept the "Internal Testing Notice" modal once too.
- **Auth:** a token login page (the `dsh-full-remote` plugin). The token IS the
  password. It lives in `~/.dsh/reverse-proxy.json` (`accessToken`, mode 600).
  Loopback (`http://127.0.0.1:3080`) is exempt — no token needed on the box.
- **Rotate token:** Settings -> Reverse proxy -> Rotate token, or
  `curl -s -X POST -H 'x-dsh-reverse-proxy-control: 1' http://127.0.0.1:3080/dsh-reverse-proxy/rotate-token`.

## Architecture (why it is shaped like this)

```
phone/laptop --HTTPS--> 100.95.230.15:3080  (dsh-full-remote plugin: TLS + token auth + Host/Origin rewrite)
                               |
                               +--> 127.0.0.1:3080  (dsh backend, plain loopback)
```

dsh deliberately binds its web server to loopback and gates its
configuration/secrets plane (settings, credentials, model providers, agent
presets) behind a **loopback-only check** — enforced twice:

1. **Server fence** — an inner `/api` fence 403s privileged methods
   (`settings.*`, `credentials.*`, `llm.discoverModels`, `host.pickDirectory`,
   `agentPreset.*`) unless the `Host` header is loopback. Source:
   `@deepseek-ai/dsh-host-apiproxy` PRIVILEGED_METHODS.
2. **Client gate** — the browser bundle computes `isLoopbackHostname(location.hostname)`
   (`@deepseek-ai/dsh-client-connection/src/loopback-hostname.ts`); a non-loopback
   hostname makes the Settings UI refuse to load ("settings unavailable in
   browser"). This is client-side, keyed on the address bar only.

Also: `dsh web --host 0.0.0.0` is **intentionally rejected** at startup
(RCE-safety; source `packages/bundle/web-app/src/startup.ts`), and only
`127.0.0.1` / `0.0.0.0` are accepted as the webserver host (a specific LAN IP is
rejected by config validation). So exposing the config plane remotely requires a
reverse proxy that rewrites `Host`/`Origin` to loopback AND a shim for the
client gate. The `dsh-full-remote` plugin does exactly that, and adds token
auth on top. We use it instead of a hand-rolled proxy + bundle patch because it
survives dsh upgrades and is authenticated.

Browsing over plain **http** to a non-localhost IP also breaks the client:
`crypto.randomUUID` / WebSockets are only available in a **secure context**
(HTTPS or `http://localhost`). Hence TLS is mandatory for remote access, not
optional.

## What runs where

- **systemd user service** `dsh-web.service` (enabled, linger on) runs
  `dsh web --host 127.0.0.1 --port 3080 --no-open`. Unit:
  `~/.config/systemd/user/dsh-web.service`. API keys come from an
  `EnvironmentFile` (`~/.dsh/dsh-web.env`, mode 600).
- **The reverse proxy is NOT a separate service** — it is the `dsh-full-remote`
  plugin running *inside* dsh, with `autoRestore: true`, so it comes back on
  reboot with the web service. No `dsh-netbird-proxy` service anymore.

## Sidebar workbench & plugins (`profiles/web`)

The web profile's plugin set lives in `~/.dsh/profiles/web/package.json`:
`dependencies` (what pnpm installs) **and** `dsh.profile.bundles` (the ordered
mount list cordis actually loads). `dsh plugin --profile web add <spec>`
coordinates both; a plugin missing from `bundles` won't load even if installed.

**Sidebar stack: `dsh-better-sidebar`** (npm, `node-pty` native dep). This is a
full VSCode-style workbench — file explorer + CodeMirror editor/viewers,
embedded browser, real terminal (xterm + node-pty), Git panel, background-tasks/
subagent page, side chat. It exposes `ctx.betterSidebar` (`registerTab` /
`registerFileViewer`) that the ecosystem plugins below register against, so it
**must come before them in `bundles`**.

- It **replaced the `dock-*` family** (`dock-base`/`-editor`/`-files`/`-git`,
  the old `ctx.workbench` dock). Running both = two docks / duplicate-loader
  conflicts. Those four are removed from both `dependencies` and `bundles`.
- Install dance (pnpm 11 blocks `node-pty`'s build script on first `add`):
  `add dsh-better-sidebar@latest` (fails) → `cd ~/.dsh/profiles/web &&
  pnpm approve-builds --all` → `add` again (succeeds). If the terminal later
  complains "node-pty failed to load", re-run `pnpm approve-builds --all &&
  pnpm rebuild node-pty` in the profile dir.

**Ecosystem plugins registered via `ctx.betterSidebar`** (each ordered *after*
`dsh-better-sidebar`; client changes hot-load, so hard-refresh the browser after
install — no restart needed unless a host half changed):

| Plugin | Source spec | Adds |
|---|---|---|
| `dsh-file-review-tab` | npm | "File Review" tab: per-turn line-level diffs + undo |
| `dsh-media-preview` | `github:tsonglew/dsh-media-preview` | audio/video FileViewer, HTTP Range streaming |
| `dsh-workspace-search` | `github:tsonglew/dsh-workspace-search` | VSCode-style "Search" tab (glob/regex, name+content). README's `./plugins/...` path is wrong for us — use the `github:` spec |
| `dsh-md-annotator` | `github:3361805598-gif/dsh-md-annotator` | per-block/text-range `.md` annotations → structured revision text into chat |

- **`dsh-md-annotator` takes over `.md` preview** while enabled (built-in
  Markdown edit mode is suspended; toggle it off in *Settings → Side Cards* to
  restore). UI is Chinese-only. Installed from the `github:` source (prebuilt
  `lib/` is committed); a SHA-256-pinned release tarball via `vendor/` is the
  alternative (see its README).
- After adding any of these, verify none got auto-disabled: check
  `cordis.patch.yml` for a fresh `auto-disabled by dsh-startup-guard` entry (see
  the dsh-diagram note in Gotchas). A clean load leaves no new `disabled: true`.

## Key files (`~/.dsh/`)

| Path | What | Mode |
|---|---|---|
| `dsh-web.env` | `CLIPROXY_API_KEY`, `DEEPSEEK_API_KEY` (referenced by settings.yaml `apiKeyEnv`) | 600 |
| `settings.yaml` | model providers (cliproxy + deepseek), hot-reloaded; same file the Models UI writes | 600 |
| `dsh-tls.crt` / `dsh-tls.key` | self-signed cert, SAN=IP:100.95.230.15, 10y | key 600 |
| `reverse-proxy.json` | plugin state: `accessToken`, `enabled`, device sessions | 600 |
| `profiles/web/cordis.patch.yml` | plugin config override (listenHost/port, TLS paths, backend) | - |
| `profiles/web/node_modules/dsh-full-remote/` | the installed plugin | - |

## Model providers

Two providers, mirroring the omp `~/dotfiles/.omp/agent/models.yml` setup, both
`openai-completions`, defined in `~/.dsh/settings.yaml` under the
`llm-pi-ai:` section:

- **cliproxy** — `http://10.20.20.16:8317/v1`, key `CLIPROXY_API_KEY`,
  `compat.cacheControlFormat: anthropic`. Models: claude-opus-4-8, claude-opus-5,
  claude-sonnet-4-6, claude-fable-5, claude-haiku-4-5.
- **deepseek** — `https://api.deepseek.com`, key `DEEPSEEK_API_KEY`, model
  deepseek-v4-flash.

dsh stores API keys as `apiKeyEnv` *references*, never literals; resolution
order is process env (our EnvironmentFile) then `~/.dsh/.credentials.yaml`. Add
more providers from Settings -> Models (writes settings.yaml, hot-reloaded, no
restart), or by editing settings.yaml directly.

## Common operations

```sh
# status / logs (user services need the runtime dir)
export XDG_RUNTIME_DIR=/run/user/$(id -u)
systemctl --user status dsh-web.service
journalctl --user -u dsh-web.service -f
systemctl --user restart dsh-web.service          # picks up settings.yaml/env changes

# reverse-proxy plugin control (loopback only; header is required)
H='x-dsh-reverse-proxy-control: 1'; B=http://127.0.0.1:3080/dsh-reverse-proxy
curl -s -H "$H" $B/status | python3 -m json.tool     # running? listen? tls? backend?
curl -s -X POST -H "$H" $B/self-check                # fence probe: settings.describe -> 200?
curl -s -X POST -H "$H" $B/rotate-token             # new token, revokes all sessions

# read current token
python3 -c "import json;print(json.load(open('$HOME/.dsh/reverse-proxy.json'))['accessToken'])"

# upgrade dsh
npm install -g @deepseek-ai/dsh && systemctl --user restart dsh-web.service

# upgrade the plugin
dsh plugin --profile web add dsh-full-remote && systemctl --user restart dsh-web.service
```

## Gotchas / troubleshooting

- **"settings unavailable in browser" / "provider directory failed":** the
  client loopback gate is blocking the Settings UI. Means you are reaching dsh
  WITHOUT the plugin's rewrite (e.g. hit the backend directly, or the plugin
  stopped). Check `curl -s -H 'x-dsh-reverse-proxy-control: 1' http://127.0.0.1:3080/dsh-reverse-proxy/status`
  shows `running: true`; `self-check` fence should be `ok: true`.
  NOTE: an old sidebar SESSION whose title is literally "Loading the provider
  directory failed..." is just a stale chat name from the pre-fix era, not a
  live error — delete it.
- **Blank page / `crypto.randomUUID is not a function`:** you are on plain HTTP
  to a non-localhost IP (not a secure context). Use the `https://` URL.
- **Crash loop `ELOOP: too many symbolic links ... orca-help`:** a circular
  symlink in the dotfiles skill dirs crashed dsh's skill-filesystem watcher.
  Fixed in dotfiles commit `b8de7ab` (orca-help/orca-cli restored from real
  files). If it recurs after an `orca reinstall` regenerates `~/.agents/skills`,
  re-run that fix — the generator recreates self-referential symlinks.
- **Upgrade broke remote access:** dsh upgrades can overwrite bundle internals.
  The plugin uses a runtime proxy (not node_modules patches) so it usually
  survives, but if the fence self-check fails after an upgrade, check the
  plugin's compatibility note / reinstall it.
- **Crash loop `duplicate loader entry id: storage`:** caused by
  `dsh-background-agents@0.5.6` — its `cordis.patch.yml` re-inserts the
  `storage` / `storage-json` / `storage-domain` loader rows already owned by
  `@deepseek-ai/dsh-web-app`, and cordis-plugin-loader's `EntryGroup.update`
  throws on duplicate ids. Fix: remove the plugin (`dsh plugin --profile web
  remove dsh-background-agents`) AND drop its entry from `dsh.profile.bundles`
  in `~/.dsh/profiles/web/package.json`. `dsh plugin remove` alone is
  *not* sufficient if you ever installed manually — always verify both.
- **Forgot the token:** `cat ~/.dsh/reverse-proxy.json` (loopback/on-box), or
  rotate a new one.
- **Disable remote access entirely:** stop the proxy via
  `curl -s -X POST -H 'x-dsh-reverse-proxy-control: 1' http://127.0.0.1:3080/dsh-reverse-proxy/stop`;
  the loopback UI still works.

## Security posture

The plugin deliberately exposes dsh's config/secrets plane (and thus
code-execution capability) to any token-holding client on the netbird tailnet.
That is the intended tradeoff. Auth is a 192-bit CSPRNG token + per-device
session cookies (HttpOnly, SameSite=Strict, Secure, 30d), constant-time compare,
per-IP login lockout. It is authorization, not a substitute for network trust —
keep it on the tailnet, not the public internet. Reviewed the plugin source
before install (no phone-home; only outbound is the optional, unused cloudflared
tunnel + the loopback proxy).
