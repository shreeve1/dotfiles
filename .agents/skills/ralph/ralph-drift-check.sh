#!/usr/bin/env bash
# ralph-drift-check.sh TICKET BASE HEAD: the driver-side drift check.
#
# Both Ralph drivers run this after a worker reports DONE on a ticket (ralph-loop.sh in
# its verification gate, bin/gralph in the lane DONE branch), so the check is enforced
# by the driver, not left to the worker. It runs one fresh read-only reviewer on a
# strong model and asks one question: does BASE..HEAD contradict a decision recorded in
# the ticket's spec or the spec's grill ledger, or build something the spec puts Out of
# Scope? Code quality and acceptance criteria are not its job; the worker's own review
# (references/review.md) covers those.
#
# Prints the reviewer's findings, then exactly one final line:
#   DRIFT_CHECK: PASS      no drift found
#   DRIFT_CHECK: DRIFT     drift found; the caller blocks the ticket
#   DRIFT_CHECK: DEGRADED  no model gave a verdict; never blocks
#   DRIFT_CHECK: SKIPPED   the ticket names no usable spec; never blocks
# Exits 0 with a verdict (2 only on wrong usage); the caller reads the final line. Run from the repo root (or the lane
# worktree): paths in the ticket and spec are relative to it.
#
# Env: RALPH_DRIFT_MODELS (space-separated, tried in order; default Opus then GPT),
#      RALPH_DRIFT_TIMEOUT (seconds per model, default 900).
set -uo pipefail

if [ $# -ne 3 ]; then
  echo "usage: ralph-drift-check.sh TICKET BASE HEAD" >&2
  exit 2
fi
ticket="$1" base="$2" head="$3"
models="${RALPH_DRIFT_MODELS:-cliproxy/claude-opus-5-5 cliproxy/gpt-6.1-sol}"

verdict() {
  echo "DRIFT_CHECK: $1"
  exit 0
}

# fm KEY FILE: a frontmatter value. Frontmatter ends at the closing --- or the first
# blank line (kanban schema); quotes and trailing comments are stripped.
fm() {
  awk -v k="$1" '
    NR == 1 { if ($0 != "---") exit; next }
    $0 == "---" || $0 == "" { exit }
    index($0, k ":") == 1 {
      sub(/^[^:]*:[[:space:]]*/, ""); sub(/[[:space:]]+#.*$/, ""); gsub(/["\047\r]/, "")
      print; exit
    }' "$2"
}

[ -f "$ticket" ] || {
  echo "drift-check: ticket $ticket not found"
  verdict SKIPPED
}
slug="$(fm spec "$ticket")"
case "$slug" in "" | null | "~")
  echo "drift-check: ticket has no spec; nothing to check against"
  verdict SKIPPED
  ;;
esac
# Same slug rule as board.sh and tralph --spec; an unsafe slug is never made into a path.
if ! [[ "$slug" =~ ^[A-Za-z0-9][A-Za-z0-9_-]*$ ]] || [[ "$slug" =~ ^[0-9]+$ ]]; then
  echo "drift-check: spec slug '$slug' is invalid"
  verdict SKIPPED
fi
spec="$(dirname "$(dirname "$ticket")")/specs/$slug.md"
[ -f "$spec" ] || {
  echo "drift-check: spec $spec is missing"
  verdict SKIPPED
}

ledger="$(fm ledger "$spec")"
if [ -n "$ledger" ] && [ ! -f "$ledger" ]; then
  echo "drift-check: ledger $ledger is missing; checking against the spec only"
  ledger=""
fi
if [ -n "$ledger" ]; then
  ledger_step="3. Read $ledger, the grill ledger the spec was written from. Every line under its Decisions and Defaults headings is a decision the user made."
else
  ledger_step="3. No grill ledger for this spec: check against the spec only."
fi

prompt="You are a drift checker. You are read-only: do not edit, write, or run anything that changes files or state.

Answer one question: does this ticket's diff contradict a decision the user already made, or build something the spec puts out of scope? Do not review code quality, style, tests or acceptance criteria; another reviewer does that.

1. Read $ticket, the ticket that was implemented.
2. Read $spec, its spec. Its 'Decisions from the grill', 'Implementation Decisions' and 'Out of Scope' sections are decisions.
$ledger_step
4. Run: git diff $base $head
   Read changed files in full where the diff alone does not settle a question.

Report drift only when you can quote both sides: the decision (file and the exact line) and the code that contradicts it (file:line). Building something listed under Out of Scope counts. Doing less than the spec asks is not drift. 'I would have built it differently' is not drift. If you cannot quote the decision, it is not a finding.

Output: a numbered list of findings, each with the decision quote, the code location and one sentence on why they clash. Zero findings is a valid answer. Then exactly one final line:
DRIFT_CHECK: DRIFT   (one or more findings)
DRIFT_CHECK: PASS    (no findings)"

snap() { git status --porcelain -- . ':(exclude).pi-lens' 2>/dev/null; }

# Undo what a reviewer changed, touching only paths that were clean before it ran, so
# another session's work in a shared tree is never reverted.
restore_new_changes() {
  local line path
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    path="${line:3}"
    if [ "${line:0:2}" = "??" ]; then rm -rf -- "$path"; else git checkout -q HEAD -- "$path" 2>/dev/null || true; fi
  done < <(comm -13 <(printf '%s\n' "$1" | sort) <(snap | sort))
}

run_with_timeout=()
command -v timeout >/dev/null 2>&1 && run_with_timeout=(timeout "${RALPH_DRIFT_TIMEOUT:-900}")

tried=""
for model in $models; do
  before="$(snap)"
  rc=0
  out="$(${run_with_timeout[@]+"${run_with_timeout[@]}"} pi --no-extensions --no-session --model "$model" -p "$prompt" </dev/null 2>&1)" || rc=$?
  if [ "$(snap)" != "$before" ]; then
    restore_new_changes "$before"
    echo "drift-check: reviewer on $model changed the worktree; its verdict is discarded"
    tried="$tried $model(changed-worktree)"
    continue
  fi
  last="$(printf '%s\n' "$out" | awk 'NF { l = $0 } END { print l }')"
  if [ "$rc" -eq 0 ] && { [ "$last" = "DRIFT_CHECK: PASS" ] || [ "$last" = "DRIFT_CHECK: DRIFT" ]; }; then
    echo "--- drift check ($model) ---"
    printf '%s\n' "$out" | grep -vxF -- "$last"
    verdict "${last#DRIFT_CHECK: }"
  fi
  tried="$tried $model(exit $rc, no verdict)"
done
echo "drift-check degraded: no verdict from:$tried"
verdict DEGRADED
