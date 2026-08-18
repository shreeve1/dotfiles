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
#   --agent-cmd CMD       Interactive agent command for the tmux adapter (default: Pi with its configured default model)
#   --agent-prompt TEXT   Prompt sent to the agent (default: $RALPH_AGENT_PROMPT or a Ralph invocation prompt)
#   --review-loop         Run actionable review/unblock loop instead of pending-issue implementation
#   --auto-review-blocked Inline review/repair worker when an issue blocks, then continue (default: on)
#   --no-auto-review-blocked Disable inline auto-review; a BLOCKED issue stops the loop (old behavior)
#   --review-each         After every DONE, run a fresh independent reviewer over that issue's diff; repair gaps in place, then continue (default: on; ~2x worker cost)
#   --no-review-each      Disable per-issue review on DONE; trust the implementer's own DONE sentinel
#   --lsp-check-cmd CMD   Optional command that must pass after each worker before DONE/PASS is accepted
#   --no-checkpoint-dirty Do not auto-commit dirty worktree before each worker or after each issue
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
AUTO_REVIEW_BLOCKED="${RALPH_AUTO_REVIEW_BLOCKED:-true}"
REVIEW_EACH="${RALPH_REVIEW_EACH:-true}"
# Unattended mode (set by the systemd supervisor): on a worker timeout/FAIL the
# loop exits non-zero instead of leaving an idle keepalive session, so the
# supervisor relaunches and continues. MAX_ISSUE_FAILS bounds retries — an issue
# that fails this many launch attempts is auto-blocked so the loop moves on.
UNATTENDED="${RALPH_UNATTENDED:-false}"
MAX_ISSUE_FAILS="${RALPH_MAX_ISSUE_FAILS:-2}"
REVIEW_BASE_SHA=""
BASE_REMINDER=""
LSP_CHECK_CMD="${RALPH_LSP_CHECK_CMD:-}"
RALPH_MODEL="${RALPH_MODEL:-deepseek/deepseek-v4-flash}"
# Optional stronger model used ONLY for the per-issue independent review-on-DONE
# (mode=review). The implementer and the BLOCKED-drain repair path (mode=repair)
# keep using RALPH_MODEL. Unset => the reviewer inherits RALPH_MODEL.
RALPH_REVIEW_MODEL="${RALPH_REVIEW_MODEL:-deepseek/deepseek-v4-flash}"
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
  --iteration-timeout N Seconds to wait for an interactive agent sentinel (default: 7200)
  --agent-cmd CMD       Interactive agent command for tmux adapter (default: Pi with its configured default model)
  --agent-prompt TEXT   Prompt sent to the agent (default: RALPH_AGENT_PROMPT or a Ralph invocation prompt)
  --review-loop         Run actionable review/unblock loop instead of pending-issue implementation
  --skip-blocked        Treat a BLOCKED issue as skip-and-continue to the next eligible issue (FAIL still stops)
  --auto-review-blocked Inline review/repair worker when an issue blocks, then continue (default: on)
  --no-auto-review-blocked Disable inline auto-review; a BLOCKED issue stops the loop (old behavior)
  --review-each         After every DONE, run a fresh independent reviewer over that issue's diff; repair gaps in place, then continue (default: on; ~2x worker cost)
  --no-review-each      Disable per-issue review on DONE; trust the implementer's own DONE sentinel
  --review-model ID     Model id for the per-issue review-on-DONE only (env RALPH_REVIEW_MODEL); implementer + repair keep RALPH_MODEL
  --lsp-check-cmd CMD   Optional command that must pass after each worker before DONE/PASS is accepted
  --no-checkpoint-dirty Do not auto-commit dirty worktree before each worker or after each issue
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
  --review-model)
    if [[ -z "${2:-}" || "${2:-}" == --* ]]; then
      echo "❌ Error: --review-model requires a model id" >&2
      exit 1
    fi
    RALPH_REVIEW_MODEL="$2"
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
  --auto-review-blocked)
    AUTO_REVIEW_BLOCKED=true
    shift
    ;;
  --no-auto-review-blocked)
    AUTO_REVIEW_BLOCKED=false
    shift
    ;;
  --review-each)
    REVIEW_EACH=true
    shift
    ;;
  --no-review-each)
    REVIEW_EACH=false
    shift
    ;;
  --unattended)
    UNATTENDED=true
    shift
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

if [[ "$SESSION_NAME" =~ [.:] ]]; then
  echo "❌ Error: session name '$SESSION_NAME' contains '.' or ':' (invalid in tmux)" >&2
  exit 1
fi

