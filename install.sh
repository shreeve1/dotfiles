#!/usr/bin/env bash

set -euo pipefail

DOTFILES_DIR="${DOTFILES_DIR:-$HOME/dotfiles}"

backup_path() {
  local target="$1"
  local stamp
  local backup
  local n=2

  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup="$target-bak-$stamp"

  while [ -e "$backup" ] || [ -L "$backup" ]; do
    backup="$target-bak-$stamp-$n"
    n=$((n + 1))
  done

  printf '%s\n' "$backup"
}

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
    local backup
    backup="$(backup_path "$target")"
    mv "$target" "$backup"
    printf 'backup-symlink: %s -> %s (was -> %s)\n' "$target" "$backup" "$current"
  elif [ -e "$target" ]; then
    local backup
    backup="$(backup_path "$target")"
    mv "$target" "$backup"
    printf 'backup: %s -> %s\n' "$target" "$backup"
  fi

  ln -s "$source" "$target"
  printf 'linked: %s -> %s\n' "$target" "$source"
}

is_excluded_pai_path() {
  case "$1" in
    .claude/PAI/USER/*|\
    .claude/PAI/MEMORY/*|\
    .claude/PAI/*/USER/*|\
    .claude/PAI/*/MEMORY/*|\
    .claude/PAI/**/State/*|\
    .claude/PAI/**/Scratchpad/*|\
    .claude/PAI/**/*.log|\
    .claude/PAI/**/*.jsonl|\
    .claude/PAI/**/secrets.*|\
    .claude/PAI/config/local*.json|\
    .codex/pai/USER/*|\
    .codex/pai/MEMORY/*|\
    .codex/pai/templates/USER/*|\
    .codex/pai/*/USER/*|\
    .codex/pai/*/MEMORY/*|\
    .codex/pai/**/State/*|\
    .codex/pai/**/Scratchpad/*|\
    .codex/pai/**/*.log|\
    .codex/pai/**/*.jsonl|\
    .codex/pai/**/secrets.*|\
    .codex/pai/config/local*.json)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

link_git_tree() {
  local source_rel="$1"
  local target_rel="$2"
  local file
  local suffix

  while IFS= read -r file; do
    if is_excluded_pai_path "$file"; then
      printf 'skip-private: %s\n' "$file"
      continue
    fi

    suffix="${file#"$source_rel"/}"
    link_path "$file" "$target_rel/$suffix"
  done < <(git -C "$DOTFILES_DIR" ls-files "$source_rel")
}

# Copy a starter file to a private/excluded location only if the target doesn't
# already exist. Used for USER stubs that should be machine-local but need a
# bootstrap default so referenced paths resolve on a fresh install.
seed_path() {
  local source_rel="$1"
  local target_rel="$2"
  local source="$DOTFILES_DIR/$source_rel"
  local target="$HOME/$target_rel"

  if [ ! -e "$source" ]; then
    printf 'skip-seed: missing source %s\n' "$source"
    return 0
  fi

  if [ -e "$target" ] || [ -L "$target" ]; then
    printf 'ok: %s already present (no overwrite)\n' "$target"
    return 0
  fi

  mkdir -p "$(dirname "$target")"
  cp "$source" "$target"
  printf 'seeded: %s -> %s (copy, not symlink)\n' "$target" "$source"
}

link_path ".zshrc" ".zshrc"

# ─── XDG config ────────────────────────────────────────────
link_path ".config/starship.toml" ".config/starship.toml"
link_path ".config/ghostty" ".config/ghostty"
link_path ".config/nushell" ".config/nushell"
link_path ".config/nvim" ".config/nvim"
link_path ".config/tmux" ".config/tmux"
link_path ".config/yazi" ".config/yazi"
link_path ".config/zellij" ".config/zellij"

