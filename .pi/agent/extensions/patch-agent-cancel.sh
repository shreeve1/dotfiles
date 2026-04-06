#!/usr/bin/env bash
# patch-agent-cancel.sh — Apply abort/timeout/cleanup changes to agent-team.ts
#
# This script replaces agent-team.ts with the pre-built .new version.
# A backup is created automatically.
#
# Usage: bash patch-agent-cancel.sh
#
# Changes applied:
#   1. Add ChildProcess type import from child_process
#   2. Add `proc: ChildProcess | null` to AgentState interface
#   3. Initialize proc: null in activateTeam()
#   4. Wire signal parameter in execute() (rename _signal → signal)
#   5. Pass signal through to dispatchAgent()
#   6. Add abort listener (SIGTERM→SIGKILL) in dispatchAgent() after spawn
#   7. Add 10-minute timeout per agent run in dispatchAgent()
#   8. Store proc on AgentState after spawn, clear on close/error
#   9. Add same timeout + proc tracking to handleInputRequest()
#  10. Add session_shutdown handler to kill all running agents
#  11. Enhance process.on("exit") to kill all running agents

set -euo pipefail

EXTENSION_DIR="${HOME}/.pi/agent/extensions"
ORIGINAL="${EXTENSION_DIR}/agent-team.ts"
NEW_FILE="${EXTENSION_DIR}/agent-team.ts.new"

if [ ! -f "$NEW_FILE" ]; then
    echo "ERROR: ${NEW_FILE} not found. Generate it first."
    exit 1
fi

# Create timestamped backup
BACKUP="${ORIGINAL}.bak.$(date +%Y%m%d%H%M%S)"
cp "$ORIGINAL" "$BACKUP"
echo "Backup created: ${BACKUP}"

# Apply the patched version
cp "$NEW_FILE" "$ORIGINAL"
echo "Patched version applied to ${ORIGINAL}"
echo ""
echo "To verify: diff ${BACKUP} ${ORIGINAL}"
echo "To revert: cp ${BACKUP} ${ORIGINAL}"
