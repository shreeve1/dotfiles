# Dotfiles — Agent Context

This repo is synced across the user's Linux and Mac machines. Files here become
real config via symlinks installed by `install.sh`.

## On a fresh machine

Run `bash install.sh` from the repo root. See `README.md` for the full setup
sequence (settings.json seeding, per-machine MCP bootstrap, validation
commands).

## Canonical surfaces

- Global agent guidance: `.claude/CLAUDE.md` (loaded by OpenCode via
  `.config/opencode/opencode.json` `instructions[]`).
- Slash commands: `.claude/commands/` (canonical Claude Code commands; retired
  OpenCode commands live under `.config/opencode/archive/commands/`).
- Subagents: `.claude/agents/` (canonical Claude Code subagents; Pi uses
  `.pi/agent/agents/`).
- Shared skills: `.claude/skills/<name>/SKILL.md` (read by Claude Code natively,
  by OpenCode via `~/.claude/skills` fallback).
- Hooks: `.claude/hooks/` (Claude Code hook scripts).
- See `README.md` § "Canonical vs tool-specific" for the full table.

## Non-obvious requirements

- Pi was renamed upstream from `@mariozechner/pi-coding-agent` to
  `@earendil-works/pi-coding-agent` (same maintainers). All vendored extensions
  peer-depend on `@earendil-works/*`, and `.pi/agent/package.json` pins
  `@earendil-works/{pi-ai,pi-coding-agent,pi-tui}` at `^0.80.6` (bumped from
  0.75.5 so vendored `pi-moa` can import `@earendil-works/pi-ai/compat`, which
  only exists in 0.80.6+). Install globally with
  `npm install -g @earendil-works/pi-coding-agent`. If a stale `/usr/bin/pi`
  symlink remains from a prior root-level install of the old package, it can
  shadow the new user-prefix binary — `install.sh` detects and reports this.
- Pi `ask_user_question` remains vendored at
  `.pi/agent/extensions/rpiv-ask-user-question`, but is intentionally disabled by
  the exact `-extensions/rpiv-ask-user-question/index.ts` exclusion in Pi's
  `extensions` settings. Keep that exclusion: questions should be asked inline
  in chat per `.claude/CLAUDE.md`. Removing only a `packages` entry is
  insufficient because Pi auto-discovers `extensions/*/index.ts`.
- Pi `rpiv-advisor` is also a synced vendored extension at
  `.pi/agent/extensions/rpiv-advisor`. Install/repair it the same way:
  `bash install.sh`, or `INSTALL_PI_NPM=always bash install.sh` when deps are
  stale. Do not use `pi install npm:@juicesharp/rpiv-advisor`; use the repo copy.
- Pi `pi-moa` (Mixture-of-Agents Fusion provider, `@duyviet1804/pi-moa`) is a
  synced vendored extension at `.pi/agent/extensions/pi-moa`, registered in
  `.pi/agent/settings.json` `packages` as `extensions/pi-moa` and in
  `enabledModels` as `pi-moa/Fusion` + `pi-moa/Fusion Fast`. Do not
  `pi install npm:@duyviet1804/pi-moa`; use the repo copy (repair with
  `bash install.sh`, or `INSTALL_PI_NPM=always bash install.sh` if deps stale).
  It reads per-variant config from `.pi/agent/moa.json` (Fusion) and
  `.pi/agent/moa-fast.json` (Fusion Fast) — both git-tracked at the agent-dir
  root, so they sync. Current config: advisors `deepseek/deepseek-v4-flash` +
  `deepseek/deepseek-v4-pro`, aggregator `cliproxy/claude-opus-4-8`; Fusion runs
  the verifier (aggregator ~2-3×/turn), Fusion Fast is 1 advisor with
  `enableVerifier:false`. Requires pi-ai 0.80.6+ (see rename bullet). The
  `advisor` tool (`rpiv-advisor`) is auto-stripped when a `pi-moa` model drives,
  via `disabledForModels: ["pi-moa:Fusion", "pi-moa:Fusion Fast"]` in
  `~/.config/rpiv-advisor/advisor.json` — that file is machine-local and NOT
  synced, so re-add the blocklist on each machine.
