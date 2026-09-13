#!/usr/bin/env bash
# Tests for scope-aware scheduling and out-of-scope landing bounce.
#
# Acceptance criteria covered:
#   1. Two ready tickets with overlapping files: run in different waves
#      (serialized); with disjoint scopes they share a wave.
#   2. A lane diff outside its declared scope bounces at landing with the
#      offending paths in the bounce reason.
#   3. Tickets without files: behave exactly as before (no scope check at
#      scheduling or landing).

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
    "$GRALPH" 42 --board "$BOARD" --dry-run --verify 'true') >/dev/null
}

# =============================================================================
# --- 1. Overlapping scopes serialize; disjoint scopes share a wave. ---
#
# Wave building only (dry-run to inspect classification, then a live run with
# an agent that writes inside each ticket's declared scope so landing passes).
# =============================================================================

BOARD="$TMPDIR/board-sched"
mkdir -p "$BOARD/issues"

# Tickets 1 and 2 share src/shared/ → overlapping → wave-serialized.
# Ticket 3 has disjoint scope (src/only3/) → same wave as ticket 1.
# Ticket 4 has no scope → same wave as ticket 1.
cat >"$BOARD/issues/001-1.md" <<'EOF'
---
id: 1
title: Ticket 1
status: pending
blocked_by: []
files:
  - src/shared/
  - src/only1/
---

## What to build

Build ticket 1.

## Verification

`true`
EOF

cat >"$BOARD/issues/002-2.md" <<'EOF'
---
id: 2
title: Ticket 2
status: pending
blocked_by: []
files:
  - src/shared/
  - src/only2/
---

## What to build

Build ticket 2.

## Verification

`true`
EOF

cat >"$BOARD/issues/003-3.md" <<'EOF'
---
id: 3
title: Ticket 3
status: pending
blocked_by: []
files:
  - src/only3/
---

## What to build

Build ticket 3.

## Verification

`true`
EOF

cat >"$BOARD/issues/004-4.md" <<'EOF'
---
id: 4
title: Ticket 4
status: pending
blocked_by: []
---

## What to build

Build ticket 4.

## Verification

`true`
EOF

REPO="$TMPDIR/sched-repo"
new_repo "$REPO"
: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO"

MANIFEST="$REPO/.gralph/runs/42/manifest.json"
[ -f "$MANIFEST" ] || { echo "FAIL: manifest missing after plan" >&2; exit 1; }

# Verify files: fields are captured.
jq -e '
  (.children[] | select(.number == 1) | .files) == ["src/shared/", "src/only1/"]
' "$MANIFEST" >/dev/null || { echo "FAIL: files scope not captured for ticket 1" >&2; exit 1; }
jq -e '
  (.children[] | select(.number == 2) | .files) == ["src/shared/", "src/only2/"]
' "$MANIFEST" >/dev/null || { echo "FAIL: files scope not captured for ticket 2" >&2; exit 1; }
jq -e '
  (.children[] | select(.number == 4) | .files) == null
' "$MANIFEST" >/dev/null || { echo "FAIL: ticket 4 should have null files" >&2; exit 1; }

# Live run with a scoped agent: each ticket writes only within its own scope dir.
# Agent writes src/sharedN.txt for the shared path (within src/shared/)
# and src/onlyN/output.txt for its exclusive path.
cat >"$FAKE_BIN/agent-scoped-sched" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt_file="${!#}"
prompt="$(cat "$prompt_file")"
printf '%s\n' "$prompt" >>"$PROMPT_LOG"
ticket_num="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
printf '%s\n' "agent-scoped-sched ticket=$ticket_num" >>"$AGENT_LOG"
printf '# Lane-local progress for #%s\n\nDone.\n' "$ticket_num" >".ralph-progress-$ticket_num.md"
git add ".ralph-progress-$ticket_num.md"
# Write into scope-specific directories (tickets 1-3 have scopes, 4 doesn't).
if [ "$ticket_num" = "1" ] || [ "$ticket_num" = "2" ]; then
  mkdir -p "src/shared" "src/only$ticket_num"
  printf 'ticket%s\n' "$ticket_num" >"src/shared/file$ticket_num.txt"
  printf 'output\n' >"src/only$ticket_num/output.txt"
  git add "src/shared/file$ticket_num.txt" "src/only$ticket_num/output.txt"
elif [ "$ticket_num" = "3" ]; then
  mkdir -p "src/only3"
  printf 'output\n' >"src/only3/output.txt"
  git add "src/only3/output.txt"
else
  # Ticket 4: no scope, write anywhere
  printf 'output\n' >"worker-output-$ticket_num.txt"
  git add "worker-output-$ticket_num.txt"
fi
git commit -qm "feat(board): ticket $ticket_num"
printf 'RALPH_RESULT: DONE #%s\n' "$ticket_num"
EOF
chmod +x "$FAKE_BIN/agent-scoped-sched"

