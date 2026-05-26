#!/bin/bash
# Ralph Loop - Background tmux session that runs /ralph until no issues remain
# Usage: ralph-loop.sh [OPTIONS] [CLI] [SESSION_NAME]
#
# OPTIONS:
#   --force              Skip interactive prompts (git dirty check, stale lock recovery)
#   --continue-on-error  If Ralph fails, reset issue to pending and continue
#   --sleep-interval N   Sleep N seconds between iterations (default: 3)
#
# ARGUMENTS:
#   CLI                  claude|opencode|auto (default: auto)
#   SESSION_NAME         tmux session name (default: ralph-loop)

set -euo pipefail

# Parse options
FORCE_MODE=false
CONTINUE_ON_ERROR=false
SLEEP_INTERVAL=3

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
    --help)
      echo "Ralph Loop - Background tmux session that runs /ralph until no issues remain"
      echo ""
      echo "Usage: ralph-loop.sh [OPTIONS] [CLI] [SESSION_NAME]"
      echo ""
      echo "OPTIONS:"
      echo "  --force              Skip interactive prompts"
      echo "  --continue-on-error  Reset issue to pending on failure and continue"
      echo "  --sleep-interval N   Sleep N seconds between iterations (default: 3)"
      echo "  --help               Show this help"
      echo ""
      echo "ARGUMENTS:"
      echo "  CLI                  claude|opencode|auto (default: auto)"
      echo "  SESSION_NAME         tmux session name (default: ralph-loop)"
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

# Detect which CLI to use
CLI="${1:-auto}"
SESSION_NAME="${2:-ralph-loop}"

# Auto-detect if not specified
if [[ "$CLI" == "auto" ]]; then
  if command -v claude &>/dev/null; then
    CLI="claude"
  elif command -v opencode &>/dev/null; then
    CLI="opencode"
  else
    echo "❌ Error: Neither 'claude' nor 'opencode' found in PATH" >&2
    exit 1
  fi
fi

# Validate CLI is available
if ! command -v "$CLI" &>/dev/null; then
  echo "❌ Error: '$CLI' not found in PATH" >&2
  exit 1
fi

# Validate /ralph skill exists (CLI-specific)
case "$CLI" in
  claude)
    if ! $CLI /help 2>/dev/null | grep -q "ralph"; then
      echo "⚠️  Warning: /ralph skill may not be installed for claude" >&2
      echo "   Continuing anyway, but the loop may fail..." >&2
      sleep 2
    fi
    ;;
  opencode)
    if ! opencode debug skill 2>/dev/null | grep -q "ralph"; then
      echo "⚠️  Warning: /ralph skill may not be installed for opencode" >&2
      echo "   Continuing anyway, but the loop may fail..." >&2
      sleep 2
    fi
    ;;
esac

# Check if session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "⚠️  Tmux session '$SESSION_NAME' already exists"
  echo ""
  echo "Options:"
  echo "  1. Attach to existing session:  tmux attach -t $SESSION_NAME"
  echo "  2. Kill and restart:            tmux kill-session -t $SESSION_NAME && $0 $CLI $SESSION_NAME"
  echo "  3. Use different name:          $0 $CLI <different-name>"
  exit 1
fi

# Ensure we're in a git repo with .kanban/
if [[ ! -d .kanban ]]; then
  echo "❌ Error: No .kanban/ directory found in current directory" >&2
  echo "   Run this from a project with a kanban board" >&2
  exit 1
fi

# Check for .kanban/issues/ directory
if [[ ! -d .kanban/issues ]]; then
  echo "❌ Error: No .kanban/issues/ directory found" >&2
  echo "   The kanban board structure is incomplete" >&2
  exit 1
fi

# Check for .kanban/progress.md (create if missing)
if [[ ! -f .kanban/progress.md ]]; then
  echo "⚠️  Warning: .kanban/progress.md not found, creating empty file" >&2
  mkdir -p .kanban
  echo "# Ralph Progress Log" > .kanban/progress.md
  echo "" >> .kanban/progress.md
  echo "This file tracks implementation notes across Ralph iterations." >> .kanban/progress.md
  echo "" >> .kanban/progress.md
