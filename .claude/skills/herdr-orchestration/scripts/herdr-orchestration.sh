#!/usr/bin/env bash
# herdr-orchestration — live-pane orchestration primitive.
# Opens a tab, splits into worker + reviewer panes running `pi` interactively,
# sends prompts by file (dodges TUI paste issues), polls pane status until
# idle/working/done transitions complete, parses VERDICT, loops on BLOCKING,
# tears down. No sleep loops on agent-list or pane-read output; only current
# pane status is polled.
#
# Usage:
#   herdr-orchestration.sh <workdir> <worker-task-file> <reviewer-task-file>
#
#   workdir             directory both panes run in (its cwd)
#   worker-task-file    self-contained worker prompt (read it; IMPL_DONE sentinel)
#   reviewer-task-file  self-contained reviewer prompt (emit VERDICT: LGTM|BLOCKING)
#
# Env (HERDR_ORCH_* are canonical; PI_V2_* still work as a compat fallback):
#   HERDR_ORCH_WORKER_MODEL    default minimax/MiniMax-M3
#   HERDR_ORCH_REVIEWER_MODEL  default deepseek/deepseek-v4-flash
#   HERDR_ORCH_THINKING        default low
#   HERDR_ORCH_WAIT_MS         per-pane cycle wait (default 900000 = 15 min)
#   HERDR_ORCH_MAX_CYCLES      default 3
#   HERDR_ORCH_KEEP            if set, skip teardown (debug)
#   HERDR_ORCH_WORKER_SKILLS   newline-separated skill paths to load into the
#                              worker pane (e.g. ~/.claude/skills/implement).
#                              --no-skills stays on, so ONLY these load.
#   HERDR_ORCH_REVIEWER_SKILLS same, for the reviewer pane. Default: none.
#
# Requires: herdr 0.7.4+, HERDR_ENV=1 (running inside a herdr session),
# pi 0.80.6+, bash 4+, jq. Tested shapes only — not a general library.
#
# ponytail: not idempotent (each run opens new panes). Caller responsible for
# cleanup if --keep is left set across runs.
set -euo pipefail

# --- Config -----------------------------------------------------------------
workdir=${1:?workdir}
worker_task=${2:?worker-task-file}
reviewer_task=${3:?reviewer-task-file}

worker_model=${HERDR_ORCH_WORKER_MODEL:-${PI_V2_WORKER_MODEL:-minimax/MiniMax-M3}}
reviewer_model=${HERDR_ORCH_REVIEWER_MODEL:-${PI_V2_REVIEWER_MODEL:-deepseek/deepseek-v4-flash}}
thinking=${HERDR_ORCH_THINKING:-${PI_V2_THINKING:-low}}
wait_ms=${HERDR_ORCH_WAIT_MS:-${PI_V2_WAIT_MS:-900000}}
max_cycles=${HERDR_ORCH_MAX_CYCLES:-${PI_V2_MAX_CYCLES:-3}}

abs_workdir=$(cd "$workdir" && pwd)
# Agent names are workspace-global in herdr; hardcoded "worker"/"reviewer"
# collide when multiple herdr-orchestration instances run in parallel (the
# herdr-issue-frontier wave model) -> agent_name_taken. Derive a unique suffix
# from the workdir basename; override via HERDR_ORCH_NAME_SUFFIX if needed.
_suf=${HERDR_ORCH_NAME_SUFFIX:-$(basename "$abs_workdir")}
_suf=$(printf '%s' "$_suf" | tr -c 'A-Za-z0-9' '-' | tr -s '-' | sed 's/^-//; s/-$//')
worker_name="worker-$_suf"
reviewer_name="reviewer-$_suf"
abs_worker_task=$(cd "$(dirname "$worker_task")" && pwd)/$(basename "$worker_task")
abs_reviewer_task=$(cd "$(dirname "$reviewer_task")" && pwd)/$(basename "$reviewer_task")
session_dir="$abs_workdir/.herdr-orch-sessions"
log="$abs_workdir/.pi-orch-logs/$(date +%Y%m%d-%H%M%S)-herdr-orch.log"

