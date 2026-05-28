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
#   --iteration-timeout N Seconds to wait for an interactive agent sentinel (default: 3600)
#   --agent-cmd CMD       Interactive agent command for the tmux adapter (default: Pi with openai-codex/gpt-5.5)
#   --agent-prompt TEXT   Prompt sent to the agent (default: $RALPH_AGENT_PROMPT or a Ralph invocation prompt)
#   --no-checkpoint-dirty Do not auto-commit dirty worktree before each worker
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
ITERATION_TIMEOUT=3600
AGENT_CMD="${RALPH_AGENT_CMD:-}"
AGENT_CMD_EXPLICIT=false
RALPH_MODEL="${RALPH_MODEL:-openai-codex/gpt-5.5}"
AGENT_PROMPT="${RALPH_AGENT_PROMPT:-Run Ralph for exactly one issue in this repository. Follow the loaded Ralph skill/protocol. Stop after one issue. Print the required RALPH_RESULT sentinel.}"
CHECKPOINT_DIRTY=true
SOCKET_DIR="${RALPH_TMUX_SOCKET_DIR:-${TMPDIR:-/tmp}/ralph-tmux-sockets}"
TMUX_SOCKET="${RALPH_TMUX_SOCKET:-$SOCKET_DIR/ralph.sock}"
USE_NORMAL_TMUX="${RALPH_USE_NORMAL_TMUX:-true}"

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
  --iteration-timeout N Seconds to wait for an interactive agent sentinel (default: 3600)
  --agent-cmd CMD       Interactive agent command for tmux adapter (default: Pi with openai-codex/gpt-5.5)
  --agent-prompt TEXT   Prompt sent to the agent (default: RALPH_AGENT_PROMPT or a Ralph invocation prompt)
  --no-checkpoint-dirty Do not auto-commit dirty worktree before each worker
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
		ITERATION_TIMEOUT="${2:-3600}"
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
		shift 2
		;;
	--no-checkpoint-dirty)
		CHECKPOINT_DIRTY=false
		shift
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

ADAPTER="${1:-tmux}"
SESSION_NAME="${2:-ralph-loop}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$SESSION_NAME" =~ [.:] ]]; then
	echo "❌ Error: session name '$SESSION_NAME' contains '.' or ':' (invalid in tmux)" >&2
	exit 1
fi

if [[ "$ADAPTER" == "tmux" && -z "${RALPH_AGENT_CMD:-}" && "$AGENT_CMD_EXPLICIT" != "true" ]]; then
	printf -v skill_dir_q '%q' "$SKILL_DIR"
	printf -v model_q '%q' "$RALPH_MODEL"
	AGENT_CMD="pi --model $model_q --skill $skill_dir_q"
fi

case "$ADAPTER" in
pi | tmux)
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

if [[ "$ADAPTER" == "pi" ]] && ! command -v pi >/dev/null 2>&1; then
	echo "❌ Error: pi not found in PATH" >&2
	exit 1
fi

if [[ "$ADAPTER" == "tmux" && -z "$AGENT_CMD" ]]; then
	echo "❌ Error: --agent-cmd or RALPH_AGENT_CMD is required for tmux adapter" >&2
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

if [[ "$FORCE_MODE" != "true" ]] && git rev-parse --git-dir >/dev/null 2>&1 && [[ -n "$(git status --porcelain -- . ':(exclude).pi-lens')" ]]; then
	echo "⚠️  Working directory has pre-existing uncommitted changes" >&2
	echo "   Ralph will auto-commit all non-ignored changes except .pi-lens before launching each worker." >&2
	echo "" >&2
	git status --short -- . ':(exclude).pi-lens' >&2
	echo "" >&2
fi

ACTIVE_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: \(in-progress\|review\)$" {} \; 2>/dev/null || true)
if [[ -n "$ACTIVE_ISSUES" && "$FORCE_MODE" != "true" ]]; then
	echo "⚠️  Found active issue(s) in 'in-progress' or 'review' state" >&2
	echo "" >&2
	echo "$ACTIVE_ISSUES" >&2
	echo "" >&2
	echo "Ralph will resume the active issue instead of resetting it to pending." >&2
	echo "If you really want to abandon it, edit the issue status manually or restore from .kanban/backups." >&2
