#!/usr/bin/env bash
# Tests for .agents/skills/kanban/board.sh (shared kanban eligibility).
#
# Covers validation-matrix items 1, 3, 4 and part of 7 from
# plans/tralph-labels-kanban-design.md:
#   1. labels absent / [] / one / conflicting, for pending and done tickets
#   3. --spec filters the reported set but blocker lookup stays board-wide
#   4. blockers in archive: done, cancelled, missing
#   +  priority ordering, parent/child rule, unclosed frontmatter,
#      block-list YAML, ready-label override, validate errors.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BOARD_SH="$ROOT/.agents/skills/kanban/board.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PASS=0
FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() {
  FAILN=$((FAILN + 1))
  echo "FAIL: $1" >&2
  [ -n "${2-}" ] && echo "  $2" >&2
}

new_board() {
  B="$TMP/$1"
  rm -rf "$B"
  mkdir -p "$B/issues" "$B/archive/2026-01-01" "$B/specs"
}

# ticket <dir> <id> <status> <labels-line|-> <blocked_by> [extra frontmatter lines...]
ticket() {
  local dir="$1" id="$2" status="$3" labels="$4" blocked="$5"
  shift 5
  local f="$dir/$(printf '%03d' "$id")-t$id.md"
  {
    printf '%s\n' '---'
    printf 'id: %s\n' "$id"
    printf 'title: Ticket %s\n' "$id"
    printf 'status: %s\n' "$status"
    [ "$labels" = "-" ] || printf '%s\n' "$labels"
    printf 'blocked_by: %s\n' "$blocked"
    printf 'created: 2026-10-14\n'
    for l in "$@"; do printf '%s\n' "$l"; done
    printf '%s\n' '---'
    printf '\n## What to build\n\nx\n'
  } >"$f"
}

bs() { "$BOARD_SH" --board "$B" "$@"; }
ids() { bs "$@" | cut -f1 | tr '\n' ' ' | sed 's/ $//'; }
count() { bs counts | sed -n "s/^$1=//p"; }

expect_ids() { # description expected args...
  local desc="$1" want="$2"
  shift 2
  local got
  got="$(ids "$@")"
  if [ "$got" = "$want" ]; then ok; else fail "$desc" "want '[$want]' got '[$got]'"; fi
}
expect_eq() {
  if [ "$2" = "$3" ]; then ok; else fail "$1" "want '$2' got '$3'"; fi
}

# --- 1. labels matrix -------------------------------------------------------
new_board labels
R='labels: [ready-for-agent]'
ticket "$B/issues" 1 pending - '[]'                                # absent -> not eligible
ticket "$B/issues" 2 pending 'labels: []' '[]'                     # empty -> not eligible
ticket "$B/issues" 3 pending "$R" '[]'                             # ready
ticket "$B/issues" 4 pending 'labels: [needs-info]' '[]'           # waiting triage
ticket "$B/issues" 5 pending 'labels: [ready-for-human]' '[]'      # human
ticket "$B/issues" 6 pending 'labels: [wontfix]' '[]'              # wontfix
ticket "$B/issues" 7 pending 'labels: [ready-for-agent, needs-info]' '[]'  # conflict
ticket "$B/issues" 8 pending 'labels: [bug, ready-for-agent]' '[]' # non-state label ignored
ticket "$B/issues" 9 done - '[]'                                   # done, no labels: exempt
ticket "$B/issues" 10 pending 'labels: [bug]' '[]'                 # only non-state label -> triage
ticket "$B/issues" 11 in-progress "$R" '[]'                        # active, not eligible
ticket "$B/issues" 12 blocked "$R" '[]'

expect_ids "only explicitly-ready pending tickets are eligible" "3 8" eligible
expect_eq "next picks lowest eligible id" "3" "$(bs next | cut -f1)"
expect_eq "waiting_triage counts absent, [], needs-info, non-state-only" "4" "$(count waiting_triage)"
expect_eq "waiting_human" "1" "$(count waiting_human)"
expect_eq "wontfix" "1" "$(count wontfix)"
expect_eq "conflict" "1" "$(count conflict)"
expect_eq "active" "1" "$(count active)"
expect_eq "blocked" "1" "$(count blocked)"
expect_eq "done" "1" "$(count done)"
expect_eq "eligible count" "2" "$(count eligible)"

# block-list YAML form for labels and blocked_by
new_board yaml
{
  printf '%s\n' '---' 'id: 1' 'title: T1' 'status: done' 'labels:' '  - ready-for-agent' 'blocked_by: []' 'created: 2026-10-14' '---'
} >"$B/issues/001-a.md"
{
  printf '%s\n' '---' 'id: 2' 'title: T2' 'status: pending' 'labels:' '  - ready-for-agent' 'blocked_by:' '  - 1' 'created: 2026-10-14' '---'
} >"$B/issues/002-b.md"
expect_ids "block-list labels and blocked_by parse" "2" eligible