mkdir -p "$abs_workdir/.pi-orch-logs" "$session_dir"

# --- Tool isolation ---------------------------------------------------------
# Recreate the subagents.agentOverrides discipline for top-level pi invocations:
# worker = read/write/edit/bash, reviewer = read-only. Deny delegation tools in
# both so the panes can't escape the orchestrator's control.
WORKER_DENY="subagent,Agent,get_subagent_result,steer_subagent,intercom,subagent_supervisor,subagent_wait"
REVIEWER_DENY="write,edit,subagent,Agent,get_subagent_result,steer_subagent,intercom,subagent_supervisor,subagent_wait,web_search,web_fetch"

# --- Functions --------------------------------------------------------------
log() {
	mkdir -p "$(dirname "$log")" 2>/dev/null || true
	printf '[herdr-orch %s] %s\n' "$(date +%H:%M:%S)" "$*" | tee -a "$log" >&2 2>/dev/null || true
}

tab_id=""
worker_pane=""
reviewer_pane=""
cleanup() {
	# Disable the EXIT trap while running so die()'s cleanup + EXIT's cleanup
	# don't double-fire.
	trap - EXIT INT TERM
	for pane in "$worker_pane" "$reviewer_pane"; do
		[[ -z "$pane" ]] && continue
		herdr pane send-text "$pane" "/exit" >/dev/null 2>&1 || true
		sleep 0.5
		herdr pane send-keys "$pane" Enter >/dev/null 2>&1 || true
		sleep 1
		herdr pane close "$pane" >/dev/null 2>&1 || true
	done
	[[ -n "${tab_id:-}" ]] && herdr tab close "$tab_id" >/dev/null 2>&1 || true
	log "cleanup done"
}
trap cleanup EXIT INT TERM
die() {
	log "FATAL: $*"
	cleanup
	exit 1
}

# Poll pane status. herdr wait agent-status can return on a previously-fired
# matching event rather than the next one, so we poll the current state.
poll_status() {
	local pane=$1
	local raw
	if raw=$(herdr pane get "$pane" 2>/dev/null); then
		printf '%s' "$raw" | jq -r '.result.pane.agent_status // "?"' 2>/dev/null || echo "?"
	else
		echo "?"
	fi
}

# wait_ready: poll pane status until it's idle. Caller must invoke this after
# create (pi boots) and after completion (before next send).
wait_ready() {
	local pane=$1
	local timeout_ms=${2:-120000}
	log "wait_ready: $pane (timeout ${timeout_ms}ms)"
	local end=$(($(date +%s000) + timeout_ms))
	while (($(date +%s000) < end)); do
		local s
		s=$(poll_status "$pane")
		if [[ "$s" == "idle" ]]; then
			log "$pane ready (idle)"
			sleep 0.5 # tiny settle so prompt is fully painted
			return 0
		fi
		sleep 0.5
	done
	log "$pane never reached idle within ${timeout_ms}ms (last status=$s)"
	return 1
}

# wait_working: poll pane status until it leaves idle. Proves Enter registered
# and pi picked up the message. Short overall budget so a broken pane fails
# fast rather than hanging the loop.
wait_working() {
	local pane=$1
	local settle_ms=20000
	log "wait_working: $pane (timeout ${settle_ms}ms)"
	local end=$(($(date +%s000) + settle_ms))
	while (($(date +%s000) < end)); do
		local s
		s=$(poll_status "$pane")
		if [[ "$s" == "working" || "$s" == "blocked" || "$s" == "done" ]]; then
			log "$pane status=$s"
			return 0
		fi
		sleep 0.5
	done
	log "$pane never left idle after send+Enter (last status=$s)"
	return 1
}

