# DeepSeek Harness (dsh) — homelab deployment on `aidev`

Reference for the self-hosted DeepSeek Harness web UI running on `aidev`
(`10.20.20.16`), reachable over the netbird tailnet at
`https://100.95.230.15:3080`. Written after the initial install so future-me can
diagnose it without re-deriving everything. Versions at time of writing:
`@deepseek-ai/dsh` **0.1.1-rc.2**, `dsh-full-remote` plugin **0.3.7**.

> **Plugin inventory last reconciled against the live box: 2026-08-27.** The web
> profile now bundles **24** non-builtin plugins (live cross-check count). If you
> touch the plugin set, re-run the cross-check in *Auditing the plugin set* and
> update the table.
>
> **Table drift note (2026-08-28):** the numbered table is approximate — treat
> the live `python3` cross-check in *Auditing the plugin set* as authoritative,
> not the row numbers here. Known drift: `dsh-pilot` (row 7) was
> **reinstalled 2026-08-28** at v0.7.1 / pin `#dff236a` (the previously
> documented pin `#9103a2d` / v0.4.1 no longer exists on the remote — the
> upstream repo was rewritten) and is now live-bundled again with a
> hand-applied English cockpit-panel i18n patch; `@liustack/modsearch`
> (row 12) remains **not in the live `bundles`**; `dsh-diagram` was
> `dsh-startup-guard` due to the false-positive template-literal id regex bug;
> its use case is now covered by `@changfenhuang/dsh-genui`'s `render_ui`); the
> 15-plugin `@dsh-pro` suite was **removed** (the `@dsh-pro/updates` watcher
> kept re-adding bundle rows and re-triggering `duplicate loader entry id`
> boot crashes); `dsh-client-auto-continue`, `dsh-mini-advisor`, and
> `dsh-fusion` are the current newest additions.

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

## Plugins (`profiles/web`)

The web profile's plugin set lives in `~/.dsh/profiles/web/package.json`:
`dependencies` (what pnpm installs) **and** `dsh.profile.bundles` (the ordered
mount list cordis actually loads). `dsh plugin --profile web add <spec>`
coordinates both; a plugin missing from `bundles` won't load even if installed.
`bundles` is order-sensitive: a plugin that registers an extension point must
come before the plugins that register against it.

### Full bundled inventory (25 live-bundled; 26 rows below, 1 historical, in mount order)

`@deepseek-ai/dsh-base` and `@deepseek-ai/dsh-web-app` are the two
installation-owned base bundles and lead the list; the 26 rows below follow (25
are live-bundled — row 12 is historical, see the footnote).

