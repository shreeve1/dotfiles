#!/bin/bash
# Ralph Loop - Background tmux driver that runs Ralph until no issues remain
# Usage: ralph-loop.sh [OPTIONS] [ADAPTER] [SESSION_NAME]
#
# OPTIONS:
#   --force               Skip interactive warnings (active issues, dirty worktree)
#   --continue-on-error   If Ralph fails, reset issue to pending and continue
#   --sleep-interval N    Sleep N seconds between iterations (default: 3)
#   --ready-delay N       Initial settle delay before prompt-ready polling (default: 1)
#   --ready-timeout N     Seconds to wait for an interactive agent prompt (default: 60)
#   --iteration-timeout N Seconds to wait for an interactive agent sentinel (default: 7200)
#   --agent-cmd CMD       Interactive agent command for the tmux adapter (default: pi with RALPH_MODEL (cliproxy/deepseek-v4.1-flash))
#   --agent-prompt TEXT   Prompt sent to the agent (default: $RALPH_AGENT_PROMPT or a Ralph invocation prompt)
#   --review-loop         Run actionable review/unblock loop instead of pending-issue implementation
#   --lsp-check-cmd CMD   Optional command that must pass after each worker before DONE/PASS is accepted
#   --no-checkpoint-dirty Do not auto-commit dirty worktree before each worker or after each issue
#   --checkpoint-scope M  Override git config ralph.checkpointScope: "all" (default everywhere) stages everything outside .pi-lens; "files" stages only the active ticket's files: frontmatter prefixes plus .kanban/ (the mode a shared working tree needs)
#   --socket PATH         Private tmux socket path (implies --private-tmux)
#   --private-tmux        Use Ralph's private tmux socket instead of default tmux
#   --normal-tmux         Use the default tmux server (default)
#
# ARGUMENTS:
#   ADAPTER               tmux|pi (default: tmux)
#   SESSION_NAME          tmux driver session name (default: ralph-loop)

set -euo pipefail

FORCE_MODE=false
CONTINUE_ON_ERROR=false
SLEEP_INTERVAL=3
READY_DELAY=1
READY_TIMEOUT=60
ITERATION_TIMEOUT=7200
AGENT_CMD="${RALPH_AGENT_CMD:-}"
AGENT_CMD_EXPLICIT=false
AGENT_PROMPT_EXPLICIT=false
REVIEW_LOOP=false
SKIP_BLOCKED="${RALPH_SKIP_BLOCKED:-false}"
# Unattended mode (set by the systemd supervisor): on a worker timeout/FAIL the
# loop exits non-zero instead of leaving an idle keepalive session, so the
# supervisor relaunches and continues. MAX_ISSUE_FAILS bounds retries — an issue
# that fails this many launch attempts is auto-blocked so the loop moves on.
UNATTENDED="${RALPH_UNATTENDED:-false}"
MAX_ISSUE_FAILS="${RALPH_MAX_ISSUE_FAILS:-2}"
LSP_CHECK_CMD="${RALPH_LSP_CHECK_CMD:-}"
RALPH_MODEL="${RALPH_MODEL:-cliproxy/deepseek-v4.1-flash}"
AGENT_PROMPT="${RALPH_AGENT_PROMPT:-Run Ralph for exactly one issue in this repository. Read ~/.agents/skills/ralph/SKILL.md and follow the Ralph skill/protocol. Stop after one issue. Print the required RALPH_RESULT sentinel.}"
CHECKPOINT_DIRTY=true
# Which tickets this loop may pick up. Eligibility (status + triage label +
# blockers + archive) is decided by ../kanban/board.sh; --spec narrows the set.
SPEC="${RALPH_SPEC:-}"
READY_LABEL="${RALPH_READY_LABEL:-ready-for-agent}"
SOCKET_DIR="${RALPH_TMUX_SOCKET_DIR:-${TMPDIR:-/tmp}/ralph-tmux-sockets}"
TMUX_SOCKET="${RALPH_TMUX_SOCKET:-$SOCKET_DIR/ralph.sock}"
USE_NORMAL_TMUX="${RALPH_USE_NORMAL_TMUX:-true}"
# Checkpoint scope controls how the pre/post-worker auto-commit scopes its
# `git add`. Default "all" preserves the original behavior: everything outside
# .pi-lens/ is staged. Set to "files" (per repo: `git config ralph.checkpointScope
# files`, or one-shot via env RALPH_CHECKPOINT_SCOPE=files) to stage only the
# active ticket's `files:` frontmatter prefixes plus .kanban/ — the mode a
# shared working tree (e.g. ~/Documents/itastack) needs to avoid sweeping
# unrelated agents' work into "chore(ralph): checkpoint ..." commits.
CHECKPOINT_SCOPE_OVERRIDE=""
CHECKPOINT_SCOPE=""

# Functions in this block are the testable seam for tests/test-checkpoint-scope.sh.
# When this file is sourced, definitions below are sourced too and no cli side
# effects run; when invoked directly, the cli body at the bottom embeds them
# into the generated LOOP_SCRIPT via declare -f so the child tmux bash has them.
RALPH_HELPERS=(
  git_status_ignoring_pi_lens
  git_status_short_ignoring_pi_lens
  git_status_snap_recursive
  cleanup_ephemeral_artifacts
  normalize_issue_id
  issue_id_for_file
  issue_status_for_file
  issue_priority_for_file
  has_valid_action_reviewed
  resolve_checkpoint_scope
  effective_checkpoint_scope
  list_ticket_file_prefixes
  git_path_under_prefix
  git_status_in_scope
  build_files_mode_pathspec
  checkpoint_out_of_scope_warning
  checkpoint_dirty_worktree
  files_mode_worker_note
  pick_next_target_for_warning
  emit_pre_existing_dirty_warning
)

git_status_ignoring_pi_lens() {
  git status --porcelain -- . ':(exclude).pi-lens' ':(exclude).sessions' | LC_ALL=C sort || true
}

git_status_short_ignoring_pi_lens() {
  git status --short -- . ':(exclude).pi-lens' ':(exclude).sessions' || true
}

# Like git_status_ignoring_pi_lens but recurses into untracked directories
# (`-uall`) so the out-of-scope warning names the individual file the worker
# touched, not the bare directory name that `git status` collapses to by
# default. Used only for the before/after snapshot diff in files mode.
git_status_snap_recursive() {
  git status --porcelain -uall -- . ':(exclude).pi-lens' ':(exclude).sessions' | LC_ALL=C sort || true
}

cleanup_ephemeral_artifacts() {
  local removed=false
  local paths=(
    ".playwright-sessions"
    "test-results"
    "playwright-report"
    ".pytest_cache"
    ".ruff_cache"
    ".mypy_cache"
    "htmlcov"
  )

  for path in "${paths[@]}"; do
    [[ -e "$path" ]] || continue
    if git rev-parse --git-dir >/dev/null 2>&1 && [[ -z "$(git ls-files -- "$path")" ]]; then
      rm -rf -- "$path"
      echo "🧹 Removed untracked ephemeral artifact: $path" | tee -a "${LOG_FILE:-/dev/null}"
      removed=true
    fi
  done

  [[ "$removed" == "true" ]]
}

normalize_issue_id() {
  local id="${1#\#}"
  # Keep IDs verbatim (e.g. zero-padded "022", alphanumeric "023a"); only map
  # empty to "0". Stripping leading zeros previously broke file-id lookups like
  # grep "^id: <id>$" against zero-padded kanban issue files.
  id=$(printf '%s' "$id" | sed 's/^$/0/')
  printf '%s' "$id"
}

issue_id_for_file() {
  sed -n 's/^id:[[:space:]]*//p' "$1" | head -1 | tr -d '\r' | xargs
}

issue_status_for_file() {
  sed -n 's/^status:[[:space:]]*//p' "$1" | head -1 | tr -d '\r' | xargs
}

issue_priority_for_file() {
  local priority
  priority=$(sed -n 's/^priority:[[:space:]]*//p' "$1" | head -1 | tr -d '\r' | xargs)
  [[ "$priority" =~ ^[0-9]+$ ]] || priority=999
  printf '%s' "$priority"
}

has_valid_action_reviewed() {
  grep -Eq '^action_reviewed:[[:space:]]+[0-9]{4}-[0-9]{2}-[0-9]{2}[[:space:]]*$' "$1"
}

# Resolve the configured checkpoint scope for the current repo. Order:
# 1. env RALPH_CHECKPOINT_SCOPE (also set by --checkpoint-scope on the cli)
# 2. git config ralph.checkpointScope (per repo)
# 3. "all" (default — preserves pre-files-mode behavior everywhere)
resolve_checkpoint_scope() {
  local scope=""
  if [[ -n "${RALPH_CHECKPOINT_SCOPE:-}" ]]; then
    scope="$RALPH_CHECKPOINT_SCOPE"
  elif git rev-parse --git-dir >/dev/null 2>&1; then
    scope=$(git config --get ralph.checkpointScope 2>/dev/null || true)
  fi
  case "${scope:-all}" in
  all | files) printf '%s' "${scope:-all}" ;;
  *) printf 'all' ;;
  esac
}

# Returns the scope to apply right now: explicit cli override if set, else the
# resolved value (env/git config/default). Cached in CHECKPOINT_SCOPE.
effective_checkpoint_scope() {
  if [[ -n "${CHECKPOINT_SCOPE_OVERRIDE:-}" ]]; then
    printf '%s' "$CHECKPOINT_SCOPE_OVERRIDE"
    return 0
  fi
  resolve_checkpoint_scope
}

# Read the `files:` frontmatter entry from a kanban ticket, returning one path
# prefix per line. Supports both the `[a, b]` inline list and a YAML list under
# `files:` (with one path per `- ...` entry, up to the next non-list key).
# Empty output means the ticket has no files: scope — caller decides what to do.
list_ticket_file_prefixes() {
  local ticket="${1:-}"
  [[ -n "$ticket" && -f "$ticket" ]] || {
    printf ''
    return 0
  }
  awk '
    function trim(s) { gsub(/^[ \t\r]+|[ \t\r]+$/, "", s); return s }
    function emit(s,   v) {
      v = trim(s)
      sub(/^[[:space:]]*-[[:space:]]*/, "", v)
      gsub(/^["\x27]|["\x27]$/, "", v)
      v = trim(v)
      if (v != "") print v
    }
    BEGIN { in_fm = 0; in_list = 0; seen_open = 0 }
    /^---[[:space:]]*$/ {
      if (seen_open) { in_fm = 0; in_list = 0 }
      else { in_fm = 1; seen_open = 1 }
      next
    }
    !in_fm { next }
    /^[[:space:]]*$/ { next }
    /^files:[[:space:]]*/ {
      line = $0
      sub(/^files:[[:space:]]*/, "", line)
      # Empty / null marker / tilde still starts a list — continuation `- ...`
      # lines that follow are the body of the entry.
      in_list = 1
      if (line == "" || line == "~" || line == "null") { next }
      # Inline list form `files: [a, b]`
      gsub(/[\[\]]/, "", line)
      n = split(line, parts, ",")
      for (i = 1; i <= n; i++) emit(parts[i])
      next
    }
    in_list && /^[[:space:]]+-[[:space:]]*/ { emit($0); next }
    in_list && /^[[:space:]]+[A-Za-z_]/ { in_list = 0 }
    /^[A-Za-z_]/ { in_list = 0 }
  ' "$ticket"
}

