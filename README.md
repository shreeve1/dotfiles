# Dotfiles

This repo stores config files and folders synced across machines.

## Managed Config

- `~/.zshrc`
- `~/.config/starship.toml`
- `~/.config/tmux`
- `~/.config/ghostty`
- `~/.config/nvim`
- `~/.config/yazi`
- `~/.config/zellij`
- `~/.config/opencode`
- selected Claude Code config under `~/.claude`
- selected Codex config under `~/.codex`
- `~/.pi/agent`

## Layout

Repo mirrors home-directory structure so symlink targets stay obvious:

```text
~/dotfiles/
  .config/
    opencode/
      opencode.json
      plugins/       (tokenjuice)
      archive/       (retired OpenCode commands/agents/skills)
  .claude/
    CLAUDE.md        (canonical agent guidance for Claude Code AND OpenCode)
    commands/        (canonical slash commands)
    agents/          (canonical Claude Code subagents)
    skills/          (canonical shared skills, discovered by both tools)
    hooks/           (Claude Code hook scripts)
    settings.json.template
    switch-provider.sh
  .pi/
    agent/
      settings.json.template
  .codex/
  install.sh
```

### Canonical vs tool-specific

| Concern | Canonical Home | Why |
|---|---|---|
| Global agent guidance | `~/.claude/CLAUDE.md` | Claude Code reads natively; OpenCode reads via `opencode.json` `instructions[]`. |
| Slash commands | `~/.claude/commands/` | Claude Code is canonical. Retired OpenCode commands live under `~/.config/opencode/archive/commands/`. |
| Subagents | `~/.claude/agents/` | Claude Code reads natively; Pi uses `.pi/agent/agents/`. |
| Reusable skills | `~/.claude/skills/` | Claude reads natively, OpenCode falls back to `~/.claude/skills/`. |
| Hook scripts | `~/.claude/hooks/` | Claude-specific runtime. |
| Provider/model config | tool-specific | Claude `~/.claude/settings*.json`; OpenCode `~/.config/opencode/opencode.json`. Schemas differ — no shared format. |
| MCP servers | tool-specific | Claude: `~/.claude.json` (machine-local) or `claude mcp add`; OpenCode: `opencode.json`. |

## New Machine Setup

1. Clone repo to `~/dotfiles`.
2. Install local runtime prerequisites you want on this machine.
3. Run installer.
4. Seed Claude settings: `cp ~/.claude/settings.json.template ~/.claude/settings.json` then fill in API keys.
5. Seed Pi settings: `cp ~/.pi/agent/settings.json.template ~/.pi/agent/settings.json` then edit provider/model per machine if needed.

```bash
git clone <dotfiles> ~/dotfiles
~/dotfiles/install.sh
```

If repo lives somewhere else, set `DOTFILES_DIR` first:

```bash
DOTFILES_DIR=/path/to/dotfiles /path/to/dotfiles/install.sh
```

## What Install Script Does

- creates parent directories when needed
- creates symlinks from home directory back to this repo
- preserves conflicting live files or symlinks with timestamped `-bak-YYYYMMDDTHHMMSSZ` names
- leaves correct symlinks alone
- links app-level directories under `~/.config` instead of replacing entire `~/.config`
- links selected files and directories under `~/.codex` instead of replacing entire `~/.codex`
- links selected Claude Code files under `~/.claude` when `INSTALL_CLAUDE_CODE=1`
- keeps auth, history, sessions, logs, caches, and secrets machine-local

## Notes

- Machine-local or sensitive files should stay out of repo unless explicitly managed here.
- `~/.codex` should be real directory; managed config inside it should point back to this repo.

## Validation

After install, verify both tools see canonical content:

```bash
claude --version                       # Claude Code installed
opencode --version                     # OpenCode installed
opencode debug skill                   # OpenCode discovers canonical skills
node -e "const c=require(process.env.HOME+'/.config/opencode/opencode.json'); console.log(c.instructions.includes('~/.claude/CLAUDE.md'))"
```

In an interactive Claude Code session: `/memory`, `/skills`, `/hooks`, `/mcp`, `/doctor`.

If `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1` or `OPENCODE_DISABLE_CLAUDE_CODE=1` is set, OpenCode will not see canonical skills. Unset to restore shared discovery.
