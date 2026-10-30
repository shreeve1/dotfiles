#!/usr/bin/env bash
# Open a herdr tab, start pi in it, and hand it a brief.
# Usage: spawn.sh <task|handoff> <brief.md> <slug> <model>
set -euo pipefail
mode=${1:?mode} brief=${2:?brief path} slug=${3:?slug} model=${4:?model}

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
# pi starts on an unknown model id and fails only at the first prompt, so check it here.
case $model in
glm-5.3 | gpt-6.1-sol | claude-opus-5-5 | claude-sonnet-5-5) ;;
*) die "model must be glm-5.3, gpt-6.1-sol, claude-opus-5-5 or claude-sonnet-5-5" ;;
esac
jq -e --arg m "$model" 'any(.providers.cliproxy.models[]?; .id == $m)' ~/.pi/agent/models.json >/dev/null 2>&1 ||
  die "cliproxy/$model is not in ~/.pi/agent/models.json on this machine"

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
herdr agent start "$name" --kind pi --pane "$pane" -- --model "cliproxy/$model" >/dev/null
# Since 2026-10-28 a prompt sent right after pi starts is typed but not submitted (agent_prompt_stalled).
# ponytail: one extra Enter submits it; drop this when herdr or pi fixes the startup race.
if ! prompt_out=$(herdr agent prompt "$name" "Read $brief. It is your full brief, written by a previous session that you cannot see. Start the work now." \
  --wait --until working --until blocked --timeout 30000 2>&1); then
  case $prompt_out in *agent_prompt_stalled*) ;; *) die "$prompt_out" ;; esac
  herdr agent send-keys "$name" enter >/dev/null
  herdr agent wait "$name" --until working --until blocked --timeout 30000 >/dev/null
fi
status=$(herdr agent get "$name" | jq -r '.result.agent.agent_status')
where=$(herdr workspace list | jq -r --arg w "$workspace" \
  '.result.workspaces[] | select(.workspace_id == $w) | "\(.number) (\(.label))"')
printf 'agent=%s pane=%s status=%s model=%s workspace=%s tab=%s brief=%s\n' "$name" "$pane" "$status" "$model" "$where" "$slug" "$brief"
# Exit 2 so the caller does not treat a stuck session as a finished handoff.
[ "$status" != blocked ] || exit 2
