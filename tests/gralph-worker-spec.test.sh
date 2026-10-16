#!/usr/bin/env bash
# A board-mode lane worker's prompt is built by gralph, and read_board_ticket passes it only the
# ticket's title and body, so the ticket's `spec:` field never reached the worker and nothing told
# it to read the spec (Problem Statement, decisions, Out of Scope). This pins that the prompt:
#   - points at .kanban/specs/<slug>.md when the ticket has spec: <slug> and the file exists,
#   - tells the worker's own reviewer to check the diff against the spec,
#   - finds the spec however the ticket spells the value (quoted, trailing comment), because
#     board.sh selects such tickets for --spec and the worker must get the same spec,
#   - says nothing about a spec when the ticket has none (absent, null, ~),
#   - REFUSES to start a lane when spec: names a file that is missing or a slug that breaks the
#     rule: failing open would run the very drift this exists to prevent.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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
expect_eq() { if [ "$2" = "$3" ]; then ok; else fail "$1" "expected [$2] got [$3]"; fi; }

# The fake worker copies the prompt it was given, keyed by ticket number, and reports FAIL so no
# commit or landing is needed: only the prompt matters here.
BIN="$TMP/bin"
mkdir -p "$BIN"
cat >"$BIN/agent" <<'EOF'
#!/usr/bin/env bash
prompt_file="${!#}"
n="$(grep -oE 'Ticket: #[0-9]+' "$prompt_file" | head -1 | grep -oE '[0-9]+')"
cp "$prompt_file" "$CAPTURE_DIR/prompt-$n.md"
echo "RALPH_RESULT: FAIL #$n"
EOF
chmod +x "$BIN/agent"

new_repo() {
  REPO="$TMP/repo-$1"
  mkdir -p "$REPO/.kanban/issues" "$REPO/.kanban/specs"
  git -C "$REPO" init -q -b main
  git -C "$REPO" config user.name test
  git -C "$REPO" config user.email test@example.com
  git -C "$REPO" commit -q --allow-empty -m init
  CAPTURE_DIR="$TMP/cap-$1"
  mkdir -p "$CAPTURE_DIR"
  export CAPTURE_DIR
}

# ticket ID SPEC-LINE   (SPEC-LINE is the whole frontmatter line, or empty)
ticket() {
  {
    printf -- '---\nid: %s\ntitle: Ticket %s\nstatus: pending\nlabels: [ready-for-agent]\nblocked_by: []\n' "$1" "$1"
    [ -n "${2-}" ] && printf '%s\n' "$2"
    printf -- 'created: 2026-10-15\n---\n\n'
    # the real to-tickets template puts a backtick-quoted path in a '## Spec' section (only for a
    # real spec); it must not be mistaken for the ticket's single ## Verification command
    case "${2-}" in
    'spec: alpha') printf '## Spec\n\n`.kanban/specs/%s.md`: read it before building.\n\n' "${2#spec: }" ;;
    esac
    printf -- '## What to build\n\nBuild it.\n\n## Acceptance criteria\n\n- [ ] done\n\n## Verification\n\n`true`\n'
  } >"$REPO/.kanban/issues/$(printf '%03d' "$1")-t$1.md"
}

# lane_reason N prints why the coordinator recorded lane N as failed (empty if it ran)
lane_reason() {
  jq -r --argjson n "$1" '.children[] | select(.number == $n) | .execution.reason // ""' \
    "$REPO/.gralph/runs/7/manifest.json" 2>/dev/null || true
}

run_worker() {
  git -C "$REPO" add -A
  git -C "$REPO" commit -qm board
  (cd "$REPO" && PATH="$BIN:$PATH" "$GRALPH" 7 --board .kanban --dry-run --verify true >/dev/null 2>&1)
  (cd "$REPO" && PATH="$BIN:$PATH" "$GRALPH" 7 --board .kanban --jobs 1 --verify true \
    --agent-cmd "$BIN/agent" >/dev/null 2>&1) || true
}