# --- ready-label override ---------------------------------------------------
new_board override
ticket "$B/issues" 1 pending 'labels: [go]' '[]'
expect_ids "default ready label rejects custom label" "" eligible
got="$(RALPH_READY_LABEL=go ids eligible)"
expect_eq "RALPH_READY_LABEL=go makes it eligible" "1" "$got"
expect_ids "--ready-label flag overrides" "1" --ready-label go eligible

# --- priority / ordering ----------------------------------------------------
new_board prio
ticket "$B/issues" 1 pending "$R" '[]' 'priority: 5'
ticket "$B/issues" 2 pending "$R" '[]' 'priority: 0'
ticket "$B/issues" 3 pending "$R" '[]'
ticket "$B/issues" 4 pending "$R" '[]' 'priority: 0'
expect_ids "priority low first, then id (default priority 0)" "2 3 4 1" eligible

# --- 4. blockers: done / cancelled / missing / archive ----------------------
new_board blockers
ticket "$B/issues" 10 done - '[]'
ticket "$B/archive/2026-01-01" 5 done - '[]'
ticket "$B/archive/2026-01-01" 6 cancelled - '[]'
ticket "$B/issues" 20 pending "$R" '[10]'        # active done blocker -> eligible
ticket "$B/issues" 21 pending "$R" '[5]'         # archived done blocker -> eligible
ticket "$B/issues" 22 pending "$R" '[6]'         # archived cancelled -> NOT satisfied
ticket "$B/issues" 23 pending "$R" '[999]'       # missing -> NOT satisfied (fail closed)
ticket "$B/issues" 24 pending "$R" '[20]'        # blocker pending -> waiting
ticket "$B/issues" 25 pending "$R" '[5, 10]'     # multiple, all done
ticket "$B/issues" 26 pending "$R" '[5, 6]'      # one unsatisfied
expect_ids "blocker rules: done/archived-done ok; cancelled/missing/pending not" "20 21 25" eligible
expect_eq "waiting_deps" "4" "$(count waiting_deps)"
expect_eq "archived counted" "2" "$(count archived)"

# non-ticket md files in archive (progress.md) are ignored, not errors
printf '# progress\n' >"$B/archive/2026-01-01/progress.md"
expect_ids "archive progress.md ignored" "20 21 25" eligible

# --- parent / child ---------------------------------------------------------
new_board parent
ticket "$B/issues" 1 pending "$R" '[]'                    # parent
ticket "$B/issues" 2 pending "$R" '[]' 'parent: 1'        # child
ticket "$B/issues" 3 pending "$R" '[]' 'parent: 1'        # child
expect_ids "parent excluded while children open" "2 3" eligible
ticket "$B/issues" 2 done - '[]' 'parent: 1'
ticket "$B/issues" 3 done - '[]' 'parent: 1'
expect_ids "parent eligible once children done" "1" eligible

# --- 3. --spec filter keeps blocker lookup board-wide -----------------------
new_board spec
ticket "$B/issues" 1 done - '[]' 'spec: alpha'
ticket "$B/issues" 2 pending "$R" '[]' 'spec: alpha'
ticket "$B/issues" 3 pending "$R" '[1]' 'spec: beta'      # cross-spec blocker, done
ticket "$B/issues" 4 pending "$R" '[2]' 'spec: beta'      # cross-spec blocker, pending
ticket "$B/issues" 5 pending "$R" '[]'                    # no spec
expect_ids "no --spec reports everything eligible" "2 3 5" eligible
expect_ids "--spec alpha" "2" --spec alpha eligible
expect_ids "--spec beta sees cross-spec done blocker, blocked by pending one" "3" --spec beta eligible
expect_eq "--spec scopes counts" "2" "$(bs --spec beta counts | sed -n 's/^total=//p')"

# --- spec: null / ~ mean "no spec" (the kanban skill documents `spec: null`) ---
new_board nullspec
ticket "$B/issues" 1 pending "$R" '[]' 'spec: null'
ticket "$B/issues" 2 pending "$R" '[]' 'spec: ~'
ticket "$B/issues" 3 pending "$R" '[]' 'spec: real'
mkdir -p "$B/specs" && : >"$B/specs/real.md"
if out="$(bs validate 2>&1)"; then ok; else fail "spec null/~ validates" "$out"; fi
case "$out" in *WARN*) fail "spec: null must not warn about specs/null.md" "$out" ;; *) ok ;; esac
expect_eq "spec: null is not the literal slug" "null" "$(bs json | jq -r '.[0].spec // "null"')"
expect_ids "--spec real selects only the real spec, not null/~" "3" --spec real eligible
expect_ids "--spec null selects nothing" "" --spec null eligible