: >"$AGENT_LOG" >"$PROMPT_LOG"
if ! run_gralph_board "$REPO" --agent-cmd agent-scoped-sched --jobs 4 --verify 'true' \
  >"$TMPDIR/sched-stdout.log" 2>"$TMPDIR/sched-stderr.log"; then
  echo "FAIL: orchestration failed" >&2
  cat "$TMPDIR/sched-stderr.log" >&2
  exit 1
fi

MANIFEST="$REPO/.gralph/runs/42/manifest.json"

# All four tickets should land.
jq -e '
  [.children[] | select(.merge.status == "landed") | .number] | sort
  | . == [1, 2, 3, 4]
' "$MANIFEST" >/dev/null || {
  echo "FAIL: not all tickets landed" >&2
  jq '[.children[] | {number, merge_status:.merge.status, merge_reason:.merge.reason}]' "$MANIFEST" >&2
  cat "$TMPDIR/sched-stderr.log" >&2
  exit 1
}

# Wave log: ticket 2 must NOT share a wave with ticket 1.
wave_of_1="$(jq -r '[.orchestration.waveLog[] | select(.children | index(1)) | .wave][0]' "$MANIFEST")"
wave_of_2="$(jq -r '[.orchestration.waveLog[] | select(.children | index(2)) | .wave][0]' "$MANIFEST")"
if [ "$wave_of_1" = "$wave_of_2" ]; then
  echo "FAIL: tickets 1 and 2 (overlapping scopes) ended up in the same wave" >&2
  jq '.orchestration.waveLog' "$MANIFEST" >&2
  exit 1
fi

# Ticket 2 must be in a strictly later wave than ticket 1.
if [ "$wave_of_2" -le "$wave_of_1" ] 2>/dev/null; then
  echo "FAIL: ticket 2 should be in a later wave than ticket 1" >&2
  jq '.orchestration.waveLog' "$MANIFEST" >&2
  exit 1
fi

# Tickets 3 (disjoint scope) and 4 (no scope) must share wave 1 with ticket 1.
has_3_wave1="$(jq -r --argjson w "$wave_of_1" '.orchestration.waveLog[] | select(.wave == ($w|tonumber)) | .children | map(. == 3) | any' "$MANIFEST")"
has_4_wave1="$(jq -r --argjson w "$wave_of_1" '.orchestration.waveLog[] | select(.wave == ($w|tonumber)) | .children | map(. == 4) | any' "$MANIFEST")"
if [ "$has_3_wave1" != "true" ] || [ "$has_4_wave1" != "true" ]; then
  echo "FAIL: tickets 3 (disjoint scope) and 4 (no scope) should share wave 1 with ticket 1" >&2
  jq '.orchestration.waveLog' "$MANIFEST" >&2
  exit 1
fi

# =============================================================================
# --- 2. Out-of-scope diff bounces at landing with offending paths named. ---
# =============================================================================

BOARD="$TMPDIR/board-landing"
mkdir -p "$BOARD/issues"

# Ticket 10: scope is src/ticket10/ only; agent stays in scope.
cat >"$BOARD/issues/010-10.md" <<'EOF'
---
id: 10
title: Ticket 10
status: pending
blocked_by: []
files:
  - src/ticket10/
---

## What to build

Build ticket 10.

## Verification

`true`
EOF

# Ticket 11: scope is src/ticket11/ only; agent will also write an extra out-of-scope file.
cat >"$BOARD/issues/011-11.md" <<'EOF'
---
id: 11
title: Ticket 11
status: pending
blocked_by: []
files:
  - src/ticket11/
---

## What to build

Build ticket 11.

## Verification

`true`
EOF

REPO="$TMPDIR/landing-repo"
new_repo "$REPO"
: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO"

# Dispatcher: ticket 10 stays in scope; ticket 11 also writes an extra OOS file.
cat >"$FAKE_BIN/agent-dispatch-landing" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt_file="${!#}"
prompt="$(cat "$prompt_file")"
printf '%s\n' "$prompt" >>"$PROMPT_LOG"
ticket_num="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
printf '%s\n' "agent ticket=$ticket_num" >>"$AGENT_LOG"
printf '# Lane-local progress for #%s\n\nDone.\n' "$ticket_num" >".ralph-progress-$ticket_num.md"
mkdir -p "src/ticket$ticket_num"
printf 'output\n' >"src/ticket$ticket_num/output.txt"
git add ".ralph-progress-$ticket_num.md" "src/ticket$ticket_num/output.txt"
if [ "$ticket_num" = "11" ]; then
  # Out-of-scope extra file (outside src/ticket11/).
  printf 'oops\n' >"extra-oos-11.txt"
  git add "extra-oos-11.txt"
fi
git commit -qm "feat(board): ticket $ticket_num"
printf 'RALPH_RESULT: DONE #%s\n' "$ticket_num"
EOF
chmod +x "$FAKE_BIN/agent-dispatch-landing"

# A bounce is a soft outcome so orchestrator exits 0.
run_gralph_board "$REPO" --agent-cmd agent-dispatch-landing --jobs 1 --verify 'true' \
  >"$TMPDIR/landing-stdout.log" 2>"$TMPDIR/landing-stderr.log" || true

