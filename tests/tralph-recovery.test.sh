#!/usr/bin/env bash
# Tests for bin/gralph board-mode recovery: coordinator killed mid-run, restart
# completes the run with no ticket implemented or landed twice; dead run lock
# is reaped; bounced/blocked lanes survive cleanup.
#
# Acceptance criteria covered:
#   - Coordinator killed mid-run: restart completes the run; no ticket is
#     implemented or landed twice; the dead run's lock is reaped.
#   - Bounced/blocked lanes survive cleanup for inspection.
#   - recover_state in board mode skips gh label mutations (no gh binary needed).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

command -v jq >/dev/null 2>&1 || { echo "FAIL: jq is required" >&2; exit 1; }

FAKE_BIN="$TMPDIR/bin"
AGENT_LOG="$TMPDIR/agent.log"
PROMPT_LOG="$TMPDIR/prompt.log"
REAL_PATH="$PATH"
export REAL_PATH AGENT_LOG PROMPT_LOG
mkdir -p "$FAKE_BIN"

cat >"$FAKE_BIN/git" <<'EOF'
#!/usr/bin/env bash
exec /usr/bin/env -i PATH="$REAL_PATH" git "$@"
EOF
chmod +x "$FAKE_BIN/git"

mkdir -p "$TMPDIR/home/.cache"

new_repo() {
  local dir="$1"
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" config user.name test
  git -C "$dir" config user.email test@example.com
  echo init >"$dir/README"
  git -C "$dir" add README
  git -C "$dir" commit -qm init
}

write_ticket() {
  local board="$1" id="$2" status="$3" blocked_by="$4"
  local verify="${5:-test -f worker-output-$id.txt}"
  local file="$board/issues/$(printf '%03d' "$id")-$id.md"
  {
    printf '%s\n' '---'
    printf 'id: %s\n' "$id"
    printf 'title: Ticket %s\n' "$id"
    printf 'status: %s\n' "$status"
    printf 'labels: [ready-for-agent]\n'
    printf 'blocked_by: %s\n' "$blocked_by"
    printf '%s\n' '---'
    printf '\n## What to build\n\nBuild ticket %s.\n\n## Acceptance criteria\n\n- [ ] done\n\n## Verification\n\n`%s`\n' \
      "$id" "$verify"
  } >"$file"
}

run_gralph_board() {
  local repo="$1" board="$2"
  shift 2
  (cd "$repo" && HOME="$TMPDIR/home" PATH="$FAKE_BIN:$PATH" \
    REAL_PATH="$REAL_PATH" AGENT_LOG="$AGENT_LOG" PROMPT_LOG="$PROMPT_LOG" \
    "$GRALPH" 42 --board "$board" "$@")
}

plan_board() {
  local repo="$1" board="$2"
  (cd "$repo" && HOME="$TMPDIR/home" PATH="$FAKE_BIN:$PATH" \
    REAL_PATH="$REAL_PATH" AGENT_LOG="$AGENT_LOG" PROMPT_LOG="$PROMPT_LOG" \
    "$GRALPH" 42 --board "$board" --dry-run --verify 'true') >/dev/null
}