- Pi `rpiv-web-tools` is a synced vendored extension at
  `.pi/agent/extensions/rpiv-web-tools` and registered in `.pi/agent/settings.json`
  as `extensions/rpiv-web-tools`. Install/repair it with `bash install.sh`, or
  `INSTALL_PI_NPM=always bash install.sh` if deps are stale. Do not use
  `pi install npm:@juicesharp/rpiv-web-tools`; use the repo copy. Keep
  `.pi/agent/settings.json` excluding `-extensions/web-fetch/index.ts`, or Pi will
  load the legacy web-fetch extension and conflict on `web_search` / `web_fetch`.
  After install, restart Pi and run `/web-search-config`.
- `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` and `OPENCODE_DISABLE_CLAUDE_CODE` must
  be **unset**, or OpenCode won't see canonical skills under `~/.claude/skills/`.
- OpenCode silently filters skills with invalid frontmatter. If a new skill
  doesn't appear in `opencode debug skill`, check `model:` uses
  `provider/model` form (e.g. `anthropic/claude-sonnet-4-6`, not bare `opus`).
- macOS: `install.sh` already handles BSD vs GNU `realpath` / `readlink -f`.
  No extra setup needed.
- `ponytail` (lazy-senior-dev / YAGNI enforcer, from
  `github.com/DietrichGebert/ponytail`) is vendored into both harnesses rather
  than installed via `/plugin marketplace add` or `pi install git:` (both write
  machine-local state that does not sync). Surfaces:
    - Claude skills: `.claude/skills/ponytail{,-review,-audit,-debt,-gain,-help}/`
      (synced natively via the `.claude/skills` symlink). These register the
      `/ponytail*` slash names; the redundant `.claude/commands/ponytail*.md`
      copies were removed (skill triggers + hook cover the same surface).
    - Claude hooks: `.claude/hooks/ponytail/*.js`. Upstream uses
      `${CLAUDE_PLUGIN_ROOT}`; since this is not a plugin install, the wiring
      points at `$HOME/.claude/hooks/ponytail/`. Always-on full mode: the
      `SessionStart` + `UserPromptSubmit` hook entries are wired into
      `.claude/settings.json.template` (the tracked seed) **and** every
      machine-local `.claude/settings-*.json` provider file — they must be in
      each provider file because `switch-provider.sh` copies one over the live
      `~/.claude/settings.json`. Default mode is `full` (set in
      `hooks/ponytail-config.js`); override per-machine with
      `PONYTAIL_DEFAULT_MODE` or `~/.config/ponytail/config.json`.
    - Pi extension: `.pi/agent/extensions/ponytail/` (auto-discovered; its
      `index.js` requires were rewritten `../hooks/` → `./hooks/` because the
      hook files are vendored under the extension dir). Do not `pi install`.
  To repair on another machine: `bash install.sh` from the repo root.
- `graphify` (codebase knowledge-graph tool, `github.com/Graphify-Labs/graphify`)
  is split between a synced skill and a machine-local CLI. Surfaces:
    - Skill: vendored (not `graphify install`-generated per machine) at
      `.claude/skills/graphify/` (synced → Claude Code + OpenCode) and
      `.pi/agent/skills/graphify/` (synced → Pi). Both parent dirs are already
      symlinked by `install.sh`, so the skill needs no extra link. Refresh the
      vendored copy after a CLI upgrade by re-running `graphify install` /
      `graphify install --platform pi` into a throwaway `HOME` and copying the
      generated `graphify/` dir back over the two vendored locations (avoids the
      installer editing your real `~/.claude/CLAUDE.md`).
    - CLI: machine-local, NOT synced. Install with `uv tool install graphifyy`
      (PyPI package is `graphifyy` double-y; command stays `graphify`). Lands in
      `~/.local/bin`, already on PATH via the shell rc files.
    - Auto-refresh hook: synced global git hook
      `.config/git/hooks/post-commit`, wired by `install.sh` pointing git's
      global `core.hooksPath` at `~/.config/git/hooks` (only when unset or
      already ours — it will not clobber a deliberate machine-local hooksPath).
      Because a global `core.hooksPath` overrides every repo's `.git/hooks`, the
      hook first delegates to any repo-local `post-commit`, then runs
      `graphify update .` in the background — but only when the repo has a
      `graphify-out/` graph AND the CLI is on PATH; otherwise it is a silent
      no-op. Set up a project's graph once with `/graphify .`. To repair wiring
      on another machine: `bash install.sh`.

## Editing rules

- `.claude/CLAUDE.md` is the canonical global guidance. Edit it directly;
  don't recreate `.config/opencode/AGENTS.md`.
- `.claude/settings-*.json` are gitignored (provider-specific, machine-local).
  The tracked seed is `.claude/settings.json.template`.
- Plans under `plans/` are gitignored (machine-local scratch).
