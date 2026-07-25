#!/usr/bin/env bash
# Tests for bin/gralph --jobs N dependency-frontier wave orchestration.
# Exercises positive/default/invalid --jobs parsing, the concurrency bound,
# wave ordering after refreshed blockers, serial batch landing, and partial
# failure retaining successful sibling landings with a nonzero exit summary.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMPDIR="$(mktemp -d)"
trap "cp -r $TMPDIR/wave-order/.gralph /tmp/saved-gralph 2>/dev/null; rm -rf $TMPDIR" EXIT

FAKE_BIN="$TMPDIR/bin"
GH_LOG="$TMPDIR/gh.log"
PI_LOG="$TMPDIR/pi.log"
PROMPT_LOG="$TMPDIR/prompt.log"
RALPH_SKILL="$TMPDIR/ralph/SKILL.md"
API_COUNTER="$TMPDIR/api-counter"
CONCURRENCY_LOG="$TMPDIR/concurrency.log"
CONCURRENCY_COUNT="$TMPDIR/concurrency.count"
CONCURRENCY_LOCK="$TMPDIR/concurrency.lock"
REAL_PATH="$PATH"
export REAL_PATH
mkdir -p "$FAKE_BIN" "$(dirname "$RALPH_SKILL")"
printf '%s\n' 'fixture Ralph instructions' >"$RALPH_SKILL"

# Fake git: real git is on $REAL_PATH; this wrapper records push calls and
# delegates everything else to the real git. The parallel tests rely on a
# working `git push origin <batch>` to satisfy the publish_pr wire-in.
cat >"$FAKE_BIN/git" <<'EOF'
#!/usr/bin/env bash
is_push=0
for a in "$@"; do
  if [ "$a" = "push" ]; then is_push=1; break; fi
done
if [ "$is_push" -eq 1 ]; then
  exec /usr/bin/env -i PATH="$REAL_PATH" git "$@"
fi
exec /usr/bin/env -i PATH="$REAL_PATH" git "$@"
EOF
chmod +x "$FAKE_BIN/git"

# Three-child fixture. Children 101 and 102 are eligible; child 103 is blocked
# by #99 on the initial frontier call. The refresh path flips #99 to CLOSED
# so 103 enters the next wave.
INITIAL_GRAPHQL='{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"OPEN","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":101,"title":"Ready A","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":102,"title":"Ready B","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":103,"title":"Blocked","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":99,"state":"OPEN"}]}}]}}}}}'
REFRESHED_GRAPHQL='{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"OPEN","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":101,"title":"Ready A","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":102,"title":"Ready B","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":103,"title":"Now ready","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":99,"state":"CLOSED"}]}}]}}}}}'

cat >"$FAKE_BIN/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$GH_LOG"
# Refuse any "gh issue close" — the coordinator never closes issues.
if [ "${1-}" = "issue" ] && [ "${2-}" = "close" ]; then
  echo "FAIL: gh issue close was called" >&2
  exit 1
fi
if [ "${1-} ${2-}" = "repo view" ]; then
  for arg in "$@"; do
    if [ "$arg" = "defaultBranchRef" ]; then
      printf '%s\n' main
      exit 0
    fi
    if [ "$arg" = "nameWithOwner" ]; then
      printf '%s\n' owner/repo
      exit 0
    fi
  done
  printf '%s\n' owner/repo
elif [ "${1-} ${2-}" = "api graphql" ]; then
  count=$(($(cat "$API_COUNTER" 2>/dev/null || echo 0) + 1))
  echo "$count" >"$API_COUNTER"
  case "$count" in
    1) printf '%s\n' '{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"OPEN","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":101,"title":"Ready A","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":102,"title":"Ready B","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":103,"title":"Blocked","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":99,"state":"OPEN"}]}}]}}}}}' ;;
    *) printf '%s\n' '{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"OPEN","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":101,"title":"Ready A","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":102,"title":"Ready B","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":103,"title":"Now ready","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":99,"state":"CLOSED"}]}}]}}}}}' ;;
  esac
elif [ "${1-} ${2-}" = "issue view" ]; then
  child="${3-}"
  jq -n --arg verify "${FAKE_CHILD_VERIFY:-test -f worker-output.txt}" --arg n "$child" '{
    number:($n|tonumber),title:("Child " + $n),state:"OPEN",
    body:("## What to build\n\nCreate worker-output.txt.\n\n## Acceptance criteria\n\n- [ ] output exists\n\n## Verification\n\n`" + $verify + "`"),
    labels:[{name:"ready-for-agent"}]
  }'