# wait_idle: poll pane status until idle OR done. herdr fires 'done' (not
# 'idle') when pi finishes a turn — both are completion signals.
wait_idle() {
	local pane=$1
	local end=$(($(date +%s000) + wait_ms))
	while (($(date +%s000) < end)); do
		local s
		s=$(poll_status "$pane")
		if [[ "$s" == "idle" || "$s" == "done" ]]; then
			log "$pane status=$s (completed)"
			return 0
		fi
		sleep 1
	done
	log "$pane did not finish within ${wait_ms}ms (last status=$s)"
	return 1
}

# send_task: file-based prompt to dodge TUI paste and quote-escaping. The 1s
# settle between send and Enter is REQUIRED: herdr agent send writes to pi's
# input box asynchronously, and Enter pressed before the text settles gets
# dropped (or submits a half-typed message). 1s is enough on pi 0.80.6 for
# messages up to ~250 chars.
send_task() {
	local pane=$1 task_file=$2
	herdr agent send "$pane" "Read $(basename "$task_file") in your cwd and follow it exactly. Begin." \
		>>"$log" 2>&1
	sleep 1
	herdr pane send-keys "$pane" Enter >>"$log" 2>&1
}

read_recent() {
	local pane=$1 lines=${2:-400}
	herdr agent read "$pane" --source recent --lines "$lines" 2>/dev/null
}

# --- Sanity -----------------------------------------------------------------
[[ "${HERDR_ENV:-}" == "1" ]] || die "HERDR_ENV != 1 — must run inside a herdr session"
command -v herdr >/dev/null || die "herdr not on PATH"
command -v pi >/dev/null || die "pi not on PATH"
command -v jq >/dev/null || die "jq not on PATH"
[[ -d "$abs_workdir" ]] || die "workdir does not exist: $abs_workdir"
[[ -f "$abs_worker_task" ]] || die "worker task not found: $abs_worker_task"
[[ -f "$abs_reviewer_task" ]] || die "reviewer task not found: $abs_reviewer_task"

log "workdir=$abs_workdir worker_model=$worker_model reviewer_model=$reviewer_model"

# --- Common pi args ---------------------------------------------------------
# -a: no project-trust prompt stalls the panes.
# --session-dir: sessions land in workdir, NOT ~/.pi/agent/sessions (avoids
#                polluting synced dotfiles session history).
# --no-skills / --no-extensions: child panes are task-focused — no discovery.
#                A caller that needs a specific skill (e.g. the worker running
#                /implement) passes it via HERDR_ORCH_WORKER_SKILLS, which adds
#                an explicit --skill <path> below; discovery stays off so ONLY
#                that skill loads (verified: --no-skills honors explicit --skill).
# --thinking: override the global default (high) which would be overkill.
common_pi_args=(
	-a
	--session-dir "$session_dir"
	--no-session false
	--no-skills
	--no-extensions
	--thinking "$thinking"
)

# Per-pane skill allowlist (see HERDR_ORCH_*_SKILLS above). Empty by default.
# ${arr[@]+...} expands to nothing when empty, even under set -u (bash 4 safe).
worker_skill_args=()
while IFS= read -r _sk; do
	[[ -n "$_sk" ]] && worker_skill_args+=(--skill "$_sk")
done <<<"${HERDR_ORCH_WORKER_SKILLS:-}"
reviewer_skill_args=()
while IFS= read -r _sk; do
	[[ -n "$_sk" ]] && reviewer_skill_args+=(--skill "$_sk")
done <<<"${HERDR_ORCH_REVIEWER_SKILLS:-}"

# --- Open tab + panes -------------------------------------------------------
log "creating tab"
tab_json=$(herdr tab create --cwd "$abs_workdir" --no-focus)
tab_id=$(printf '%s' "$tab_json" | jq -r '.result.tab.tab_id // empty')
[[ -n "$tab_id" ]] || die "could not parse tab id from: $tab_json"
log "tab=$tab_id"

