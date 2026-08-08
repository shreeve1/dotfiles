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

Full per-extension repair/rationale lore lives in **`docs/pi-extensions.md`**. Read
it before touching, upgrading, or re-syncing any vendored Pi/Claude extension. The
rules below are the ones that silently break things if violated:

- **Never `pi install` a vendored extension.** Every extension under
  `.pi/agent/extensions/` (pi-subagents, pi-lens, rpiv-*, ponytail, graphify-guard,
  gap-review, workflows, subagent-bridge, fusion, etc.) is vendored and synced via
  `install.sh`. `pi install` writes machine-local state that does not sync and can
  shadow the repo copy. Repair with `bash install.sh` (or `INSTALL_PI_NPM=always
  bash install.sh` when deps are stale).
- **pi-lens must install with `--ignore-scripts`.** Its `prepare` script does
  `rm -rf dist` and rebuilds from inputs the prebuilt tarball doesn't ship,
  destroying the vendored `dist/`. `install.sh` special-cases this.
- **Disabling an extension needs a `-extensions/<name>/index.ts` exclusion, not
  just removing it from `packages`/`extensions`** — pi auto-discovers
  `extensions/*/index.ts`. Package entries also resolve *before* exclusions
  (first-entry-wins), so a `packages` entry overrides its own exclusion; remove the
  `packages` entry too. Currently disabled this way: `rpiv-ask-user-question`,
  `web-fetch`, `summaries`, `rpiv-advisor`, `workflows`.
- **Per-role subagent models live in `.pi/agent/settings.json`
  `subagents.agentOverrides`, NOT agent frontmatter** — a frontmatter `model:` pin
  silently shadows the settings override. `.pi/agent/agents/` is intentionally empty
  (files there shadow builtins by name).
- **Keep `.pi/agent/extensions/pi-subagents/biome.json`** (`{"formatter":{"enabled":
  false}}`) across re-syncs — without it pi-lens' biome reflows wide upstream files
  into churn diffs on every edit.
- **Questions are asked inline in chat**, never via `ask_user_question` /
  `AskUserQuestion` — that extension is deliberately disabled.
- **OpenCode:** `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` and `OPENCODE_DISABLE_CLAUDE_CODE`
  must stay **unset**, or canonical `~/.claude/skills/` are invisible. OpenCode
  silently drops skills whose `model:` isn't `provider/model` form.
- **graphify CLI is machine-local** (`uv tool install graphifyy`, double-y), not
  synced; only its skill + guard extension sync.
- **Fusion is on by default on this machine.** Claude Code writes/bash are gated to
  a delegation allowlist; mutations go through `bin/pi-delegate`. Toggle with
  `claude-fusion on|off|status` from your shell (not runnable by the agent), or drop
  `.claude/.fusion-off` per-repo.

## Editing rules

- `.claude/CLAUDE.md` is the canonical global guidance. Edit it directly;
  don't recreate `.config/opencode/AGENTS.md`.
- `.claude/settings-*.json` are gitignored (provider-specific, machine-local).
  The tracked seed is `.claude/settings.json.template`.
- Plans under `plans/` are gitignored (machine-local scratch).