elif [ "${1-} ${2-}" = "label create" ] || [ "${1-} ${2-}" = "issue edit" ]; then
  :
elif [ "${1-}" = "pr" ] && [ "${2-}" = "list" ]; then
  if [ -s "$GRALPH_FAKE_TMPDIR/pr-state" ]; then cat "$GRALPH_FAKE_TMPDIR/pr-state"; fi
elif [ "${1-}" = "pr" ] && [ "${2-}" = "create" ]; then
  echo "https://github.com/owner/repo/pull/7"
  printf '%s' "7" >"$GRALPH_FAKE_TMPDIR/pr-state"
elif [ "${1-}" = "pr" ] && [ "${2-}" = "edit" ]; then
  :
else
  echo "unexpected gh call: $*" >&2
  exit 90
fi
EOF
chmod +x "$FAKE_BIN/gh"

# Fake pi: tracks concurrent invocations via a flocked counter, then runs the
# scenario per issue. The last argument is the prompt which carries the issue
# number, so each invocation can branch on its target.
cat >"$FAKE_BIN/pi" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt="${!#}"
issue_num="$(printf '%s' "$prompt" | grep -oE 'Issue: #[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
printf '%s\n' "$prompt" >"$PROMPT_LOG.$issue_num"

track_start() {
  local n="$1"
  exec 9>"$CONCURRENCY_LOCK"
  flock 9
  local c
  c=$(($(cat "$CONCURRENCY_COUNT" 2>/dev/null || echo 0) + 1))
  echo "$c" >"$CONCURRENCY_COUNT"
  printf 'start %s count=%d\n' "$n" "$c" >>"$CONCURRENCY_LOG"
  flock -u 9
}
track_end() {
  local n="$1"
  exec 9>"$CONCURRENCY_LOCK"
  flock 9
  local c
  c=$(($(cat "$CONCURRENCY_COUNT" 2>/dev/null || echo 1) - 1))
  echo "$c" >"$CONCURRENCY_COUNT"
  printf 'end %s count=%d\n' "$n" "$c" >>"$CONCURRENCY_LOG"
  flock -u 9
}

# Reviewer (read-only tools).
if printf '%s\n' "$@" | grep -Fx 'read,grep,find,ls' >/dev/null; then
  case "${FAKE_REVIEW_SCENARIO:-approved}" in
    approved) printf '%s\n' '{"status":"approved","criticalCount":0,"blockerCount":0,"findings":[]}' ;;
    *) printf '%s\n' '{"status":"approved","criticalCount":0,"blockerCount":0,"findings":[]}' ;;
  esac
  exit 0
fi

# Worker (guarded tools).
track_start "${issue_num:-unknown}"
trap 'track_end "${issue_num:-unknown}"' EXIT
# Simulate bounded worker duration so concurrency is observable.
sleep "${FAKE_PI_DURATION:-0.05}"

case "${FAKE_PI_SCENARIO:-success}" in
  success)
    printf '%s\n' implemented >worker-output.txt
    printf '%s\n' "RALPH_RESULT: DONE #${issue_num}"
    ;;
  fail-102)
    if [ "${issue_num:-}" = "102" ]; then
      printf '%s\n' 'still working'
    else
      printf '%s\n' implemented >worker-output.txt
      printf '%s\n' "RALPH_RESULT: DONE #${issue_num}"
    fi
    ;;
  *)
    echo "unknown FAKE_PI_SCENARIO: ${FAKE_PI_SCENARIO}" >&2
    exit 91
    ;;
esac
EOF
chmod +x "$FAKE_BIN/pi"

new_repo() {
  local dir="$1"
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" config user.name test
  git -C "$dir" config user.email test@example.com
  cat >"$dir/verify-integration.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
test -f worker-output.txt
EOF
  chmod +x "$dir/verify-integration.sh"
  git -C "$dir" add verify-integration.sh
  git -C "$dir" commit -qm init
  # Per-test local bare remote so publish_pr's `git push origin ...` succeeds.
  local remote_dir="$TMPDIR/remote-$(basename "$dir")"
  rm -rf "$remote_dir"
  git init -q --bare "$remote_dir/repo.git"
  git -C "$dir" remote add origin "$remote_dir/repo.git"
}