log "creating worker pane (split right)"
worker_json=$(herdr agent start "$worker_name" --tab "$tab_id" --split right \
	--cwd "$abs_workdir" --no-focus -- \
	pi "${common_pi_args[@]}" \
	--model "$worker_model" \
	--tools "read,write,edit,bash,grep,find,ls" \
	--exclude-tools "$WORKER_DENY" \
	${worker_skill_args[@]+"${worker_skill_args[@]}"})
worker_pane=$(printf '%s' "$worker_json" | jq -r '.result.agent.pane_id // empty')
[[ -n "$worker_pane" ]] || die "could not parse worker pane from: $worker_json"
log "worker_pane=$worker_pane"

log "creating reviewer pane (split down)"
reviewer_json=$(herdr agent start "$reviewer_name" --tab "$tab_id" --split down \
	--cwd "$abs_workdir" --no-focus -- \
	pi "${common_pi_args[@]}" \
	--model "$reviewer_model" \
	--tools "read,bash,grep,find,ls" \
	--exclude-tools "$REVIEWER_DENY" \
	${reviewer_skill_args[@]+"${reviewer_skill_args[@]}"})
reviewer_pane=$(printf '%s' "$reviewer_json" | jq -r '.result.agent.pane_id // empty')
[[ -n "$reviewer_pane" ]] || die "could not parse reviewer pane from: $reviewer_json"
log "reviewer_pane=$reviewer_pane"

# Settle both panes to idle after creation.
wait_ready "$worker_pane" 180000 || die "worker pane never became ready"
wait_ready "$reviewer_pane" 180000 || die "reviewer pane never became ready"

# --- Cycle loop -------------------------------------------------------------
verdict=""
cycle=0
for cycle in $(seq 1 "$max_cycles"); do
	log "=== cycle $cycle ==="

	send_task "$worker_pane" "$abs_worker_task"
	wait_working "$worker_pane" || die "worker never started (Enter dropped? cycle $cycle)"
	wait_idle "$worker_pane" || die "worker never finished (cycle $cycle)"
	log "worker done (cycle $cycle); sending to reviewer"

	send_task "$reviewer_pane" "$abs_reviewer_task"
	wait_working "$reviewer_pane" || die "reviewer never started (cycle $cycle)"
	wait_idle "$reviewer_pane" || die "reviewer never finished (cycle $cycle)"

	reviewer_out=$(read_recent "$reviewer_pane" 600)
	printf '%s\n' "$reviewer_out" >"$abs_workdir/.pi-orch-logs/${cycle}-reviewer-recent.txt"

	verdict=$(printf '%s\n' "$reviewer_out" | grep -oE 'VERDICT: *(LGTM|BLOCKING)' | tail -1 || true)
	if [[ "$verdict" == *"LGTM"* ]]; then
		log "cycle $cycle: LGTM"
		break
	fi
	log "cycle $cycle: BLOCKING (or missing verdict) — drafting fix prompt and looping"
	fix_prompt="$abs_workdir/.pi-orch-logs/${cycle}-fix-prompt.md"
	{
		echo "Cycle $cycle reviewer said BLOCKING. Findings:"
		printf '%s\n' "$reviewer_out" | sed -n '/VERDICT:/,/^$/p' | head -40
		echo
		echo "Apply the minimum fix and end with IMPL_DONE."
	} >"$fix_prompt"
	cp "$fix_prompt" "$abs_worker_task"
done

# --- Teardown ---------------------------------------------------------------
if [[ -z "${HERDR_ORCH_KEEP:-${PI_V2_KEEP:-}}" ]]; then
	log "tearing down"
	trap - EXIT INT TERM
	cleanup
fi

# --- Final report -----------------------------------------------------------
echo "${verdict:-VERDICT: NONE}"
echo "CYCLES: ${cycle:-0}"
echo "LOG: $log"
[[ -n "$worker_pane" ]] && echo "WORKER_PANE: $worker_pane"
[[ -n "$reviewer_pane" ]] && echo "REVIEWER_PANE: $reviewer_pane"
[[ -n "$tab_id" ]] && echo "TAB: $tab_id"