if [[ "$ADAPTER" == "tmux" && -z "${RALPH_AGENT_CMD:-}" && "$AGENT_CMD_EXPLICIT" != "true" ]]; then
  printf -v skill_dir_q '%q' "$SKILL_DIR"
  AGENT_CMD="pi --skill $skill_dir_q"
  if [[ -n "$RALPH_MODEL" ]]; then
    printf -v model_q '%q' "$RALPH_MODEL"
    AGENT_CMD="pi --model $model_q --skill $skill_dir_q"
  fi
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

if [[ "$FORCE_MODE" != "true" ]] && git rev-parse --git-dir >/dev/null 2>&1 && [[ -n "$(git status --porcelain -- . ':(exclude).pi-lens' ':(exclude).sessions')" ]]; then
  echo "⚠️  Working directory has pre-existing uncommitted changes" >&2
  echo "   Ralph will auto-commit all non-ignored changes except .pi-lens before launching each worker." >&2
  echo "" >&2
  git status --short -- . ':(exclude).pi-lens' ':(exclude).sessions' >&2
  echo "" >&2
fi

ACTIVE_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: \(in-progress\|review\)$" {} \; 2>/dev/null || true)
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

if [[ "$REVIEW_LOOP" == "true" ]]; then
  SHARED_PROMPT_REMINDER='Run Ralph actionable review loop for exactly one issue in this repository. Operate only on the explicit review target path provided by the loop. Selection order has already been applied by the loop. This is an UNATTENDED background loop with no operator present: never call ask_user_question or any interactive approval prompt, because nothing can answer it and the loop stalls until timeout. Operator approval for service-affecting actions (installing, enabling, or restarting systemd units, building, running migrations, restarting daemons) is granted in advance, so proceed without asking. Reserve BLOCKED for work that is genuinely impossible, never for actions that merely need confirmation. For verification steps that would emit an outward notification to an external channel (alert or paging webhooks, telegram, email), verify the wiring from configuration and document it instead of firing a live alert. You may edit, test, and commit fixes when review finds gaps or blockers. The loop already checkpointed the worktree before launching you; do not create pre-worker checkpoint commits inside this worker. Ignore .pi-lens entirely; use git status --porcelain -- . '\'':(exclude).pi-lens'\'' '\'':(exclude).sessions'\'' for cleanliness checks. Before any DONE/PASS outcome you MUST run the verification command from the issue ## Verification section exactly as written (never swap a bare runner for the repo wrapper); it MUST exit 0, otherwise mark BLOCKED/FAIL instead of DONE. Before any DONE/PASS outcome, check critical LSP diagnostics for files touched by the issue and fix real errors; environment-only missing-import noise may be documented, but new/touched-file type/call/signature/import errors must be fixed or the issue stays BLOCKED/FAIL. Print exactly one final sentinel line.
Valid final statuses are DONE with an issue id, NO_WORK, BLOCKED with an issue id, or FAIL with an optional issue id. In review-loop mode, BLOCKED is a valid terminal outcome when the target remains blocked after an attempted fix.
The final line must start with RALPH_RESULT followed by colon and one space.'
else
  SHARED_PROMPT_REMINDER='Run Ralph for exactly one issue in this repository. Follow the Ralph skill/protocol. Stop after one issue. This is an UNATTENDED background loop with no operator present: never call ask_user_question or any interactive approval prompt, because nothing can answer it and the loop stalls until timeout. Operator approval for service-affecting actions (installing, enabling, or restarting systemd units, building, running migrations, restarting daemons) is granted in advance, so proceed without asking. Reserve BLOCKED for work that is genuinely impossible, never for actions that merely need confirmation. For verification steps that would emit an outward notification to an external channel (alert or paging webhooks, telegram, email), verify the wiring from configuration and document it instead of firing a live alert. The loop already checkpointed the worktree before launching you; do not create pre-worker checkpoint commits inside this worker. Ignore .pi-lens entirely; use git status --porcelain -- . '\'':(exclude).pi-lens'\'' '\'':(exclude).sessions'\'' for cleanliness checks. If that filtered git status is dirty before implementation, clean known ephemeral artifacts and stop with FAIL if anything remains. Before any DONE/PASS outcome you MUST run the verification command from the issue ## Verification section exactly as written (never swap a bare runner for the repo wrapper); it MUST exit 0, otherwise mark BLOCKED/FAIL instead of DONE. Before any DONE/PASS outcome, check critical LSP diagnostics for files touched by the issue and fix real errors; environment-only missing-import noise may be documented, but new/touched-file type/call/signature/import errors must be fixed or the issue stays BLOCKED/FAIL. Print exactly one final sentinel line.
