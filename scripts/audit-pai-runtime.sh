#!/usr/bin/env bash

set -euo pipefail

DOTFILES_DIR="${DOTFILES_DIR:-$HOME/dotfiles}"
PAI_TEXT_RE='PAI_DIR|(^|/)\.pai(/|$)|(^|/)pai(/|$)|pai-[[:alnum:]_-]+|\.claude/hooks'

active=0
doc_only=0
broken=0

emit() {
  local kind="$1"
  local msg="$2"
  printf '%s: %s\n' "$kind" "$msg"
  case "$kind" in
    active) active=$((active + 1)) ;;
    doc-only) doc_only=$((doc_only + 1)) ;;
    broken-symlink) broken=$((broken + 1)) ;;
  esac
}

check_path() {
  local path="$1"
  local label="$2"

  if [ -L "$path" ]; then
    local target
    target="$(readlink "$path")"
    if [ ! -e "$path" ]; then
      emit broken-symlink "$label: $path -> $target"
    else
      emit active "$label: $path -> $target"
    fi
  elif [ -e "$path" ]; then
    emit active "$label: $path"
  fi
}

check_pai_skill_root() {
  local root="$1"

  [ -d "$root" ] || return 0
  local found=0
  for skill in "$root"/pai-*; do
    [ -e "$skill" ] || [ -L "$skill" ] || continue
    found=1
    check_path "$skill" "PAI skill root"
  done
  [ "$found" -eq 0 ] && emit clean "no pai-* skills in $root"
}

check_json_contains_pai() {
  local path="$1"
  local label="$2"

  [ -f "$path" ] || return 0
  if grep -Eiq "$PAI_TEXT_RE" "$path"; then
    emit active "$label references PAI: $path"
  else
    emit clean "$label has no PAI references: $path"
  fi
}

check_shell_file() {
  local path="$1"

  [ -f "$path" ] || return 0
  if grep -Eiq "$PAI_TEXT_RE" "$path"; then
    emit active "shell config references PAI: $path"
  fi
}

check_claude_settings() {
  local path="$HOME/.claude/settings.json"

  [ -f "$path" ] || return 0
  node - "$path" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const hits = [];
if (data.env && Object.prototype.hasOwnProperty.call(data.env, 'PAI_DIR')) hits.push('env.PAI_DIR');
if (data.pai !== undefined) hits.push('top-level pai');
const re = /PAI_DIR|(^|\/)\.pai(\/|$)|(^|\/)pai(\/|$)|pai-[A-Za-z0-9_-]+|\.claude\/hooks/i;
if (data.statusLine && typeof data.statusLine.command === 'string' && re.test(data.statusLine.command)) hits.push('statusLine.command');
for (const section of ['allow', 'deny', 'ask']) {
  const values = data.permissions && Array.isArray(data.permissions[section]) ? data.permissions[section] : [];
  values.forEach((value, index) => {
    if (typeof value === 'string' && re.test(value)) hits.push(`permissions.${section}[${index}]`);
  });
}
if (hits.length) {
  console.log(`active: Claude settings references PAI: ${path} (${hits.join(', ')})`);
} else {
  console.log(`clean: Claude settings has no active PAI references: ${path}`);
}
NODE
}

if claude_output="$(check_claude_settings)"; then
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    case "$line" in
      active:*) active=$((active + 1)) ;;
      clean:*) ;;
    esac
    printf '%s\n' "$line"
  done <<< "$claude_output"
else
  emit active "Claude settings is not valid JSON: $HOME/.claude/settings.json"
fi

for path in \
  "$HOME/.pai" \
  "$HOME/.claude/PAI" \
  "$HOME/.claude/hooks" \
  "$HOME/.claude/statusline-command.sh" \
  "$HOME/.codex/pai" \
  "$DOTFILES_DIR/.pai" \
  "$DOTFILES_DIR/.claude/PAI" \
  "$DOTFILES_DIR/.codex/pai"; do
  check_path "$path" "retired PAI runtime path"
done

for root in \
  "$HOME/.agents/skills" \
  "$HOME/.config/opencode/skills" \
  "$DOTFILES_DIR/.config/opencode/skills" \
  "$HOME/.codex/skills" \
  "$DOTFILES_DIR/.codex/skills" \
  "$HOME/.claude/skills" \
  "$DOTFILES_DIR/.claude/skills"; do
  check_pai_skill_root "$root"
done

check_json_contains_pai "$DOTFILES_DIR/.codex/hooks.json" "Codex hooks"
check_json_contains_pai "$DOTFILES_DIR/.config/opencode/opencode.json" "OpenCode config"

for shell_file in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.profile"; do
  check_shell_file "$shell_file"
done

for doc_path in \
  "$DOTFILES_DIR/wiki/raw"/pai-* \
  "$DOTFILES_DIR/wiki/candidates"/source-pai-* \
  "$DOTFILES_DIR/Plans"/*pai* \
  "$DOTFILES_DIR/.kanban/issues"/*pai*; do
  [ -e "$doc_path" ] || continue
  emit doc-only "historical reference preserved: $doc_path"
done

if [ "$active" -eq 0 ] && [ "$broken" -eq 0 ]; then
  emit clean "PASS: no active PAI runtime references or broken PAI symlinks found"
else
  printf 'summary: active=%s broken-symlink=%s doc-only=%s\n' "$active" "$broken" "$doc_only"
  exit 1
fi