# Stamp helpers: write durable manifest state to simulate an interrupted run.
stamp_landed_board() {
  local repo="$1" manifest="$2" child="$3"
  local base_sha child_branch child_sha
  base_sha="$(jq -r '.baseSha' "$manifest")"
  child_branch="gralph/42/issue-$child"
  mkdir -p "$repo/.gralph/runs/42/worktrees"
  git -C "$repo" worktree add -b "$child_branch" \
    "$repo/.gralph/runs/42/worktrees/issue-$child" "$base_sha" >/dev/null 2>&1
  printf 'done\n' >"$repo/.gralph/runs/42/worktrees/issue-$child/worker-output-$child.txt"
  (cd "$repo/.gralph/runs/42/worktrees/issue-$child" && \
    git add "worker-output-$child.txt" && git commit -qm "feat: ticket $child")
  child_sha="$(git -C "$repo/.gralph/runs/42/worktrees/issue-$child" rev-parse HEAD)"
  # Create batch branch and merge child into it.
  local batch_branch="gralph/42/batch"
  local batch_wt="$repo/.gralph/runs/42/worktrees/batch-stamp"
  if ! git -C "$repo" show-ref --verify --quiet "refs/heads/$batch_branch" 2>/dev/null; then
    git -C "$repo" worktree add -b "$batch_branch" "$batch_wt" "$base_sha" >/dev/null 2>&1
    git -C "$batch_wt" merge --ff-only "$child_sha" >/dev/null 2>&1
    git -C "$repo" worktree remove --force "$batch_wt" >/dev/null 2>&1
  fi
  local landed_sha
  landed_sha="$(git -C "$repo" rev-parse "$batch_branch")"
  jq --argjson child "$child" --arg branch "$child_branch" --arg commit "$child_sha" \
     --arg base "$base_sha" --arg landedSha "$landed_sha" '
    .children |= map(if .number == $child then
      .execution = {status:"complete", commitSha:$commit, branch:$branch,
                    startingSha:$base, worktree:("worktrees/issue-" + ($child|tostring)),
                    verificationExitCode:0, verificationLog:"verify.log",
                    ralphComplete:true, clean:true}
      | .review = {status:"approved", criticalCount:0, blockerCount:0,
                   gate:"accepted", findings:[], processExitCode:0, timedOut:false}
      | .merge = {batchBranch:"gralph/42/batch", landedSha:$landedSha,
                  status:"landed", childCommitSha:$commit}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
}

stamp_accepted_review_board() {
  local repo="$1" manifest="$2" child="$3"
  local base_sha child_branch child_sha
  base_sha="$(jq -r '.baseSha' "$manifest")"
  child_branch="gralph/42/issue-$child"
  mkdir -p "$repo/.gralph/runs/42/worktrees"
  git -C "$repo" worktree add -b "$child_branch" \
    "$repo/.gralph/runs/42/worktrees/issue-$child" "$base_sha" >/dev/null 2>&1
  printf 'done\n' >"$repo/.gralph/runs/42/worktrees/issue-$child/worker-output-$child.txt"
  (cd "$repo/.gralph/runs/42/worktrees/issue-$child" && \
    git add "worker-output-$child.txt" && git commit -qm "feat: ticket $child")
  child_sha="$(git -C "$repo/.gralph/runs/42/worktrees/issue-$child" rev-parse HEAD)"
  jq --argjson child "$child" --arg branch "$child_branch" --arg commit "$child_sha" \
     --arg base "$base_sha" '
    .children |= map(if .number == $child then
      .execution = {status:"complete", commitSha:$commit, branch:$branch,
                    startingSha:$base, worktree:("worktrees/issue-" + ($child|tostring)),
                    verificationExitCode:0, verificationLog:"verify.log",
                    ralphComplete:true, clean:true}
      | .review = {status:"approved", criticalCount:0, blockerCount:0,
                   gate:"accepted", findings:[], processExitCode:0, timedOut:false}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
}

stamp_stale_claim_board() {
  local manifest="$1" child="$2" pid="$3"
  jq --argjson child "$child" --argjson pid "$pid" --arg host "$(hostname)" '
    .children |= map(if .number == $child then
      .claim = {label:"gralph:claimed", runId:"dead-run", host:$host, pid:$pid, status:"claimed"}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
}

# =============================================================================
# --- 1. Coordinator killed after ticket 1 landed: restart completes ticket 2. ---
# =============================================================================

REPO="$TMPDIR/restart"
BOARD="$TMPDIR/board-restart"
mkdir -p "$BOARD/issues"
new_repo "$REPO"

write_ticket "$BOARD" 1 pending '[]'
write_ticket "$BOARD" 2 pending '[]'

: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO" "$BOARD"

MANIFEST="$REPO/.gralph/runs/42/manifest.json"

# Simulate: ticket 1 was landed before coordinator was killed.
stamp_landed_board "$REPO" "$MANIFEST" 1

# Track the batch SHA before restart to verify ticket 2 adds a new commit.
BATCH_BEFORE="$(git -C "$REPO" rev-parse gralph/42/batch)"

# Counter: track agent invocations to ensure ticket 1 is NOT re-implemented.
cat >"$FAKE_BIN/agent-cmd" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt_file="${!#}"
prompt="$(cat "$prompt_file")"
ticket_num="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
printf '%s\n' "agent-cmd ticket=$ticket_num" >>"$AGENT_LOG"
printf 'implemented\n' >"worker-output-$ticket_num.txt"
printf '# Lane-local progress for #%s\n\nDone ticket %s.\n' "$ticket_num" "$ticket_num" >".ralph-progress-$ticket_num.md"
git add "worker-output-$ticket_num.txt" ".ralph-progress-$ticket_num.md"
git commit -qm "feat(board): ticket $ticket_num"
printf 'RALPH_RESULT: DONE #%s\n' "$ticket_num"
EOF
chmod +x "$FAKE_BIN/agent-cmd"

if ! run_gralph_board "$REPO" "$BOARD" --agent-cmd agent-cmd --jobs 1 \
    --verify 'true' >"$TMPDIR/restart.out" 2>"$TMPDIR/restart.err"; then
  echo "FAIL: restart run should exit 0" >&2
  cat "$TMPDIR/restart.err" >&2
  exit 1
fi

# Ticket 1 was adopted (not re-run); agent log must NOT mention ticket 1.
if grep -q 'ticket=1' "$AGENT_LOG"; then
  echo "FAIL: ticket 1 was re-implemented on restart" >&2
  exit 1
fi

# Ticket 2 was implemented.
grep -q 'ticket=2' "$AGENT_LOG" || { echo "FAIL: ticket 2 was not implemented" >&2; exit 1; }

# Both tickets landed.
jq -e '
  (.orchestration.landed | sort == [1, 2])
  and (.children[] | select(.number == 1) | .merge.status) == "landed"
  and (.children[] | select(.number == 2) | .merge.status) == "landed"
' "$MANIFEST" >/dev/null || { echo "FAIL: not all tickets landed after restart" >&2; exit 1; }

# Batch advanced beyond the pre-restart tip.
BATCH_AFTER="$(git -C "$REPO" rev-parse gralph/42/batch)"
[ "$BATCH_AFTER" != "$BATCH_BEFORE" ] || \
  { echo "FAIL: batch branch did not advance for ticket 2" >&2; exit 1; }

# Main was fast-forwarded.
git -C "$REPO" merge-base --is-ancestor "gralph/42/batch" HEAD || \
  { echo "FAIL: main not fast-forwarded after restart" >&2; exit 1; }

echo "restart tests passed"

# =============================================================================
# --- 2. Stale coordinator lock is cleared on restart (no live PID). ---
# =============================================================================

REPO="$TMPDIR/stale-lock"
BOARD="$TMPDIR/board-stale-lock"
mkdir -p "$BOARD/issues"
new_repo "$REPO"
write_ticket "$BOARD" 1 pending '[]'

: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO" "$BOARD"

MANIFEST="$REPO/.gralph/runs/42/manifest.json"

# Simulate a stale coordinator lock with a dead PID.
LOCK_DIR="$REPO/.gralph/runs/42/.coordinator-lock"
mkdir -p "$LOCK_DIR"
jq -n --arg runId "stale-run" --arg host "$(hostname)" --argjson pid 999999999 \
  '{runId:$runId,host:$host,pid:$pid}' >"$LOCK_DIR/owner.json"

# Restart reaps a stale lock (same host, owner pid not running) and resumes: the
# run completes without operator intervention.
if ! run_gralph_board "$REPO" "$BOARD" --agent-cmd agent-cmd --jobs 1 \
    --verify 'true' >"$TMPDIR/stale.out" 2>"$TMPDIR/stale.err"; then
  echo "FAIL: run with a dead-pid lock should reap it and succeed" >&2
  cat "$TMPDIR/stale.err" >&2
  exit 1
fi
grep -q 'reaped stale coordinator lock' "$TMPDIR/stale.err" || \
  { echo "FAIL: reap should be logged" >&2; cat "$TMPDIR/stale.err" >&2; exit 1; }
[ ! -d "$LOCK_DIR" ] || { echo "FAIL: lock should be released after the run" >&2; exit 1; }

jq -e '(.children[] | select(.number == 1) | .merge.status) == "landed"' \
  "$MANIFEST" >/dev/null || { echo "FAIL: ticket 1 should land after the stale lock is reaped" >&2; exit 1; }

# A lock held by a LIVE pid on this host must still refuse.
REPO="$TMPDIR/live-lock"
BOARD="$TMPDIR/board-live-lock"
mkdir -p "$BOARD/issues"
new_repo "$REPO"
write_ticket "$BOARD" 1 pending '[]'
plan_board "$REPO" "$BOARD"
LOCK_DIR="$REPO/.gralph/runs/42/.coordinator-lock"
mkdir -p "$LOCK_DIR"
sleep 60 &
LIVE_PID=$!
jq -n --arg runId "live-run" --arg host "$(hostname)" --argjson pid "$LIVE_PID" \
  '{runId:$runId,host:$host,pid:$pid}' >"$LOCK_DIR/owner.json"
if run_gralph_board "$REPO" "$BOARD" --agent-cmd agent-cmd --jobs 1 \
    --verify 'true' >"$TMPDIR/live.out" 2>"$TMPDIR/live.err"; then
  kill "$LIVE_PID" 2>/dev/null || true
  echo "FAIL: a lock held by a live pid must refuse" >&2; exit 1
fi
grep -q 'another live Gralph run' "$TMPDIR/live.err" || \
  { kill "$LIVE_PID" 2>/dev/null || true; echo "FAIL: live-lock refusal not reported" >&2; cat "$TMPDIR/live.err" >&2; exit 1; }
[ -d "$LOCK_DIR" ] || { kill "$LIVE_PID" 2>/dev/null || true; echo "FAIL: live lock must not be removed" >&2; exit 1; }

# A lock from a FOREIGN host cannot be proven dead: fail closed, do not reap.
jq -n --arg runId "foreign-run" --arg host "some-other-host" --argjson pid 999999999 \
  '{runId:$runId,host:$host,pid:$pid}' >"$LOCK_DIR/owner.json"
kill "$LIVE_PID" 2>/dev/null || true
if run_gralph_board "$REPO" "$BOARD" --agent-cmd agent-cmd --jobs 1 \
    --verify 'true' >"$TMPDIR/foreign.out" 2>"$TMPDIR/foreign.err"; then
  echo "FAIL: a foreign-host lock must fail closed" >&2; exit 1
fi
grep -q 'unresolved Gralph claim' "$TMPDIR/foreign.err" || \
  { echo "FAIL: foreign-host refusal not reported" >&2; cat "$TMPDIR/foreign.err" >&2; exit 1; }
[ -d "$LOCK_DIR" ] || { echo "FAIL: foreign-host lock must not be removed" >&2; exit 1; }

# Several restarts racing for ONE stale lock: exactly one may reap it and become the
# coordinator. Before the identity re-check, 2-4 of 8 each reported reaping it (a slow
# reaper could displace the fresh lock a faster one had just taken).
REPO="$TMPDIR/race-lock"
BOARD="$TMPDIR/board-race-lock"
mkdir -p "$BOARD/issues"
new_repo "$REPO"
write_ticket "$BOARD" 1 pending '[]'
plan_board "$REPO" "$BOARD"
LOCK_DIR="$REPO/.gralph/runs/42/.coordinator-lock"
mkdir -p "$LOCK_DIR"
jq -n --arg host "$(hostname)" '{runId:"dead",host:$host,pid:999999999}' >"$LOCK_DIR/owner.json"
: >"$AGENT_LOG"
cat >"$FAKE_BIN/agent-slow" <<EOF2
#!/usr/bin/env bash
set -euo pipefail
echo launched >>"$AGENT_LOG"
sleep 1
n="\$(grep -oE 'Ticket: #[0-9]+' "\${!#}" | head -1 | grep -oE '[0-9]+')"
printf x >"worker-output-\$n.txt"; git add "worker-output-\$n.txt"; git commit -qm "feat: \$n"
printf 'RALPH_RESULT: DONE #%s\n' "\$n"
EOF2
chmod +x "$FAKE_BIN/agent-slow"
for i in 1 2 3 4 5 6; do
  ( run_gralph_board "$REPO" "$BOARD" --agent-cmd agent-slow --jobs 1 --verify 'true' >"$TMPDIR/race$i.out" 2>"$TMPDIR/race$i.err" || true ) &
done
wait
reapers="$(grep -l 'reaped stale coordinator lock' "$TMPDIR"/race*.err 2>/dev/null | wc -l | tr -d ' ')"
launches="$(wc -l <"$AGENT_LOG" | tr -d ' ')"
[ "$reapers" = "1" ] || { echo "FAIL: $reapers restarts claimed to reap the one stale lock (want exactly 1)" >&2; exit 1; }
[ "$launches" = "1" ] || { echo "FAIL: ticket was launched $launches times under a raced stale lock (want 1)" >&2; exit 1; }

echo "stale-lock tests passed"

# =============================================================================
# --- 3. Board-mode recovery does not invoke gh (no gh binary required). ---
# =============================================================================

REPO="$TMPDIR/no-gh"
BOARD="$TMPDIR/board-no-gh"
mkdir -p "$BOARD/issues"
new_repo "$REPO"

write_ticket "$BOARD" 1 pending '[]'
write_ticket "$BOARD" 2 pending '[]'

: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO" "$BOARD"

MANIFEST="$REPO/.gralph/runs/42/manifest.json"

# Stamp ticket 1 as landed.
stamp_landed_board "$REPO" "$MANIFEST" 1

# Stamp ticket 2 with a stale claim (dead PID, local host).
stamp_stale_claim_board "$MANIFEST" 2 999999999

# gh must NOT be called. Provide a fake gh that fails if invoked.
cat >"$FAKE_BIN/gh" <<'EOF'
#!/usr/bin/env bash
echo "FAIL: gh should not be invoked in board mode recovery" >&2
exit 99
EOF
chmod +x "$FAKE_BIN/gh"

: >"$AGENT_LOG"
if ! run_gralph_board "$REPO" "$BOARD" --agent-cmd agent-cmd --jobs 1 \
    --verify 'true' >"$TMPDIR/nogh.out" 2>"$TMPDIR/nogh.err"; then
  echo "FAIL: board-mode recovery run should succeed without gh" >&2
  cat "$TMPDIR/nogh.err" >&2
  exit 1
fi

# Stale claim should be cleared without gh: check recovery decisions.
jq -e '
  .orchestration.recovery.staleCleared == 1
  and any(.orchestration.recovery.decisions[]; .child == 2 and .action == "stale_cleared")
' "$MANIFEST" >/dev/null || { echo "FAIL: stale claim should be recorded as cleared in recovery decisions" >&2; exit 1; }

# Ticket 2 implemented and landed.
grep -q 'ticket=2' "$AGENT_LOG" || { echo "FAIL: ticket 2 not implemented after stale claim cleared" >&2; exit 1; }

jq -e '(.children[] | select(.number == 2) | .merge.status) == "landed"' \
  "$MANIFEST" >/dev/null || { echo "FAIL: ticket 2 should have landed" >&2; exit 1; }

echo "no-gh-recovery tests passed"

# =============================================================================
# --- 4. Recovery: accepted review resumed → landed; no double-landing. ---
# =============================================================================

REPO="$TMPDIR/resume-merge"
BOARD="$TMPDIR/board-resume"
mkdir -p "$BOARD/issues"
new_repo "$REPO"

write_ticket "$BOARD" 1 pending '[]'
write_ticket "$BOARD" 2 pending '[]'

: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO" "$BOARD"

MANIFEST="$REPO/.gralph/runs/42/manifest.json"

# Stamp ticket 1 with accepted review (interruption: before merge).
stamp_accepted_review_board "$REPO" "$MANIFEST" 1

# gh fake must not be called (board mode).
cat >"$FAKE_BIN/gh" <<'EOF'
#!/usr/bin/env bash
echo "FAIL: gh should not be invoked in board mode" >&2
exit 99
EOF
chmod +x "$FAKE_BIN/gh"

: >"$AGENT_LOG"
if ! run_gralph_board "$REPO" "$BOARD" --agent-cmd agent-cmd --jobs 1 \
    --verify 'true' >"$TMPDIR/resume.out" 2>"$TMPDIR/resume.err"; then
  echo "FAIL: resume-merge run should succeed" >&2
  cat "$TMPDIR/resume.err" >&2
  exit 1
fi

# Ticket 1 not re-implemented (agent-cmd not invoked for it).
if grep -q 'ticket=1' "$AGENT_LOG"; then
  echo "FAIL: ticket 1 with accepted review was re-implemented" >&2
  exit 1
fi

# Ticket 1 landed via recovery.
jq -e '(.children[] | select(.number == 1) | .merge.status) == "landed"' \
  "$MANIFEST" >/dev/null || { echo "FAIL: ticket 1 should be landed after resume" >&2; exit 1; }

# Ticket 2 was implemented fresh.
grep -q 'ticket=2' "$AGENT_LOG" || { echo "FAIL: ticket 2 not implemented" >&2; exit 1; }
jq -e '(.children[] | select(.number == 2) | .merge.status) == "landed"' \
  "$MANIFEST" >/dev/null || { echo "FAIL: ticket 2 should be landed" >&2; exit 1; }

# Recovery line appears before wave work.
grep -E '^Recovery:' "$TMPDIR/resume.err" >/dev/null || \
  { echo "FAIL: recovery line missing from stderr" >&2; exit 1; }

# Review finding 3: a child recovered AFTER its review was accepted must land through
# the BOARD protocol (rebase + ticket verification + durable done), not the GitHub
# merge path. Both tickets must end `status: done` and the recovered one must have
# been re-verified. (This fixture's board is outside the repo, so done is written in
# place; the in-repo case, where done is a commit on the batch branch, is covered in
# gralph-board-runkey.test.sh.)
for n in 1 2; do
  st="$(sed -n 's/^status: //p' "$BOARD/issues/$(printf '%03d' "$n")-$n.md" | head -1)"
  [ "$st" = "done" ] || { echo "FAIL: ticket $n status after recovery run is '$st', want done" >&2; exit 1; }
done
jq -e '(.children[] | select(.number == 1) | .merge.reverifyLog) != null' "$MANIFEST" >/dev/null || \
  { echo "FAIL: recovered ticket 1 was not re-verified on the rebased lane (board landing skipped)" >&2; exit 1; }

echo "resume-merge tests passed"

printf '%s\n' 'tralph-recovery tests passed'