Valid final statuses are DONE with an issue id, NO_WORK, BLOCKED with an optional issue id, or FAIL with an optional issue id.
The final line must start with RALPH_RESULT followed by colon and one space.'
fi

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
REVIEW_LOOP="${17}"
LSP_CHECK_CMD="${18}"
AUTO_REVIEW_BLOCKED="${19}"
UNATTENDED="${20:-false}"
MAX_ISSUE_FAILS="${21:-2}"
REVIEW_EACH="${22:-true}"
RALPH_REVIEW_MODEL="${23:-}"
AGENT_CMD_EXPLICIT="${24:-false}"
SKIP_BLOCKED="${25:-false}"
LOG_FILE="$HOME/.cache/ralph-loop-$SESSION_NAME.log"
FAIL_STATE="$HOME/.cache/ralph-fails-$SESSION_NAME"
LOOP_EXIT_CODE=0

mkdir -p "$HOME/.cache"
cd "$PROJECT_DIR"
: > "$LOG_FILE"

# Review base state used by run_inline_review / prompt construction. Set per
# iteration in the main loop, but the blocked-issue drain path calls
# run_inline_review BEFORE the loop assigns them, so initialize here or `set -u`
# aborts the whole (sole-session) driver and the tmux server vanishes.
REVIEW_BASE_SHA=""
BASE_REMINDER=""

# Prompt framing used when an inline auto-review/repair worker is spawned for a
# blocked issue. Mirrors the review-loop reminder built by the outer script.
REVIEW_PROMPT_REMINDER='Run Ralph actionable review loop for exactly one issue in this repository. Operate only on the explicit review target path provided by the loop. This is an UNATTENDED background loop with no operator present: never call ask_user_question or any interactive approval prompt, because nothing can answer it and the loop stalls until timeout. Operator approval for service-affecting actions (installing, enabling, or restarting systemd units, building, running migrations, restarting daemons) is granted in advance, so proceed without asking. Reserve BLOCKED for work that is genuinely impossible, never for actions that merely need confirmation. For verification steps that would emit an outward notification to an external channel (alert or paging webhooks, telegram, email), verify the wiring from configuration and document it instead of firing a live alert. You may edit, test, and commit fixes when review finds gaps or blockers. The loop already checkpointed the worktree before launching you; do not create pre-worker checkpoint commits inside this worker. Ignore .pi-lens entirely; use git status --porcelain -- . '\'':(exclude).pi-lens'\'' '\'':(exclude).sessions'\'' for cleanliness checks. Before any DONE/PASS outcome you MUST run the verification command from the issue ## Verification section exactly as written (never swap a bare runner for the repo wrapper); it MUST exit 0, otherwise mark BLOCKED/FAIL instead of DONE. Before any DONE/PASS outcome, check critical LSP diagnostics for files touched by the issue and fix real errors; environment-only missing-import noise may be documented, but new/touched-file type/call/signature/import errors must be fixed or the issue stays BLOCKED/FAIL. Print exactly one final sentinel line.
Valid final statuses are DONE with an issue id, NO_WORK, BLOCKED with an issue id, or FAIL with an optional issue id. In review-loop mode, BLOCKED is a valid terminal outcome when the target remains blocked after an attempted fix.
The final line must start with RALPH_RESULT followed by colon and one space.'

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
  git status --porcelain -- . ':(exclude).pi-lens' ':(exclude).sessions' | LC_ALL=C sort || true
}

