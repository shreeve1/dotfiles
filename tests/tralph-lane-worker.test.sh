#!/usr/bin/env bash
# Tests for the board-mode lane worker pipeline in bin/gralph (ADR 0010).
#
# Coverage:
#   1. Two independent eligible tickets run in the SAME wave concurrently
#      (--jobs 2), both land their own commits on separate lane branches.
#   2. The coordinator records the worker's RALPH_RESULT sentinel + commit
#      SHA into the per-child sidecar; it does NOT create the commit itself
#      (the lane branch's tip equals the worker's commit, and the
#      manifest's `execution.commitSha` matches it byte-for-byte).
#   3. --agent-cmd overrides the headless default (a different fake agent
#      path is honoured, and its RALPH_RESULT: FAIL is recorded as
#      execution.status="failed" with reason="failed" — no blind retry).
#   4. A worker FAIL/BLOCKED marks the ticket blocked on the board:
#      orchestrator exits non-zero, the manifest records
#      execution.status="failed" with reason=sentinel, the next wave does
#      not re-select the child (no blind retry).
#   5. The worker never touches .kanban/ or the ticket frontmatter; the
#      worker's progress note (`.ralph-progress.md`) lives on the lane
#      branch, not in .kanban/progress.md.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

command -v jq >/dev/null 2>&1 || { echo "FAIL: jq is required" >&2; exit 1; }
command -v yq >/dev/null 2>&1 || { echo "FAIL: yq is required" >&2; exit 1; }

FAKE_BIN="$TMPDIR/bin"
AGENT_LOG="$TMPDIR/agent.log"
PROMPT_LOG="$TMPDIR/prompt.log"
REAL_PATH="$PATH"
export REAL_PATH AGENT_LOG PROMPT_LOG
mkdir -p "$FAKE_BIN"

# No gh required; board mode is offline. Stub git anyway so any accidental
# push is a no-op (board mode should never publish a PR).
cat >"$FAKE_BIN/git" <<'EOF'
#!/usr/bin/env bash
exec /usr/bin/env -i PATH="$REAL_PATH" git "$@"
EOF
chmod +x "$FAKE_BIN/git"

write_ticket() {
  local id="$1" status="$2" blocked_by="$3"
  local file="$BOARD/issues/$(printf '%03d' "$id")-$id.md"
  {
    printf '%s\n' '---'
    printf 'id: %s\n' "$id"
    printf 'title: Ticket %s\n' "$id"
    printf 'status: %s\n' "$status"
    printf 'blocked_by: %s\n' "$blocked_by"
    printf '%s\n' '---'
    printf '\n## What to build\n\nBuild ticket %s.\n\n## Acceptance criteria\n\n- [ ] worker-output-%s.txt exists\n\n## Verification\n\n`test -f worker-output-%s.txt`\n' "$id" "$id" "$id"
  } >"$file"
}

new_repo() {
  local dir="$1"
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" config user.name test
  git -C "$dir" config user.email test@example.com
  cat >"$dir/verify-integration.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
for f in worker-output-*.txt; do test -f "$f"; done
EOF
  chmod +x "$dir/verify-integration.sh"
  git -C "$dir" add verify-integration.sh
  git -C "$dir" commit -qm init
}

# Default fake agent-cmd: implements ticket <N> by creating
# worker-output-N.txt, writes a lane-local progress note to
# .ralph-progress.md, commits the work, and emits RALPH_RESULT: DONE #N.
# The coordinator invokes it as `agent-cmd <prompt-file>` so the last arg
# is the prompt path; the agent reads the file (the prompt contents never
# need to fit on a command line).
cat >"$FAKE_BIN/agent-cmd" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt_file="${!#}"
prompt="$(cat "$prompt_file")"
printf '%s\n' "$prompt" >>"$PROMPT_LOG"
ticket_num="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
printf '%s\n' "agent-cmd ticket=$ticket_num" >>"$AGENT_LOG"
printf 'implemented\n' >"worker-output-$ticket_num.txt"
printf '# Lane-local progress for #%s\n' "$ticket_num" >>".ralph-progress-$ticket_num.md"
git add "worker-output-$ticket_num.txt" ".ralph-progress-$ticket_num.md"
git commit -qm "feat(board): ticket $ticket_num"
printf 'RALPH_RESULT: DONE #%s\n' "$ticket_num"
EOF
chmod +x "$FAKE_BIN/agent-cmd"