MANIFEST="$REPO/.gralph/runs/42/manifest.json"

jq -e '
  (.children[] | select(.number == 10) | .merge.status) == "landed"
' "$MANIFEST" >/dev/null || {
  echo "FAIL: ticket 10 (in-scope) should have landed" >&2
  jq '.children[] | select(.number == 10)' "$MANIFEST" >&2
  exit 1
}

jq -e '
  (.children[] | select(.number == 11) | .merge.status) == "bounced"
' "$MANIFEST" >/dev/null || {
  echo "FAIL: ticket 11 (out-of-scope diff) should have bounced" >&2
  jq '.children[] | select(.number == 11)' "$MANIFEST" >&2
  cat "$TMPDIR/landing-stderr.log" >&2
  exit 1
}

jq -e '
  (.children[] | select(.number == 11) | .merge.reason) == "out_of_scope"
' "$MANIFEST" >/dev/null || { echo "FAIL: ticket 11 bounce reason should be out_of_scope" >&2; exit 1; }

jq -e '
  (.children[] | select(.number == 11) | .merge.outOfScopePaths | length > 0)
' "$MANIFEST" >/dev/null || { echo "FAIL: ticket 11 bounce should record the offending paths" >&2; exit 1; }

jq -e '
  (.children[] | select(.number == 11) | .merge.outOfScopePaths | any(startswith("extra-oos-")))
' "$MANIFEST" >/dev/null || { echo "FAIL: extra-oos file not listed in outOfScopePaths" >&2; exit 1; }

# A repair ticket was created.
REPAIR_FILES="$(find "$BOARD/issues" -name '*repair*' -name '*.md' 2>/dev/null || true)"
[ -n "$REPAIR_FILES" ] || { echo "FAIL: no repair ticket created for bounced lane" >&2; exit 1; }

# Stderr mentions the bounce.
grep -q "bounced lane\|out_of_scope\|outside declared scope" "$TMPDIR/landing-stderr.log" || {
  echo "FAIL: stderr did not mention out-of-scope bounce" >&2
  cat "$TMPDIR/landing-stderr.log" >&2
  exit 1
}

# =============================================================================
# --- 3. Tickets without files: behave exactly as before (no scope check). ---
# =============================================================================

BOARD="$TMPDIR/board-noscope"
mkdir -p "$BOARD/issues"

cat >"$BOARD/issues/020-20.md" <<'EOF'
---
id: 20
title: Ticket 20
status: pending
blocked_by: []
---

## What to build

Build ticket 20.

## Verification

`true`
EOF

cat >"$BOARD/issues/021-21.md" <<'EOF'
---
id: 21
title: Ticket 21
status: pending
blocked_by: []
---

## What to build

Build ticket 21.

## Verification

`true`
EOF

REPO="$TMPDIR/noscope-repo"
new_repo "$REPO"
: >"$AGENT_LOG" >"$PROMPT_LOG"
plan_board "$REPO"

# Agent writes files anywhere (no scope check expected).
cat >"$FAKE_BIN/agent-noscope" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt_file="${!#}"
prompt="$(cat "$prompt_file")"
ticket_num="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
printf '# Lane-local progress for #%s\n\nDone.\n' "$ticket_num" >".ralph-progress-$ticket_num.md"
printf 'output\n' >"worker-output-$ticket_num.txt"
git add ".ralph-progress-$ticket_num.md" "worker-output-$ticket_num.txt"
git commit -qm "feat(board): ticket $ticket_num"
printf 'RALPH_RESULT: DONE #%s\n' "$ticket_num"
EOF
chmod +x "$FAKE_BIN/agent-noscope"

if ! run_gralph_board "$REPO" --agent-cmd agent-noscope --jobs 2 --verify 'true' \
  >"$TMPDIR/noscope-stdout.log" 2>"$TMPDIR/noscope-stderr.log"; then
  echo "FAIL: no-scope orchestration failed" >&2
  cat "$TMPDIR/noscope-stderr.log" >&2
  exit 1
fi

MANIFEST="$REPO/.gralph/runs/42/manifest.json"

jq -e '
  [.children[] | select(.merge.status == "landed") | .number] | sort
  | . == [20, 21]
' "$MANIFEST" >/dev/null || { echo "FAIL: both no-scope tickets should have landed" >&2; exit 1; }

# Both must be in the same (first) wave.
has_20_wave1="$(jq -r '.orchestration.waveLog[0].children | map(. == 20) | any' "$MANIFEST")"
has_21_wave1="$(jq -r '.orchestration.waveLog[0].children | map(. == 21) | any' "$MANIFEST")"
if [ "$has_20_wave1" != "true" ] || [ "$has_21_wave1" != "true" ]; then
  echo "FAIL: no-scope tickets 20 and 21 should share the same wave" >&2
  jq '.orchestration.waveLog' "$MANIFEST" >&2
  exit 1
fi

printf '%s\n' 'tralph-scopes tests passed'
