#!/bin/bash
# Ralph Loop - Background tmux session that runs /ralph until no issues remain
# Usage: ralph-loop.sh [claude|opencode] [tmux-session-name]

set -euo pipefail

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

# Validate /ralph skill exists
if ! $CLI /help 2>/dev/null | grep -q "ralph"; then
  echo "⚠️  Warning: /ralph skill may not be installed for $CLI" >&2
  echo "   Continuing anyway, but the loop may fail..." >&2
  sleep 2
fi

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
    echo "Ralph may fail if the worktree is dirty. Continue? (y/N)" >&2
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
      echo "Aborted. Commit or stash changes first." >&2
      exit 1
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
  echo "These may be from a previous crashed loop. Reset to 'pending'? (y/N)" >&2
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    while IFS= read -r issue_file; do
      if [[ -n "$issue_file" ]]; then
        # Reset status to pending
        sed -i 's/^status: \(in-progress\|review\)$/status: pending/' "$issue_file"
        echo "  ✓ Reset $(basename "$issue_file")" >&2
      fi
    done <<< "$STALE_ISSUES"
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
LOG_FILE="$PROJECT_DIR/.kanban/ralph-loop.log"

cd "$PROJECT_DIR"

echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "Ralph Loop started at $(date)" | tee -a "$LOG_FILE"
echo "CLI: $CLI" | tee -a "$LOG_FILE"
echo "Project: $PROJECT_DIR" | tee -a "$LOG_FILE"
echo "Session: $SESSION_NAME" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

ITERATION=0
MAX_ITERATIONS=1000  # Safety limit
CONSECUTIVE_NO_WORK=0

while [[ $ITERATION -lt $MAX_ITERATIONS ]]; do
  ITERATION=$((ITERATION + 1))

  echo "" | tee -a "$LOG_FILE"
  echo "─────────────────────────────────────────────────────────" | tee -a "$LOG_FILE"
  echo "Iteration $ITERATION - $(date)" | tee -a "$LOG_FILE"
  echo "─────────────────────────────────────────────────────────" | tee -a "$LOG_FILE"

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

  echo "📋 $UNBLOCKED_COUNT unblocked pending issue(s) before this iteration" | tee -a "$LOG_FILE"

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

  # Run /ralph and capture output
  RALPH_OUTPUT=$(mktemp)
  if $CLI /ralph --no-session-persistence --permission-mode bypassPermissions 2>&1 | tee -a "$LOG_FILE" | tee "$RALPH_OUTPUT"; then
    LAST_EXIT_CODE=0
  else
    LAST_EXIT_CODE=$?
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
    echo "Stopping loop" | tee -a "$LOG_FILE"
    break
  fi

  # Brief pause between iterations
  sleep 3
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
echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

# Keep session alive for inspection
echo ""
echo "Session will remain open. Press Ctrl+D to exit or run: tmux kill-session -t $SESSION_NAME"
exec bash
LOOP_EOF

chmod +x "$LOOP_SCRIPT"

# Start tmux session with the loop script
PROJECT_DIR="$(pwd)"
tmux new-session -d -s "$SESSION_NAME" "bash '$LOOP_SCRIPT' '$CLI' '$PROJECT_DIR' '$SESSION_NAME'"

echo "✅ Ralph loop started in tmux session '$SESSION_NAME'"
echo ""
echo "Monitor:"
echo "  tmux attach -t $SESSION_NAME        # Attach to session"
echo "  tail -f .kanban/ralph-loop.log      # Follow the log"
echo ""
echo "Stop:"
echo "  tmux kill-session -t $SESSION_NAME  # Kill the session"
echo ""
echo "The loop will run until all unblocked pending issues are done."
echo ""
echo "Loop script: $LOOP_SCRIPT"
