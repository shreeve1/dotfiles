#!/usr/bin/env bash
# board.sh — single source of truth for local kanban board eligibility.
#
# Shared by ralph-loop.sh, gralph, ralph-supervise.sh and the shepherd so the
# status / triage-label / blocker / archive rules live in one place.
#
# Usage: board.sh [--board DIR] [--spec SLUG] [--ready-label LABEL] <command>
#
# Commands:
#   eligible   Print "<id><TAB><path>" for every ticket the loop may pick up,
#              ordered by priority (low first) then id.
#   next       First line of `eligible`. Prints nothing and exits 1 if none.
#   counts     Print key=value lines: eligible, waiting_triage, waiting_human,
#              wontfix, conflict, waiting_deps, active, blocked, done,
#              cancelled, other, total, archived.
#   validate   Print ERROR:/WARN: lines. Exit 1 if any ERROR.
#
# Rules (see plans/tralph-labels-kanban-design.md):
#   eligible = status pending
#              AND exactly one triage *state* label, and it is the ready label
#              AND every blocker resolved AND (if a parent) all children done.
#   Blocker lookup: issues/ first, then archive/ (recursive). `done` is
#   satisfied. `cancelled` and unknown ids are NOT satisfied (fail closed).
#   --spec filters the ticket set reported; blocker lookup is always board-wide.
#   done/cancelled tickets are exempt from the label requirement.
#
# Env: KANBAN_BOARD (default .kanban), RALPH_READY_LABEL (default
# ready-for-agent). The state-label set is the five Matt Pocock roles plus the
# ready label; other labels (bug, enhancement, ...) are ignored.

set -euo pipefail

BOARD="${KANBAN_BOARD:-.kanban}"
SPEC=""
READY="${RALPH_READY_LABEL:-ready-for-agent}"
STATES="needs-triage,needs-info,ready-for-agent,ready-for-human,wontfix"
CMD=""

usage() { sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//' >&2; }

while [ $# -gt 0 ]; do
  case "$1" in
  --board)
    BOARD="${2:?--board needs a directory}"
    shift 2
    ;;
  --spec)
    SPEC="${2:?--spec needs a slug}"
    shift 2
    ;;
  --ready-label)
    READY="${2:?--ready-label needs a label}"
    shift 2
    ;;
  -h | --help)
    usage
    exit 0
    ;;
  eligible | next | counts | validate)
    CMD="$1"
    shift
    ;;
  *)
    echo "board.sh: unknown argument: $1" >&2
    usage
    exit 2
    ;;
  esac
done
[ -n "$CMD" ] || {
  usage
  exit 2
}

ISSUES_DIR="$BOARD/issues"
ARCHIVE_DIR="$BOARD/archive"
[ -d "$ISSUES_DIR" ] || {
  echo "board.sh: no issues directory: $ISSUES_DIR" >&2
  exit 2
}

FILES=()
while IFS= read -r f; do FILES+=("$f"); done < <(find "$ISSUES_DIR" -maxdepth 1 -name '*.md' -type f | sort)
if [ -d "$ARCHIVE_DIR" ]; then
  while IFS= read -r f; do FILES+=("$f"); done < <(find "$ARCHIVE_DIR" -name '*.md' -type f | sort)
fi

