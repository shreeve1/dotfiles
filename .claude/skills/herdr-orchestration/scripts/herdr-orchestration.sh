#!/usr/bin/env bash
# herdr-orchestration — live-pane orchestration primitive.
# Opens a tab, splits into worker + reviewer panes running `pi` interactively,
# sends prompts by file (dodges TUI paste issues), polls pane STATUS until THIS
# turn starts (working|blocked — never the stale between-turn `done`) and
# settles (done|idle stable across two reads), parses VERDICT, loops on
# BLOCKING, tears down. Status-gating (NOT revision — empirically inert in this
# herdr/pi build) defeats the stale-`done` race that cut every cycle-2+ turn to
# ~0s.
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
#   HERDR_ORCH_WORKER_MODELS   comma-separated ordered worker models; the first
#                              that PROBES usable is used (quota/auth fallback).
#                              Overrides HERDR_ORCH_WORKER_MODEL. Plural = probe.
#   HERDR_ORCH_REVIEWER_MODELS same, for the reviewer pane.
#   HERDR_ORCH_MODEL_PROBE     1 (default) probe each model before use; 0 = skip.
#   HERDR_ORCH_MODEL_PROBE_TIMEOUT  per-model probe timeout seconds (default 20).
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
worker_models="${HERDR_ORCH_WORKER_MODELS:-}"
reviewer_models="${HERDR_ORCH_REVIEWER_MODELS:-}"
probe_on=${HERDR_ORCH_MODEL_PROBE:-1}
probe_to=${HERDR_ORCH_MODEL_PROBE_TIMEOUT:-20}

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

