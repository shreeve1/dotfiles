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
- Shared skills: `.claude/skills/<name>/SKILL.md` (read by Claude Code natively,
  by OpenCode via `~/.claude/skills` fallback).
- Hooks: `.claude/hooks/` (Claude Code hook scripts; the OpenCode caveman
  plugin reuses the helper module here).
- See `README.md` § "Canonical vs tool-specific" for the full table.

## Non-obvious requirements

- `node` must be on `$PATH` — the caveman SessionStart and UserPromptSubmit
  hooks are Node scripts (`.claude/hooks/caveman-*.cjs`). Hooks fail silently
  without it.
- Pi `ask_user_question` is a synced vendored extension at
  `.pi/agent/extensions/rpiv-ask-user-question`. On another system, run
  `bash install.sh` from the repo root, or `INSTALL_PI_NPM=always bash install.sh`
  if `~/.pi/agent/node_modules` already exists but extension deps are stale. Do
  not use `pi install npm:@juicesharp/rpiv-ask-user-question`; use the repo copy.
- Pi `rpiv-advisor` is also a synced vendored extension at
  `.pi/agent/extensions/rpiv-advisor`. Install/repair it the same way:
  `bash install.sh`, or `INSTALL_PI_NPM=always bash install.sh` when deps are
  stale. Do not use `pi install npm:@juicesharp/rpiv-advisor`; use the repo copy.
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

## Editing rules

- `.claude/CLAUDE.md` is the canonical global guidance. Edit it directly;
  don't recreate `.config/opencode/AGENTS.md`.
- `.claude/settings-*.json` are gitignored (provider-specific, machine-local).
  The tracked seed is `.claude/settings.json.template`.
- Plans under `plans/` are gitignored (machine-local scratch).
