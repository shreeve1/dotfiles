---
name: omp-config
description: >
  Configure oh-my-pi (omp) — model routing, appearance, behavior, and extensions —
  in a way that stays synced across devices via this dotfiles repo. USE WHEN the user
  wants to configure omp / oh-my-pi, set omp model roles (default/smol/slow/vision/plan/
  commit/task), change omp settings, add or vendor an omp extension/plugin, enable omp
  vision/inspect_image, or troubleshoot omp extensions not loading. Docs:
  https://github.com/can1357/oh-my-pi
---

# omp-config

Configure **oh-my-pi (omp)** — a hard fork of the `pi` coding agent. Keep all
changes synced across devices through this dotfiles repo.

**Upstream docs:** https://github.com/can1357/oh-my-pi (fetch it for the latest
schema; omp moves fast and `omp config list` / `omp --help` are authoritative for
the installed version).

## Dotfiles / symlink architecture (READ FIRST)

omp's config dir is `~/.omp/agent/`. Only **portable** files are synced; runtime
churn stays machine-local.

| Path | Synced? | How |
|------|---------|-----|
| `~/.omp/agent/config.yml` | ✅ | symlink → `~/dotfiles/.omp/agent/config.yml` |
| `~/.omp/agent/models.yml` | ✅ (when present) | symlink; declares custom providers / routing |
| `~/.omp/agent/extensions/` | ✅ | symlink → `~/dotfiles/.omp/agent/extensions/` |
| `~/.omp/agent/*.db*`, `sessions/`, `terminal-sessions/`, `logs/`, `gpu_cache.json` | ❌ | machine-local runtime (`gpu_cache.json` caches the local GPU — never sync) |

Wiring lives in the repo:
- `install.sh` → `link_path ".omp/agent/config.yml"`, `link_path ".omp/agent/extensions"`,
  and a per-extension `npm install --omit=dev --omit=peer` loop.
- `.gitignore` → omp block allowlists `config.yml`, `models.yml`, `extensions/`
  and ignores `extensions/**/node_modules/`.

**`omp config set` writes straight into the symlinked `config.yml`, so it syncs
automatically.** After any change: `cd ~/dotfiles && git add .omp && git commit`.

> Note: `config.yml` also holds omp-managed keys (`lastChangelogVersion`,
> `setupVersion`) that omp rewrites on update — expect occasional no-op churn in
> diffs across machines. Harmless; don't fight it.

## Changing settings

```bash
omp config list                 # all keys + current values (authoritative)
omp config get <key> --json     # one value
omp config set <key> <value>    # writes to the synced config.yml
omp config path                 # config dir
```

**Gotchas (learned the hard way):**
- **Record-type keys** (`modelRoles`, `retry.fallbackChains`, `modelTags`, …) cannot
  be set by dotted subkey. `omp config set modelRoles.default X` → "Unknown setting".
  Set the whole record as JSON:
  ```bash
  omp config set modelRoles '{"default":"zai/glm-5.1","plan":"openai-codex/gpt-5.5"}'
  ```
- The **`extensions`** config array does NOT use a `-` prefix to disable (that's
  pi/legacy syntax — omp treats `-extensions/...` as a literal path and fails with
  ENOENT). To disable a discovered extension, use the **`disabledExtensions`** array.

## Model routing

Roles: `default`, `smol`, `slow`, `vision`, `plan`, `designer`, `commit`, `task`.
Unset roles fall back to `default`.

```bash
omp --list-models                       # all models, provider/model form
omp --list-models <fuzzy>               # check a specific id resolves
omp config set modelRoles '{ ... }'     # provider/model values, e.g. "zai/glm-5.1"
omp config get cycleOrder --json        # Ctrl+P cycle order (default smol,default,slow)
```

**Vision:** the `inspect_image` tool resolves `modelRoles.vision` first and the model
must support image input. To enable:
```bash
omp config set inspect_image.enabled true
omp config set modelRoles '{ ... , "vision":"openai-codex/gpt-5.5"}'   # image-capable model
```

## Adding an extension (vendor + sync workflow)

omp natively discovers extensions from `~/.omp/agent/extensions/` (and project
`.omp/extensions/`). It reads the `omp` **or** `pi` manifest key in each
`package.json`, and its `legacy-pi-compat` plugin aliases the
`@earendil-works/*`, `@mariozechner/*`, and `@oh-my-pi/*` scopes (plus a
`@sinclair/typebox` shim) to its bundled packages — so most `pi` extensions load.

Steps:
1. Copy source (NOT node_modules) into the repo:
   ```bash
   rsync -a --exclude node_modules --exclude .git \
     <src>/ ~/dotfiles/.omp/agent/extensions/<name>/
   ```
   Scoped packages go under `extensions/@scope/<name>/`.
2. The dir symlink + deps are handled by `install.sh` (it runs npm at the
   extensions **root** for shared deps, then in **each** extension dir). To do it
   manually:
   ```bash
   ln -s ~/dotfiles/.omp/agent/extensions ~/.omp/agent/extensions       # once
   cd ~/dotfiles/.omp/agent/extensions && npm install --omit=dev         # shared root deps (typebox)
   cd ~/dotfiles/.omp/agent/extensions/<name> && npm install --omit=dev --omit=peer
   ```
   Peer deps on the `pi-*` scopes are satisfied by the omp runtime, so omit them.
   Shared unscoped deps (e.g. `typebox`, a real dep of `@juicesharp/rpiv-config`)
   live in `extensions/package.json` and resolve to siblings via upward
   node_modules lookup. **Install them WITHOUT `--omit=peer`** (they are real
   deps there, not pi-* peers) — and note the per-extension loop's globs require
   a subdirectory, so the root `extensions/package.json` must be installed
   separately (install.sh does this explicitly).
3. Verify, then commit.

**Compatibility gotchas when porting `pi` extensions to omp (fork API drift):**
- A missing **named export** (`Export named 'X' not found`) means omp renamed/removed
  it. Find the equivalent in the bundled package and patch the import. Examples seen:
  `getSupportedThinkingLevels` → `getSupportedEfforts`; `formatSize` → `formatBytes`.
- **`import.meta.url`-relative file reads break.** omp relocates extension modules to
  a temp dir (`/tmp/omp-legacy-pi-file/...`), so `readFileSync(new URL("./x", import.meta.url))`
  ENOENTs. Inline the resource as a string literal instead.
- Prefer dropping an extension when omp ships a built-in equivalent (`todo_write`,
  `web_search`/`web_fetch`, `ask`).

## Verify changes

```bash
cd /tmp && omp -p --no-session --no-title "Reply with exactly: OK"
# then check the day's log for load failures:
LOG=~/.omp/logs/omp.$(date +%Y-%m-%d).log
grep "Failed to load extension" "$LOG" | tail
```
Confirm git tracks only source (no node_modules):
```bash
cd ~/dotfiles && git add -n .omp | grep -c node_modules   # must be 0
```
Confirm shared `typebox` resolves for an extension that needs it (after install):
```bash
node -e "console.log(require.resolve('typebox',{paths:['$HOME/.omp/agent/extensions/rpiv-advisor']}))"
```

## Bundled subcommands worth knowing

`omp config`, `omp plugin` (install/link/list/doctor/disable), `omp setup`,
`omp agents unpack`, `omp stats`, `omp tiny-models`, `omp completions`. Run
`omp <cmd> --help` for specifics on the installed version.