| # | Plugin | Ver | Source spec | What it adds |
|--:|---|---|---|---|
| 1 | `dsh-ponytail-skills` | 0.1.3 | `github:gongyijie85/dsh-ponytail` | 6 ponytail "lazy senior dev" skills |
| 2 | `dsh-full-remote` | 0.3.7 | npm | token-gated TLS reverse proxy (remote access — see above) |
| 3 | `dshmarket` | 1.20.2 | npm | in-app visual plugin market (browse/search/one-click install) |
| 4 | `dsh-hot-reload` | 0.2.4 | `github:stuarthu/dsh-hot-reload#006d915` | live-reload upgraded plugins without restarting dsh |
| 5 | `dsh-startup-guard` | 1.0.0 | `github:aokamoaki/dsh-startup-guard#82cead8` | boot-time guard: repairs session logs, auto-disables broken bundles (see Gotchas) |
| 6 | `dsh-cc-skills` | 0.1.0 | npm | loads Claude Code `.claude/` skills/commands/rules (project + `~/.claude`) into dsh |
| 7 | `dsh-pilot` | 0.7.1 | `github:guo6x/dsh-pilot#dff236a` | browser automation: drives Edge/Chrome over CDP from chat (`pilot_*` tools). Reinstalled 2026-08-28 (pin `#9103a2d` / v0.4.1 no longer on the remote — repo rewritten); vendored `lib/client.js` carries a hand-applied English i18n patch for the cockpit panel (12 strings), lost on any reinstall/upgrade — see *ui-translate boundary* below |
| 8 | `dsh-plugin-hooks` | 0.1.1 | `github:truelove-dreamer/dsh-plugin-hooks#6cf763e` | Claude-Code-style lifecycle shell hooks |
| 9 | `@moonquake2004/dsh-doctor` | 0.4.3 | `github:moonquake2004/dsh-doctor#path:/plugin` | offline diagnostic (28+ built-in checks across env/profile) |
| 10 | `dsh-smart-restart` | 0.5.1 | `github:edusrez/dsh-smart-restart#bde38b3` | detects service restart, wakes the interrupted session (`smart_restart` tool) |
| 11 | `@liustack/modlens` | 3.24.0 | npm | plug-in vision for text-only LLMs (`modlens_read_image`) |
| 12 | `@liustack/modsearch` | 5.9.0 | npm | web + X search and page reading (`web_search` / `x_search` / `read_page`) |
| 13 | `dsh-status-rotator` | 0.6.6 | npm | rotates the chat turn-status label through custom phrases |
| 14 | `@tecfancy/dsh-mobile` | 0.1.7 | npm | mobile shell adapter (overlay drawers, responsive composer) |
| 15 | `dsh-better-sidebar` | 0.15.2 | npm | VSCode-style workbench (explorer/editor/terminal/git/browser). Exposes `ctx.betterSidebar`; **must precede its ecosystem plugins** (17-20) |
| 16 | `dsh-file-review-tab` | 0.1.2 | npm | "File Review" tab: per-turn line-level diffs + undo |
| 17 | `dsh-media-preview` | 0.1.0 | `github:tsonglew/dsh-media-preview` | audio/video FileViewer, HTTP Range streaming |
| 18 | `dsh-workspace-search` | 0.1.0 | `github:tsonglew/dsh-workspace-search` | VSCode-style "Search" tab. README's `./plugins/...` path is wrong for us — use the `github:` spec |
| 19 | `dsh-md-annotator` | 0.6.0 | `github:3361805598-gif/dsh-md-annotator` | per-block/text-range `.md` annotations → revision text into chat |
| 20 | `@changfenhuang/dsh-genui` | 0.9.2 | npm | interactive GenUI components rendered inline in replies (`render_ui`). Excluded from startup-guard — see Gotchas |
| 21 | `dsh-ui-translate` | link | `link:~/.dsh/plugins-src/dsh-ui-translate` | browser-local OPUS-MT translator (see boundary note below) |
| 22 | `dsh-plugin-guide` | 0.2.0 | `github:PerryLink/dsh-plugin-guide` | registers the `dsh-plugin-guide` skill (plugin-dev knowledge base) + ships the `dsh-plugin-dev` CLI. Has a `prepare` build, so needs an `allowBuilds` key |
| 23 | `@omdsh-dev/dsh-plugin-check` | 0.1.0 | `github:omdsh-dev/dsh-plugin-check` | `plugin_check` tool: read-only plugin-repo diagnosis (manifest / patch / build traps / hub registration) |
| 24 | `dsh-client-auto-continue` | 0.8.1 | `github:HsiangNianian/dsh-auto-continue` | dual host+client Web-UI plugin: auto-sends "继续" when a request is interrupted by network/non-human causes. Settings card (loop-guard, adaptive backoff, per-session pause). Repo name (`dsh-auto-continue`) differs from the npm package name (`dsh-client-auto-continue`) |
| 25 | `dsh-goal-keeper` | 0.3.1 | `file:~/.dsh/plugins-src/dsh-goal-keeper` | goal-keeper (formerly `dsh-mini-advisor`): a second model reviews each turn, drives the native DSH goal (create/update/**complete**) and merges todo tasks, and injects weighable advice. Settings namespace pinned to legacy `dsh-mini-advisor` key. `file:`-installed; prebuilt `lib/` (prepare falls back to it) |
| 26 | `dsh-fusion` | 0.1.13 | `file:~/.dsh/plugins-src/dsh-fusion` | Fusion orchestration mode: shrinks the orchestrator to read/delegate/coordinate + injects orchestration guidance; now also carries a `tools/post-execute` empty-output fallback (replaces dsh-subagent tool-call-only output with a non-empty placeholder so the orchestrator never sees `(no output)`); adds job_output/job_list to the orchestrator allowlist (non-blocking peek at bash/background-mode jobs) plus a liveness check-in guidance paragraph (list_agents + send_message for continuable role subagents, which are not jobs); adds read-only peek_subagent (per-child model triangulation + activity tail) and verify_subagent_models (audits that each role subagent is on its assigned model — mismatch = pin didn't take) tools. `file:`-installed; `prepare` is `tsdown` (needs an `allowBuilds` key if reinstalled from a non-built source) (peek tools mounted as a child plugin `dsh-fusion-peek-tools` with its own inject: tools/agents/sessions/subagents). (0.1.11: always-on Fusion ON/OFF orchestrator marker + child fusion-delegation context injected into every continuable subagent via registerContinuableSetup, incl. the one-line-summary contract). 0.1.12: prompt review — deduped the one-line-summary contract to FUSION_CHILD_CONTEXT, dropped the redundant [FUSION MODE ACTIVE] header (the always-on Fusion ON/OFF marker covers it), added a pilot_*/web-search delegation note, merged the two monitoring paragraphs into one, and refreshed the pre-execute denial message to list the allowed read/observe tools. 0.1.13: behavioral prompt tuning so planner+reviewer actually get used — DEFAULT_GUIDANCE now leads with an explicit default workflow (delegate_scout → delegate_planner → delegate_worker → delegate_reviewer, run in order), states "Planner and reviewer are the DEFAULT, not optional add-ons" with a cheap skip-with-one-line-justification path for trivial/single-file edits, and adds a soft Gate ("do not call delegate_worker for a multi-file/interface/schema/migration change until a delegate_planner plan exists; do not declare a non-trivial change complete until delegate_reviewer has passed the diff"); the four role bullets were retuned from capabilities into workflow steps (planner = Step 2, reviewer = Step 4). Root cause was that the prior guidance listed the roles as peer capabilities with only soft conditional hints, so the model rationally shortcut to scout+worker. Guidance-only change (no hard code gate in index.ts). One test assertion updated (tests/index.test.ts: the old "Prefer the role delegation tools" pin → three pins on the new workflow/gate text); 93/93 tests pass. Dogfooded 2026-08-28 in a fresh fused session (maxConcurrentWorkers feature task): the orchestrator ran the full scout→planner→worker→reviewer loop and the reviewer caught a real bug (pre-execute deny still routes through post-execute → a plain counter over-decrements and defeats the cap), fixed with a token-keyed admittedWorkers Set. Deployed via the file:-bundle re-materialize dance + smart_restart (MainPID 1772820 → 3902244, clean boot, no auto-disable). |

> Rows 25–26 are live but fall outside the original 1–24 numbering (see the
> drift note at the top). `@liustack/modsearch` (row 12) is **not** in the
> live `bundles` — treat that row as historical (row 7 `dsh-pilot` was
> reinstated 2026-08-28 and is live again).
> `dsh-omp-advisor` and the `@dsh-pro` suite were also removed (see Gotchas /
> Install best practices).

**Not a plugin bundle, but present:** `dsh-cc-loader` (0.1.1) is a **shared
library**, not a mountable plugin — `dsh-cc-skills` imports its parse layer
(`import { loadClaude, parseFrontmatter } from 'dsh-cc-loader'`). pnpm installs
it as a transitive dep of `dsh-cc-skills`; it must **not** appear in `bundles`
and should **not** carry a redundant top-level `dependencies` entry (a stray one
was removed 2026-08-26 — it made cc-loader look like an unbundled plugin).

**`dsh-better-sidebar` install dance** (pnpm 11 blocks `node-pty`'s build script
on first `add`): `add dsh-better-sidebar@latest` (fails) → `cd
~/.dsh/profiles/web && pnpm approve-builds --all` → `add` again (succeeds). The
build is now allowlisted in `pnpm-workspace.yaml` (`allowBuilds: node-pty`). If
the terminal later complains "node-pty failed to load", re-run `pnpm
approve-builds --all && pnpm rebuild node-pty` in the profile dir. It replaced
the old `dock-*` family (`dock-base`/`-editor`/`-files`/`-git`); running both =
duplicate-loader conflicts.

- **`dsh-md-annotator` takes over `.md` preview** while enabled (built-in
  Markdown edit mode is suspended; toggle it off in *Settings → Side Cards* to
  restore). UI is Chinese-only. Prebuilt `lib/` is committed in the `github:`
  source.
- After adding any plugin, verify none got auto-disabled: check
  `cordis.patch.yml` for a fresh `auto-disabled by dsh-startup-guard` entry (see
  Gotchas). A clean load leaves no new `disabled: true`.

### Install best practices (lessons learned)

Prefer `dsh plugin --profile web add <spec>` for every install — it places the
package in the profile's own `node_modules/` (the first bundle-resolution anchor
the boot loader checks) and coordinates `dependencies` + `bundles` together.
Rules that keep the profile bootable:

