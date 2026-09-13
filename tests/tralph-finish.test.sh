#!/usr/bin/env bash
# Tests for bin/gralph board-mode finish: ff-only merge into main, deferred
# merge (diverged main drops marker), run-report.md, and worktree pruning.
#
# Acceptance criteria covered:
#   1. Clean run ends with main fast-forwarded and a run-report.md naming
#      every ticket's outcome and landing SHA.
#   2. Diverged main: no merge, marker dropped, report says deferred.
#   3. tralph-merge skill documents the board-mode marker + integration branch.
#   4. Bounced/blocked lanes survive cleanup for inspection.

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

# write_ticket: id status blocked_by [verify_cmd]
write_ticket() {
  local board="$1" id="$2" status="$3" blocked_by="$4"
  local verify="${5:-test -f worker-output-$id.txt}"
  local file="$board/issues/$(printf '%03d' "$id")-$id.md"
  {
    printf '%s\n' '---'
    printf 'id: %s\n' "$id"
    printf 'title: Ticket %s\n' "$id"
    printf 'status: %s\n' "$status"
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

mkdir -p "$TMPDIR/home/.cache"

# Default agent: commits a file and emits DONE.
cat >"$FAKE_BIN/agent-cmd" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt_file="${!#}"
prompt="$(cat "$prompt_file")"
printf '%s\n' "$prompt" >>"$PROMPT_LOG"
ticket_num="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
printf '%s\n' "agent-cmd ticket=$ticket_num" >>"$AGENT_LOG"
printf 'implemented\n' >"worker-output-$ticket_num.txt"
printf '# Lane-local progress for #%s\n\nDone ticket %s.\n' "$ticket_num" "$ticket_num" >".ralph-progress-$ticket_num.md"
git add "worker-output-$ticket_num.txt" ".ralph-progress-$ticket_num.md"
git commit -qm "feat(board): ticket $ticket_num"
printf 'RALPH_RESULT: DONE #%s\n' "$ticket_num"
EOF
chmod +x "$FAKE_BIN/agent-cmd"

# =============================================================================
# --- 1. Clean run fast-forwards main and writes run-report.md. ---
# =============================================================================

REPO="$TMPDIR/clean-run"
BOARD="$TMPDIR/board-clean"
mkdir -p "$BOARD/issues"
new_repo "$REPO"

write_ticket "$BOARD" 1 pending '[]'
write_ticket "$BOARD" 2 pending '[1]'

: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO" "$BOARD"

MAIN_BEFORE="$(git -C "$REPO" rev-parse HEAD)"

if ! run_gralph_board "$REPO" "$BOARD" --agent-cmd agent-cmd --jobs 1 \
    --verify 'true' >"$TMPDIR/clean.out" 2>"$TMPDIR/clean.err"; then
  echo "FAIL: clean run should exit 0" >&2
  cat "$TMPDIR/clean.err" >&2
  exit 1
fi

MANIFEST="$REPO/.gralph/runs/42/manifest.json"

# Both tickets landed.
jq -e '
  (.orchestration.landed | sort == [1, 2])
  and (.children[] | select(.number == 1) | .merge.status) == "landed"
  and (.children[] | select(.number == 2) | .merge.status) == "landed"
' "$MANIFEST" >/dev/null || { echo "FAIL: not all tickets landed" >&2; exit 1; }

# Main was fast-forwarded (HEAD moved).
MAIN_AFTER="$(git -C "$REPO" rev-parse HEAD)"
[ "$MAIN_AFTER" != "$MAIN_BEFORE" ] || { echo "FAIL: main HEAD did not advance after ff-only" >&2; exit 1; }

# The batch branch is now an ancestor of (or equal to) HEAD.
git -C "$REPO" merge-base --is-ancestor "gralph/42/batch" HEAD || \
  { echo "FAIL: batch branch not ancestor of main after merge" >&2; exit 1; }

# Manifest records boardFinish.status = merged.
jq -e '.orchestration.boardFinish.status == "merged"' "$MANIFEST" >/dev/null || \
  { echo "FAIL: manifest should record boardFinish.status=merged" >&2; exit 1; }
jq -e '(.orchestration.boardFinish.mergeSha | type == "string") and (.orchestration.boardFinish.mergeSha | length > 0)' "$MANIFEST" >/dev/null || \
  { echo "FAIL: manifest should record boardFinish.mergeSha" >&2; exit 1; }

# run-report.md exists and names both tickets.
REPORT="$REPO/.kanban/run-report.md"
[ -f "$REPORT" ] || { echo "FAIL: run-report.md missing" >&2; exit 1; }
grep -q '| 1 |' "$REPORT" || { echo "FAIL: ticket 1 missing from report" >&2; exit 1; }
grep -q '| 2 |' "$REPORT" || { echo "FAIL: ticket 2 missing from report" >&2; exit 1; }
grep -q 'landed' "$REPORT" || { echo "FAIL: 'landed' outcome missing from report" >&2; exit 1; }

# No stale marker.
MARKER="$TMPDIR/home/.cache/ralph-merge-needed-board-42"
[ ! -f "$MARKER" ] || { echo "FAIL: marker should not exist after successful merge" >&2; exit 1; }

# Landed lane worktrees/branches are removed.
LANDED_BRANCH_1="$(jq -r '.children[] | select(.number == 1) | .execution.branch // ""' "$MANIFEST")"
if [ -n "$LANDED_BRANCH_1" ]; then
  git -C "$REPO" show-ref --verify --quiet "refs/heads/$LANDED_BRANCH_1" 2>/dev/null && \
    { echo "FAIL: landed branch $LANDED_BRANCH_1 should have been pruned" >&2; exit 1; } || true
fi

echo "clean-run tests passed"

# =============================================================================
# --- 2. Diverged main: no merge, marker dropped, report says deferred. ---
# =============================================================================

REPO="$TMPDIR/diverged"
BOARD="$TMPDIR/board-diverged"
mkdir -p "$BOARD/issues"
new_repo "$REPO"

write_ticket "$BOARD" 10 pending '[]'

: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO" "$BOARD"

if ! run_gralph_board "$REPO" "$BOARD" --agent-cmd agent-cmd --jobs 1 \
    --verify 'true' >"$TMPDIR/diverge.out" 2>"$TMPDIR/diverge.err"; then
  echo "FAIL: run should succeed even with diverged main" >&2
  cat "$TMPDIR/diverge.err" >&2
  exit 1
fi

MANIFEST="$REPO/.gralph/runs/42/manifest.json"

# Ticket 10 landed on batch.
jq -e '(.children[] | select(.number == 10) | .merge.status) == "landed"' \
  "$MANIFEST" >/dev/null || { echo "FAIL: ticket 10 should have landed on batch" >&2; exit 1; }

# Now advance main with a new commit so ff-only will fail on restart.
echo "extra" >"$REPO/extra.txt"
git -C "$REPO" add extra.txt
git -C "$REPO" commit -qm "extra commit diverging main"

# Run a second ticket on the same board (replay finish_board with diverged main
# by running gralph again; since ticket 10 is already landed, pick a new ticket).
write_ticket "$BOARD" 11 pending '[]'
plan_board "$REPO" "$BOARD"
# Need to reset the manifest to add ticket 11; simulate by replanning.
# Instead directly call finish_board by running a fresh gralph plan+run for 42
# with a NEW parent number to get a fresh batch. Actually: let's use a fresh
# diverged scenario.

REPO2="$TMPDIR/diverged2"
BOARD2="$TMPDIR/board-diverged2"
mkdir -p "$BOARD2/issues"
new_repo "$REPO2"
write_ticket "$BOARD2" 1 pending '[]'
: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO2" "$BOARD2"

# Diverge main before running the board run.
echo "diverge" >"$REPO2/diverge.txt"
git -C "$REPO2" add diverge.txt
git -C "$REPO2" commit -qm "diverge main"

# Now run agent (worker commits on base_sha which is now behind HEAD).
# But gralph stores base_sha from the plan (which is now behind HEAD).
# Ticket lands on batch. finish_board tries ff-only → fails → deferred.
if ! run_gralph_board "$REPO2" "$BOARD2" --agent-cmd agent-cmd --jobs 1 \
    --verify 'true' >"$TMPDIR/diverge2.out" 2>"$TMPDIR/diverge2.err"; then
  echo "FAIL: run should exit 0 even when ff-only is deferred" >&2
  cat "$TMPDIR/diverge2.err" >&2
  exit 1
fi

MANIFEST2="$REPO2/.gralph/runs/42/manifest.json"

# Ticket landed on batch.
jq -e '(.children[] | select(.number == 1) | .merge.status) == "landed"' \
  "$MANIFEST2" >/dev/null || { echo "FAIL: ticket 1 should have landed on batch" >&2; exit 1; }

# boardFinish.status = deferred.
jq -e '.orchestration.boardFinish.status == "deferred"' "$MANIFEST2" >/dev/null || \
  { echo "FAIL: manifest should record boardFinish.status=deferred" >&2; exit 1; }

# Marker dropped.
MARKER2="$TMPDIR/home/.cache/ralph-merge-needed-board-42"
[ -f "$MARKER2" ] || { echo "FAIL: marker should exist after deferred merge" >&2; exit 1; }

# Report says deferred.
REPORT2="$REPO2/.kanban/run-report.md"
[ -f "$REPORT2" ] || { echo "FAIL: run-report.md missing for deferred case" >&2; exit 1; }
grep -qi 'deferred' "$REPORT2" || { echo "FAIL: 'deferred' missing from report" >&2; exit 1; }
grep -q 'gralph/42/batch' "$REPORT2" || { echo "FAIL: batch branch missing from deferred report" >&2; exit 1; }

# Batch branch still exists (not deleted on deferred).
git -C "$REPO2" show-ref --verify --quiet refs/heads/gralph/42/batch || \
  { echo "FAIL: batch branch should survive deferred merge" >&2; exit 1; }

echo "diverged-main tests passed"

# =============================================================================
# --- 3. tralph-merge skill documents board-mode marker + integration branch. ---
# =============================================================================

SKILL="$ROOT/.agents/skills/tralph-merge/SKILL.md"
[ -f "$SKILL" ] || { echo "FAIL: tralph-merge skill missing" >&2; exit 1; }
grep -q 'ralph-merge-needed-board' "$SKILL" || \
  { echo "FAIL: skill does not document board-mode marker" >&2; exit 1; }
grep -q 'gralph.*batch' "$SKILL" || \
  { echo "FAIL: skill does not document gralph batch branch" >&2; exit 1; }

echo "tralph-merge skill tests passed"

# =============================================================================
# --- 4. Bounced lanes survive cleanup. ---
# =============================================================================

REPO="$TMPDIR/bounced"
BOARD="$TMPDIR/board-bounced"
mkdir -p "$BOARD/issues"
new_repo "$REPO"

# Ticket 1: in-scope agent, passes.
# Ticket 2: singleton verify fails after rebase (reuse singleton pattern from landing-queue test).
cat >"$REPO/check-singleton.sh" <<'VEOF'
#!/usr/bin/env bash
count="$(find . -maxdepth 1 -name 'claim-*.txt' | wc -l | tr -d ' ')"
[ "$count" -le 1 ]
VEOF
chmod +x "$REPO/check-singleton.sh"
git -C "$REPO" add check-singleton.sh
git -C "$REPO" commit -qm "add singleton check"

write_ticket "$BOARD" 1 pending '[]' 'bash check-singleton.sh'
write_ticket "$BOARD" 2 pending '[]' 'bash check-singleton.sh'

cat >"$FAKE_BIN/agent-singleton" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt_file="${!#}"
prompt="$(cat "$prompt_file")"
ticket_num="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
printf 'implemented\n' >"worker-output-$ticket_num.txt"
printf '# Lane-local progress for #%s\n\nDone ticket %s.\n' "$ticket_num" "$ticket_num" >".ralph-progress-$ticket_num.md"
printf 'owned by ticket %s\n' "$ticket_num" >"claim-$ticket_num.txt"
git add "worker-output-$ticket_num.txt" ".ralph-progress-$ticket_num.md" "claim-$ticket_num.txt"
git commit -qm "feat(board): singleton ticket $ticket_num"
printf 'RALPH_RESULT: DONE #%s\n' "$ticket_num"
EOF
chmod +x "$FAKE_BIN/agent-singleton"

: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO" "$BOARD"

run_gralph_board "$REPO" "$BOARD" --agent-cmd agent-singleton --jobs 1 \
  --verify 'true' >"$TMPDIR/bounced.out" 2>"$TMPDIR/bounced.err" || true

MANIFEST="$REPO/.gralph/runs/42/manifest.json"

# Ticket 1 landed, ticket 2 bounced.
jq -e '(.children[] | select(.number == 1) | .merge.status) == "landed"' \
  "$MANIFEST" >/dev/null || { echo "FAIL: ticket 1 should have landed" >&2; exit 1; }
jq -e '(.children[] | select(.number == 2) | .merge.status) == "bounced"' \
  "$MANIFEST" >/dev/null || { echo "FAIL: ticket 2 should have bounced" >&2; exit 1; }

# Bounced branch preserved.
bounced_branch="$(jq -r '.children[] | select(.number == 2) | .merge.bouncedBranch // ""' "$MANIFEST")"
[ -n "$bounced_branch" ] || { echo "FAIL: bounced branch not recorded in manifest" >&2; exit 1; }
git -C "$REPO" show-ref --verify --quiet "refs/heads/$bounced_branch" || \
  { echo "FAIL: bounced branch $bounced_branch should survive cleanup" >&2; exit 1; }

# run-report lists bounced outcome.
REPORT="$REPO/.kanban/run-report.md"
[ -f "$REPORT" ] || { echo "FAIL: run-report.md missing for bounced case" >&2; exit 1; }
grep -q 'bounced' "$REPORT" || { echo "FAIL: 'bounced' missing from report" >&2; exit 1; }

echo "bounced-lane tests passed"

printf '%s\n' 'tralph-finish tests passed'
