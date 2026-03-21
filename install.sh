#!/usr/bin/env bash

set -euo pipefail

DOTFILES_DIR="${DOTFILES_DIR:-$HOME/dotfiles}"

link_path() {
  local source_rel="$1"
  local target_rel="$2"
  local source="$DOTFILES_DIR/$source_rel"
  local target="$HOME/$target_rel"
  local parent
  parent="$(dirname "$target")"

  if [ ! -e "$source" ]; then
    printf 'skip: missing source %s\n' "$source"
    return 0
  fi

  mkdir -p "$parent"

  if [ -L "$target" ]; then
    local current
    current="$(readlink "$target")"
    if [ "$current" = "$source" ]; then
      printf 'ok: %s already linked\n' "$target"
      return 0
    fi
    rm "$target"
  elif [ -e "$target" ]; then
    local backup="$target-bak"
    local n=2
    while [ -e "$backup" ] || [ -L "$backup" ]; do
      backup="$target-bak-$n"
      n=$((n + 1))
    done
    mv "$target" "$backup"
    printf 'backup: %s -> %s\n' "$target" "$backup"
  fi

  ln -s "$source" "$target"
  printf 'linked: %s -> %s\n' "$target" "$source"
}

link_path ".config/ghostty/config" ".config/ghostty/config"
link_path ".config/opencode/.gitignore" ".config/opencode/.gitignore"
link_path ".config/opencode/agents" ".config/opencode/agents"
link_path ".config/opencode/artifacts" ".config/opencode/artifacts"
link_path ".config/opencode/command" ".config/opencode/command"
link_path ".config/opencode/opencode.json" ".config/opencode/opencode.json"
link_path ".config/opencode/opencode.opencode" ".config/opencode/opencode.opencode"
link_path ".config/opencode/plugin" ".config/opencode/plugin"
link_path ".config/opencode/plugins" ".config/opencode/plugins"
link_path ".config/opencode/skills" ".config/opencode/skills"
link_path ".config/opencode/themes" ".config/opencode/themes"
link_path ".config/opencode/tsconfig.json" ".config/opencode/tsconfig.json"
link_path ".config/opencode/tui.json" ".config/opencode/tui.json"

link_path ".pi/agent" ".pi/agent"

link_path ".config/nvim/init.lua" ".config/nvim/init.lua"
link_path ".config/nvim/lazy-lock.json" ".config/nvim/lazy-lock.json"
