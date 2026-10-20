#!/usr/bin/env bash
# Runs the REAL .agents/skills/ralph/ralph-drift-check.sh against a fixture repo with a
# stub `pi`, to prove the driver-side drift check:
#   1. PASS / DRIFT verdicts come from the reviewer's final DRIFT_CHECK line
#   2. the prompt names the ticket, spec, ledger and the base..head range
#   3. a failing first model falls back to the second; both failing is DEGRADED
#   4. a ticket with no spec is SKIPPED without calling a reviewer
#   5. a spec with no ledger (or a missing ledger file) still runs, spec-only
#   6. a reviewer that changes the worktree has its verdict discarded
#   7. the script always exits 0; callers read the final line

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

# --- stub pi -----------------------------------------------------------------
# Behaviour per model comes from $STUB_PLAN (lines "model=behaviour"):
#   pass | drift | fail (exit 1) | garbage (no sentinel) | dirty (writes a file, then PASS)
BIN="$TMP/bin"
mkdir -p "$BIN"
cat >"$BIN/pi" <<'EOF'
#!/usr/bin/env bash
model="" prompt=""
while [ $# -gt 0 ]; do
  case "$1" in
  --model) model="$2"; shift ;;
  -p) prompt="$2"; shift ;;
  esac
  shift
done
echo "$model" >>"$CALL_LOG"
printf '%s\n' "$prompt" >"$PROMPT_LOG"
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
export PATH="$BIN:$PATH" CALL_LOG="$TMP/calls" PROMPT_LOG="$TMP/prompt" STUB_PLAN="$TMP/plan"
export RALPH_DRIFT_MODELS="m/one m/two"

# --- fixture -----------------------------------------------------------------
# new_repo SPEC_LINE LEDGER_LINE: a repo with ticket 1 (frontmatter SPEC_LINE), spec s1
# (frontmatter LEDGER_LINE) and a ledger file, plus one worker commit on top of BASE.
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
  echo a >src/a.txt && git add -A && git commit -qm work
  HEAD_SHA="$(git rev-parse HEAD)"
  : >"$CALL_LOG"
  : >"$PROMPT_LOG"
}
run_check() {
  RC=0
  : >"$CALL_LOG"
  OUT="$(bash "$CHECK" .kanban/issues/001-list.md "$BASE" "$HEAD_SHA" 2>&1)" || RC=$?
  LAST="$(printf '%s\n' "$OUT" | tail -1)"
}

# 1 + 2: PASS on the first model; prompt carries the context paths and the range
new_repo 'spec: s1' 'ledger: .kanban/grilling/topic.md'
printf 'm/one=pass\n' >"$STUB_PLAN"
run_check
expect_eq "exit 0 on PASS" 0 "$RC"
expect_eq "PASS verdict" "DRIFT_CHECK: PASS" "$LAST"
expect_eq "only the first model ran" "m/one" "$(paste -sd' ' "$CALL_LOG")"
P="$(cat "$PROMPT_LOG")"
expect_has "prompt names the ticket" ".kanban/issues/001-list.md" "$P"
expect_has "prompt names the spec" ".kanban/specs/s1.md" "$P"
expect_has "prompt names the ledger" ".kanban/grilling/topic.md" "$P"
expect_has "prompt names the diff range" "git diff $BASE $HEAD_SHA" "$P"

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

# 6: a reviewer that dirties the tree is discarded; the next model decides
printf 'm/one=dirty\nm/two=drift\n' >"$STUB_PLAN"
run_check
expect_eq "dirtying reviewer discarded" "DRIFT_CHECK: DRIFT" "$LAST"
expect_has "dirtying reviewer reported" "changed the worktree" "$OUT"

# 4: no spec -> SKIPPED, no reviewer call
new_repo 'labels: [ready-for-agent]' 'ledger: .kanban/grilling/topic.md'
printf 'm/one=drift\n' >"$STUB_PLAN"
run_check
expect_eq "no spec is SKIPPED" "DRIFT_CHECK: SKIPPED" "$LAST"
expect_eq "no reviewer called without a spec" "" "$(cat "$CALL_LOG")"

# 5: spec without ledger -> runs spec-only
new_repo 'spec: s1' 'created: 2026-10-20'
printf 'm/one=pass\n' >"$STUB_PLAN"
run_check
expect_eq "spec-only check still runs" "DRIFT_CHECK: PASS" "$LAST"
expect_has "prompt says there is no ledger" "No grill ledger" "$(cat "$PROMPT_LOG")"

# 5: ledger named but missing on disk -> runs spec-only and says so
new_repo 'spec: s1' 'ledger: .kanban/grilling/gone.md'
printf 'm/one=pass\n' >"$STUB_PLAN"
run_check
expect_eq "missing ledger still runs" "DRIFT_CHECK: PASS" "$LAST"
expect_has "missing ledger reported" "ledger .kanban/grilling/gone.md is missing" "$OUT"

echo "ralph-drift-check: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