fi

LOOP_SCRIPT="$HOME/.cache/ralph-loop-$SESSION_NAME.sh"

SHARED_PROMPT_REMINDER='Run Ralph for exactly one issue in this repository. Follow the Ralph skill/protocol. Stop after one issue. The loop already checkpointed the worktree before launching you; do not create pre-worker checkpoint commits inside this worker. Ignore .pi-lens entirely; use git status --porcelain -- . '\'':(exclude).pi-lens'\'' for cleanliness checks. If that filtered git status is dirty before implementation, clean known ephemeral artifacts and stop with FAIL if anything remains. Print exactly one final sentinel line.
Valid final statuses are DONE with an issue id, NO_WORK, BLOCKED with an optional issue id, or FAIL with an optional issue id.
The final line must start with RALPH_RESULT followed by colon and one space.'

cat >"$LOOP_SCRIPT" <<'LOOP_EOF'
#!/bin/bash
set -euo pipefail

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
LOG_FILE="$HOME/.cache/ralph-loop-$SESSION_NAME.log"

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
      echo "🧹 Removed untracked ephemeral artifact: $path" | tee -a "$LOG_FILE"
      removed=true
    fi
  done

  [[ "$removed" == "true" ]]
}

git_status_ignoring_pi_lens() {
  git status --porcelain -- . ':(exclude).pi-lens' | LC_ALL=C sort || true
}

git_status_short_ignoring_pi_lens() {
  git status --short -- . ':(exclude).pi-lens' || true
}

