#!/usr/bin/env bash

set -euo pipefail

DOTFILES_DIR="${DOTFILES_DIR:-$HOME/dotfiles}"
PAI_TEXT_RE='PAI_DIR|(^|/)\.pai(/|$)|(^|/)pai(/|$)|pai-[[:alnum:]_-]+|\.claude/hooks'
APPLY=0
PURGE_MEMORY=0
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
QUARANTINE_ROOT="$HOME/.pai-cleanup-quarantine/$STAMP"

usage() {
  cat <<'EOF'
Usage: scripts/cleanup-pai-runtime.sh [--apply] [--purge-memory]

Default mode is dry-run. --apply quarantines known retired PAI runtime paths.
--purge-memory permanently removes memory-bearing ~/.pai and ~/dotfiles/.pai.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --purge-memory) PURGE_MEMORY=1 ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'unknown option: %s\n' "$arg" >&2; usage >&2; exit 2 ;;
  esac
done

is_allowed_path() {
  local path="$1"
  case "$path" in
    "$HOME/.agents/skills"/pai-*|\
    "$HOME/.config/opencode/skills"/pai-*|\
    "$DOTFILES_DIR/.config/opencode/skills"/pai-*|\
    "$HOME/.codex/skills"/pai-*|\
    "$DOTFILES_DIR/.codex/skills"/pai-*|\
    "$HOME/.claude/skills"/pai-*|\
    "$DOTFILES_DIR/.claude/skills"/pai-*|\
    "$HOME/.pai"|\
    "$DOTFILES_DIR/.pai"|\
    "$HOME/.claude/PAI"|\
    "$HOME/.claude/hooks"|\
    "$HOME/.claude/statusline-command.sh"|\
    "$HOME/.codex/pai"|\
    "$DOTFILES_DIR/.claude/PAI"|\
    "$DOTFILES_DIR/.codex/pai") return 0 ;;
    *) return 1 ;;
  esac
}

safe_name() {
  printf '%s' "$1" | sed "s#^$HOME/##; s#^$DOTFILES_DIR/#dotfiles/#; s#/#__#g"
}

plan_action() {
  printf '%s\n' "$1"
}

quarantine_path() {
  local path="$1"
  local dest

  case "$path" in */) printf 'reject trailing slash path: %s\n' "$path" >&2; exit 1 ;; esac
  is_allowed_path "$path" || { printf 'reject non-allowlisted path: %s\n' "$path" >&2; exit 1; }
  [ -e "$path" ] || [ -L "$path" ] || return 0

  if [ "$PURGE_MEMORY" -eq 1 ] && { [ "$path" = "$HOME/.pai" ] || [ "$path" = "$DOTFILES_DIR/.pai" ]; }; then
    plan_action "purge: $path"
    [ "$APPLY" -eq 1 ] && rm -rf -- "$path"
    return 0
  fi

  dest="$QUARANTINE_ROOT/$(safe_name "$path")"
  plan_action "quarantine: $path -> $dest"
  if [ "$APPLY" -eq 1 ]; then
    mkdir -p "$QUARANTINE_ROOT"
    mv -- "$path" "$dest"
    printf 'restore: mv -- %q %q\n' "$dest" "$path"
  fi
}

clean_claude_settings() {
  local path="$HOME/.claude/settings.json"
  local backup="$QUARANTINE_ROOT/claude-settings.json.$STAMP.bak"

  [ -f "$path" ] || return 0
  if [ -L "$path" ]; then
    printf 'reject symlinked config path: %s\n' "$path" >&2
    exit 1
  fi
  node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "$path"

  if ! node - "$path" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
let hit = false;
if (data.env && Object.prototype.hasOwnProperty.call(data.env, 'PAI_DIR')) hit = true;
if (data.pai !== undefined) hit = true;
const re = /PAI_DIR|(^|\/)\.pai(\/|$)|(^|\/)pai(\/|$)|pai-[A-Za-z0-9_-]+|\.claude\/hooks/i;
if (data.statusLine && typeof data.statusLine.command === 'string' && re.test(data.statusLine.command)) hit = true;
for (const section of ['allow', 'deny', 'ask']) {
  const values = data.permissions && Array.isArray(data.permissions[section]) ? data.permissions[section] : [];
  if (values.some(value => typeof value === 'string' && re.test(value))) hit = true;
}
process.exit(hit ? 0 : 1);
NODE
  then
    return 0
  fi

  if [ "$APPLY" -eq 0 ]; then
    node - "$path" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const hits = [];
if (data.env && Object.prototype.hasOwnProperty.call(data.env, 'PAI_DIR')) hits.push('remove env.PAI_DIR');
if (data.pai !== undefined) hits.push('remove top-level pai');
const re = /PAI_DIR|(^|\/)\.pai(\/|$)|(^|\/)pai(\/|$)|pai-[A-Za-z0-9_-]+|\.claude\/hooks/i;
if (data.statusLine && typeof data.statusLine.command === 'string' && re.test(data.statusLine.command)) hits.push('remove statusLine.command');
for (const section of ['allow', 'deny', 'ask']) {
  const values = data.permissions && Array.isArray(data.permissions[section]) ? data.permissions[section] : [];
  values.forEach(value => {
    if (typeof value === 'string' && re.test(value)) hits.push(`remove permissions.${section} entry: ${value}`);
  });
}
hits.forEach(hit => console.log(`edit: ${hit} in ${path}`));
NODE
    return 0
  fi

  mkdir -p "$QUARANTINE_ROOT"
  cp -- "$path" "$backup"
  node - "$path" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
if (data.env) delete data.env.PAI_DIR;
delete data.pai;
const re = /PAI_DIR|(^|\/)\.pai(\/|$)|(^|\/)pai(\/|$)|pai-[A-Za-z0-9_-]+|\.claude\/hooks/i;
if (data.statusLine && typeof data.statusLine.command === 'string' && re.test(data.statusLine.command)) {
  delete data.statusLine.command;
  if (Object.keys(data.statusLine).length === 0) delete data.statusLine;
}
if (data.permissions) {
  for (const section of ['allow', 'deny', 'ask']) {
    if (!Array.isArray(data.permissions[section])) continue;
    data.permissions[section] = data.permissions[section].filter(value => !(typeof value === 'string' && re.test(value)));
  }
}
fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
JSON.parse(fs.readFileSync(path, 'utf8'));
NODE
  printf 'backup: %s -> %s\n' "$path" "$backup"
  printf 'restore: cp -- %q %q\n' "$backup" "$path"
}

