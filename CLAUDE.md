# Dotfiles — Agent Context

This repo is synced across the user's Linux and Mac machines. Files here become
real config via symlinks installed by `install.sh`.

## REQUIRED: Caveman Prose

**Hard rule. Every response, every turn.** Write like a smart caveman. Full technical accuracy stays. Fluff dies.

- **Drop**: articles (a/an/the), filler (just/really/basically/simply), pleasantries ("Sure!", "Happy to help"), hedging ("I think maybe perhaps"), recap of what user just said, trailing summaries of what you did.
- **Keep**: technical terms exact, code unchanged, file paths, line numbers, identifiers.
- **Form**: fragments OK. Short clauses. Pattern → `[thing] [action] [reason]. [next step].`
- **Bad**: "Sure! I'd be happy to help you with that. It looks like there's a bug in the auth middleware that we should probably fix."
- **Good**: "Bug in auth middleware. Fix:"

**Boundaries** — code, commit messages, PR descriptions, and documentation you author are written in normal prose. Caveman applies to chat output only.

**Exception** — drop caveman for security warnings, irreversible-action confirmations, and when the user is confused. Resume after.

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
- Hooks: `.claude/hooks/` (Claude Code hook scripts).
- See `README.md` § "Canonical vs tool-specific" for the full table.

## Non-obvious requirements

- Pi was renamed upstream from `@mariozechner/pi-coding-agent` to
  `@earendil-works/pi-coding-agent` (same maintainers). All vendored extensions
  peer-depend on `@earendil-works/*`, and `.pi/agent/package.json` pins
  `@earendil-works/{pi-ai,pi-coding-agent,pi-tui}`. Install globally with
  `npm install -g @earendil-works/pi-coding-agent`. If a stale `/usr/bin/pi`
  symlink remains from a prior root-level install of the old package, it can
  shadow the new user-prefix binary — `install.sh` detects and reports this.
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
- `ponytail` (lazy-senior-dev / YAGNI enforcer, from
  `github.com/DietrichGebert/ponytail`) is vendored into both harnesses rather
  than installed via `/plugin marketplace add` or `pi install git:` (both write
  machine-local state that does not sync). Surfaces:
    - Claude skills: `.claude/skills/ponytail{,-review,-audit,-debt,-gain,-help}/`
      (synced natively via the `.claude/skills` symlink).
    - Claude commands: `.claude/commands/ponytail*.md` (TOML originals from
      upstream were converted to Claude `.md`; `{{args}}` → `$ARGUMENTS`).
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

## Editing rules

- `.claude/CLAUDE.md` is the canonical global guidance. Edit it directly;
  don't recreate `.config/opencode/AGENTS.md`.
- `.claude/settings-*.json` are gitignored (provider-specific, machine-local).
  The tracked seed is `.claude/settings.json.template`.
- Plans under `plans/` are gitignored (machine-local scratch).
