#!/usr/bin/env bash
# Board-mode run identity, resume, and durable done in bin/gralph.
#
#   1. A slug run key works end to end: plan, execute, land. Manifest parent is
#      a JSON string, state lives in .gralph/runs/<slug>, branch is
#      gralph/<slug>/batch.
#   2. GitHub mode still requires a numeric parent; board mode rejects an
#      invalid slug.
#   3. Re-planning a run that already executed does NOT wipe its manifest;
#      --replan does.
#   4. Two slugs on one board keep independent state and branches.
#   5. A landed ticket tracked in the repo ends `status: done` on the target
#      branch after finish_board's ff-only merge, with the main working tree
#      untouched until then; a ticket outside the repo is updated in place.
#   6. Numeric keys (the existing tralph default `0`) are unchanged.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

command -v jq >/dev/null 2>&1 || { echo "FAIL: jq is required" >&2; exit 1; }

PASS=0
FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() {
  FAILN=$((FAILN + 1))
  echo "FAIL: $1" >&2
  [ -n "${2-}" ] && echo "  $2" >&2
}
expect_eq() { if [ "$2" = "$3" ]; then ok; else fail "$1" "want '$2' got '$3'"; fi; }

FAKE_BIN="$TMP/bin"
mkdir -p "$FAKE_BIN"
cat >"$FAKE_BIN/agent" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt="$(cat "${!#}")"
n="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+')"
printf 'done\n' >"out-$n.txt"
git add "out-$n.txt"
git commit -qm "feat: ticket $n"
printf 'RALPH_RESULT: DONE #%s\n' "$n"
EOF
chmod +x "$FAKE_BIN/agent"

new_repo() {
  REPO="$TMP/$1"
  rm -rf "$REPO"
  mkdir -p "$REPO"
  git -C "$REPO" init -q -b main
  git -C "$REPO" config user.name test
  git -C "$REPO" config user.email test@example.com
  echo init >"$REPO/README"
  git -C "$REPO" add README
  git -C "$REPO" commit -qm init
}

# ticket <issues-dir> <id> [spec]
ticket() {
  local dir="$1" id="$2" spec="${3-}"
  mkdir -p "$dir"
  {
    printf '%s\n' '---'
    printf 'id: %s\ntitle: Ticket %s\nstatus: pending\nlabels: [ready-for-agent]\n' "$id" "$id"
    printf 'blocked_by: []\ncreated: 2026-10-14\n'
    [ -z "$spec" ] || printf 'spec: %s\n' "$spec"
    printf '%s\n\n## What to build\n\nBuild %s.\n\n## Verification\n\n`test -f out-%s.txt`\n' '---' "$id" "$id"
  } >"$dir/$(printf '%03d' "$id")-t$id.md"
}

g() { # key args...
  local key="$1"
  shift
  (cd "$REPO" && PATH="$FAKE_BIN:$PATH" "$GRALPH" "$key" --board "$BOARD" "$@")
}

# --- 1. slug run key end to end ----------------------------------------------
new_repo slug
BOARD="$REPO/.kanban"
ticket "$BOARD/issues" 1
git -C "$REPO" add -A && git -C "$REPO" commit -qm board
g my-spec --dry-run --verify true >/dev/null 2>&1 && ok || fail "slug dry-run plans"
M="$REPO/.gralph/runs/my-spec/manifest.json"
[ -f "$M" ] && ok || fail "state dir is .gralph/runs/<slug>"
expect_eq "manifest parent is the JSON string" '"my-spec"' "$(jq -c '.parent' "$M")"
g my-spec --agent-cmd agent --jobs 1 --verify true >"$TMP/slug.out" 2>"$TMP/slug.err" && ok || fail "slug run executes" "$(tail -5 "$TMP/slug.err")"
expect_eq "ticket 1 landed" "landed" "$(jq -r '.children[0].merge.status' "$M")"
git -C "$REPO" show-ref --verify --quiet refs/heads/gralph/my-spec/batch && ok || fail "batch branch is gralph/<slug>/batch"
[ -f "$REPO/out-1.txt" ] && ok || fail "work reached main via finish_board"

# --- 5a. tracked ticket: done committed on the batch branch, reaches main ----
expect_eq "tracked ticket is status: done on main after the merge" "done" \
  "$(sed -n 's/^status: //p' "$BOARD/issues/001-t1.md" | head -1)"
git -C "$REPO" log --format=%s main | grep -q 'mark #1 done' && ok || fail "done is its own commit on the batch branch"
# No tracked file is left modified: the ff-only merge carried the done commit, and
# gralph never edited the main working tree. (run-report.md and .gralph/ are
# gralph's own untracked artifacts.)
[ -z "$(git -C "$REPO" status --porcelain --untracked-files=no)" ] && ok || fail "no tracked file left modified after merge" "$(git -C "$REPO" status --porcelain)"

# --- 2. validation ------------------------------------------------------------
new_repo valid
BOARD="$REPO/.kanban"
ticket "$BOARD/issues" 1
if g 'bad key!' --dry-run --verify true >/dev/null 2>"$TMP/bad.err"; then fail "invalid slug rejected"; else
  grep -q 'run key must match' "$TMP/bad.err" && ok || fail "invalid slug message" "$(cat "$TMP/bad.err")"
fi
if (cd "$REPO" && "$GRALPH" nope --dry-run >/dev/null 2>"$TMP/gh.err"); then fail "non-numeric parent without --board rejected"; else
  grep -q 'parent issue must be numeric' "$TMP/gh.err" && ok || fail "github mode keeps numeric-parent error" "$(cat "$TMP/gh.err")"
fi

# --- 3. re-plan keeps executed state; --replan discards it --------------------
new_repo resume
BOARD="$TMP/resume-board"
rm -rf "$BOARD"
ticket "$BOARD/issues" 1
ticket "$BOARD/issues" 2
g 0 --dry-run --verify true >/dev/null 2>&1
M="$REPO/.gralph/runs/0/manifest.json"
# Execute with an agent that fails ticket 2 so the batch is not merged-clean.
cat >"$FAKE_BIN/agent-half" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt="$(cat "${!#}")"
n="$(printf '%s' "$prompt" | grep -oE 'Ticket: #[0-9]+' | head -1 | grep -oE '[0-9]+')"
if [ "$n" = 2 ]; then printf 'RALPH_RESULT: FAIL #2\n'; exit 0; fi
printf 'done\n' >"out-$n.txt"; git add "out-$n.txt"; git commit -qm "feat: ticket $n"
printf 'RALPH_RESULT: DONE #%s\n' "$n"
EOF
chmod +x "$FAKE_BIN/agent-half"
g 0 --agent-cmd agent-half --jobs 1 --verify true >/dev/null 2>&1 || true
expect_eq "ticket 1 landed in the first run" "landed" "$(jq -r '.children[] | select(.number==1) | .merge.status' "$M")"
RUN_ID="$(jq -r '.orchestration.runId' "$M")"
# tralph's wrapper plans before every execute. That must not wipe the run.
g 0 --dry-run --verify true >"$TMP/replan.out" 2>&1 && ok || fail "re-plan succeeds"
grep -q 'Resumed parent' "$TMP/replan.out" && ok || fail "re-plan reports it resumed" "$(cat "$TMP/replan.out")"
expect_eq "re-plan kept landed state" "landed" "$(jq -r '.children[] | select(.number==1) | .merge.status' "$M")"
expect_eq "re-plan kept the run id" "$RUN_ID" "$(jq -r '.orchestration.runId' "$M")"
g 0 --dry-run --replan --verify true >/dev/null 2>&1 && ok || fail "--replan succeeds"
expect_eq "--replan discards saved state" "null" "$(jq -r '.children[] | select(.number==1) | .merge.status' "$M")"

# --- 4. two slugs, one board: independent state and branches ------------------
new_repo twoslug
BOARD="$REPO/.kanban"
ticket "$BOARD/issues" 1 alpha
ticket "$BOARD/issues" 2 beta
git -C "$REPO" add -A && git -C "$REPO" commit -qm board
g alpha --dry-run --verify true >/dev/null 2>&1 && g beta --dry-run --verify true >/dev/null 2>&1 && ok || fail "two slugs plan"
[ -f "$REPO/.gralph/runs/alpha/manifest.json" ] && [ -f "$REPO/.gralph/runs/beta/manifest.json" ] && ok || fail "separate state dirs"
expect_eq "alpha manifest parent" '"alpha"' "$(jq -c .parent "$REPO/.gralph/runs/alpha/manifest.json")"
expect_eq "beta manifest parent" '"beta"' "$(jq -c .parent "$REPO/.gralph/runs/beta/manifest.json")"

# --- 5b. ticket outside the repo is updated in place ---------------------------
new_repo outside
BOARD="$TMP/outside-board"
rm -rf "$BOARD"
ticket "$BOARD/issues" 1
g 0 --dry-run --verify true >/dev/null 2>&1
g 0 --agent-cmd agent --jobs 1 --verify true >/dev/null 2>&1 && ok || fail "outside-repo board run executes"
expect_eq "outside-repo ticket updated in place" "done" "$(sed -n 's/^status: //p' "$BOARD/issues/001-t1.md" | head -1)"

# --- 6. numeric key unchanged ---------------------------------------------------
new_repo numeric
BOARD="$REPO/.kanban"
ticket "$BOARD/issues" 1
git -C "$REPO" add -A && git -C "$REPO" commit -qm board
g 42 --dry-run --verify true >/dev/null 2>&1 && ok || fail "numeric key plans"
expect_eq "numeric manifest parent stays a number" "42" "$(jq -c .parent "$REPO/.gralph/runs/42/manifest.json")"

echo "gralph-board-runkey: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