- **One plugin (or one phase) per restart.** Never batch-install then restart
  once — a boot failure becomes unattributable. (2026-08-26: a 15-package
  `@dsh-pro` suite staged all at once crash-looped `dsh-web.service` ~200× with
  no way to blame a single plugin.)
- **Only `dsh.bundle` packages belong in `dsh.profile.bundles`.** The loader
  (`@deepseek-ai/dsh-app-boot` `loadProfile`) hard-throws `profile bundle "X"
  declares no dsh.bundle` on any bundles entry that declares only `dsh.client`.
  Client-only plugins mount via `- insert:` rows in `cordis.patch.yml` plus a
  `dependencies` entry, never the bundles list. A suite whose plugins self-mount
  via insert rows will legitimately show as `INSTALLED not bundled` in the
  cross-check below — that is expected, not dead weight.
- **Install into the profile's `node_modules`, not a parent.** Bundles resolve
  from `~/.dsh/profiles/web/node_modules` first, then the dsh app dir
  (`resolveBundleDir`). A manual/staged install that lands packages in
  `~/.dsh/profiles/node_modules` (the parent) may resolve today but breaks on
  the next `pnpm` / `dsh plugin install`.
  A 15-package `@dsh-pro/*` suite hit exactly this on 2026-08-26: staged into
  the parent `node_modules`, it resolved for cordis via Node walk-up but
  `dsh-startup-guard` (which checks ONLY `web/node_modules/<name>` in
  `bundleDirResolves`) auto-disabled every insert row, taking down the `layout`
  service and the client entries waiting on it. The suite was ultimately removed
  entirely (2026-08-26) after its `@dsh-pro/updates` plugin kept re-adding the
  bundle entries on each in-app update, re-triggering `duplicate loader entry id`
  crashes. Lesson stands: managed suites that rewrite the profile need their
  update path understood before install, and unpublished packages need real
  `file:` specs (never bare `"*"`, which 404s every later `pnpm install`).