# True iff a relative `git status`-style path equals or sits under any of the
# given prefixes (with a `/` boundary so `src` does not match `src2`).`.kanban/`
# is always in scope in files mode regardless of prefix content.
git_path_under_prefix() {
  local path="$1"
  shift
  local p canon
  case "$path" in
  .kanban | .kanban/*) return 0 ;;
  esac
  for p in "$@"; do
    # Strip any trailing slash before building the case pattern. The earlier
    # `"$p"/*` form produced `"src/"/"*` (a double slash) for prefix `src/`,
    # which never matched real paths like `src/foo.py` — only a literal
    # `src//foo.py` would. `${p%/}` collapses trailing duplicates and yields
    # the canonical form so the case pattern matches `src/foo.py` cleanly.
    canon="${p%/}"
    case "$path" in
    "$canon" | "$canon"/*) return 0 ;;
    esac
  done
  return 1
}

# is_in_scope <path> — uses the scope prefixes stashed in files-mode $PREFIXES_FILE.
git_status_in_scope() {
  local path="$1"
  local prefixes_file="${PREFIXES_FILE:-}"
  local -a prefixes=()
  if [[ -n "$prefixes_file" && -s "$prefixes_file" ]]; then
    while IFS= read -r p; do
      [[ -n "$p" ]] && prefixes+=("$p")
    done <"$prefixes_file"
  fi
  git_path_under_prefix "$path" "${prefixes[@]}"
}

# Populate $1 with newline-separated pathspec tokens for `git add` in files
# mode: every prefix from the ticket, plus `.kanban/`. Fails (rc=1) when no
# prefixes are available, signalling "ticket has no files: scope — caller
# decides whether to skip or stop".
build_files_mode_pathspec() {
  local ticket="$1" out_file="$2"
  : >"$out_file"
  local prefixes
  prefixes=$(list_ticket_file_prefixes "$ticket" 2>/dev/null || true)
  if [[ -z "$prefixes" ]]; then
    return 1
  fi
  while IFS= read -r p; do
    [[ -n "$p" ]] && printf '%s\n' "$p" >>"$out_file"
  done <<<"$prefixes"
  printf '%s\n' '.kanban/' >>"$out_file"
  LC_ALL=C sort -u "$out_file" -o "$out_file"
  # Strip any accidental blank lines that `sort -u` would have collapsed.
  awk 'NF' "$out_file" >"$out_file.tmp" && mv "$out_file.tmp" "$out_file"
  return 0
}

# Diff before/after snapshots of `git status`-style line lists and warn about
# any path that became dirty during the worker but does NOT fall inside the
# in-scope prefixes. Logs to ${LOG_FILE:-/dev/null} and stdout. Names each path.
# Args: $1 before snapshot, $2 after snapshot, $3 prefixes file, $4 ticket label.
checkpoint_out_of_scope_warning() {
  local before_file="$1" after_file="$2" prefixes_file="$3" label="${4:-worker}"
  [[ -s "$after_file" ]] || return 0
  [[ -s "$prefixes_file" ]] || return 0
  local -a prefixes=()
  while IFS= read -r p; do [[ -n "$p" ]] && prefixes+=("$p"); done <"$prefixes_file"
  [[ ${#prefixes[@]} -gt 0 ]] || return 0
  local tmp
  tmp=$(mktemp)
  # Differences after ∖ before — paths the worker made dirty.
  LC_ALL=C sort -u "$after_file" 2>/dev/null >"$tmp.after"
  LC_ALL=C sort -u "$before_file" 2>/dev/null >"$tmp.before"
  : >"$tmp.new"
  if [[ -s "$tmp.after" ]]; then
    while IFS= read -r path; do
      [[ -n "$path" ]] || continue
      if ! grep -Fxq -- "$path" "$tmp.before" 2>/dev/null; then
        printf '%s\n' "$path"
      fi
    done <"$tmp.after" >"$tmp.after2"
    while IFS= read -r path; do
      [[ -n "$path" ]] || continue
      if ! git_path_under_prefix "$path" "${prefixes[@]}"; then
        printf '%s\n' "$path" >>"$tmp.new"
      fi
    done <"$tmp.after2"
  fi
  if [[ -s "$tmp.new" ]]; then
    {
      echo ""
      echo "⚠️  $label: worker touched out-of-scope paths (NOT in this ticket's files: frontmatter, NOT staged):"
      sed 's/^/    /' "$tmp.new"
      echo "    Commit or ignore them by hand — they belong to a different scope."
    } | tee -a "${LOG_FILE:-/dev/null}" >&2
  fi
  rm -f "$tmp" "$tmp.before" "$tmp.after" "$tmp.after2" "$tmp.new"
}

# files_mode_worker_note — sentence the driver appends to its worker prompt in
# files mode so the worker scopes its own git-status cleanliness checks to the
# ticket (avoiding the trap that previously made ralph sweep 31+ files from
# other parallel sessions in ~/Documents/itastack).
files_mode_worker_note() {
  printf '%s' "Scope every git status cleanliness check, stage operation, and commit to this ticket's files: frontmatter prefixes (plus .kanban/). Out-of-scope changes belong to a different session — NEVER stage or commit them, even with git add -A."
}

# pick_next_target_for_warning — lightweight variant of the iteration's
# target selection, used only to filter the startup pre-existing-changes
# warning. Mirrors the iteration order: review-loop target via
# select_actionable_review_target; active resume (head -1 of ACTIVE_ISSUES);
# pending via `board next`. Echoes the chosen ticket path (or empty).
pick_next_target_for_warning() {
  : "${PICKW_REVIEW_LOOP:=${REVIEW_LOOP:-false}}"
  : "${PICKW_BOARD_SH:=${BOARD_SH:-}}"
  : "${PICKW_SPEC:=${SPEC:-}}"
  : "${PICKW_ACTIVE_ISSUES:=${ACTIVE_ISSUES:-}}"
  if [[ "$PICKW_REVIEW_LOOP" == "true" ]]; then
    # The review selector lives only in the generated child script, so the
    # startup warning has no target here and prints an out-of-scope count only.
    declare -F select_actionable_review_target >/dev/null && select_actionable_review_target 2>/dev/null
    return 0
  fi
  if [[ -n "$PICKW_ACTIVE_ISSUES" ]]; then
    printf '%s\n' "$PICKW_ACTIVE_ISSUES" | sed '/^$/d' | head -1
    return 0
  fi
  if [[ -z "$PICKW_BOARD_SH" ]]; then
    return 0
  fi
  "$PICKW_BOARD_SH" --board .kanban ${PICKW_SPEC:+--spec "$PICKW_SPEC"} next 2>/dev/null |
    cut -f2 || true
}

# emit_pre_existing_dirty_warning — build the textual warning that the loop
# prints at startup when the working tree has uncommitted changes outside
# .pi-lens. Resolves scope via effective_checkpoint_scope (env > --flag > git
# config > "all"), so a repo with `git config ralph.checkpointScope files`
# triggers files-mode filtering even without RALPH_CHECKPOINT_SCOPE set.
# In files mode with a known next target the in-scope paths are listed
# individually (matching the ticket's files: prefixes plus .kanban/) and a
# count of out-of-scope paths is reported; without a target only a count is
# printed. In default ("all") scope the warning is unchanged.
emit_pre_existing_dirty_warning() {
  local status_text="$1" next_target="${2:-}"
  local scope
  scope=$(effective_checkpoint_scope)

  if [[ "$scope" != "files" ]]; then
    printf '%s\n' "⚠️  Working directory has pre-existing uncommitted changes"
    printf '%s\n' "   Ralph will auto-commit all non-ignored changes except .pi-lens before launching each worker."
    printf '\n'
    if [[ -n "$status_text" ]]; then
      printf '%s\n' "$status_text"
    fi
    return 0
  fi

  # Files mode header.
  printf '%s\n' "⚠️  Working directory has pre-existing uncommitted changes"
  printf '%s\n' "   In files mode Ralph will stage only the active ticket's files: frontmatter"
  printf '%s\n' "   prefixes (plus .kanban/) before launching each worker. Out-of-scope paths"
  printf '%s\n' "   belong to other sessions and are intentionally left alone."
  printf '\n'

  local total_count
  total_count=$(printf '%s\n' "$status_text" | awk 'NF{c++} END{print c+0}')
  if [[ -z "$next_target" || ! -f "$next_target" ]]; then
    printf '%s\n' "   Out-of-scope path count: $total_count (no next-ticket target known yet — the loop will stop if files: frontmatter is also missing)"
    return 0
  fi

  local prefixes_file
  prefixes_file=$(mktemp)
  if ! build_files_mode_pathspec "$next_target" "$prefixes_file" 2>/dev/null || [[ ! -s "$prefixes_file" ]]; then
    rm -f "$prefixes_file"
    printf '%s\n' "   Total dirty paths: $total_count (next ticket has no files: frontmatter; the loop will refuse to fall back to add -A)"
    return 0
  fi

  # Read prefixes into an array, then walk status lines splitting per prefix.
  local -a prefixes=()
  local p
  while IFS= read -r p; do
    [[ -n "$p" ]] && prefixes+=("$p")
  done <"$prefixes_file"

  local in_lines=() out_count_v=0 line path
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    path="${line:3}"
    path="${path%% -> *}"
    [[ -n "$path" ]] || continue
    if git_path_under_prefix "$path" "${prefixes[@]}"; then
      in_lines+=("$line")
    else
      out_count_v=$((out_count_v + 1))
    fi
  done <<<"$status_text"

  if [[ ${#in_lines[@]} -gt 0 ]]; then
    printf '%s\n' "   In-scope paths (will be checkpointed):"
    printf '     %s\n' "${in_lines[@]}"
  else
    printf '%s\n' "   In-scope paths (will be checkpointed): (none)"
  fi
  printf '\n'
  printf '%s\n' "   Out-of-scope path count (left for other sessions): $out_count_v"
  rm -f "$prefixes_file"
}

# checkpoint_dirty_worktree <message> [target_ticket] [phase]
#
# Behavior:
#   • Default scope "all": stages and commits everything outside .pi-lens
#     (pre-files-mode behavior, unchanged).
#   • Files scope "files": stages only the ticket's files: prefixes plus
#     .kanban/. Stale-dirtiness check considers only in-scope paths so the
#     loop does not stall on out-of-scope edits owned by other sessions.
#   • If a target ticket cannot be identified OR has no files: frontmatter in
#     files mode, the function REFUSES to fall back to `git add -A`:
#        - phase=pre-worker: log and skip (return 0; do not halt the loop)
#        - phase=post-issue : log and stop (return 1; caller breaks the loop)
#     so a human can stage the boundary case deliberately.
#
# Globals consumed: CHECKPOINT_DIRTY (default true — bail if false),
# CHECKPOINT_SCOPE_OVERRIDE / RALPH_CHECKPOINT_SCOPE / git config
# ralph.checkpointScope (resolved via effective_checkpoint_scope),
# LOG_FILE (logs append here; falls back to /dev/null).
checkpoint_dirty_worktree() {
  local message="${1:-chore(ralph): checkpoint worktree before worker}"
  local target="${2:-}"
  local phase="${3:-pre-worker}"

  [[ "${CHECKPOINT_DIRTY:-true}" == "true" ]] || return 0
  git rev-parse --git-dir >/dev/null 2>&1 || return 0

  # Cache the resolved scope on the LOOP_SCRIPT-side helper too (the parent
  # resolves it once at start; the child bash has its own CHECKPOINT_SCOPE var
  # populated from INNER_ARGS).
  local scope="${CHECKPOINT_SCOPE:-}"
  if [[ -z "$scope" ]]; then
    scope=$(resolve_checkpoint_scope)
    CHECKPOINT_SCOPE="$scope"
  fi

  cleanup_ephemeral_artifacts || true
  local status
  status=$(git_status_ignoring_pi_lens)
  [[ -n "$status" ]] || return 0

  echo "" | tee -a "${LOG_FILE:-/dev/null}"
  echo "💾 Checkpointing dirty worktree ($scope scope): $message" | tee -a "${LOG_FILE:-/dev/null}"
  git_status_short_ignoring_pi_lens | tee -a "${LOG_FILE:-/dev/null}"

  if [[ "$scope" == "files" ]]; then
    if [[ -z "$target" || ! -f "$target" ]]; then
      if [[ "$phase" == "post-issue" ]]; then
        echo "❌ Files-scope checkpoint: cannot determine target ticket; refusing to fall back to add -A. Stopping the loop so a human can stage deliberately." | tee -a "${LOG_FILE:-/dev/null}" >&2
        return 1
      fi
      echo "⚠️  Files-scope pre-worker checkpoint: no target ticket identified; skipping (worktree left as-is for the worker to see)." | tee -a "${LOG_FILE:-/dev/null}"
      return 0
    fi
    local prefixes_file
    prefixes_file=$(mktemp)
    if ! build_files_mode_pathspec "$target" "$prefixes_file" || [[ ! -s "$prefixes_file" ]]; then
      rm -f "$prefixes_file"
      if [[ "$phase" == "post-issue" ]]; then
        echo "❌ Files-scope checkpoint: ticket $(basename "$target") has no files: frontmatter; refusing to fall back to add -A. Stopping the loop so a human can stage deliberately." | tee -a "${LOG_FILE:-/dev/null}" >&2
        return 1
      fi
      echo "⚠️  Files-scope pre-worker checkpoint: ticket $(basename "$target") has no files: frontmatter; skipping." | tee -a "${LOG_FILE:-/dev/null}"
      return 0
    fi
    # Stage only the in-scope paths. Bash array expansion with `"${arr[@]}"`
    # handles whitespace/globs/literal `-`/`+` correctly without `%q` — using
    # %q would embed literal quote characters into the path, so a prefix with
    # a space or `[...]` would be added as a malformed literal path.
    local -a pathspec=()
    local line
    while IFS= read -r line; do
      [[ -n "$line" ]] || continue
      pathspec+=("$line")
    done <"$prefixes_file"
    git add -- "${pathspec[@]}" 2>>"${LOG_FILE:-/dev/null}"
    if git diff --cached --quiet; then
      echo "⚠️  Files-scope checkpoint: in-scope paths had nothing stageable" | tee -a "${LOG_FILE:-/dev/null}"
      git_status_short_ignoring_pi_lens | tee -a "${LOG_FILE:-/dev/null}"
      rm -f "$prefixes_file"
      return 1
    fi
    if ! git commit -m "$message" 2>&1 | tee -a "${LOG_FILE:-/dev/null}"; then
      echo "⚠️  Files-scope checkpoint: failed to commit" | tee -a "${LOG_FILE:-/dev/null}"
      rm -f "$prefixes_file"
      return 1
    fi
    rm -f "$prefixes_file"
  else
    git add -A -- . ':(exclude).pi-lens' ':(exclude).sessions'
    if git diff --cached --quiet; then
      echo "⚠️  Dirty worktree had nothing stageable" | tee -a "${LOG_FILE:-/dev/null}"
      git_status_short_ignoring_pi_lens | tee -a "${LOG_FILE:-/dev/null}"
      return 1
    fi
    if ! git commit -m "$message" 2>&1 | tee -a "${LOG_FILE:-/dev/null}"; then
      echo "⚠️  Failed to create pre-worker checkpoint commit" | tee -a "${LOG_FILE:-/dev/null}"
      return 1
    fi
  fi

  cleanup_ephemeral_artifacts || true
  status=$(git_status_ignoring_pi_lens)
  # In files mode, only in-scope dirt fails the loop; out-of-scope dirt is
  # logged as a reminder but does not block (a shared working tree is the
  # whole point of the mode).
  if [[ "$scope" == "files" && -n "$target" && -f "$target" ]]; then
    local prefixes_file2
    prefixes_file2=$(mktemp)
    if build_files_mode_pathspec "$target" "$prefixes_file2" && [[ -s "$prefixes_file2" ]]; then
      local -a prefixes=()
      while IFS= read -r p; do [[ -n "$p" ]] && prefixes+=("$p"); done <"$prefixes_file2"
      local line path in_scope_dirt=""
      while IFS= read -r line; do
        [[ -n "$line" ]] || continue
        path="${line:3}"
        path="${path%% -> *}"
        [[ -n "$path" ]] || continue
        if git_path_under_prefix "$path" "${prefixes[@]}"; then
          in_scope_dirt+="$line"$'\n'
        fi
      done <<<"$status"
      if [[ -n "$in_scope_dirt" ]]; then
        echo "⚠️  Worktree still dirty after checkpoint commit (in-scope)" | tee -a "${LOG_FILE:-/dev/null}"
        printf '%s\n' "$in_scope_dirt" | tee -a "${LOG_FILE:-/dev/null}"
        rm -f "$prefixes_file2"
        return 1
      fi
      local out_of_scope_dirt=""
      while IFS= read -r line; do
        [[ -n "$line" ]] || continue
        path="${line:3}"
        path="${path%% -> *}"
        [[ -n "$path" ]] || continue
        if ! git_path_under_prefix "$path" "${prefixes[@]}"; then
          out_of_scope_dirt+="$line"$'\n'
        fi
      done <<<"$status"
      if [[ -n "$out_of_scope_dirt" ]]; then
        echo "ℹ️  Worktree still has out-of-scope paths after commit (shared tree)" | tee -a "${LOG_FILE:-/dev/null}"
        printf '%s\n' "$out_of_scope_dirt" | tee -a "${LOG_FILE:-/dev/null}"
      fi
      rm -f "$prefixes_file2"
    fi
  elif [[ -n "$status" ]]; then
    echo "⚠️  Worktree still dirty after checkpoint commit" | tee -a "${LOG_FILE:-/dev/null}"
    git_status_short_ignoring_pi_lens | tee -a "${LOG_FILE:-/dev/null}"
    return 1
  fi

  echo "✅ Worktree clean after checkpoint commit" | tee -a "${LOG_FILE:-/dev/null}"
  return 0
}

# When sourced (e.g. by tests/test-checkpoint-scope.sh) the helper definitions
# above are the only thing wanted; skip the cli side effects below. When
# invoked directly we fall through into the cli body.
if [[ "${BASH_SOURCE[0]:-}" != "${0}" ]]; then
  return 0
fi

usage() {
  cat <<EOF
Ralph Loop - Background tmux driver that runs Ralph until no issues remain

Usage: ralph-loop.sh [OPTIONS] [ADAPTER] [SESSION_NAME]

OPTIONS:
  --force               Skip interactive warnings (active issues, dirty worktree)
  --continue-on-error   Reset issue to pending on failure and continue
  --sleep-interval N    Sleep N seconds between iterations (default: 3)
  --ready-delay N       Initial settle delay before prompt-ready polling (default: 1)
  --ready-timeout N     Seconds to wait for an interactive agent prompt (default: 60)
  --iteration-timeout N Seconds to wait for an interactive agent sentinel (default: 7200)
  --agent-cmd CMD       Interactive agent command for tmux adapter (default: pi with RALPH_MODEL, cliproxy/deepseek-v4.1-flash)
  --agent-prompt TEXT   Prompt sent to the agent (default: RALPH_AGENT_PROMPT or a Ralph invocation prompt)
  --review-loop         Run actionable review/unblock loop instead of pending-issue implementation
  --skip-blocked        Treat a BLOCKED issue as skip-and-continue to the next eligible issue (FAIL still stops)
  --spec SLUG           Only pick up tickets whose frontmatter has spec: SLUG (default: RALPH_SPEC, else all)
  --lsp-check-cmd CMD   Optional command that must pass after each worker before DONE/PASS is accepted
  --no-checkpoint-dirty Do not auto-commit dirty worktree before each worker or after each issue
  --checkpoint-scope M  Override git config ralph.checkpointScope (all|files). Default 'all'; 'files' scopes commits to the ticket's files: prefixes (+ .kanban/) — needed for shared working trees
  --socket PATH         Private tmux socket path (implies --private-tmux)
  --private-tmux        Use Ralph's private tmux socket instead of default tmux
  --normal-tmux         Use the default tmux server (default)
  --help                Show this help

ARGUMENTS:
  ADAPTER               tmux|pi (default: tmux)
  SESSION_NAME          tmux driver session name (default: ralph-loop)

Sentinel contract:
  RALPH_RESULT: DONE #<id>
  RALPH_RESULT: NO_WORK
  RALPH_RESULT: BLOCKED #<id>
  RALPH_RESULT: FAIL #<id>
EOF
}

while [[ $# -gt 0 ]]; do
  case $1 in
  --force)
    FORCE_MODE=true
    shift
    ;;
  --continue-on-error)
    CONTINUE_ON_ERROR=true
    shift
    ;;
  --sleep-interval)
    SLEEP_INTERVAL="${2:-3}"
    shift 2
    ;;
  --ready-delay)
    READY_DELAY="${2:-1}"
    shift 2
    ;;
  --ready-timeout)
    READY_TIMEOUT="${2:-60}"
    shift 2
    ;;
  --iteration-timeout)
    ITERATION_TIMEOUT="${2:-7200}"
    shift 2
    ;;
  --agent-cmd)
    if [[ -z "${2:-}" || "${2:-}" == --* ]]; then
      echo "❌ Error: --agent-cmd requires a command" >&2
      exit 1
    fi
    AGENT_CMD="$2"
    AGENT_CMD_EXPLICIT=true
    shift 2
    ;;
  --agent-prompt)
    AGENT_PROMPT="${2:-}"
    AGENT_PROMPT_EXPLICIT=true
    shift 2
    ;;
  --review-loop)
    REVIEW_LOOP=true
    shift
    ;;
  --skip-blocked)
    SKIP_BLOCKED=true
    shift
    ;;
  --unattended)
    UNATTENDED=true
    shift
    ;;
  --spec)
    if [[ -z "${2:-}" || "${2:-}" == --* ]]; then
      echo "❌ Error: --spec requires a slug" >&2
      exit 1
    fi
    SPEC="$2"
    shift 2
    ;;
  --lsp-check-cmd)
    if [[ -z "${2:-}" || "${2:-}" == --* ]]; then
      echo "❌ Error: --lsp-check-cmd requires a command" >&2
      exit 1
    fi
    LSP_CHECK_CMD="$2"
    shift 2
    ;;
  --no-checkpoint-dirty)
    CHECKPOINT_DIRTY=false
    shift
    ;;
  --checkpoint-scope)
    if [[ -z "${2:-}" || "${2:-}" == --* ]]; then
      echo "❌ Error: --checkpoint-scope requires a value (all|files)" >&2
      exit 1
    fi
    case "$2" in
    all | files) ;;
    *)
      echo "❌ Error: --checkpoint-scope value must be 'all' or 'files', got '$2'" >&2
      exit 1
      ;;
    esac
    CHECKPOINT_SCOPE_OVERRIDE="$2"
    shift 2
    ;;
  --socket)
    if [[ -z "${2:-}" || "${2:-}" == --* ]]; then
      echo "❌ Error: --socket requires a path" >&2
      exit 1
    fi
    TMUX_SOCKET="$2"
    USE_NORMAL_TMUX=false
    shift 2
    ;;
  --private-tmux)
    USE_NORMAL_TMUX=false
    shift
    ;;
  --normal-tmux)
    USE_NORMAL_TMUX=true
    shift
    ;;
  --help)
    usage
    exit 0
    ;;
  *)
    break
    ;;
  esac
done

case "${USE_NORMAL_TMUX,,}" in
true | 1 | yes | y | on) USE_NORMAL_TMUX=true ;;
*) USE_NORMAL_TMUX=false ;;
esac

if [[ "$REVIEW_LOOP" == "true" && -z "${RALPH_AGENT_PROMPT:-}" && "$AGENT_PROMPT_EXPLICIT" != "true" ]]; then
  AGENT_PROMPT="Run Ralph actionable review loop for exactly one issue in this repository. Follow the Ralph Actionable Review Loop protocol. You may edit, test, and commit fixes when review finds gaps or blockers. Stop after one issue. Print the required RALPH_RESULT sentinel."
elif [[ "$REVIEW_LOOP" == "true" && -n "${RALPH_AGENT_PROMPT:-}" && "$AGENT_PROMPT_EXPLICIT" != "true" ]]; then
  echo "⚠️  RALPH_AGENT_PROMPT is set; appending review-loop framing via shared prompt reminder." >&2
fi

ADAPTER="${1:-tmux}"
SESSION_NAME="${2:-ralph-loop}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOARD_SH="$(dirname "$SKILL_DIR")/kanban/board.sh"
if [[ ! -x "$BOARD_SH" ]]; then
  echo "❌ Error: kanban eligibility script not found or not executable: $BOARD_SH" >&2
  exit 1
fi

if [[ "$SESSION_NAME" =~ [.:] ]]; then
  echo "❌ Error: session name '$SESSION_NAME' contains '.' or ':' (invalid in tmux)" >&2
  exit 1
fi
IMPLEMENT_SKILL_DIR="$(dirname "$SKILL_DIR")/implement"
# Invoke the implement skill only when we control the worker pi command.
# Prompts name each skill by its SKILL.md path (pi reads ~/.agents/skills
# natively, but disable-model-invocation keeps ralph and implement out of the
# listing, so the worker must be told which file to read). We still only
# prefix the prompt when the driver builds the worker command itself: a
# user-supplied command may be a different agent with its own skill wiring.
USE_IMPLEMENT_SKILL=false
if [[ -f "$IMPLEMENT_SKILL_DIR/SKILL.md" ]]; then
  if [[ "$ADAPTER" == "pi" ]]; then
    USE_IMPLEMENT_SKILL=true
  elif [[ "$ADAPTER" == "tmux" && -z "${RALPH_AGENT_CMD:-}" && "$AGENT_CMD_EXPLICIT" != "true" ]]; then
    USE_IMPLEMENT_SKILL=true
  fi
fi

if [[ "$ADAPTER" == "tmux" && -z "${RALPH_AGENT_CMD:-}" && "$AGENT_CMD_EXPLICIT" != "true" ]]; then
  AGENT_CMD="pi --no-extensions"
  if [[ -n "$RALPH_MODEL" ]]; then
    printf -v model_q '%q' "$RALPH_MODEL"
    AGENT_CMD="$AGENT_CMD --model $model_q"
  fi
fi

if [[ "$USE_IMPLEMENT_SKILL" == "true" && "$REVIEW_LOOP" != "true" && "$AGENT_PROMPT" != /skill:* && "$AGENT_PROMPT" != "Read $IMPLEMENT_SKILL_DIR/SKILL.md"* ]]; then
  AGENT_PROMPT="Read $IMPLEMENT_SKILL_DIR/SKILL.md and follow it. $AGENT_PROMPT"
fi
case "$ADAPTER" in
pi | tmux) ;;
omp)
  echo "❌ Error: the omp adapter was removed; use 'pi' (non-interactive) or 'tmux'" >&2
  exit 1
  ;;
*)
  echo "❌ Error: unsupported adapter '$ADAPTER' (expected pi or tmux)" >&2
  exit 1
  ;;
esac

if ! command -v tmux >/dev/null 2>&1; then
  echo "❌ Error: tmux not found in PATH" >&2
  exit 1
fi

if [[ "$ADAPTER" == "pi" || "$AGENT_CMD" == pi\ * ]] && ! command -v pi >/dev/null 2>&1; then
  echo "❌ Error: pi not found in PATH" >&2
  exit 1
fi

tmux_cmd() {
  if [[ "$USE_NORMAL_TMUX" == "true" ]]; then
    tmux "$@"
  else
    tmux -S "$TMUX_SOCKET" "$@"
  fi
}

tmux_display() {
  if [[ "$USE_NORMAL_TMUX" == "true" ]]; then
    echo "tmux"
  else
    echo "tmux -S '$TMUX_SOCKET'"
  fi
}

TMUX_DISPLAY="$(tmux_display)"
if [[ "$USE_NORMAL_TMUX" == "true" ]]; then
  RESTART_CMD="$0 --normal-tmux $ADAPTER $SESSION_NAME"
else
  RESTART_CMD="$0 $ADAPTER $SESSION_NAME"
fi

if [[ "$USE_NORMAL_TMUX" != "true" ]]; then
  mkdir -p "$(dirname "$TMUX_SOCKET")"
fi
mkdir -p "$HOME/.cache"

if tmux_cmd has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "⚠️  Tmux session '$SESSION_NAME' already exists on $TMUX_DISPLAY"
  echo ""
  echo "Options:"
  echo "  1. Attach to existing session:  $TMUX_DISPLAY attach -t '$SESSION_NAME'"
  echo "  2. Kill and restart:            $TMUX_DISPLAY kill-session -t '$SESSION_NAME' && $RESTART_CMD"
  echo "  3. Use different name:          $0 $ADAPTER <different-name>"
  exit 1
fi

if [[ ! -d .kanban ]]; then
  echo "❌ Error: No .kanban/ directory found in current directory" >&2
  echo "   Run this from a project with a kanban board" >&2
  exit 1
fi

if [[ ! -d .kanban/issues ]]; then
  echo "❌ Error: No .kanban/issues/ directory found" >&2
  echo "   The kanban board structure is incomplete" >&2
  exit 1
fi

if [[ ! -f .kanban/progress.md ]]; then
  echo "⚠️  Warning: .kanban/progress.md not found, creating empty file" >&2
  mkdir -p .kanban
  {
    echo "# Ralph Progress Log"
    echo ""
    echo "This file tracks implementation notes across Ralph iterations."
    echo ""
  } >.kanban/progress.md
fi

if [[ "$FORCE_MODE" != "true" ]] && git rev-parse --git-dir >/dev/null 2>&1 && [[ -n "$(git status --porcelain -- . ':(exclude).pi-lens' ':(exclude).sessions')" ]]; then
  # In files mode the pre-existing-changes warning must consider only in-scope
  # paths of the soon-to-be-picked ticket; otherwise a shared working tree
  # (e.g. ~/Documents/itastack) emits the warning for every out-of-scope edit
  # even though those will not be touched by the checkpoint or the worker.
  # The helper reads RALPH_CHECKPOINT_SCOPE / --checkpoint-scope / git config
  # ralph.checkpointScope via effective_checkpoint_scope and filters the
  # printed paths to in-scope (showing out-of-scope as a count); with no
  # known target it prints only a count so the user still sees how many
  # out-of-scope items exist. We capture with `-uall` so the individual file
  # entries appear (plain `--porcelain` would collapse each untracked dir to a
  # single `?? dir/` line, masking the real files the worker touched).
  status_text=$(git status --porcelain -uall -- . ':(exclude).pi-lens' ':(exclude).sessions')
  next_target=""
  next_target=$(ACTIVE_ISSUES="" SPEC="$SPEC" BOARD_SH="$BOARD_SH" REVIEW_LOOP="$REVIEW_LOOP" pick_next_target_for_warning 2>/dev/null || true)
  emit_pre_existing_dirty_warning "$status_text" "$next_target" >&2
  echo "" >&2
fi

# Startup warning only (the loop itself scopes via active_ticket_files): list the active
# tickets this run will resume, i.e. those inside --spec when one was given.
ACTIVE_ISSUES=$("$BOARD_SH" --board .kanban ${SPEC:+--spec "$SPEC"} files 2>/dev/null |
  while IFS= read -r _f; do grep -lE '^status: (in-progress|review)$' "$_f" 2>/dev/null || true; done)
if [[ -n "$ACTIVE_ISSUES" && "$FORCE_MODE" != "true" ]]; then
  echo "⚠️  Found active issue(s) in 'in-progress' or 'review' state" >&2
  echo "" >&2
  echo "$ACTIVE_ISSUES" >&2
  echo "" >&2
  if [[ "$REVIEW_LOOP" == "true" ]]; then
    echo "Ralph review-loop will process these active issues per the Actionable Review Loop." >&2
  else
    echo "Ralph will resume the active issue instead of resetting it to pending." >&2
    echo "If you really want to abandon it, edit the issue status manually or restore from .kanban/backups." >&2
  fi
fi

LOOP_SCRIPT="$HOME/.cache/ralph-loop-$SESSION_NAME.sh"

# Resolve checkpoint scope once for the parent (this process) so the startup
# banner can print it and the warning above can reference it. The same value
# is forwarded to LOOP_SCRIPT via $28 below.
CHECKPOINT_SCOPE=$(effective_checkpoint_scope)

if [[ "$REVIEW_LOOP" == "true" ]]; then
  SHARED_PROMPT_REMINDER='Run Ralph actionable review loop for exactly one issue in this repository. Read the Ralph skill at ~/.agents/skills/ralph/SKILL.md and follow it. Operate only on the explicit review target path provided by the loop. Selection order has already been applied by the loop. This is an UNATTENDED background loop with no operator present: never call ask_user_question or any interactive approval prompt, because nothing can answer it and the loop stalls until timeout. Operator approval for service-affecting actions (installing, enabling, or restarting systemd units, building, running migrations, restarting daemons) is granted in advance, so proceed without asking. Reserve BLOCKED for work that is genuinely impossible, never for actions that merely need confirmation. For verification steps that would emit an out…
Valid final statuses are DONE with an issue id, NO_WORK, BLOCKED with an issue id, or FAIL with an optional issue id. In review-loop mode, BLOCKED is a valid terminal outcome when the target remains blocked after an attempted fix.
The final line must start with RALPH_RESULT followed by colon and one space.'
else
  SHARED_PROMPT_REMINDER='Run Ralph for exactly one issue in this repository. Read the Ralph skill at ~/.agents/skills/ralph/SKILL.md and follow it. Stop after one issue. This is an UNATTENDED background loop with no operator present: never call ask_user_question or any interactive approval prompt, because nothing can answer it and the loop stalls until timeout. Operator approval for service-affecting actions (installing, enabling, or restarting systemd units, building, running migrations, restarting daemons) is granted in advance, so proceed without asking. Reserve BLOCKED for work that is genuinely impossible, never for actions that merely need confirmation. For verification steps that would emit an outward notification to an external channel (alert or paging webhooks, telegram, email), verify…
Valid final statuses are DONE with an issue id, NO_WORK, BLOCKED with an optional issue id, or FAIL with an optional issue id.
The final line must start with RALPH_RESULT followed by colon and one space.'
fi

# Write the LOOP_SCRIPT that the tmux session executes. Two pieces:
#   1. Header (unquoted heredoc) — `#!/bin/bash`, `set -euo pipefail`, then a
#      $(declare -f ...) dump of the testable helpers defined at the top of this
#      file. That makes the same implementations available to this child bash
#      without copy-pasting them into the heredoc body.
#   2. Body (quoted heredoc) — the inner script unchanged in spirit; it calls
#      the helpers from the header.
{
  echo '#!/bin/bash'
  echo 'set -euo pipefail'
  echo "# --- helpers sourced via declare -f (see top of $(basename "$0")) ---"
  declare -f "${RALPH_HELPERS[@]}"
  echo "# --- end helpers ---"
  echo ""
} >"$LOOP_SCRIPT"

cat >>"$LOOP_SCRIPT" <<'LOOP_EOF'
ADAPTER="$1"
PROJECT_DIR="$2"
SESSION_NAME="$3"
CONTINUE_ON_ERROR="$4"
SLEEP_INTERVAL="$5"
READY_DELAY="$6"
ITERATION_TIMEOUT="$7"
READY_TIMEOUT="$8"
AGENT_CMD="$9"
AGENT_PROMPT="${10}"
SKILL_DIR="${11}"
TMUX_SOCKET="${12}"
USE_NORMAL_TMUX="${13}"
SHARED_PROMPT_REMINDER="${14}"
RALPH_MODEL="${15}"
CHECKPOINT_DIRTY="${16}"
REVIEW_LOOP="${17}"
LSP_CHECK_CMD="${18}"
UNATTENDED="${19:-false}"
MAX_ISSUE_FAILS="${20:-2}"
AGENT_CMD_EXPLICIT="${21:-false}"
SKIP_BLOCKED="${22:-false}"
IMPLEMENT_SKILL_DIR="${23:-}"
USE_IMPLEMENT_SKILL="${24:-false}"
BOARD_SH="${25:?board.sh path missing}"
SPEC="${26:-}"
READY_LABEL="${27:-ready-for-agent}"
# Files-scope = per-repo opt-in (git config ralph.checkpointScope files) or
# RALPH_CHECKPOINT_SCOPE env (also --checkpoint-scope on the cli). Default "all"
# keeps the pre-files-mode behavior everywhere a repo hasn't opted in.
CHECKPOINT_SCOPE="${28:-all}"
LOG_FILE="$HOME/.cache/ralph-loop-$SESSION_NAME.log"
FAIL_STATE="$HOME/.cache/ralph-fails-$SESSION_NAME"
LOOP_EXIT_CODE=0

mkdir -p "$HOME/.cache"
cd "$PROJECT_DIR"
: > "$LOG_FILE"


tmux_cmd() {
  if [[ "$USE_NORMAL_TMUX" == "true" ]]; then
    tmux "$@"
  else
    tmux -S "$TMUX_SOCKET" "$@"
  fi
}

tmux_display() {
  if [[ "$USE_NORMAL_TMUX" == "true" ]]; then
    echo "tmux"
  else
    echo "tmux -S '$TMUX_SOCKET'"
  fi
}

TMUX_DISPLAY="$(tmux_display)"

# The functions git_status_ignoring_pi_lens, git_status_short_ignoring_pi_lens,
# cleanup_ephemeral_artifacts, normalize_issue_id, issue_id_for_file,
# issue_status_for_file, issue_priority_for_file, has_valid_action_reviewed,
# and the files-mode helpers (build_files_mode_pathspec, etc.) plus
# checkpoint_dirty_worktree are defined at the top of this script so tests can
# source them. They are made available inside this LOOP_SCRIPT body via the
# (declare -f ...) dump that the parent writes into the file's header — see
# LOOP_SCRIPT construction in the cli body below. Do not redefine them here.

review_issue_attempted() {
  local id
  id=$(normalize_issue_id "$1")
  [[ " $ATTEMPTED_REVIEW_ISSUES " == *" $id "* ]]
}

count_actionable_review_targets() {
  local count=0
  local issue_file status id

  while IFS= read -r issue_file; do
    [[ -f "$issue_file" ]] || continue
    status=$(issue_status_for_file "$issue_file")
    id=$(issue_id_for_file "$issue_file")
    [[ -n "$id" ]] || continue
    review_issue_attempted "$id" && continue
    case "$status" in
      blocked | review | in-progress)
        count=$((count + 1))
        ;;
      done)
        if ! has_valid_action_reviewed "$issue_file"; then
          count=$((count + 1))
        fi
        ;;
    esac
  done < <(scoped_ticket_files)

  echo "$count"
}

select_actionable_review_target() {
  local wanted issue_file status id priority candidate

  for wanted in blocked review in-progress done; do
    candidate=$(
      while IFS= read -r issue_file; do
        [[ -f "$issue_file" ]] || continue
        status=$(issue_status_for_file "$issue_file")
        [[ "$status" == "$wanted" ]] || continue
        id=$(issue_id_for_file "$issue_file")
        [[ -n "$id" ]] || continue
        review_issue_attempted "$id" && continue
        if [[ "$status" == "done" ]] && has_valid_action_reviewed "$issue_file"; then
          continue
        fi
        priority=$(issue_priority_for_file "$issue_file")
        printf '%06d %012d %s
' "$priority" "$(normalize_issue_id "$id")" "$issue_file"
      done < <(scoped_ticket_files) | sort -k1,1n -k2,2n | head -1 | cut -d' ' -f3-
    )
    if [[ -n "$candidate" ]]; then
      printf '%s' "$candidate"
      return 0
    fi
  done

  return 1
}


# Eligibility (pending + exactly one triage state label == ready label + resolved
# blockers, archive searched) is decided by board.sh so this loop, gralph, the
# supervisor and the shepherd cannot drift apart.
board() {
  "$BOARD_SH" --board .kanban ${SPEC:+--spec "$SPEC"} --ready-label "$READY_LABEL" "$@"
}

# scoped_ticket_files prints the path of every ticket in scope (any status), where
# scope is --spec when given, else the whole board. Every scan that picks tickets by
# STATUS (active resume, review targets, continue-on-error reset, the unattended
# guard) goes through this so --spec confines them exactly as it confines `next`.
scoped_ticket_files() {
  board files 2>/dev/null || true
}
# active_ticket_files prints the in-scope tickets that are in-progress or review.
active_ticket_files() {
  local f
  while IFS= read -r f; do
    [[ -n "$f" ]] || continue
    case "$(issue_status_for_file "$f")" in
      in-progress | review) printf '%s\n' "$f" ;;
    esac
  done < <(scoped_ticket_files)
}

# board_count KEY prints one value from `board.sh counts`; fails the loop loudly
# if board.sh itself errors instead of reporting a false "no work".
BOARD_COUNTS=""
refresh_board_counts() {
  BOARD_COUNTS=$(board counts) || {
    echo "❌ board.sh failed; refusing to continue on an unreadable board" | tee -a "$LOG_FILE"
    return 1
  }
}
board_count() {
  printf '%s\n' "$BOARD_COUNTS" | sed -n "s/^$1=//p" | head -1
}

count_unblocked_pending() {
  board_count eligible
}

extract_completed_issue() {
  local file="$1"
  sed -n 's/^[^A-Za-z0-9]*RALPH_RESULT: DONE #\{0,1\}\([0-9][0-9A-Za-z]*\)[[:space:]]*$/\1/p' "$file" | tail -1
}

has_no_work_result() {
  local file="$1"
  grep -q '^[^A-Za-z0-9]*RALPH_RESULT: NO_WORK[[:space:]]*$' "$file" 2>/dev/null
}

has_success_result() {
  local file="$1"
  grep -Eq '^[^A-Za-z0-9]*RALPH_RESULT: DONE #?[0-9][0-9A-Za-z]*[[:space:]]*$|^[^A-Za-z0-9]*RALPH_RESULT: NO_WORK[[:space:]]*$' "$file" 2>/dev/null
}

has_failure_result() {
  local file="$1"
  grep -Eq '^[^A-Za-z0-9]*RALPH_RESULT: BLOCKED( #?[0-9][0-9A-Za-z]*)?[[:space:]]*$|^[^A-Za-z0-9]*RALPH_RESULT: FAIL( #?[0-9][0-9A-Za-z]*)?[[:space:]]*$' "$file" 2>/dev/null
}

has_blocked_result() {
  local file="$1"
  grep -Eq '^[^A-Za-z0-9]*RALPH_RESULT: BLOCKED( #?[0-9][0-9A-Za-z]*)?[[:space:]]*$' "$file" 2>/dev/null
}

has_hard_fail_result() {
  local file="$1"
  grep -Eq '^[^A-Za-z0-9]*RALPH_RESULT: FAIL( #?[0-9][0-9A-Za-z]*)?[[:space:]]*$' "$file" 2>/dev/null
}

# A BLOCKED sentinel is non-fatal (keep looping instead of stopping) when running
# the review loop or when --skip-blocked is set, as long as there is no FAIL.
blocked_is_skippable() {
  local file="$1"
  has_blocked_result "$file" || return 1
  has_hard_fail_result "$file" && return 1
  [[ "$REVIEW_LOOP" == "true" || "$SKIP_BLOCKED" == "true" ]]
}

extract_result_issue() {
  local file="$1"
  sed -n 's/^[^A-Za-z0-9]*RALPH_RESULT: \(DONE\|BLOCKED\|FAIL\) #\{0,1\}\([0-9][0-9A-Za-z]*\)[[:space:]]*$/\2/p' "$file" | tail -1
}

run_pi_adapter() {
  local output_file="$1"
  local full_prompt="$AGENT_PROMPT"$'\n\n'"$SHARED_PROMPT_REMINDER"
  local cmd
  if [[ -n "$RALPH_MODEL" ]]; then
    cmd=(pi --no-extensions --no-session --model "$RALPH_MODEL" -p "$full_prompt")
  else
    cmd=(pi --no-extensions --no-session -p "$full_prompt")
  fi
  local rc=0
  RALPH_MODEL="$RALPH_MODEL" "${cmd[@]}" </dev/null 2>&1 | tee -a "$LOG_FILE" | tee "$output_file" || rc=$?

  if [[ $rc -eq 0 ]]; then
    if blocked_is_skippable "$output_file"; then
      return 0
    fi
    if has_failure_result "$output_file"; then
      echo "⚠️  pi exited 0 but RALPH_RESULT sentinel indicates failure" | tee -a "$LOG_FILE"
      return 1
    fi
  fi
  return $rc
}

wait_for_agent_ready() {
  local target="$1"
  local start now pane
  start=$(date +%s)

  while true; do
    now=$(date +%s)
    if (( now - start >= READY_TIMEOUT )); then
      echo "⚠️  Agent prompt not detected after ${READY_TIMEOUT}s; sending prompt anyway" | tee -a "$LOG_FILE"
      return 1
    fi

    pane=$(tmux_cmd capture-pane -p -J -t "$target" -S -120 2>/dev/null || true)
    if printf '%s\n' "$pane" | grep -Eq '(^|[[:space:]])(❯|>|›)[[:space:]]|▶|INSERT|bypass permissions on|What can I help|How can I help|LSP Inactive|[0-9]+(\.[0-9]+)?% used|0\.0%/'; then
      return 0
    fi

    sleep 1
  done
}

read_result_file() {
  local result_file="$1"
  local output_file="$2"
  [[ -s "$result_file" ]] || return 1
  tr -d '\r' < "$result_file" > "$output_file"
  return 0
}

pane_has_prompt_activity() {
  local target="$1"
  local prompt_probe="$2"
  local pane
  pane=$(tmux_cmd capture-pane -p -J -t "$target" -S -160 2>/dev/null || true)
  if [[ -n "$prompt_probe" ]] && printf '%s\n' "$pane" | grep -Fq -- "$prompt_probe"; then
    return 0
  fi
  printf '%s\n' "$pane" | grep -Eq 'Working|Executing|Checking|Reading|Inspecting|Searching|todo|read |bash |ast_grep|\$ '
}

send_agent_prompt() {
  local target="$1"
  local prompt_line="$2"
  local prompt_probe
  prompt_probe=$(printf '%.80s' "$prompt_line")

  tmux_cmd send-keys -t "$target" C-u
  sleep 1
  tmux_cmd send-keys -t "$target" -l -- "$prompt_line"
  sleep 1
  tmux_cmd send-keys -t "$target" Enter
  sleep 3

  if pane_has_prompt_activity "$target" "$prompt_probe"; then
    return 0
  fi

  echo "⚠️  Prompt submit not observed; retrying once" | tee -a "$LOG_FILE"
  tmux_cmd send-keys -t "$target" C-u
  sleep 1
  tmux_cmd send-keys -t "$target" -l -- "$prompt_line"
  sleep 1
  tmux_cmd send-keys -t "$target" Enter
}

run_tmux_adapter() {
  local output_file="$1"
  local iteration="$2"
  local agent_session="ralph-${SESSION_NAME}-${iteration}"
  local target="$agent_session:0.0"
  local project_q pane now start prompt prompt_line result_file
  local last_vishash idle_secs stall_nudges stall_after max_nudges vispane vishash

  printf -v project_q '%q' "$PROJECT_DIR"
  result_file="$HOME/.cache/ralph-result-${SESSION_NAME}-${iteration}.txt"
  rm -f "$result_file"

  if tmux_cmd has-session -t "$agent_session" 2>/dev/null; then
    tmux_cmd kill-session -t "$agent_session"
  fi

  echo "▶ Starting interactive agent session: $agent_session" | tee -a "$LOG_FILE"
  # Bound worker memory: launch the pane inside a transient systemd --user scope
  # with a MemoryMax cap so a runaway child (e.g. a service the worker starts) is
  # cgroup-OOM-killed inside its own scope instead of triggering a GLOBAL host OOM
  # that kills unrelated services. The default tmux server env has
  # DBUS_SESSION_BUS_ADDRESS=disabled: and no XDG_RUNTIME_DIR, so supply both. If a
  # scope cannot be created (no working user bus), fall back to an uncapped launch
  # (previous behavior) so workers never fail to start.
  local mem_prefix="" xrd="/run/user/$(id -u)"
  if command -v systemd-run >/dev/null 2>&1 && env XDG_RUNTIME_DIR="$xrd" DBUS_SESSION_BUS_ADDRESS="unix:path=$xrd/bus" systemd-run --user --scope --quiet -p MemoryMax=64M --description=ralph-memcap-probe true >/dev/null 2>&1; then
    mem_prefix="env XDG_RUNTIME_DIR=$xrd DBUS_SESSION_BUS_ADDRESS=unix:path=$xrd/bus systemd-run --user --scope --quiet -p MemoryMax=8G -p MemorySwapMax=2G "
    echo "🧠 Worker memory cap: MemoryMax=8G MemorySwapMax=2G (systemd --user scope)" | tee -a "$LOG_FILE"
  else
    echo "ℹ️  Worker memory cap unavailable (no working systemd --user scope); launching uncapped" | tee -a "$LOG_FILE"
  fi
  # Export RALPH_MODEL into the worker so the reviewer it spawns can pin the
  # same model (ralph SKILL.md reviewer examples read it).
  local model_env=""
  [[ -n "$RALPH_MODEL" ]] && printf -v model_env 'RALPH_MODEL=%q ' "$RALPH_MODEL"
  tmux_cmd new-session -d -s "$agent_session" "cd $project_q && exec ${mem_prefix}env ${model_env}$AGENT_CMD"
  tmux_cmd set-option -t "$agent_session" history-limit 50000 2>/dev/null || true
  sleep "$READY_DELAY"
  if ! tmux_cmd has-session -t "$agent_session" 2>/dev/null; then
    echo "⚠️  Interactive agent session exited during startup" | tee -a "$LOG_FILE"
    return 1
  fi
  wait_for_agent_ready "$target" || true
  sleep "$READY_DELAY"

  prompt="$AGENT_PROMPT"$'\n\n'"$SHARED_PROMPT_REMINDER"$'\n'"Also write the exact same final RALPH_RESULT line to: $result_file"
  prompt_line=$(printf '%s' "$prompt" | tr '\n' ' ' | sed 's/[[:space:]][[:space:]]*/ /g')

  echo "⌨️  Sending Ralph prompt to $agent_session" | tee -a "$LOG_FILE"
  send_agent_prompt "$target" "$prompt_line"

  echo "📺 Monitor agent: $TMUX_DISPLAY attach -t '$agent_session'" | tee -a "$LOG_FILE"

  start=$(date +%s)
  last_vishash=""; idle_secs=0; stall_nudges=0
  stall_after="${RALPH_STALL_NUDGE_SECONDS:-300}"   # idle seconds before nudging "continue"; high enough that a slow reviewer (e.g. ~2 tok/s gpt-5.6-sol) streaming its critique is not mistaken for a stall
  max_nudges="${RALPH_MAX_STALL_NUDGES:-3}"          # give up after this many nudges
  while true; do
    now=$(date +%s)
    if (( now - start > ITERATION_TIMEOUT )); then
      echo "⚠️  Timed out waiting for Ralph sentinel after ${ITERATION_TIMEOUT}s" | tee -a "$LOG_FILE"
      tmux_cmd capture-pane -p -J -t "$target" -S -50000 > "$output_file" 2>/dev/null || true
      cat "$output_file" >> "$LOG_FILE"
      echo "Session left alive for inspection: $TMUX_DISPLAY attach -t '$agent_session'" | tee -a "$LOG_FILE"
      return 1
    fi

    if ! tmux_cmd has-session -t "$agent_session" 2>/dev/null; then
      echo "⚠️  Interactive agent session exited before printing a sentinel" | tee -a "$LOG_FILE"
      return 1
    fi

    if read_result_file "$result_file" "$output_file"; then
      cat "$output_file" >> "$LOG_FILE"
      if has_success_result "$output_file"; then
        rm -f "$result_file"
        tmux_cmd kill-session -t "$agent_session" 2>/dev/null || true
        return 0
      fi
      if blocked_is_skippable "$output_file"; then
        rm -f "$result_file"
        tmux_cmd kill-session -t "$agent_session" 2>/dev/null || true
        return 0
      fi
      if has_failure_result "$output_file"; then
        rm -f "$result_file"
        echo "Session left alive for inspection: $TMUX_DISPLAY attach -t '$agent_session'" | tee -a "$LOG_FILE"
        return 1
      fi
    fi

    pane=$(tmux_cmd capture-pane -p -J -t "$target" -S -50000 2>/dev/null || true)
    printf '%s\n' "$pane" > "$output_file"

    if has_success_result "$output_file"; then
      cat "$output_file" >> "$LOG_FILE"
      tmux_cmd kill-session -t "$agent_session" 2>/dev/null || true
      return 0
    fi

    if blocked_is_skippable "$output_file"; then
      cat "$output_file" >> "$LOG_FILE"
      tmux_cmd kill-session -t "$agent_session" 2>/dev/null || true
      return 0
    fi

    if has_failure_result "$output_file"; then
      cat "$output_file" >> "$LOG_FILE"
      echo "Session left alive for inspection: $TMUX_DISPLAY attach -t '$agent_session'" | tee -a "$LOG_FILE"
      return 1
    fi

    # Stall detection: if the visible pane is byte-identical for $stall_after
    # seconds with no sentinel, the worker is idle — most often the worker auto-compacted
    # and did not resume the turn. Nudge it with "continue" (what a human would
    # type); give up after $max_nudges so a genuinely dead worker still fails
    # instead of waiting out the full iteration timeout. An actively-working
    # worker animates its spinner/status line, so its pane hash keeps changing
    # and it is never nudged.
    vispane=$(tmux_cmd capture-pane -p -J -t "$target" -S -40 2>/dev/null || true)
    vishash=$(printf '%s' "$vispane" | cksum | cut -d' ' -f1)
    if [[ "$vishash" == "$last_vishash" ]]; then
      idle_secs=$(( idle_secs + SLEEP_INTERVAL ))
    else
      idle_secs=0; last_vishash="$vishash"
    fi
    if (( idle_secs >= stall_after )); then
      if (( stall_nudges < max_nudges )); then
        stall_nudges=$(( stall_nudges + 1 ))
        echo "⏯️  Worker idle ${idle_secs}s with no sentinel; sending 'continue' (nudge ${stall_nudges}/${max_nudges})" | tee -a "$LOG_FILE"
        tmux_cmd send-keys -t "$target" C-u
        tmux_cmd send-keys -t "$target" -l -- "continue"
        tmux_cmd send-keys -t "$target" Enter
        idle_secs=0
      else
        echo "⚠️  Worker still idle after ${max_nudges} continue nudges; giving up on this iteration" | tee -a "$LOG_FILE"
        tmux_cmd capture-pane -p -J -t "$target" -S -50000 > "$output_file" 2>/dev/null || true
        cat "$output_file" >> "$LOG_FILE"
        echo "Session left alive for inspection: $TMUX_DISPLAY attach -t '$agent_session'" | tee -a "$LOG_FILE"
        return 1
      fi
    fi

    sleep "$SLEEP_INTERVAL"
  done
}

