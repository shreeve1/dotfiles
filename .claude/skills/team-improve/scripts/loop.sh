#!/bin/bash
# loop.sh -- Autonomous hill-climbing loop for any agent team or company
# Usage: ./loop.sh <team-path-or-name> [max-iterations] [max-consecutive-discards]
#
# Accepts any team directory path OR a team name (searched in known locations).
# Reads runner from program.md (pi -p, claude -p, etc.)
#
# Examples:
#   ./loop.sh ~/.pi/agent/agents/teams/2-infra-ops
#   ./loop.sh my-code-team
#   ./loop.sh /Users/james/.paperclip/instances/default  20 3

set -euo pipefail

TEAM_ARG="${1:?Usage: $0 <team-path-or-name> [max-iterations] [max-consecutive-discards]}"
MAX_ITERATIONS="${2:-50}"
MAX_DISCARDS="${3:-5}"
COOLDOWN=10

# Resolve team directory
resolve_team_dir() {
  local arg="$1"
  # Expand tilde
  arg="${arg/#\~/$HOME}"
  # If it's a path that exists, use it
  if [ -d "$arg" ]; then
    echo "$arg"
    return
  fi
  # Search known locations
  for candidate in \
    "$HOME/.claude/teams/$arg" \
    "$HOME/.pi/agent/agents/teams/$arg" \
    "$HOME/.pi/agent/agents/teams/"*"$arg"*
  do
    if [ -d "$candidate" ] && [ -f "$candidate/program.md" ]; then
      echo "$candidate"
      return
    fi
  done
  echo ""
}

TEAM_DIR=$(resolve_team_dir "$TEAM_ARG")

if [ -z "$TEAM_DIR" ] || [ ! -d "$TEAM_DIR" ]; then
  echo "ERROR: Could not find team directory for: $TEAM_ARG"
  exit 1
fi

if [ ! -f "$TEAM_DIR/program.md" ]; then
  echo "ERROR: No program.md found at $TEAM_DIR/program.md"
  echo "Run /team-program first."
  exit 1
fi

if [ ! -d "$TEAM_DIR/benchmarks" ]; then
  echo "ERROR: No benchmarks/ directory found at $TEAM_DIR/benchmarks/"
  exit 1
fi

# Read runner from program.md (default: claude -p)
RUNNER=$(grep -E '^runner:' "$TEAM_DIR/program.md" | head -1 | sed 's/runner: *//' | sed 's/ *$//')
RUNNER="${RUNNER:-claude -p}"

TEAM_NAME=$(basename "$TEAM_DIR")
RESULTS="$TEAM_DIR/experiments/results.tsv"
SKILL="$HOME/.claude/skills/team-improve/SKILL.md"
LOG_DIR="$TEAM_DIR/experiments/logs"

mkdir -p "$LOG_DIR"

STOPPED=false
trap 'echo ""; echo "=== Received SIGINT -- finishing current iteration and stopping ==="; STOPPED=true' INT

consecutive_discards=0
iteration=0
start_time=$(date +%s)

echo "============================================"
echo "  Team Improvement Loop: $TEAM_NAME"
echo "  Directory: $TEAM_DIR"
echo "  Runner: $RUNNER"
echo "  Max iterations: $MAX_ITERATIONS"
echo "  Circuit breaker: $MAX_DISCARDS consecutive discards"
echo "  Cooldown: ${COOLDOWN}s between iterations"
echo "  Logs: $LOG_DIR/"
echo "============================================"
echo ""

if [ -f "$RESULTS" ] && [ "$(wc -l < "$RESULTS")" -gt 1 ]; then
  baseline_score=$(head -2 "$RESULTS" | tail -1 | cut -f3)
  current_score=$(tail -1 "$RESULTS" | cut -f3)
  echo "Baseline score: $baseline_score"
  echo "Current score:  $current_score"
  echo ""
fi

while [ "$iteration" -lt "$MAX_ITERATIONS" ] && [ "$STOPPED" = false ]; do
  iteration=$((iteration + 1))
  iter_start=$(date +%s)
  log_file="$LOG_DIR/iteration-$(printf '%03d' $iteration)-$(date +%Y%m%d-%H%M%S).log"

  echo "--- Iteration $iteration/$MAX_ITERATIONS ($(date +%H:%M:%S)) ---"

  $RUNNER "Run one team-improve cycle. Read the skill at $SKILL and follow it exactly for one experiment cycle. Team directory: $TEAM_DIR" > "$log_file" 2>&1 || true

  if [ -f "$RESULTS" ] && [ "$(wc -l < "$RESULTS")" -gt 1 ]; then
    last_line=$(tail -1 "$RESULTS")
    last_status=$(echo "$last_line" | cut -f5)
    last_score=$(echo "$last_line" | cut -f3)
    last_desc=$(echo "$last_line" | cut -f6)

    echo "  Result: $last_status | Score: $last_score | $last_desc"

    if [ "$last_status" = "discard" ]; then
      consecutive_discards=$((consecutive_discards + 1))
      echo "  Consecutive discards: $consecutive_discards/$MAX_DISCARDS"
      if [ "$consecutive_discards" -ge "$MAX_DISCARDS" ]; then
        echo ""
        echo "=== Circuit breaker: $MAX_DISCARDS consecutive discards ==="
        echo "Review $TEAM_DIR/experiments/latest.md for analysis."
        break
      fi
    else
      consecutive_discards=0
    fi
  else
    echo "  WARNING: No results.tsv entry found -- check log: $log_file"
  fi

  iter_elapsed=$(( $(date +%s) - iter_start ))
  echo "  Duration: ${iter_elapsed}s | Log: $log_file"

  if [ "$STOPPED" = false ] && [ "$iteration" -lt "$MAX_ITERATIONS" ]; then
    echo "  Cooling down ${COOLDOWN}s..."
    sleep $COOLDOWN
  fi
done

elapsed=$(( $(date +%s) - start_time ))
echo ""
echo "============================================"
echo "  Loop Complete: $TEAM_NAME"
echo "  Iterations: $iteration | Duration: $((elapsed/60))m $((elapsed%60))s"
echo "  Reason: $(if [ "$STOPPED" = true ]; then echo "user stopped"; elif [ "$consecutive_discards" -ge "$MAX_DISCARDS" ]; then echo "circuit breaker"; else echo "max iterations"; fi)"

if [ -f "$RESULTS" ] && [ "$(wc -l < "$RESULTS")" -gt 1 ]; then
  baseline_score=$(head -2 "$RESULTS" | tail -1 | cut -f3)
  current_score=$(tail -1 "$RESULTS" | cut -f3)
  total=$(( $(wc -l < "$RESULTS") - 1 ))
  kept=$(grep -c "	keep	" "$RESULTS" 2>/dev/null || echo 0)
  discarded=$(grep -c "	discard	" "$RESULTS" 2>/dev/null || echo 0)
  echo "  Score: $baseline_score -> $current_score | Experiments: $total ($kept kept, $discarded discarded)"
fi

echo ""
echo "  Compare: $(dirname "$0")/compare.sh $TEAM_DIR"
echo "  Rollback: $(dirname "$0")/rollback.sh $TEAM_DIR baseline"
echo "============================================"
