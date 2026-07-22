#!/usr/bin/env bash
# orch-wait-test — regression test for the status-gated wait state machine in
# herdr-orchestration.sh.
#
# It runs the REAL script against a fake `herdr` that replays a scripted
# "<status>" scene per pane (revision is ignored — empirically inert in this
# herdr/pi build). The worker scene deliberately leads with a STALE `done`
# before `working` — the exact shape that, before the fix, made wait_working
# return instantly and cut every cycle-2+ turn to ~0s. The assertions prove
# wait_started now returns ONLY on working|blocked (never done) and wait_settled
# requires a stable done.
#
# Run: bash orch-wait-test.sh
# Exits 0 on pass, 1 on fail. Self-contained; cleans up its temp dir.
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")/.." && pwd)/scripts/herdr-orchestration.sh"
[[ -f "$SCRIPT" ]] || {
	echo "FAIL: script not found at $SCRIPT" >&2
	exit 1
}

# Syntax gate first.
bash -n "$SCRIPT" || {
	echo "FAIL: bash -n on herdr-orchestration.sh" >&2
	exit 1
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
SCENE="$TMP/scene"
mkdir -p "$SCENE"
WORKDIR="$TMP/wt"
mkdir -p "$WORKDIR"
printf 'worker task body\n' >"$WORKDIR/.herdr-worker-task.md"
printf 'reviewer task body\n' >"$WORKDIR/.herdr-reviewer-task.md"
BIN="$TMP/bin"
mkdir -p "$BIN"

# --- Worker pane scene ------------------------------------------------------
# wait_ready    -> idle
# wait_started  -> idle (skip), stale done (MUST skip), working (start)
# wait_settled  -> working (reset), done x2 stable (settle)
cat >"$SCENE/wp.scene" <<'EOF'
5 idle
5 idle
5 done
6 working
7 working
7 done
7 done
EOF

# --- Reviewer pane scene ----------------------------------------------------
cat >"$SCENE/rp.scene" <<'EOF'
3 idle
3 idle
4 working
4 done
4 done
EOF

# --- Fake herdr: serves scenes + benign JSON for everything else ------------
cat >"$BIN/herdr" <<'EOF'
#!/usr/bin/env bash
set +e
SCENE_DIR="${ORCH_TEST_SCENE:?}"
case "${1:-}" in
	tab)
		case "${2:-}" in
			create) echo '{"result":{"tab":{"tab_id":"t_t"}}}' ;;
			close)  ;;
		esac ;;
	agent)
		pane="${3:-}"
		case "${2:-}" in
			start)
				case "$pane" in
					worker-*)   pane=wp ;;
					reviewer-*) pane=rp ;;
				esac
				echo "{\"result\":{\"agent\":{\"pane_id\":\"$pane\"}}}"
				;;
			send) ;;                       # no-op
			read)
				if [[ "$pane" == "rp" ]]; then
					printf 'reviewer reasoning\nVERDICT: LGTM\nall good\n'
				else
					printf ''               # worker: no IMPL_STUCK
				fi
				;;
		esac ;;
	pane)
		case "${2:-}" in
			get)
				pane="${3:-}"
				cur="${SCENE_DIR}/${pane}.cur"
				[[ -f "$cur" ]] || echo 1 >"$cur"
				n="$(cat "$cur")"
				line="$(sed -n "${n}p" "${SCENE_DIR}/${pane}.scene" 2>/dev/null || true)"
				if [[ -z "$line" ]]; then
					# Scene exhausted: hold last status as a stable done.
					line="$(tail -1 "${SCENE_DIR}/${pane}.scene" 2>/dev/null || echo '99 done')"
				fi
				echo $((n + 1)) >"$cur"
				set -- $line
				printf '{"result":{"pane":{"revision":%s,"agent_status":"%s"}}}\n' "${1:-99}" "${2:-done}"
				;;
			send-keys) ;;                   # no-op (Enter)
			send-text) ;;                   # no-op (/exit)
			close) ;;
		esac ;;
esac
exit 0
EOF
chmod +x "$BIN/herdr"

# Fake sleep: no-op so the poll loops run at full speed (deterministic + fast).
cat >"$BIN/sleep" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod +x "$BIN/sleep"

echo "running herdr-orchestration.sh against fake-herdr scene..."
OUT=$(PATH="$BIN:$PATH" HERDR_ENV=1 \
	HERDR_ORCH_MAX_CYCLES=1 HERDR_ORCH_WAIT_MS=60000 \
	ORCH_TEST_SCENE="$SCENE" \
	bash "$SCRIPT" "$WORKDIR" "$WORKDIR/.herdr-worker-task.md" "$WORKDIR/.herdr-reviewer-task.md" 2>&1) || true

fail() {
	echo "FAIL: $*" >&2
	echo "----- script output -----" >&2
	printf '%s\n' "$OUT" >&2
	exit 1
}

# 1. Full cycle completed and reviewer verdict propagated.
grep -q '^VERDICT: LGTM$' <<<"$OUT" || fail "expected final verdict VERDICT: LGTM"

# 2. wait_started returned on working (the only status it accepts), proving it
#    walked past the leading stale `done` rather than false-starting on it.
grep -q 'wp started (status=working)' <<<"$OUT" ||
	fail "wait_started did not start on working (status-only gate broken)"

# 3. wait_started NEVER logs a start on done/idle (stale-done regression guard).
! grep -qE 'wp started \(status=(done|idle)\)' <<<"$OUT" ||
	fail "wait_started accepted done/idle — stale-done regression"

# 4. wait_settled debounced: settled on stable done (two consecutive reads).
grep -q 'wp settled (status=done stable' <<<"$OUT" ||
	fail "wait_settled did not debounce to stable done"

# 5. Worker turn completed into the reviewer cycle; reviewer also gated.
grep -q 'worker done (cycle 1); sending to reviewer' <<<"$OUT" ||
	fail "worker turn did not complete into the reviewer cycle"
grep -q 'rp started (status=working)' <<<"$OUT" ||
	fail "reviewer wait_started did not start on working"

echo "PASS: status-only wait state machine defeats the stale-done race."
exit 0