# --- unclosed frontmatter (older tickets end at the first blank line) -------
new_board unclosed
{
  printf '%s\n' '---' 'id: 51' 'title: Old style' 'status: pending' 'labels: [ready-for-agent]' 'blocked_by: []' 'created: 2026-09-10' ''
  printf '%s\n' '## What to build' 'status: not-a-real-field-in-the-body'
} >"$B/issues/051-old.md"
expect_ids "frontmatter ends at first blank line; body 'status:' ignored" "51" eligible

# --- validate ---------------------------------------------------------------
new_board validate
ticket "$B/issues" 1 pending "$R" '[]'
if bs validate >/dev/null; then ok; else fail "clean board validates"; fi

ticket "$B/issues" 2 pending - '[]'
out="$(bs validate || true)"
case "$out" in *"needs exactly one triage state label"*) ok ;; *) fail "validate flags missing labels" "$out" ;; esac
rm "$B/issues/002-t2.md"

ticket "$B/issues" 3 pending 'labels: [ready-for-agent, wontfix]' '[]'
out="$(bs validate || true)"
case "$out" in *"conflicting triage state labels"*) ok ;; *) fail "validate flags conflicting labels" "$out" ;; esac
rm "$B/issues/003-t3.md"

ticket "$B/issues" 4 pending "$R" '[404]'
out="$(bs validate || true)"
case "$out" in *"blocked_by 404 not found"*) ok ;; *) fail "validate flags missing blocker" "$out" ;; esac
rm "$B/issues/004-t4.md"

ticket "$B/issues" 5 pending "$R" '[5]'
out="$(bs validate || true)"
case "$out" in *"its own id"*) ok ;; *) fail "validate flags self-dependency" "$out" ;; esac
rm "$B/issues/005-t5.md"

ticket "$B/issues" 6 pending "$R" '[7]'
ticket "$B/issues" 7 pending "$R" '[6]'
out="$(bs validate || true)"
case "$out" in *"dependency cycle"*) ok ;; *) fail "validate flags cycles" "$out" ;; esac
rm "$B/issues/006-t6.md" "$B/issues/007-t7.md"

ticket "$B/archive/2026-01-01" 1 done - '[]'
out="$(bs validate || true)"
case "$out" in *"duplicate id 1"*) ok ;; *) fail "validate flags id reused across issues/ and archive/" "$out" ;; esac
rm "$B/archive/2026-01-01/001-t1.md"

printf '%s\n' '---' 'id: 8' 'status: pending' 'labels: [ready-for-agent]' 'blocked_by: []' '---' >"$B/issues/008-bad.md"
out="$(bs validate || true)"
case "$out" in *"missing title"*"missing created"* | *"missing created"*"missing title"*) ok ;; *) fail "validate flags missing title/created" "$out" ;; esac
rm "$B/issues/008-bad.md"

printf 'no frontmatter\n' >"$B/issues/009-nofm.md"
out="$(bs validate || true)"
case "$out" in *"missing YAML frontmatter"*) ok ;; *) fail "validate flags missing frontmatter" "$out" ;; esac
rm "$B/issues/009-nofm.md"

ticket "$B/issues" 10 pending "$R" '[]' 'spec: ghost'
out="$(bs validate || true)"
case "$out" in *"WARN"*"ghost"*) ok ;; *) fail "validate warns on spec with no spec file" "$out" ;; esac
if bs validate >/dev/null; then ok; else fail "missing spec file is a WARN, not an ERROR"; fi
rm "$B/issues/010-t10.md"

# --- status todo/open are read as pending (matches ralph-loop normalize) -----
new_board alias
ticket "$B/issues" 1 todo "$R" '[]'
ticket "$B/issues" 2 open "$R" '[]'
ticket "$B/issues" 3 todo 'labels: [needs-info]' '[]'
expect_ids "todo and open count as pending" "1 2" eligible
expect_eq "todo/open not reported as other" "0" "$(count other)"
expect_eq "todo with needs-info waits for triage" "1" "$(count waiting_triage)"

# --- empty / missing board --------------------------------------------------
new_board empty
expect_eq "empty board counts eligible=0" "0" "$(count eligible)"
if bs next >/dev/null; then fail "next exits nonzero on empty board"; else ok; fi
if "$BOARD_SH" --board "$TMP/nope" counts 2>/dev/null; then fail "missing board dir exits nonzero"; else ok; fi

echo "board-eligibility: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
