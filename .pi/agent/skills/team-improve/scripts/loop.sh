#!/bin/bash
# team-improve-loop.sh — Autonomous hill-climbing loop for agent teams
# Usage: ./loop.sh <team-name> [max-iterations] [max-consecutive-discards]
#
# Runs the team-improve skill repeatedly in fresh pi sessions.
# Stops on: max iterations, circuit breaker (too many discards), or SIGINT.
#
# Examples:
#   ./loop.sh 1-full              # Default: 50 iterations, 5 discard limit
#   ./loop.sh 2-infra-ops 20 3    # 20 iterations, 3 discard limit
#   ./loop.sh pi-pi 100 10        # 100 iterations, 10 discard limit

set -euo pipefail

TEAM="${1:?Usage: $0 <team-name> [max-iterations] [max-consecutive-discards]}"
MAX_ITERATIONS="${2:-50}"
MAX_DISCARDS="${3:-5}"
COOLDOWN=10  # seconds between iterations

TEAM_DIR="$HOME/.pi/agent/agents/teams/$TEAM"
RESULTS="$TEAM_DIR/experiments/results.tsv"
SKILL="$HOME/.pi/agent/skills/team-improve/SKILL.md"
LOG_DIR="$TEAM_DIR/experiments/logs"

# Validate
if [ ! -f "$TEAM_DIR/program.md" ]; then
  echo "ERROR: No program.md found at $TEAM_DIR/program.md"
  echo "Create a program.md for team '$TEAM' before running the loop."
  exit 1
fi

if [ ! -f "$SKILL" ]; then
  echo "ERROR: team-improve skill not found at $SKILL"
  exit 1
fi

if [ ! -d "$TEAM_DIR/benchmarks" ]; then
  echo "ERROR: No benchmarks/ directory found at $TEAM_DIR/benchmarks/"
  exit 1
fi

mkdir -p "$LOG_DIR"

# Trap SIGINT for clean shutdown
STOPPED=false
trap 'echo ""; echo "=== Received SIGINT — finishing current iteration and stopping ==="; STOPPED=true' INT

consecutive_discards=0
iteration=0
start_time=$(date +%s)

echo "============================================"
echo "  Team Improvement Loop: $TEAM"
echo "  Max iterations: $MAX_ITERATIONS"
echo "  Circuit breaker: $MAX_DISCARDS consecutive discards"
echo "  Cooldown: ${COOLDOWN}s between iterations"
echo "  Logs: $LOG_DIR/"
echo "  Results: $RESULTS"
echo "============================================"
echo ""

# Show baseline score if results exist
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

  # Run one improvement cycle
  pi -p "Run one team-improve cycle for team '$TEAM'. Read the skill at $SKILL and follow it for one experiment cycle. Team directory: $TEAM_DIR/" > "$log_file" 2>&1 || true

  # Check the result
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
        echo "The loop has stopped finding improvements."
        echo "Review experiments/latest.md for analysis."
        break
      fi
    else
      consecutive_discards=0
    fi
  else
    echo "  WARNING: No results.tsv entry found — iteration may have failed"
    echo "  Check log: $log_file"
  fi

  iter_elapsed=$(( $(date +%s) - iter_start ))
  echo "  Duration: ${iter_elapsed}s | Log: $log_file"

  if [ "$STOPPED" = false ] && [ "$iteration" -lt "$MAX_ITERATIONS" ]; then
    echo "  Cooling down ${COOLDOWN}s..."
    sleep $COOLDOWN
  fi
done

# Final summary
elapsed=$(( $(date +%s) - start_time ))
elapsed_min=$(( elapsed / 60 ))
elapsed_sec=$(( elapsed % 60 ))

echo ""
echo "============================================"
echo "  Loop Complete"
echo "  Team: $TEAM"
echo "  Iterations: $iteration"
echo "  Duration: ${elapsed_min}m ${elapsed_sec}s"
echo "  Reason: $(if [ "$STOPPED" = true ]; then echo "user stopped"; elif [ "$consecutive_discards" -ge "$MAX_DISCARDS" ]; then echo "circuit breaker"; else echo "max iterations"; fi)"
echo ""

if [ -f "$RESULTS" ] && [ "$(wc -l < "$RESULTS")" -gt 1 ]; then
  baseline_score=$(head -2 "$RESULTS" | tail -1 | cut -f3)
  current_score=$(tail -1 "$RESULTS" | cut -f3)
  total_experiments=$(( $(wc -l < "$RESULTS") - 1 ))
  kept=$(grep -c "	keep	" "$RESULTS" 2>/dev/null || echo 0)
  discarded=$(grep -c "	discard	" "$RESULTS" 2>/dev/null || echo 0)

  echo "  Baseline score: $baseline_score"
  echo "  Current score:  $current_score"
  echo "  Experiments: $total_experiments ($kept kept, $discarded discarded)"
fi

echo ""
echo "  Compare to baseline: $(dirname "$0")/compare.sh $TEAM"
echo "  Rollback to baseline: $(dirname "$0")/rollback.sh $TEAM baseline"
echo "============================================"
