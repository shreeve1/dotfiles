#!/usr/bin/env bash

set -euo pipefail

DOTFILES_DIR="${DOTFILES_DIR:-$HOME/dotfiles}"

# Canonicalize a path that already exists (resolving every symlink in the
# chain). Returns nonzero and prints nothing if the path doesn't exist OR if
# no portable canonicalize tool is available — callers MUST treat empty
# output as "could not canonicalize", not "different paths". Order tried:
# `realpath` (coreutils + BSD), `readlink -f` (GNU + recent macOS).
canonicalize_existing_path() {
  local p="$1"
  if [ ! -e "$p" ] && [ ! -L "$p" ]; then
    return 1
  fi
  if command -v realpath >/dev/null 2>&1; then
    realpath "$p" 2>/dev/null && return 0
  fi
  if readlink -f / >/dev/null 2>&1; then
    readlink -f "$p" 2>/dev/null && return 0
  fi
  return 1
}

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

  # Self-link guard: if $target resolves (through any ancestor symlink) to the
  # same canonical path as $source, the target IS the source file. Backing up
  # and replacing it would clobber the repo. Skip silently.
  #
  # Both canonicalizations must succeed and match — empty output means the
  # platform lacks both `realpath` and `readlink -f`, in which case we MUST
  # fall through to the existing logic rather than treat empties as equal.
  if [ -e "$target" ] || [ -L "$target" ]; then
    local source_canon target_canon
    source_canon="$(canonicalize_existing_path "$source" || true)"
    target_canon="$(canonicalize_existing_path "$target" || true)"
    if [ -n "$source_canon" ] && [ -n "$target_canon" ] \
        && [ "$source_canon" = "$target_canon" ]; then
      printf 'ok: %s is the source file (parent already linked)\n' "$target"
      return 0
    fi
  fi

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
    .pai/PAI/MEMORY/*|\
    .pai/PAI/*/MEMORY/*|\
    .pai/PAI/**/State/*|\
    .pai/PAI/**/Scratchpad/*|\
    .pai/PAI/**/*.log|\
    .pai/PAI/**/*.jsonl|\
    .pai/PAI/**/secrets.*|\
    .pai/PAI/config/local*.json|\
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
#   - skills/                (OpenCode-native + forked PAI skill directories)
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

# PiPerspective uses the external `pi` CLI as a second-mind reviewer from
# OpenCode. Dotfiles can link config, but package installs and provider auth
# are machine-local, so only warn here. See README.md "PiPerspective setup".
if command -v pi >/dev/null 2>&1; then
  printf 'ok: pi CLI available: '
  pi --version 2>&1 | head -n 1 || true
else
  printf 'warn: pi CLI not found; PiPerspective reviews will fail until installed\n'
  printf '      install example: npm install -g @mariozechner/pi-coding-agent\n'
fi

if ! command -v bun >/dev/null 2>&1; then
  printf 'warn: bun not found; PiPerspective Tools/*.ts and OpenCode helpers require bun\n'
fi

if [ -f "$HOME/.pi/agent/package.json" ] && [ ! -d "$HOME/.pi/agent/node_modules" ]; then
  printf 'warn: ~/.pi/agent/node_modules missing; run: cd ~/.pi/agent && npm install\n'
fi

# ─── PAI runtime home (~/.pai) ─────────────────────────────
# OpenCode (and any future PAI-aware tool) reads PAI doctrine from ~/.pai/PAI
# and runtime memory from ~/.pai/memory. The source-controlled OpenCode PAI
# doctrine lives in this repo at .pai/PAI and is linked back to ~/.pai/PAI.
#
# Do not source OpenCode PAI files from .claude/PAI. That tree is legacy
# Claude Code compatibility only.
#
# Note on PAI_RUNTIME_HOME: the env var is honored by plugins at runtime
# (controls where they read patterns and write logs), but `install.sh`,
# `opencode.json` `instructions[]`, AGENTS.md, and modes/*.md all reference
# `~/.pai` directly. Setting PAI_RUNTIME_HOME to a non-default path therefore
# only relocates plugin runtime state, not OpenCode's static instruction
# lookups. Treat PAI_RUNTIME_HOME as plugin-runtime-only.
link_git_tree ".pai/PAI" ".pai/PAI"