run_gralph() {
  local repo="$1"
  shift
  (cd "$repo" && PATH="$FAKE_BIN:$PATH" \
    GH_LOG="$GH_LOG" PI_LOG="$PI_LOG" PROMPT_LOG="$PROMPT_LOG" \
    API_COUNTER="$API_COUNTER" \
    CONCURRENCY_LOG="$CONCURRENCY_LOG" CONCURRENCY_COUNT="$CONCURRENCY_COUNT" CONCURRENCY_LOCK="$CONCURRENCY_LOCK" \
    GRALPH_RALPH_SKILL="$RALPH_SKILL" GRALPH_MAX_ITERATIONS="${GRALPH_MAX_ITERATIONS:-1}" \
    GRALPH_REVIEW_TIMEOUT="${GRALPH_REVIEW_TIMEOUT:-2}" \
    GRALPH_FAKE_TMPDIR="$TMPDIR" \
    FAKE_PI_SCENARIO="${FAKE_PI_SCENARIO:-success}" \
    FAKE_PI_DURATION="${FAKE_PI_DURATION:-0.05}" \
    FAKE_CHILD_VERIFY="${FAKE_CHILD_VERIFY:-test -f worker-output.txt}" \
    "$GRALPH" "$@")
}

plan_repo() {
  : >"$GH_LOG"
  : >"$API_COUNTER"
  : >"$CONCURRENCY_LOG"
  : >"$CONCURRENCY_COUNT"
  run_gralph "$1" 42 --dry-run --verify 'bash verify-integration.sh' >/dev/null
}

# --jobs flag validation: positive integer accepted, defaults to 2; bad input
# rejected with a non-zero exit code.
REPO="$TMPDIR/jobs-default"
new_repo "$REPO"
plan_repo "$REPO"
: >"$CONCURRENCY_LOG" : >"$CONCURRENCY_COUNT"
run_gralph "$REPO" 42 --verify 'bash verify-integration.sh' >/dev/null
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
jq -e '.orchestration.jobs == 2' "$MANIFEST" >/dev/null

REPO="$TMPDIR/jobs-explicit"
new_repo "$REPO"
plan_repo "$REPO"
: >"$CONCURRENCY_LOG" : >"$CONCURRENCY_COUNT"
run_gralph "$REPO" 42 --jobs 1 --verify 'bash verify-integration.sh' >/dev/null
jq -e '.orchestration.jobs == 1' "$REPO/.gralph/runs/42/manifest.json" >/dev/null

REPO="$TMPDIR/jobs-three"
new_repo "$REPO"
plan_repo "$REPO"
: >"$CONCURRENCY_LOG" : >"$CONCURRENCY_COUNT"
run_gralph "$REPO" 42 --jobs 3 --verify 'bash verify-integration.sh' >/dev/null
jq -e '.orchestration.jobs == 3' "$REPO/.gralph/runs/42/manifest.json" >/dev/null

for bad in 0 abc 1.5; do
  REPO="$TMPDIR/jobs-bad-$bad"
  new_repo "$REPO"
  plan_repo "$REPO"
  if run_gralph "$REPO" 42 --jobs "$bad" --verify 'bash verify-integration.sh' >"$TMPDIR/jobs-bad-$bad.out" 2>"$TMPDIR/jobs-bad-$bad.err"; then
    echo "FAIL: --jobs $bad unexpectedly succeeded" >&2
    exit 1
  fi
  grep -q 'must be a positive integer' "$TMPDIR/jobs-bad-$bad.err"
done

# Concurrency bound: with three eligible children and --jobs 2 the
# orchestrator launches at most two concurrent worker pipelines.
REPO="$TMPDIR/concurrency-bound"
new_repo "$REPO"
plan_repo "$REPO"
: >"$CONCURRENCY_LOG" : >"$CONCURRENCY_COUNT"
run_gralph "$REPO" 42 --jobs 2 --verify 'bash verify-integration.sh' >/dev/null
max_concurrent="$(awk '/start/ { for (i=1; i<=NF; i++) if ($i ~ /^count=/) { split($i, a, "="); if (a[2]+0 > m) m = a[2]+0 } } END { print m+0 }' "$CONCURRENCY_LOG")"
[ "$max_concurrent" -le 2 ] || { echo "FAIL: max concurrent = $max_concurrent (>2)" >&2; cat "$CONCURRENCY_LOG" >&2; exit 1; }
# Verify all three children landed across waves.
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
jq -e '
  (.orchestration.landed | length) == 3
  and ([.orchestration.landed[]] | sort == [101, 102, 103])
  and (.orchestration.waves >= 2)
  and (.children[] | select(.number == 101) | .merge.status) == "landed"
  and (.children[] | select(.number == 102) | .merge.status) == "landed"
  and (.children[] | select(.number == 103) | .merge.status) == "landed"
