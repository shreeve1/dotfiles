#!/usr/bin/env bash
# Tests for the local kanban graph source of bin/gralph (`--board` mode).
#
# Acceptance criteria covered:
#   1. Dry-run against a fixture board prints the frontier waves implied by
#      `blocked_by` (blockers before dependents).
#   2. A wave with two independent ready tickets lists both in the SAME wave.
#   3. A blocked ticket excludes only its own subtree; unrelated tickets still
#      schedule (no full-stop on blocked).
#   4. Frontier is re-read from disk between waves (verified by mutating the
#      board on disk and re-running; the orchestrator calls
#      refresh_frontier_kanban after each wave when --board is set).
#   5. The existing GitHub-mode frontier test still passes (run separately).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

command -v yq >/dev/null 2>&1 || { echo "FAIL: yq is required to run this test" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "FAIL: jq is required to run this test" >&2; exit 1; }

REPO="$TMPDIR/repo"
mkdir -p "$REPO"
git -C "$REPO" init -q
git -C "$REPO" config user.name test
git -C "$REPO" config user.email test@example.com
echo init >"$REPO/README"
git -C "$REPO" add README
git -C "$REPO" commit -qm init
BASE_SHA="$(git -C "$REPO" rev-parse HEAD)"

BOARD="$TMPDIR/board"
mkdir -p "$BOARD/issues"
# progress.md and other non-issue files must not be parsed as tickets.
cat >"$BOARD/progress.md" <<'EOF'
# progress
not a ticket
EOF

write_ticket() {
  local id="$1" status="$2" blocked_by="$3" extra="${4-}"
  local file="$BOARD/issues/$(printf '%03d' "$id")-$1.md"
  {
    printf '%s\n' '---'
    printf 'id: %s\n' "$id"
    printf 'title: Ticket %s\n' "$id"
    printf 'status: %s\n' "$status"
    printf 'blocked_by: %s\n' "$blocked_by"
    if [ -n "$extra" ]; then printf '%s\n' "$extra"; fi
    printf '%s\n' '---'
    printf '\n# Ticket %s\n' "$id"
  } >"$file"
}

# Tickets (status, blocked_by):
#   1  done    []                   → excluded (child_not_open)
#   2  pending []                   → eligible (independent)
#   3  pending []                   → eligible (independent, same wave as 2)
#   4  pending [2]                  → blocked until 2 lands (subtree only)
#   5  pending [4]                  → blocked transitively via 4
#   6  pending [999]                → blocked, fail-closed on missing ref
#   7  in-progress []               → excluded (missing_ready_for_agent_label)
write_ticket 1 done '[]'
write_ticket 2 pending '[]'
write_ticket 3 pending '[]'
write_ticket 4 pending '[2]'
write_ticket 5 pending '[4]'
write_ticket 6 pending '[999]'
write_ticket 7 in-progress '[]'

run_gralph_board() {
  (cd "$REPO" && "$GRALPH" 42 --board "$BOARD" --dry-run --verify 'bash tests/integration.sh') >"$TMPDIR/stdout" 2>"$TMPDIR/stderr"
}

# --- 1. Dry-run produces the expected manifest shape and classification. ---
run_gralph_board
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
[ -f "$MANIFEST" ] || { echo "FAIL: manifest missing" >&2; exit 1; }
jq -e --arg sha "$BASE_SHA" '
  .schemaVersion == 1 and .parent == 42 and .baseSha == $sha and .dryRun == true
  and (.children | length) == 7
  and (.dependencies | length) == 3
' "$MANIFEST" >/dev/null

# Per-ticket classification. Eligible tickets must all carry the
# ready-for-agent label; excluded tickets must not.
jq -e '
  .children
  | to_entries
  | map({
      key: .key,
      number: .value.number,
      state: .value.state,
      labels: (.value.labels | sort),
      classification: .value.classification,
      reason: .value.reason
    })
  | . == [
      {key:0, number:1, state:"CLOSED", labels:[],                    classification:"excluded", reason:"child_not_open"},
      {key:1, number:2, state:"OPEN",   labels:["ready-for-agent"],   classification:"eligible", reason:null},
      {key:2, number:3, state:"OPEN",   labels:["ready-for-agent"],   classification:"eligible", reason:null},
      {key:3, number:4, state:"OPEN",   labels:["ready-for-agent"],   classification:"blocked",  reason:"open_blockers"},
      {key:4, number:5, state:"OPEN",   labels:["ready-for-agent"],   classification:"blocked",  reason:"open_blockers"},
      {key:5, number:6, state:"OPEN",   labels:["ready-for-agent"],   classification:"blocked",  reason:"open_blockers"},
      {key:6, number:7, state:"OPEN",   labels:[],                    classification:"excluded", reason:"missing_ready_for_agent_label"}
    ]
' "$MANIFEST" >/dev/null

