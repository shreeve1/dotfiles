---
name: dsh-plugin-build
description: End-to-end workflow for building a DeepSeek Harness (dsh) plugin, tying together three installed components — the dsh-plugin-guide knowledge-base skill (constraints/API), a scaffold (plugin-template or the dsh-plugin-dev new CLI), and validation gates (the plugin_check tool + dsh-plugin-dev check/verify). USE WHEN building/scaffolding/reviewing/packaging/debugging a dsh (DeepSeek Harness) plugin, "new dsh plugin", "dsh plugin from scratch", "validate my dsh plugin", "check my cordis.patch.yml", or "publish a dsh bundle". This skill is a dispatcher; the authoritative plugin contract lives in the dsh-plugin-guide skill.
license: MIT
---

# dsh-plugin-build

Build a DeepSeek Harness (dsh) plugin end-to-end by orchestrating three pieces
that are already installed on the `aidev` dsh deployment. This skill is a **thin
dispatcher** — it does not restate the plugin contract. The authoritative
rules, API references, and community pitfalls live in the **`dsh-plugin-guide`**
skill; load that for anything factual.

## The three components (what each is for)

| Component | Kind | Use it for |
|---|---|---|
| **`dsh-plugin-guide`** | dsh skill (bundled) | The cognitive layer: plugin contract, cordis service/event/effect API, tool DSL, bundle/profile packaging, community pitfalls. **Always load this first.** |
| **`dsh-plugin-dev`** CLI | shell command | The mechanical layer: `new` (scaffold), `check` (static lint), `verify` (pack + install/start/uninstall smoke in a throwaway DSH_HOME). Launcher: `~/.local/bin/dsh-plugin-dev`. |
| **`plugin_check`** tool | dsh agent tool (from `@omdsh-dev/dsh-plugin-check`) | In-session repo diagnosis by form (registry/skill/collection/bundle/tool-bundle): manifest, `dsh.plugin.json`, `cordis.patch.yml`, build traps, hub registration. Read-only. Actions: `check` (one repo dir), `scan` (all dsh-* dirs under a parent), `schema`. |

There is also a committed scaffold at **`~/.dsh/plugin-dev/plugin-template`**
(the `omdsh-dev/plugin-template`, based on the official turtle-ui repo) — copy
it when you want a known-good starting tree instead of `dsh-plugin-dev new`.

## Preflight (do this once per task)

1. **Load the `dsh-plugin-guide` skill.** Everything factual — the plugin
   contract red-lines, exact service/event signatures, the tool `defineTool`
   contract, bundle packaging — comes from there. Do not work from memory.
2. Confirm the target **extension point** (new tool / service / interceptor /
   LLM provider / conversation node / packaging). The guide's task-path table
   maps feature → mechanism; new behavior must hang off a documented extension
   point, never the agent loop.
3. Confirm tooling is reachable: `dsh-plugin-dev --help` (CLI) and that the
   `plugin_check` tool is in your catalog (dsh session on `aidev`).

## The build loop

### 1. Scaffold
- **CLI (preferred):** `dsh-plugin-dev new <name> --lang ts --dir <path> --git`
  — generates `src/index.ts` contract template, Schemastery `Config`, tests,
  tsdown/vitest, an annotated `cordis.patch.yml`, and READMEs.
- **Or copy the template:** `cp -r ~/.dsh/plugin-dev/plugin-template <path>`
  then rename `@your-scope/...` and the row `id`s in `cordis.patch.yml`.

Done = a repo dir exists with no `@your-scope`/placeholder `id`s left.