- **Keep the Phase-0 self-heal layer installed** (`dsh-startup-guard`,
  `dsh-hot-reload`, `dsh-smart-restart`) so the next bad install quarantines
  instead of bricking boot.
- When you must stage a private suite manually, afterward run the cross-check
  below AND confirm every `bundles` entry declares `dsh.bundle` and resolves
  from the profile `node_modules`.
- **A `file:`-installed bundle needs a `node_modules` purge to re-materialize,
  not just a version bump.** pnpm keys a `file:` dep on its unchanged spec
  (`file:~/.dsh/plugins-src/<name>`), so after you rsync a rebuilt source into
  `plugins-src/<name>`, a plain `pnpm install` (even with the package's internal
  `version` bumped) leaves the STALE build in `profiles/web/node_modules/<name>`.
  Force it: `rm -rf profiles/web/node_modules/<name> profiles/web/node_modules/.pnpm/file+*<name>* && pnpm install`,
  then verify `diff -q profiles/web/node_modules/<name>/lib/index.js plugins-src/<name>/lib/index.js`
  is IDENTICAL before restarting. (Hit repeatedly building `dsh-fusion` 2026-08-27:
  a "grep confirms the fix is present" check false-passed on a stale copy because
  the searched phrase also lived in an unrelated string.)