' "$MANIFEST" >/dev/null

# Serial batch merges: every accepted child has a unique batch worktree whose
# existence is recorded as the previous merge completes.
REPO="$TMPDIR/serial-merge"
new_repo "$REPO"
plan_repo "$REPO"
: >"$CONCURRENCY_LOG" : >"$CONCURRENCY_COUNT"
run_gralph "$REPO" 42 --jobs 2 --verify 'bash verify-integration.sh' >/dev/null
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
merged_shas="$(jq -r '[.children[] | select(.merge.status == "landed") | .merge.mergedSha] | sort | unique | join(" ")' "$MANIFEST")"
[ "$(echo "$merged_shas" | wc -w)" -eq 3 ] || { echo "FAIL: expected 3 unique merged SHAs, got: $merged_shas" >&2; exit 1; }
# The batch branch is gralph/42/batch and ancestors include the recorded baseSha.
git -C "$REPO" show-ref --verify --quiet refs/heads/gralph/42/batch
git -C "$REPO" merge-base --is-ancestor "$(jq -r .baseSha "$MANIFEST")" gralph/42/batch

# Wave ordering after refreshed blockers: child 103 is blocked by #99 OPEN on
# the initial frontier, then #99 closes on the refresh and 103 enters wave 2.
REPO="$TMPDIR/wave-order"
new_repo "$REPO"
plan_repo "$REPO"
: >"$CONCURRENCY_LOG" : >"$CONCURRENCY_COUNT"
run_gralph "$REPO" 42 --jobs 2 --verify 'bash verify-integration.sh' >/dev/null
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
jq -e '
  (.orchestration.waves >= 2)
  and ([.orchestration.waveLog[] | .children[]] | flatten | sort == [101, 102, 103])
  and (.children[] | select(.number == 103) | .merge.status) == "landed"
' "$MANIFEST" >/dev/null
# 101 and 102 must run in wave 1; the freshly-unblocked 103 enters wave 2.
wave1_children="$(jq -r '(.orchestration.waveLog[0].children // []) | sort | join(",")' "$MANIFEST")"
[ "$wave1_children" = "101,102" ] || {
  echo "FAIL: wave 1 children = $wave1_children (expected 101,102)" >&2
  exit 1
}
# 103 must appear in a wave after wave 1.
later_waves_with_103="$(jq '[.orchestration.waveLog[1:][] | (.children // []) | index(103) != null] | any' "$MANIFEST")"
[ "$later_waves_with_103" = "true" ] || {
  echo "FAIL: child 103 not present in any wave after wave 1" >&2
  exit 1
}

# Partial failure: one wave child fails at the worker step while another
# succeeds, and the survivor lands. The orchestrator continues to the next
# wave and exits non-zero with a manifest summary recording the failure.
REPO="$TMPDIR/partial-failure"
new_repo "$REPO"
plan_repo "$REPO"
: >"$CONCURRENCY_LOG" : >"$CONCURRENCY_COUNT"
if FAKE_PI_SCENARIO=fail-102 run_gralph "$REPO" 42 --jobs 2 --verify 'bash verify-integration.sh' >"$TMPDIR/partial.out" 2>"$TMPDIR/partial.err"; then
  echo "FAIL: partial failure run unexpectedly exited zero" >&2
  exit 1
fi
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
jq -e '
  (.children[] | select(.number == 101) | .merge.status) == "landed"
  and (.children[] | select(.number == 102) | .execution.status) == "failed"
  and (.children[] | select(.number == 103) | .merge.status) == "landed"
  and ((.orchestration.failed // []) | index(102) != null)
  and ((.orchestration.landed // []) | sort == [101, 103])
  and (.orchestration.remainingOpenReady >= 1)
' "$MANIFEST" >/dev/null
grep -q 'remain unlanded' "$TMPDIR/partial.err"
# Failed worker's branch and worktree are preserved on disk for inspection.
[ -n "$(git -C "$REPO" branch --list 'gralph/42/issue-102')" ]
[ -d "$(jq -r '.children[] | select(.number == 102) | .execution.worktree' "$MANIFEST")" ]

printf '%s\n' 'gralph parallel tests passed'