git_status_short_ignoring_pi_lens() {
  git status --short -- . ':(exclude).pi-lens' ':(exclude).sessions' || true
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

review_issue_attempted() {
  local id
  id=$(normalize_issue_id "$1")
  [[ " $ATTEMPTED_REVIEW_ISSUES " == *" $id "* ]]
}

count_actionable_review_targets() {
  local count=0
  local issue_file status id

  for issue_file in .kanban/issues/*.md; do
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
  done

  echo "$count"
}

select_actionable_review_target() {
  local wanted issue_file status id priority candidate

  for wanted in blocked review in-progress done; do
    candidate=$(
      for issue_file in .kanban/issues/*.md; do
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
      done | sort -k1,1n -k2,2n | head -1 | cut -d' ' -f3-
    )
    if [[ -n "$candidate" ]]; then
      printf '%s' "$candidate"
      return 0
    fi
  done

  return 1
}

# Default-mode blocked drain: pick the next blocked issue not yet attempted this
# run (lowest priority, then lowest id). Returns the issue file path, or 1 if
# none remain. Used by the implement loop to repair blocked issues once there is
# no fresh pending/active work, so a single `tralph` run is self-healing without
# a separate `--review-loop` pass.
select_next_blocked_target() {
  local issue_file status id priority candidate
  candidate=$(
    for issue_file in .kanban/issues/*.md; do
      [[ -f "$issue_file" ]] || continue
      status=$(issue_status_for_file "$issue_file")
      [[ "$status" == "blocked" ]] || continue
      id=$(issue_id_for_file "$issue_file")
      [[ -n "$id" ]] || continue
      review_issue_attempted "$id" && continue
      priority=$(issue_priority_for_file "$issue_file")
      printf '%06d %012d %s\n' "$priority" "$(normalize_issue_id "$id")" "$issue_file"
    done | sort -k1,1n -k2,2n | head -1 | cut -d' ' -f3-
  )
  [[ -n "$candidate" ]] || return 1
  printf '%s' "$candidate"
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
# the review loop, when --skip-blocked is set, or when auto-review-blocked is on
# (in which case the main loop will spawn an inline repair worker first), as long
# as there is no FAIL.
blocked_is_skippable() {
  local file="$1"
  has_blocked_result "$file" || return 1
  has_hard_fail_result "$file" && return 1
  [[ "$REVIEW_LOOP" == "true" || "$SKIP_BLOCKED" == "true" || "$AUTO_REVIEW_BLOCKED" == "true" ]]
}

extract_result_issue() {
  local file="$1"
  sed -n 's/^[^A-Za-z0-9]*RALPH_RESULT: \(DONE\|BLOCKED\|FAIL\) #\{0,1\}\([0-9][0-9A-Za-z]*\)[[:space:]]*$/\2/p' "$file" | tail -1
}

run_pi_adapter() {
  local output_file="$1"
  local full_prompt="$AGENT_PROMPT"$'\n\n'"$SHARED_PROMPT_REMINDER""$BASE_REMINDER"
  local cmd
  if [[ -n "$RALPH_MODEL" ]]; then
    cmd=(pi --no-session --model "$RALPH_MODEL" --skill "$SKILL_DIR" -p "$full_prompt")
  else
    cmd=(pi --no-session --skill "$SKILL_DIR" -p "$full_prompt")
  fi
  local rc=0
  PI_SUBAGENT_CHILD=1 "${cmd[@]}" 2>&1 | tee -a "$LOG_FILE" | tee "$output_file" || rc=$?

  if [[ $rc -eq 0 ]]; then
    if blocked_is_skippable "$output_file"; then
      return 0
    fi
    if has_failure_result "$output_file"; then
      echo "⚠️  Pi exited 0 but RALPH_RESULT sentinel indicates failure" | tee -a "$LOG_FILE"
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
  tmux_cmd new-session -d -s "$agent_session" "cd $project_q && exec ${mem_prefix}env PI_SUBAGENT_CHILD=1 $AGENT_CMD"
  tmux_cmd set-option -t "$agent_session" history-limit 50000 2>/dev/null || true
  sleep "$READY_DELAY"
  if ! tmux_cmd has-session -t "$agent_session" 2>/dev/null; then
    echo "⚠️  Interactive agent session exited during startup" | tee -a "$LOG_FILE"
    return 1
  fi
  wait_for_agent_ready "$target" || true
  sleep "$READY_DELAY"

  prompt="$AGENT_PROMPT"$'\n\n'"$SHARED_PROMPT_REMINDER""$BASE_REMINDER"$'\n'"Also write the exact same final RALPH_RESULT line to: $result_file"
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
    # seconds with no sentinel, the worker is idle — most often Pi auto-compacted
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
        tmux_cmd send-keys -t "$target" C-m
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

checkpoint_dirty_worktree() {
  local status message
  message="${1:-chore(ralph): checkpoint worktree before worker}"

  [[ "$CHECKPOINT_DIRTY" == "true" ]] || return 0
  git rev-parse --git-dir >/dev/null 2>&1 || return 0

  cleanup_ephemeral_artifacts || true
  status=$(git_status_ignoring_pi_lens)
  [[ -n "$status" ]] || return 0

  echo "" | tee -a "$LOG_FILE"
  echo "💾 Checkpointing dirty worktree: $message" | tee -a "$LOG_FILE"
  git_status_short_ignoring_pi_lens | tee -a "$LOG_FILE"

  git add -A -- . ':(exclude).pi-lens' ':(exclude).sessions'
  if git diff --cached --quiet; then
    echo "⚠️  Dirty worktree had nothing stageable" | tee -a "$LOG_FILE"
    git_status_short_ignoring_pi_lens | tee -a "$LOG_FILE"
    return 1
  fi

  if ! git commit -m "$message" 2>&1 | tee -a "$LOG_FILE"; then
    echo "⚠️  Failed to create pre-worker checkpoint commit" | tee -a "$LOG_FILE"
    return 1
  fi

  cleanup_ephemeral_artifacts || true
  status=$(git_status_ignoring_pi_lens)
  if [[ -n "$status" ]]; then
    echo "⚠️  Worktree still dirty after checkpoint commit" | tee -a "$LOG_FILE"
    git_status_short_ignoring_pi_lens | tee -a "$LOG_FILE"
    return 1
  fi

  echo "✅ Worktree clean after checkpoint commit" | tee -a "$LOG_FILE"
}

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
# (run_inline_review commits it before returning). Idempotent if already at $2.
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

# Spawn a fresh actionable-review/repair worker against a single issue, then
# return so the implement loop can continue. Never fatal: if the worker cannot
# confirm the issue it stays blocked (parked) and the loop moves on.
#   $1 issue id
#   $2 forced review base SHA (optional). When set, the reviewer diffs this base
#      against HEAD instead of HEAD-at-review-start. Used by the per-issue
#      review-on-DONE path so the reviewer sees the whole implementation.
#   $3 mode label: "repair" (default, BLOCKED path) or "review" (DONE path).
run_inline_review() {
  local target_id target_file review_out rc
  local forced_base="${2:-}"
  local mode="${3:-repair}"
  local verb="repair of blocked"; local done_verb="repaired"
  if [[ "$mode" == "review" ]]; then
    verb="independent review of"; done_verb="confirmed/repaired"
  fi
  target_id=$(normalize_issue_id "${1:-}")
  if [[ -z "${1:-}" ]]; then
    echo "⚠️  Inline review: no issue id; skipping" | tee -a "$LOG_FILE"
    return 0
  fi
  target_file=$(grep -l "^id: ${target_id}$" .kanban/issues/*.md 2>/dev/null | head -1 || true)
  if [[ -z "$target_file" ]]; then
    echo "⚠️  Inline review: issue #$target_id not found; skipping" | tee -a "$LOG_FILE"
    return 0
  fi

  echo "" | tee -a "$LOG_FILE"
  echo "🩹 Inline review: attempting $verb issue #$target_id" | tee -a "$LOG_FILE"

  if ! checkpoint_dirty_worktree; then
    echo "⚠️  Inline review: worktree not clean; skipping #$target_id" | tee -a "$LOG_FILE"
    return 0
  fi

  local saved_prompt="$AGENT_PROMPT"
  local saved_reminder="$SHARED_PROMPT_REMINDER"
  local saved_base="$REVIEW_BASE_SHA"
  local saved_base_reminder="$BASE_REMINDER"
  local saved_agent_cmd="$AGENT_CMD"
  local saved_ralph_model="$RALPH_MODEL"

  # Per-issue review-on-DONE (mode=review) may run on a stronger reviewer model.
  # The implementer and the BLOCKED-drain repair path keep RALPH_MODEL. Respect
  # an explicit --agent-cmd / RALPH_AGENT_CMD (do not clobber a user command).
  if [[ "$mode" == "review" && -n "$RALPH_REVIEW_MODEL" ]]; then
    if [[ "$ADAPTER" == "tmux" && ( "$AGENT_CMD_EXPLICIT" == "true" || -n "${RALPH_AGENT_CMD:-}" ) ]]; then
      # An explicit agent command controls the tmux model; the swap would be
      # inert, so leave everything on the implementer command and say so.
      echo "ℹ️  Review model $RALPH_REVIEW_MODEL ignored: explicit --agent-cmd/RALPH_AGENT_CMD controls the model" | tee -a "$LOG_FILE"
    else
      RALPH_MODEL="$RALPH_REVIEW_MODEL"
      if [[ "$ADAPTER" == "tmux" ]]; then
        local rm_skill_q rm_model_q
        printf -v rm_skill_q '%q' "$SKILL_DIR"
        printf -v rm_model_q '%q' "$RALPH_REVIEW_MODEL"
        AGENT_CMD="pi --model $rm_model_q --skill $rm_skill_q"
      fi
      echo "🧠 Review model: $RALPH_REVIEW_MODEL (implementer/repair stay on ${saved_ralph_model:-pi default})" | tee -a "$LOG_FILE"
    fi
  fi

  REVIEW_BASE_SHA=""
  BASE_REMINDER=""
  if [[ -n "$forced_base" ]]; then
    REVIEW_BASE_SHA="$forced_base"
    BASE_REMINDER=$'\n'"Implementation base commit (HEAD before the implementer started): $REVIEW_BASE_SHA. The fresh review session MUST inspect the implementation via 'git diff $REVIEW_BASE_SHA HEAD' and read every file it changed. Do NOT use 'git diff HEAD~1'."
  elif git rev-parse --git-dir >/dev/null 2>&1; then
    REVIEW_BASE_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")
    if [[ -n "$REVIEW_BASE_SHA" ]]; then
      BASE_REMINDER=$'\n'"Implementation base commit (HEAD before this worker started): $REVIEW_BASE_SHA. The fresh review session MUST inspect the implementation via 'git diff $REVIEW_BASE_SHA HEAD' and read every file it changed. Do NOT use 'git diff HEAD~1'."
    fi
  fi

  SHARED_PROMPT_REMINDER="$REVIEW_PROMPT_REMINDER"
  AGENT_PROMPT="Run Ralph actionable review loop for exactly one issue in this repository. Operate only on review target $target_file (issue #$target_id). Follow the Ralph Actionable Review Loop protocol. You may edit, test, and commit fixes when review finds gaps or blockers. Stop after this one target. Print the required RALPH_RESULT sentinel."

  review_out=$(mktemp)
  rc=0
  case "$ADAPTER" in
    pi)
      run_pi_adapter "$review_out" || rc=$?
      ;;
    tmux)
      run_tmux_adapter "$review_out" "${ITERATION}r" || rc=$?
      ;;
  esac

  if grep -Eq "^[^A-Za-z0-9]*RALPH_RESULT: DONE #?${target_id}[[:space:]]*$" "$review_out" 2>/dev/null; then
    # Layer 2 backstop: on a DONE-path review, the driver itself re-runs the
    # issue's verification command (when cleanly runnable) and overrides to
    # blocked if it fails — the reviewer's DONE is not trusted on faith.
    local verify_cmd=""
    if [[ "$mode" == "review" ]]; then verify_cmd=$(extract_runnable_verification "$target_file"); fi
    if [[ -n "$verify_cmd" ]]; then
      echo "▶ Verification gate (#$target_id): $verify_cmd" | tee -a "$LOG_FILE"
      if bash -lc "$verify_cmd" 2>&1 | tee -a "$LOG_FILE"; then
        set_issue_status "$target_file" done
        echo "✅ Inline review $done_verb issue #$target_id (verification passed)" | tee -a "$LOG_FILE"
      else
        echo "❌ Verification FAILED after review for #$target_id; overriding DONE→blocked" | tee -a "$LOG_FILE"
        if [[ -f "$target_file" ]]; then
          set_issue_status "$target_file" blocked
          printf '\n## Blocker\n\nReview reported DONE but the driver verification gate failed: `%s` (exit nonzero). Auto-parked done→blocked; see the loop log for output.\n' "$verify_cmd" >> "$target_file"
        fi
      fi
    else
      # Repair mode (BLOCKED-drain) stays worker-authoritative for status: only
      # the review-each (mode==review) path makes the driver author the terminal
      # `done`. A prose-verification review issue has no runnable verify_cmd and
      # lands here too, so it must still be finalized to done.
      if [[ "$mode" == "review" ]]; then
        set_issue_status "$target_file" done
      fi
      echo "✅ Inline review $done_verb issue #$target_id" | tee -a "$LOG_FILE"
    fi
  elif [[ "$mode" == "review" ]]; then
    # DONE-path review did not confirm (timeout / BLOCKED / FAIL). Genuinely park
    # the issue instead of silently leaving it done, so completion is never
    # trusted on an unconfirmed review. The next scan / blocked-drain picks it up.
    if [[ -f "$target_file" ]]; then
      set_issue_status "$target_file" blocked
      printf '\n## Blocker\n\nAuto-parked by review-each: the independent review worker returned no DONE sentinel (timeout, BLOCKED, or FAIL), so completion is unconfirmed. Re-run review or inspect `git diff %s HEAD` before marking done.\n' "$REVIEW_BASE_SHA" >> "$target_file"
      echo "↪️  Inline review did not confirm #$target_id; parked review→blocked for review" | tee -a "$LOG_FILE"
    else
      echo "↪️  Inline review did not confirm #$target_id; issue file missing, left as-is" | tee -a "$LOG_FILE"
    fi
  else
    echo "↪️  Inline review could not repair #$target_id; leaving blocked and continuing" | tee -a "$LOG_FILE"
  fi

  # Persist any driver-authored terminal status immediately. The pre-worker
  # checkpoint only runs at the TOP of the next iteration, so on the final
  # issue (loop then breaks on NO_WORK) the status would otherwise stay
  # uncommitted and be invisible to the worktree-merge finalizer. Stage only
  # the issue file (SKILL.md convention); ignore failures (e.g. not a git repo
  # or nothing staged).
  if [[ -f "$target_file" ]] && git rev-parse --git-dir >/dev/null 2>&1; then
    if ! git diff --quiet -- "$target_file" 2>/dev/null; then
      git add -- "$target_file" 2>/dev/null \
        && git commit -m "review(#$target_id): driver-authored status after inline review" 2>&1 | tee -a "$LOG_FILE" || true
    fi
  fi

  rm -f "$review_out"

  AGENT_PROMPT="$saved_prompt"
  SHARED_PROMPT_REMINDER="$saved_reminder"
  REVIEW_BASE_SHA="$saved_base"
  BASE_REMINDER="$saved_base_reminder"
  AGENT_CMD="$saved_agent_cmd"
  RALPH_MODEL="$saved_ralph_model"
  return 0
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
  echo "Review loop: $REVIEW_LOOP"
  echo "Auto-review blocked: $AUTO_REVIEW_BLOCKED"
  echo "Review each (per-issue review on DONE): $REVIEW_EACH"
  echo "Sleep interval: ${SLEEP_INTERVAL}s"
  echo "Ready delay: ${READY_DELAY}s"
  echo "Ready timeout: ${READY_TIMEOUT}s"
  echo "Iteration timeout: ${ITERATION_TIMEOUT}s"
  echo "Tmux: $TMUX_DISPLAY"
  echo "Model: $RALPH_MODEL"
  echo "Checkpoint dirty worktree: $CHECKPOINT_DIRTY"
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
    inprog=$(find .kanban/issues -name '*.md' -exec grep -l '^status: in-progress$' {} \; 2>/dev/null | sed '/^$/d')
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

  TOTAL_ISSUES=$(find .kanban/issues -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  DONE_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: done$" {} \; 2>/dev/null | wc -l | tr -d ' ')
  PENDING_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: pending$" {} \; 2>/dev/null | wc -l | tr -d ' ')
  BLOCKED_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: blocked$" {} \; 2>/dev/null | wc -l | tr -d ' ')
  ACTIVE_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: \(in-progress\|review\)$" {} \; 2>/dev/null || true)
  ACTIVE_COUNT=$(printf '%s\n' "$ACTIVE_ISSUES" | sed '/^$/d' | wc -l | tr -d ' ')
  UNBLOCKED_COUNT=$(count_unblocked_pending)
  REVIEW_READY_COUNT=$(count_actionable_review_targets)

  echo "" | tee -a "$LOG_FILE"
  if [[ "$REVIEW_LOOP" == "true" ]]; then
    echo "📊 Progress: $DONE_ISSUES/$TOTAL_ISSUES done | $PENDING_ISSUES pending | $BLOCKED_ISSUES blocked | $ACTIVE_COUNT active | $REVIEW_READY_COUNT review targets" | tee -a "$LOG_FILE"
  else
    echo "📊 Progress: $DONE_ISSUES/$TOTAL_ISSUES done | $PENDING_ISSUES pending | $BLOCKED_ISSUES blocked | $ACTIVE_COUNT active | $UNBLOCKED_COUNT ready" | tee -a "$LOG_FILE"
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
    # No fresh pending/active work. Before declaring done, drain blocked issues
    # via the actionable-review/repair worker so a single `tralph` run is
    # self-healing without a separate `--review-loop` pass. A repaired blocker
    # may unblock downstream pending work, which the next scan will pick up.
    if [[ "$AUTO_REVIEW_BLOCKED" == "true" ]]; then
      DRAIN_TARGET=$(select_next_blocked_target || true)
      if [[ -n "$DRAIN_TARGET" ]]; then
        DRAIN_ID=$(issue_id_for_file "$DRAIN_TARGET")
        echo "" | tee -a "$LOG_FILE"
        echo "🛠️  No pending work left; draining blocked issue #$DRAIN_ID via auto-review/repair" | tee -a "$LOG_FILE"
        ATTEMPTED_REVIEW_ISSUES="$ATTEMPTED_REVIEW_ISSUES $(normalize_issue_id "$DRAIN_ID")"
        run_inline_review "$DRAIN_ID"
        sleep "$SLEEP_INTERVAL"
        continue
      fi
    fi
    echo "" | tee -a "$LOG_FILE"
    echo "✅ No active or unblocked pending issues found" | tee -a "$LOG_FILE"
    echo "Ralph loop complete!" | tee -a "$LOG_FILE"
    break
  fi

  CURRENT_REVIEW_TARGET=""
  CURRENT_REVIEW_TARGET_ID=""
  if [[ "$REVIEW_LOOP" == "true" ]]; then
    CURRENT_REVIEW_TARGET=$(select_actionable_review_target || true)
    if [[ -z "$CURRENT_REVIEW_TARGET" ]]; then
      echo "" | tee -a "$LOG_FILE"
      echo "✅ No actionable review targets found" | tee -a "$LOG_FILE"
      echo "Ralph review loop complete!" | tee -a "$LOG_FILE"
      break
    fi
    CURRENT_REVIEW_TARGET_ID=$(issue_id_for_file "$CURRENT_REVIEW_TARGET")
    echo "🎯 Review target: $CURRENT_REVIEW_TARGET" | tee -a "$LOG_FILE"
  fi

  if ! checkpoint_dirty_worktree; then
    echo "Stopping loop" | tee -a "$LOG_FILE"
    break
  fi

  # Record the clean HEAD before the worker implements. The fresh reviewer must
  # diff this base against HEAD, not HEAD~1: the worker adds a status:review
  # commit on top of its implementation commit(s), so HEAD~1 would show only the
  # status flip and hide the actual code under review.
  REVIEW_BASE_SHA=""
  BASE_REMINDER=""
  if git rev-parse --git-dir >/dev/null 2>&1; then
    REVIEW_BASE_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")
    if [[ -n "$REVIEW_BASE_SHA" ]]; then
      BASE_REMINDER=$'\n'"Implementation base commit (HEAD before this worker started): $REVIEW_BASE_SHA. The fresh review session MUST inspect the implementation via 'git diff $REVIEW_BASE_SHA HEAD' and read every file it changed. Do NOT use 'git diff HEAD~1' — the status:review commit sits on top of the implementation, so HEAD~1 would show only the status flip."
    fi
  fi

  if [[ "$REVIEW_LOOP" == "true" ]]; then
    AGENT_PROMPT="Run Ralph actionable review loop for exactly one issue in this repository. Operate only on review target $CURRENT_REVIEW_TARGET (issue #$CURRENT_REVIEW_TARGET_ID). Follow the Ralph Actionable Review Loop protocol. You may edit, test, and commit fixes when review finds gaps or blockers. Stop after this one target. Print the required RALPH_RESULT sentinel."
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

  if [[ $LAST_EXIT_CODE -eq 0 ]]; then
    run_lsp_check_gate || LAST_EXIT_CODE=1
  fi

  if [[ $LAST_EXIT_CODE -eq 0 ]] && blocked_is_skippable "$RALPH_OUTPUT"; then
    BLOCKED_ISSUE=$(extract_result_issue "$RALPH_OUTPUT")
    if [[ "$AUTO_REVIEW_BLOCKED" == "true" && "$REVIEW_LOOP" != "true" && "$SKIP_BLOCKED" != "true" ]]; then
      echo "🛠️  Issue #${BLOCKED_ISSUE:-?} BLOCKED — running inline auto-review/repair before continuing" | tee -a "$LOG_FILE"
      if [[ -n "${BLOCKED_ISSUE:-}" ]]; then
        ATTEMPTED_REVIEW_ISSUES="$ATTEMPTED_REVIEW_ISSUES $(normalize_issue_id "$BLOCKED_ISSUE")"
      fi
      run_inline_review "${BLOCKED_ISSUE:-}"
    else
      echo "⏭️  Issue #${BLOCKED_ISSUE:-?} BLOCKED — skipping and continuing to the next eligible issue" | tee -a "$LOG_FILE"
    fi
  fi

  NO_WORK=false
  if has_no_work_result "$RALPH_OUTPUT"; then
    NO_WORK=true
  fi

  if git rev-parse --git-dir >/dev/null 2>&1; then
    cleanup_ephemeral_artifacts || true
    POST_RALPH_STATUS=$(git_status_ignoring_pi_lens)
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
        if ! checkpoint_dirty_worktree "$POST_ISSUE_MSG"; then
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
  fi

  # Per-issue independent review on DONE (opt-in via --review-each). A fresh
  # reviewer inspects the just-completed implementation (REVIEW_BASE_SHA..HEAD,
  # captured before this worker ran) against the issue and repairs gaps in place
  # before the loop builds further work on top. The reviewer flips the issue back
  # to blocked itself if it finds an unfixable gap.
  if [[ "$REVIEW_EACH" == "true" && "$REVIEW_LOOP" != "true" && $LAST_EXIT_CODE -eq 0 ]]; then
    REVIEW_EACH_ID=$(extract_completed_issue "$RALPH_OUTPUT")
    if [[ -n "$REVIEW_EACH_ID" ]] && ! review_issue_attempted "$REVIEW_EACH_ID"; then
      ATTEMPTED_REVIEW_ISSUES="$ATTEMPTED_REVIEW_ISSUES $(normalize_issue_id "$REVIEW_EACH_ID")"
      run_inline_review "$REVIEW_EACH_ID" "$REVIEW_BASE_SHA" "review"
    fi
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

{
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "Ralph Loop finished at $(date)"
  echo "Total iterations: $ITERATION"
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
  "$AUTO_REVIEW_BLOCKED" "$UNATTENDED" "$MAX_ISSUE_FAILS" "$REVIEW_EACH" \
  "$RALPH_REVIEW_MODEL" "$AGENT_CMD_EXPLICIT" "$SKIP_BLOCKED"; do
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
echo "  Review loop: $REVIEW_LOOP"
echo "  Auto-review blocked: $AUTO_REVIEW_BLOCKED"
echo "  Review each (per-issue review on DONE): $REVIEW_EACH"
echo "  Sleep interval: ${SLEEP_INTERVAL}s"
echo "  Ready delay: ${READY_DELAY}s"
echo "  Ready timeout: ${READY_TIMEOUT}s"
echo "  Iteration timeout: ${ITERATION_TIMEOUT}s"
echo "  Tmux: $TMUX_DISPLAY"
echo "  Model: $RALPH_MODEL"
echo "  Checkpoint dirty worktree: $CHECKPOINT_DIRTY"
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