### Auditing the plugin set

Cross-check `dependencies` against `bundles` (run in `~/.dsh/profiles/web`):

```sh
python3 -c "
import json
d=json.load(open('package.json'))
deps=set(d['dependencies'].keys()); b=d['dsh']['profile']['bundles']
builtins={'@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app'}
print('deps:',len(deps),'| non-builtin bundled:',len(set(b)-builtins))
print('INSTALLED not bundled:', sorted(deps-(set(b)-builtins)))  # library deps or dead weight
print('BUNDLED not in deps:',   sorted((set(b)-builtins)-deps))  # should be empty
print('duplicate bundle entries:', [x for x in b if b.count(x)>1])
"
```

A healthy state is `deps == non-builtin bundled` with both lists empty. An
`INSTALLED not bundled` hit is either a shared library (like `dsh-cc-loader`,
keep) or genuine dead weight (remove from `dependencies`). Also check
`~/.dsh/plugins-src/` for orphaned `link:`-style source drops not referenced in
`package.json` (an orphan `dsh-a2a` was deleted here 2026-08-26). Always back up
`package.json`/`cordis.patch.yml` before editing, and restart the web service to
apply.

## Delegation / subagent orchestration

**Why the main agent wasn't delegating.** In the Web profile, dsh moves the whole
agent-tool plane (bash, fs, skill, *and all subagent tools*) off the host plane
and **behind agent presets** (`dsh-web-app/cordis.patch.yml` disables `tool-bash`,
`tool-subagent`, `tool-subagent-fork`, etc. at host level; each session mounts a
preset instead). The subagent registry + spawn/fork backends stay loaded on the
host plane. The default agent preset is `standard`, whose `delegation` isolate
DOES grant `subagent` / `subagent_fork` / `workflow` / `ralph`. So the tools ARE
in the catalog — the model just wasn't *choosing* to delegate: the web
system-prompt persona is minimal, `agent-instructions` is disabled in the web
profile. `dsh-cc-skills` *is* bundled (it loads `.claude/` skills/commands/rules
via the `dsh-cc-loader` library), but no CLAUDE.md/AGENTS.md *agent-guidance*
reaches the model as a system prompt (`dsh-cc-agents` isn't installed). A capable model with
delegation tools but no instruction to prefer them just grinds through with bash.
To truly force orchestration-only you must change the *agent preset* to drop the
mutation tools — a plugin can only *add* a delegate tool, not take the main
agent's tools away.

**Delegation-plugin history (both removed).** We trialled two:
`@nanmicoder/dsh-agent-teams` (durable named-team `agent_teams_*` tools) and
`dsh-maestro` (a `link:`-installed planner/executor plugin). Both were uninstalled
— maestro added a delegate tool but never restricted the main agent's tools (so it
didn't *force* orchestration-only) and shipped a hardcoded-Chinese UI. When
removing a delegation plugin, strip it from **both** `dependencies` and `bundles`
(verify per the agent-teams gotcha), delete any `plugins-src/<plugin>/` source and
the dangling `node_modules/<plugin>` symlink from a `link:` install, then restart.
Net current state: no third-party delegation plugin; the main agent has the
preset's native `subagent` / `subagent_fork` and simply isn't told to prefer them.

**ui-translate boundary (general).** `dsh-ui-translate` (browser-local OPUS-MT,
`backend: browser-opus-mt` in `settings.yaml`) translates all visible Chinese
*text nodes* — but **not** HTML attributes (`title` / `aria-label` tooltips) and
**not** elements it deliberately skips. Its `REMOTE_CONTENT_SKIP_SELECTOR` includes
`[data-slot^="conversation."]`, so any plugin chip mounted in the composer/
conversation input slot is skipped even under the OPUS backend — its visible text
stays in the source language. For a Chinese-only plugin whose UI you must read
(e.g. `dsh-md-annotator`), the fallback is to translate the string literals in its
prebuilt `lib/client.js` in place (keep a `.bak`; comments don't render); note an
upgrade overwrites the bundle, so re-apply after any upgrade.

**Worked example — dsh-pilot.** The same fallback was applied to the Chinese
cockpit-panel UI in `dsh-pilot`'s prebuilt `lib/client.js`: 12 panel strings
translated to English (pre-edit copy kept as `lib/client.js.bak.i18n`). The
patch and re-apply procedure live at
`~/.dsh/plugins-src/dsh-pilot/patches/` (`i18n.patch` + `README.md`); re-run
after any `dsh-pilot` reinstall or upgrade that touches `lib/client.js`. Row 7
of the inventory table (v0.7.1 / pin `#dff236a`) reflects this reinstall.

**Pilot tool discovery.** Future dsh sessions do **not** need a prompt
mention or a dedicated skill to see the `pilot_*` tools — once `dsh-pilot`
is loaded the plugin auto-registers them into the harness tool catalog, and
every new session inherits them transparently. The one operational caveat is
Fusion's allowlist gate (`DEFAULT_ALLOW` in `dsh-fusion/src/config.ts`,
enforced by the `tools/pre-execute` deny in `dsh-fusion/src/index.ts`): with
Fusion ON the orchestrator/main agent is withheld `pilot_*` (and `bash`,
`edit`, `write`, `glob`, `grep`, `web_search`) and must delegate to a worker
to drive the browser; with Fusion OFF the main agent calls them directly.
Install details remain in row 7 of the inventory table.

## Key files (`~/.dsh/`)

| Path | What | Mode |
|---|---|---|
| `dsh-web.env` | `CLIPROXY_API_KEY`, `DEEPSEEK_API_KEY` (referenced by settings.yaml `apiKeyEnv`) | 600 |
| `settings.yaml` | model providers (cliproxy + deepseek), hot-reloaded; same file the Models UI writes | 600 |
| `dsh-tls.crt` / `dsh-tls.key` | self-signed cert, SAN=IP:100.95.230.15, 10y | key 600 |
| `reverse-proxy.json` | plugin state: `accessToken`, `enabled`, device sessions | 600 |
| `profiles/web/cordis.patch.yml` | plugin config override (listenHost/port, TLS paths, backend) | - |
| `profiles/web/package.json` | plugin `dependencies` + ordered `dsh.profile.bundles` mount list | - |
| `profiles/web/pnpm-workspace.yaml` | `nodeLinker: hoisted`, `allowBuilds` (node-pty etc.), `minimumReleaseAgeExclude` | - |
| `dsh-startup-guard.json` | guard config: `exclude` list (genui, see Gotchas), `mode` | - |
| `profiles/web/node_modules/dsh-full-remote/` | the installed plugin | - |
| `plugins-src/dsh-ui-translate/` | `link:`-installed browser-local translator | - |
| `plugins-src/dsh-mini-advisor/`, `plugins-src/dsh-fusion/` | source for the two `file:`-installed bundles (`dependencies` pin `file:` specs here) | - |

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

# upgrade dsh  (the PRIMARY empty-output fix now lives in the dsh-fusion plugin's
# tools/post-execute listener — upgrade-safe, survives `npm install -g
# @deepseek-ai/dsh`. apply-patch.sh is the interim node_modules safety net
# until the upstream PR lands.)
npm install -g @deepseek-ai/dsh \
  && bash ~/.dsh/plugins-src/dsh-fusion/patches/apply-patch.sh \
  && systemctl --user restart dsh-web.service

# The apply-patch.sh step re-applies the empty-output fold fix to the
# @deepseek-ai/dsh-subagent runtime files (npm install overwrites them); it is
# idempotent and errors loudly on upstream anchor drift. The PRIMARY fix is now
# in the dsh-fusion plugin's `tools/post-execute` listener (upgrade-safe,
# survives `npm install -g @deepseek-ai/dsh`) — apply-patch.sh is only the
# interim node_modules safety net until the upstream PR to
# github.com/deepseek-ai/deepseek-harness (packages/subagent/subagent) lands;
# see ~/.dsh/plugins-src/dsh-fusion/patches/README.md.

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
- **`dsh-startup-guard` auto-disabled `@changfenhuang/dsh-genui`
  ("client bundle does not register its id via `__ModuleLoader__.load`"):** this
  is a **false positive** — a guard bug. The guard's static id-registration
  regex (`node_modules/dsh-startup-guard/lib/guard-core.mjs` ~line 602) uses the
  character class `["']` and does **not** accept backtick template-literal ids,
  so a valid bundle registering `{id:` `` `@changfenhuang/dsh-genui` `` `}` fails
  the static check and gets disabled before the guard's own vm load check (which
  passes) runs. The bundle is fine (verify: run the client `lib/client.js` in a
  vm with an `__ModuleLoader__` recorder and confirm it registers the id).
  **Fix (2026-08-26):** exclude it from the guard via
  `~/.dsh/dsh-startup-guard.json`
  (`{"exclude":["@changfenhuang/dsh-genui"]}` — uses the *bundle
  name*, not the loader id) and remove its `disabled: true` block from
  `cordis.patch.yml`. Don't patch the vendored regex — an upgrade overwrites it;
  the exclude survives. Drop the exclude if the guard's regex is ever fixed to
  accept backticks. Report upstream: `github:aokamoaki/dsh-startup-guard`.
  (`dsh-diagram` used to hit this same false positive; uninstalled 2026-08-27 —
  the diagram use case is now served by the in-reply `render_ui` GenUI panel.)