run_lsp_check_gate() {
  [[ -n "$LSP_CHECK_CMD" ]] || return 0
  echo "▶ Running critical LSP gate: $LSP_CHECK_CMD" | tee -a "$LOG_FILE"
  if ! bash -lc "$LSP_CHECK_CMD" 2>&1 | tee -a "$LOG_FILE"; then
    echo "⚠️  Critical LSP gate failed" | tee -a "$LOG_FILE"
    return 1
  fi
}

# checkpoint_dirty_worktree is defined at the top of this script (testable
# seam). Inside this LOOP_SCRIPT it is made available via declare -f dump in the
# file's header (see cli body construction).

# Extract a cleanly-runnable shell command from an issue's `## Verification`
# section, or print nothing. "Cleanly runnable" means the section is composed
# ONLY of backtick-quoted commands joined by connectives (and/then/,/whitespace)
# — e.g. `uv run pytest tests/x.py` and `uv run python -m py_compile y.py`.
# Prose verifications (e.g. "restart the service and confirm logs") contain
# non-connective words, so nothing is printed and the driver gate is skipped
# (the reviewer agent still handles those per the prompt mandate).
extract_runnable_verification() {
  local file="$1" section
  section=$(awk '/^##[[:space:]]+Verification/{p=1;next} /^##[[:space:]]/{if(p)exit} p' "$file" | tr '\n' ' ')
  [[ -n "$section" ]] || return 0
  if [[ "$section" == *"\`\`\`"* ]]; then
    return 0
  fi
  printf '%s' "$section" | awk '
    {
      n = split($0, a, "`")
      if (n < 3) exit 1               # no backtick-quoted command present
      cmds = ""
      for (i = 1; i <= n; i++) {
        if (i % 2 == 0) {             # inside backticks: a command segment
          if (cmds == "") cmds = a[i]; else cmds = cmds " && " a[i]
        } else {                      # outside backticks: must be connective only
          g = a[i]; gsub(/[[:space:],.;]/, "", g); gsub(/and|then/, "", g)
          if (g != "") exit 1         # prose present → not cleanly runnable
        }
      }
      if (cmds == "") exit 1
      print cmds
    }
  ' || return 0
}