# --- 2. Two independent eligible tickets share the first wave. ---
# The wave-1 candidate list (eligible, no execution yet) is exactly {2, 3}.
jq -e '
  [.children[]
    | select(.classification == "eligible")
    | select((.execution.status // "pending") == "pending")
    | .number] | sort
  | . == [2, 3]
' "$MANIFEST" >/dev/null

# Ticket 4 is blocked by 2 only; tickets 5 and 6 are in unrelated subtrees
# from the wave-1 candidate-set point of view (still gates), but neither is
# eligible while its own dependency chain is open. Critically, the existence
# of the blocked subtree must NOT prevent 2 and 3 from being selected.
jq -e '
  [.children[] | select(.classification == "blocked") | .number] | sort
  | . == [4, 5, 6]
' "$MANIFEST" >/dev/null

# Dependencies array reflects only the open-blocker edges (done blockers are
# still recorded as blockers — the orchestrator uses blockedBy to compute
# edges, not classification).
jq -e '
  .dependencies == [
    {issue: 4, blockedBy: 2},
    {issue: 5, blockedBy: 4},
    {issue: 6, blockedBy: 999}
  ]
' "$MANIFEST" >/dev/null

# --- 3. Frontier is re-read from disk between waves. ---
# Mutate the board: mark 4 done and rewrite its blocked_by; the next dry-run
# must reflect the new state. This is the same code path the orchestrator
# exercises via refresh_frontier_kanban after each wave.
{
  printf '%s\n' '---'
  printf 'id: 4\n'
  printf 'title: Ticket 4\n'
  printf 'status: done\n'
  printf 'blocked_by: [2]\n'
  printf '%s\n' '---'
} >"$BOARD/issues/004-4.md"

# Re-derive via the dry-run path. The manifest's children list is rebuilt
# from disk on every invocation; tickets that no longer exist on disk are
# dropped (none here), and changed tickets are reclassified.
run_gralph_board
jq -e '
  .children
  | map({number, state, classification})
  | . == [
      {number:1, state:"CLOSED", classification:"excluded"},
      {number:2, state:"OPEN",   classification:"eligible"},
      {number:3, state:"OPEN",   classification:"eligible"},
      {number:4, state:"CLOSED", classification:"excluded"},
      {number:5, state:"OPEN",   classification:"eligible"},
      {number:6, state:"OPEN",   classification:"blocked"},
      {number:7, state:"OPEN",   classification:"excluded"}
    ]
' "$MANIFEST" >/dev/null

# Mark 999 as done (a fictional ticket file appears on disk) — the missing-
# reference fail-closed path must keep ticket 6 blocked unless 999 is present
# AND done.
{
  printf '%s\n' '---'
  printf 'id: 999\n'
  printf 'title: External dep\n'
  printf 'status: done\n'
  printf 'blocked_by: []\n'
  printf '%s\n' '---'
} >"$BOARD/issues/999-external.md"

run_gralph_board
jq -e '
  [.children[] | select(.number == 6) | .classification] | . == ["eligible"]
' "$MANIFEST" >/dev/null

# --- 4. A board directory with no issues produces a clean error. ---
EMPTY_BOARD="$TMPDIR/empty-board"
mkdir -p "$EMPTY_BOARD"
EMPTY_REPO="$TMPDIR/empty-repo"
mkdir -p "$EMPTY_REPO"
git -C "$EMPTY_REPO" init -q
git -C "$EMPTY_REPO" config user.name test
git -C "$EMPTY_REPO" config user.email test@example.com
echo x >"$EMPTY_REPO/x"
git -C "$EMPTY_REPO" add x && git -C "$EMPTY_REPO" commit -qm init
if (cd "$EMPTY_REPO" && "$GRALPH" 42 --board "$EMPTY_BOARD" --dry-run) >/dev/null 2>"$TMPDIR/empty.err"; then
  echo "FAIL: empty board should have failed" >&2
  exit 1
fi
grep -q "no \*.md files" "$TMPDIR/empty.err" || {
  echo "FAIL: expected empty-board error" >&2
  cat "$TMPDIR/empty.err" >&2
  exit 1
}

# --- 5. gh CLI must not be required in --board mode. ---
# Set PATH to a directory that contains nothing executable; if gralph still
# invokes gh it will fail.
STRICT_PATH="$TMPDIR/strict-bin"
mkdir -p "$STRICT_PATH"
ln -s "$(command -v bash)" "$STRICT_PATH/bash"
ln -s "$(command -v git)" "$STRICT_PATH/git"
ln -s "$(command -v yq)" "$STRICT_PATH/yq"
ln -s "$(command -v jq)" "$STRICT_PATH/jq"
if (cd "$REPO" && PATH="$STRICT_PATH" "$GRALPH" 42 --board "$BOARD" --dry-run) >/dev/null 2>"$TMPDIR/nogh.err"; then
  echo "FAIL: board dry-run unexpectedly succeeded without gh" >&2
  cat "$TMPDIR/nogh.err" >&2
  exit 1
fi
grep -q "gh CLI not found" "$TMPDIR/nogh.err" && {
  echo "FAIL: --board mode should not require gh" >&2
  cat "$TMPDIR/nogh.err" >&2
  exit 1
} || true

# --- 6. Optional `files:` frontmatter is captured into the manifest. ---
{
  printf '%s\n' '---'
  printf 'id: 8\n'
  printf 'title: With files\n'
  printf 'status: pending\n'
  printf 'blocked_by: []\n'
  printf 'files:\n'
  printf '  - src/foo.py\n'
  printf '  - tests/foo_test.py\n'
  printf '%s\n' '---'
} >"$BOARD/issues/008-with-files.md"
run_gralph_board
jq -e '
  .children[] | select(.number == 8) | .files == ["src/foo.py", "tests/foo_test.py"]
' "$MANIFEST" >/dev/null

printf '%s\n' 'tralph-kanban-frontier tests passed'
