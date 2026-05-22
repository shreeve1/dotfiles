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

# ─── Opencode ──────────────────────────────────────────────
# Symlinks the entire ~/.config/opencode directory, which contains:
#   - opencode.json          (provider config + plugin[] registration)
#   - AGENTS.md              (symlink → ~/.claude/CLAUDE.md, canonical guidance)
#   - plugins/               (tokenjuice, caveman, etc.)
#   - commands/              (OpenCode-only slash command wrappers)
# Canonical shared skills now live under ~/.claude/skills/ (linked below).
# OpenCode auto-discovers them unless OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1.
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

# ─── Neovim ────────────────────────────────────────────────
# The .config/nvim symlink is created by link_path above. On first launch,
# nvim will bootstrap lazy.nvim, install all plugins (incl. nvim-tree.lua),
# and Mason will fetch the configured LSPs and formatters. The checks below
# only warn about missing prerequisites — nothing is auto-installed.
if command -v nvim >/dev/null 2>&1; then
  printf 'ok: nvim available: '
  nvim --version 2>&1 | head -n 1 || true
else
  printf 'warn: nvim not found; install neovim (>= 0.10) to use ~/.config/nvim\n'
fi

for tool in rg fd node npm python3; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    case "$tool" in
      rg)      printf 'warn: ripgrep (rg) not found; telescope live_grep will fail\n' ;;
      fd)      printf 'warn: fd not found; telescope find_files will fall back to slower finder\n' ;;
      node)    printf 'warn: node not found; mason-installed JS/TS LSP (ts_ls) and prettier need node\n' ;;
      npm)     printf 'warn: npm not found; mason cannot install JS/TS tooling\n' ;;
      python3) printf 'warn: python3 not found; mason cannot install pyright/black/isort\n' ;;
    esac
  fi
done

if ! command -v make >/dev/null 2>&1; then
  printf 'warn: make not found; telescope-fzf-native build will be skipped\n'
fi

if [ -f "$HOME/.pi/agent/package.json" ] && [ ! -d "$HOME/.pi/agent/node_modules" ]; then
  printf 'warn: ~/.pi/agent/node_modules missing; run: cd ~/.pi/agent && npm install\n'
fi

# ─── Claude Code ───────────────────────────────────────────
# Optional: skip this whole block on machines that do not use Claude Code.
# Set INSTALL_CLAUDE_CODE=0 to skip. OpenCode does not depend on these paths.
if [ "${INSTALL_CLAUDE_CODE:-1}" = "1" ]; then
  # Core files
  link_path ".claude/CLAUDE.md" ".claude/CLAUDE.md"
  link_path ".claude/settings.json.template" ".claude/settings.json.template"
  link_path ".claude/switch-provider.sh" ".claude/switch-provider.sh"

  # Commands (kept for any project-local compatibility wrappers)
  link_path ".claude/commands" ".claude/commands"

  # Canonical shared skills — read by Claude Code natively and by OpenCode
  # via ~/.claude/skills fallback (unless OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1).
  link_path ".claude/skills" ".claude/skills"

  # Claude Code hooks (caveman SessionStart + UserPromptSubmit, shared helpers).
  link_path ".claude/hooks" ".claude/hooks"
else
  printf 'skip: ~/.claude/* links (INSTALL_CLAUDE_CODE=0)\n'
fi

# ─── Codex ─────────────────────────────────────────────────
link_path ".codex/config.toml" ".codex/config.toml"
link_path ".codex/AGENTS.md" ".codex/AGENTS.md"
link_path ".codex/hooks.json" ".codex/hooks.json"
link_path ".codex/rules" ".codex/rules"

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
#
# ─── Opencode post-install verification ────────────────────
# After install.sh runs, verify opencode:
#
#   a. Provider auth (cliproxy must be running locally):
#        curl -s http://127.0.0.1:8317/v1/models | head -c 100
#        # 401 with "Missing API key" means reachable; configure auth as needed
#
#   b. Plugin registration:
#        opencode debug config | grep caveman
#        # Should show the caveman plugin if enabled.