# Set the frontmatter `status:` of an issue file to a new value (first status
# line only). Mirrors the park-to-blocked rewrites. Callers persist the change
# (e.g. run_verification_gate commits it before returning). Idempotent if already at $2.
set_issue_status() {
  local file="$1" new="$2"
  [[ -f "$file" ]] || return 1
  # Require a real frontmatter status line (a known kanban value) before
  # rewriting; return nonzero if absent so callers never log a state change
  # that did not happen. `unless $seen++` rewrites only the first match, which
  # is the frontmatter line since frontmatter leads the file.
  grep -Eq '^status: (pending|in-progress|review|done|blocked|todo)\b' "$file" || return 1
  perl -0pi -e "s/^status: (?:pending|in-progress|review|done|blocked|todo)\b.*\$/status: $new/m unless \$seen++" "$file"
}

# Driver drift gate: runs ralph-drift-check.sh over the worker's commits
# (WORKER_BASE_SHA..HEAD) against the ticket's spec and grill ledger. Returns 1
# after parking the ticket blocked with the findings when the verdict is DRIFT;
# PASS, DEGRADED and SKIPPED return 0 (only DRIFT blocks).
run_drift_gate() {
  local target_file="$1" target_id="$2" out last
  if [[ -z "${WORKER_BASE_SHA:-}" ]]; then
    echo "⚠️  Drift check skipped for #$target_id: no worker base commit recorded" | tee -a "$LOG_FILE"
    return 0
  fi
  echo "▶ Drift check (#$target_id): $WORKER_BASE_SHA..HEAD against spec + grill ledger" | tee -a "$LOG_FILE"
  out=$(bash "$SKILL_DIR/ralph-drift-check.sh" "$target_file" "$WORKER_BASE_SHA" HEAD 2>&1)
  printf '%s\n' "$out" >>"$LOG_FILE"
  last=$(printf '%s\n' "$out" | tail -1)
  case "$last" in
  "DRIFT_CHECK: DRIFT")
    echo "❌ Drift check found drift for #$target_id; overriding DONE→blocked" | tee -a "$LOG_FILE"
    set_issue_status "$target_file" blocked
    printf '\n## Blocker\n\nWorker printed DONE but the driver drift check found the diff contradicts a recorded decision or builds something out of scope. Fix the code, or change the spec or ledger if the decision itself was wrong, then set `status: pending` again.\n\n%s\n' "$(printf '%s\n' "$out" | sed '$d')" >>"$target_file"
    return 1
    ;;
  "DRIFT_CHECK: PASS") echo "✅ Drift check passed for #$target_id" | tee -a "$LOG_FILE" ;;
  *) echo "⚠️  Drift check for #$target_id: ${last#DRIFT_CHECK: } (does not block)" | tee -a "$LOG_FILE" ;;
  esac
  return 0
}

