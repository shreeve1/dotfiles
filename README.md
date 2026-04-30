# Dotfiles

This repo stores the config files and folders you want to keep synced across machines.

## Managed Config

- `~/.zshrc`
- `~/.config/starship.toml`
- `~/.config/tmux`
- `~/.config/ghostty`
- `~/.config/nushell`
- `~/.config/nvim`
- `~/.config/yazi`
- `~/.config/zellij`
- `~/.config/opencode`
- selected Claude/PAI config under `~/.claude`
- selected Codex config under `~/.codex`
- `~/.pi/agent`
- `~/.pi/agent-sessions`

## Layout

The repo mirrors the home-directory structure so symlink targets stay obvious:

```text
~/dotfiles/
  .config/
    ghostty/
      config
    opencode/
      opencode.json
      tui.json
      skills/
      agents/
      ...
  install.sh
```

## New Machine Setup

1. Clone the repo to `~/dotfiles`
2. Run the install script:

```bash
~/dotfiles/install.sh
```

If the repo lives somewhere else, set `DOTFILES_DIR` first:

```bash
DOTFILES_DIR=/path/to/dotfiles /path/to/dotfiles/install.sh
```

## What the Install Script Does

- creates parent directories when needed
- creates symlinks from your home directory back to this repo
- preserves conflicting live files or symlinks with timestamped `-bak-YYYYMMDDTHHMMSSZ` names
- leaves correct symlinks alone
- links app-level directories under `~/.config` instead of replacing the entire `~/.config` directory, so unrelated app config can remain machine-local
- links selected files and directories under `~/.codex` instead of replacing the entire directory, so Codex auth, history, sessions, logs, and caches stay machine-local
- links tracked Claude and Codex PAI system files individually and skips personal/runtime PAI paths such as `USER`, `MEMORY`, `templates/USER`, `State`, `Scratchpad`, logs, JSONL, local config, and secrets

## Notes

- machine-local or sensitive files should stay out of the repo unless you explicitly want to manage them here
- your current OpenCode setup intentionally leaves runtime and account-specific files outside dotfiles
- `~/.codex` should be a real directory; managed Codex config inside it should point back to this repo
- personal PAI context belongs under local ignored paths like `~/.codex/pai/USER` or `~/.claude/PAI/USER`, not in the synced system PAI files
