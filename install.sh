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

# ─── PAI / Claude Code ───────────────────────────────────
# Core files
link_path ".claude/CLAUDE.md" ".claude/CLAUDE.md"
link_path ".claude/CLAUDE.md.template" ".claude/CLAUDE.md.template"
link_path ".claude/install.sh" ".claude/install.sh"
link_path ".claude/statusline-command.sh" ".claude/statusline-command.sh"
link_path ".claude/switch-provider.sh" ".claude/switch-provider.sh"

# PAI engine
link_path ".claude/PAI" ".claude/PAI"

# Skills, hooks, commands, agents, lib
link_path ".claude/skills" ".claude/skills"
link_path ".claude/hooks" ".claude/hooks"
link_path ".claude/commands" ".claude/commands"
link_path ".claude/agents" ".claude/agents"
link_path ".claude/lib" ".claude/lib"

# Syncable memory (learning + relationship cross devices)
link_path ".claude/MEMORY/README.md" ".claude/MEMORY/README.md"
link_path ".claude/MEMORY/LEARNING" ".claude/MEMORY/LEARNING"
link_path ".claude/MEMORY/RELATIONSHIP" ".claude/MEMORY/RELATIONSHIP"

# Note: settings.json is NOT symlinked — it contains secrets.
# Copy the template on a new device: cp .claude/settings.json.template ~/.claude/settings.json
# Then fill in your API keys and machine-specific values.
#
# On a fresh machine, the full setup sequence is:
#   1. git clone <dotfiles> ~/dotfiles && cd ~/dotfiles && bash install.sh
#   2. cp ~/.claude/settings.json.template ~/.claude/settings.json
#   3. Edit settings.json with your API keys and machine-specific values
#   4. bun ~/.claude/install.sh   # runs the PAI installer
