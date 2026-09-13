#!/usr/bin/env bash
# Tests for the bors-style landing queue in bin/gralph board mode (ADR 0009).
#
# Acceptance criteria covered:
#   1. Two lanes land serially in topo order; integration branch is green
#      after each landing.
#   2. A crafted semantic conflict (lane A and B green alone, red combined)
#      bounces the second lane, creates a repair ticket, and the integration
#      branch stays green.
#   3. No --no-ff merge commits in board mode; landings are ff-only after
#      rebase.
#   4. A bounced lane's worktree/branch is preserved for the repair ticket.
#   5. Each landing appends the lane's progress note to
#      .kanban/progress.md in landing order.

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

cat >"$FAKE_BIN/git" <<'EOF'
#!/usr/bin/env bash
exec /usr/bin/env -i PATH="$REAL_PATH" git "$@"
EOF
chmod +x "$FAKE_BIN/git"

# write_ticket: id status blocked_by [verify_cmd]
write_ticket() {
  local id="$1" status="$2" blocked_by="$3"
  local verify="${4:-test -f worker-output-$id.txt}"
  local file="$BOARD/issues/$(printf '%03d' "$id")-$id.md"
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

# Default agent: creates worker-output-N.txt and a progress note, commits, DONE.
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

# Singleton-conflict agent: each lane claims the singleton resource by writing
# claim-<N>.txt. The per-ticket verify checks only one claim-*.txt exists.
# After lane A lands, lane B's rebase onto batch_tip (which has claim-A.txt)
# means the rebased lane has BOTH claim-A.txt and claim-B.txt → re-verify fails.
cat >"$FAKE_BIN/agent-singleton" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt_file="${!#}"
prompt="$(cat "$prompt_file")"
ticket_num="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
printf '%s\n' "agent-singleton ticket=$ticket_num" >>"$AGENT_LOG"
printf 'implemented\n' >"worker-output-$ticket_num.txt"
printf '# Lane-local progress for #%s\n\nDone ticket %s.\n' "$ticket_num" "$ticket_num" >".ralph-progress-$ticket_num.md"
# Each lane creates its own claim file. The singleton verify will fail once
# a second claim file exists on the integration branch.
printf 'owned by ticket %s\n' "$ticket_num" >"claim-$ticket_num.txt"
git add "worker-output-$ticket_num.txt" ".ralph-progress-$ticket_num.md" "claim-$ticket_num.txt"
git commit -qm "feat(board): singleton ticket $ticket_num"
printf 'RALPH_RESULT: DONE #%s\n' "$ticket_num"
EOF
chmod +x "$FAKE_BIN/agent-singleton"

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

# --- 1. Two lanes land serially in topo order; integration is green after each. ---
REPO="$TMPDIR/serial-land"
BOARD="$TMPDIR/board-serial"
mkdir -p "$BOARD/issues"
new_repo "$REPO"
cat >"$REPO/verify-integration.sh" <<'VEOF'
#!/usr/bin/env bash
set -euo pipefail
for f in worker-output-*.txt; do test -f "$f"; done
VEOF
chmod +x "$REPO/verify-integration.sh"
git -C "$REPO" add verify-integration.sh
git -C "$REPO" commit -qm "add integration script"

# Ticket 2 blocked by 1: enforces topo order.
write_ticket 1 pending '[]'
write_ticket 2 pending '[1]'
: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO"

if run_gralph_board "$REPO" --agent-cmd agent-cmd --jobs 1 \
    --verify 'bash verify-integration.sh' >/dev/null 2>"$TMPDIR/serial.err"; then :; else
  echo "FAIL: serial landing exited non-zero" >&2
  cat "$TMPDIR/serial.err" >&2
  exit 1
fi

MANIFEST="$REPO/.gralph/runs/42/manifest.json"
jq -e '
  (.orchestration.landed | sort == [1, 2])
  and (.children[] | select(.number == 1) | .merge.status) == "landed"
  and (.children[] | select(.number == 2) | .merge.status) == "landed"
' "$MANIFEST" >/dev/null || { echo "FAIL: not all tickets landed in manifest" >&2; exit 1; }

# Integration branch (gralph/42/batch) must be green after both landings.
BATCH_TIP="$(git -C "$REPO" rev-parse gralph/42/batch 2>/dev/null)"
[ -n "$BATCH_TIP" ] || { echo "FAIL: batch branch not created" >&2; exit 1; }
(cd "$REPO" && git checkout -q --detach "$BATCH_TIP" 2>/dev/null && bash verify-integration.sh) || {
  echo "FAIL: integration branch not green after serial landings" >&2
  git -C "$REPO" checkout -q - 2>/dev/null || true
  exit 1
}
git -C "$REPO" checkout -q - 2>/dev/null || true

# --- 2. Semantic conflict: lane A green, lane B bounces; integration stays green. ---
# Scenario: both lanes claim a singleton resource (only one claim-*.txt allowed).
# Lane 10 lands fine (claim-10.txt). Lane 11's rebase onto the batch tip (which
# has claim-10.txt) results in a worktree with both claim-10.txt and claim-11.txt,
# so re-verify fails → bounce. Integration branch stays green (only lane 10).
REPO="$TMPDIR/semantic"
BOARD="$TMPDIR/board-semantic"
mkdir -p "$BOARD/issues"
new_repo "$REPO"
cat >"$REPO/verify-integration.sh" <<'VEOF'
#!/usr/bin/env bash
set -euo pipefail
for f in worker-output-*.txt; do test -f "$f"; done
VEOF
chmod +x "$REPO/verify-integration.sh"
# Per-ticket singleton verify: only one claim file allowed.
cat >"$REPO/check-singleton.sh" <<'VEOF'
#!/usr/bin/env bash
set -euo pipefail
count="$(ls claim-*.txt 2>/dev/null | wc -l | tr -d ' ')"
[ "$count" -le 1 ] || { echo "FAIL: more than one claim-*.txt detected ($count)" >&2; exit 1; }
VEOF
chmod +x "$REPO/check-singleton.sh"
git -C "$REPO" add verify-integration.sh check-singleton.sh
git -C "$REPO" commit -qm "add scripts"

write_ticket 10 pending '[]' 'bash check-singleton.sh'
write_ticket 11 pending '[]' 'bash check-singleton.sh'
: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO"

# --jobs 1: ticket 10 lands first, then ticket 11 bounces.
# A bounce is a soft outcome: orchestrator exits 0 (all non-bounced lanes landed).
if ! run_gralph_board "$REPO" --agent-cmd agent-singleton --jobs 1 \
    --verify 'bash verify-integration.sh' >/dev/null 2>"$TMPDIR/semantic.err"; then
  echo "FAIL: semantic bounce run exited non-zero (bounce should be a soft outcome)" >&2
  cat "$TMPDIR/semantic.err" >&2
  exit 1
fi

MANIFEST="$REPO/.gralph/runs/42/manifest.json"
jq -e '
  (.children[] | select(.number == 10) | .merge.status) == "landed"
  and (.children[] | select(.number == 11) | .merge.status) == "bounced"
' "$MANIFEST" >/dev/null || {
  echo "FAIL: expected ticket 10 landed and ticket 11 bounced" >&2
  jq '.children[] | {number, merge_status: .merge.status}' "$MANIFEST" >&2
  cat "$TMPDIR/semantic.err" >&2
  exit 1
}

