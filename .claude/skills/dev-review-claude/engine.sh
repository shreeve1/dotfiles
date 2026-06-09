#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
usage: engine.sh <subcommand> [args]
  prepare <project_root>     allocate state file, capture git baseline
  launch <state_file>        start tmux+claude session, paste prompt
  poll <state_file>          print one of: done | running | exited
  capture <state_file>       print findings file (or fall back to pane)
  diff_tree <state_file>     diff git status against baseline
  cleanup <state_file>       kill session, remove temp files (idempotent)
EOF
}

cmd_prepare() {
  local project_root="${1:-}"
  [ -n "$project_root" ] || { echo "prepare: missing <project_root>" >&2; exit 2; }
  [ -d "$project_root" ] || { echo "prepare: not a directory: $project_root" >&2; exit 2; }

  local nonce
  nonce="$(openssl rand -hex 6 2>/dev/null || mktemp -u XXXXXXXXXXXX | tr -dc 'a-zA-Z0-9' | head -c 12)"

  # mktemp templates omit trailing suffixes for BSD/macOS compatibility — only
  # trailing X's are replaced on BSD; GNU tolerates suffixes but BSD may reject
  # or leave them literal.
  local review_file prompt_file output_file findings_file done_file base_status after_status state_file
  review_file="$(mktemp "${TMPDIR:-/tmp}/drc-review-XXXXXX")"
  prompt_file="$(mktemp "${TMPDIR:-/tmp}/drc-prompt-XXXXXX")"
  output_file="$(mktemp "${TMPDIR:-/tmp}/drc-output-XXXXXX")"
  findings_file="$(mktemp "${TMPDIR:-/tmp}/drc-findings-XXXXXX")"
  done_file="$(mktemp -u "${TMPDIR:-/tmp}/drc-done-XXXXXX")"
  base_status="$(mktemp "${TMPDIR:-/tmp}/drc-base-XXXXXX")"
  after_status="$(mktemp -u "${TMPDIR:-/tmp}/drc-after-XXXXXX")"
  state_file="$(mktemp "${TMPDIR:-/tmp}/drc-state-XXXXXX")"

  local socket session
  socket="${TMPDIR:-/tmp}/drc-sock-${nonce}"
  session="drc-${nonce}"

  # update-index --refresh exits 1 on dirty tracked files; harmless here and
  # `|| true` is mandatory under `set -e`. Refresh silences stat-cache drift so
  # baseline status matches what later `diff_tree` will see on a clean tree.
  # `git status` is also tolerated-fail so non-git project roots produce an
  # empty baseline (diff_tree then compares empty-to-empty cleanly).
  git -C "$project_root" update-index -q --refresh 2>/dev/null || true
  git -C "$project_root" status --short --ignored > "$base_status" 2>/dev/null || : > "$base_status"

  {
    printf '%s=%q\n' PROJECT_ROOT "$project_root"
    printf '%s=%q\n' NONCE "$nonce"
    printf '%s=%q\n' REVIEW_FILE "$review_file"
    printf '%s=%q\n' PROMPT_FILE "$prompt_file"
    printf '%s=%q\n' OUTPUT_FILE "$output_file"
    printf '%s=%q\n' FINDINGS_FILE "$findings_file"
    printf '%s=%q\n' DONE_FILE "$done_file"
    printf '%s=%q\n' BASE_STATUS_FILE "$base_status"
    printf '%s=%q\n' AFTER_STATUS_FILE "$after_status"
    printf '%s=%q\n' SOCKET "$socket"
    printf '%s=%q\n' SESSION "$session"
  } > "$state_file"

  printf '%s\n' "$state_file"
}