# --- 1. spec present: the prompt names the spec file and the reviewer check ---
new_repo has
printf '# Spec\n\n## Out of Scope\n\n- nothing\n' >"$REPO/.kanban/specs/alpha.md"
ticket 1 'spec: alpha'
run_worker
P="$CAPTURE_DIR/prompt-1.md"
[ -f "$P" ] && ok || fail "worker prompt was captured for the spec ticket"
spec_abs="$(cd "$REPO" && pwd)/.kanban/specs/alpha.md"
if grep -qF "$spec_abs" "$P"; then ok; else fail "prompt names the absolute spec path" "$(grep -n -i spec "$P" | head -3)"; fi
if grep -qi 'out of scope' "$P"; then ok; else fail "prompt tells the worker to respect the spec's Out of Scope"; fi
if grep -qiE 'reviewer.*spec|spec.*reviewer' "$P"; then ok; else fail "prompt tells the worker's reviewer to check the diff against the spec"; fi
expect_eq "the spec path appears once" "1" "$(grep -cF "$spec_abs" "$P")"
# the spec sentence comes before the sentinel instructions, so it is read before work starts
spec_line="$(grep -nF "$spec_abs" "$P" | head -1 | cut -d: -f1)"
sentinel_line="$(grep -n 'RALPH_RESULT: DONE' "$P" | head -1 | cut -d: -f1)"
if [ "$spec_line" -lt "$sentinel_line" ]; then ok; else fail "spec sentence precedes the sentinel instructions"; fi

# --- 2. no spec field: no spec talk at all ---
new_repo none
ticket 2 ''
run_worker
P="$CAPTURE_DIR/prompt-2.md"
[ -f "$P" ] && ok || fail "worker prompt was captured for the no-spec ticket"
if grep -qi 'specs/' "$P"; then fail "no spec: nothing about a spec file" "$(grep -n -i 'specs/' "$P" | head -2)"; else ok; fi

# --- 3. spec field but no file on disk: the lane is refused, no worker runs (fail closed) ---
new_repo missing
ticket 3 'spec: ghost'
run_worker
[ ! -f "$CAPTURE_DIR/prompt-3.md" ] && ok || fail "a ticket whose spec file is missing must not reach a worker"
expect_eq "missing spec file: lane fails with spec_missing" "spec_missing" "$(lane_reason 3)"

# --- 4. spec: null / ~ mean no spec ---
new_repo nullspec
ticket 4 'spec: null'
run_worker
P="$CAPTURE_DIR/prompt-4.md"
[ -f "$P" ] && ok || fail "worker prompt was captured for the spec: null ticket"
if grep -qi 'specs/' "$P"; then fail "spec: null means no spec" "$(grep -n -i 'specs/' "$P" | head -2)"; else ok; fi

# --- 5. a spec: value outside the slug rule never becomes a path, and refuses the lane ---
new_repo unsafe
# .kanban/specs/../../../escape.md is $TMP/escape.md: the decoy exists, so only the slug rule
# (not the existence check) can keep it out of the prompt.
printf 'secret\n' >"$TMP/escape.md"
ticket 5 'spec: ../../../escape'
run_worker
[ ! -f "$CAPTURE_DIR/prompt-5.md" ] && ok || fail "an unsafe spec value must not reach a worker"
expect_eq "unsafe spec value: lane fails with spec_invalid" "spec_invalid" "$(lane_reason 5)"

# --- 6. quoted and commented values resolve to the same spec board.sh selected ---
for n in 6 7 8; do :; done
new_repo quoted
printf '# Spec\n' >"$REPO/.kanban/specs/alpha.md"
ticket 6 'spec: "alpha"'
ticket 7 "spec: 'alpha'"
ticket 8 'spec: alpha # the grilled spec'
run_worker
spec_abs="$(cd "$REPO" && pwd)/.kanban/specs/alpha.md"
for n in 6 7 8; do
  if [ -f "$CAPTURE_DIR/prompt-$n.md" ] && grep -qF "$spec_abs" "$CAPTURE_DIR/prompt-$n.md"; then ok; else fail "ticket $n (quoted/commented spec) gets the spec in its prompt"; fi
done

# --- 7. a refused lane leaves nothing behind: fix the spec, rerun, and the lane runs ---
new_repo retry
ticket 9 'spec: later'
run_worker
[ ! -f "$CAPTURE_DIR/prompt-9.md" ] && ok || fail "retry setup: first run refused the lane"
if git -C "$REPO" show-ref --verify --quiet "refs/heads/gralph/7/issue-9"; then fail "a refused lane leaves no lane branch behind"; else ok; fi
if git -C "$REPO" worktree list | grep -q 'issue-9'; then fail "a refused lane leaves no worktree behind"; else ok; fi
printf '# Spec\n' >"$REPO/.kanban/specs/later.md"
git -C "$REPO" add -A && git -C "$REPO" commit -qm "add spec"
(cd "$REPO" && PATH="$BIN:$PATH" "$GRALPH" 7 --board .kanban --replan --dry-run --verify true >/dev/null 2>&1)
(cd "$REPO" && PATH="$BIN:$PATH" "$GRALPH" 7 --board .kanban --jobs 1 --verify true --agent-cmd "$BIN/agent" >/dev/null 2>&1) || true
[ -f "$CAPTURE_DIR/prompt-9.md" ] && ok || fail "after the spec exists the same ticket runs"

echo "gralph-worker-spec: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