### 2. Implement
- Follow the guide's contract literally. The load-bearing rules (see the guide
  for the full list, don't trust this summary): plugin = `name` + `apply(ctx,
  config)` (+ optional `inject`); **registration is an effect** (`ctx.effect()`
  / `ctx.on()` / service `register()` returning a disposer — never manual
  teardown); waterfall listeners must call `next()`; **model-visible ⟺ logged**
  (new model-visible input needs a new `SessionEventMap` event); config is a
  Schemastery `Schema<Config>`, never a plain object, and nothing tunable is
  hardcoded; tools use `defineTool` and return only the declared `output.schema`
  JSON, with pure-function UI presenters.
- For exact signatures, read the guide's `references/official-docs/` copies —
  do not invent a second API list.

Done = every extension point implemented against a rule cited from the guide,
not from this summary.

### 3. Validate (gate before every restart/publish)
Run all three, cheapest first. **Done = all three green** (or every finding
consciously waived); a red gate blocks step 4.
- **`plugin_check`** (in-session tool) — fast form-aware diagnosis. Use
  `action: check`, `path: <plugin dir>`, `strict: true`. This catches
  manifest/patch/build-trap classes early. (`action: scan` on a parent dir
  checks several plugins at once.)
- **`dsh-plugin-dev check --cwd <plugin dir> --strict --json`** — static lint of
  `cordis.patch.yml` legality, `package.json` metadata (`dsh.bundle.patch`
  pointer, peers, engines, files allowlist), README parity, red-line patterns.
  Each finding cites the guide chapter to consult.
- **`dsh-plugin-dev verify --cwd <plugin dir>`** — `pnpm pack` then
  install/start/uninstall smoke in a clean temp `DSH_HOME`. The real "does it
  load" gate; do this before bundling into the live `web` profile.

### 4. Install into the live profile (only after verify is green)
Follow the deployment's own rules in the dotfiles doc
`docs/deepseek-harness.md` (the "Plugins" + "Auditing the plugin set"
sections): `dsh plugin --profile web add <spec>` coordinates `dependencies` +
`bundles`; a git-hosted plugin with a `prepare` build needs its exact key in
`pnpm-workspace.yaml` `allowBuilds`; back up `package.json`/`cordis.patch.yml`,
restart `dsh-web.service`, then confirm the deps==bundled cross-check.

Done = service active, the deps==bundled cross-check passes, and the plugin is
NOT auto-disabled in `cordis.patch.yml`. If the guard disabled it, jump to
Debugging below.

## Choosing scaffold vs check vs guide (quick map)

- "How do I register an X / what's the signature" → **guide skill** (its
  task-path table + `references/official-docs/`).
- "Give me a starting repo" → **`dsh-plugin-dev new`** or copy the template.
- "Is my repo shaped correctly / will it load" → **`plugin_check`** then
  **`dsh-plugin-dev check`**, then **`dsh-plugin-dev verify`**.
- "Package/publish/bundle-order questions" → guide's publish path, then verify.

## Debugging (installed but not working)

- **Auto-disabled by `dsh-startup-guard`** (a `disabled: true` row appears in
  `cordis.patch.yml`, reason "does not register its id via
  `__ModuleLoader__.load`"): first confirm it's a real break vs. the known
  **backtick false positive** — the guard's static regex misses template-literal
  ids like `` {id:`my-plugin`} `` even though the bundle is valid. Run the guide
  vm check (execute `lib/client.js` with an `__ModuleLoader__` recorder); if it
  registers, exclude the plugin in `~/.dsh/dsh-startup-guard.json` rather than
  patching the guard. Full write-up in the dotfiles doc's Gotchas.
- **`ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` on install:** the plugin has a
  `prepare` build; add the exact key pnpm printed to `pnpm-workspace.yaml`
  `allowBuilds`, then re-add.
- **Loads but tool/skill absent from the catalog:** it's installed but not in
  `bundles` (run the doc's cross-check), or its `apply()` threw — check
  `journalctl --user -u dsh-web.service` since the last restart.
- **`duplicate loader entry id`:** the plugin's `cordis.patch.yml` re-inserts a
  loader row already owned by a base bundle; remove it from both `dependencies`
  and `bundles` (see the doc's Gotchas).

## Boundaries

- This skill orchestrates; it is **not** a source of truth for the plugin
  contract — defer to `dsh-plugin-guide` on every rule, and to the CLI/tool for
  mechanical checks.
- Paths (`~/.local/bin/dsh-plugin-dev`, `~/.dsh/plugin-dev/plugin-template`) are
  specific to the `aidev` dsh deployment. On another machine, install the guide
  + check plugins and the CLI launcher first (see the dotfiles doc
  `docs/deepseek-harness.md`).
- Don't modify harness repo files outside your plugin dir; `vendor/` is
  read-only.
