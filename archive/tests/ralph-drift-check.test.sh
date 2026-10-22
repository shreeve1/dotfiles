#!/usr/bin/env bash
# Runs the REAL .agents/skills/ralph/ralph-drift-check.sh against a fixture repo with a
# stub `pi`, to prove the driver-side drift check:
#   1. PASS / DRIFT verdicts come from the reviewer's final DRIFT_CHECK line
#   2. the reviewer is read-only by construction: --tools read,grep,find,ls and no
#      skills/context files; ticket, spec, ledger and diff arrive on stdin, so files the
#      reviewer cannot see on disk (uncommitted board, lane worktree) are still checked
#   3. a failing first model falls back to the second; both failing is DEGRADED
#   4. a ticket with no spec is SKIPPED without calling a reviewer; a spec the ticket
#      names but that is missing is an ERROR (never a silent skip)
#   5. a spec with no ledger (or a missing ledger file) still runs, spec-only, and says so
#   6. nothing in the worktree is ever reverted or deleted (another session's edits survive)
#   7. --spec-file names a spec in another checkout; its relative ledger: is resolved in
#      that checkout (a board lane reads the live, possibly uncommitted, ledger)
#   8. the script always exits 0 with a verdict line; callers read the final line

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECK="$ROOT/.agents/skills/ralph/ralph-drift-check.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PASS=0
FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() {
  FAILN=$((FAILN + 1))
  echo "FAIL: $1" >&2
  if [ -n "${2-}" ]; then echo "  $2" >&2; fi
}
expect_eq() { if [ "$2" = "$3" ]; then ok; else fail "$1" "want '$2' got '$3'"; fi; }
expect_has() { if printf '%s' "$3" | grep -qF -- "$2"; then ok; else fail "$1" "missing '$2'"; fi; }
expect_not() { if printf '%s' "$3" | grep -qF -- "$2"; then fail "$1" "unexpected '$2'"; else ok; fi; }

# --- stub pi -----------------------------------------------------------------
# Records its argv and stdin. Behaviour per model comes from $STUB_PLAN ("model=behaviour"):
#   pass | drift | fail (exit 1) | garbage (no sentinel) | dirty (writes a file, then PASS)
BIN="$TMP/bin"
mkdir -p "$BIN"
cat >"$BIN/pi" <<'EOF'
#!/usr/bin/env bash
model=""
printf '%s\n' "$*" >"$ARGV_LOG"
while [ $# -gt 0 ]; do
  case "$1" in
  --model) model="$2"; shift ;;
  esac
  shift
done
echo "$model" >>"$CALL_LOG"
cat >"$STDIN_LOG"
mode="$(sed -n "s|^$model=||p" "$STUB_PLAN" | head -1)"
case "$mode" in
pass) echo "No drift found."; echo "DRIFT_CHECK: PASS" ;;
drift)
  echo "1. src/a.txt:1 builds an export command; ledger D2 says 'no export in v1'."
  echo "DRIFT_CHECK: DRIFT"
  ;;
fail) echo "429 quota" >&2; exit 1 ;;
garbage) echo "I think it is fine" ;;
dirty) echo x >stray.txt; echo "DRIFT_CHECK: PASS" ;;
esac
EOF
chmod +x "$BIN/pi"
export PATH="$BIN:$PATH" CALL_LOG="$TMP/calls" STDIN_LOG="$TMP/stdin" ARGV_LOG="$TMP/argv" STUB_PLAN="$TMP/plan"
export RALPH_DRIFT_MODELS="m/one m/two"

# --- fixture -----------------------------------------------------------------
# new_repo SPEC_LINE LEDGER_LINE: ticket 1 (frontmatter SPEC_LINE), spec s1 (frontmatter
# LEDGER_LINE), a ledger, then one worker commit on top of BASE.
new_repo() {
  REPO="$TMP/repo-$RANDOM"
  mkdir -p "$REPO/.kanban/issues" "$REPO/.kanban/specs" "$REPO/.kanban/grilling" "$REPO/src"
  cd "$REPO"
  git init -q && git config user.email t@t && git config user.name t
  printf -- '---\nid: 1\nstatus: done\n%s\n---\n# Add list view\n' "$1" >.kanban/issues/001-list.md
  printf -- '---\nslug: s1\n%s\n---\n## Out of Scope\n- export\n' "$2" >.kanban/specs/s1.md
  printf '## Decisions\n- D2: no export in v1\n' >.kanban/grilling/topic.md
  git add -A && git commit -qm base
  BASE="$(git rev-parse HEAD)"
  echo "export-feature" >src/a.txt && git add -A && git commit -qm work
  HEAD_SHA="$(git rev-parse HEAD)"
}
run_check() { # extra args...
  RC=0
  : >"$CALL_LOG"
  : >"$STDIN_LOG"
  OUT="$(bash "$CHECK" "$@" .kanban/issues/001-list.md "$BASE" "$HEAD_SHA" 2>&1)" || RC=$?
  LAST="$(printf '%s\n' "$OUT" | tail -1)"
}