# Poll pane status (current state). herdr's wait agent-status can return on a
# previously-fired matching event rather than the next one, so we poll current
# state. NB: the pane's `revision` field is NOT a reliable per-turn counter in
# this herdr/pi build (it holds flat across turns in live 2-turn validation),
# so the wait state machine below gates on STATUS only.
poll_status() {
	local pane=$1 raw
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

# wait_started: prove THIS turn's message registered and the model began work —
# poll until status is working|blocked. NEVER accept `done`: between turns pi
# rests in `done`, so a bare `done` here is the stale leftover that, before this
# fix, made wait_working return instantly and cut every cycle-2+ turn to ~0s.
# (revision was tried as an extra guard but is inert in this build — see
# poll_status.) Generous 60s budget: herdr agent send + first inference can take
# 20-30s to surface `working` in a cold pane.
wait_started() {
	local pane=$1
	local settle_ms=60000
	local end=$(($(date +%s000) + settle_ms)) s
	while (($(date +%s000) < end)); do
		s=$(poll_status "$pane")
		if [[ "$s" == "working" || "$s" == "blocked" ]]; then
			log "$pane started (status=$s)"
			return 0
		fi
		sleep 0.3
	done
	log "$pane never started (last status=${s:-?})"
	return 1
}

# wait_settled: prove the turn finished — poll until status is done|idle AND has
# been stable for two consecutive 1s reads. The debounce defeats a transient
# inter-step `done` so a worker is not declared done mid-work (the other half of
# the cut-off race) and avoids racing the working→done transition itself.
wait_settled() {
	local pane=$1
	local end=$(($(date +%s000) + wait_ms)) s prev="" quiet=0
	while (($(date +%s000) < end)); do
		s=$(poll_status "$pane")
		if [[ "$s" == "done" || "$s" == "idle" ]]; then
			if [[ "$s" == "$prev" ]]; then
				quiet=$((quiet + 1))
				if ((quiet >= 2)); then
					log "$pane settled (status=$s stable x$quiet)"
					return 0
				fi
			else
				quiet=1
				prev="$s"
			fi
		else
			quiet=0
			prev=""
		fi
		sleep 1
	done
	log "$pane never settled (last status=${s:-?})"
	return 1
}

# run_turn: send a task and wait for the pane to fully finish THIS turn.
# wait_started skips the stale between-turn `done`; wait_settled confirms a real,
# debounced completion. Together they defeat the cut-off race.
run_turn() {
	local pane=$1 task_file=$2
	send_task "$pane" "$task_file"
	wait_started "$pane" || return 1
	wait_settled "$pane" || return 1
	return 0
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

# read_stuck_reason: pull the worker's IMPL_STUCK: <why> line out of recent
# pane output, if present. Prints the reason (one line) and returns 0; returns
# 1 if no IMPL_STUCK line is seen. Used to honor the sentinel contract (see
# SKILL.md:150-151) — a worker that hits a hard blocker should NOT be sent to
# the reviewer for a no-op review cycle.
read_stuck_reason() {
	local pane=$1
	local recent
	recent=$(read_recent "$pane" 200) || return 1
	local reason
	reason=$(printf '%s\n' "$recent" | grep -oE '^[[:space:]]*IMPL_STUCK:[[:space:]]*.+' | head -1 | sed -E 's/^[[:space:]]*IMPL_STUCK:[[:space:]]*//') || true
	[[ -n "$reason" ]] || return 1
	printf '%s' "$reason"
}

# probe_model: is <model> usable right now? One tiny non-interactive call. pi -p
# exits 0 even on model/quota errors, so we key off OUTPUT not exit code (a bogus
# model prints "Error: Model ... not found" yet exits 0). Returns 0 usable / 1 not.
probe_model() {
	local model="$1" out rc
	set +e
	out=$(timeout "$probe_to" pi -p --no-tools --no-skills --no-extensions --no-session \
		${ext_args[@]+"${ext_args[@]}"} \
		--model "$model" "Reply with exactly: OK" 2>&1)
	rc=$?
	set -e
	if [[ $rc -eq 124 ]]; then return 1; fi # probe timed out -> unusable
	if printf '%s' "$out" | grep -qiE 'error[: ]|not found|not available|quota|rate[ -]?limit|429|insufficient|balance|credit|exceeded|unauthor|forbidden|401|403|invalid.+key|unavailable|overload'; then
		return 1
	fi
	return 0
}

# pick_model: first model in the comma-separated list that probes usable. If
# HERDR_ORCH_MODEL_PROBE != 1, skip the probe and take the first. Dies if none.
pick_model() {
	local list="$1" role="${2:-model}" chosen="" model
	local IFS=','
	for model in $list; do
		model="${model//$'\r'/}"
		model="${model// /}"
		[[ -z "$model" ]] && continue
		if [[ "$probe_on" != "1" ]]; then
			chosen="$model"
			log "$role model (probe off): $model"
			break
		fi
		log "probing $role model: $model"
		if probe_model "$model"; then
			chosen="$model"
			log "$role model OK: $model"
			break
		fi
		log "$role model UNAVAILABLE: $model — trying next"
	done
	[[ -n "$chosen" ]] || die "no usable $role model in list: ${list:-(empty)}"
	printf '%s' "$chosen"
}

# --- Sanity -----------------------------------------------------------------
[[ "${HERDR_ENV:-}" == "1" ]] || die "HERDR_ENV != 1 — must run inside a herdr session"
command -v herdr >/dev/null || die "herdr not on PATH"
command -v pi >/dev/null || die "pi not on PATH"
command -v jq >/dev/null || die "jq not on PATH"
[[ -d "$abs_workdir" ]] || die "workdir does not exist: $abs_workdir"
[[ -f "$abs_worker_task" ]] || die "worker task not found: $abs_worker_task"
[[ -f "$abs_reviewer_task" ]] || die "reviewer task not found: $abs_reviewer_task"

# Explicit extension loads (honored under --no-extensions). Computed here, before
# model resolution, so probe_model can reach extension-provided models (e.g.
# pi-duo/Duo, which is invisible without its extension loaded).
ext_args=()
while IFS= read -r _ex; do
	[[ -n "$_ex" ]] && ext_args+=(--extension "$_ex")
done <<<"${HERDR_ORCH_EXTENSIONS:-}"

# --- Model resolution (probe + fallback) ------------------------------------
# A comma-separated *_MODELS list enables probing: try each in order, use the
# first that's usable, so a quota/auth failure on the primary falls back to the
# next. The singular *_MODEL default (no probe) is unchanged for backward compat.
if [[ -n "$worker_models" ]]; then
	worker_model=$(pick_model "$worker_models" worker)
fi
if [[ -n "$reviewer_models" ]]; then
	reviewer_model=$(pick_model "$reviewer_models" reviewer)
fi

log "workdir=$abs_workdir worker_model=$worker_model reviewer_model=$reviewer_model"

# --- Common pi args ---------------------------------------------------------
# -a: no project-trust prompt stalls the panes.
# --no-context-files (-nc): do NOT load the project CLAUDE.md/AGENTS.md into
#                task panes. Each pane gets a self-contained task file; the
#                repo's operator-grade instructions (e.g. an aggressive wiki-
#                maintenance obligation) must not hijack a worker/reviewer turn.
# --session-dir: sessions land in workdir, NOT ~/.pi/agent/sessions (avoids
#                polluting synced dotfiles session history).
# --no-skills / --no-extensions: child panes are task-focused — no discovery.
#                A caller that needs a specific skill (e.g. the worker running
#                /implement) passes it via HERDR_ORCH_WORKER_SKILLS, which adds
#                an explicit --skill <path> below; discovery stays off so ONLY
#                that skill loads (verified: --no-skills honors explicit --skill).
#                Likewise HERDR_ORCH_EXTENSIONS adds explicit --extension <path>s
#                (still honored under --no-extensions) — use this to load an
#                extension-provided model such as pi-duo/Duo.
# --thinking: override the global default (high) which would be overkill.
# (ext_args from HERDR_ORCH_EXTENSIONS is computed above, before model resolution.)
common_pi_args=(
	-a
	--no-context-files
	--session-dir "$session_dir"
	--no-session false
	--no-skills
	--no-extensions
	--thinking "$thinking"
	${ext_args[@]+"${ext_args[@]}"}
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

	run_turn "$worker_pane" "$abs_worker_task" || die "worker turn failed (cycle $cycle)"

	# Sentinel contract: a worker that emits `IMPL_STUCK: <why>` is signaling a
	# hard blocker (no implementation, missing capability, etc.). Honor it —
	# do not send a blocked worker to the reviewer for a wasted cycle. The
	# reason is emitted as `STUCK_REASON:` on stdout and the verdict is STUCK,
	# which wave.sh / herdr-issue-frontier can disambiguate from BLOCKING.
	if stuck_reason=$(read_stuck_reason "$worker_pane"); then
		log "worker STUCK (cycle $cycle): $stuck_reason"
		verdict="STUCK"
		echo "STUCK_REASON: $stuck_reason"
		break
	fi

	log "worker done (cycle $cycle); sending to reviewer"

	run_turn "$reviewer_pane" "$abs_reviewer_task" || die "reviewer turn failed (cycle $cycle)"

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
# When KEEP is unset: disarm the EXIT trap and run the explicit teardown so the
# log line is emitted. When KEEP is set: ONLY disarm the EXIT trap — cleanup()
# must NOT run, or the debug-pane inspection the user asked for is lost on exit.
if [[ -z "${HERDR_ORCH_KEEP:-${PI_V2_KEEP:-}}" ]]; then
	log "tearing down"
	trap - EXIT INT TERM
	cleanup
else
	trap - EXIT INT TERM
fi

# --- Final report -----------------------------------------------------------
echo "${verdict:-VERDICT: NONE}"
echo "CYCLES: ${cycle:-0}"
echo "LOG: $log"
[[ -n "$worker_pane" ]] && echo "WORKER_PANE: $worker_pane"
[[ -n "$reviewer_pane" ]] && echo "REVIEWER_PANE: $reviewer_pane"
[[ -n "$tab_id" ]] && echo "TAB: $tab_id"