- **Recurring "tool call interrupted / no result durably recorded / outcome
  unknown" error (ROOT CAUSE CONFIRMED 2026-08-27).** **An agent session severs
  itself by running `systemctl --user restart dsh-web.service` as a bash tool
  call** — the normal final step of dsh plugin development (rebuild/redeploy a
  plugin, then restart dsh to load the new code; this doc's own "upgrade the
  plugin" recipe prescribes exactly that). The restart kills the dsh process
  hosting that very session, so the in-flight tool result is never durably
  recorded → the "outcome unknown" guard message. Any *other* live session is
  collaterally severed at the same instant.
  **Direct evidence:** decompressing the sessions that smart-restart logged as
  "interrupted at shutdown" for each clean Aug-27 restart, their last assistant
  message before sever is literally e.g. *"Now restart the web service"* + bash
  tool-call `systemctl --user restart dsh-web.service && echo "restart issued"
  && sleep 8 …` (session `705fa1cc`, sever-mtime 13:29:00 == the restart;
  `cc9a8508`/`554033af` same command, sever-mtime 13:14:47–48 == that restart).
  These were plugin-dev sessions (titles: "deploying a rebuilt dsh plugin",
  "small client-only change to a dsh plugin, rebuilding, and redeploying").
  **Why it looked mysterious:** clean `systemctl restart` signature (it IS that
  command); no trace in the *interrupting* session's own recorded output (result
  lost with the process); irregular cadence + an overnight gap (human-driven
  plugin work, not a timer); "after a subagent finishes" (the deploy step runs
  late in the turn). Two RED HERRINGS chased first: (a) the Aug-26 **crash-loop
  storms** (`Main process exited, status=1/FAILURE` every 3s — a *separate*
  boot-failure issue, now quiet); (b) **dshmarket**'s `restartAllowed()`
  mis-detecting the supervisor (`ppid===1` fails for a user service) — real, and
  we pinned `allowRestart: false` (route now 403), but dshmarket self-relaunches
  via `spawn`/`setsid` (would log "Main process exited"), NOT the clean signature
  — so it was never the cause; the "clean after 13:29" correlation was
  coincidence (plugin work simply finished).
  **Mitigations:** (1) prefer the `smart_restart` tool over a raw `systemctl
  restart` for plugin deploys — it re-delivers a resume notice to the calling
  session after reboot (its canary is fixed, see next bullet), so the turn
  continues instead of dying "unknown"; (2) do plugin rebuild+restart in a
  session you can afford to interrupt, or from an on-box shell
  (`http://127.0.0.1:3080` is token-exempt) rather than mid-task in a session
  with other live work.
  **Confirmation (live capture — loop closed 2026-08-27 18:41:59):** a natural
  restart was finally caught in the act, confirming the diagnosis end-to-end
  (trap + transcript, no longer inference). The `bpftrace` execve trap logged the
  caller chain `bash`→`bash`→`gparent pid=3425307 comm=node` running
  `systemctl --user restart dsh-web.service`, where pid 3425307 was the dsh
  MainPID immediately before the restart (MainPID monitor:
  `17:37:45 MainPID=3425307` → `18:41:59 MainPID=3949374`). The severed session
  (`30d3cd00`, dotfiles workspace) was a **dsh-fusion plugin redeploy**: its
  transcript's final recorded event is the bash tool-call
  `systemctl --user restart dsh-web.service && sleep 8 && curl …` (TASK 3 step 5,
  the documented rebuild→restart recipe) with **no result event** — the result
  died with the process → "outcome unknown". This is the diagnosed `gparent=node`
  in-session-bash fingerprint exactly (NOT a reparented/`setsid` chain, NOT
  `gparent=systemd`), so no alternative source is in play. (Earlier Aug-27
  restarts 00:05…12:20 were assumed same-cause by pattern, not each transcript-
  matched, but the mechanism is now proven.)
  **Investigation instruments: TORN DOWN 2026-08-27** after the live capture
  (`sudo systemctl stop dsh-restart-trap dsh-mainpid-mon`). They were a `bpftrace`
  execve trap (`dsh-restart-trap.service`, log `/var/tmp/dsh-restart-catch.log`) +
  a MainPID monitor (`dsh-mainpid-mon.service`, `/var/tmp/dsh-mainpid.log`), in
  their own system cgroup so they survived dsh restarts; logs retained for the
  record. To re-verify in future, re-arm and read the trap log: `gparent=node`
  (dsh MainPID) confirms an in-session bash restart; a reparented/`setsid` chain
  or `gparent=systemd` would mean a different source.
