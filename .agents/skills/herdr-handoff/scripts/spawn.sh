#!/usr/bin/env bash
# Start pi on a brief in herdr. A task in a git repo gets its own worktree and workspace
# (herdr worktree create, one feature = one worktree = one workspace) and pi starts in the
# worktree's root pane. A handoff, or a task outside git, gets a tab instead.
# Usage: spawn.sh <task|handoff> <brief.md> <slug> <model>
# Env: HERDR_HANDOFF_BOT names the caller (default: the repo's directory name); workspace, tab
# and agent are all labelled <bot>-<slug>, cut to herdr's 32-character agent-name limit.
# HERDR_HANDOFF_WORKSPACE places a handoff or non-git tab; it is refused for a git task.
set -euo pipefail
mode=${1:?mode} brief=${2:?brief path} slug=${3:?slug} model=${4:?model}

ctx=''
die() {
  printf '%s\n' "$1" >&2
  [ -z "$ctx" ] || printf '%s\n' "$ctx" >&2
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

# Naming: <bot>-<slug> labels the workspace, tab and agent. Agent names are [a-z][a-z0-9_-]{0,31}.
case $slug in
'' | *[!a-z0-9_-]* | [!a-z0-9]*) die "slug must be lowercase letters, digits, - or _, starting with a letter or digit: $slug" ;;
esac
repo=
if git rev-parse --git-dir >/dev/null 2>&1; then
  common=$(git rev-parse --path-format=absolute --git-common-dir)
  case $common in
  */.git) repo=${common%/.git} ;;
  *) die "unsupported git layout (no <repo>/.git): $common" ;;
  esac
fi
# The bot name is never cut: tab-watch finds a bot's workspaces by their "<bot>-" label prefix.
bot=$(printf '%s' "${HERDR_HANDOFF_BOT:-$(basename "${repo:-$PWD}")}" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9_-' '-' | sed 's/^[^a-z]*//')
bot=${bot:-task}
[ "${#bot}" -le 24 ] || die "bot name too long for a 32-character label: $bot"
label=$(printf '%s-%s' "$bot" "$slug" | cut -c1-32 | sed 's/[-_]*$//')
name=$label

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

# One agent per label: a live one means the item already has a tab, so reuse it.
if herdr agent get "$name" >/dev/null 2>&1; then
  die "agent $name already exists; send the follow-up there instead of spawning"
fi

wt='' branch=''
if [ "$mode" = task ] && [ -n "$repo" ]; then
  # The worktree gets its own workspace, so a caller-supplied one would be left empty.
  [ -z "${HERDR_HANDOFF_WORKSPACE:-}" ] ||
    die "HERDR_HANDOFF_WORKSPACE does not apply to a git task: its worktree opens its own workspace; unset it"
  # --cwd must be the main checkout: herdr refuses a linked worktree as the source.
  # --base keeps the task on the caller's commit, also when run from a linked worktree;
  # uncommitted changes do not carry over.
  base=$(git rev-parse --verify HEAD) || die "no commit to start a worktree from"
  branch=task/$slug
  created=$(herdr worktree create --label "$label" --branch "$branch" --cwd "$repo" --base "$base" --no-focus 2>&1) ||
    die "herdr worktree create failed: $created"
  pane=$(printf '%s' "$created" | jq -r '.result.root_pane.pane_id // empty')
  tab=$(printf '%s' "$created" | jq -r '.result.root_pane.tab_id // empty')
  workspace=$(printf '%s' "$created" | jq -r '.result.workspace.workspace_id // empty')
  wt=$(printf '%s' "$created" | jq -r '.result.worktree.path // empty')
  [ -n "$pane" ] && [ -n "$tab" ] && [ -n "$workspace" ] && [ -n "$wt" ] ||
    die "herdr worktree create returned an unexpected answer: $created"
  ctx="left open for inspection: workspace=$workspace pane=$pane worktree=$wt branch=$branch"
  # herdr labels the worktree's tab with its number; match the workspace and agent.
  herdr tab rename "$tab" "$label" >/dev/null || printf 'could not rename tab %s\n' "$tab" >&2
elif [ -n "$workspace" ]; then
  created=$(herdr tab create --workspace "$workspace" --cwd "$PWD" --label "$label" "$focus")
  pane=$(printf '%s' "$created" | jq -r '.result.root_pane.pane_id')
  tab=$(printf '%s' "$created" | jq -r '.result.tab.tab_id // .result.root_pane.tab_id')
  ctx="left open for inspection: workspace=$workspace pane=$pane"
else
  # Its only tab is this task's, so closing that tab later also closes the workspace.
  created=$(herdr workspace create --cwd "$PWD" --label "$label" --no-focus)
  pane=$(printf '%s' "$created" | jq -r '.result.root_pane.pane_id')
  tab=$(printf '%s' "$created" | jq -r '.result.root_pane.tab_id // empty')
  workspace=$(printf '%s' "$created" | jq -r '.result.root_pane.workspace_id')
  ctx="left open for inspection: workspace=$workspace pane=$pane"
fi
# pi starts in the root pane itself, so there is no leftover empty shell tab.
herdr agent start "$name" --kind pi --pane "$pane" -- --model "cliproxy/$model" >/dev/null ||
  die "pi did not start in pane $pane; inspect before retrying"
prompt="Read $brief. It is your full brief, written by a previous session that you cannot see. Start the work now."
if [ -n "$wt" ]; then
  prompt="$prompt You are already in a dedicated git worktree at $wt on branch $branch, created for this task. Do not create another worktree or branch."
fi
# Since 2026-10-28 a prompt sent right after pi starts is typed but not submitted (agent_prompt_stalled).
# ponytail: one extra Enter submits it; drop this when herdr or pi fixes the startup race.
if ! prompt_out=$(herdr agent prompt "$name" "$prompt" \
  --wait --until working --until blocked --timeout 30000 2>&1); then
  case $prompt_out in *agent_prompt_stalled*) ;; *) die "$prompt_out" ;; esac
  herdr agent send-keys "$name" enter >/dev/null
  herdr agent wait "$name" --until working --until blocked --timeout 30000 >/dev/null
fi
status=$(herdr agent get "$name" | jq -r '.result.agent.agent_status')
where=$(herdr workspace list | jq -r --arg w "$workspace" \
  '.result.workspaces[] | select(.workspace_id == $w) | "\(.number) (\(.label))"')
printf 'agent=%s pane=%s status=%s model=%s workspace=%s tab=%s brief=%s workspace_id=%s tab_id=%s worktree=%s branch=%s\n' \
  "$name" "$pane" "$status" "$model" "$where" "$label" "$brief" "$workspace" "${tab:-}" "${wt:--}" "${branch:--}"
# Exit 2 so the caller does not treat a stuck session as a finished handoff.
[ "$status" != blocked ] || exit 2
