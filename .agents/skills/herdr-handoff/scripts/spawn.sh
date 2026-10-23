#!/usr/bin/env bash
# Open a herdr tab, start pi in it, and hand it a brief.
# Usage: spawn.sh <task|handoff> <brief.md> <slug>
set -euo pipefail
mode=${1:?mode} brief=${2:?brief path} slug=${3:?slug}

die() {
  printf '%s\n' "$1" >&2
  exit 1
}

[ -s "$brief" ] || die "brief missing or empty: $brief"
brief=$(realpath "$brief")
case $mode in
task) focus=--no-focus ;;
handoff) focus=--focus ;;
*) die "mode must be task or handoff" ;;
esac

# Outside a herdr pane (e.g. Codex) a reachable herdr server still works: open the tab in the
# workspace that has a pane in this directory, else the focused one. It cannot take focus there.
workspace=${HERDR_WORKSPACE_ID:-}
if [ "${HERDR_ENV:-}" != 1 ]; then
  herdr workspace list >/dev/null 2>&1 || die "not inside herdr and no herdr server answers"
  [ "$mode" = task ] || printf 'outside herdr: opening in the background, like task\n' >&2
  focus=--no-focus
  workspace=$(herdr pane list | jq -r --arg d "$PWD" \
    '[.result.panes[] | select(.cwd == $d or (.cwd | startswith($d + "/")))][0].workspace_id // empty')
  [ -n "$workspace" ] || workspace=$(herdr workspace list |
    jq -r '[.result.workspaces[] | select(.focused)][0].workspace_id // .result.workspaces[0].workspace_id // empty')
  [ -n "$workspace" ] || die "no herdr workspace to open the tab in"
fi

# Agent names: [a-z][a-z0-9_-]{0,31}, unique among live agents.
name=$(printf 'ho-%s' "$slug" | tr -c 'a-z0-9_-' '-' | cut -c1-26)-$(date +%H%M%S | cut -c3-)

pane=$(herdr tab create --workspace "$workspace" --cwd "$PWD" --label "$slug" "$focus" |
  jq -r '.result.root_pane.pane_id')
herdr agent start "$name" --kind pi --pane "$pane" >/dev/null
herdr agent prompt "$name" "Read $brief. It is your full brief, written by a previous session that you cannot see. Start the work now." \
  --wait --until working --until blocked --timeout 30000 >/dev/null
status=$(herdr agent get "$name" | jq -r '.result.agent.agent_status')
where=$(herdr workspace list | jq -r --arg w "$workspace" \
  '.result.workspaces[] | select(.workspace_id == $w) | "\(.number) (\(.label))"')
printf 'agent=%s pane=%s status=%s workspace=%s tab=%s brief=%s\n' "$name" "$pane" "$status" "$where" "$slug" "$brief"
# Exit 2 so the caller does not treat a stuck session as a finished handoff.
[ "$status" != blocked ] || exit 2