count_unblocked_pending() {
  local count=0
  local issue_file blocked_by is_blocked blocker_id blocker_file

  for issue_file in .kanban/issues/*.md; do
    [[ -f "$issue_file" ]] || continue
    grep -q "^status: pending$" "$issue_file" || continue

    blocked_by=$(grep "^blocked_by:" "$issue_file" | sed 's/blocked_by://;s/\[//;s/\]//;s/,/ /g' || echo "")
    is_blocked=false

    if [[ -n "$blocked_by" ]]; then
      for blocker_id in $blocked_by; do
        blocker_file=$(grep -l "^id: $blocker_id$" .kanban/issues/*.md 2>/dev/null || echo "")
        [[ -n "$blocker_file" ]] || continue
        if ! grep -q "^status: done$" "$blocker_file"; then
          is_blocked=true
          break
        fi
      done
    fi

    if [[ "$is_blocked" == "false" ]]; then
      count=$((count + 1))
    fi
  done

  echo "$count"
}

extract_completed_issue() {
  local file="$1"
  sed -n 's/^[^A-Za-z0-9]*RALPH_RESULT: DONE #\([0-9][0-9]*\)[[:space:]]*$/\1/p' "$file" | tail -1
}

has_no_work_result() {
  local file="$1"
  grep -q '^[^A-Za-z0-9]*RALPH_RESULT: NO_WORK[[:space:]]*$' "$file" 2>/dev/null
}

has_success_result() {
  local file="$1"
  grep -Eq '^[^A-Za-z0-9]*RALPH_RESULT: DONE #[0-9]+[[:space:]]*$|^[^A-Za-z0-9]*RALPH_RESULT: NO_WORK[[:space:]]*$' "$file" 2>/dev/null
}

has_failure_result() {
  local file="$1"
  grep -Eq '^[^A-Za-z0-9]*RALPH_RESULT: BLOCKED( #[0-9]+)?[[:space:]]*$|^[^A-Za-z0-9]*RALPH_RESULT: FAIL( #[0-9]+)?[[:space:]]*$' "$file" 2>/dev/null
}

run_pi_adapter() {
  local output_file="$1"
  local full_prompt="$AGENT_PROMPT"$'\n\n'"$SHARED_PROMPT_REMINDER"
  local cmd=(pi --no-session --model "$RALPH_MODEL" --skill "$SKILL_DIR" -p "$full_prompt")
  local rc=0
  "${cmd[@]}" 2>&1 | tee -a "$LOG_FILE" | tee "$output_file" || rc=$?

  if [[ $rc -eq 0 ]] && has_failure_result "$output_file"; then
    echo "⚠️  Pi exited 0 but RALPH_RESULT sentinel indicates failure" | tee -a "$LOG_FILE"
    return 1
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
    if printf '%s\n' "$pane" | grep -Eq '(^|[[:space:]])(❯|>|›)[[:space:]]|INSERT|bypass permissions on|What can I help|How can I help|LSP Inactive|[0-9]+(\.[0-9]+)?% used|0\.0%/'; then
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
  tmux_cmd send-keys -t "$target" C-m
  sleep 3

  if pane_has_prompt_activity "$target" "$prompt_probe"; then
    return 0
  fi

  echo "⚠️  Prompt submit not observed; retrying once" | tee -a "$LOG_FILE"
  tmux_cmd send-keys -t "$target" C-u
  sleep 1
  tmux_cmd send-keys -t "$target" -l -- "$prompt_line"
  sleep 1
  tmux_cmd send-keys -t "$target" C-m
}

run_tmux_adapter() {
  local output_file="$1"
  local iteration="$2"
  local agent_session="ralph-${SESSION_NAME}-${iteration}"
  local target="$agent_session:0.0"
  local project_q pane now start prompt prompt_line result_file

  printf -v project_q '%q' "$PROJECT_DIR"
  result_file="$HOME/.cache/ralph-result-${SESSION_NAME}-${iteration}.txt"
  rm -f "$result_file"

  if tmux_cmd has-session -t "$agent_session" 2>/dev/null; then
    tmux_cmd kill-session -t "$agent_session"
  fi

  echo "▶ Starting interactive agent session: $agent_session" | tee -a "$LOG_FILE"
  tmux_cmd new-session -d -s "$agent_session" "cd $project_q && exec $AGENT_CMD"
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

    if has_failure_result "$output_file"; then
      cat "$output_file" >> "$LOG_FILE"
      echo "Session left alive for inspection: $TMUX_DISPLAY attach -t '$agent_session'" | tee -a "$LOG_FILE"
      return 1
    fi

    sleep "$SLEEP_INTERVAL"
  done
}

checkpoint_dirty_worktree() {
  local status message

  [[ "$CHECKPOINT_DIRTY" == "true" ]] || return 0
  git rev-parse --git-dir >/dev/null 2>&1 || return 0

  cleanup_ephemeral_artifacts || true
  status=$(git_status_ignoring_pi_lens)
  [[ -n "$status" ]] || return 0

  echo "" | tee -a "$LOG_FILE"
  echo "💾 Checkpointing dirty worktree before launching worker" | tee -a "$LOG_FILE"
  git_status_short_ignoring_pi_lens | tee -a "$LOG_FILE"

  git add -A -- . ':(exclude).pi-lens'
  if git diff --cached --quiet; then
    echo "⚠️  Dirty worktree had nothing stageable; refusing to launch worker" | tee -a "$LOG_FILE"
    git_status_short_ignoring_pi_lens | tee -a "$LOG_FILE"
    return 1
  fi

  message="chore(ralph): checkpoint worktree before worker"
  if ! git commit -m "$message" 2>&1 | tee -a "$LOG_FILE"; then
    echo "⚠️  Failed to create pre-worker checkpoint commit" | tee -a "$LOG_FILE"
    return 1
  fi

  cleanup_ephemeral_artifacts || true
  status=$(git_status_ignoring_pi_lens)
  if [[ -n "$status" ]]; then
    echo "⚠️  Worktree still dirty after checkpoint commit; refusing to launch worker" | tee -a "$LOG_FILE"
    git_status_short_ignoring_pi_lens | tee -a "$LOG_FILE"
    return 1
  fi

  echo "✅ Worktree clean before worker" | tee -a "$LOG_FILE"
}

reset_active_issues_to_pending() {
  local active_count failed_issue backup_dir
  active_count=$(find .kanban/issues -name "*.md" -exec grep -l "^status: \(in-progress\|review\)$" {} \; 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$active_count" -eq 0 ]]; then
    return 0
  fi
  if [[ "$active_count" -gt 1 ]]; then
    echo "⚠️  Continue-on-error found $active_count active issues; not resetting automatically." | tee -a "$LOG_FILE"
    find .kanban/issues -name "*.md" -exec grep -l "^status: \(in-progress\|review\)$" {} \; 2>/dev/null | tee -a "$LOG_FILE"
    return 1
  fi

  failed_issue=$(find .kanban/issues -name "*.md" -exec grep -l "^status: \(in-progress\|review\)$" {} \; 2>/dev/null | head -1)
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
  echo "Sleep interval: ${SLEEP_INTERVAL}s"
  echo "Ready delay: ${READY_DELAY}s"
  echo "Ready timeout: ${READY_TIMEOUT}s"
  echo "Iteration timeout: ${ITERATION_TIMEOUT}s"
  echo "Tmux: $TMUX_DISPLAY"
  echo "Model: $RALPH_MODEL"
  echo "Checkpoint dirty worktree: $CHECKPOINT_DIRTY"
  if [[ "$ADAPTER" == "tmux" ]]; then
    echo "Agent command: $AGENT_CMD"
  fi
  echo "═══════════════════════════════════════════════════════════"
  echo ""
} | tee -a "$LOG_FILE"

ITERATION=0
MAX_ITERATIONS=1000
ISSUES_COMPLETED=0

while [[ $ITERATION -lt $MAX_ITERATIONS ]]; do
  ITERATION=$((ITERATION + 1))

  echo "" | tee -a "$LOG_FILE"
  echo "─────────────────────────────────────────────────────────" | tee -a "$LOG_FILE"
  echo "Iteration $ITERATION - $(date)" | tee -a "$LOG_FILE"
  echo "─────────────────────────────────────────────────────────" | tee -a "$LOG_FILE"

  if git rev-parse --git-dir >/dev/null 2>&1; then
    cleanup_ephemeral_artifacts || true
  fi

  TOTAL_ISSUES=$(find .kanban/issues -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  DONE_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: done$" {} \; 2>/dev/null | wc -l | tr -d ' ')
  PENDING_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: pending$" {} \; 2>/dev/null | wc -l | tr -d ' ')
  BLOCKED_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: blocked$" {} \; 2>/dev/null | wc -l | tr -d ' ')
  ACTIVE_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: \(in-progress\|review\)$" {} \; 2>/dev/null || true)
  ACTIVE_COUNT=$(printf '%s\n' "$ACTIVE_ISSUES" | sed '/^$/d' | wc -l | tr -d ' ')
  UNBLOCKED_COUNT=$(count_unblocked_pending)

  echo "" | tee -a "$LOG_FILE"
  echo "📊 Progress: $DONE_ISSUES/$TOTAL_ISSUES done | $PENDING_ISSUES pending | $BLOCKED_ISSUES blocked | $ACTIVE_COUNT active | $UNBLOCKED_COUNT ready" | tee -a "$LOG_FILE"
  echo "✅ Issues completed this session: $ISSUES_COMPLETED" | tee -a "$LOG_FILE"
  if [[ $ACTIVE_COUNT -gt 0 ]]; then
    echo "🔁 $ACTIVE_COUNT active issue(s) will be resumed before scanning new pending work" | tee -a "$LOG_FILE"
    printf '%s\n' "$ACTIVE_ISSUES" | sed '/^$/d' | tee -a "$LOG_FILE"
  fi

  if [[ $UNBLOCKED_COUNT -eq 0 && $ACTIVE_COUNT -eq 0 ]]; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ No active or unblocked pending issues found" | tee -a "$LOG_FILE"
    echo "Ralph loop complete!" | tee -a "$LOG_FILE"
    break
  fi

  if ! checkpoint_dirty_worktree; then
    echo "Stopping loop" | tee -a "$LOG_FILE"
    break
  fi

  RALPH_OUTPUT=$(mktemp)
  LAST_EXIT_CODE=0
  case "$ADAPTER" in
    pi)
      echo "▶ Starting Pi non-interactive Ralph turn" | tee -a "$LOG_FILE"
      run_pi_adapter "$RALPH_OUTPUT" || LAST_EXIT_CODE=$?
      ;;
    tmux)
      run_tmux_adapter "$RALPH_OUTPUT" "$ITERATION" || LAST_EXIT_CODE=$?
      ;;
  esac

  NO_WORK=false
  if has_no_work_result "$RALPH_OUTPUT"; then
    NO_WORK=true
  fi

  if git rev-parse --git-dir >/dev/null 2>&1; then
    cleanup_ephemeral_artifacts || true
    POST_RALPH_STATUS=$(git_status_ignoring_pi_lens)
    if [[ $LAST_EXIT_CODE -eq 0 && -n "$POST_RALPH_STATUS" ]]; then
      echo "" | tee -a "$LOG_FILE"
      echo "⚠️  Ralph left the worktree dirty after the worker finished" | tee -a "$LOG_FILE"
      echo "   Stopping so the next worker does not start from mixed state." | tee -a "$LOG_FILE"
      git_status_short_ignoring_pi_lens | tee -a "$LOG_FILE"
      LAST_EXIT_CODE=1
    fi
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

  rm -f "$RALPH_OUTPUT"

  if [[ $LAST_EXIT_CODE -ne 0 ]]; then
    echo "⚠️  Ralph exited with code $LAST_EXIT_CODE" | tee -a "$LOG_FILE"

    if [[ "$CONTINUE_ON_ERROR" == "true" ]]; then
      echo "⚡ Continue-on-error mode: resetting failed issue to pending" | tee -a "$LOG_FILE"
      reset_active_issues_to_pending || break
      sleep "$SLEEP_INTERVAL"
      continue
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

{
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "Ralph Loop finished at $(date)"
  echo "Total iterations: $ITERATION"
  echo "Issues completed this session: $ISSUES_COMPLETED"
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

exec bash
LOOP_EOF

chmod +x "$LOOP_SCRIPT"

PROJECT_DIR="$(pwd)"

# Every INNER_ARGS element must be printf %q-escaped before joining into the tmux shell command.
INNER_ARGS=()
for arg in "$ADAPTER" "$PROJECT_DIR" "$SESSION_NAME" "$CONTINUE_ON_ERROR" \
	"$SLEEP_INTERVAL" "$READY_DELAY" "$ITERATION_TIMEOUT" "$READY_TIMEOUT" \
	"$AGENT_CMD" "$AGENT_PROMPT" "$SKILL_DIR" "$TMUX_SOCKET" \
	"$USE_NORMAL_TMUX" "$SHARED_PROMPT_REMINDER" "$RALPH_MODEL" "$CHECKPOINT_DIRTY"; do
	printf -v arg_q '%q' "$arg"
	INNER_ARGS+=("$arg_q")
done

printf -v loop_script_q '%q' "$LOOP_SCRIPT"
tmux_cmd new-session -d -s "$SESSION_NAME" \
	"bash $loop_script_q ${INNER_ARGS[*]}"

echo "✅ Ralph loop started in tmux session '$SESSION_NAME'"
echo ""
echo "Configuration:"
echo "  Adapter: $ADAPTER"
echo "  Force mode: $FORCE_MODE"
echo "  Continue on error: $CONTINUE_ON_ERROR"
echo "  Sleep interval: ${SLEEP_INTERVAL}s"
echo "  Ready delay: ${READY_DELAY}s"
echo "  Ready timeout: ${READY_TIMEOUT}s"
echo "  Iteration timeout: ${ITERATION_TIMEOUT}s"
echo "  Tmux: $TMUX_DISPLAY"
echo "  Model: $RALPH_MODEL"
echo "  Checkpoint dirty worktree: $CHECKPOINT_DIRTY"
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
echo "The loop will run until all unblocked pending issues are done."
echo ""
echo "Loop script: $LOOP_SCRIPT"