# Failing fake agent-cmd: emits RALPH_RESULT: FAIL/BLOCKED without committing.
cat >"$FAKE_BIN/agent-fail" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt_file="${!#}"
prompt="$(cat "$prompt_file")"
ticket_num="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
printf '%s\n' "agent-fail ticket=$ticket_num" >>"$AGENT_LOG"
printf 'gave up\n' >"worker-output-$ticket_num.txt"
printf 'RALPH_RESULT: FAIL #%s\n' "$ticket_num"
EOF
chmod +x "$FAKE_BIN/agent-fail"

run_gralph_board() {
  local repo="$1"
  shift
  (cd "$repo" && PATH="$FAKE_BIN:$PATH" \
    REAL_PATH="$REAL_PATH" AGENT_LOG="$AGENT_LOG" PROMPT_LOG="$PROMPT_LOG" \
    "$GRALPH" 42 --board "$BOARD" "$@")
}

plan_board() {
  local repo="$1"
  (cd "$repo" && PATH="$FAKE_BIN:$PATH" \
    REAL_PATH="$REAL_PATH" AGENT_LOG="$AGENT_LOG" PROMPT_LOG="$PROMPT_LOG" \
    "$GRALPH" 42 --board "$BOARD" --dry-run --verify 'bash verify-integration.sh') >/dev/null
}

# --- 1. Two independent ready tickets run concurrently (jobs 2). ---
REPO="$TMPDIR/two-lanes"
new_repo "$REPO"
BOARD="$TMPDIR/board-2"
mkdir -p "$BOARD/issues"
write_ticket 1 done '[]'
write_ticket 2 pending '[]'
write_ticket 3 pending '[]'
write_ticket 4 pending '[2]'

: >"$AGENT_LOG" : >"$PROMPT_LOG"
plan_board "$REPO"
if run_gralph_board "$REPO" --agent-cmd agent-cmd --jobs 2 --verify 'bash verify-integration.sh' \
    >/dev/null 2>"$TMPDIR/two.out"; then :; else
  echo "FAIL: two-lane run exited non-zero" >&2; cat "$TMPDIR/two.out" >&2; exit 1; fi
MANIFEST="$REPO/.gralph/runs/42/manifest.json"