- **`smart_restart` no-ops on this deployment ("cannot derive dsh binary/profile
  for canary") — canary derivation fixed 2026-08-27.** The `dsh-smart-restart`
  canary skipped because its ExecStart parser (`canary.js`
  `deriveExecStartParams`) takes `argv[0]` as the binary — here `/usr/bin/node`
  (the unit runs `node /…/dsh web …`) — and finds no `--profile` (web is
  implicit). **Fix:** pin `canaryBinary: /home/james/.npm-global/bin/dsh` and
  `canaryProfile: web` on the `smart-restart` row in
  `~/.dsh/profiles/web/cordis.patch.yml` (`resolveExecTarget` honors explicit
  config first). Verified end-to-end: the ephemeral canary boot
  (`dsh --profile web --patch <overlay> --port <n>`) serves HTTP 200 in ~3s.
  Note an empty profile also fails (`--profile <name> is required`), so BOTH
  overrides are needed. Report upstream (`dsh-smart-restart`, STILL OPEN —
  verified 2026-08-27 that the repo has 0 issues/PRs filed, so this was never
  reported): `deriveExecStartParams` should skip an interpreter arg
  (`node`/`env`) to find the real dsh script. If you still need a manual cycle, use
  `systemctl --user restart dsh-web.service` (interrupts only the current
  session's in-flight turn; `dsh-client-auto-continue` resumes it).
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
