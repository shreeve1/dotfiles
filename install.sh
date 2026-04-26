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

link_path "bin/osc52" ".local/bin/osc52"

link_path ".zshrc" ".zshrc"
link_path ".config/starship.toml" ".config/starship.toml"
link_path ".config/tmux" ".config/tmux"
link_path ".config/ghostty/config" ".config/ghostty/config"
link_path ".config/yazi" ".config/yazi"
link_path ".config/opencode/agents" ".config/opencode/agents"
link_path ".config/opencode/commands" ".config/opencode/commands"
link_path ".config/opencode/opencode.json" ".config/opencode/opencode.json"
link_path ".config/opencode/opencode.opencode" ".config/opencode/opencode.opencode"
link_path ".config/opencode/package-lock.json" ".config/opencode/package-lock.json"
link_path ".config/opencode/package.json" ".config/opencode/package.json"
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

# ─── Codex ─────────────────────────────────────────────────
link_path ".codex/config.toml" ".codex/config.toml"
link_path ".codex/AGENTS.md" ".codex/AGENTS.md"
link_path ".codex/hooks.json" ".codex/hooks.json"
link_path ".codex/rules" ".codex/rules"
link_path ".codex/skills/dev-build" ".codex/skills/dev-build"
link_path ".codex/skills/dev-development" ".codex/skills/dev-development"
link_path ".codex/skills/dev-epic" ".codex/skills/dev-epic"
link_path ".codex/skills/dev-investigate" ".codex/skills/dev-investigate"
link_path ".codex/skills/dev-plan" ".codex/skills/dev-plan"
link_path ".codex/skills/dev-prd" ".codex/skills/dev-prd"
link_path ".codex/skills/dev-review" ".codex/skills/dev-review"
link_path ".codex/skills/dev-shard" ".codex/skills/dev-shard"
link_path ".codex/skills/dev-stories" ".codex/skills/dev-stories"
link_path ".codex/skills/dev-team" ".codex/skills/dev-team"
link_path ".codex/skills/dev-test" ".codex/skills/dev-test"
link_path ".codex/skills/dev-validate" ".codex/skills/dev-validate"

# Note: settings.json is NOT symlinked — it contains secrets.
# Copy the template on a new device: cp .claude/settings.json.template ~/.claude/settings.json
# Then fill in your API keys and machine-specific values.
#
# On a fresh machine, the full setup sequence is:
#   1. git clone <dotfiles> ~/dotfiles && cd ~/dotfiles && bash install.sh
#   2. cp ~/.claude/settings.json.template ~/.claude/settings.json
#   3. Edit settings.json with your API keys and machine-specific values
#   4. bun ~/.claude/install.sh   # runs the PAI installer
