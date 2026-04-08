#!/bin/bash
# compare.sh -- Show what changed from baseline for any team
# Usage: ./compare.sh <team-path-or-name>

set -euo pipefail

TEAM_ARG="${1:?Usage: $0 <team-path-or-name>}"

# Resolve team directory (same logic as loop.sh)
resolve_team_dir() {
  local arg="${1/#\~/$HOME}"
  [ -d "$arg" ] && echo "$arg" && return
  for candidate in \
    "$HOME/.claude/teams/$arg" \
    "$HOME/.pi/agent/agents/teams/$arg" \
    "$HOME/.pi/agent/agents/teams/"*"$arg"*
  do
    [ -d "$candidate" ] && [ -f "$candidate/program.md" ] && echo "$candidate" && return
  done
  echo ""
}

TEAM_DIR=$(resolve_team_dir "$TEAM_ARG")
[ -z "$TEAM_DIR" ] && echo "ERROR: Cannot find team: $TEAM_ARG" && exit 1

TEAM_NAME=$(basename "$TEAM_DIR")
BASELINE="$TEAM_DIR/experiments/snapshots/baseline"
RESULTS="$TEAM_DIR/experiments/results.tsv"

if [ ! -d "$BASELINE" ]; then
  echo "ERROR: No baseline snapshot found. Run the improvement loop first."
  exit 1
fi

# Read agent_dir or instructions_source from program.md
agent_dir=""
if [ -f "$TEAM_DIR/program.md" ]; then
  raw=$(grep -E '^agent_dir:|^instructions_source:' "$TEAM_DIR/program.md" | head -1 | sed 's/.*: *//' | sed 's/ *$//')
  agent_dir="${raw/#\~/$HOME}"
fi
[ -z "$agent_dir" ] || [ ! -d "$agent_dir" ] && agent_dir=""

echo "============================================"
echo "  Baseline Comparison: $TEAM_NAME"
echo "  Directory: $TEAM_DIR"
echo "============================================"
echo ""

# Score trajectory
if [ -f "$RESULTS" ] && [ "$(wc -l < "$RESULTS")" -gt 1 ]; then
  baseline_score=$(head -2 "$RESULTS" | tail -1 | cut -f3)
  current_score=$(tail -1 "$RESULTS" | cut -f3)
  total=$(( $(wc -l < "$RESULTS") - 1 ))
  kept=$(grep -c "	keep	" "$RESULTS" 2>/dev/null || echo 0)
  discarded=$(grep -c "	discard	" "$RESULTS" 2>/dev/null || echo 0)

  echo "Score: $baseline_score (baseline) -> $current_score (current)"
  echo "Experiments: $total total ($kept kept, $discarded discarded)"
  echo ""
  echo "History:"
  tail -n +2 "$RESULTS" | while IFS=$'\t' read -r ts id score benchmarks status desc; do
    case "$status" in
      keep)     marker="+ " ;;
      discard)  marker="x " ;;
      baseline) marker="* " ;;
      *)        marker="  " ;;
    esac
    echo "  ${marker}${score}  [${status}]  ${desc}"
  done
  echo ""
fi

diff_dir() {
  local label="$1" baseline_path="$2" current_path="$3" pattern="${4:-*}"
  echo "--- $label ---"
  echo ""
  if [ ! -d "$baseline_path" ]; then echo "  (no baseline for $label)"; echo ""; return; fi
  changed=0
  for bf in "$baseline_path/"$pattern; do
    [ -f "$bf" ] || continue
    fname=$(basename "$bf")
    cf="$current_path/$fname"
    if [ -f "$cf" ]; then
      changes=$(diff "$bf" "$cf" 2>/dev/null || true)
      if [ -n "$changes" ]; then
        echo "  CHANGED: $fname"
        echo "$changes" | head -30 | sed 's/^/    /'
        total_lines=$(echo "$changes" | wc -l)
        [ "$total_lines" -gt 30 ] && echo "    ... ($((total_lines - 30)) more lines)"
        echo ""
        changed=$((changed+1))
      fi
    else
      echo "  DELETED: $fname"
      changed=$((changed+1))
    fi
  done
  if [ -n "$current_path" ] && [ -d "$current_path" ]; then
    for cf in "$current_path/"$pattern; do
      [ -f "$cf" ] || continue
      fname=$(basename "$cf")
      [ ! -f "$baseline_path/$fname" ] && echo "  NEW: $fname" && changed=$((changed+1))
    done
  fi
  [ "$changed" -eq 0 ] && echo "  (no changes)"
  echo ""
}

if [ -n "$agent_dir" ]; then
  diff_dir "Agent Instructions" "$BASELINE/agents" "$agent_dir" "*.md"
else
  echo "--- Agent Instructions ---"
  echo "  (agent_dir not resolved — cannot diff)"
  echo ""
fi

diff_dir "Team Config" "$BASELINE/team-config" "$TEAM_DIR"
diff_dir "Expertise" "$BASELINE/expertise" "$TEAM_DIR/expertise" "*.md"

echo ""
echo "To rollback: $(dirname "$0")/rollback.sh $TEAM_DIR baseline"
echo "Available snapshots:"
ls -1 "$TEAM_DIR/experiments/snapshots/" 2>/dev/null | sed 's/^/  /'
