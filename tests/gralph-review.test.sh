#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

FAKE_BIN="$TMPDIR/bin"
GH_LOG="$TMPDIR/gh.log"
PI_LOG="$TMPDIR/pi.log"
REVIEW_PROMPT="$TMPDIR/review-prompt.md"
RALPH_SKILL="$TMPDIR/ralph/SKILL.md"
mkdir -p "$FAKE_BIN" "$(dirname "$RALPH_SKILL")"
printf '%s\n' 'fixture Ralph instructions' >"$RALPH_SKILL"

cat >"$FAKE_BIN/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$GH_LOG"
if [ "${1-} ${2-}" = "repo view" ]; then
  printf '%s\n' owner/repo
elif [ "${1-} ${2-}" = "api graphql" ]; then
  cat <<'JSON'
{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"OPEN","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":101,"title":"Implement fixture","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}}]}}}}}
JSON
elif [ "${1-} ${2-}" = "issue view" ]; then
  jq -n '{
    number:101,title:"Implement fixture",state:"OPEN",
    body:"## What to build\n\nCreate worker-output.txt.\n\n## Acceptance criteria\n\n- [ ] output exists\n\n## Verification\n\n`bash child-verify.sh`",
    labels:[{name:"ready-for-agent"}]
  }'
elif [ "${1-} ${2-}" = "label create" ] || [ "${1-} ${2-}" = "issue edit" ]; then
  :
else
  echo "unexpected gh call: $*" >&2
  exit 90
fi
EOF
chmod +x "$FAKE_BIN/gh"

cat >"$FAKE_BIN/pi" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' CALL "$@" END >>"$PI_LOG"
if printf '%s\n' "$@" | grep -Fx 'read,grep,find,ls' >/dev/null; then
  printf '%s' "${!#}" >"$REVIEW_PROMPT"
  case "${FAKE_REVIEW_SCENARIO:-approved}" in
    approved) printf '%s\n' '{"status":"approved","criticalCount":0,"blockerCount":0,"findings":[]}' ;;
    changes) printf '%s\n' '{"status":"changes_requested","criticalCount":0,"blockerCount":0,"findings":[{"severity":"warning","message":"fix requested"}]}' ;;
    critical) printf '%s\n' '{"status":"approved","criticalCount":1,"blockerCount":0,"findings":[{"severity":"critical","message":"critical defect"}]}' ;;
    blocker) printf '%s\n' '{"status":"approved","criticalCount":0,"blockerCount":1,"findings":[{"severity":"blocker","message":"blocked"}]}' ;;
    malformed) printf '%s\n' 'not json' ;;
    contradictory) printf '%s\n' '{"status":"approved","criticalCount":0,"blockerCount":0,"findings":[{"severity":"critical","message":"hidden critical"}]}' ;;
    process-failure) exit 73 ;;
    timeout) sleep 5 ;;
    *) exit 91 ;;
  esac
  exit 0
fi
printf '%s\n' implemented >worker-output.txt
printf '%s\n' 'RALPH_RESULT: DONE #101'
EOF
chmod +x "$FAKE_BIN/pi"

new_repo() {
  local dir="$1"
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" config user.name test
  git -C "$dir" config user.email test@example.com
  cat >"$dir/child-verify.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
test -f worker-output.txt
printf '%s\n' verification-ok
EOF
  chmod +x "$dir/child-verify.sh"
  cat >"$dir/integration.sh" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
  chmod +x "$dir/integration.sh"
  git -C "$dir" add child-verify.sh integration.sh
  git -C "$dir" commit -qm init
}

run_gralph() {
  local repo="$1"
  shift
  (cd "$repo" && PATH="$FAKE_BIN:$PATH" GH_LOG="$GH_LOG" PI_LOG="$PI_LOG" REVIEW_PROMPT="$REVIEW_PROMPT" \
    GRALPH_RALPH_SKILL="$RALPH_SKILL" GRALPH_MAX_ITERATIONS=1 \
    GRALPH_REVIEW_TIMEOUT="${GRALPH_REVIEW_TIMEOUT:-10}" \
    FAKE_REVIEW_SCENARIO="${FAKE_REVIEW_SCENARIO:-approved}" \
    "$GRALPH" "$@")
}

