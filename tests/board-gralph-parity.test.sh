#!/usr/bin/env bash
# board.sh and bin/gralph both decide which tickets are workable. gralph re-derives
# part of the rule in jq (it needs the GitHub-shaped manifest), so this test pins
# the two together: for a matrix of boards, `board.sh eligible` and gralph's
# plan must pick the same tickets. A rule changed in one place but not the other
# fails here instead of silently diverging (review findings 5 and 12).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BS="$ROOT/.agents/skills/kanban/board.sh"
GRALPH="$ROOT/bin/gralph"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

command -v jq >/dev/null 2>&1 || {
  echo "FAIL: jq is required" >&2
  exit 1
}

PASS=0
FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() {
  FAILN=$((FAILN + 1))
  echo "FAIL: $1" >&2
  if [ -n "${2-}" ]; then echo "  $2" >&2; fi
}

REPO="$TMP/repo"
mkdir -p "$REPO"
git -C "$REPO" init -q -b main
git -C "$REPO" config user.name t
git -C "$REPO" config user.email t@t
git -C "$REPO" commit -q --allow-empty -m init

R='labels: [ready-for-agent]'
# ticket <board> <id> <status> <labels-line|-> <blocked_by> [dir] [extra...]
ticket() {
  local b="$1" id="$2" status="$3" labels="$4" blocked="$5" dir="${6:-issues}"
  shift 6 || shift $#
  mkdir -p "$b/$dir"
  {
    printf '%s\n' '---'
    printf 'id: %s\ntitle: T%s\nstatus: %s\n' "$id" "$id" "$status"
    if [ "$labels" != "-" ]; then printf '%s\n' "$labels"; fi
    printf 'blocked_by: %s\ncreated: 2026-10-14\n' "$blocked"
    for l in "$@"; do printf '%s\n' "$l"; done
    printf '%s\n' '---'
  } >"$b/$dir/$(printf '%03d' "$id")-t$id.md"
}

# compare <case-name> <board>: the two implementations must agree.
compare() {
  local name="$1" b="$2" want got key
  want="$("$BS" --board "$b" eligible | cut -f1 | tr '\n' ' ' | sed 's/ $//')"
  key="p$(printf '%s' "$name" | tr -c 'A-Za-z0-9' '-')"
  if ! (cd "$REPO" && "$GRALPH" "$key" --board "$b" --dry-run --verify true >/dev/null 2>"$TMP/err"); then
    # An empty-eligible board is still a valid plan; a hard error is a failure.
    fail "[$name] gralph could not plan the board" "$(cat "$TMP/err")"
    return
  fi
  got="$(jq -r '[.children[] | select(.classification=="eligible") | .number] | sort | join(" ")' "$REPO/.gralph/runs/$key/manifest.json")"
  if [ "$want" = "$got" ]; then ok; else fail "[$name] board.sh and gralph disagree" "board.sh=[$want] gralph=[$got]"; fi
}

new() {
  B="$TMP/$1"
  rm -rf "$B"
  mkdir -p "$B/issues" "$B/archive/2026-01-01"
}

new labels
ticket "$B" 1 pending - '[]'
ticket "$B" 2 pending 'labels: []' '[]'
ticket "$B" 3 pending "$R" '[]'
ticket "$B" 4 pending 'labels: [needs-info]' '[]'
ticket "$B" 5 pending 'labels: [ready-for-agent, wontfix]' '[]'
ticket "$B" 6 pending 'labels: [bug, ready-for-agent]' '[]'
ticket "$B" 7 "done" - '[]'
ticket "$B" 8 in-progress "$R" '[]'
compare labels "$B"

new blockers
ticket "$B" 10 "done" - '[]'
ticket "$B" 5 "done" - '[]' archive/2026-01-01
ticket "$B" 6 cancelled - '[]' archive/2026-01-01
ticket "$B" 20 pending "$R" '[10]'
ticket "$B" 21 pending "$R" '[5]'
ticket "$B" 22 pending "$R" '[6]'
ticket "$B" 23 pending "$R" '[999]'
ticket "$B" 24 pending "$R" '[20]'
ticket "$B" 25 pending "$R" '[5, 10]'
ticket "$B" 26 pending "$R" '[5, 6]'
compare blockers "$B"

# review finding 4: a malformed blocker must not release the ticket in EITHER path.
new malformed
ticket "$B" 1 "done" - '[]'
ticket "$B" 2 pending "$R" '[1x]'
ticket "$B" 3 pending "$R" '[1, abc]'
ticket "$B" 4 pending "$R" '[1]'
compare malformed "$B"
got="$(cd "$REPO" && jq -r '[.children[] | select(.classification=="eligible") | .number] | join(" ")' .gralph/runs/pmalformed/manifest.json)"
if [ "$got" = "4" ]; then ok; else fail "gralph must not release tickets with malformed blockers" "eligible=[$got]"; fi

new parents
ticket "$B" 1 pending "$R" '[]'
ticket "$B" 2 pending "$R" '[]' issues 'parent: 1'
ticket "$B" 3 pending "$R" '[]'
ticket "$B" 4 "done" - '[]' issues 'parent: 3'
compare parents "$B"

# review finding 5: an ARCHIVED cancelled child still holds its parent open. The two
# paths disagreed here (board.sh blocked the parent, gralph released it).
new archived-child
ticket "$B" 1 pending "$R" '[]'
ticket "$B" 2 cancelled - '[]' archive/2026-01-01 'parent: 1'
ticket "$B" 3 pending "$R" '[]'
ticket "$B" 4 "done" - '[]' archive/2026-01-01 'parent: 3'
compare archived-child "$B"
got="$(cd "$REPO" && jq -r '[.children[] | select(.classification=="eligible") | .number] | join(" ")' .gralph/runs/parchived-child/manifest.json)"
if [ "$got" = "3" ]; then ok; else fail "archived cancelled child must hold its parent in gralph too" "eligible=[$got] (want 3: parent 1 blocked, parent 3 has only a done archived child)"; fi

new todo-alias
ticket "$B" 1 todo "$R" '[]'
ticket "$B" 2 open "$R" '[]'
compare todo-alias "$B"

new spec-filter
ticket "$B" 1 "done" - '[]' issues 'spec: a'
ticket "$B" 2 pending "$R" '[]' issues 'spec: a'
ticket "$B" 3 pending "$R" '[1]' issues 'spec: b'
ticket "$B" 4 pending "$R" '[2]' issues 'spec: b'
want="$("$BS" --board "$B" --spec b eligible | cut -f1 | tr '\n' ' ' | sed 's/ $//')"
(cd "$REPO" && "$GRALPH" pspec --board "$B" --spec b --dry-run --verify true >/dev/null 2>&1)
got="$(jq -r '[.children[] | select(.classification=="eligible") | .number] | sort | join(" ")' "$REPO/.gralph/runs/pspec/manifest.json")"
if [ "$want" = "$got" ]; then ok; else fail "[spec-filter] board.sh and gralph disagree under --spec" "board.sh=[$want] gralph=[$got]"; fi

echo "board-gralph-parity: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