# Pass 1: one TSV record per file. Frontmatter ends at the second `---` or the
# first blank line, whichever comes first (matches gralph's read_kanban_children
# and the older tickets that never closed their frontmatter).
PASS1=$(
  cat <<'AWK'
BEGIN { OFS = "\t" }
function trim(s) { gsub(/^[ \t\r]+|[ \t\r]+$/, "", s); return s }
function strip_comment(s) { sub(/[ \t]+#.*$/, "", s); return s }
function unq(s) { gsub(/^["']|["']$/, "", s); return s }
function list_items(s,   n, i, a, out, x) {
  s = trim(s); sub(/^\[/, "", s); sub(/\]$/, "", s)
  n = split(s, a, ","); out = ""
  for (i = 1; i <= n; i++) { x = unq(trim(a[i])); if (x != "") out = out (out == "" ? "" : ",") x }
  return out
}
function emit() {
  if (file == "") return
  print loc, file, hasfm, id, status, lmode, labels, blocked, spec, parent, prio, created, hastitle, hasblk
}
FNR == 1 {
  emit(); file = FILENAME
  loc = (index(file, archive_dir "/") == 1) ? "archive" : "issues"
  hasfm = 0; infm = 0; id = ""; status = ""; lmode = "absent"; labels = ""; blocked = ""
  spec = ""; parent = ""; prio = ""; created = ""; hastitle = 0; hasblk = 0; cap = ""
}
{ sub(/\r$/, "") }
FNR == 1 { if ($0 ~ /^---[ \t]*$/) { infm = 1; hasfm = 1 } else infm = 2; next }
infm == 1 {
  if ($0 ~ /^---[ \t]*$/ || $0 ~ /^[ \t]*$/) { infm = 2; cap = ""; next }
  if ($0 ~ /^[ \t]+-([ \t]|$)/ || $0 ~ /^-([ \t]|$)/) {
    if (cap != "") {
      v = $0; sub(/^[ \t]*-[ \t]*/, "", v); v = unq(trim(strip_comment(v)))
      if (v != "") {
        if (cap == "labels") labels = labels (labels == "" ? "" : ",") v
        else if (cap == "blocked") blocked = blocked (blocked == "" ? "" : ",") v
      }
    }
    next
  }
  cap = ""
  if (match($0, /^[A-Za-z_]+:/)) {
    key = substr($0, 1, RLENGTH - 1); val = trim(strip_comment(substr($0, RLENGTH + 1)))
    if (key == "id") id = unq(val)
    else if (key == "title") hastitle = (val != "")
    else if (key == "status") status = unq(val)
    else if (key == "spec") spec = unq(val)
    else if (key == "priority") prio = unq(val)
    else if (key == "created") created = unq(val)
    else if (key == "parent") { parent = unq(val); if (parent == "null" || parent == "~") parent = "" }
    else if (key == "labels") { lmode = "list"; if (val != "") labels = list_items(val); else cap = "labels" }
    else if (key == "blocked_by") { hasblk = 1; if (val != "") blocked = list_items(val); else cap = "blocked" }
  }
}
END { emit() }
AWK
)

# Pass 2: board-wide logic over the TSV.
PASS2=$(
  cat <<'AWK'
BEGIN {
  FS = "\t"
  ns = split(states, sa, ","); for (i = 1; i <= ns; i++) isstate[sa[i]] = 1
  isstate[ready] = 1
  valid["pending"] = valid["in-progress"] = valid["review"] = 1
  valid["done"] = valid["blocked"] = valid["cancelled"] = 1
}
{
  n++
  loc[n] = $1; file[n] = $2; hasfm[n] = $3; id[n] = $4; st[n] = $5; lmode[n] = $6
  lab[n] = $7; blk[n] = $8; spc[n] = $9; par[n] = $10; pri[n] = $11; cre[n] = $12
  htt[n] = $13; hasblk[n] = $14
  if ($4 ~ /^[0-9]+$/) {
    k = $4 + 0; cnt[k]++
    if (!(k in idx) || (loc[idx[k]] == "archive" && $1 == "issues")) idx[k] = n
  }
}
function slabels(i,   a, m, j) {
  SLN = 0; SL1 = ""; m = split(lab[i], a, ",")
  for (j = 1; j <= m; j++) if (a[j] != "" && (a[j] in isstate)) { SLN++; SL1 = a[j] }
}
function satisfied(b) { b = b + 0; return (b in idx) && st[idx[b]] == "done" }
function depsok(i,   a, m, j) {
  m = split(blk[i], a, ",")
  for (j = 1; j <= m; j++) if (a[j] != "" && !satisfied(a[j])) return 0
  if (kidsopen[id[i] + 0] > 0) return 0
  return 1
}
function inspec(i) { return spec == "" || spc[i] == spec }
function dfs(k,   j) {
  color[k] = 1
  for (j = 1; j <= bn[k]; j++) {
    b = bl[k, j]
    if (!(b in idx) || loc[idx[b]] != "issues") continue
    if (color[b] == 1) { cyc[k " -> " b] = 1 }
    else if (color[b] == 0) dfs(b)
  }
  color[k] = 2
}
END {
  for (i = 1; i <= n; i++)
    if (par[i] ~ /^[0-9]+$/ && st[i] != "done") kidsopen[par[i] + 0]++

  if (cmd == "eligible" || cmd == "next" || cmd == "counts") {
    sortcmd = "sort -t '\t' -n -k1,1 -k2,2"
    for (i = 1; i <= n; i++) {
      if (loc[i] != "issues") { if (loc[i] == "archive" && id[i] ~ /^[0-9]+$/ && inspec(i)) archived++; continue }
      if (id[i] !~ /^[0-9]+$/ || !inspec(i)) continue
      total++; s = st[i]
      if (s == "pending") {
        slabels(i)
        if (SLN == 0) wt++
        else if (SLN > 1) conflict++
        else if (SL1 == ready) {
          if (depsok(i)) { elig++; if (cmd != "counts") print (pri[i] + 0) "\t" (id[i] + 0) "\t" id[i] "\t" file[i] | sortcmd }
          else wd++
        }
        else if (SL1 == "ready-for-human") wh++
        else if (SL1 == "wontfix") wf++
        else wt++
      }
      else if (s == "in-progress" || s == "review") active++
      else if (s == "blocked") blocked++
      else if (s == "done") done++
      else if (s == "cancelled") cancelled++
      else other++
    }
    if (cmd != "counts") { close(sortcmd); exit 0 }
    printf "eligible=%d\nwaiting_triage=%d\nwaiting_human=%d\nwontfix=%d\nconflict=%d\nwaiting_deps=%d\n", elig, wt, wh, wf, conflict, wd
    printf "active=%d\nblocked=%d\ndone=%d\ncancelled=%d\nother=%d\ntotal=%d\narchived=%d\n", active, blocked, done, cancelled, other, total, archived
    exit 0
  }

  # validate
  errs = 0
  for (i = 1; i <= n; i++) {
    if (loc[i] != "issues") continue
    f = file[i]
    if (!hasfm[i]) { print "ERROR " f ": missing YAML frontmatter"; errs++; continue }
    if (id[i] !~ /^[0-9]+$/) { print "ERROR " f ": missing or non-numeric id"; errs++; continue }
    if (!htt[i]) { print "ERROR " f ": missing title"; errs++ }
    if (!(st[i] in valid)) { print "ERROR " f ": invalid status '" st[i] "'"; errs++ }
    if (!hasblk[i]) { print "ERROR " f ": missing blocked_by"; errs++ }
    if (cre[i] == "") { print "ERROR " f ": missing created"; errs++ }
    if (st[i] != "done" && st[i] != "cancelled") {
      slabels(i)
      if (SLN == 0) { print "ERROR " f ": needs exactly one triage state label in labels: (found none)"; errs++ }
      else if (SLN > 1) { print "ERROR " f ": conflicting triage state labels in labels: (found " SLN ")"; errs++ }
    }
    if (par[i] != "" && par[i] !~ /^[0-9]+$/) { print "ERROR " f ": non-numeric parent '" par[i] "'"; errs++ }
    else if (par[i] != "" && !((par[i] + 0) in idx)) { print "ERROR " f ": parent " par[i] " not found"; errs++ }
    if (spc[i] != "" && system("test -f '" board "/specs/" spc[i] ".md'") != 0)
      print "WARN " f ": spec '" spc[i] "' has no " board "/specs/" spc[i] ".md"
    k = id[i] + 0; m = split(blk[i], a, ","); bn[k] = 0
    for (j = 1; j <= m; j++) {
      if (a[j] == "") continue
      if (a[j] !~ /^[0-9]+$/) { print "ERROR " f ": non-numeric blocked_by entry '" a[j] "'"; errs++; continue }
      b = a[j] + 0
      if (b == k) { print "ERROR " f ": blocked_by contains its own id"; errs++; continue }
      if (!(b in idx)) { print "ERROR " f ": blocked_by " b " not found in issues/ or archive/"; errs++; continue }
      bl[k, ++bn[k]] = b
    }
  }
  for (k in cnt) if (cnt[k] > 1) { print "ERROR duplicate id " k " across issues/ and archive/ (" cnt[k] " files)"; errs++ }
  for (i = 1; i <= n; i++)
    if (loc[i] == "issues" && id[i] ~ /^[0-9]+$/ && color[id[i] + 0] == 0) dfs(id[i] + 0)
  for (c in cyc) { print "ERROR dependency cycle: " c; errs++ }
  exit (errs > 0 ? 1 : 0)
}
AWK
)

run() {
  [ "${#FILES[@]}" -gt 0 ] || {
    [ "$CMD" = counts ] && {
      printf 'eligible=0\nwaiting_triage=0\nwaiting_human=0\nwontfix=0\nconflict=0\nwaiting_deps=0\nactive=0\nblocked=0\ndone=0\ncancelled=0\nother=0\ntotal=0\narchived=0\n'
      return 0
    }
    return 0
  }
  awk -v archive_dir="$ARCHIVE_DIR" "$PASS1" "${FILES[@]}" |
    awk -v cmd="$CMD" -v spec="$SPEC" -v ready="$READY" -v states="$STATES" -v board="$BOARD" "$PASS2"
}

case "$CMD" in
eligible) run | cut -f3- ;;
next)
  out="$(run | cut -f3- | sed -n 1p)"
  [ -n "$out" ] || exit 1
  printf '%s\n' "$out"
  ;;
counts | validate) run ;;
esac
