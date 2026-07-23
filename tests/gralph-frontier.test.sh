#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

FAKE_BIN="$TMPDIR/bin"
GH_LOG="$TMPDIR/gh.log"
mkdir -p "$FAKE_BIN"

cat >"$FAKE_BIN/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%q ' "$@" >>"$GH_LOG"
printf '\n' >>"$GH_LOG"

if [ "${1-} ${2-}" = "repo view" ]; then
  printf '%s\n' 'owner/repo'
  exit 0
fi

[ "${1-} ${2-}" = "api graphql" ] || { echo "unexpected gh call" >&2; exit 90; }
case "${FAKE_GH_SCENARIO:-frontier}" in
  frontier)
    cat <<'JSON'
{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"OPEN","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":105,"title":"Closed blocker","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"},{"name":"backend"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":202,"state":"CLOSED"}]}},{"number":103,"title":"Not ready","state":"OPEN","labels":{"nodes":[{"name":"backend"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":101,"title":"Ready","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":104,"title":"Already closed","state":"CLOSED","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":102,"title":"Blocked","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":201,"state":"OPEN"}]}}]}}}}}
JSON
    ;;
  closed)
    printf '%s\n' '{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"CLOSED","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[]}}}}}'
    ;;
  missing)
    printf '%s\n' '{"data":{"repository":{"issue":null}}}'
    ;;
  inaccessible)
    echo 'GraphQL: Resource not accessible' >&2
    exit 1
    ;;
  malformed)
    printf '%s\n' '{not-json'
    ;;
  *)
    echo "unknown fixture: $FAKE_GH_SCENARIO" >&2
    exit 91
    ;;
esac
EOF
chmod +x "$FAKE_BIN/gh"

cat >"$FAKE_BIN/pi" <<'EOF'
#!/usr/bin/env bash
echo 'pi must not run during a dry run' >&2
exit 99
EOF
chmod +x "$FAKE_BIN/pi"

new_repo() {
  local dir="$1"
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" config user.name test
  git -C "$dir" config user.email test@example.com
  printf 'fixture\n' >"$dir/README"
  git -C "$dir" add README
  git -C "$dir" commit -qm init
}

run_gralph() {
  local repo="$1" scenario="$2"
  shift 2
  (cd "$repo" && PATH="$FAKE_BIN:$PATH" GH_LOG="$GH_LOG" FAKE_GH_SCENARIO="$scenario" "$GRALPH" "$@")
}

expect_failure() {
  local name="$1" repo="$2" scenario="$3"
  shift 3
  if run_gralph "$repo" "$scenario" "$@" >"$TMPDIR/out" 2>"$TMPDIR/err"; then
    echo "FAIL: $name unexpectedly succeeded" >&2
    exit 1
  fi
  if [ -e "$repo/.gralph" ]; then
    echo "FAIL: $name wrote run state" >&2
    exit 1
  fi
}

REPO="$TMPDIR/repo"
new_repo "$REPO"
: >"$GH_LOG"
run_gralph "$REPO" frontier 42 --dry-run --verify 'bash tests/integration.sh'
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
[ -f "$MANIFEST" ] || { echo 'FAIL: manifest missing' >&2; exit 1; }
BASE_SHA="$(git -C "$REPO" rev-parse HEAD)"
jq -e --arg sha "$BASE_SHA" '
  . == {
    schemaVersion: 1,
    parent: 42,
    baseSha: $sha,
    dryRun: true,
    integrationCommand: "bash tests/integration.sh",
    children: [
      {number: 101, title: "Ready", state: "OPEN", labels: ["ready-for-agent"], blockedBy: [], classification: "eligible", reason: null},
      {number: 102, title: "Blocked", state: "OPEN", labels: ["ready-for-agent"], blockedBy: [201], classification: "blocked", reason: "open_blockers"},
      {number: 103, title: "Not ready", state: "OPEN", labels: ["backend"], blockedBy: [], classification: "excluded", reason: "missing_ready_for_agent_label"},
      {number: 104, title: "Already closed", state: "CLOSED", labels: ["ready-for-agent"], blockedBy: [], classification: "excluded", reason: "child_not_open"},
      {number: 105, title: "Closed blocker", state: "OPEN", labels: ["backend", "ready-for-agent"], blockedBy: [202], classification: "eligible", reason: null}
    ],
    dependencies: [
      {issue: 102, blockedBy: 201},
      {issue: 105, blockedBy: 202}
    ]
  }
' "$MANIFEST" >/dev/null

cp "$MANIFEST" "$TMPDIR/first-manifest.json"
run_gralph "$REPO" frontier 42 --dry-run --verify 'bash tests/integration.sh'
cmp "$TMPDIR/first-manifest.json" "$MANIFEST"

if grep -Eq '^(issue (edit|close|reopen)|label |pr |worktree |push )' "$GH_LOG"; then
  echo 'FAIL: dry run made a mutating gh call' >&2
  cat "$GH_LOG" >&2
  exit 1
fi
[ "$(git -C "$REPO" branch --show-current)" = master ]
[ "$(git -C "$REPO" worktree list --porcelain | grep -c '^worktree ')" -eq 1 ]

NO_VERIFY_REPO="$TMPDIR/no-verify"
new_repo "$NO_VERIFY_REPO"
run_gralph "$NO_VERIFY_REPO" frontier 42 --dry-run
jq -e 'has("integrationCommand") | not' "$NO_VERIFY_REPO/.gralph/runs/42/manifest.json" >/dev/null

for case in missing-parent non-numeric closed inaccessible malformed; do
  repo="$TMPDIR/$case"
  new_repo "$repo"
  case "$case" in
    missing-parent) expect_failure "$case" "$repo" frontier --dry-run ;;
    non-numeric) expect_failure "$case" "$repo" frontier nope --dry-run ;;
    closed) expect_failure "$case" "$repo" closed 42 --dry-run ;;
    inaccessible) expect_failure "$case" "$repo" inaccessible 42 --dry-run ;;
    malformed) expect_failure "$case" "$repo" malformed 42 --dry-run ;;
  esac
done

repo="$TMPDIR/missing"
new_repo "$repo"
expect_failure missing "$repo" missing 42 --dry-run

repo="$TMPDIR/mutating"
new_repo "$repo"
expect_failure verify-required "$repo" frontier 42

printf '%s\n' 'gralph frontier tests passed'