cmd_launch() {
  local state_file="${1:-}"
  [ -n "$state_file" ] && [ -r "$state_file" ] || { echo "launch: state file missing or unreadable: $state_file" >&2; exit 2; }
  # shellcheck disable=SC1090
  . "$state_file"

  command -v claude >/dev/null 2>&1 || { echo "launch: claude CLI not on PATH" >&2; exit 1; }
  command -v tmux   >/dev/null 2>&1 || { echo "launch: tmux not on PATH" >&2; exit 1; }
  [ -r "$PROMPT_FILE" ] || { echo "launch: PROMPT_FILE not readable: $PROMPT_FILE" >&2; exit 2; }

  local model_flag_str ready_pattern
  model_flag_str="${DRC_MODEL_FLAG_STR:-"--model opus"}"
  ready_pattern="${DRC_READY_PATTERN:-bypass permissions on|shift\\+tab to cycle}"

  # shellcheck disable=SC2206
  local model_args=( $model_flag_str )

  tmux -S "$SOCKET" kill-session -t "$SESSION" 2>/dev/null || true

  tmux -S "$SOCKET" \
    set-option -g history-limit 100000 \; \
    new-session -d -s "$SESSION" -c "$PROJECT_ROOT" -n review

  local cmd="claude --permission-mode bypassPermissions"
  local arg
  for arg in "${model_args[@]}"; do
    [ -n "$arg" ] && cmd="$cmd $arg"
  done

  tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "$cmd" Enter

  local i ready= pane=
  for ((i=0; i<30; i++)); do
    pane="$(tmux -S "$SOCKET" capture-pane -p -t "$SESSION":0.0 2>/dev/null || true)"
    if printf '%s' "$pane" | grep -qiE "$ready_pattern"; then
      ready=1; break
    fi
    sleep 1
  done

  if [ -z "$ready" ]; then
    echo "launch: claude TUI not ready after 30s. Last pane lines:" >&2
    tmux -S "$SOCKET" capture-pane -p -J -S - -t "$SESSION":0.0 2>/dev/null | tail -30 >&2 || true
    exit 1
  fi

  tmux -S "$SOCKET" load-buffer -b drc "$PROMPT_FILE"
  tmux -S "$SOCKET" paste-buffer -b drc -t "$SESSION":0.0
  sleep 1
  tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 Enter

  printf 'LAUNCHED session=%s\n' "$SESSION"
}

cmd_poll() {
  local state_file="${1:-}"
  [ -n "$state_file" ] && [ -r "$state_file" ] || { echo "poll: state file missing or unreadable: $state_file" >&2; exit 2; }
  # shellcheck disable=SC1090
  . "$state_file"

  if [ -e "$DONE_FILE" ] && [ -s "$FINDINGS_FILE" ]; then
    printf 'done\n'; return 0
  fi
  if tmux -S "$SOCKET" has-session -t "$SESSION" 2>/dev/null; then
    printf 'running\n'; return 0
  fi
  printf 'exited\n'
}

cmd_capture() {
  local state_file="${1:-}"
  [ -n "$state_file" ] && [ -r "$state_file" ] || { echo "capture: state file missing or unreadable: $state_file" >&2; exit 2; }
  # shellcheck disable=SC1090
  . "$state_file"

  if [ -s "$FINDINGS_FILE" ]; then
    cat "$FINDINGS_FILE"
    return 0
  fi

  tmux -S "$SOCKET" capture-pane -p -J -t "$SESSION":0.0 -S - 2>/dev/null || true
  echo "FINDINGS_FILE_EMPTY" >&2
  exit 1
}

cmd_diff_tree() {
  local state_file="${1:-}"
  [ -n "$state_file" ] && [ -r "$state_file" ] || { echo "diff_tree: state file missing or unreadable: $state_file" >&2; exit 2; }
  # shellcheck disable=SC1090
  . "$state_file"

  git -C "$PROJECT_ROOT" update-index -q --refresh 2>/dev/null || true
  git -C "$PROJECT_ROOT" status --short --ignored > "$AFTER_STATUS_FILE" 2>/dev/null || : > "$AFTER_STATUS_FILE"
  diff -u "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE" || true
}

cmd_cleanup() {
  local state_file="${1:-}"
  [ -n "$state_file" ] || { exit 0; }
  [ -r "$state_file" ] || { exit 0; }
  # shellcheck disable=SC1090
  . "$state_file"

  tmux -S "$SOCKET" kill-session -t "$SESSION" 2>/dev/null || true
  rm -f "$SOCKET" 2>/dev/null || true
  rm -f "$REVIEW_FILE" "$PROMPT_FILE" "$OUTPUT_FILE" "$FINDINGS_FILE" \
        "$DONE_FILE" "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE" "$state_file"
}

if [ "$#" -lt 1 ]; then
  usage; exit 2
fi

sub="$1"; shift
case "$sub" in
  prepare)   cmd_prepare   "$@" ;;
  launch)    cmd_launch    "$@" ;;
  poll)      cmd_poll      "$@" ;;
  capture)   cmd_capture   "$@" ;;
  diff_tree) cmd_diff_tree "$@" ;;
  cleanup)   cmd_cleanup   "$@" ;;
  *)         usage; exit 2 ;;
esac