fi

# Check git status - warn if dirty
if git rev-parse --git-dir >/dev/null 2>&1; then
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "⚠️  Warning: Working directory has uncommitted changes" >&2
    echo "" >&2
    git status --short >&2
    echo "" >&2
    if [[ "$FORCE_MODE" == "false" ]]; then
      echo "Ralph may fail if the worktree is dirty. Continue? (y/N)" >&2
      read -r response
      if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Aborted. Commit or stash changes first." >&2
        exit 1
      fi
    else
      echo "⚡ Force mode: continuing anyway" >&2
    fi
  fi
fi

# Check for stale locks (issues stuck in in-progress or review)
STALE_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: \(in-progress\|review\)$" {} \; 2>/dev/null || true)
if [[ -n "$STALE_ISSUES" ]]; then
  echo "⚠️  Warning: Found issues in 'in-progress' or 'review' state" >&2
  echo "" >&2
  echo "$STALE_ISSUES" >&2
  echo "" >&2

  # Decide whether to reset based on force mode
  SHOULD_RESET=false
  if [[ "$FORCE_MODE" == "true" ]]; then
    echo "⚡ Force mode: auto-resetting stale locks" >&2
    SHOULD_RESET=true
  else
    echo "These may be from a previous crashed loop. Reset to 'pending'? (y/N)" >&2
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
      SHOULD_RESET=true
    fi
  fi

  if [[ "$SHOULD_RESET" == "true" ]]; then
    # Backup before reset
    BACKUP_DIR=".kanban/backups/stale-locks-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    while IFS= read -r issue_file; do
      if [[ -n "$issue_file" ]]; then
        # Backup original
        cp "$issue_file" "$BACKUP_DIR/$(basename "$issue_file")"

        # Reset status to pending
        sed -i 's/^status: \(in-progress\|review\)$/status: pending/' "$issue_file"
        echo "  ✓ Reset $(basename "$issue_file")" >&2
      fi
    done <<< "$STALE_ISSUES"

    echo "  💾 Backup saved to: $BACKUP_DIR" >&2
  else
    echo "Continuing with existing state..." >&2
  fi
fi

# Create the loop script that will run inside tmux
# Important: We create a persistent script file instead of mktemp
# because mktemp would be deleted before tmux can execute it
LOOP_SCRIPT="$HOME/.cache/ralph-loop-$SESSION_NAME.sh"
mkdir -p "$HOME/.cache"

cat > "$LOOP_SCRIPT" <<'LOOP_EOF'
#!/bin/bash
set -euo pipefail

CLI="$1"
PROJECT_DIR="$2"
SESSION_NAME="$3"
CONTINUE_ON_ERROR="$4"
SLEEP_INTERVAL="$5"
# Log lives outside PROJECT_DIR so ralph sees a clean worktree.
# Avoids catch-22 where the loop's own log makes git status dirty.
LOG_FILE="$HOME/.cache/ralph-loop-$SESSION_NAME.log"
mkdir -p "$HOME/.cache"

cd "$PROJECT_DIR"

echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "Ralph Loop started at $(date)" | tee -a "$LOG_FILE"
echo "CLI: $CLI" | tee -a "$LOG_FILE"
echo "Project: $PROJECT_DIR" | tee -a "$LOG_FILE"
echo "Session: $SESSION_NAME" | tee -a "$LOG_FILE"
echo "Continue on error: $CONTINUE_ON_ERROR" | tee -a "$LOG_FILE"
echo "Sleep interval: ${SLEEP_INTERVAL}s" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

ITERATION=0
MAX_ITERATIONS=1000  # Safety limit
CONSECUTIVE_NO_WORK=0
ISSUES_COMPLETED=0