# ─── Opencode (PAI-enabled) ────────────────────────────────
# Symlinks the entire ~/.config/opencode directory, which contains:
#   - opencode.json          (provider config + plugin[] registration)
#   - AGENTS.md              (PAI Mode System block)
#   - modes/                 (algorithm/native/minimal — primary modes, GPT-backed)
#   - agents/                (pai-{algorithm,architect,engineer} subagents + others)
#   - plugins/               (pai-session-reminder, terminal-bell, etc.)
#   - skills/                (shared with Claude Code via separate symlink)
#
# The pai-session-reminder plugin injects mode classifier rules into the
# system prompt via experimental.chat.system.transform. PAI modes are wired
# to GPT models (gpt-5.5 / gpt-5.4 / gpt-5.4-mini via cliproxy) because Claude
# models receive but do not comply with the strict format requirements.
link_path ".config/opencode" ".config/opencode"

# ─── Pi Agent ──────────────────────────────────────────────
link_path ".pi/agent" ".pi/agent"
link_path ".pi/agent-sessions" ".pi/agent-sessions"
link_path ".pi/README.md" ".pi/README.md"

# ─── PAI / Claude Code ───────────────────────────────────
# Core files
link_path ".claude/CLAUDE.md" ".claude/CLAUDE.md"
link_path ".claude/CLAUDE.md.template" ".claude/CLAUDE.md.template"
link_path ".claude/install.sh" ".claude/install.sh"
link_path ".claude/settings.json.template" ".claude/settings.json.template"
link_path ".claude/statusline-command.sh" ".claude/statusline-command.sh"
link_path ".claude/switch-provider.sh" ".claude/switch-provider.sh"

# PAI engine
link_git_tree ".claude/PAI" ".claude/PAI"

# USER stubs — copied (not linked) so personal overrides stay machine-local.
# Required because opencode.json references these paths in instructions[].
seed_path ".claude/PAI/USER/AISTEERINGRULES.md" ".claude/PAI/USER/AISTEERINGRULES.md"

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
link_path ".codex/agents" ".codex/agents"
link_path ".codex/rules" ".codex/rules"
link_git_tree ".codex/pai" ".codex/pai"

for skill_dir in "$DOTFILES_DIR"/.codex/skills/*; do
  [ -d "$skill_dir" ] || continue
  skill_name="$(basename "$skill_dir")"
  case "$skill_name" in
    .* ) continue ;;
  esac
  link_path ".codex/skills/$skill_name" ".codex/skills/$skill_name"
done

# Note: settings.json is NOT symlinked — it contains secrets.
# Copy the template on a new device: cp .claude/settings.json.template ~/.claude/settings.json
# Then fill in your API keys and machine-specific values.
#
# On a fresh machine, the full setup sequence is:
#   1. git clone <dotfiles> ~/dotfiles && cd ~/dotfiles && bash install.sh
#   2. cp ~/.claude/settings.json.template ~/.claude/settings.json
#   3. Edit settings.json with your API keys and machine-specific values
#   4. bun ~/.claude/install.sh   # runs the PAI installer
#
# ─── Opencode post-install verification ────────────────────
# After install.sh runs, verify opencode + PAI integration:
#
#   a. Provider auth (cliproxy must be running locally; PAI modes use it):
#        curl -s http://127.0.0.1:8317/v1/models | head -c 100
#        # 401 with "Missing API key" means reachable; configure auth as needed
#
#   b. Plugin registration:
#        opencode debug config | grep pai-session-reminder
#        # Should appear once in the resolved plugin[] list
#
#   c. Mode discovery:
#        opencode agent list | grep -E "^(algorithm|native|minimal) \(primary\)"
#        # Should show all three primary modes
#
#   d. End-to-end smoke test (creates a PRD + reflection if working):
#        cd /tmp && opencode run --agent algorithm \
#          "write /tmp/hello.sh that prints HELLO"
#        ls ~/.claude/MEMORY/WORK/  # newest dir is your test PRD
#
# If MINIMAL/NATIVE/ALGORITHM headers don't appear in output, the model is
# the issue — Claude declines the strict format; only GPT models comply.
# The mode files default to gpt-5.5/gpt-5.4/gpt-5.4-mini for that reason.