# Driver verification gate: after a worker prints RALPH_RESULT: DONE #<id>, the
# driver itself re-runs the issue's cleanly-runnable ## Verification command and
# overrides to blocked on failure — the worker's DONE is not trusted on faith.
# Prose verifications have no runnable command, so the DONE stands (the worker's
# own protocol §4 fresh review remains the review layer). Either way the drift
# gate runs last and can still park the ticket blocked. Driver-authored status
# changes are committed immediately so the worktree-merge finalizer sees them.
run_verification_gate() {
  local output_file="$1" raw_id target_id target_file verify_cmd
  raw_id=$(extract_completed_issue "$output_file")
  [[ -n "$raw_id" ]] || return 0
  target_id=$(normalize_issue_id "$raw_id")
  target_file=$(grep -l "^id: ${target_id}$" .kanban/issues/*.md 2>/dev/null | head -1 || true)
  [[ -n "$target_file" ]] || return 0
  verify_cmd=$(extract_runnable_verification "$target_file")
  if [[ -n "$verify_cmd" ]]; then
    echo "▶ Verification gate (#$target_id): $verify_cmd" | tee -a "$LOG_FILE"
    if bash -lc "$verify_cmd" 2>&1 | tee -a "$LOG_FILE"; then
      if run_drift_gate "$target_file" "$target_id"; then
        set_issue_status "$target_file" done
        echo "✅ Verification gate passed for #$target_id (status: done)" | tee -a "$LOG_FILE"
      fi
    else
      echo "❌ Verification FAILED for #$target_id; overriding DONE→blocked" | tee -a "$LOG_FILE"
      set_issue_status "$target_file" blocked
      printf '\n## Blocker\n\nWorker printed DONE but the driver verification gate failed: `%s` (exit nonzero). Auto-parked done→blocked; see the loop log for output.\n' "$verify_cmd" >> "$target_file"
    fi
  elif run_drift_gate "$target_file" "$target_id"; then
    set_issue_status "$target_file" done
    echo "✅ Verification gate: prose verification for #$target_id — trusting worker DONE (status: done)" | tee -a "$LOG_FILE"
  fi
  if git rev-parse --git-dir >/dev/null 2>&1; then
    if ! git diff --quiet -- "$target_file" 2>/dev/null; then
      git add -- "$target_file" 2>/dev/null \
        && git commit -m "review(#$target_id): driver-authored status after verification gate" 2>&1 | tee -a "$LOG_FILE" || true
    fi
  fi
  return 0
}

reset_active_issues_to_pending() {
  local active_count failed_issue backup_dir active_list
  active_list=$(active_ticket_files)
  active_count=$(printf '%s\n' "$active_list" | sed '/^$/d' | wc -l | tr -d ' ')
  if [[ "$active_count" -eq 0 ]]; then
    return 0
  fi
  if [[ "$active_count" -gt 1 ]]; then
    echo "⚠️  Continue-on-error found $active_count active issues; not resetting automatically." | tee -a "$LOG_FILE"
    printf '%s\n' "$active_list" | sed '/^$/d' | tee -a "$LOG_FILE"
    return 1
  fi

  failed_issue=$(printf '%s\n' "$active_list" | sed '/^$/d' | head -1)
  backup_dir=".kanban/backups/error-recovery-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$backup_dir"
  cp "$failed_issue" "$backup_dir/$(basename "$failed_issue")"
  perl -0pi -e 's/^status: (in-progress|review)$/status: pending/m' "$failed_issue"
  echo "  ✓ Reset $(basename "$failed_issue") to pending" | tee -a "$LOG_FILE"
  echo "  💾 Backup saved to: $backup_dir" | tee -a "$LOG_FILE"
}

{
  echo "═══════════════════════════════════════════════════════════"
  echo "Ralph Loop started at $(date)"
  echo "Adapter: $ADAPTER"
  echo "Project: $PROJECT_DIR"
  echo "Session: $SESSION_NAME"
  echo "Continue on error: $CONTINUE_ON_ERROR"
  echo "Review loop: $REVIEW_LOOP"
  echo "Sleep interval: ${SLEEP_INTERVAL}s"
  echo "Ready delay: ${READY_DELAY}s"
  echo "Ready timeout: ${READY_TIMEOUT}s"
  echo "Iteration timeout: ${ITERATION_TIMEOUT}s"
  echo "Tmux: $TMUX_DISPLAY"
  echo "Model: $RALPH_MODEL"
  echo "Checkpoint dirty worktree: $CHECKPOINT_DIRTY"
  echo "Checkpoint scope: $CHECKPOINT_SCOPE${CHECKPOINT_SCOPE_OVERRIDE:+ (cli override; resolved: $CHECKPOINT_SCOPE)}"
  if [[ -n "$LSP_CHECK_CMD" ]]; then
    echo "LSP check command: $LSP_CHECK_CMD"
  fi
  if [[ "$ADAPTER" == "tmux" ]]; then
    echo "Agent command: $AGENT_CMD"
  fi
  echo "═══════════════════════════════════════════════════════════"
  echo ""
} | tee -a "$LOG_FILE"

# Clean up orphaned worker sessions from a previous driver run so the user never
# has to kill them by hand. The outer script already refused to start if a live
# driver session for this SESSION_NAME exists, so any ralph-<SESSION_NAME>-*
# sessions here are leftovers from a driver that died/was killed.
orphaned_workers=$(tmux_cmd list-sessions -F '#{session_name}' 2>/dev/null | grep "^ralph-${SESSION_NAME}-" || true)
if [[ -n "$orphaned_workers" ]]; then
  echo "🧹 Killing orphaned worker sessions from a previous run:" | tee -a "$LOG_FILE"
  printf '%s\n' "$orphaned_workers" | tee -a "$LOG_FILE"
  printf '%s\n' "$orphaned_workers" | while read -r orphan; do
    [[ -n "$orphan" ]] && tmux_cmd kill-session -t "$orphan" 2>/dev/null || true
  done
fi

BASE_AGENT_PROMPT="$AGENT_PROMPT"
ITERATION=0
MAX_ITERATIONS=1000
ISSUES_COMPLETED=0
REVIEW_TARGETS_PROCESSED=0
ATTEMPTED_REVIEW_ISSUES=""

# Treat `status: todo` as an alias for `status: pending`. Some issue generators
# (e.g. Plane-derived boards) emit `todo`, but the kanban vocabulary and every
# selection path here use `pending`. Normalize in place at the top of each
# iteration so the loop counters AND the worker's own issue selection see
# `pending`; the per-iteration checkpoint commit records the status change.
normalize_todo_status() {
  local f changed=false
  for f in .kanban/issues/*.md; do
    [[ -f "$f" ]] || continue
    if grep -q "^status: \(todo\|open\)$" "$f"; then
      perl -0pi -e 's/^status: (todo|open)$/status: pending/m' "$f"
      changed=true
    fi
  done
  [[ "$changed" == "true" ]] && echo "🔄 Normalized 'status: todo|open' -> 'status: pending'" | tee -a "$LOG_FILE"
  return 0
}

# Unattended poison-issue guard. When a worker times out or returns FAIL and the
# loop is about to stop, record the offending issue in $FAIL_STATE. On the Nth
# failure (MAX_ISSUE_FAILS) auto-block it with a `## Blocker` note so the
# supervisor's relaunch skips it instead of resuming the same stuck issue
# forever. Only consulted in unattended mode. $FAIL_STATE is cleared on any
# clean (exit 0) completion.
guard_and_block_failing_issue() {
  local fid="${1:-}" count f inprog
  if [[ -z "$fid" ]]; then
    # No FAIL/BLOCKED id (e.g. a timeout with no sentinel): fall back to the
    # single in-progress issue, which the worker left mid-flight.
    inprog=$(active_ticket_files | while IFS= read -r af; do [[ "$(issue_status_for_file "$af")" == "in-progress" ]] && printf '%s\n' "$af"; done | sed '/^$/d')
    if [[ $(printf '%s\n' "$inprog" | sed '/^$/d' | wc -l | tr -d ' ') -eq 1 ]]; then
      fid=$(issue_id_for_file "$inprog")
    fi
  fi
  if [[ -z "$fid" ]]; then
    echo "⚠️  Unattended guard: could not identify a single failing issue; not blocking" | tee -a "$LOG_FILE"
    return 0
  fi
  echo "$fid" >> "$FAIL_STATE"
  count=$(grep -cxF "$fid" "$FAIL_STATE" 2>/dev/null || echo 0)
  echo "⚠️  Issue #$fid failed $count/${MAX_ISSUE_FAILS} launch attempt(s) this run series" | tee -a "$LOG_FILE"
  if [[ "$count" -ge "$MAX_ISSUE_FAILS" ]]; then
    f=$(grep -l "^id: ${fid}$" .kanban/issues/*.md 2>/dev/null | head -1)
    if [[ -n "$f" ]] && ! grep -q '^status: blocked$' "$f"; then
      perl -0pi -e 's/^status: (pending|in-progress|review)$/status: blocked/m' "$f"
      if ! grep -q '^## Blocker' "$f"; then
        printf '\n## Blocker\n\nAuto-blocked by the Ralph loop after %s failed launch attempts (timeout or FAIL) in unattended mode. Needs manual investigation before retry.\n' "$count" >> "$f"
      fi
      echo "⛔ Auto-blocked issue #$fid after $count failures so the loop can continue" | tee -a "$LOG_FILE"
    fi
  fi
  return 0
}

while [[ $ITERATION -lt $MAX_ITERATIONS ]]; do
  ITERATION=$((ITERATION + 1))

  echo "" | tee -a "$LOG_FILE"
  echo "─────────────────────────────────────────────────────────" | tee -a "$LOG_FILE"
  echo "Iteration $ITERATION - $(date)" | tee -a "$LOG_FILE"
  echo "─────────────────────────────────────────────────────────" | tee -a "$LOG_FILE"

  if git rev-parse --git-dir >/dev/null 2>&1; then
    cleanup_ephemeral_artifacts || true
  fi

  normalize_todo_status

  if ! refresh_board_counts; then
    LOOP_EXIT_CODE=1
    break
  fi
  TOTAL_ISSUES=$(board_count total)
  DONE_ISSUES=$(board_count done)
  BLOCKED_ISSUES=$(board_count blocked)
  WAITING_COUNT=$(($(board_count waiting_triage) + $(board_count waiting_human) + $(board_count wontfix) + $(board_count conflict) + $(board_count waiting_deps)))
  PENDING_ISSUES=$(($(board_count eligible) + WAITING_COUNT))
  ACTIVE_ISSUES=$(active_ticket_files)
  ACTIVE_COUNT=$(printf '%s\n' "$ACTIVE_ISSUES" | sed '/^$/d' | wc -l | tr -d ' ')
  UNBLOCKED_COUNT=$(count_unblocked_pending)
  REVIEW_READY_COUNT=$(count_actionable_review_targets)

  echo "" | tee -a "$LOG_FILE"
  if [[ "$REVIEW_LOOP" == "true" ]]; then
    echo "📊 Progress: $DONE_ISSUES/$TOTAL_ISSUES done | $PENDING_ISSUES pending | $BLOCKED_ISSUES blocked | $ACTIVE_COUNT active | $REVIEW_READY_COUNT review targets" | tee -a "$LOG_FILE"
  else
    echo "📊 Progress: $DONE_ISSUES/$TOTAL_ISSUES done | $PENDING_ISSUES pending | $BLOCKED_ISSUES blocked | $ACTIVE_COUNT active | $UNBLOCKED_COUNT ready" | tee -a "$LOG_FILE"
    if [[ $WAITING_COUNT -gt 0 ]]; then
      echo "⏸  $WAITING_COUNT pending not eligible: $(board_count waiting_triage) need triage/info, $(board_count waiting_human) for a human, $(board_count wontfix) wontfix, $(board_count conflict) conflicting labels, $(board_count waiting_deps) waiting on blockers" | tee -a "$LOG_FILE"
    fi
  fi
  echo "✅ Issues completed this session: $ISSUES_COMPLETED" | tee -a "$LOG_FILE"
  if [[ $ACTIVE_COUNT -gt 0 ]]; then
    if [[ "$REVIEW_LOOP" == "true" ]]; then
      echo "🔁 $ACTIVE_COUNT active issue(s) are review-loop targets" | tee -a "$LOG_FILE"
    else
      echo "🔁 $ACTIVE_COUNT active issue(s) will be resumed before scanning new pending work" | tee -a "$LOG_FILE"
    fi
    printf '%s\n' "$ACTIVE_ISSUES" | sed '/^$/d' | tee -a "$LOG_FILE"
  fi

  if [[ "$REVIEW_LOOP" == "true" ]]; then
    if [[ $REVIEW_READY_COUNT -eq 0 ]]; then
      echo "" | tee -a "$LOG_FILE"
      echo "✅ No actionable review targets found" | tee -a "$LOG_FILE"
      echo "Ralph review loop complete!" | tee -a "$LOG_FILE"
      break
    fi
  elif [[ $UNBLOCKED_COUNT -eq 0 && $ACTIVE_COUNT -eq 0 ]]; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ No active or eligible pending issues found" | tee -a "$LOG_FILE"
    if [[ $WAITING_COUNT -gt 0 ]]; then
      echo "   ($WAITING_COUNT pending ticket(s) are not agent-ready; triage them or add the ready label)" | tee -a "$LOG_FILE"
    fi
    echo "Ralph loop complete!" | tee -a "$LOG_FILE"
    break
  fi

  CURRENT_REVIEW_TARGET=""
  CURRENT_REVIEW_TARGET_ID=""
  CURRENT_TARGET=""
  CURRENT_TARGET_ID=""
  CURRENT_TARGET_FILE=""
  # Pick the next target ticket BEFORE the snapshot+checkpoint so files mode
  # can scope its git-add to the ticket's `files:` frontmatter (the previous
  # ordering picked AFTER the checkpoint, which meant the pre-worker step
  # always skipped in files mode when there was no active resume).
  selected_target=$(
    PICKW_REVIEW_LOOP="$REVIEW_LOOP" \
    PICKW_BOARD_SH="$BOARD_SH" \
    PICKW_SPEC="$SPEC" \
    PICKW_ACTIVE_ISSUES="$ACTIVE_ISSUES" \
    pick_next_target_for_warning
  )
  if [[ -z "$selected_target" ]]; then
    if [[ "$REVIEW_LOOP" == "true" ]]; then
      echo "" | tee -a "$LOG_FILE"
      echo "✅ No actionable review targets found" | tee -a "$LOG_FILE"
      echo "Ralph review loop complete!" | tee -a "$LOG_FILE"
      break
    fi
    echo "✅ No eligible ticket to select" | tee -a "$LOG_FILE"
    break
  fi

  CURRENT_TARGET="$selected_target"
  CURRENT_TARGET_ID=$(issue_id_for_file "$CURRENT_TARGET")
  CURRENT_TARGET_FILE="$CURRENT_TARGET"

  if [[ "$REVIEW_LOOP" == "true" ]]; then
    CURRENT_REVIEW_TARGET="$CURRENT_TARGET"
    CURRENT_REVIEW_TARGET_ID="$CURRENT_TARGET_ID"
    echo "🎯 Review target: $CURRENT_TARGET" | tee -a "$LOG_FILE"
  elif [[ $ACTIVE_COUNT -gt 0 ]]; then
    # Resume an in-scope active ticket, and say which one: left to itself the worker
    # would scan the whole board and could pick up a ticket outside --spec.
    echo "🔁 Resuming active ticket: $CURRENT_TARGET (#$CURRENT_TARGET_ID)" | tee -a "$LOG_FILE"
  else
    # Pending via board next. A ticket that names a spec we cannot read (missing
    # file, unsafe slug) is blocked, not worked: the worker would get no spec,
    # which is the drift this guards against. This is the --jobs 1 twin of
    # gralph refusing the lane (spec_missing / spec_invalid).
    SPEC_VERDICT=$(board spec-check "$CURRENT_TARGET_ID" 2>/dev/null || true)
    if [[ "$SPEC_VERDICT" == "missing" || "$SPEC_VERDICT" == "invalid" ]]; then
      spec_named=$(sed -n 's/^spec:[[:space:]]*//p' "$CURRENT_TARGET" | head -1 | tr -d '\r')
      perl -0pi -e 's/^status: (pending|in-progress|review)$/status: blocked/m' "$CURRENT_TARGET"
      printf '\n## Blocker\n\nThe loop refused this ticket: its spec (%s) is %s. Running it would give the worker no spec. Fix `spec:` in the ticket or create `.kanban/specs/<slug>.md`, then set `status: pending` again.\n' "$spec_named" "$SPEC_VERDICT" >>"$CURRENT_TARGET"
      echo "⛔ Ticket #$CURRENT_TARGET_ID blocked: its spec ($spec_named) is $SPEC_VERDICT" | tee -a "$LOG_FILE"
      # If the status did not change (unwritable file, unexpected frontmatter) the same ticket
      # would be selected again on the next pass and the loop would spin to MAX_ITERATIONS.
      if [[ "$(issue_status_for_file "$CURRENT_TARGET")" != "blocked" ]]; then
        echo "❌ Could not block ticket #$CURRENT_TARGET_ID; stopping instead of reselecting it" | tee -a "$LOG_FILE"
        LOOP_EXIT_CODE=1
        break
      fi
      continue
    fi
    echo "🎯 Selected ticket: $CURRENT_TARGET (#$CURRENT_TARGET_ID)" | tee -a "$LOG_FILE"
  fi

  # Snapshot dirty paths BEFORE the checkpoint commits any of them so the
  # post-worker warning can tell which paths the worker itself made dirty
  # (versus pre-existing work owned by other sessions in a shared tree).
  # Use the recursing variant so a worker that wrote one file under an
  # untracked directory is reported as that file, not the bare dir entry.
  PRE_WORKER_STATUS_FILE=$(mktemp)
  if git rev-parse --git-dir >/dev/null 2>&1; then
    git_status_snap_recursive >"$PRE_WORKER_STATUS_FILE" 2>/dev/null || true
  else
    : >"$PRE_WORKER_STATUS_FILE"
  fi

  if ! checkpoint_dirty_worktree "chore(ralph): checkpoint worktree before worker" "$CURRENT_TARGET_FILE" pre-worker; then
    echo "Stopping loop" | tee -a "$LOG_FILE"
    rm -f "$PRE_WORKER_STATUS_FILE"
    break
  fi
  # The drift gate checks WORKER_BASE_SHA..HEAD: this worker turn's commits only.
  # ponytail: a resumed ticket's commits from an earlier turn are not re-checked;
  # record a per-ticket base in the ticket file if that gap shows up in practice.
  WORKER_BASE_SHA=$(git rev-parse HEAD 2>/dev/null || true)

  AGENT_PROMPT="$BASE_AGENT_PROMPT"
  if [[ "$REVIEW_LOOP" == "true" ]]; then
    AGENT_PROMPT="Run Ralph actionable review loop for exactly one issue in this repository. Operate only on review target $CURRENT_TARGET (issue #$CURRENT_TARGET_ID). Follow the Ralph Actionable Review Loop protocol. You may edit, test, and commit fixes when review finds gaps or blockers. Stop after this one target. Print the required RALPH_RESULT sentinel."
  elif [[ $ACTIVE_COUNT -gt 0 ]]; then
    echo "🔁 Resuming active ticket: $CURRENT_TARGET (#$CURRENT_TARGET_ID)" | tee -a "$LOG_FILE"
    AGENT_PROMPT="$BASE_AGENT_PROMPT Operate only on ticket $CURRENT_TARGET (issue #$CURRENT_TARGET_ID); it was already started, so resume it. Do not pick a different ticket."
  else
    AGENT_PROMPT="$BASE_AGENT_PROMPT Operate only on ticket $CURRENT_TARGET (issue #$CURRENT_TARGET_ID); the loop already selected it. Do not pick a different ticket."
  fi

  # In files mode the worker must scope its own git-status cleanliness checks
  # and stage operations to the ticket (otherwise the very commit we just
  # avoided comes back through the worker). Driver appends a sentence so the
  # worker DOES NOT `git add -A` later in the same shared tree.
  if [[ "${CHECKPOINT_SCOPE:-all}" == "files" && -n "${CURRENT_TARGET_FILE:-}" && -f "${CURRENT_TARGET_FILE:-}" ]]; then
    AGENT_PROMPT="$AGENT_PROMPT $(files_mode_worker_note)"
  fi

  RALPH_OUTPUT=$(mktemp)
  LAST_EXIT_CODE=0
  case "$ADAPTER" in
    pi)
      echo "▶ Starting pi non-interactive Ralph turn" | tee -a "$LOG_FILE"
      run_pi_adapter "$RALPH_OUTPUT" || LAST_EXIT_CODE=$?
      ;;
    tmux)
      run_tmux_adapter "$RALPH_OUTPUT" "$ITERATION" || LAST_EXIT_CODE=$?
      ;;
  esac

  if [[ $LAST_EXIT_CODE -eq 0 ]]; then
    run_lsp_check_gate || LAST_EXIT_CODE=1
  fi

  if [[ $LAST_EXIT_CODE -eq 0 ]] && blocked_is_skippable "$RALPH_OUTPUT"; then
    BLOCKED_ISSUE=$(extract_result_issue "$RALPH_OUTPUT")
    echo "⏭️  Issue #${BLOCKED_ISSUE:-?} BLOCKED — skipping and continuing to the next eligible issue" | tee -a "$LOG_FILE"
  fi

  NO_WORK=false
  if has_no_work_result "$RALPH_OUTPUT"; then
    NO_WORK=true
  fi

  if git rev-parse --git-dir >/dev/null 2>&1; then
    cleanup_ephemeral_artifacts || true
    POST_RALPH_STATUS=$(git_status_ignoring_pi_lens)
    POST_RALPH_STATUS_FILE=$(mktemp)
    # Use the recursing variant for the warning snapshot (same rationale as
    # PRE_WORKER_STATUS_FILE above) so the warning names the file the worker
    # touched, not the bare directory entry that plain `git status` collapses to.
    git_status_snap_recursive >"$POST_RALPH_STATUS_FILE" 2>/dev/null || true
    # Files-mode diagnostics: surface paths the worker dirtied that are
    # outside the ticket's in-scope prefixes. Naming them keeps a writer that
    # ignored its prompt visible — a silent miss is the failure mode.
    if [[ "${CHECKPOINT_SCOPE:-all}" == "files" && -n "${CURRENT_TARGET_FILE:-}" && -f "${CURRENT_TARGET_FILE:-}" ]]; then
      PREFIXES_FILE=$(mktemp)
      if build_files_mode_pathspec "$CURRENT_TARGET_FILE" "$PREFIXES_FILE" 2>/dev/null && [[ -s "$PREFIXES_FILE" ]]; then
        checkpoint_out_of_scope_warning "$PRE_WORKER_STATUS_FILE" "$POST_RALPH_STATUS_FILE" "$PREFIXES_FILE" "iteration #$ITERATION" || true
      fi
      rm -f "$PREFIXES_FILE"
    fi
    if [[ $LAST_EXIT_CODE -eq 0 && -n "$POST_RALPH_STATUS" ]]; then
      if [[ "$CHECKPOINT_DIRTY" == "true" ]]; then
        echo "" | tee -a "$LOG_FILE"
        echo "💾 Worker left the worktree dirty; auto-committing before next issue" | tee -a "$LOG_FILE"
        POST_ISSUE_ID=$(extract_completed_issue "$RALPH_OUTPUT")
        if [[ -n "$POST_ISSUE_ID" ]]; then
          POST_ISSUE_MSG="chore(ralph): post-issue commit for #$POST_ISSUE_ID"
        else
          POST_ISSUE_MSG="chore(ralph): post-issue commit"
        fi
        if ! checkpoint_dirty_worktree "$POST_ISSUE_MSG" "${CURRENT_TARGET_FILE:-}" "post-issue"; then
          echo "Stopping loop" | tee -a "$LOG_FILE"
          LAST_EXIT_CODE=1
        fi
      else
        echo "" | tee -a "$LOG_FILE"
        echo "⚠️  Ralph left the worktree dirty after the worker finished" | tee -a "$LOG_FILE"
        echo "   Stopping so the next worker does not start from mixed state." | tee -a "$LOG_FILE"
        git_status_short_ignoring_pi_lens | tee -a "$LOG_FILE"
        LAST_EXIT_CODE=1
      fi
    fi
    rm -f "$POST_RALPH_STATUS_FILE"
  fi
  rm -f "$PRE_WORKER_STATUS_FILE" 2>/dev/null || true

  # Driver verification gate: a DONE sentinel is not trusted on faith. Re-run the
  # issue's cleanly-runnable ## Verification command; pass → ensure done, fail →
  # blocked with a Blocker note. Prose verifications stay worker-authoritative.
  if [[ "$REVIEW_LOOP" != "true" && $LAST_EXIT_CODE -eq 0 ]]; then
    run_verification_gate "$RALPH_OUTPUT"
  fi

  if [[ "$REVIEW_LOOP" == "true" && -n "$CURRENT_REVIEW_TARGET_ID" ]]; then
    RESULT_ISSUE=$(extract_result_issue "$RALPH_OUTPUT")
    if [[ -n "$RESULT_ISSUE" ]]; then
      ATTEMPTED_REVIEW_ISSUES="$ATTEMPTED_REVIEW_ISSUES $(normalize_issue_id "$RESULT_ISSUE")"
    else
      ATTEMPTED_REVIEW_ISSUES="$ATTEMPTED_REVIEW_ISSUES $(normalize_issue_id "$CURRENT_REVIEW_TARGET_ID")"
    fi
    REVIEW_TARGETS_PROCESSED=$((REVIEW_TARGETS_PROCESSED + 1))
    echo "✅ Review target processed this session: $REVIEW_TARGETS_PROCESSED" | tee -a "$LOG_FILE"
  fi

  COMPLETED_ISSUE=$(extract_completed_issue "$RALPH_OUTPUT")
  if [[ -n "$COMPLETED_ISSUE" ]]; then
    ISSUES_COMPLETED=$((ISSUES_COMPLETED + 1))
    echo "✅ Confirmed completion: issue #$COMPLETED_ISSUE" | tee -a "$LOG_FILE"
  fi

  if [[ "$NO_WORK" == "true" && $LAST_EXIT_CODE -eq 0 ]]; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ Ralph reports no eligible issues" | tee -a "$LOG_FILE"
    rm -f "$RALPH_OUTPUT"
    break
  fi

  # Capture the failing issue id from the worker output BEFORE deleting it; the
  # unattended poison-guard below needs it (extract returns the FAIL/BLOCKED id).
  FAILING_ISSUE=""
  if [[ $LAST_EXIT_CODE -ne 0 ]]; then
    FAILING_ISSUE=$(extract_result_issue "$RALPH_OUTPUT")
  fi

  rm -f "$RALPH_OUTPUT"

  if [[ $LAST_EXIT_CODE -ne 0 ]]; then
    echo "⚠️  Ralph exited with code $LAST_EXIT_CODE" | tee -a "$LOG_FILE"

    if [[ "$CONTINUE_ON_ERROR" == "true" ]]; then
      echo "⚡ Continue-on-error mode: resetting failed issue to pending" | tee -a "$LOG_FILE"
      reset_active_issues_to_pending || break
      sleep "$SLEEP_INTERVAL"
      continue
    fi

    if [[ "$UNATTENDED" == "true" ]]; then
      guard_and_block_failing_issue "$FAILING_ISSUE"
      LOOP_EXIT_CODE=1
      echo "Unattended: exiting so the supervisor relaunches and continues with remaining work" | tee -a "$LOG_FILE"
      break
    fi

    echo "Stopping loop" | tee -a "$LOG_FILE"
    break
  fi

  sleep "$SLEEP_INTERVAL"
