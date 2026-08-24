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
    if [ -n "$source_canon" ] && [ -n "$target_canon" ] &&
      [ "$source_canon" = "$target_canon" ]; then
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

display_path() {
  local p="$1"
  case "$p" in
  "$HOME") printf '~' ;;
  "$HOME"/*) printf '~/%s' "${p#"$HOME"/}" ;;
  *) printf '%s' "$p" ;;
  esac
}

install_npm_deps_if_needed() {
  local dir="$1"
  shift || true
  local label
  label="$(display_path "$dir")"

  if [ ! -f "$dir/package.json" ]; then
    return 0
  fi

  # Skip reinstall when node_modules exists AND is at least as new as package.json.
  # If package.json was edited after node_modules (e.g. deps swapped after a git
  # pull), fall through to reinstall so peers resolve. Override with
  # INSTALL_PI_NPM=always (force) or INSTALL_PI_NPM=0 (never; handled by caller).
  if [ -d "$dir/node_modules" ] && [ "${INSTALL_PI_NPM:-1}" != "always" ]; then
    if [ ! "$dir/package.json" -nt "$dir/node_modules" ]; then
      printf 'ok: %s/node_modules present\n' "$label"
      return 0
    fi
    printf 'refresh: %s package.json newer than node_modules\n' "$label"
  fi

  if ! command -v npm >/dev/null 2>&1; then
    printf 'warn: npm not found; run later: cd %s && npm install' "$label"
    if [ "$#" -gt 0 ]; then
      printf ' %s' "$@"
    fi
    printf '\n'
    return 0
  fi

  local cmd=(npm install "$@")
  local used_ci=0
  if [ -f "$dir/package-lock.json" ]; then
    cmd=(npm ci "$@")
    used_ci=1
  fi

  printf 'install: %s dependencies (%s)\n' "$label" "${cmd[*]}"
  if (cd "$dir" && "${cmd[@]}"); then
    printf 'ok: %s dependencies installed\n' "$label"
    return 0
  fi

  # npm ci fails when the lockfile is out of sync with package.json (common after
  # a dotfiles pull that swapped deps). Drop the stale lockfile and retry with
  # `npm install` so the next sync regenerates a fresh lockfile.
  if [ "$used_ci" = "1" ]; then
    printf 'retry: %s — npm ci failed, removing stale lockfile and running npm install\n' "$label"
    rm -f "$dir/package-lock.json"
    if (cd "$dir" && npm install "$@"); then
      printf 'ok: %s dependencies installed (lockfile regenerated)\n' "$label"
      return 0
    fi
  fi

  printf 'warn: failed to install %s dependencies; run: cd %s && npm install' "$label" "$label"
  if [ "$#" -gt 0 ]; then
    printf ' %s' "$@"
  fi
  printf '\n'
}

link_path ".zshrc" ".zshrc"
link_path ".bashrc" ".bashrc"

# ─── XDG config ────────────────────────────────────────────
link_path ".config/starship.toml" ".config/starship.toml"
link_path ".config/ghostty" ".config/ghostty"
link_path ".config/nvim" ".config/nvim"
link_path ".config/tmux" ".config/tmux"
link_path ".config/yazi" ".config/yazi"
link_path ".config/zellij" ".config/zellij"
link_path ".config/systemd/user/ralph-loop.service" ".config/systemd/user/ralph-loop.service"
link_path "home/herdr/config.toml" ".config/herdr/config.toml"

# ─── herdr binary ──────────────────────────────────────────
# Stable channel: brew on macOS, the project's curl-pipe installer on Linux
# (no apt/snap/dnf package exists). The installer places the binary at
# ~/.local/bin/herdr; warns but does not fail if that dir is not on PATH —
# the user must add it to their shell rc for interactive use. Idempotent:
# skips when herdr is already on PATH.
if command -v herdr >/dev/null 2>&1; then
  printf 'ok: herdr available: '
  herdr --version 2>&1 | head -n 1 || true
elif [ "$(uname -s)" = "Darwin" ] && command -v brew >/dev/null 2>&1; then
  printf 'install: herdr via brew\n'
  if brew install herdr; then
    printf 'ok: herdr installed via brew\n'
  else
    printf 'warn: brew install herdr failed; falling back to upstream installer\n'
    curl -fsSL https://herdr.dev/install.sh | sh
  fi
else
  printf 'install: herdr via upstream curl-pipe installer\n'
  if curl -fsSL https://herdr.dev/install.sh | sh; then
    printf 'ok: herdr installed to ~/.local/bin/herdr\n'
  else
    printf 'warn: herdr install failed; run: curl -fsSL https://herdr.dev/install.sh | sh\n'
  fi
  if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
    printf 'warn: ~/.local/bin is not on PATH; add to your shell rc:\n'
    printf '      export PATH="$HOME/.local/bin:$PATH"\n'
  fi
fi

# ─── bin scripts (onto PATH via ~/.local/bin) ──────────────
link_path "bin/rralph" ".local/bin/rralph"
link_path "bin/osc52" ".local/bin/osc52"
link_path "bin/pi-delegate" ".local/bin/pi-delegate"
link_path "bin/claude-fusion" ".local/bin/claude-fusion"
link_path "bin/herdr-fork" ".local/bin/herdr-fork"

# ─── graphify (knowledge-graph skill + global commit hook) ─
# graphify is the codebase knowledge-graph tool. The skill is synced with the
# other skills (~/.claude/skills/graphify). The graphify CLI itself is machine-local
# (install with: uv tool install graphifyy) and must be on PATH via ~/.local/bin.
#
# The synced global git hook (~/.config/git/hooks/post-commit) auto-refreshes
# graphify-out/ after each commit in ANY repo set up with graphify, and is a
# silent no-op in repos that are not (or on machines without the CLI). Wiring it
# needs git's global core.hooksPath to point at the synced dir. We only set it
# when unset (fresh machine) or already ours — never clobber a machine-local
# choice you made deliberately.
link_path ".config/git/hooks" ".config/git/hooks"
if command -v git >/dev/null 2>&1; then
  _gfy_hookdir="$HOME/.config/git/hooks"
  _cur_hookpath="$(git config --global core.hooksPath 2>/dev/null || true)"
  if [ -z "$_cur_hookpath" ]; then
    git config --global core.hooksPath "$_gfy_hookdir"
    printf 'ok: set git core.hooksPath -> %s (graphify auto-refresh)\n' "$_gfy_hookdir"
  elif [ "$_cur_hookpath" = "$_gfy_hookdir" ]; then
    printf 'ok: git core.hooksPath already -> %s\n' "$_gfy_hookdir"
  else
    printf 'warn: git core.hooksPath is %s (not the synced graphify dir).\n' "$_cur_hookpath"
    printf '      graphify auto-refresh disabled. To enable: git config --global core.hooksPath %s\n' "$_gfy_hookdir"
  fi
  # Check PATH and the canonical uv-tool bin dir: install.sh often runs in a
  # non-interactive shell where ~/.local/bin is not yet on PATH, so a bare
  # `command -v graphify` would false-warn even when it is installed.
  if ! command -v graphify >/dev/null 2>&1 && [ ! -x "$HOME/.local/bin/graphify" ]; then
    printf 'warn: graphify CLI not found; hook is a no-op until installed: uv tool install graphifyy\n'
  fi
fi

# ─── Opencode ──────────────────────────────────────────────
# Symlinks the entire ~/.config/opencode directory, which contains:
#   - opencode.json          (provider config + plugin[] registration)
#   - plugins/               (tokenjuice, etc.)
#   - archive/               (retired OpenCode commands/agents/skills)
# OpenCode loads canonical guidance from ~/.claude/CLAUDE.md via instructions[].
# Canonical shared skills live under ~/.claude/skills/ (linked below).
# OpenCode auto-discovers them unless OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1.
link_path ".config/opencode" ".config/opencode"

# ─── Pi Agent ──────────────────────────────────────────────
link_path ".pi/agent" ".pi/agent"
link_path ".pi/README.md" ".pi/README.md"

# The whole agent directory is linked, so the vendored subagent runtime
# (nicobailon/pi-subagents) and delegation policy travel together. Builtin
# agents ship inside the extension; .pi/agent/agents/ is intentionally empty.
_pi_subagents_ok=1
[ -f "$HOME/.pi/agent/extensions/pi-subagents/package.json" ] || _pi_subagents_ok=0
grep -Fq '## Delegation guidance is mode-aware' "$HOME/.pi/agent/APPEND_SYSTEM.md" 2>/dev/null || _pi_subagents_ok=0
for _pi_settings in "$HOME/.pi/agent/settings.json" "$HOME/.pi/agent/settings.json.template"; do
  grep -Fq '"extensions/pi-subagents"' "$_pi_settings" 2>/dev/null || _pi_subagents_ok=0
done
if [ "$_pi_subagents_ok" = "1" ]; then
  printf 'ok: Pi subagent runtime, policy, and settings present\n'
else
  printf 'warn: Pi subagent setup incomplete; pull latest dotfiles and rerun bash install.sh\n'
fi

# ─── oh-my-pi (omp) Agent ──────────────────────────────────
# Symlink the whole agent dir into the repo. Runtime state (dbs, sessions,
# terminal-sessions) and the live models.yml live inside it but are
# gitignored. The live models.yml carries a real apiKey, so it is seeded
# from models.yml.template (copy, not link) and edited locally.
link_path ".omp/agent" ".omp/agent"
seed_path ".omp/agent/models.yml.template" ".omp/agent/models.yml"

# Pi uses ~/.pi/agent/package.json for extension/runtime dependencies. On fresh
# machines, install deps for ~/.pi/agent and any extension package with its own
# package.json. Set INSTALL_PI_NPM=0 to skip network installs, or
# INSTALL_PI_NPM=always to refresh existing node_modules after dependency changes.
#
# Provider auth remains machine-local in ~/.pi/agent/auth.json.
# Pi was renamed from @mariozechner/pi-coding-agent to @earendil-works/pi-coding-agent
# upstream. Extensions vendored in .pi/agent/extensions/ now peer-depend on
# @earendil-works/*. If the legacy package is still installed globally, warn so the
# user can swap it (mariozechner is stuck at 0.67/0.73; earendil-works is current).
if command -v pi >/dev/null 2>&1; then
  pi_global_pkg=""
  if command -v npm >/dev/null 2>&1; then
    pi_global_pkg="$(npm ls -g --depth=0 2>/dev/null | grep -oE '@(mariozechner|earendil-works)/pi-coding-agent' | head -n 1 || true)"
  fi
  printf 'ok: pi CLI available: '
  pi --version 2>&1 | head -n 1 || true
  if [ "$pi_global_pkg" = "@mariozechner/pi-coding-agent" ]; then
    printf 'warn: global pi is legacy @mariozechner/pi-coding-agent. Extensions need @earendil-works/*.\n'
    printf '      swap with: npm uninstall -g @mariozechner/pi-coding-agent && npm install -g @earendil-works/pi-coding-agent\n'
  fi
  # Detect a stale /usr/bin/pi symlink left over from a prior root-level install of
  # @mariozechner/pi-coding-agent. It can shadow the new user-prefix install on
  # $PATH and silently route `pi` to the wrong binary (or a dangling symlink).
  pi_resolved="$(command -v pi 2>/dev/null || true)"
  if [ -L "/usr/bin/pi" ] && [ "$pi_resolved" = "/usr/bin/pi" ]; then
    pi_link_target="$(readlink /usr/bin/pi || true)"
    case "$pi_link_target" in
    *@mariozechner/pi-coding-agent*)
      printf 'warn: /usr/bin/pi is a legacy root-installed symlink (-> %s)\n' "$pi_link_target"
      printf '      remove with: sudo npm uninstall -g @mariozechner/pi-coding-agent && sudo rm -f /usr/bin/pi\n'
      printf '      or replace:  sudo npm install -g @earendil-works/pi-coding-agent\n'
      ;;
    esac
  fi
elif [ "${INSTALL_PI_CLI:-0}" = "1" ] && command -v npm >/dev/null 2>&1; then
  printf 'install: pi CLI via npm -g\n'
  if npm install -g @earendil-works/pi-coding-agent; then
    printf 'ok: pi CLI installed\n'
  else
    printf 'warn: failed to install pi CLI; run: npm install -g @earendil-works/pi-coding-agent\n'
  fi
else
  printf 'warn: pi CLI not found; PiPerspective reviews will fail until installed\n'
  printf '      install example: npm install -g @earendil-works/pi-coding-agent\n'
  printf '      or run installer with: INSTALL_PI_CLI=1 bash install.sh\n'
fi

if ! command -v bun >/dev/null 2>&1; then
  printf 'warn: bun not found; PiPerspective Tools/*.ts and OpenCode helpers require bun\n'
fi

if [ "${INSTALL_PI_NPM:-1}" != "0" ]; then
  install_npm_deps_if_needed "$HOME/.pi/agent"

  # pi-subagents (nicobailon) is vendored so its runtime, builtin agents, and
  # delegation policy sync together, not installed via `pi install npm:pi-subagents`.
  # Builtin agents ship in the extension; .pi/agent/agents/ stays empty.
  # Fresh-system / AI-session repair command:
  #   cd ~/.pi/agent/extensions/pi-subagents && npm install --omit=dev --omit=peer
  install_npm_deps_if_needed "$HOME/.pi/agent/extensions/pi-subagents" --omit=dev --omit=peer

  # rpiv-todo is vendored so it syncs with dotfiles, not installed via
  # `pi install npm:@juicesharp/rpiv-todo`. Its package imports Pi SDK packages
  # as runtime peers, so install its extension-local deps without --omit=peer.
  # Fresh-system / AI-session repair command:
  #   cd ~/.pi/agent/extensions/rpiv-todo && npm install --omit=dev
  install_npm_deps_if_needed "$HOME/.pi/agent/extensions/rpiv-todo" --omit=dev

  # rpiv-pi is vendored so it syncs with dotfiles, not installed via
  # `pi install npm:@juicesharp/rpiv-pi`. Its core imports Pi SDK packages as
  # runtime peers, so install its extension-local deps without --omit=peer.
  # Fresh-system / AI-session repair command:
  #   cd ~/.pi/agent/extensions/rpiv-pi && npm install --omit=dev
  install_npm_deps_if_needed "$HOME/.pi/agent/extensions/rpiv-pi" --omit=dev

  # pi-lens is vendored so it syncs with dotfiles, not installed via
  # `pi install npm:pi-lens`. Since 3.8.74 it ships the prebuilt npm form
  # (`pi.extensions: ["./dist/index.js"]` + vendored `grammars/*.wasm`), so no
  # build/postinstall step runs — only runtime deps need installing. Use
  # --ignore-scripts: the manifest's `prepare` (npm runs it on local installs)
  # rm -rf's the vendored dist/ then rebuilds from source files the prebuilt
  # npm form does not ship, so it destroys dist/ and fails.
  # Fresh-system / AI-session repair command:
  #   cd ~/.pi/agent/extensions/pi-lens && npm install --omit=dev --omit=peer --ignore-scripts

  # rpiv-advisor is vendored so it syncs with dotfiles, not installed via
  # `pi install npm:@juicesharp/rpiv-advisor`. It is registered in
  # ~/.pi/agent/settings.json as extensions/rpiv-advisor. Fresh-system /
  # AI-session repair command:
  #   cd ~/.pi/agent && npm install
  #   cd ~/.pi/agent/extensions/rpiv-advisor && npm install --omit=dev --omit=peer

  # rpiv-web-tools is vendored so it syncs with dotfiles, not installed via
  # `pi install npm:@juicesharp/rpiv-web-tools`. It is registered in
  # ~/.pi/agent/settings.json as extensions/rpiv-web-tools. The same settings
  # file disables the older web-fetch extension with -extensions/web-fetch/index.ts
  # to avoid duplicate web_search/web_fetch tools. Fresh-system / AI-session repair:
  #   cd ~/.pi/agent && npm install
  #   cd ~/.pi/agent/extensions/rpiv-web-tools && npm install --omit=dev --omit=peer
  #   restart Pi, then run /web-search-config

  # my-pi-setup extensions are vendored with extension-local runtime manifests.
  # Install runtime-only dependencies explicitly where upstream prepare scripts
  # require omitted development tools; the generic loop handles the rest.
  install_npm_deps_if_needed "$HOME/.pi/agent/extensions/pi-lens" --omit=dev --omit=peer --ignore-scripts
  install_npm_deps_if_needed "$HOME/.pi/agent/extensions/file-search" --omit=dev --omit=peer --ignore-scripts
  install_npm_deps_if_needed "$HOME/.pi/agent/extensions/git-info" --omit=dev --omit=peer --ignore-scripts
  install_npm_deps_if_needed "$HOME/.pi/agent/extensions/summaries" --omit=dev --omit=peer --ignore-scripts
  install_npm_deps_if_needed "$HOME/.pi/agent/extensions/background-terminals" --omit=dev --omit=peer --ignore-scripts
  # Repair all vendored Pi dependencies with: bash install.sh

  for package_json in "$HOME"/.pi/agent/extensions/*/package.json "$HOME"/.pi/agent/extensions/@*/*/package.json; do
    [ -f "$package_json" ] || continue
    case "$(dirname "$package_json")" in
    "$HOME/.pi/agent/extensions/pi-subagents") continue ;;
    "$HOME/.pi/agent/extensions/pi-lens") continue ;;
    "$HOME/.pi/agent/extensions/rpiv-pi") continue ;;
    "$HOME/.pi/agent/extensions/rpiv-todo") continue ;;
    "$HOME/.pi/agent/extensions/file-search") continue ;;
    "$HOME/.pi/agent/extensions/git-info") continue ;;
    "$HOME/.pi/agent/extensions/summaries") continue ;;
    "$HOME/.pi/agent/extensions/background-terminals") continue ;;
    "$HOME/.pi/agent/extensions/model-info") continue ;;
    "$HOME/.pi/agent/extensions/ui-customization") continue ;;
    esac
    install_npm_deps_if_needed "$(dirname "$package_json")" --omit=dev --omit=peer
  done
else
  printf 'skip: Pi npm dependencies (INSTALL_PI_NPM=0)\n'
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
    rg) printf 'warn: ripgrep (rg) not found; telescope live_grep will fail\n' ;;
    fd) printf 'warn: fd not found; telescope find_files will fall back to slower finder\n' ;;
    node) printf 'warn: node not found; mason-installed JS/TS LSP (ts_ls) and prettier need node\n' ;;
    npm) printf 'warn: npm not found; mason cannot install JS/TS tooling\n' ;;
    python3) printf 'warn: python3 not found; mason cannot install pyright/black/isort\n' ;;
    esac
  fi
done

if ! command -v make >/dev/null 2>&1; then
  printf 'warn: make not found; telescope-fzf-native build will be skipped\n'
fi

# ─── Claude Code ───────────────────────────────────────────
# Optional: skip this whole block only when ~/.claude is managed separately.
# OpenCode also reads ~/.claude/CLAUDE.md and ~/.claude/skills through this setup.
if [ "${INSTALL_CLAUDE_CODE:-1}" = "1" ]; then
  # Core files
  link_path ".claude/CLAUDE.md" ".claude/CLAUDE.md"
  link_path ".claude/settings.json.template" ".claude/settings.json.template"
  link_path ".claude/switch-provider.sh" ".claude/switch-provider.sh"
  link_path ".claude/statusline-command.sh" ".claude/statusline-command.sh"

  # Canonical Claude Code slash commands and agents.
  link_path ".claude/commands" ".claude/commands"
  link_path ".claude/agents" ".claude/agents"

  # Canonical shared skills — read by Claude Code natively and by OpenCode
  # via ~/.claude/skills fallback (unless OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1).
  link_path ".claude/skills" ".claude/skills"

  # Claude Code hooks.
  link_path ".claude/hooks" ".claude/hooks"
else
  printf 'skip: ~/.claude/* links (INSTALL_CLAUDE_CODE=0)\n'
fi

# ─── Codex ─────────────────────────────────────────────────
# config.toml accumulates machine-local state (project trust, hook-trust
# hashes), so the tracked file is a template; seed the gitignored real file
# once, then link it like before.
[ -f "$DOTFILES_DIR/.codex/config.toml" ] || cp "$DOTFILES_DIR/.codex/config.toml.template" "$DOTFILES_DIR/.codex/config.toml"
link_path ".codex/config.toml" ".codex/config.toml"
link_path ".codex/AGENTS.md" ".codex/AGENTS.md"
link_path ".codex/hooks.json" ".codex/hooks.json"
link_path ".codex/rules" ".codex/rules"

for skill_dir in "$DOTFILES_DIR"/.codex/skills/*; do
  [ -d "$skill_dir" ] || continue
  skill_name="$(basename "$skill_dir")"
  case "$skill_name" in
  .*) continue ;;
  esac
  link_path ".codex/skills/$skill_name" ".codex/skills/$skill_name"
done

# Note: live settings.json files are NOT tracked — they may contain secrets or
# machine-specific values. Copy templates on a new device, then edit locally.
#
# On a fresh machine, the full setup sequence is:
#   1. git clone <dotfiles> ~/dotfiles && cd ~/dotfiles && bash install.sh
#   2. cp ~/.claude/settings.json.template ~/.claude/settings.json
#   3. cp ~/.pi/agent/settings.json.template ~/.pi/agent/settings.json
#   4. Edit live settings with API keys and machine-specific values
#
# ─── Opencode post-install verification ────────────────────
# After install.sh runs, verify opencode:
#
#   a. Provider auth (cliproxy must be running locally):
#        curl -s http://127.0.0.1:8317/v1/models | head -c 100
#        # 401 with "Missing API key" means reachable; configure auth as needed
