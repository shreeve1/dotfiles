# Dotfiles — Agent Context

This repo is synced across the user's Linux and Mac machines. Files here become
real config via symlinks installed by `install.sh`.

## Primary agent: DeepSeek Harness (dsh)

The self-hosted DeepSeek Harness (dsh) web UI on `aidev` is the user's main agent
surface; the other tool configs here support it and legacy workflows. See
`docs/deepseek-harness.md` for access, architecture, and recovery.

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

**Before touching, upgrading, or re-syncing any vendored Pi/Claude extension, read
`docs/pi-extensions.md`** — it holds the full per-extension repair/rationale lore
and the exact commands. The Pi-extension mechanics that silently break things
(don't `pi install` vendored extensions; pi-lens needs `--ignore-scripts`;
disabling needs a `-extensions/<name>/index.ts` exclusion *and* the `packages`
entry removed; per-role subagent models go in `.pi/agent/settings.json`
`subagents.agentOverrides`, not frontmatter; keep the pi-subagents `biome.json`;
don't fight pi-lens autoformat) all live there with rationale.

Environment facts that aren't in that doc:

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
