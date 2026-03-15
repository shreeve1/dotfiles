# Dotfiles

This repo stores the config files and folders you want to keep synced across machines.

## Managed Config

- `~/.config/ghostty/config`
- selected reusable OpenCode config under `~/.config/opencode`

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
- preserves conflicting live files by renaming them to `-bak`, then `-bak-2`, `-bak-3`, and so on
- leaves correct symlinks alone

## Notes

- machine-local or sensitive files should stay out of the repo unless you explicitly want to manage them here
- your current OpenCode setup intentionally leaves runtime and account-specific files outside dotfiles