done

if [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
  echo "" | tee -a "$LOG_FILE"
  echo "⚠️  Reached maximum iterations ($MAX_ITERATIONS)" | tee -a "$LOG_FILE"
  echo "Stopping for safety" | tee -a "$LOG_FILE"
fi

# Each ticket was reviewed on its own, and nothing else checks that the slices compose into
# the spec. A --spec run has no gralph run report (that is board mode), so say it here.
SPEC_DONE_NOTE=""
if [[ -n "$SPEC" ]] && "$BOARD_SH" --board .kanban --spec "$SPEC" spec-done >/dev/null 2>&1; then
  SPEC_DONE_NOTE="Spec $SPEC is complete: every ticket is done. Each was reviewed alone; run /finish-spec $SPEC to check they compose into the spec."
fi

{
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "Ralph Loop finished at $(date)"
  echo "Total iterations: $ITERATION"
  if [[ -n "$SPEC_DONE_NOTE" ]]; then
    echo "$SPEC_DONE_NOTE"
  fi
  echo "Issues completed this session: $ISSUES_COMPLETED"
  if [[ "$REVIEW_LOOP" == "true" ]]; then
    echo "Review targets processed this session: $REVIEW_TARGETS_PROCESSED"
  fi
  echo "═══════════════════════════════════════════════════════════"
  leftover_sessions=$(tmux_cmd list-sessions -F '#{session_name}' 2>/dev/null | grep "^ralph-${SESSION_NAME}-" || true)
  if [[ -n "$leftover_sessions" ]]; then
    echo ""
    echo "Leftover worker sessions for inspection:"
    printf '%s\n' "$leftover_sessions"
  fi
  echo ""
  echo "Session will remain open. Press Ctrl+D to exit or run: $TMUX_DISPLAY kill-session -t '$SESSION_NAME'"
} | tee -a "$LOG_FILE"

# In unattended (supervisor) mode, exit instead of holding the session open with
# an idle shell: a clean finish (exit 0) lets the supervisor idle; a stop on
# timeout/FAIL (exit 1) lets it relaunch to continue. Clear the poison-fail
# state on any clean completion.
if [[ "$UNATTENDED" == "true" ]]; then
  [[ "$LOOP_EXIT_CODE" -eq 0 ]] && rm -f "$FAIL_STATE"
  exit "$LOOP_EXIT_CODE"
fi

exec bash
LOOP_EOF

chmod +x "$LOOP_SCRIPT"

PROJECT_DIR="$(pwd)"

# Every INNER_ARGS element must be printf %q-escaped before joining into the tmux shell command.
INNER_ARGS=()
for arg in "$ADAPTER" "$PROJECT_DIR" "$SESSION_NAME" "$CONTINUE_ON_ERROR" \
  "$SLEEP_INTERVAL" "$READY_DELAY" "$ITERATION_TIMEOUT" "$READY_TIMEOUT" \
  "$AGENT_CMD" "$AGENT_PROMPT" "$SKILL_DIR" "$TMUX_SOCKET" \
  "$USE_NORMAL_TMUX" "$SHARED_PROMPT_REMINDER" "$RALPH_MODEL" "$CHECKPOINT_DIRTY" "$REVIEW_LOOP" "$LSP_CHECK_CMD" \
  "$UNATTENDED" "$MAX_ISSUE_FAILS" "$AGENT_CMD_EXPLICIT" "$SKIP_BLOCKED" \
  "$IMPLEMENT_SKILL_DIR" "$USE_IMPLEMENT_SKILL" \
  "$BOARD_SH" "$SPEC" "$READY_LABEL" "$CHECKPOINT_SCOPE"; do
  printf -v arg_q '%q' "$arg"
  INNER_ARGS+=("$arg_q")
done

printf -v loop_script_q '%q' "$LOOP_SCRIPT"
tmux_cmd new-session -d -s "$SESSION_NAME" \
  "bash $loop_script_q ${INNER_ARGS[*]}"

echo "✅ Ralph loop started in tmux session '$SESSION_NAME'"
echo "  Force mode: $FORCE_MODE"
echo "  Continue on error: $CONTINUE_ON_ERROR"
echo "  Review loop: $REVIEW_LOOP"
echo "  Sleep interval: ${SLEEP_INTERVAL}s"
echo "  Ready delay: ${READY_DELAY}s"
echo "  Ready timeout: ${READY_TIMEOUT}s"
echo "  Iteration timeout: ${ITERATION_TIMEOUT}s"
echo "  Tmux: $TMUX_DISPLAY"
echo "  Model: $RALPH_MODEL"
echo "  Checkpoint dirty worktree: $CHECKPOINT_DIRTY"
echo "  Checkpoint scope: $CHECKPOINT_SCOPE${CHECKPOINT_SCOPE_OVERRIDE:+ (cli override)}"
if [[ -n "$LSP_CHECK_CMD" ]]; then
  echo "  LSP check command: $LSP_CHECK_CMD"
fi
if [[ "$ADAPTER" == "tmux" ]]; then
  echo "  Agent command: $AGENT_CMD"
fi
echo ""
echo "Monitor:"
echo "  $TMUX_DISPLAY attach -t '$SESSION_NAME'"
echo "  tail -f \$HOME/.cache/ralph-loop-$SESSION_NAME.log"
echo ""
echo "Stop:"
echo "  $TMUX_DISPLAY kill-session -t '$SESSION_NAME'"
echo ""
echo "The loop will run until no eligible work remains."
echo ""
echo "Loop script: $LOOP_SCRIPT"
