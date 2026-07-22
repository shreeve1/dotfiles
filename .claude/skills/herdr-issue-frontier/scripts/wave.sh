#!/usr/bin/env bash
# wave.sh — launch ONE frontier wave for the herdr-issue-frontier skill.
#
# Reads a manifest of issues, runs herdr-orchestration.sh for each IN PARALLEL
# inside this single shell, waits for ALL of them, and writes one result file
# per issue. Stateless across invocations: every job is launched and reaped
# HERE (never in a later shell), so the fresh-shell-per-bash-call model can't
# orphan anything.
#
# Usage:
#   wave.sh <manifest> <state-dir>
#
#   manifest   TSV, one row per issue:
#              <issue>\t<worktree>\t<worker_task>\t<reviewer_task>
#              blank lines and lines beginning with # are skipped.
#   state-dir  where <issue>.result files are written (created if missing).
#
# Env:
#   HERDR_ORCH_SCRIPT  path to herdr-orchestration.sh
#                     (default <skills_dir>/herdr-orchestration/scripts/herdr-orchestration.sh;
#                      V2_SCRIPT still works as a compat fallback)
#   HERDR_ORCH_*       passed through to herdr-orchestration.sh (models,
#                      thinking, wait, cycles, *_SKILLS). PI_V2_* also still work.
#   HERDR_ENV          must be 1 (inherited from the orchestrator's herdr session).
#
# ponytail: deliberately synchronous and per-wave stateless. A BLOCKING verdict
# is a normal exit 0 here — the caller keys off the VERDICT: line in each result
# file, not this script's exit status. Exit status is non-zero only if a
# herdr-orchestration.sh invocation itself crashed (script error, not a review fail).
set -euo pipefail

manifest=${1:?manifest required}
state_dir=${2:?state-dir required}
# Harness-relative default: works identically from .claude/skills and .pi/agent/skills.
# HERDR_ORCH_SCRIPT is canonical; V2_SCRIPT is a deprecated fallback.
skills_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
v2=${HERDR_ORCH_SCRIPT:-${V2_SCRIPT:-"$skills_dir/herdr-orchestration/scripts/herdr-orchestration.sh"}}

[[ "${HERDR_ENV:-}" == "1" ]] || {
	echo "FATAL: HERDR_ENV != 1 (run inside a herdr session)" >&2
	exit 2
}
[[ -f "$v2" ]] || {
	echo "FATAL: herdr-orchestration.sh not found: $v2 (set HERDR_ORCH_SCRIPT)" >&2
	exit 2
}
[[ -f "$manifest" ]] || {
	echo "FATAL: manifest not found: $manifest" >&2
	exit 2
}
mkdir -p "$state_dir"

# Launch every manifest row as a backgrounded herdr-orchestration.sh, remembering
# which pid maps to which issue.
declare -A pid_issue=()
pids=()
while IFS=$'\t' read -r issue worktree worker_task reviewer_task || [[ -n "${issue:-}" ]]; do
	[[ -z "${issue:-}" || "$issue" == \#* ]] && continue
	if [[ -z "${worktree:-}" || -z "${worker_task:-}" || -z "${reviewer_task:-}" ]]; then
		echo "SKIP malformed manifest line: $issue" >&2
		continue
	fi
	(
		bash "$v2" "$worktree" "$worker_task" "$reviewer_task" \
			>"$state_dir/$issue.result" 2>&1
	) &
	pids+=("$!")
	pid_issue[$!]="$issue"
done <"$manifest"

# Nothing to do this wave.
if [[ ${#pids[@]} -eq 0 ]]; then
	echo "WAVE: empty (no eligible issues)"
	exit 0
fi

echo "WAVE: launched ${#pids[@]} issue(s); waiting..."

# Reap each pid explicitly (portable; no `wait -n -p`). Report verdict per issue.
fail=0
for pid in "${pids[@]}"; do
	issue=${pid_issue[$pid]}
	if wait "$pid"; then
		status=ok
	else
		rc=$?
		status="CRASH(rc=$rc)"
		fail=1
	fi
	verdict=$(grep -oE 'VERDICT: *(LGTM|BLOCKING|NONE)' "$state_dir/$issue.result" 2>/dev/null | tail -1 || true)
	printf 'ISSUE %s\t%s\t%s\n' "$issue" "$status" "${verdict:-(no verdict)}"
	printf '  result: %s/%s.result\n' "$state_dir" "$issue"
done

exit "$fail"