# A repair ticket was created in the board directory.
REPAIR_FILES="$(find "$BOARD/issues" -name '*repair*' -name '*.md' 2>/dev/null || true)"
[ -n "$REPAIR_FILES" ] || {
  echo "FAIL: no repair ticket file created after bounce" >&2
  ls "$BOARD/issues/" >&2
  exit 1
}
grep -l 'status: blocked' $REPAIR_FILES >/dev/null || {
  echo "FAIL: repair ticket does not have status: blocked" >&2
  cat $REPAIR_FILES >&2
  exit 1
}

# Integration branch still green after bounce (only ticket 10 landed).
BATCH_TIP="$(git -C "$REPO" rev-parse gralph/42/batch 2>/dev/null)"
[ -n "$BATCH_TIP" ] || { echo "FAIL: batch branch not created" >&2; exit 1; }
(cd "$REPO" && git checkout -q --detach "$BATCH_TIP" 2>/dev/null && bash verify-integration.sh) || {
  echo "FAIL: integration branch not green after bounce" >&2
  git -C "$REPO" checkout -q - 2>/dev/null || true
  exit 1
}
git -C "$REPO" checkout -q - 2>/dev/null || true

# --- 3. No --no-ff merge commits; landings are ff-only after rebase. ---
REPO="$TMPDIR/ffonly"
BOARD="$TMPDIR/board-ffonly"
mkdir -p "$BOARD/issues"
new_repo "$REPO"
cat >"$REPO/verify-integration.sh" <<'VEOF'
#!/usr/bin/env bash
set -euo pipefail
for f in worker-output-*.txt; do test -f "$f"; done
VEOF
chmod +x "$REPO/verify-integration.sh"
git -C "$REPO" add verify-integration.sh
git -C "$REPO" commit -qm "add integration script"

