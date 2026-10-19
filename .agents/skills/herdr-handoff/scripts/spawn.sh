#!/usr/bin/env bash
# Open a herdr tab, start pi in it, and hand it a brief.
# Usage: spawn.sh <task|handoff> <brief.md> <slug>
set -euo pipefail
mode=${1:?mode} brief=${2:?brief path} slug=${3:?slug}

die() {
  printf '%s\n' "$1" >&2
  exit 1
}

[ "${HERDR_ENV:-}" = 1 ] || die "not inside a herdr pane"
[ -s "$brief" ] || die "brief missing or empty: $brief"
brief=$(realpath "$brief")
case $mode in
task) focus=--no-focus ;;
handoff) focus=--focus ;;
*) die "mode must be task or handoff" ;;
esac

# Agent names: [a-z][a-z0-9_-]{0,31}, unique among live agents.
name=$(printf 'ho-%s' "$slug" | tr -c 'a-z0-9_-' '-' | cut -c1-26)-$(date +%H%M%S | cut -c3-)

pane=$(herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd "$PWD" --label "$slug" "$focus" |
  jq -r '.result.root_pane.pane_id')
herdr agent start "$name" --kind pi --pane "$pane" >/dev/null
herdr agent prompt "$name" "Read $brief. It is your full brief, written by a previous session that you cannot see. Start the work now." \
  --wait --until working --until blocked --timeout 30000 >/dev/null
status=$(herdr agent get "$name" | jq -r '.result.agent.agent_status')
printf 'agent=%s pane=%s status=%s brief=%s\n' "$name" "$pane" "$status" "$brief"
# Exit 2 so the caller does not treat a stuck session as a finished handoff.
[ "$status" != blocked ] || exit 2