# 1 + 2: PASS; reviewer is tool-restricted and gets all context on stdin
new_repo 'spec: s1' 'ledger: .kanban/grilling/topic.md'
printf 'm/one=pass\n' >"$STUB_PLAN"
run_check
expect_eq "exit 0 on PASS" 0 "$RC"
expect_eq "PASS verdict" "DRIFT_CHECK: PASS" "$LAST"
expect_eq "only the first model ran" "m/one" "$(paste -sd' ' "$CALL_LOG")"
A="$(cat "$ARGV_LOG")"
expect_has "reviewer tools are read-only" "--tools read,grep,find,ls" "$A"
expect_has "reviewer loads no skills" "--no-skills" "$A"
expect_has "reviewer loads no context files" "--no-context-files" "$A"
S="$(cat "$STDIN_LOG")"
expect_has "stdin carries the ticket body" "# Add list view" "$S"
expect_has "stdin carries the spec" "## Out of Scope" "$S"
expect_has "stdin carries the ledger" "D2: no export in v1" "$S"
expect_has "stdin carries the diff" "+export-feature" "$S"
expect_has "stdin names the range" "$BASE..$HEAD_SHA" "$S"
expect_has "prompt says Defaults are advisory" "Defaults" "$S"

# 1: DRIFT, findings kept above the verdict
printf 'm/one=drift\n' >"$STUB_PLAN"
run_check
expect_eq "DRIFT verdict" "DRIFT_CHECK: DRIFT" "$LAST"
expect_has "DRIFT keeps the reviewer findings" "ledger D2 says 'no export in v1'" "$OUT"

# 3: first model fails, second answers
printf 'm/one=fail\nm/two=drift\n' >"$STUB_PLAN"
run_check
expect_eq "fallback model verdict" "DRIFT_CHECK: DRIFT" "$LAST"
expect_eq "both models tried in order" "m/one m/two" "$(paste -sd' ' "$CALL_LOG")"

# 3: no usable verdict from any model is DEGRADED, exit 0
printf 'm/one=fail\nm/two=garbage\n' >"$STUB_PLAN"
run_check
expect_eq "exit 0 when degraded" 0 "$RC"
expect_eq "DEGRADED verdict" "DRIFT_CHECK: DEGRADED" "$LAST"
expect_has "DEGRADED names the models tried" "m/one" "$OUT"

# 6: nothing is reverted: another session's dirty edit and a reviewer's stray file survive
printf 'keep me\n' >>src/a.txt
printf 'm/one=dirty\n' >"$STUB_PLAN"
run_check
expect_eq "verdict kept (no worktree heuristics)" "DRIFT_CHECK: PASS" "$LAST"
expect_has "another session's edit survives" "keep me" "$(cat src/a.txt)"
expect_not "no revert message" "changed the worktree" "$OUT"

# 2 + 7: spec and ledger live, uncommitted, in another checkout (the main tree of a lane)
new_repo 'spec: s1' 'ledger: .kanban/grilling/topic.md'
EXT="$TMP/main-$RANDOM"
mkdir -p "$EXT/.kanban/specs" "$EXT/.kanban/grilling"
git -C "$EXT" init -q
printf -- '---\nslug: s1\nledger: .kanban/grilling/new.md\n---\n## Out of Scope\n- external-spec-marker\n' >"$EXT/.kanban/specs/s1.md"
printf '## Decisions\n- external-ledger-marker\n' >"$EXT/.kanban/grilling/new.md"
printf 'm/one=pass\n' >"$STUB_PLAN"
run_check --spec-file "$EXT/.kanban/specs/s1.md"
expect_eq "explicit paths: PASS" "DRIFT_CHECK: PASS" "$LAST"
S="$(cat "$STDIN_LOG")"
expect_has "explicit spec used" "external-spec-marker" "$S"
expect_has "explicit ledger used" "external-ledger-marker" "$S"

# 4: no spec -> SKIPPED, no reviewer call
new_repo 'labels: [ready-for-agent]' 'ledger: .kanban/grilling/topic.md'
printf 'm/one=drift\n' >"$STUB_PLAN"
run_check
expect_eq "no spec is SKIPPED" "DRIFT_CHECK: SKIPPED" "$LAST"
expect_eq "no reviewer called without a spec" "" "$(cat "$CALL_LOG")"

# 4: spec named but missing -> ERROR, not SKIPPED
new_repo 'spec: s1' 'ledger: .kanban/grilling/topic.md'
rm .kanban/specs/s1.md
printf 'm/one=pass\n' >"$STUB_PLAN"
run_check
expect_eq "missing spec is ERROR" "DRIFT_CHECK: ERROR" "$LAST"
expect_eq "no reviewer called for a missing spec" "" "$(cat "$CALL_LOG")"

# 4: ticket file missing -> ERROR
rm .kanban/issues/001-list.md
run_check
expect_eq "missing ticket is ERROR" "DRIFT_CHECK: ERROR" "$LAST"

# 5: spec without ledger -> runs spec-only
new_repo 'spec: s1' 'created: 2026-10-20'
printf 'm/one=pass\n' >"$STUB_PLAN"
run_check
expect_eq "spec-only check still runs" "DRIFT_CHECK: PASS" "$LAST"
expect_has "prompt says there is no ledger" "No grill ledger" "$(cat "$STDIN_LOG")"

# 5: ledger named but missing on disk -> runs spec-only and says so
new_repo 'spec: s1' 'ledger: .kanban/grilling/gone.md'
printf 'm/one=pass\n' >"$STUB_PLAN"
run_check
expect_eq "missing ledger still runs" "DRIFT_CHECK: PASS" "$LAST"
expect_has "missing ledger reported" "ledger .kanban/grilling/gone.md is missing" "$OUT"

# quoting matches board.sh: only surrounding quotes are stripped
new_repo "spec: \"s1\"" 'ledger: ".kanban/grilling/topic.md"'
printf 'm/one=pass\n' >"$STUB_PLAN"
run_check
expect_eq "quoted spec and ledger values resolve" "DRIFT_CHECK: PASS" "$LAST"
expect_has "quoted ledger was read" "D2: no export in v1" "$(cat "$STDIN_LOG")"

echo "ralph-drift-check: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
