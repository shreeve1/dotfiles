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
model_file="$HOME/.pi/agent/models.json"
[ -e "$model_file" ] || die "model file missing: $model_file"
model_json=$(cat "$model_file" 2>/dev/null) || die "model file unreadable: $model_file"
printf '%s' "$model_json" | jq -s -e 'length == 1' >/dev/null 2>&1 ||
  die "model file has malformed JSON: $model_file"
printf '%s' "$model_json" | jq -e '
  .providers.cliproxy.models | type == "array" and all(.[]; type == "object" and (.id | type == "string"))
' >/dev/null 2>&1 || die "model file has invalid cliproxy model list: $model_file"
printf '%s' "$model_json" | jq -e --arg m "$model" 'any(.providers.cliproxy.models[]; .id == $m)' >/dev/null 2>&1 ||
  die "cliproxy/$model is not in $model_file on this machine"
unset model_json

# Outside a herdr pane (e.g. Codex, a Rakazo bot over ssh) a reachable herdr server still works.
# Tab placement: HERDR_HANDOFF_WORKSPACE if set, else the workspace with a pane in this directory,
# else a new background workspace for this task. Never the focused one: that is James's.
workspace=${HERDR_WORKSPACE_ID:-}
if [ "${HERDR_ENV:-}" != 1 ]; then
  herdr workspace list >/dev/null 2>&1 || die "not inside herdr and no herdr server answers"
  [ "$mode" = task ] || printf 'outside herdr: opening in the background, like task\n' >&2
  focus=--no-focus
  workspace=${HERDR_HANDOFF_WORKSPACE:-}
  if [ -n "$workspace" ]; then
    herdr workspace list | jq -e --arg w "$workspace" 'any(.result.workspaces[]; .workspace_id == $w)' >/dev/null ||
      die "HERDR_HANDOFF_WORKSPACE $workspace not found"
  else
    workspace=$(herdr pane list | jq -r --arg d "$PWD" \
      '[.result.panes[] | select(.cwd == $d or (.cwd | startswith($d + "/")))][0].workspace_id // empty')
  fi
fi

# Agent names: [a-z][a-z0-9_-]{0,31}, unique among live agents.
name=$(printf 'ho-%s' "$slug" | tr -c 'a-z0-9_-' '-' | cut -c1-26)-$(date +%H%M%S | cut -c3-)

if [ -n "$workspace" ]; then
  pane=$(herdr tab create --workspace "$workspace" --cwd "$PWD" --label "$slug" "$focus" |
    jq -r '.result.root_pane.pane_id')
else
  # Its only tab is this task's, so closing that tab later also closes the workspace.
  created=$(herdr workspace create --cwd "$PWD" --label "$slug" --no-focus)
  pane=$(printf '%s' "$created" | jq -r '.result.root_pane.pane_id')
  workspace=$(printf '%s' "$created" | jq -r '.result.root_pane.workspace_id')
fi
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