write_ticket 20 pending '[]'
write_ticket 21 pending '[]'
: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO"

if run_gralph_board "$REPO" --agent-cmd agent-cmd --jobs 1 \
    --verify 'bash verify-integration.sh' >/dev/null 2>"$TMPDIR/ffonly.err"; then :; else
  echo "FAIL: ffonly run exited non-zero" >&2
  cat "$TMPDIR/ffonly.err" >&2
  exit 1
fi

# No merge commits: linear history from base to batch tip.
BASE_SHA="$(jq -r .baseSha "$REPO/.gralph/runs/42/manifest.json")"
MERGE_COMMITS="$(git -C "$REPO" log --oneline --merges "$BASE_SHA..gralph/42/batch" | wc -l | tr -d ' ')"
[ "$MERGE_COMMITS" -eq 0 ] || {
  echo "FAIL: found $MERGE_COMMITS merge commit(s) on batch branch (expected 0 for ff-only)" >&2
  git -C "$REPO" log --oneline --graph "$BASE_SHA..gralph/42/batch" >&2
  exit 1
}

# --- 4. Bounced lane's worktree/branch is preserved. ---
# Reuse semantic test: ticket 11 bounced. Its branch must still exist.
MANIFEST="$TMPDIR/semantic/.gralph/runs/42/manifest.json"
bounced_branch="$(jq -r '.children[] | select(.number == 11) | .merge.bouncedBranch // ""' "$MANIFEST")"
[ -n "$bounced_branch" ] || {
  echo "FAIL: bouncedBranch not recorded in manifest for ticket 11" >&2
  jq '.children[] | select(.number == 11)' "$MANIFEST" >&2
  exit 1
}
git -C "$TMPDIR/semantic" show-ref --verify --quiet "refs/heads/$bounced_branch" || {
  echo "FAIL: bounced branch $bounced_branch no longer exists in semantic repo" >&2
  exit 1
}

# --- 5. Progress notes folded into .kanban/progress.md in landing order. ---
# Reuse serial test (tickets 1 and 2 landed in order).
PROGRESS_FILE="$TMPDIR/serial-land/.kanban/progress.md"
[ -f "$PROGRESS_FILE" ] || {
  echo "FAIL: .kanban/progress.md not found in serial-land repo" >&2
  exit 1
}

grep -q 'Lane-local progress for #1' "$PROGRESS_FILE" || {
  echo "FAIL: progress note for ticket 1 not in .kanban/progress.md" >&2
  cat "$PROGRESS_FILE" >&2
  exit 1
}
grep -q 'Lane-local progress for #2' "$PROGRESS_FILE" || {
  echo "FAIL: progress note for ticket 2 not in .kanban/progress.md" >&2
  cat "$PROGRESS_FILE" >&2
  exit 1
}
pos1="$(grep -n 'Lane-local progress for #1' "$PROGRESS_FILE" | head -1 | cut -d: -f1)"
pos2="$(grep -n 'Lane-local progress for #2' "$PROGRESS_FILE" | head -1 | cut -d: -f1)"
[ "$pos1" -lt "$pos2" ] || {
  echo "FAIL: ticket 1 progress note must appear before ticket 2 (got pos1=$pos1 pos2=$pos2)" >&2
  exit 1
}

printf '%s\n' 'tralph-landing-queue tests passed'