# Both 2 and 3 landed in the same wave; ticket 4 then becomes eligible in
# wave 2 once its blocker (ticket 2) is marked done by the coordinator.
jq -e '
  (.orchestration.waveLog | length) >= 2
  and ((.orchestration.waveLog[0].children // []) | sort == [2, 3])
  and ((.orchestration.waveLog[1].children // []) | sort == [4])
  and (.children[] | select(.number == 2) | .merge.status) == "landed"
  and (.children[] | select(.number == 3) | .merge.status) == "landed"
  and (.children[] | select(.number == 4) | .merge.status) == "landed"
  and (.orchestration.landed | sort == [2, 3, 4])
' "$MANIFEST" >/dev/null

# --- 2. Coordinator records the sentinel + commit SHA in the sidecar. ---
BASE_SHA="$(jq -r .baseSha "$MANIFEST")"
worker_sha_2="$(jq -r '.children[] | select(.number == 2) | .execution.commitSha' "$MANIFEST")"
worker_sha_3="$(jq -r '.children[] | select(.number == 3) | .execution.commitSha' "$MANIFEST")"
[ "$(git -C "$REPO" rev-parse "gralph/42/issue-2")" = "$worker_sha_2" ]
[ "$(git -C "$REPO" rev-parse "gralph/42/issue-3")" = "$worker_sha_3" ]
[ "$worker_sha_2" != "$BASE_SHA" ]
[ "$worker_sha_3" != "$BASE_SHA" ]
ls "$REPO/.gralph/runs/42"/.child-2-*-result.json >/dev/null
ls "$REPO/.gralph/runs/42"/.child-3-*-result.json >/dev/null
grep -q '"outcome": "accepted"' "$REPO/.gralph/runs/42"/.child-2-*-result.json
grep -q '"sentinel": "DONE"' "$REPO/.gralph/runs/42"/.child-3-*-result.json
grep -q '^RALPH_RESULT: DONE #2$' "$REPO/.gralph/runs/42"/.child-2-*-worker.log
grep -q '^RALPH_RESULT: DONE #3$' "$REPO/.gralph/runs/42"/.child-3-*-worker.log

# --- 3. --agent-cmd overrides the headless default; FAIL is recorded. ---
REPO="$TMPDIR/override"
new_repo "$REPO"
BOARD="$TMPDIR/board-override"
mkdir -p "$BOARD/issues"
write_ticket 5 pending '[]'
: >"$AGENT_LOG" : >"$PROMPT_LOG"
plan_board "$REPO"
if run_gralph_board "$REPO" --agent-cmd agent-fail --jobs 1 --verify 'true' \
    >"$TMPDIR/override.out" 2>"$TMPDIR/override.err"; then :; fi
grep -q 'agent-fail ticket=5' "$AGENT_LOG" || {
  echo "FAIL: --agent-cmd override did not route the prompt to agent-fail" >&2
  cat "$TMPDIR/override.err" >&2; exit 1; }
grep -q '^RALPH_RESULT: FAIL #5$' "$REPO/.gralph/runs/42"/.child-5-*-worker.log || {
  echo "FAIL: agent-fail did not emit FAIL sentinel" >&2
  cat "$TMPDIR/override.err" >&2; exit 1; }

# --- 4. FAIL sentinel marks the ticket blocked, no blind retry. ---
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
jq -e '
  (.children[] | select(.number == 5) | .execution.status) == "failed"
  and (.children[] | select(.number == 5) | .execution.reason) == "failed"
  and (.children[] | select(.number == 5) | .sentinel) == "failed"
  and (.orchestration.failed | index(5) != null)
  and (.orchestration.remainingOpenReady >= 1)
' "$MANIFEST" >/dev/null
grep -q 'remain unlanded' "$TMPDIR/override.err"

# Without --agent-cmd, a board mutating run is refused.
REPO="$TMPDIR/no-agent"
new_repo "$REPO"
BOARD="$TMPDIR/board-no-agent"
mkdir -p "$BOARD/issues"
write_ticket 6 pending '[]'
if (cd "$REPO" && PATH="$FAKE_BIN:$PATH" REAL_PATH="$REAL_PATH" \
    "$GRALPH" 42 --board "$BOARD" --verify 'true') >/dev/null 2>"$TMPDIR/no-agent.err"; then
  echo "FAIL: --board mutating run without --agent-cmd unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'require --agent-cmd' "$TMPDIR/no-agent.err"

# --- 5. Worker leaves ticket frontmatter untouched; lane-local progress note
#        is on the lane branch, not in .kanban/progress.md. ---
REPO="$TMPDIR/lane-progress"
new_repo "$REPO"
BOARD="$TMPDIR/board-progress"
mkdir -p "$BOARD/issues"
write_ticket 7 pending '[]'
: >"$AGENT_LOG" : >"$PROMPT_LOG"
plan_board "$REPO"
if run_gralph_board "$REPO" --agent-cmd agent-cmd --jobs 1 --verify 'bash verify-integration.sh' \
    >/dev/null 2>"$TMPDIR/lane.out"; then :; else
  echo "FAIL: lane-progress run exited non-zero" >&2; cat "$TMPDIR/lane.out" >&2; exit 1; fi
grep -q '^status: pending$' "$BOARD/issues/007-7.md"
[ ! -f "$REPO/.kanban/progress.md" ] || ! grep -q 'Lane-local progress for #7' "$REPO/.kanban/progress.md"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
worker_sha_7="$(jq -r '.children[] | select(.number == 7) | .execution.commitSha' "$MANIFEST")"
git -C "$REPO" show "$worker_sha_7:.ralph-progress-7.md" >/dev/null
printf '%s\n' 'tralph-lane-worker tests passed'
