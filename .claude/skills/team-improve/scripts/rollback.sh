#!/bin/bash
# rollback.sh -- Restore a team from a snapshot (any platform)
# Usage: ./rollback.sh <team-path-or-name> <snapshot-id|baseline>

set -euo pipefail

TEAM_ARG="${1:?Usage: $0 <team-path-or-name> <snapshot-id|baseline>}"
SNAPSHOT_ID="${2:?Usage: $0 <team-path-or-name> <snapshot-id|baseline>}"

# Resolve team directory
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
SNAPSHOT_DIR="$TEAM_DIR/experiments/snapshots/$SNAPSHOT_ID"

if [ ! -d "$SNAPSHOT_DIR" ]; then
  echo "ERROR: Snapshot not found: $SNAPSHOT_DIR"
  echo ""
  echo "Available snapshots:"
  ls -1 "$TEAM_DIR/experiments/snapshots/" 2>/dev/null | sed 's/^/  /'
  exit 1
fi

# Read agent_dir and instructions_deployed from program.md
agent_dir=""
instructions_deployed=""
apply_method=""
if [ -f "$TEAM_DIR/program.md" ]; then
  raw_agent=$(grep -E '^agent_dir:' "$TEAM_DIR/program.md" | head -1 | sed 's/agent_dir: *//' | sed 's/ *$//')
  raw_source=$(grep -E '^instructions_source:' "$TEAM_DIR/program.md" | head -1 | sed 's/instructions_source: *//' | sed 's/ *$//')
  raw_deployed=$(grep -E '^instructions_deployed:' "$TEAM_DIR/program.md" | head -1 | sed 's/instructions_deployed: *//' | sed 's/ *$//')
  apply_method=$(grep -E '^apply_method:' "$TEAM_DIR/program.md" | head -1 | sed 's/apply_method: *//' | sed 's/ *$//')
  agent_dir="${raw_agent:-$raw_source}"
  agent_dir="${agent_dir/#\~/$HOME}"
  instructions_deployed="${raw_deployed/#\~/$HOME}"
fi
[ -z "$agent_dir" ] || [ ! -d "$agent_dir" ] && agent_dir=""

echo "============================================"
echo "  Rolling back: $TEAM_NAME -> $SNAPSHOT_ID"
echo "  Apply method: ${apply_method:-file-edit}"
echo "============================================"
echo ""

# Restore agent files
if [ -d "$SNAPSHOT_DIR/agents" ] && [ -n "$agent_dir" ]; then
  echo "Restoring agent files to $agent_dir/"
  count=0
  for f in "$SNAPSHOT_DIR/agents/"*.md; do
    [ -f "$f" ] || continue
    fname=$(basename "$f")
    cp "$f" "$agent_dir/$fname"
    echo "  + $fname"
    count=$((count+1))
  done
  echo "  ($count files)"

  # Remove files created after snapshot
  echo "  Checking for post-snapshot files..."
  for cf in "$agent_dir/"*.md; do
    [ -f "$cf" ] || continue
    fname=$(basename "$cf")
    if [ ! -f "$SNAPSHOT_DIR/agents/$fname" ]; then
      echo "  Removing post-snapshot: $fname"
      rm "$cf"
    fi
  done
else
  echo "  SKIP: No agent snapshot or agent_dir not found"
fi

echo ""

# Restore team config
if [ -d "$SNAPSHOT_DIR/team-config" ]; then
  echo "Restoring team config to $TEAM_DIR/"
  for f in "$SNAPSHOT_DIR/team-config/"*; do
    [ -f "$f" ] || continue
    fname=$(basename "$f")
    cp "$f" "$TEAM_DIR/$fname"
    echo "  + $fname"
  done
else
  echo "  SKIP: No team-config snapshot"
fi

echo ""

# Restore expertise
if [ -d "$SNAPSHOT_DIR/expertise" ]; then
  echo "Restoring expertise to $TEAM_DIR/expertise/"
  for f in "$SNAPSHOT_DIR/expertise/"*.md; do
    [ -f "$f" ] || continue
    fname=$(basename "$f")
    cp "$f" "$TEAM_DIR/expertise/$fname"
    echo "  + $fname"
  done
else
  echo "  SKIP: No expertise snapshot"
fi

echo ""

# For Paperclip: re-deploy restored files
if [ "${apply_method:-}" = "file-edit+deploy" ] && [ -n "$instructions_deployed" ]; then
  echo "Re-deploying to $instructions_deployed"
  echo "  NOTE: UUID mapping is in program.md -- verify deployed paths match agent UUIDs"
  # The program.md Edit Surface section lists each agent with its UUID.
  # Claude should handle the actual deployment when running team-improve.
  # This script restores the source files; redeploy is handled by team-improve.
  echo "  Source files restored. Re-deploy by running /team-improve to establish new baseline."
fi

echo ""
echo "Rollback complete: $TEAM_NAME -> $SNAPSHOT_ID"
echo "Note: results.tsv is NOT modified. The next improvement cycle will re-benchmark from this state."
