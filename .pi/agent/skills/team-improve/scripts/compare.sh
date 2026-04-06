#!/bin/bash
# compare.sh — Show what changed from baseline for a team
# Usage: ./compare.sh <team-name>

set -euo pipefail

TEAM="${1:?Usage: $0 <team-name>}"
TEAM_DIR="$HOME/.pi/agent/agents/teams/$TEAM"
BASELINE="$TEAM_DIR/experiments/snapshots/baseline"
RESULTS="$TEAM_DIR/experiments/results.tsv"

if [ ! -d "$BASELINE" ]; then
  echo "ERROR: No baseline snapshot found at $BASELINE"
  echo "Run the improvement loop first to establish a baseline."
  exit 1
fi

# Determine where current agent definitions live
# Read program.md to find agent_dir, or use convention
PROGRAM="$TEAM_DIR/program.md"
if [ -f "$PROGRAM" ]; then
  agent_dir=$(grep 'agent_dir:' "$PROGRAM" | head -1 | sed 's/.*agent_dir: *//' | sed 's/ *$//')
  # Expand tilde to $HOME
  agent_dir="${agent_dir/#\~/$HOME}"
fi
# Fallback: resolve from team name
if [ -z "${agent_dir:-}" ] || [ ! -d "${agent_dir:-}" ]; then
  agent_dir=""
  # Try common patterns
  for candidate in "$HOME/.pi/agent/agents/${TEAM/[0-9]-/}" "$HOME/.pi/agent/agents/$TEAM"; do
    if [ -d "$candidate" ]; then
      agent_dir="$candidate"
      break
    fi
  done
fi

echo "============================================"
echo "  Baseline Comparison: $TEAM"
echo "============================================"
echo ""

# Score trajectory
if [ -f "$RESULTS" ] && [ "$(wc -l < "$RESULTS")" -gt 1 ]; then
  baseline_score=$(head -2 "$RESULTS" | tail -1 | cut -f3)
  current_score=$(tail -1 "$RESULTS" | cut -f3)
  total=$(( $(wc -l < "$RESULTS") - 1 ))
  kept=$(grep -c "	keep	" "$RESULTS" 2>/dev/null || echo 0)
  discarded=$(grep -c "	discard	" "$RESULTS" 2>/dev/null || echo 0)

  echo "Score Trajectory:"
  echo "  Baseline: $baseline_score"
  echo "  Current:  $current_score"
  echo "  Experiments: $total ($kept kept, $discarded discarded)"
  echo ""

  echo "Experiment History:"
  echo "  $(head -1 "$RESULTS")"
  tail -n +2 "$RESULTS" | while IFS=$'\t' read -r ts id score benchmarks status desc; do
    marker="  "
    [ "$status" = "keep" ] && marker="✓ "
    [ "$status" = "discard" ] && marker="✗ "
    [ "$status" = "baseline" ] && marker="◆ "
    echo "  ${marker}${score}  ${status}  ${desc}"
  done
  echo ""
fi

# File diffs
echo "--- Agent Definition Changes ---"
echo ""

if [ -d "$BASELINE/agents" ] && [ -n "${agent_dir:-}" ]; then
  for baseline_file in "$BASELINE/agents/"*.md; do
    fname=$(basename "$baseline_file")
    current_file="$agent_dir/$fname"
    if [ -f "$current_file" ]; then
      changes=$(diff "$baseline_file" "$current_file" 2>/dev/null || true)
      if [ -n "$changes" ]; then
        echo "  CHANGED: $fname"
        echo "$changes" | head -30 | sed 's/^/    /'
        total_lines=$(echo "$changes" | wc -l)
        if [ "$total_lines" -gt 30 ]; then
          echo "    ... ($((total_lines - 30)) more lines)"
        fi
        echo ""
      fi
    else
      echo "  DELETED: $fname"
    fi
  done

  # Check for new files
  if [ -n "${agent_dir:-}" ]; then
    for current_file in "$agent_dir/"*.md; do
      fname=$(basename "$current_file")
      if [ ! -f "$BASELINE/agents/$fname" ]; then
        echo "  NEW: $fname"
      fi
    done
  fi
else
  echo "  (could not resolve agent directory for diffing)"
fi

echo ""
echo "--- Team Config Changes ---"
echo ""

if [ -d "$BASELINE/team-config" ]; then
  for baseline_file in "$BASELINE/team-config/"*; do
    fname=$(basename "$baseline_file")
    current_file="$TEAM_DIR/$fname"
    if [ -f "$current_file" ]; then
      changes=$(diff "$baseline_file" "$current_file" 2>/dev/null || true)
      if [ -n "$changes" ]; then
        echo "  CHANGED: $fname"
        echo "$changes" | head -30 | sed 's/^/    /'
        total_lines=$(echo "$changes" | wc -l)
        if [ "$total_lines" -gt 30 ]; then
          echo "    ... ($((total_lines - 30)) more lines)"
        fi
        echo ""
      fi
    fi
  done
fi

echo ""
echo "--- Expertise Changes ---"
echo ""

if [ -d "$BASELINE/expertise" ]; then
  for baseline_file in "$BASELINE/expertise/"*.md; do
    fname=$(basename "$baseline_file")
    current_file="$TEAM_DIR/expertise/$fname"
    if [ -f "$current_file" ]; then
      changes=$(diff "$baseline_file" "$current_file" 2>/dev/null || true)
      if [ -n "$changes" ]; then
        echo "  CHANGED: $fname"
        echo "$changes" | head -20 | sed 's/^/    /'
        echo ""
      fi
    fi
  done
fi

echo ""
echo "To rollback: $(dirname "$0")/rollback.sh $TEAM baseline"
echo "To rollback to a specific snapshot: $(dirname "$0")/rollback.sh $TEAM <snapshot-id>"
echo "Available snapshots:"
ls -1 "$TEAM_DIR/experiments/snapshots/" 2>/dev/null | sed 's/^/  /'