clean_json_references() {
  local path="$1"
  local label="$2"
  local backup="$QUARANTINE_ROOT/$(safe_name "$path").$STAMP.bak"

  [ -f "$path" ] || return 0
  if [ -L "$path" ]; then
    printf 'reject symlinked config path: %s\n' "$path" >&2
    exit 1
  fi
  node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "$path"
  if ! grep -Eiq "$PAI_TEXT_RE" "$path"; then
    return 0
  fi

  if [ "$APPLY" -eq 0 ]; then
    plan_action "edit: remove PAI JSON references from $label: $path"
    return 0
  fi

  mkdir -p "$QUARANTINE_ROOT"
  cp -- "$path" "$backup"
  node - "$path" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const re = /PAI_DIR|(^|\/)\.pai(\/|$)|(^|\/)pai(\/|$)|pai-[A-Za-z0-9_-]+|\.claude\/hooks/i;
function hasPai(value) {
  if (typeof value === 'string') return re.test(value);
  if (Array.isArray(value)) return value.some(hasPai);
  if (value && typeof value === 'object') return Object.entries(value).some(([key, child]) => re.test(key) || /^pai$/i.test(key) || /^pai-/i.test(key) || hasPai(child));
  return false;
}
function clean(value, root = false) {
  if (typeof value === 'string') return re.test(value) ? undefined : value;
  if (Array.isArray(value)) return value.filter(item => !hasPai(item)).map(item => clean(item)).filter(item => item !== undefined);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (re.test(key) || /^pai$/i.test(key) || /^pai-/i.test(key)) continue;
      if (!root && hasPai(child)) continue;
      const cleaned = clean(child);
      if (cleaned === undefined) continue;
      out[key] = cleaned;
    }
    return out;
  }
  return value;
}
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
fs.writeFileSync(path, JSON.stringify(clean(data, true), null, 2) + '\n');
JSON.parse(fs.readFileSync(path, 'utf8'));
if (re.test(fs.readFileSync(path, 'utf8'))) process.exit(1);
NODE
  printf 'backup: %s -> %s\n' "$path" "$backup"
  printf 'restore: cp -- %q %q\n' "$backup" "$path"
}

clean_shell_file() {
  local path="$1"
  local backup="$QUARANTINE_ROOT/$(safe_name "$path").$STAMP.bak"

  [ -f "$path" ] || return 0
  if ! grep -Eiq "$PAI_TEXT_RE" "$path"; then
    return 0
  fi
  if [ -L "$path" ]; then
    printf 'reject symlinked shell config path with PAI refs: %s\n' "$path" >&2
    exit 1
  fi

  if [ "$APPLY" -eq 0 ]; then
    plan_action "edit: remove PAI shell lines from $path"
    return 0
  fi

  mkdir -p "$QUARANTINE_ROOT"
  cp -- "$path" "$backup"
  node - "$path" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const re = /PAI_DIR|(^|\/)\.pai(\/|$)|(^|\/)pai(\/|$)|pai-[A-Za-z0-9_-]+|\.claude\/hooks/i;
const lines = fs.readFileSync(path, 'utf8').split('\n');
fs.writeFileSync(path, lines.filter(line => !re.test(line)).join('\n'));
NODE
  printf 'backup: %s -> %s\n' "$path" "$backup"
  printf 'restore: cp -- %q %q\n' "$backup" "$path"
}

printf 'mode: %s\n' "$([ "$APPLY" -eq 1 ] && printf apply || printf dry-run)"

clean_claude_settings
clean_json_references "$DOTFILES_DIR/.codex/hooks.json" "Codex hooks"
clean_json_references "$DOTFILES_DIR/.config/opencode/opencode.json" "OpenCode config"
for shell_file in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.profile"; do
  clean_shell_file "$shell_file"
done

for path in \
  "$HOME/.pai" \
  "$DOTFILES_DIR/.pai" \
  "$HOME/.claude/PAI" \
  "$HOME/.claude/hooks" \
  "$HOME/.claude/statusline-command.sh" \
  "$HOME/.codex/pai" \
  "$DOTFILES_DIR/.claude/PAI" \
  "$DOTFILES_DIR/.codex/pai"; do
  quarantine_path "$path"
done

for root in \
  "$HOME/.agents/skills" \
  "$HOME/.config/opencode/skills" \
  "$DOTFILES_DIR/.config/opencode/skills" \
  "$HOME/.codex/skills" \
  "$DOTFILES_DIR/.codex/skills" \
  "$HOME/.claude/skills" \
  "$DOTFILES_DIR/.claude/skills"; do
  [ -d "$root" ] || continue
  for path in "$root"/pai-*; do
    [ -e "$path" ] || [ -L "$path" ] || continue
    quarantine_path "$path"
  done
done

[ "$APPLY" -eq 0 ] && printf 'dry-run only; rerun with --apply to change files\n'
if [ "$APPLY" -eq 1 ]; then
  bash "$DOTFILES_DIR/scripts/audit-pai-runtime.sh"
fi