plan_repo() {
  : >"$GH_LOG"
  run_gralph "$1" 42 --dry-run --verify 'bash integration.sh' >/dev/null
}

# Approved review: separate, read-only Pi process receives all required evidence.
REPO="$TMPDIR/approved"
new_repo "$REPO"
BASE_SHA="$(git -C "$REPO" rev-parse HEAD)"
plan_repo "$REPO"
: >"$PI_LOG"
FAKE_REVIEW_SCENARIO=approved run_gralph "$REPO" 42 --verify 'bash integration.sh' >/dev/null
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
jq -e '
  .execution.status == "reviewed"
  and .children[0].execution.status == "complete"
  and .children[0].review.status == "approved"
  and .children[0].review.criticalCount == 0
  and .children[0].review.blockerCount == 0
  and .children[0].review.findings == []
  and .children[0].review.gate == "accepted"
  and .children[0].review.processExitCode == 0
  and .children[0].review.timedOut == false
' "$MANIFEST" >/dev/null
[ "$(grep -c '^CALL$' "$PI_LOG")" -eq 2 ]
[ "$(grep -c '^--tools$' "$PI_LOG")" -eq 2 ]
[ "$(grep -c '^read,grep,find,ls$' "$PI_LOG")" -eq 1 ]
[ "$(grep -c '^read,write,edit,grep,find,ls,gralph_check$' "$PI_LOG")" -eq 1 ]
for flag in -p --no-session --no-extensions --no-skills --no-context-files --no-prompt-templates --no-themes; do
  [ "$(grep -Fxc -- "$flag" "$PI_LOG")" -ge 1 ] || { echo "FAIL: reviewer missing $flag" >&2; exit 1; }
done
grep -F 'Create worker-output.txt.' "$REVIEW_PROMPT" >/dev/null
grep -F -- '- [ ] output exists' "$REVIEW_PROMPT" >/dev/null
grep -F "Base SHA: $BASE_SHA" "$REVIEW_PROMPT" >/dev/null
grep -F '+implemented' "$REVIEW_PROMPT" >/dev/null
grep -F 'verification-ok' "$REVIEW_PROMPT" >/dev/null
jq -e '.status == "approved"' "$(jq -r '.children[0].review.artifact' "$MANIFEST")" >/dev/null

expect_rejected() {
  local scenario="$1"
  local repo="$TMPDIR/$scenario"
  new_repo "$repo"
  plan_repo "$repo"
  : >"$PI_LOG"
  if FAKE_REVIEW_SCENARIO="$scenario" GRALPH_REVIEW_TIMEOUT=1 \
    run_gralph "$repo" 42 --verify 'bash integration.sh' >"$TMPDIR/$scenario.out" 2>"$TMPDIR/$scenario.err"; then
    echo "FAIL: $scenario review unexpectedly passed" >&2
    exit 1
  fi
  local manifest="$repo/.gralph/runs/42/manifest.json"
  jq -e '.execution.status == "failed" and .children[0].review.gate == "rejected"' "$manifest" >/dev/null
  [ -n "$(git -C "$repo" branch --list 'gralph/42/issue-101')" ]
  [ -d "$(jq -r '.children[0].execution.worktree' "$manifest")" ]
  [ -f "$(jq -r '.children[0].review.artifact' "$manifest")" ]
  [ "$(grep -c '^read,grep,find,ls$' "$PI_LOG")" -eq 1 ]
}

# Every non-approved, unsafe, malformed, failed, or timed-out result fails closed.
for scenario in changes critical blocker malformed contradictory process-failure timeout; do
  expect_rejected "$scenario"
done
jq -e '.children[0].review.timedOut == true' "$TMPDIR/timeout/.gralph/runs/42/manifest.json" >/dev/null

printf '%s\n' 'gralph review tests passed'