# Forked OpenCode skill tree is the canonical PAI cognitive skill home.
# Inline workflow examples in those skills reference paths like
# `~/.pai/skills/<Name>/...` (matching `~/.pai/PAI/...` convention), so we
# link `~/.pai/skills` to the actual location on disk
# (~/.config/opencode/skills) rather than rewriting every example. Custom
# overrides via `${PAI_DIR:-$HOME/.pai}/skills` work for both the default
# location and a relocated PAI root.
if [ -d "$HOME/.config/opencode/skills" ] && [ ! -e "$HOME/.pai/skills" ]; then
  mkdir -p "$HOME/.pai"
  ln -s "$HOME/.config/opencode/skills" "$HOME/.pai/skills"
  printf 'linked: ~/.pai/skills -> ~/.config/opencode/skills\n'
elif [ -L "$HOME/.pai/skills" ]; then
  current=$(readlink "$HOME/.pai/skills")
  expected="$HOME/.config/opencode/skills"
  if [ "$current" != "$expected" ]; then
    printf 'warn: ~/.pai/skills points to %s (expected %s)\n' "$current" "$expected"
  fi
fi

# One-time migration of the per-machine checkpoint allowlist from the legacy
# ~/.claude location into ~/.pai. Only runs when the new file is absent so
# subsequent re-runs are idempotent.
if [ -f "$HOME/.claude/checkpoint-repos.txt" ] \
    && [ ! -e "$HOME/.pai/checkpoint-repos.txt" ]; then
  mkdir -p "$HOME/.pai"
  cp "$HOME/.claude/checkpoint-repos.txt" "$HOME/.pai/checkpoint-repos.txt"
  printf 'migrated: ~/.claude/checkpoint-repos.txt -> ~/.pai/checkpoint-repos.txt\n'
fi

# ─── PAI / Claude Code ───────────────────────────────────
# Optional: skip this whole block on machines that do not use Claude Code.
# Set INSTALL_CLAUDE_CODE=0 to skip. OpenCode does not depend on any of these
# paths — see the ~/.pai/PAI block above for the OpenCode-required content.
if [ "${INSTALL_CLAUDE_CODE:-1}" = "1" ]; then
  # Core files
  link_path ".claude/CLAUDE.md" ".claude/CLAUDE.md"
  link_path ".claude/CLAUDE.md.template" ".claude/CLAUDE.md.template"
  link_path ".claude/install.sh" ".claude/install.sh"
  link_path ".claude/settings.json.template" ".claude/settings.json.template"
  link_path ".claude/statusline-command.sh" ".claude/statusline-command.sh"
  link_path ".claude/switch-provider.sh" ".claude/switch-provider.sh"

  # PAI engine (legacy Claude Code compatibility; source remains .pai/PAI)
  link_git_tree ".pai/PAI" ".claude/PAI"

  # USER stubs — copied (not linked) so personal overrides stay machine-local.
  seed_path ".pai/PAI/USER/AISTEERINGRULES.md" ".claude/PAI/USER/AISTEERINGRULES.md"

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
else
  printf 'skip: ~/.claude/* links (INSTALL_CLAUDE_CODE=0)\n'
fi

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
#        ls ~/.pai/memory/WORK/  # newest dir is your test ISA
#
# If MINIMAL/NATIVE/ALGORITHM headers don't appear in output, the model is
# the issue — Claude declines the strict format; only GPT models comply.
# The mode files default to gpt-5.5/gpt-5.4/gpt-5.4-mini for that reason.
