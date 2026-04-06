#!/bin/bash
# rollback.sh — Restore a team's agent definitions from a snapshot
# Usage: ./rollback.sh <team-name> <snapshot-id|baseline>

set -euo pipefail

TEAM="${1:?Usage: $0 <team-name> <snapshot-id|baseline>}"
SNAPSHOT_ID="${2:?Usage: $0 <team-name> <snapshot-id|baseline>}"

TEAM_DIR="$HOME/.pi/agent/agents/teams/$TEAM"
SNAPSHOT_DIR="$TEAM_DIR/experiments/snapshots/$SNAPSHOT_ID"

if [ ! -d "$SNAPSHOT_DIR" ]; then
  echo "ERROR: Snapshot not found at $SNAPSHOT_DIR"
  echo ""
  echo "Available snapshots:"
  ls -1 "$TEAM_DIR/experiments/snapshots/" 2>/dev/null | sed 's/^/  /'
  exit 1
fi

# Determine agent directory from program.md
PROGRAM="$TEAM_DIR/program.md"
agent_dir=""
if [ -f "$PROGRAM" ]; then
  agent_dir=$(grep 'agent_dir:' "$PROGRAM" | head -1 | sed 's/.*agent_dir: *//' | sed 's/ *$//')
  # Expand tilde to $HOME
  agent_dir="${agent_dir/#\~/$HOME}"
fi
if [ -z "$agent_dir" ] || [ ! -d "$agent_dir" ]; then
  agent_dir=""
  for candidate in "$HOME/.pi/agent/agents/${TEAM/[0-9]-/}" "$HOME/.pi/agent/agents/$TEAM"; do
    if [ -d "$candidate" ]; then
      agent_dir="$candidate"
      break
    fi
  done
fi

echo "============================================"
echo "  Rolling back: $TEAM → $SNAPSHOT_ID"
echo "============================================"
echo ""

# Restore agent definitions
if [ -d "$SNAPSHOT_DIR/agents" ] && [ -n "$agent_dir" ]; then
  echo "Restoring agent definitions to $agent_dir/"
  count=0
  for f in "$SNAPSHOT_DIR/agents/"*.md; do
    fname=$(basename "$f")
    cp "$f" "$agent_dir/$fname"
    echo "  ✓ $fname"
    count=$((count + 1))
  done
  echo "  ($count files restored)"
else
  echo "  SKIP: No agent definitions in snapshot (or agent_dir not found)"
fi

echo ""

# Restore team config
if [ -d "$SNAPSHOT_DIR/team-config" ]; then
  echo "Restoring team config to $TEAM_DIR/"
  for f in "$SNAPSHOT_DIR/team-config/"*; do
    fname=$(basename "$f")
    cp "$f" "$TEAM_DIR/$fname"
    echo "  ✓ $fname"
  done
else
  echo "  SKIP: No team config in snapshot"
fi

echo ""

# Restore expertise
if [ -d "$SNAPSHOT_DIR/expertise" ]; then
  echo "Restoring expertise to $TEAM_DIR/expertise/"
  for f in "$SNAPSHOT_DIR/expertise/"*.md; do
    fname=$(basename "$f")
    cp "$f" "$TEAM_DIR/expertise/$fname"
    echo "  ✓ $fname"
  done
else
  echo "  SKIP: No expertise files in snapshot"
fi

echo ""

# Restore agent-skills (mental-model.md)
if [ -d "$SNAPSHOT_DIR/agent-skills" ]; then
  echo "Restoring agent-skills to $TEAM_DIR/agent-skills/"
  mkdir -p "$TEAM_DIR/agent-skills"
  for f in "$SNAPSHOT_DIR/agent-skills/"*; do
    fname=$(basename "$f")
    cp "$f" "$TEAM_DIR/agent-skills/$fname"
    echo "  ✓ $fname"
  done
else
  echo "  SKIP: No agent-skills in snapshot"
fi

echo ""

# Clean up files that were created AFTER the snapshot (not in baseline)
if [ -n "$agent_dir" ] && [ -d "$SNAPSHOT_DIR/agents" ]; then
  echo "Checking for files created after snapshot..."
  for current_file in "$agent_dir/"*.md; do
    fname=$(basename "$current_file")
    if [ ! -f "$SNAPSHOT_DIR/agents/$fname" ]; then
      echo "  ⚠ Removing post-snapshot file: $fname"
      rm "$current_file"
    fi
  done
fi

echo ""
echo "✅ Rollback complete: $TEAM → $SNAPSHOT_ID"
echo ""
echo "Note: results.tsv is NOT modified. The experiment history is preserved."
echo "The next improvement cycle will re-benchmark from this restored state."
