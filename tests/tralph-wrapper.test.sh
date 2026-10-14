#!/usr/bin/env bash
# Exercises the real `tralph` zsh function from .zshrc with stub drivers that
# record the exact arguments they receive, so we know what the wrapper passes on.
#
#   1. sequential (--jobs 1 / default): ralph-loop.sh gets --spec SLUG; other
#      flags pass through; --replan is not forwarded
#   2. board mode (--jobs N>=2), no --spec: run key 0, no --spec, plan then execute
#   3. board mode with --spec SLUG: run key is the slug, --spec forwarded to BOTH
#      the plan and the execute call, in that order
#   4. --replan reaches the plan call only
#   5. --spec validation rejects bad slugs and a missing value
#   6. board mode without a .kanban dir fails before calling gralph

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZSHRC="$ROOT/.zshrc"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

command -v zsh >/dev/null 2>&1 || { echo "SKIP: zsh not available"; exit 0; }

PASS=0
FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() {
  FAILN=$((FAILN + 1))
  echo "FAIL: $1" >&2
  if [ -n "${2-}" ]; then echo "  $2" >&2; fi
}
expect_eq() { if [ "$2" = "$3" ]; then ok; else fail "$1" "want '$2' got '$3'"; fi; }

# Fake HOME with a stub ralph-loop.sh, fake DOTFILES_DIR with a stub gralph.
FAKE_HOME="$TMP/home"
FAKE_DOT="$TMP/dot"
mkdir -p "$FAKE_HOME/.agents/skills/ralph" "$FAKE_DOT/bin"
LOG="$TMP/calls.log"
cat >"$FAKE_HOME/.agents/skills/ralph/ralph-loop.sh" <<EOF
#!/usr/bin/env bash
echo "LOOP \$*" >>"$LOG"
EOF
cat >"$FAKE_DOT/bin/gralph" <<EOF
#!/usr/bin/env bash
echo "GRALPH \$*" >>"$LOG"
EOF
chmod +x "$FAKE_HOME/.agents/skills/ralph/ralph-loop.sh" "$FAKE_DOT/bin/gralph"

WORK="$TMP/work"
mkdir -p "$WORK/.kanban/issues"

# tralph <args...>: run in $WORK with the stubs wired in; echo exit code.
tralph_run() {
  : >"$LOG"
  (cd "$WORK" && HOME="$FAKE_HOME" DOTFILES_DIR="$FAKE_DOT" zsh -c '
    source "$1" >/dev/null 2>&1
    shift
    tralph "$@"' _ "$ZSHRC" "$@") >"$TMP/out" 2>"$TMP/err"
}
calls() { cat "$LOG"; }
line() { sed -n "${1}p" "$LOG"; }

# --- 1. sequential -----------------------------------------------------------
tralph_run --spec alpha --force omp mysess && ok || fail "sequential call succeeds" "$(cat "$TMP/err")"
expect_eq "sequential: one loop call" "1" "$(grep -c '^LOOP' "$LOG")"
expect_eq "sequential: --spec first, other flags pass through" "LOOP --spec alpha --force omp mysess" "$(line 1)"
tralph_run --force && ok || fail "sequential no-spec succeeds"
expect_eq "sequential without --spec adds nothing" "LOOP --force" "$(line 1)"
tralph_run --spec alpha --replan --force && ok || fail "sequential with --replan succeeds"
expect_eq "sequential: --replan is not forwarded to ralph-loop" "LOOP --spec alpha --force" "$(line 1)"
tralph_run --jobs 1 --spec alpha && ok || fail "--jobs 1 is sequential"
expect_eq "--jobs 1 uses ralph-loop" "LOOP --spec alpha" "$(line 1)"

# --- 2. board mode, no spec --------------------------------------------------
tralph_run --jobs 2 --verify 'make test' --agent-cmd 'myagent -p' && ok || fail "board call succeeds" "$(cat "$TMP/err")"
expect_eq "board: plan then execute, two gralph calls" "2" "$(grep -c '^GRALPH' "$LOG")"
expect_eq "board no-spec: plan call" "GRALPH 0 --board .kanban --dry-run --verify make test" "$(line 1)"
expect_eq "board no-spec: execute call" "GRALPH 0 --board .kanban --jobs 2 --verify make test --agent-cmd myagent -p" "$(line 2)"

# --- 3. board mode with --spec ----------------------------------------------
tralph_run --jobs 3 --spec my-spec --verify true --agent-cmd agent && ok || fail "board --spec call succeeds" "$(cat "$TMP/err")"
expect_eq "board --spec: plan call uses slug key + filter" "GRALPH my-spec --board .kanban --spec my-spec --dry-run --verify true" "$(line 1)"
expect_eq "board --spec: execute call uses slug key + filter" "GRALPH my-spec --board .kanban --spec my-spec --jobs 3 --verify true --agent-cmd agent" "$(line 2)"
grep -q -- '--replan' "$LOG" && fail "no --replan unless asked" "$(calls)" || ok

# --- 4. --replan -------------------------------------------------------------
tralph_run --jobs 2 --spec my-spec --replan --verify true --agent-cmd agent && ok || fail "board --replan call succeeds"
expect_eq "--replan reaches the plan call" "GRALPH my-spec --board .kanban --spec my-spec --replan --dry-run --verify true" "$(line 1)"
case "$(line 2)" in *--replan*) fail "--replan must not reach the execute call" "$(line 2)" ;; *) ok ;; esac

# --- 5. validation -----------------------------------------------------------
# A purely numeric slug collides with gralph's numeric run keys (0 is the whole-board
# key, same .gralph/runs/0 and gralph/0/batch) and picks the wrong run-report name
# (review finding 10), so it is rejected along with the other bad slugs.
for bad in 'bad slug' '-lead' 'has/slash' '.dot' '0' '123' '007'; do
  if tralph_run --jobs 2 --spec "$bad"; then fail "bad slug '$bad' rejected"; else ok; fi
  grep -q 'requires a slug' "$TMP/err" && ok || fail "bad slug '$bad' message" "$(cat "$TMP/err")"
  expect_eq "bad slug '$bad' never calls a driver" "0" "$(wc -l <"$LOG" | tr -d ' ')"
done
if tralph_run --spec; then fail "--spec with no value rejected"; else ok; fi
if tralph_run --spec --jobs 2; then fail "--spec followed by a flag rejected"; else ok; fi

# --- 6. no .kanban in board mode ---------------------------------------------
mv "$WORK/.kanban" "$WORK/.kanban.off"
if tralph_run --jobs 2 --spec x; then fail "board mode without .kanban fails"; else ok; fi
grep -q 'no .kanban directory' "$TMP/err" && ok || fail "missing .kanban message" "$(cat "$TMP/err")"
expect_eq "no gralph call without a board" "0" "$(wc -l <"$LOG" | tr -d ' ')"
mv "$WORK/.kanban.off" "$WORK/.kanban"

echo "tralph-wrapper: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
