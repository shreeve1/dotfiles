#!/usr/bin/env bash
# ralph-drift-check.sh [--spec-file F] TICKET BASE HEAD
#
# The driver-side drift check (ADR 0024). Both Ralph drivers run it after a worker reports
# DONE on a ticket (ralph-loop.sh run_drift_gate, bin/gralph run_board_child_pipeline), so
# the check is enforced by the driver, not left to the worker. It runs one fresh reviewer on
# a strong model and asks one question: does BASE..HEAD contradict a decision recorded in
# the ticket's spec or the spec's grill ledger, or build something the spec puts Out of
# Scope? Code quality and acceptance criteria are not its job; the worker's own review
# (references/review.md) covers those.
#
# The reviewer is read-only by construction: it runs with --tools read,grep,find,ls and no
# skills, context files or extensions. The ticket, spec, ledger and diff are sent on stdin,
# so the check does not depend on those files existing in the reviewer's working tree (a
# board lane's worktree only holds what was committed at plan time). Nothing in the working
# tree is ever modified or reverted.
#
# Prints the reviewer's findings, then exactly one final line:
#   DRIFT_CHECK: PASS      no drift found
#   DRIFT_CHECK: DRIFT     drift found; the caller blocks the ticket
#   DRIFT_CHECK: DEGRADED  no model gave a verdict; never blocks
#   DRIFT_CHECK: SKIPPED   the ticket names no spec; never blocks
#   DRIFT_CHECK: ERROR     the check could not run (ticket or named spec missing, bad slug,
#                          bad range); the caller must not mark the ticket done on it
# Exits 0 with a verdict (2 only on wrong usage).
#
# Paths: TICKET is read as given. The spec defaults to <board>/specs/<slug>.md beside the
# ticket's issues/ dir; --spec-file overrides it for callers whose working tree is not where
# the board lives. A relative ledger: value is resolved against the root of the repository
# that holds the spec, so a board lane reads the live (possibly uncommitted) ledger.
#
# Env: RALPH_DRIFT_MODELS (space-separated, tried in order; default Opus then GPT),
#      RALPH_DRIFT_TIMEOUT (seconds per model, default 900).
set -uo pipefail

usage() {
  echo "usage: ralph-drift-check.sh [--spec-file F] TICKET BASE HEAD" >&2
  exit 2
}
spec_override=""
while [ $# -gt 0 ]; do
  case "$1" in
  --spec-file)
    [ $# -ge 2 ] || usage
    spec_override="$2"
    shift 2
    ;;
  --)
    shift
    break
    ;;
  -*) usage ;;
  *) break ;;
  esac
done
[ $# -eq 3 ] || usage
ticket="$1" base="$2" head="$3"
models="${RALPH_DRIFT_MODELS:-cliproxy/claude-opus-5-5 cliproxy/gpt-6.1-sol}"

verdict() {
  echo "DRIFT_CHECK: $1"
  exit 0
}

# fm KEY FILE: a frontmatter value, parsed the way board.sh parses it. Frontmatter ends at
# the closing --- or the first blank line; a trailing comment and one pair of surrounding
# quotes are stripped.
fm() {
  awk -v k="$1" '
    NR == 1 { if ($0 != "---") exit; next }
    $0 == "---" || $0 == "" { exit }
    index($0, k ":") == 1 {
      sub(/^[^:]*:[[:space:]]*/, ""); sub(/[[:space:]]+#.*$/, ""); gsub(/\r/, "")
      gsub(/^["\047]|["\047]$/, "")
      print; exit
    }' "$2"
}

[ -f "$ticket" ] || {
  echo "drift-check: ticket $ticket not found"
  verdict ERROR
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
  verdict ERROR
fi
spec="${spec_override:-$(dirname "$(dirname "$ticket")")/specs/$slug.md}"
[ -f "$spec" ] || {
  echo "drift-check: spec $spec is missing (the ticket names spec: $slug)"
  verdict ERROR
}
if ! git rev-parse -q --verify "$base^{commit}" >/dev/null || ! git rev-parse -q --verify "$head^{commit}" >/dev/null; then
  echo "drift-check: range $base..$head is not two commits in $(pwd)"
  verdict ERROR
fi

ledger="$(fm ledger "$spec")"
ledger_named="$ledger"
if [ -n "$ledger" ] && [ "${ledger#/}" = "$ledger" ]; then
  spec_root="$(git -C "$(dirname "$spec")" rev-parse --show-toplevel 2>/dev/null || true)"
  [ -z "$spec_root" ] || ledger="$spec_root/$ledger"
fi
if [ -n "$ledger" ] && [ ! -f "$ledger" ]; then
  echo "drift-check: ledger $ledger_named is missing; checking against the spec only"
  ledger=""
fi

build_input() {
  cat <<'EOF'
You are a drift checker. You can read files in the repository but cannot change anything.

Answer one question: does the ticket's diff below contradict a decision the user already made, or build something the spec puts out of scope? Do not review code quality, style, tests or acceptance criteria; another reviewer does that.

Decisions are: the spec's 'Decisions from the grill', 'Implementation Decisions' and 'Out of Scope' sections, and every line under the grill ledger's Decisions heading. Lines under the ledger's Defaults heading are low-stakes defaults: count one only when it names user-visible behaviour or scope, never when it is about process (how work is reviewed, committed, cleaned up or tested). Ledger sections describing the existing system are context, not decisions.

Report drift only when you can quote both sides: the decision (its section and exact line) and the code that contradicts it (file:line in the diff). Building something listed under Out of Scope counts. Doing less than the spec asks is not drift. 'I would have built it differently' is not drift. If you cannot quote the decision, it is not a finding. Read other repository files only when the diff alone does not settle a question.

Output: a numbered list of findings, each with the decision quote, the code location and one sentence on why they clash. Zero findings is a valid answer. Then exactly one final line:
DRIFT_CHECK: DRIFT   (one or more findings)
DRIFT_CHECK: PASS    (no findings)
EOF
  printf '\n===== TICKET (%s) =====\n' "$ticket"
  cat "$ticket"
  printf '\n===== SPEC (%s) =====\n' "$spec"
  cat "$spec"
  if [ -n "$ledger" ]; then
    printf '\n===== GRILL LEDGER (%s) =====\n' "$ledger"
    cat "$ledger"
  else
    printf '\n===== GRILL LEDGER =====\nNo grill ledger for this spec: check against the spec only.\n'
  fi
  printf '\n===== DIFF %s..%s =====\n' "$base" "$head"
  git diff --no-ext-diff "$base" "$head"
}
input_file="$(mktemp)"
trap 'rm -f "$input_file"' EXIT
build_input >"$input_file"

run_with_timeout=()
command -v timeout >/dev/null 2>&1 && run_with_timeout=(timeout -k 5 "${RALPH_DRIFT_TIMEOUT:-900}")

tried=""
for model in $models; do
  rc=0
  out="$(${run_with_timeout[@]+"${run_with_timeout[@]}"} pi -p --no-session --no-extensions --no-skills \
    --no-context-files --no-prompt-templates --no-themes --tools read,grep,find,ls \
    --model "$model" "Answer the drift check above." <"$input_file" 2>&1)" || rc=$?
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
