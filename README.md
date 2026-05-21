# Dotfiles

This repo stores config files and folders synced across machines.

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
- selected Claude Code config under `~/.claude`
- selected Codex config under `~/.codex`
- `~/.pi/agent`
- `~/.pi/agent-sessions`

## Layout

Repo mirrors home-directory structure so symlink targets stay obvious:

```text
~/dotfiles/
  .config/
    opencode/
      opencode.json
      skills/
      plugins/
  .claude/
  .codex/
  install.sh
```

## New Machine Setup

1. Clone repo to `~/dotfiles`.
2. Install local runtime prerequisites you want on this machine.
3. Run installer.

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