while [[ $ITERATION -lt $MAX_ITERATIONS ]]; do
  ITERATION=$((ITERATION + 1))

  echo "" | tee -a "$LOG_FILE"
  echo "─────────────────────────────────────────────────────────" | tee -a "$LOG_FILE"
  echo "Iteration $ITERATION - $(date)" | tee -a "$LOG_FILE"
  echo "─────────────────────────────────────────────────────────" | tee -a "$LOG_FILE"

  # Count total issues and statuses for progress stats
  TOTAL_ISSUES=$(find .kanban/issues -name "*.md" 2>/dev/null | wc -l)
  DONE_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: done$" {} \; 2>/dev/null | wc -l)
  PENDING_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: pending$" {} \; 2>/dev/null | wc -l)
  BLOCKED_ISSUES=$(find .kanban/issues -name "*.md" -exec grep -l "^status: blocked$" {} \; 2>/dev/null | wc -l)

  # Count unblocked pending issues BEFORE running ralph
  # An issue is unblocked if:
  # 1. status: pending
  # 2. All blocked_by IDs reference done issues (or no blocked_by)
  UNBLOCKED_COUNT=0
  for issue_file in .kanban/issues/*.md; do
    [[ -f "$issue_file" ]] || continue

    # Check if pending
    if ! grep -q "^status: pending$" "$issue_file"; then
      continue
    fi

    # Check if blocked
    BLOCKED_BY=$(grep "^blocked_by:" "$issue_file" | sed 's/blocked_by://;s/\[//;s/\]//;s/,/ /g' || echo "")
    IS_BLOCKED=false

    if [[ -n "$BLOCKED_BY" ]]; then
      for blocker_id in $BLOCKED_BY; do
        # Find the blocker issue and check its status
        BLOCKER_FILE=$(grep -l "^id: $blocker_id$" .kanban/issues/*.md 2>/dev/null || echo "")
        if [[ -z "$BLOCKER_FILE" ]]; then
          # Blocker doesn't exist, treat as unblocked
          continue
        fi
        if ! grep -q "^status: done$" "$BLOCKER_FILE"; then
          IS_BLOCKED=true
          break
        fi
      done
    fi

    if [[ "$IS_BLOCKED" == "false" ]]; then
      UNBLOCKED_COUNT=$((UNBLOCKED_COUNT + 1))
    fi
  done

  # Progress stats
  echo "" | tee -a "$LOG_FILE"
  echo "📊 Progress: $DONE_ISSUES/$TOTAL_ISSUES done | $PENDING_ISSUES pending | $BLOCKED_ISSUES blocked | $UNBLOCKED_COUNT ready" | tee -a "$LOG_FILE"
  echo "📋 $UNBLOCKED_COUNT unblocked pending issue(s) before this iteration" | tee -a "$LOG_FILE"
  echo "✅ Issues completed this session: $ISSUES_COMPLETED" | tee -a "$LOG_FILE"

  if [[ $UNBLOCKED_COUNT -eq 0 ]]; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ No unblocked pending issues found" | tee -a "$LOG_FILE"

    # Check if there are blocked issues
    BLOCKED_COUNT=$(find .kanban/issues -name "*.md" -exec grep -l "^status: pending$" {} \; 2>/dev/null | wc -l)
    if [[ $BLOCKED_COUNT -gt 0 ]]; then
      echo "⚠️  However, $BLOCKED_COUNT issue(s) are still pending (but blocked)" | tee -a "$LOG_FILE"
      echo "   These issues are waiting on dependencies to complete" | tee -a "$LOG_FILE"
    fi

    echo "Ralph loop complete!" | tee -a "$LOG_FILE"
    break
  fi

  # Run /ralph and capture output (CLI-specific invocation)
  RALPH_OUTPUT=$(mktemp)
  case "$CLI" in
    claude)
      RALPH_CMD=("$CLI" /ralph --no-session-persistence --permission-mode bypassPermissions)
      ;;
    opencode)
      # opencode auto-triggers skills via description matching;
      # send /ralph as message text to invoke the ralph skill/command
      RALPH_CMD=("$CLI" run --dangerously-skip-permissions "/ralph")
      ;;
    *)
      RALPH_CMD=("$CLI" /ralph)
      ;;
  esac
  if "${RALPH_CMD[@]}" 2>&1 | tee -a "$LOG_FILE" | tee "$RALPH_OUTPUT"; then
    LAST_EXIT_CODE=0
  else
    LAST_EXIT_CODE=$?
  fi

  # Better output parsing - extract completed issue ID
  COMPLETED_ISSUE=$(grep -oP 'Done: #\K[0-9]+' "$RALPH_OUTPUT" 2>/dev/null || echo "")
  if [[ -n "$COMPLETED_ISSUE" ]]; then
    ISSUES_COMPLETED=$((ISSUES_COMPLETED + 1))
    echo "✅ Confirmed completion: issue #$COMPLETED_ISSUE" | tee -a "$LOG_FILE"
  fi

  # Check if ralph reported "no eligible issues" in its output
  if grep -q "no eligible issues\|No more eligible issues\|no unblocked issues" "$RALPH_OUTPUT" 2>/dev/null; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ Ralph reports no eligible issues" | tee -a "$LOG_FILE"
    rm -f "$RALPH_OUTPUT"
    break
  fi

  rm -f "$RALPH_OUTPUT"

  # Check if ralph completed successfully
  if [[ $LAST_EXIT_CODE -ne 0 ]]; then
    echo "⚠️  Ralph exited with code $LAST_EXIT_CODE" | tee -a "$LOG_FILE"

    if [[ "$CONTINUE_ON_ERROR" == "true" ]]; then
      echo "⚡ Continue-on-error mode: resetting failed issue to pending" | tee -a "$LOG_FILE"

      # Find the issue that was in-progress or review and reset it
      FAILED_ISSUE=$(find .kanban/issues -name "*.md" -exec grep -l "^status: \(in-progress\|review\)$" {} \; 2>/dev/null | head -1)
      if [[ -n "$FAILED_ISSUE" ]]; then
        # Backup before reset
        BACKUP_DIR=".kanban/backups/error-recovery-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp "$FAILED_ISSUE" "$BACKUP_DIR/$(basename "$FAILED_ISSUE")"

        # Reset to pending
        sed -i 's/^status: \(in-progress\|review\)$/status: pending/' "$FAILED_ISSUE"
        echo "  ✓ Reset $(basename "$FAILED_ISSUE") to pending" | tee -a "$LOG_FILE"
        echo "  💾 Backup saved to: $BACKUP_DIR" | tee -a "$LOG_FILE"
      fi

      # Continue to next iteration
      sleep "$SLEEP_INTERVAL"
      continue
    else
      echo "Stopping loop" | tee -a "$LOG_FILE"
      break
    fi
  fi

  # Brief pause between iterations
  sleep "$SLEEP_INTERVAL"
done

if [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
  echo "" | tee -a "$LOG_FILE"
  echo "⚠️  Reached maximum iterations ($MAX_ITERATIONS)" | tee -a "$LOG_FILE"
  echo "Stopping for safety" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "Ralph Loop finished at $(date)" | tee -a "$LOG_FILE"
echo "Total iterations: $ITERATION" | tee -a "$LOG_FILE"
echo "Issues completed this session: $ISSUES_COMPLETED" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

# Keep session alive for inspection
echo ""
echo "Session will remain open. Press Ctrl+D to exit or run: tmux kill-session -t $SESSION_NAME"
exec bash
LOOP_EOF

chmod +x "$LOOP_SCRIPT"

# Start tmux session with the loop script
PROJECT_DIR="$(pwd)"
tmux new-session -d -s "$SESSION_NAME" "bash '$LOOP_SCRIPT' '$CLI' '$PROJECT_DIR' '$SESSION_NAME' '$CONTINUE_ON_ERROR' '$SLEEP_INTERVAL'"

echo "✅ Ralph loop started in tmux session '$SESSION_NAME'"
echo ""
echo "Configuration:"
echo "  CLI: $CLI"
echo "  Force mode: $FORCE_MODE"
echo "  Continue on error: $CONTINUE_ON_ERROR"
echo "  Sleep interval: ${SLEEP_INTERVAL}s"
echo ""
echo "Monitor:"
echo "  tmux attach -t $SESSION_NAME        # Attach to session"
echo "  tail -f \$HOME/.cache/ralph-loop-$SESSION_NAME.log  # Follow the log"
echo ""
echo "Stop:"
echo "  tmux kill-session -t $SESSION_NAME  # Kill the session"
echo ""
echo "The loop will run until all unblocked pending issues are done."
echo ""
echo "Loop script: $LOOP_SCRIPT"
